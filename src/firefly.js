const TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';
const API_BASE = 'https://audio-video-api.adobe.io/v2';
const DEFAULT_SCOPES = 'openid,AdobeID,firefly_api,ff_apis';

const httpsUrl = (value, field) => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') throw new Error();
    return url.toString();
  } catch {
    const error = new Error(`${field} must be a valid HTTPS URL`);
    error.statusCode = 400;
    throw error;
  }
};

const createFireflyClient = ({ env = process.env, fetchImpl = fetch, now = Date.now } = {}) => {
  let cachedToken = null;
  const configuration = () => ({
    clientId: env.ADOBE_FIREFLY_CLIENT_ID?.trim(),
    clientSecret: env.ADOBE_FIREFLY_CLIENT_SECRET?.trim(),
    scopes: env.ADOBE_FIREFLY_SCOPES?.trim() || DEFAULT_SCOPES,
  });
  const isConfigured = () => {
    const config = configuration();
    return Boolean(config.clientId && config.clientSecret);
  };
  const status = () => ({
    configured: isConfigured(),
    token_valid: Boolean(cachedToken?.value && cachedToken.expiresAt > now() + 60_000),
    token_expires_at: cachedToken?.expiresAt || null,
  });
  const getAccessToken = async () => {
    if (cachedToken?.value && cachedToken.expiresAt > now() + 60 * 60 * 1000) return cachedToken.value;
    const config = configuration();
    if (!isConfigured()) {
      const error = new Error('Adobe Firefly is not configured');
      error.statusCode = 503;
      throw error;
    }
    const response = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: config.clientId,
        client_secret: config.clientSecret, scope: config.scopes }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) {
      const error = new Error('Adobe Firefly authentication failed');
      error.statusCode = 502;
      throw error;
    }
    cachedToken = { value: body.access_token,
      expiresAt: now() + Math.max(0, Number(body.expires_in || 86400) * 1000) };
    return cachedToken.value;
  };
  const request = async (path, options = {}) => {
    const config = configuration();
    const accessToken = await getAccessToken();
    const response = await fetchImpl(`${API_BASE}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${accessToken}`, 'x-api-key': config.clientId,
        'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.message || 'Adobe Firefly request failed');
      error.statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
      throw error;
    }
    return body;
  };
  const submitReframe = ({ sourceUrl, destinationUrl, width = 1080, height = 1920,
    focalPoints = [], sceneEditDetection = true }) => {
    const w = Number(width), h = Number(height);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 64 || h < 64 || w > 7680 || h > 7680) {
      const error = new Error('width and height must be integers between 64 and 7680');
      error.statusCode = 400;
      throw error;
    }
    const points = Array.isArray(focalPoints) ? focalPoints.filter((x) => typeof x === 'string' && x.trim())
      .slice(0, 10).map((x) => x.trim().slice(0, 100)) : [];
    return request('/reframe', { method: 'POST', body: JSON.stringify({
      video: { source: { url: httpsUrl(sourceUrl, 'source_url') } },
      analysis: { sceneEditDetection: sceneEditDetection !== false, ...(points.length ? { focalPoints: points } : {}) },
      output: { renditions: [{ resolution: { width: w, height: h },
        mediaDestination: { url: httpsUrl(destinationUrl, 'destination_url') } }] },
    }) });
  };
  const getJob = (jobId) => {
    if (typeof jobId !== 'string' || !/^[a-z0-9_-]{1,200}$/i.test(jobId)) {
      const error = new Error('Invalid Firefly job ID');
      error.statusCode = 400;
      throw error;
    }
    return request(`/status/${encodeURIComponent(jobId)}`, { method: 'GET' });
  };
  return { getAccessToken, getJob, status, submitReframe };
};

module.exports = { API_BASE, DEFAULT_SCOPES, TOKEN_URL, createFireflyClient, httpsUrl };
