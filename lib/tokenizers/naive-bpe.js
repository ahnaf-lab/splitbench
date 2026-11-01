'use strict';

// A small, deterministic byte-pair-encoding tokenizer. It learns merges from
// a training corpus by repeatedly combining the most frequent adjacent
// symbol pair, exactly like the original BPE algorithm, but without any of
// the production tricks (byte-level fallback, regex pre-tokenizer rules,
// special tokens) a real implementation would add.

const WORD_BOUNDARY = '\u0000';
const PAIR_SEPARATOR = '\u0001';

function splitWord(word) {
  return Array.from(word).concat([WORD_BOUNDARY]);
}

function getPairCounts(wordSymbols) {
  const counts = new Map();
  for (const symbols of wordSymbols) {
    for (let i = 0; i < symbols.length - 1; i++) {
      const pair = symbols[i] + PAIR_SEPARATOR + symbols[i + 1];
      counts.set(pair, (counts.get(pair) || 0) + 1);
    }
  }
  return counts;
}

// Ties are broken by lexicographically smallest pair so training is
// reproducible regardless of Map iteration order.
function pickBestPair(counts) {
  let best = null;
  let bestCount = 0;
  for (const [pair, count] of counts) {
    if (count > bestCount) {
      best = pair;
      bestCount = count;
    } else if (count === bestCount && best !== null && pair < best) {
      best = pair;
    }
  }
  return bestCount >= 2 ? best : null;
}

function mergeWordSymbols(wordSymbols, first, second) {
  const merged = first + second;
  return wordSymbols.map((symbols) => {
    const result = [];
    let i = 0;
    while (i < symbols.length) {
      if (i < symbols.length - 1 && symbols[i] === first && symbols[i + 1] === second) {
        result.push(merged);
        i += 2;
      } else {
        result.push(symbols[i]);
        i += 1;
      }
    }
    return result;
  });
}

class NaiveBpeTokenizer {
  constructor(options = {}) {
    this.name = 'naive-bpe';
    this.numMerges = options.numMerges || 100;
    this.merges = [];
    this.trained = false;
  }

  train(corpus) {
    let words = (corpus.match(/\S+/g) || []).map(splitWord);
    this.merges = [];
    for (let step = 0; step < this.numMerges; step++) {
      const counts = getPairCounts(words);
      const best = pickBestPair(counts);
      if (!best) break;
      const [first, second] = best.split(PAIR_SEPARATOR);
      this.merges.push([first, second]);
      words = mergeWordSymbols(words, first, second);
    }
    this.trained = true;
  }

  encodeWord(word) {
    let symbols = splitWord(word);
    for (const [first, second] of this.merges) {
      symbols = mergeWordSymbols([symbols], first, second)[0];
    }
    return symbols;
  }

  // Trains on the text itself when no explicit corpus was provided, so the
  // tokenizer is usable with a single call for one-off comparisons.
  encode(text) {
    if (!this.trained) this.train(text);
    const parts = text.match(/\S+|\s+/g) || [];
    const tokens = [];
    for (const part of parts) {
      if (/^\s+$/.test(part)) {
        tokens.push(part);
      } else {
        tokens.push(...this.encodeWord(part));
      }
    }
    return tokens;
  }

  decode(tokens) {
    return tokens.join('').split(WORD_BOUNDARY).join('');
  }
}

module.exports = { NaiveBpeTokenizer };
