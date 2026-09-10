const test = require('node:test');
const assert = require('node:assert/strict');
const { publicStatus, createCloneVideo, getCloneVideo } = require('../src/heygen');

function response(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

test('status reports configuration without exposing values', () => {
  process.env.HEYGEN_API_KEY = 'secret';
  process.env.HEYGEN_AVATAR_ID = 'avatar-123';
  process.env.HEYGEN_VOICE_ID = 'voice-123';
  assert.deepEqual(publicStatus(), {
    integration: 'heygen',
    configured: true,
    avatar_configured: true,
    voice_configured: true,
  });
});

test('create video uses server-side clone settings', async () => {
  process.env.HEYGEN_API_KEY = 'secret';
  process.env.HEYGEN_AVATAR_ID = 'avatar-123';
  process.env.HEYGEN_VOICE_ID = 'voice-123';
  let request;
  const result = await createCloneVideo({ script: 'Try this candy.', test: true }, async (url, options) => {
    request = { url, options };
    return response({ data: { video_id: 'video_123456' } });
  });
  const payload = JSON.parse(request.options.body);
  assert.equal(request.url, 'https://api.heygen.com/v2/video/generate');
  assert.equal(request.options.headers['X-Api-Key'], 'secret');
  assert.equal(payload.video_inputs[0].character.avatar_id, 'avatar-123');
  assert.equal(payload.video_inputs[0].voice.voice_id, 'voice-123');
  assert.equal(result.video_id, 'video_123456');
});

test('create fails closed without clone IDs', async () => {
  delete process.env.HEYGEN_AVATAR_ID;
  await assert.rejects(createCloneVideo({ script: 'test' }), (error) => error.statusCode === 503);
});

test('video status validates IDs', async () => {
  await assert.rejects(getCloneVideo('../bad'), (error) => error.statusCode === 400);
});
