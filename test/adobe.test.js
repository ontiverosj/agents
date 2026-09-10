const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { ADOBE_AUTHORIZE_URL, ADOBE_TOKEN_URL, createAdobeClient, createOAuthState,
  verifyOAuthState, verifyWebhookSignature } = require('../src/adobe');

test('OAuth state is signed, expires, and rejects tampering', () => {
  const state = createOAuthState({ secret: 'secret', now: () => 1_000, ttlMs: 500 });
  assert.equal(verifyOAuthState({ state, secret: 'secret', now: () => 1_499 }), true);
  assert.equal(verifyOAuthState({ state, secret: 'secret', now: () => 1_501 }), false);
  assert.equal(verifyOAuthState({ state: `${state}x`, secret: 'secret', now: () => 1_000 }), false);
});

test('Adobe client fails closed when credentials are missing', () => {
  const client = createAdobeClient({ env: {} });
  assert.deepEqual(client.status(), { configured: false, connected: false, expires_at: null });
  assert.throws(() => client.getAuthorizationUrl(), /not configured/);
});

test('authorization URL contains callback, scopes, and signed state', () => {
  const env = { ADOBE_CLIENT_ID: 'client-id', ADOBE_CLIENT_SECRET: 'client-secret',
    ADOBE_REDIRECT_URI: 'https://api.example.com/adobe/callback' };
  const client = createAdobeClient({ env, now: () => 1_000 });
  const url = new URL(client.getAuthorizationUrl());
  assert.equal(`${url.origin}${url.pathname}`, ADOBE_AUTHORIZE_URL);
  assert.equal(url.searchParams.get('client_id'), 'client-id');
  assert.equal(url.searchParams.get('redirect_uri'), env.ADOBE_REDIRECT_URI);
  assert.equal(verifyOAuthState({ state: url.searchParams.get('state'),
    secret: env.ADOBE_CLIENT_SECRET, now: () => 1_000 }), true);
});

test('authorization code exchange stores only server-side connection state', async () => {
  const env = { ADOBE_CLIENT_ID: 'client-id', ADOBE_CLIENT_SECRET: 'client-secret',
    ADOBE_REDIRECT_URI: 'https://api.example.com/adobe/callback' };
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600 }) };
  };
  const client = createAdobeClient({ env, fetchImpl, now: () => 1_000 });
  const authorization = new URL(client.getAuthorizationUrl());
  await client.exchangeCode({ code: 'code', state: authorization.searchParams.get('state') });
  assert.equal(request.url, ADOBE_TOKEN_URL);
  assert.equal(request.options.body.get('client_secret'), 'client-secret');
  assert.deepEqual(client.status(), { configured: true, connected: true, expires_at: 3_601_000 });
});

test('webhook verification requires a matching HMAC signature', () => {
  const rawBody = '{"event":"file_created"}';
  const secret = 'webhook-secret';
  const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  assert.equal(verifyWebhookSignature({ rawBody, signature, secret }), true);
  assert.equal(verifyWebhookSignature({ rawBody, signature: 'wrong', secret }), false);
  assert.equal(verifyWebhookSignature({ rawBody, signature, secret: '' }), false);
});
