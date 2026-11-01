'use strict';

const tokenizers = require('./tokenizers');
const benchmark = require('./benchmark');
const { DEFAULT_CORPUS } = require('./corpus');

module.exports = {
  ...tokenizers,
  ...benchmark,
  DEFAULT_CORPUS,
};
