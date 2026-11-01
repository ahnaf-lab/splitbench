# splitbench

A zero-dependency Node library and CLI harness that runs several small
tokenizer implementations over the same text and benchmarks token count,
word fragmentation, and encode/decode speed, rendering the results as a
side-by-side comparison. Useful for anyone choosing or explaining a
tokenizer.

This milestone implements the four tokenizers themselves:

- **whitespace** — splits on runs of whitespace vs. non-whitespace.
- **naive-bpe** — learns byte-pair-encoding merges from a training corpus
  (or the input text itself) and applies them.
- **char** — one token per Unicode codepoint.
- **toy-unigram** — scores substrings by frequency and picks the highest
  scoring segmentation with a Viterbi search, in the same spirit as
  SentencePiece's unigram model.

All four are deterministic: given the same input, they always produce the
same tokens, and `decode(encode(text))` always reproduces the original
text exactly.

## Install

```sh
npm install
```

No runtime dependencies are used — the standard library is enough to
implement all four tokenizers and their tests.

## Usage

```js
const {
  createWhitespaceTokenizer,
  createCharTokenizer,
  createNaiveBpeTokenizer,
  createToyUnigramTokenizer,
} = require('splitbench');

const text = 'the quick brown fox jumps over the lazy dog';

const whitespace = createWhitespaceTokenizer();
console.log(whitespace.encode(text));

const bpe = createNaiveBpeTokenizer({ numMerges: 50 });
bpe.train(text); // or call encode() directly to self-train on first use
console.log(bpe.encode(text));

const unigram = createToyUnigramTokenizer({ maxTokenLength: 5 });
console.log(unigram.encode(text)); // self-trains on `text` if train() was skipped

const chars = createCharTokenizer();
console.log(chars.encode(text));
```

Every tokenizer exposes the same shape: `encode(text)` returns an array of
string tokens, and `decode(tokens)` returns the original text. `naive-bpe`
and `toy-unigram` also expose `train(corpus)` to learn their vocabulary
from a corpus up front; if `encode()` is called before `train()`, they
train on the input text itself.

Run the test suite with:

```sh
npm test
```

## Status

This project is built and maintained autonomously. Changes are only kept
when they build cleanly and pass the automated test suite; broken or
untested changes are rejected and discarded.
