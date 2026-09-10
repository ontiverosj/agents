const crypto = require('crypto');

const ADOBE_AUTHORIZE_URL = 'https://ims-na1.adobelogin.com/ims/authorize/v2';
const ADOBE_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const signature = (payload, secret) => crypto.createHmac('sha256', secret).update(payload).digest('base64url');

const createOAuthState = ({ secret, now = Date.now, ttlMs = 10 * 60 * 1000 }) => {
  if (!secret) throw new Error('Adobe OAuth state secret is unavailable');
  const payload = encode({ exp: now() + ttlMs, nonce: crypto.randomBytes(16).toString('hex') });
  return `${payload}.${signature(payload, secret)}`;
};

const verifyOAuthState = ({ state, secret, now = Date.now }) => {
  if (typeof state !== 'string' || !secret) return false;
  const [payload, supplied, extra] = state.split('.');
  if (!payload || !supplied || extra) return false;
  const expected = signature(payload, secret);
  const actualBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isFinite(decoded.exp) && decoded.exp >= now();
  } catch {
    return false;
  }
};

const createAdobeClient = ({ env = process.env, fetchImpl = fetch, now = Date.now } = {}) => {
  let token = null;
  const configuration = () => ({
    clientId: env.ADOBE_CLIENT_ID?.trim(),
    clientSecret: env.ADOBE_CLIENT_SECRET?.trim(),
    redirectUri: env.ADOBE_REDIRECT_URI?.trim(),
    scopes: env.ADOBE_SCOPES?.trim() || 'openid,AdobeID,creative_cloud',
    stateSecret: env.ADOBE_OAUTH_STATE_SECRET?.trim() || env.ADOBE_CLIENT_SECRET?.trim(),
  });
  const isConfigured = () => {
    const config = configuration();
    return Boolean(config.clientId && config.clientSecret && config.redirectUri && config.stateSecret);
  };
  const getAuthorizationUrl = () => {
    const config = configuration();
    if (!isConfigured()) throw new Error('Adobe OAuth is not configured');
    const url = new URL(ADOBE_AUTHORIZE_URL);
    url.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes,
      state: createOAuthState({ secret: config.stateSecret, now }),
    }).toString();
    return url.toString();
  };
  const exchangeCode = async ({ code, state }) => {
    const config = configuration();
    if (!isConfigured()) throw new Error('Adobe OAuth is not configured');
    if (!verifyOAuthState({ state, secret: config.stateSecret, now })) {
      const error = new Error('Invalid or expired Adobe OAuth state');
      error.statusCode = 400;
      throw error;
    }
    if (typeof code !== 'string' || !code) {
      const error = new Error('Adobe authorization code is missing');
      error.statusCode = 400;
      throw error;
    }
    const response = await fetchImpl(ADOBE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code,
        grant_type: 'authorization_code', redirect_uri: config.redirectUri }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) {
      const error = new Error('Adobe token exchange failed');
      error.statusCode = 502;
      throw error;
    }
    token = { accessToken: body.access_token, refreshToken: body.refresh_token || null,
      expiresAt: now() + Math.max(0, Number(body.expires_in || 0) * 1000) };
    return { connected: true, expiresAt: token.expiresAt };
  };
  const status = () => ({ configured: isConfigured(),
    connected: Boolean(token?.accessToken && token.expiresAt > now()), expires_at: token?.expiresAt || null });
  return { exchangeCode, getAuthorizationUrl, status };
};

const verifyWebhookSignature = ({ rawBody, signature: supplied, secret }) => {
  if (!rawBody || typeof supplied !== 'string' || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const actual = supplied.replace(/^sha256=/i, '');
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

module.exports = { ADOBE_AUTHORIZE_URL, ADOBE_TOKEN_URL, createAdobeClient, createOAuthState,
  verifyOAuthState, verifyWebhookSignature };
