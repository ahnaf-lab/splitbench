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

module.exports = {
  createWhitespaceTokenizer,
  createCharTokenizer,
  createNaiveBpeTokenizer,
  createToyUnigramTokenizer,
};
