'use strict';

// A toy unigram tokenizer. It scores candidate substrings by how often they
// occur in a training corpus, then uses Viterbi search to find the
// segmentation of the input with the highest total score. This is the same
// shape as SentencePiece's unigram model, shrunk down to one scoring pass
// with no EM re-estimation.

function buildSubstringCounts(corpus, maxLen) {
  const counts = new Map();
  const length = corpus.length;
  for (let i = 0; i < length; i++) {
    for (let len = 1; len <= maxLen && i + len <= length; len++) {
      const sub = corpus.slice(i, i + len);
      counts.set(sub, (counts.get(sub) || 0) + 1);
    }
  }
  return counts;
}

const UNSEEN_SCORE = Math.log(1e-6);

class ToyUnigramTokenizer {
  constructor(options = {}) {
    this.name = 'toy-unigram';
    this.maxTokenLength = options.maxTokenLength || 5;
    this.vocabSize = options.vocabSize || 200;
    this.scores = new Map();
    this.trained = false;
  }

  train(corpus) {
    const counts = buildSubstringCounts(corpus, this.maxTokenLength);

    // Every character that appears must stay in the vocabulary so any text
    // built from them can always be segmented, no matter the vocab cap.
    const singles = new Set(Array.from(corpus));

    const entries = Array.from(counts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      if (b[0].length !== a[0].length) return b[0].length - a[0].length;
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
    });

    const chosen = new Map();
    for (const ch of singles) {
      chosen.set(ch, counts.get(ch) || 1);
    }
    for (const [sub, count] of entries) {
      if (chosen.size >= this.vocabSize) break;
      if (!chosen.has(sub)) chosen.set(sub, count);
    }

    const total = Array.from(chosen.values()).reduce((sum, count) => sum + count, 0) || 1;
    this.scores = new Map();
    for (const [sub, count] of chosen) {
      this.scores.set(sub, Math.log(count / total));
    }
    this.trained = true;
  }

  scoreOf(sub) {
    return this.scores.has(sub) ? this.scores.get(sub) : UNSEEN_SCORE;
  }

  // Trains on the text itself when no explicit corpus was provided, so the
  // tokenizer is usable with a single call for one-off comparisons.
  encode(text) {
    if (!this.trained) this.train(text);

    const n = text.length;
    const best = new Array(n + 1).fill(-Infinity);
    const backPointer = new Array(n + 1).fill(0);
    best[0] = 0;

    for (let end = 1; end <= n; end++) {
      const start = Math.max(0, end - this.maxTokenLength);
      for (let begin = start; begin < end; begin++) {
        if (best[begin] === -Infinity) continue;
        const sub = text.slice(begin, end);
        // Single characters always get a fallback score so segmentation
        // never gets stuck on text the training corpus never saw.
        if (sub.length > 1 && !this.scores.has(sub)) continue;
        const candidate = best[begin] + this.scoreOf(sub);
        if (candidate > best[end]) {
          best[end] = candidate;
          backPointer[end] = begin;
        }
      }
    }

    const tokens = [];
    let pos = n;
    while (pos > 0) {
      const begin = backPointer[pos];
      tokens.push(text.slice(begin, pos));
      pos = begin;
    }
    tokens.reverse();
    return tokens;
  }

  decode(tokens) {
    return tokens.join('');
  }
}

module.exports = { ToyUnigramTokenizer };
