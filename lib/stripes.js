'use strict';

// Visualizes how each tokenizer segments the same sample sentence: every
// token is shown in its own bracketed cell, with a stripe bar underneath
// that alternates its fill character at each cell, so adjacent token
// boundaries stay visible even when the token text itself gives no visual
// cue (e.g. two single-character tokens next to each other).

const STRIPE_CHARS = ['=', '-'];

// Finds the slice of `text` each token covers by decoding incrementally
// longer prefixes of the token list and watching how much of the original
// text that reconstructs. This relies only on the lossless round-trip
// guarantee decode(encode(text)) === text that every tokenizer provides, so
// it works without knowing anything about a tokenizer's internal boundary
// markers (such as naive-bpe's word-boundary symbol, which can decode to an
// empty slice of visible text).
function tokenSpans(tokenizer, text) {
  const tokens = tokenizer.encode(text);
  const spans = [];
  let consumed = 0;
  for (let i = 0; i < tokens.length; i++) {
    const end = tokenizer.decode(tokens.slice(0, i + 1)).length;
    spans.push({ token: tokens[i], text: text.slice(consumed, end) });
    consumed = end;
  }
  return spans;
}

// Escapes characters that would otherwise break the single-line rendering
// below (newlines, tabs, carriage returns) so every cell stays on one line.
function escapeForDisplay(str) {
  return str.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r');
}

// Renders one tokenizer's boundaries on `text` as a row of bracketed token
// cells plus a stripe bar underneath, aligned to the same width.
function renderStripeRow(tokenizer, text) {
  const spans = tokenSpans(tokenizer, text);
  let cells = '';
  let bar = '';
  spans.forEach((span, i) => {
    const cell = `[${escapeForDisplay(span.text)}]`;
    cells += cell;
    bar += STRIPE_CHARS[i % STRIPE_CHARS.length].repeat(cell.length);
  });
  return { name: tokenizer.name, tokenCount: spans.length, cells, bar };
}

// Renders every tokenizer's boundaries on the same sample sentence, lined
// up for side-by-side comparison, as one block of text ready to print.
function renderComparison(tokenizers, text) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('renderComparison requires a non-empty sample sentence');
  }
  if (!Array.isArray(tokenizers) || tokenizers.length === 0) {
    throw new Error('renderComparison requires at least one tokenizer');
  }

  const rows = tokenizers.map((tokenizer) => renderStripeRow(tokenizer, text));
  const nameWidth = Math.max(...rows.map((row) => row.name.length));

  const lines = [];
  for (const row of rows) {
    lines.push(`${row.name.padEnd(nameWidth)} (${row.tokenCount} tokens)`);
    lines.push(row.cells);
    lines.push(row.bar);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

module.exports = { tokenSpans, renderStripeRow, renderComparison };
