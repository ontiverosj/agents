// Semrush MCP client — fetches the same search-demand data as the Analytics
// API, but over Semrush's official MCP server (https://mcp.semrush.com/v2/mcp,
// streamable HTTP). Two auth methods, matching Semrush's docs:
//
//   1. API key:  SEMRUSH_MCP_API_KEY sent as "Authorization: Apikey <key>"
//   2. OAuth:    the default. BrandForge runs the full flow — dynamic client
//      registration, PKCE, browser redirect via /api/semrush/connect, token
//      exchange on /api/semrush/callback — and persists tokens to
//      data/semrush-oauth.json (gitignored).
//
// The Semrush MCP exposes reports through three tools:
//   keyword_research (report discovery) -> get_report_schema -> execute_report
// We call execute_report with the standard SEO-API report names.

const fs = require('fs');
const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
const { UnauthorizedError } = require('@modelcontextprotocol/sdk/client/auth.js');
const { parseCsv, normalizeRow, deriveKeywordCandidates, composeInsights, NO_MATCH } = require('./searchCommon');

const AUTH_FILE = path.join(__dirname, '..', '..', 'data', 'semrush-oauth.json');
const MCP_URL = () => process.env.SEMRUSH_MCP_URL || 'https://mcp.semrush.com/v2/mcp';
const DATABASE = () => process.env.SEMRUSH_DATABASE || 'us';
const CALL_TIMEOUT_MS = 25000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const REPORTS = {
  overview: () => process.env.SEMRUSH_MCP_REPORT_OVERVIEW || 'phrase_this',
  related: () => process.env.SEMRUSH_MCP_REPORT_RELATED || 'phrase_related',
  questions: () => process.env.SEMRUSH_MCP_REPORT_QUESTIONS || 'phrase_questions',
};

// ---------- OAuth credential persistence ----------

function readAuth() {
  try { return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')); } catch { return {}; }
}

function writeAuth(data) {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2));
}

// Implements the SDK's OAuthClientProvider interface with file-backed state,
// capturing the authorization URL instead of redirecting (we're server-side).
class FileOAuthProvider {
  constructor(redirectUrl) {
    this._redirectUrl = redirectUrl;
    this.pendingAuthUrl = null;
  }
  get redirectUrl() {
    return this._redirectUrl || readAuth().redirectUrl || 'http://localhost:3000/api/semrush/callback';
  }
  get clientMetadata() {
    return {
      client_name: 'BrandForge',
      redirect_uris: [this.redirectUrl],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
    };
  }
  clientInformation() { return readAuth().clientInformation; }
  saveClientInformation(info) { writeAuth({ ...readAuth(), clientInformation: info, redirectUrl: this.redirectUrl }); }
  tokens() { return readAuth().tokens; }
  saveTokens(tokens) { writeAuth({ ...readAuth(), tokens }); }
  redirectToAuthorization(authorizationUrl) { this.pendingAuthUrl = String(authorizationUrl); }
  saveCodeVerifier(verifier) { writeAuth({ ...readAuth(), codeVerifier: verifier }); }
  codeVerifier() {
    const v = readAuth().codeVerifier;
    if (!v) throw new Error('No PKCE code verifier saved — restart the connect flow.');
    return v;
  }
  invalidateCredentials(scope) {
    const data = readAuth();
    if (scope === 'all') return writeAuth({ redirectUrl: data.redirectUrl });
    if (scope === 'client') delete data.clientInformation;
    if (scope === 'tokens') delete data.tokens;
    if (scope === 'verifier') delete data.codeVerifier;
    writeAuth(data);
  }
}

// ---------- Connection management ----------

function makeTransport(redirectUrl) {
  const url = new URL(MCP_URL());
  const apiKey = process.env.SEMRUSH_MCP_API_KEY;
  if (apiKey) {
    return new StreamableHTTPClientTransport(url, {
      requestInit: { headers: { Authorization: `Apikey ${apiKey}` } },
    });
  }
  return new StreamableHTTPClientTransport(url, { authProvider: new FileOAuthProvider(redirectUrl) });
}

let clientPromise = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new Client({ name: 'brandforge', version: '1.0.0' });
      await client.connect(makeTransport());
      return client;
    })();
  }
  try {
    return await clientPromise;
  } catch (err) {
    clientPromise = null;
    throw err;
  }
}

function resetClient() {
  if (clientPromise) {
    clientPromise.then((c) => c.close()).catch(() => {});
  }
  clientPromise = null;
}

// ---------- Auth flow (used by /api/semrush/connect + /callback) ----------

