'use strict';

// Golden tests: fixed inputs whose exact output is pinned verbatim, so a
// change to token boundaries, the stripe layout, or the table layout shows
// up as a diff here even if every other (more tolerant) test still passes.
//
// Benchmark timing (encode/decode chars-per-second etc.) is intentionally
// excluded from these goldens: it depends on the machine's clock, not on the
// code under test, so pinning it would make this suite flaky rather than
// strict. Everything else the benchmark/table pipeline produces from a
// fixed corpus is deterministic and is pinned exactly.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createDefaultTokenizers,
  renderComparison,
  runBenchmark,
  renderSummaryTable,
  DEFAULT_CORPUS,
} = require('../lib');

const SAMPLE = 'the quick brown fox jumps over the lazy dog';

const GOLDEN_COMPARISON = [
  'whitespace  (17 tokens)',
  '[the][ ][quick][ ][brown][ ][fox][ ][jumps][ ][over][ ][the][ ][lazy][ ][dog]',
  '=====---=======---=======---=====---=======---======---=====---======---=====',
  '',
  'char        (43 tokens)',
  '[t][h][e][ ][q][u][i][c][k][ ][b][r][o][w][n][ ][f][o][x][ ][j][u][m][p][s][ ][o][v][e][r][ ][t][h][e][ ][l][a][z][y][ ][d][o][g]',
  '===---===---===---===---===---===---===---===---===---===---===---===---===---===---===---===---===---===---===---===---===---===',
  '',
  'naive-bpe   (46 tokens)',
  '[the][ ][q][u][i][c][k][][ ][b][r][o][w][n][][ ][f][o][x][][ ][j][u][m][p][s][][ ][o][v][e][r][][ ][the][ ][l][a][z][y][][ ][d][o][g][]',
  '=====---===---===---===--===---===---===---==---===---===--===---===---===---==---===---===---==---=====---===---===---==---===---===--',
  '',
  'toy-unigram (9 tokens)',
  '[the][ quic][k bro][wn fo][x jum][ps ov][er th][e laz][y dog]',
  '=====-------=======-------=======-------=======-------=======',
].join('\n');

test('golden: renderComparison over a fixed sample sentence matches exactly', () => {
  const output = renderComparison(createDefaultTokenizers(), SAMPLE);
  assert.equal(output, GOLDEN_COMPARISON);
});

const GOLDEN_BENCHMARK = [
  {
    name: 'whitespace',
    tokenCount: 99,
    correctRoundTrip: true,
    fragmentation: { wordCount: 50, avgTokensPerWord: 1, fragmentedWordRatio: 0 },
  },
  {
    name: 'char',
    tokenCount: 320,
    correctRoundTrip: true,
    fragmentation: { wordCount: 50, avgTokensPerWord: 5.42, fragmentedWordRatio: 0.98 },
  },
  {
    name: 'naive-bpe',
    tokenCount: 224,
    correctRoundTrip: true,
    fragmentation: { wordCount: 50, avgTokensPerWord: 3.5, fragmentedWordRatio: 0.82 },
  },
  {
    name: 'toy-unigram',
    tokenCount: 122,
    correctRoundTrip: true,
    fragmentation: { wordCount: 50, avgTokensPerWord: 3.04, fragmentedWordRatio: 0.76 },
  },
];

test('golden: runBenchmark over DEFAULT_CORPUS matches pinned token counts and fragmentation', () => {
  const results = runBenchmark(createDefaultTokenizers(), DEFAULT_CORPUS, { iterations: 1 });

  assert.equal(results.length, GOLDEN_BENCHMARK.length);
  results.forEach((result, i) => {
    const expected = GOLDEN_BENCHMARK[i];
    assert.equal(result.name, expected.name);
    assert.equal(result.tokenCount, expected.tokenCount);
    assert.equal(result.correctRoundTrip, expected.correctRoundTrip);
    assert.deepEqual(result.fragmentation, expected.fragmentation);
  });
});

const GOLDEN_SUMMARY_TABLE = [
  'tokenizer    tokens  avg tokens/word  encode chars/s  decode tokens/s',
  '-----------  ------  ---------------  --------------  ---------------',
  'whitespace       99             1.00         9776565          8508810',
  'char            320             5.42        42834196         30830496',
  'naive-bpe       224             3.50          135063          8587201',
  'toy-unigram     122             3.04          841208         13042084',
].join('\n');

test('golden: renderSummaryTable over fixed benchmark-shaped results matches exactly', () => {
  // These results are hand-built (not timed) so the table layout itself
  // -- headers, separator width, column alignment, number formatting -- is
  // pinned without any dependency on how fast this machine happens to run.
  const results = [
    {
      name: 'whitespace',
      tokenCount: 99,
      fragmentation: { avgTokensPerWord: 1 },
      encode: { charsPerSecond: 9776565 },
      decode: { tokensPerSecond: 8508810 },
    },
    {
      name: 'char',
      tokenCount: 320,
      fragmentation: { avgTokensPerWord: 5.42 },
      encode: { charsPerSecond: 42834196 },
      decode: { tokensPerSecond: 30830496 },
    },
    {
      name: 'naive-bpe',
      tokenCount: 224,
      fragmentation: { avgTokensPerWord: 3.5 },
      encode: { charsPerSecond: 135063 },
      decode: { tokensPerSecond: 8587201 },
    },
    {
      name: 'toy-unigram',
      tokenCount: 122,
      fragmentation: { avgTokensPerWord: 3.04 },
      encode: { charsPerSecond: 841208 },
      decode: { tokensPerSecond: 13042084 },
    },
  ];

  assert.equal(renderSummaryTable(results), GOLDEN_SUMMARY_TABLE);
});

test('golden: renderSummaryTable formats a null rate as n/a', () => {
  const results = [
    {
      name: 'whitespace',
      tokenCount: 10,
      fragmentation: { avgTokensPerWord: 1 },
      encode: { charsPerSecond: null },
      decode: { tokensPerSecond: null },
    },
  ];

  const table = renderSummaryTable(results);
  const lines = table.split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[2], 'whitespace      10             1.00             n/a              n/a');
});
