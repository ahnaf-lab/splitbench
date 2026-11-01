'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  benchmarkTokenizer,
  runBenchmark,
  createDefaultTokenizers,
  createWhitespaceTokenizer,
  createCharTokenizer,
  DEFAULT_CORPUS,
} = require('../lib');

const SAMPLE = 'the quick brown fox jumps over the lazy dog. the dog barks.';

test('benchmarkTokenizer reports token count, round-trip, and timings', () => {
  const result = benchmarkTokenizer(createWhitespaceTokenizer(), SAMPLE, { iterations: 3 });

  assert.equal(result.name, 'whitespace');
  assert.ok(result.tokenCount > 0);
  assert.equal(result.correctRoundTrip, true);

  assert.equal(result.encode.iterations, 3);
  assert.ok(result.encode.totalMs >= 0);
  assert.ok(result.encode.meanMs >= 0);

  assert.ok(result.decode.totalMs >= 0);
  assert.ok(result.decode.meanMs >= 0);
});

test('benchmarkTokenizer rejects an empty corpus', () => {
  assert.throws(() => benchmarkTokenizer(createWhitespaceTokenizer(), ''), /non-empty corpus/);
});

test('whitespace tokenizer never fragments a single word', () => {
  const result = benchmarkTokenizer(createWhitespaceTokenizer(), SAMPLE, { iterations: 1 });
  assert.equal(result.fragmentation.fragmentedWordRatio, 0);
  assert.equal(result.fragmentation.avgTokensPerWord, 1);
});

test('char tokenizer fragments every multi-character word', () => {
  const result = benchmarkTokenizer(createCharTokenizer(), SAMPLE, { iterations: 1 });
  // Every word in SAMPLE longer than one character comes back as multiple
  // tokens, since the char tokenizer emits one token per codepoint.
  assert.ok(result.fragmentation.fragmentedWordRatio > 0.9);
  assert.ok(result.fragmentation.avgTokensPerWord > 1);
});

test('runBenchmark compares every default tokenizer over the same corpus', () => {
  const tokenizers = createDefaultTokenizers();
  const results = runBenchmark(tokenizers, SAMPLE, { iterations: 2 });

  assert.equal(results.length, tokenizers.length);
  assert.deepEqual(
    results.map((r) => r.name),
    ['whitespace', 'char', 'naive-bpe', 'toy-unigram'],
  );

  for (const result of results) {
    assert.equal(result.correctRoundTrip, true);
    assert.equal(result.fragmentation.wordCount, 12);
  }
});

test('runBenchmark works over the packaged default corpus', () => {
  const results = runBenchmark(createDefaultTokenizers(), DEFAULT_CORPUS, { iterations: 1 });
  for (const result of results) {
    assert.ok(result.tokenCount > 0);
    assert.equal(result.correctRoundTrip, true);
  }
});
