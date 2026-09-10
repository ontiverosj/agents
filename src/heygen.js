const HEYGEN_BASE = 'https://api.heygen.com';

function serviceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function settings() {
  return {
    apiKey: process.env.HEYGEN_API_KEY?.trim(),
    avatarId: process.env.HEYGEN_AVATAR_ID?.trim(),
    voiceId: process.env.HEYGEN_VOICE_ID?.trim(),
  };
}

function publicStatus() {
  const config = settings();
  return {
    integration: 'heygen',
    configured: Boolean(config.apiKey && config.avatarId && config.voiceId),
    avatar_configured: Boolean(config.avatarId),
    voice_configured: Boolean(config.voiceId),
  };
}

async function heygenRequest(path, options = {}, fetchImpl = fetch) {
  const config = settings();
  if (!config.apiKey) throw serviceError('HeyGen is not connected on the server.', 503);
  const response = await fetchImpl(`${HEYGEN_BASE}${path}`, {
    ...options,
    headers: {
      'X-Api-Key': config.apiKey,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.error) {
    throw serviceError(
      result.error?.message || result.message || 'HeyGen could not process this request.',
      response.status || 502
    );
  }
  return result.data || result;
}

async function createCloneVideo(body, fetchImpl = fetch) {
  const config = settings();
  if (!config.avatarId || !config.voiceId) {
    throw serviceError('HeyGen avatar and voice IDs must be configured on the server.', 503);
  }
  const script = typeof body?.script === 'string' ? body.script.trim() : '';
  if (!script || script.length > 5000) throw serviceError('The presenter script is missing or too long.', 400);
  const portrait = body?.aspect_ratio !== '16:9';
  const data = await heygenRequest(
    '/v2/video/generate',
    {
      method: 'POST',
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: config.avatarId,
            avatar_style: body?.avatar_style === 'circle' ? 'circle' : 'normal',
          },
          voice: {
            type: 'text',
            voice_id: config.voiceId,
            input_text: script,
            speed: Number.isFinite(Number(body?.speed))
              ? Math.min(1.5, Math.max(0.5, Number(body.speed)))
              : 1,
          },
          background: {
            type: 'color',
            value: /^#[0-9a-f]{6}$/i.test(body?.background || '')
              ? body.background
              : '#111827',
          },
        }],
        dimension: portrait
          ? { width: 1080, height: 1920 }
          : { width: 1920, height: 1080 },
        aspect_ratio: portrait ? '9:16' : '16:9',
        title: typeof body?.title === 'string' ? body.title.slice(0, 120) : 'Everflow presenter video',
        test: body?.test === true,
      }),
    },
    fetchImpl
  );
  if (!data.video_id) throw serviceError('HeyGen returned no video ID.', 502);
  return { video_id: data.video_id, status: 'processing' };
}

async function getCloneVideo(videoId, fetchImpl = fetch) {
  if (typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{6,128}$/.test(videoId)) {
    throw serviceError('A valid HeyGen video ID is required.', 400);
  }
  const data = await heygenRequest(
    `/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
    { method: 'GET' },
    fetchImpl
  );
  return {
    video_id: videoId,
    status: data.status || 'unknown',
    video_url: data.video_url || null,
    thumbnail_url: data.thumbnail_url || null,
    duration: data.duration || null,
    error: data.error || null,
  };
}

module.exports = { publicStatus, createCloneVideo, getCloneVideo };