async function beginAuth(redirectUrl) {
  if (process.env.SEMRUSH_MCP_API_KEY) return { alreadyConnected: true };
  writeAuth({ ...readAuth(), redirectUrl });
  const provider = new FileOAuthProvider(redirectUrl);
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL()), { authProvider: provider });
  const client = new Client({ name: 'brandforge', version: '1.0.0' });
  try {
    await client.connect(transport);
    await client.close().catch(() => {});
    return { alreadyConnected: true };
  } catch (err) {
    if (err instanceof UnauthorizedError && provider.pendingAuthUrl) {
      return { authUrl: provider.pendingAuthUrl };
    }
    throw err;
  }
}

async function finishAuth(code) {
  const provider = new FileOAuthProvider();
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL()), { authProvider: provider });
  await transport.finishAuth(code);
  resetClient(); // next call reconnects with the fresh tokens
}

function disconnect() {
  writeAuth({});
  resetClient();
}

function isReady() {
  return Boolean(process.env.SEMRUSH_MCP_API_KEY) || Boolean(readAuth().tokens);
}

function authMethod() {
  if (process.env.SEMRUSH_MCP_API_KEY) return 'apikey';
  if (readAuth().tokens) return 'oauth';
  return null;
}

// ---------- Report execution ----------

const cache = new Map();

function extractText(result) {
  const block = (result.content || []).find((c) => c.type === 'text');
  const text = block ? block.text : '';
  if (result.isError) throw new Error(text.slice(0, 200) || 'Semrush MCP tool error');
  return text;
}

function extractRows(text) {
  const t = String(text).trim();
  if (!t) return [];
  if (t.startsWith('ERROR')) {
    if (/NOTHING FOUND/i.test(t)) return [];
    throw new Error(t.slice(0, 140));
  }
  try {
    const json = JSON.parse(t);
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.rows)) return json.rows;
    if (json && Array.isArray(json.data)) return json.data;
    if (json && typeof json === 'object') return [json];
  } catch { /* not JSON — fall through to CSV */ }
  return parseCsv(t);
}

async function callTool(name, args) {
  const client = await getClient();
  try {
    return await client.callTool({ name, arguments: args }, undefined, { timeout: CALL_TIMEOUT_MS });
  } catch (err) {
    resetClient(); // drop possibly-broken session; next call reconnects
    throw err;
  }
}

async function executeReport(report, params) {
  const cacheKey = JSON.stringify(['mcp', report, params]);
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.rows;
  let result;
  try {
    result = await callTool('execute_report', { report, params });
  } catch (err) {
    // Help operators diagnose report-name mismatches: surface what the
    // server actually offers, once, in the logs.
    if (/unknown|invalid|not found/i.test(err.message)) {
      try {
        const discovery = await callTool('keyword_research', {});
        console.error(`Semrush MCP report "${report}" rejected. Available reports:\n${extractText(discovery).slice(0, 800)}`);
      } catch { /* discovery unavailable — nothing more to add */ }
    }
    throw err;
  }
  const rows = extractRows(extractText(result));
  cache.set(cacheKey, { rows, expires: Date.now() + CACHE_TTL_MS });
  return rows;
}

// ---------- Search insights (same shape as the API client) ----------

async function getSearchInsights(productText) {
  if (!isReady()) return null;
  try {
    let overview = null;
    for (const candidate of deriveKeywordCandidates(productText)) {
      const rows = await executeReport(REPORTS.overview(), { phrase: candidate, database: DATABASE() });
      if (rows.length) {
        const norm = normalizeRow(rows[0]);
        if (norm.volume > 0) { overview = { ...norm, keyword: norm.keyword || candidate }; break; }
      }
    }
    if (!overview) return { ...NO_MATCH, source: 'mcp' };

    const [relatedRows, questionRows] = await Promise.all([
      executeReport(REPORTS.related(), { phrase: overview.keyword, database: DATABASE(), display_limit: 10, display_sort: 'nq_desc' }).catch(() => []),
      executeReport(REPORTS.questions(), { phrase: overview.keyword, database: DATABASE(), display_limit: 8, display_sort: 'nq_desc' }).catch(() => []),
    ]);
    const related = relatedRows.map(normalizeRow).filter((r) => r.keyword)
      .map((r) => ({ keyword: r.keyword, volume: r.volume, cpc: r.cpc, competition: r.competition }));
    const questions = questionRows.map(normalizeRow).filter((r) => r.keyword)
      .map((r) => ({ keyword: r.keyword, volume: r.volume }));

    return composeInsights({ overview, related, questions, database: DATABASE(), source: 'mcp' });
  } catch (err) {
    console.error('Semrush MCP enrichment failed:', err.message);
    return { available: true, matched: false, source: 'mcp', error: err.message };
  }
}

module.exports = { getSearchInsights, beginAuth, finishAuth, disconnect, isReady, authMethod };
