const test = require('node:test');
const assert = require('node:assert/strict');
const { generateOrEditImage, createSquareVariation } = require('../src/openai-images');

function response(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

test('generation uses the configured key without returning it', async () => {
  process.env.OPENAI_API_KEY = 'server-secret';
  let request;
  const result = await generateOrEditImage({ prompt: 'crispy chicken hero shot' }, async (url, options) => {
    request = { url, options };
    return response({ data: [{ b64_json: 'image-data' }] });
  });
  assert.equal(result.image, 'image-data');
  assert.equal(request.url, 'https://api.openai.com/v1/images/generations');
  assert.equal(request.options.headers.Authorization, 'Bearer server-secret');
});

test('missing key fails closed', async () => {
  delete process.env.OPENAI_API_KEY;
  await assert.rejects(
    generateOrEditImage({ prompt: 'test' }, async () => response({})),
    (error) => error.statusCode === 503
  );
});

test('edit requires an image', async () => {
  process.env.OPENAI_API_KEY = 'server-secret';
  await assert.rejects(
    generateOrEditImage({ prompt: 'change angle', mode: 'edit' }),
    (error) => error.statusCode === 400
  );
});

test('square variation validates PNG input', async () => {
  process.env.OPENAI_API_KEY = 'server-secret';
  await assert.rejects(
    createSquareVariation({ sourceImage: 'data:image/jpeg;base64,AAAA' }),
    (error) => error.statusCode === 400
  );
});
