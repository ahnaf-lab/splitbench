'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderSummaryTable,
  runBenchmark,
  createDefaultTokenizers,
  createWhitespaceTokenizer,
  createCharTokenizer,
} = require('../lib');

const SAMPLE = 'the quick brown fox jumps over the lazy dog. the dog barks.';

test('renderSummaryTable rejects an empty result list', () => {
  assert.throws(() => renderSummaryTable([]), /at least one benchmark result/);
});

test('renderSummaryTable rejects a non-array', () => {
  assert.throws(() => renderSummaryTable(null), /at least one benchmark result/);
});

test('renderSummaryTable lists every tokenizer with a header row', () => {
  const results = runBenchmark(createDefaultTokenizers(), SAMPLE, { iterations: 1 });
  const table = renderSummaryTable(results);
  const lines = table.split('\n');

  // header + separator + one row per tokenizer
  assert.equal(lines.length, results.length + 2);
  assert.match(lines[0], /tokenizer/);
  assert.match(lines[0], /avg tokens\/word/);
  for (const result of results) {
    assert.ok(table.includes(result.name), `expected table to mention ${result.name}`);
  }
});

test('renderSummaryTable reports avg tokens/word consistent with the benchmark result', () => {
  const results = runBenchmark(
    [createWhitespaceTokenizer(), createCharTokenizer()],
    SAMPLE,
    { iterations: 1 },
  );
  const table = renderSummaryTable(results);

  // whitespace never fragments a word, so its average is exactly 1.00
  assert.ok(table.includes('1.00'));
  const charResult = results.find((r) => r.name === 'char');
  assert.ok(table.includes(charResult.fragmentation.avgTokensPerWord.toFixed(2)));
});

test('renderSummaryTable right-aligns numeric columns to a shared width', () => {
  const results = runBenchmark(createDefaultTokenizers(), SAMPLE, { iterations: 1 });
  const lines = renderSummaryTable(results).split('\n');
  const width = lines[0].length;
  for (const line of lines) {
    assert.equal(line.length, width);
  }
});
