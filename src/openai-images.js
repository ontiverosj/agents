const OPENAI_BASE = 'https://api.openai.com/v1';

function jsonError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getDataImage(value) {
  if (typeof value !== 'string') return null;
  return /^data:image\/(png|jpeg|webp);base64,/.test(value) ? value : null;
}

async function openaiRequest(path, options, fetchImpl = fetch) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw jsonError('OpenAI image generation is not configured on the server.', 503);
  const response = await fetchImpl(`${OPENAI_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = jsonError(
      result.error?.code === 'moderation_blocked'
        ? 'This image request could not be completed. Try changing the prompt.'
        : result.error?.message || 'OpenAI could not process this image request.',
      response.status
    );
    error.code = result.error?.code;
    throw error;
  }
  return result;
}

async function generateOrEditImage(body, fetchImpl = fetch) {
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > 3000) throw jsonError('The image prompt is missing or too long.', 400);
  const source = getDataImage(body?.sourceImage);
  if (body?.mode === 'edit' && !source) throw jsonError('A valid source image is required for editing.', 400);
  if (source && source.length > 20 * 1024 * 1024) throw jsonError('The source image is too large to edit.', 413);

  const editing = Boolean(source);
  const result = await openaiRequest(
    editing ? '/images/edits' : '/images/generations',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        editing
          ? {
              model: 'gpt-image-2.5-sunburst',
              images: [{ image_url: source }],
              prompt,
              input_fidelity: 'high',
              size: '1024x1536',
              quality: 'medium',
              output_format: 'png',
            }
          : {
              model: 'gpt-image-2.5-flare',
              prompt,
              size: '1024x1536',
              quality: 'low',
              output_format: 'png',
            }
      ),
    },
    fetchImpl
  );
  const image = result.data?.[0]?.b64_json;
  if (!image) throw jsonError('OpenAI returned no image.', 502);
  return { image, mode: editing ? 'edit' : 'generate' };
}

async function createSquareVariation(body, fetchImpl = fetch) {
  const source = typeof body?.sourceImage === 'string' && body.sourceImage.startsWith('data:image/png;base64,')
    ? body.sourceImage
    : null;
  if (!source) throw jsonError('A square PNG source image is required.', 400);
  const raw = Buffer.from(source.split(',')[1], 'base64');
  if (raw.length > 4 * 1024 * 1024) throw jsonError('The square source image must be smaller than 4 MB.', 413);

  const form = new FormData();
  form.append('image', new Blob([raw], { type: 'image/png' }), 'storyboard.png');
  form.append('model', 'dall-e-2');
  form.append('n', '1');
  form.append('response_format', 'b64_json');
  form.append('size', '1024x1024');
  const result = await openaiRequest('/images/variations', { method: 'POST', body: form }, fetchImpl);
  const image = result.data?.[0]?.b64_json;
  if (!image) throw jsonError('OpenAI returned no image variation.', 502);
  return { image, mode: 'variation', size: '1024x1024' };
}

module.exports = { generateOrEditImage, createSquareVariation };
