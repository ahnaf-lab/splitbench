'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  tokenSpans,
  renderStripeRow,
  renderComparison,
  createWhitespaceTokenizer,
  createCharTokenizer,
  createNaiveBpeTokenizer,
  createDefaultTokenizers,
} = require('../lib');

const SAMPLE = 'the quick brown fox jumps over the lazy dog';

test('tokenSpans reconstructs the original text exactly for whitespace', () => {
  const spans = tokenSpans(createWhitespaceTokenizer(), SAMPLE);
  assert.equal(spans.map((span) => span.text).join(''), SAMPLE);
  assert.equal(spans.length, createWhitespaceTokenizer().encode(SAMPLE).length);
});

test('tokenSpans reconstructs the original text exactly for char', () => {
  const spans = tokenSpans(createCharTokenizer(), SAMPLE);
  assert.equal(spans.map((span) => span.text).join(''), SAMPLE);
  for (const span of spans) {
    assert.ok(span.text.length > 0);
  }
});

test('tokenSpans reconstructs the original text exactly for naive-bpe', () => {
  const tokenizer = createNaiveBpeTokenizer({ numMerges: 30 });
  const spans = tokenSpans(tokenizer, SAMPLE);
  // Some spans may be empty (a word-boundary-only token contributes no
  // visible text), but concatenated in order they must reproduce SAMPLE.
  assert.equal(spans.map((span) => span.text).join(''), SAMPLE);
});

test('renderStripeRow produces one bracketed cell per token and a matching bar', () => {
  const tokenizer = createWhitespaceTokenizer();
  const row = renderStripeRow(tokenizer, SAMPLE);

  assert.equal(row.name, 'whitespace');
  assert.equal(row.tokenCount, tokenizer.encode(SAMPLE).length);
  assert.equal((row.cells.match(/\[/g) || []).length, row.tokenCount);
  assert.equal(row.bar.length, row.cells.length);
});

test('renderStripeRow escapes newlines so cells stay on one line', () => {
  const tokenizer = createWhitespaceTokenizer();
  const row = renderStripeRow(tokenizer, 'line one\nline two');
  assert.ok(!row.cells.includes('\n'));
  assert.ok(row.cells.includes('\\n'));
});

test('renderComparison lines up every default tokenizer by name', () => {
  const output = renderComparison(createDefaultTokenizers(), SAMPLE);
  for (const name of ['whitespace', 'char', 'naive-bpe', 'toy-unigram']) {
    assert.ok(output.includes(name), `expected output to mention ${name}`);
  }
});

test('renderComparison rejects an empty sample sentence', () => {
  assert.throws(
    () => renderComparison(createDefaultTokenizers(), ''),
    /non-empty sample sentence/,
  );
});

test('renderComparison rejects an empty tokenizer list', () => {
  assert.throws(
    () => renderComparison([], SAMPLE),
    /at least one tokenizer/,
  );
});
