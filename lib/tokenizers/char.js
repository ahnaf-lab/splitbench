'use strict';

// Splits text into one token per Unicode codepoint. Array.from() respects
// surrogate pairs, so multi-byte characters stay intact as single tokens.
function createCharTokenizer() {
  return {
    name: 'char',
    train() {},
    encode(text) {
      return Array.from(text);
    },
    decode(tokens) {
      return tokens.join('');
    },
  };
}

module.exports = { createCharTokenizer };
