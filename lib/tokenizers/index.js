'use strict';

const { createWhitespaceTokenizer } = require('./whitespace');
const { createCharTokenizer } = require('./char');
const { NaiveBpeTokenizer } = require('./naive-bpe');
const { ToyUnigramTokenizer } = require('./toy-unigram');

function createNaiveBpeTokenizer(options) {
  return new NaiveBpeTokenizer(options);
}

function createToyUnigramTokenizer(options) {
  return new ToyUnigramTokenizer(options);
}

// Builds one instance of every tokenizer with default options, in a fixed
// order, so callers (like the benchmark runner) can compare all of them
// without listing each constructor by hand.
function createDefaultTokenizers() {
  return [
    createWhitespaceTokenizer(),
    createCharTokenizer(),
    createNaiveBpeTokenizer(),
    createToyUnigramTokenizer(),
  ];
}

module.exports = {
  createWhitespaceTokenizer,
  createCharTokenizer,
  createNaiveBpeTokenizer,
  createToyUnigramTokenizer,
  createDefaultTokenizers,
};
