const test = require('node:test');
const assert = require('node:assert/strict');
const { constantTimeEqual, createToolsTokenGuard } = require('../src/auth');

const response = () => {
  const state = { statusCode: null, body: null };
  return {
    state,
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(body) {
      state.body = body;
      return this;
    },
  };
};

test('constantTimeEqual accepts only identical strings', () => {
  assert.equal(constantTimeEqual('Bearer secret', 'Bearer secret'), true);
  assert.equal(constantTimeEqual('Bearer wrong', 'Bearer secret'), false);
  assert.equal(constantTimeEqual('short', 'much-longer'), false);
  assert.equal(constantTimeEqual(null, 'Bearer secret'), false);
});

test('guard fails closed when the server token is missing', () => {
  const res = response();
  let nextCalled = false;
  const logger = { error() {} };
  const guard = createToolsTokenGuard({ getToken: () => '', logger });

  guard({ headers: {} }, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.state.statusCode, 503);
  assert.deepEqual(res.state.body, { error: 'Authentication unavailable' });
});

test('guard rejects a missing or incorrect bearer token', () => {
  const guard = createToolsTokenGuard({ getToken: () => 'expected-token' });

  for (const authorization of [undefined, 'Bearer wrong-token', 'Basic expected-token']) {
    const res = response();
    let nextCalled = false;
    guard({ headers: { authorization } }, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.state.statusCode, 401);
  }
});

test('guard accepts the configured bearer token', () => {
  const res = response();
  let nextCalled = false;
  const guard = createToolsTokenGuard({ getToken: () => 'expected-token' });

  guard(
    { headers: { authorization: 'Bearer expected-token' } },
    res,
    () => { nextCalled = true; }
  );

  assert.equal(nextCalled, true);
  assert.equal(res.state.statusCode, null);
});
