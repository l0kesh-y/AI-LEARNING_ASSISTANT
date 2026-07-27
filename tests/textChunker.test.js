const test = require('node:test');
const assert = require('node:assert/strict');
const { chunkText } = require('../utils/textChunker');

test('returns the full text as one chunk when it is short', () => {
  const text = 'This is a short document.';
  assert.deepEqual(chunkText(text, 200), ['This is a short document.']);
});

test('splits long text into multiple chunks without cutting words', () => {
  const text = 'one two three four five six seven eight nine ten eleven twelve';
  const chunks = chunkText(text, 20);

  assert.ok(chunks.length >= 2);
  assert.ok(chunks.every(chunk => chunk.trim().length > 0));
  assert.ok(chunks.every(chunk => chunk.length <= 20));
});
