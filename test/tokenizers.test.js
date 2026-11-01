'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createWhitespaceTokenizer,
  createCharTokenizer,
  createNaiveBpeTokenizer,
  createToyUnigramTokenizer,
} = require('../lib');

const SAMPLE = 'the quick brown fox jumps over the lazy dog. the dog barks.';
const BPE_CORPUS = 'low lower lowest newer newest wider widest low low lower';

test('whitespace tokenizer splits words and preserves gaps exactly', () => {
  const tokenizer = createWhitespaceTokenizer();
  const tokens = tokenizer.encode('hello   world\nfoo');
  assert.deepEqual(tokens, ['hello', '   ', 'world', '\n', 'foo']);
  assert.equal(tokenizer.decode(tokens), 'hello   world\nfoo');
});

test('whitespace tokenizer round-trips arbitrary text', () => {
  const tokenizer = createWhitespaceTokenizer();
  const tokens = tokenizer.encode(SAMPLE);
  assert.equal(tokenizer.decode(tokens), SAMPLE);
  assert.ok(tokens.length > 0);
});

test('char tokenizer produces one token per codepoint and round-trips', () => {
  const tokenizer = createCharTokenizer();
  const text = 'ab c';
  const tokens = tokenizer.encode(text);
  assert.deepEqual(tokens, ['a', 'b', ' ', 'c']);
  assert.equal(tokenizer.decode(tokens), text);
});

test('char tokenizer keeps surrogate-pair characters intact', () => {
  const tokenizer = createCharTokenizer();
  const text = 'a\u{1F600}b'; // emoji is a single codepoint across two UTF-16 units
  const tokens = tokenizer.encode(text);
  assert.equal(tokens.length, 3);
  assert.equal(tokenizer.decode(tokens), text);
});

test('naive BPE tokenizer learns merges and round-trips text', () => {
  const tokenizer = createNaiveBpeTokenizer({ numMerges: 20 });
  tokenizer.train(BPE_CORPUS);
  assert.ok(tokenizer.merges.length > 0);

  const tokens = tokenizer.encode(BPE_CORPUS);
  assert.equal(tokenizer.decode(tokens), BPE_CORPUS);

  // Repeated substrings ("low", "newe", "wide") should merge into tokens
  // longer than a single character once trained on a repetitive corpus.
  assert.ok(tokens.some((token) => token.length > 1));
});

test('naive BPE tokenizer self-trains when encode is called without train', () => {
  const tokenizer = createNaiveBpeTokenizer({ numMerges: 10 });
  const tokens = tokenizer.encode(SAMPLE);
  assert.equal(tokenizer.decode(tokens), SAMPLE);
  assert.ok(tokenizer.trained);
});

test('naive BPE merges are deterministic across runs', () => {
  const a = createNaiveBpeTokenizer({ numMerges: 15 });
  const b = createNaiveBpeTokenizer({ numMerges: 15 });
  a.train(BPE_CORPUS);
  b.train(BPE_CORPUS);
  assert.deepEqual(a.merges, b.merges);
});

test('toy unigram tokenizer round-trips text and produces merged tokens', () => {
  const tokenizer = createToyUnigramTokenizer({ maxTokenLength: 4, vocabSize: 100 });
  tokenizer.train(BPE_CORPUS);

  const tokens = tokenizer.encode(BPE_CORPUS);
  assert.equal(tokenizer.decode(tokens), BPE_CORPUS);
  assert.ok(tokens.length < BPE_CORPUS.length);
  assert.ok(tokens.some((token) => token.length > 1));
});

test('toy unigram tokenizer handles characters unseen during training', () => {
  const tokenizer = createToyUnigramTokenizer({ maxTokenLength: 4, vocabSize: 50 });
  tokenizer.train('aaa bbb ccc');

  const tokens = tokenizer.encode('aaa zzz');
  assert.equal(tokenizer.decode(tokens), 'aaa zzz');
});

test('toy unigram tokenizer self-trains when encode is called without train', () => {
  const tokenizer = createToyUnigramTokenizer();
  const tokens = tokenizer.encode(SAMPLE);
  assert.equal(tokenizer.decode(tokens), SAMPLE);
  assert.ok(tokenizer.trained);
});
