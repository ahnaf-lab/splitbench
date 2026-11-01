# splitbench

A zero-dependency Node library and CLI harness that runs several small
tokenizer implementations over the same text and benchmarks token count,
word fragmentation, and encode/decode speed, rendering the results as a
side-by-side comparison. Useful for anyone choosing or explaining a
tokenizer.

This project implements four tokenizers:

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

On top of the tokenizers, a benchmark runner trains each tokenizer on a
fixed corpus, times its encode/decode passes, and collects:

- **token count** — how many tokens the corpus encodes into.
- **word fragmentation** — how often a whole whitespace-delimited word
  comes back as more than one token.
- **speed** — mean encode/decode time per pass, and the resulting
  characters-per-second / tokens-per-second rate.
- **round-trip correctness** — whether `decode(encode(corpus))` reproduced
  the corpus exactly.

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

To benchmark tokenizers against each other, use `runBenchmark`:

```js
const {
  runBenchmark,
  createDefaultTokenizers,
  DEFAULT_CORPUS,
} = require('splitbench');

const results = runBenchmark(createDefaultTokenizers(), DEFAULT_CORPUS);

for (const result of results) {
  console.log(
    result.name,
    result.tokenCount,
    result.fragmentation.fragmentedWordRatio,
    result.encode.charsPerSecond,
  );
}
```

`runBenchmark(tokenizers, corpus, options)` trains and benchmarks each
tokenizer over the same corpus, in the order given, and returns one result
object per tokenizer with `tokenCount`, `correctRoundTrip`, `fragmentation`
(`wordCount`, `avgTokensPerWord`, `fragmentedWordRatio`), and `encode` /
`decode` timing (`totalMs`, `meanMs`, and a `charsPerSecond` /
`tokensPerSecond` rate). Pass `{ iterations: n }` to control how many
encode/decode passes are timed per tokenizer (default 5). `createDefaultTokenizers()`
builds one instance of each of the four tokenizers above; `DEFAULT_CORPUS`
is a small fixed corpus bundled for convenience, but any non-empty string
works as the corpus.

To see how each tokenizer breaks up a sentence, render a striped
side-by-side comparison with `renderComparison`:

```js
const { renderComparison, createDefaultTokenizers } = require('splitbench');

console.log(renderComparison(createDefaultTokenizers(), 'the quick brown fox'));
```

which prints one row per tokenizer: a line of bracketed token cells, and a
stripe bar underneath that alternates fill character at each cell so
boundaries stay visible even between visually similar tokens, e.g.:

```
whitespace  (7 tokens)
[the][ ][quick][ ][brown][ ][fox]
=====---=======---=======---=====
```

`renderStripeRow(tokenizer, text)` renders a single tokenizer's row (an
object with `name`, `tokenCount`, `cells`, and `bar`), and
`tokenSpans(tokenizer, text)` returns the lower-level `{ token, text }`
pairs mapping each token back onto the slice of the original sentence it
covers — found purely from the `decode(encode(text)) === text` round-trip
guarantee, so it works for any tokenizer with that property, not just the
four built in here.

Run the test suite with:

```sh
npm test
```

## Status

This project is built and maintained autonomously. Changes are only kept
when they build cleanly and pass the automated test suite; broken or
untested changes are rejected and discarded.
