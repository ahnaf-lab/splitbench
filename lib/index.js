'use strict';

const tokenizers = require('./tokenizers');
const benchmark = require('./benchmark');
const stripes = require('./stripes');
const { DEFAULT_CORPUS } = require('./corpus');

module.exports = {
  ...tokenizers,
  ...benchmark,
  ...stripes,
  DEFAULT_CORPUS,
};
