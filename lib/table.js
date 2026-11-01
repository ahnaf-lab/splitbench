'use strict';

// Renders a plain-text summary table from runBenchmark() results: one row
// per tokenizer, with the numbers most people actually compare tokenizers
// on — average tokens per word, and encode/decode throughput.

function formatRate(value) {
  return value == null ? 'n/a' : String(Math.round(value));
}

const HEADERS = ['tokenizer', 'tokens', 'avg tokens/word', 'encode chars/s', 'decode tokens/s'];

function resultToRow(result) {
  return [
    result.name,
    String(result.tokenCount),
    result.fragmentation.avgTokensPerWord.toFixed(2),
    formatRate(result.encode.charsPerSecond),
    formatRate(result.decode.tokensPerSecond),
  ];
}

// Column 0 (the name) is left-aligned; every numeric column is right-aligned
// so the digits themselves line up for easy scanning down a column.
function formatRow(cells, widths) {
  return cells
    .map((cell, col) => (col === 0 ? cell.padEnd(widths[col]) : cell.padStart(widths[col])))
    .join('  ');
}

function renderSummaryTable(results) {
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('renderSummaryTable requires at least one benchmark result');
  }

  const rows = results.map(resultToRow);
  const widths = HEADERS.map((header, col) =>
    Math.max(header.length, ...rows.map((row) => row[col].length)),
  );

  const lines = [
    formatRow(HEADERS, widths),
    widths.map((w) => '-'.repeat(w)).join('  '),
    ...rows.map((row) => formatRow(row, widths)),
  ];
  return lines.join('\n');
}

module.exports = { renderSummaryTable };
