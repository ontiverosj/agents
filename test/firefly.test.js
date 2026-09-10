const test = require('node:test');
const assert = require('node:assert/strict');
const { API_BASE, DEFAULT_SCOPES, TOKEN_URL, createFireflyClient } = require('../src/firefly');

test('Firefly fails closed without server credentials', async () => {
  const client = createFireflyClient({ env: {} });
  assert.deepEqual(client.status(), { configured: false, token_valid: false, token_expires_at: null });
  await assert.rejects(client.getAccessToken(), /not configured/);
});

test('Firefly creates and caches a server-to-server token', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ access_token: 'secret-access-token', expires_in: 86400 }) };
  };
  const client = createFireflyClient({ env: { ADOBE_FIREFLY_CLIENT_ID: 'id',
    ADOBE_FIREFLY_CLIENT_SECRET: 'secret' }, fetchImpl, now: () => 1000 });
  assert.equal(await client.getAccessToken(), 'secret-access-token');
  assert.equal(await client.getAccessToken(), 'secret-access-token');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, TOKEN_URL);
  assert.equal(calls[0].options.body.get('scope'), DEFAULT_SCOPES);
  assert.equal(calls[0].options.body.get('client_secret'), 'secret');
  assert.deepEqual(client.status(), { configured: true, token_valid: true, token_expires_at: 86401000 });
});

test('Reframe submits validated v2 job with subject lock', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url === TOKEN_URL) return { ok: true, json: async () => ({ access_token: 'token', expires_in: 86400 }) };
    return { ok: true, json: async () => ({ jobId: 'job-1', statusUrl: `${API_BASE}/status/job-1` }) };
  };
  const client = createFireflyClient({ env: { ADOBE_FIREFLY_CLIENT_ID: 'id',
    ADOBE_FIREFLY_CLIENT_SECRET: 'secret' }, fetchImpl });
  const result = await client.submitReframe({ sourceUrl: 'https://media.example/input.mp4',
    destinationUrl: 'https://media.example/output.mp4?signature=x', width: 1080, height: 1920,
    focalPoints: ['Jake', 'Colorado Candy Company'] });
  assert.equal(result.jobId, 'job-1');
  const request = calls[1];
  assert.equal(request.url, `${API_BASE}/reframe`);
  assert.equal(request.options.headers.Authorization, 'Bearer token');
  assert.equal(request.options.headers['x-api-key'], 'id');
  const body = JSON.parse(request.options.body);
  assert.deepEqual(body.analysis.focalPoints, ['Jake', 'Colorado Candy Company']);
  assert.deepEqual(body.output.renditions[0].resolution, { width: 1080, height: 1920 });
});

test('Reframe rejects unsafe URLs and malformed job IDs', async () => {
  const client = createFireflyClient({ env: { ADOBE_FIREFLY_CLIENT_ID: 'id',
    ADOBE_FIREFLY_CLIENT_SECRET: 'secret' } });
  assert.throws(() => client.submitReframe({ sourceUrl: 'http://localhost/input.mp4',
    destinationUrl: 'https://example.com/out.mp4' }), /HTTPS URL/);
  assert.throws(() => client.getJob('../secret'), /Invalid Firefly job ID/);
});
