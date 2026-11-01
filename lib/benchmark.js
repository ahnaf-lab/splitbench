'use strict';

// Runs a tokenizer over a fixed corpus and collects the numbers needed to
// compare tokenizers side by side: how many tokens it produces, how often
// it splits a whole word into multiple tokens, whether it round-trips the
// text exactly, and how fast encode/decode run.

const DEFAULT_ITERATIONS = 5;

function splitWords(text) {
  return text.match(/\S+/g) || [];
}

// Runs fn() `iterations` times back to back and times the whole batch with
// a monotonic clock, so a single slow/fast outlier run doesn't dominate.
function timeRuns(fn, iterations) {
  const start = process.hrtime.bigint();
  let result;
  for (let i = 0; i < iterations; i++) {
    result = fn();
  }
  const totalMs = Number(process.hrtime.bigint() - start) / 1e6;
  return { result, totalMs, meanMs: totalMs / iterations };
}

function rate(count, meanMs) {
  return meanMs > 0 ? count / (meanMs / 1000) : null;
}

// Fragmentation is measured by re-encoding each whitespace-delimited word on
// its own: a word that comes back as more than one token counts as
// "fragmented". This stays meaningful across tokenizers that treat
// whitespace differently (whitespace, char, naive-bpe, toy-unigram all
// disagree on how tokens map onto characters).
function measureFragmentation(tokenizer, words) {
  let fragmentedWords = 0;
  let totalTokens = 0;
  for (const word of words) {
    const tokenCount = tokenizer.encode(word).length;
    totalTokens += tokenCount;
    if (tokenCount > 1) fragmentedWords += 1;
  }
  const wordCount = words.length;
  return {
    wordCount,
    avgTokensPerWord: wordCount > 0 ? totalTokens / wordCount : 0,
    fragmentedWordRatio: wordCount > 0 ? fragmentedWords / wordCount : 0,
  };
}

function benchmarkTokenizer(tokenizer, corpus, options = {}) {
  if (typeof corpus !== 'string' || corpus.length === 0) {
    throw new Error('benchmarkTokenizer requires a non-empty corpus string');
  }
  const iterations = options.iterations || DEFAULT_ITERATIONS;

  // Train once, up front, so training cost never leaks into the encode
  // timing below.
  tokenizer.train(corpus);

  const encodeRun = timeRuns(() => tokenizer.encode(corpus), iterations);
  const tokens = encodeRun.result;

  const decodeRun = timeRuns(() => tokenizer.decode(tokens), iterations);

  const fragmentation = measureFragmentation(tokenizer, splitWords(corpus));

  return {
    name: tokenizer.name,
    tokenCount: tokens.length,
    correctRoundTrip: decodeRun.result === corpus,
    fragmentation,
    encode: {
      iterations,
      totalMs: encodeRun.totalMs,
      meanMs: encodeRun.meanMs,
      charsPerSecond: rate(corpus.length, encodeRun.meanMs),
    },
    decode: {
      iterations,
      totalMs: decodeRun.totalMs,
      meanMs: decodeRun.meanMs,
      tokensPerSecond: rate(tokens.length, decodeRun.meanMs),
    },
  };
}

// Benchmarks a list of tokenizers over the same corpus, in the order given,
// so results can be lined up side by side.
function runBenchmark(tokenizers, corpus, options = {}) {
  return tokenizers.map((tokenizer) => benchmarkTokenizer(tokenizer, corpus, options));
}

module.exports = { benchmarkTokenizer, runBenchmark };
