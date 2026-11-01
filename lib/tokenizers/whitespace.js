'use strict';

// Splits text into alternating runs of non-whitespace and whitespace, so
// decode is always a perfect, lossless reconstruction of the input.
function createWhitespaceTokenizer() {
  return {
    name: 'whitespace',
    train() {},
    encode(text) {
      const matches = text.match(/\S+|\s+/g);
      return matches ? matches : [];
    },
    decode(tokens) {
      return tokens.join('');
    },
  };
}

module.exports = { createWhitespaceTokenizer };
