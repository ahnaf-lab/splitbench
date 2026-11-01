'use strict';

// A small fixed corpus used as the default benchmark input. It mixes short
// and long words, punctuation, and repeated vocabulary so every tokenizer
// (whitespace, char, naive-bpe, toy-unigram) has something interesting to
// do with it.
const DEFAULT_CORPUS = [
  'The quick brown fox jumps over the lazy dog.',
  'Tokenizers split text into smaller pieces called tokens.',
  'Some tokenizers work on whitespace, others on characters, bytes, or learned subwords.',
  'A good benchmark trains each tokenizer on the same corpus and compares',
  'token counts, word fragmentation, and encode or decode speed.',
].join(' ');

module.exports = { DEFAULT_CORPUS };
