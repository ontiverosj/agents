import express from 'express';
import { createHmac, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const title = 'Format Finder for Jake Eats';
const scope = 'format:read format:generate';
const freeTools = new Set(['list_formats', 'get_format', 'check_credits', 'check_job']);
const allowedTools = new Set([...freeTools, 'brainstorm', 'generate_hooks', 'generate_script', 'generate_shot_plan', 'generate_caption']);
const id = () => randomBytes(32).toString('base64url');
const equal = (a, b) => {
  const x = createHash('sha256').update(String(a)).digest();
  const y = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(x, y);
};
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const page = body => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><body><main><h1>${title}</h1>${body}</main></body></html>`;

export function createApp(config, makeUpstream) {
  const app = express();
  const origin = new URL(config.origin).origin;
  const resource = `${origin}/mcp`;
  const ready = () => Boolean(config.apiKey && config.password?.length >= 16 && config.signingKey?.length >= 32);
  const codes = new Map();
  const pending = new Map();
  const attempts = new Map();
  const challenge = `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource", scope="${scope}"`;
  const sign = (type, data, seconds) => {
    const payload = Buffer.from(JSON.stringify({ ...data, type, iss: origin, exp: Math.floor(Date.now()/1000) + seconds })).toString('base64url');
    return `${payload}.${createHmac('sha256', config.signingKey).update(payload).digest('base64url')}`;
  };
  const verify = (token, type) => {
    if (!config.signingKey || typeof token !== 'string' || token.length > 16000) throw Error('invalid token');
    const [payload, mac, extra] = token.split('.');
    if (extra || !payload || !mac || !equal(mac, createHmac('sha256', config.signingKey).update(payload).digest('base64url'))) throw Error('invalid token');
    const data = JSON.parse(Buffer.from(payload, 'base64url'));
    if (data.type !== type || data.iss !== origin || data.exp <= Date.now()/1000) throw Error('expired token');
    return data;
  };
  const redirects = uri => {
    try {
      const u = new URL(uri);
      return u.origin === 'https://chatgpt.com' && !u.search && !u.hash &&
        (u.pathname === '/connector_platform_oauth_redirect' || /^\/connector\/oauth\/[A-Za-z0-9_-]+$/.test(u.pathname));
    } catch { return false; }
  };
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" });
    next();
  });
  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));
  app.get('/', (req, res) => res.type('html').send(page(ready()
    ? '<p>Your service is ready to connect. In ChatGPT, add this server using OAuth authentication.</p><p>MCP endpoint: '+escape(resource)+'</p>'
    : '<p>Setup required. In this service’s Render Environment settings, add FORMAT_FINDER_API_KEY and a unique JAKE_EATS_CONNECT_PASSWORD (at least 16 characters). Save and redeploy.</p>')));
  app.get('/health', (req, res) => res.json({ service: title, status: ready() ? 'ready' : 'setup_required' }));
  app.get('/.well-known/oauth-protected-resource', (req, res) => res.json({ resource, authorization_servers: [origin], scopes_supported: scope.split(' ') }));
  app.get('/.well-known/oauth-protected-resource/mcp', (req, res) => res.redirect('/.well-known/oauth-protected-resource'));
  app.get('/.well-known/oauth-authorization-server', (req, res) => res.json({
    issuer: origin, authorization_endpoint: `${origin}/authorize`, token_endpoint: `${origin}/token`,
    registration_endpoint: `${origin}/register`, response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'], token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'], scopes_supported: scope.split(' '),
    authorization_response_iss_parameter_supported: true
  }));
  const setupGate = (req, res, next) => ready() ? next() : res.status(503).json({ error: 'temporarily_unavailable', error_description: 'Complete the Render environment setup first.' });
  const rateLimit = (req, res, next) => {
    const now = Date.now();
    for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
    const key = req.ip;
    if (!attempts.has(key)) attempts.set(key, { count: 0, until: now + 600000 });
    const value = attempts.get(key);
    if (++value.count > 30 || attempts.size > 10000) return res.status(429).json({ error: 'slow_down' });
    next();
  };
  app.post('/register', setupGate, rateLimit, (req, res) => {
    const uris = req.body.redirect_uris;
    if (!Array.isArray(uris) || !uris.length || uris.length > 5 || !uris.every(redirects) ||
        (req.body.token_endpoint_auth_method && req.body.token_endpoint_auth_method !== 'none')) {
      return res.status(400).json({ error: 'invalid_client_metadata' });
    }
    // Signed client metadata survives restarts without storing credentials on disk.
    res.status(201).json({ client_id: sign('client', { redirects: uris, nonce: id() }, 31536000),
      redirect_uris: uris, token_endpoint_auth_method: 'none', grant_types: ['authorization_code'], response_types: ['code'], client_name: title });
  });
  app.get('/authorize', setupGate, rateLimit, (req, res) => {
    try {
      const q = req.query;
      const client = verify(q.client_id, 'client');
      if (!client.redirects.includes(q.redirect_uri) || !redirects(q.redirect_uri) || q.response_type !== 'code' ||
          q.code_challenge_method !== 'S256' || typeof q.code_challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(q.code_challenge) ||
          q.resource !== resource || (q.scope && q.scope.split(' ').some(s => !scope.split(' ').includes(s))) ||
          (q.state && (typeof q.state !== 'string' || q.state.length > 2048))) throw Error();
      const now = Date.now();
      for (const [k,v] of pending) if (v.exp < now) pending.delete(k);
      if (pending.size >= 1000) return res.sendStatus(429);
      const request = id(), csrf = id();
      pending.set(request, { clientId: q.client_id, redirect: q.redirect_uri, challenge: q.code_challenge,
        state: q.state || '', csrf, scope: q.scope || scope, exp: now + 300000 });
      res.cookie('ff_consent', csrf, { httpOnly: true, secure: origin.startsWith('https:'), sameSite: 'lax', path: '/authorize', maxAge: 300000 });
      res.type('html').send(page(`<p>Allow ChatGPT to read your Format Finder formats and credit balance, and generate hooks, scripts, shot plans and captions. Generations use your Format Finder credits.</p><p>This connection expires after 30 days; reconnect then. Use the connection password you set in Render, not your API key.</p><form method="post" action="/authorize"><input type="hidden" name="request" value="${request}"><label>Connection password <input type="password" name="password" required autocomplete="current-password"></label><button type="submit">Connect Format Finder</button></form>`));
    } catch { res.status(400).send('Invalid authorization request. Restart the connection in ChatGPT.'); }
  });
  app.post('/authorize', setupGate, rateLimit, (req, res) => {
    const p = pending.get(req.body.request);
    const cookie = (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('ff_consent='))?.slice(11);
    if (!p || p.exp < Date.now() || req.headers.origin !== origin || !equal(cookie || '', p.csrf)) return res.sendStatus(400);
    if (!equal(req.body.password || '', config.password)) return res.status(403).send('Incorrect password. Go back and retry.');
    pending.delete(req.body.request);
    for (const [k,v] of codes) if (v.exp < Date.now()) codes.delete(k);
    const code = id();
    codes.set(code, { ...p, exp: Date.now() + 120000 });
    const dest = new URL(p.redirect);
    dest.searchParams.set('code', code); dest.searchParams.set('state', p.state); dest.searchParams.set('iss', origin);
    res.clearCookie('ff_consent', { path: '/authorize' });
    res.redirect(dest.toString());
  });
  app.post('/token', setupGate, rateLimit, (req, res) => {
    const b = req.body, c = codes.get(b.code);
    if (!c || c.exp < Date.now() || b.grant_type !== 'authorization_code' || c.clientId !== b.client_id ||
        c.redirect !== b.redirect_uri || b.resource !== resource || typeof b.code_verifier !== 'string' ||
        !/^[A-Za-z0-9._~-]{43,128}$/.test(b.code_verifier) ||
        !equal(createHash('sha256').update(b.code_verifier).digest('base64url'), c.challenge)) {
      return res.status(400).json({ error: 'invalid_grant' });
    }
    codes.delete(b.code);
    const expires = 30 * 86400;
    res.json({ access_token: sign('access', { aud: resource, scope: c.scope, clientId: c.clientId, sub: 'jake-eats-owner', nonce: id() }, expires),
      token_type: 'Bearer', expires_in: expires, scope: c.scope });
  });
  const auth = (req, res, next) => {
    try {
      const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
      const token = verify(match?.[1], 'access');
      if (token.aud !== resource || !token.scope.split(' ').includes('format:read')) throw Error();
      req.ffAuth = token; next();
    } catch { res.set('WWW-Authenticate', challenge).status(401).json({ error: 'unauthorized' }); }
  };
  let upstreamPromise;
  const upstream = () => upstreamPromise ??= makeUpstream().catch(e => { upstreamPromise = undefined; throw e; });
  app.post('/mcp', auth, setupGate, async (req, res) => {
    if (req.headers.origin && req.headers.origin !== origin && req.headers.origin !== 'https://chatgpt.com') return res.sendStatus(403);
    const server = new Server({ name: 'format-finder-for-jake-eats', version: '1.0.0' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      const u = await upstream();
      const result = await u.listTools();
      return { tools: result.tools.filter(t=>allowedTools.has(t.name)).map(t=>({ ...t,
        annotations: { readOnlyHint: freeTools.has(t.name), destructiveHint: false, idempotentHint: freeTools.has(t.name), openWorldHint: true },
        securitySchemes: [{ type: 'oauth2', scopes: freeTools.has(t.name) ? ['format:read'] : ['format:read', 'format:generate'] }]
      })) };
    });
    server.setRequestHandler(CallToolRequestSchema, async request => {
      if (!allowedTools.has(request.params.name)) throw Error('Unknown tool');
      if (!freeTools.has(request.params.name) && !req.ffAuth.scope.split(' ').includes('format:generate')) {
        return { isError: true, content: [{ type: 'text', text: 'Reconnect with generation permission.' }], _meta: { 'mcp/www_authenticate': [challenge] } };
      }
      try { return await (await upstream()).callTool(request.params); }
      catch { return { isError: true, content: [{ type:'text', text:'Format Finder request failed. Check the key and service status; do not automatically retry paid generation.' }] }; }
    });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => { void transport.close(); void server.close(); });
    try { await server.connect(transport); await transport.handleRequest(req, res, req.body); }
    catch { if (!res.headersSent) res.status(502).json({ error: 'upstream_unavailable' }); }
  });
  app.all('/mcp', auth, (req,res)=>res.status(405).set('Allow','POST').end());
  app.use((err,req,res,next)=>{ if (!res.headersSent) res.status(400).json({ error: 'invalid_request' }); });
  return app;
}

async function productionUpstream() {
  const client = new Client({ name: 'jake-eats-bridge', version: '1.0.0' });
  const entry = fileURLToPath(new URL('./node_modules/@format-finder/mcp-server/dist/index.js', import.meta.url));
  // Pass only the required secret to the upstream process; never log it.
  const transport = new StdioClientTransport({ command: process.execPath, args: [entry],
    env: { PATH: process.env.PATH, FORMAT_FINDER_API_KEY: process.env.FORMAT_FINDER_API_KEY }, stderr: 'pipe' });
  await client.connect(transport);
  return client;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = createApp({ origin: process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
    apiKey: process.env.FORMAT_FINDER_API_KEY, password: process.env.JAKE_EATS_CONNECT_PASSWORD, signingKey: process.env.MCP_SIGNING_KEY }, productionUpstream);
  app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`${title} started`));
}
