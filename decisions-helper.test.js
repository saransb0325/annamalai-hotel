const test = require('node:test');
const assert = require('node:assert/strict');
const { requestDecision, validateRequest, DECISIONS_URL, MODEL } = require('./decisions-helper');

const originalFetch = global.fetch;
const originalKey = process.env.EXPERIENTIAL_API_KEY;
const questions = [{ name: 'ship', instructions: 'Is the proposed change safe to ship?', type: 'predicate' }];

test.afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.EXPERIENTIAL_API_KEY;
  else process.env.EXPERIENTIAL_API_KEY = originalKey;
});

test('fails locally if the API key is missing and makes no request', async () => {
  delete process.env.EXPERIENTIAL_API_KEY;
  let called = false;
  global.fetch = async () => { called = true; };
  await assert.rejects(requestDecision({ input: 'Review this diff', questions }), /EXPERIENTIAL_API_KEY is not set/);
  assert.equal(called, false);
});

test('sends exact endpoint, model and bearer key; returns parsed response', async () => {
  process.env.EXPERIENTIAL_API_KEY = 'test-only-secret';
  let captured;
  global.fetch = async (url, options) => {
    captured = { url, options };
    return { ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify({ answers: [{ value: true }], usage: { total_tokens: 3 } }) };
  };
  const result = await requestDecision({ input: 'Review this diff', questions });
  assert.equal(captured.url, DECISIONS_URL);
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.headers.Authorization, 'Bearer test-only-secret');
  const body = JSON.parse(captured.options.body);
  assert.equal(body.model, MODEL);
  assert.deepEqual(body.questions, questions);
  assert.equal(result.usage.total_tokens, 3);
});

test('validates maximum question count before network access', async () => {
  assert.throws(() => validateRequest({ input: 'x', questions: Array.from({ length: 33 }, () => questions[0]) }), /between 1 and 32/);
});

test('validates choice option limit', async () => {
  assert.throws(() => validateRequest({ input: 'x', questions: [{ instructions: 'Choose', type: 'choice', choices: Array.from({ length: 65 }, (_, i) => ({ value: String(i), description: 'Option' })) }] }), /1 to 64/);
});

test('validates score level range', async () => {
  assert.throws(() => validateRequest({ input: 'x', questions: [{ instructions: 'Rate', type: 'score', levels: [{ value: 'low', description: 'Low' }] }] }), /2 to 10/);
});

test('surfaces HTTP errors without retrying', async () => {
  process.env.EXPERIENTIAL_API_KEY = 'test-only-secret';
  let calls = 0;
  global.fetch = async () => { calls++; return { ok: false, status: 429, statusText: 'Too Many Requests', text: async () => JSON.stringify({ error: 'rate limited' }) }; };
  await assert.rejects(requestDecision({ input: 'x', questions }), /HTTP 429: rate limited/);
  assert.equal(calls, 1);
});
