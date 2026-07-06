// Semrush search-demand enrichment with two interchangeable backends:
//
//   api — the classic Analytics REST API (SEMRUSH_API_KEY; requires the
//         API-units add-on on most plans)
//   mcp — Semrush's official MCP server (see semrushMcp.js; included with
//         Semrush One Starter/Pro+ and SEO Classic Pro/Guru plans)
//
// Mode selection: SEMRUSH_MODE=api|mcp forces one; otherwise the API key
// wins if present, then MCP if it's configured (API key header or completed
// OAuth). With neither, enrichment is disabled and the app runs unenriched.
//
// Both backends return the identical searchData shape and cache for 24h.

const mcp = require('./semrushMcp');
const {
  parseCsv, normalizeRow, deriveKeywordCandidates, composeInsights, NO_MATCH,
} = require('./searchCommon');

const BASE_URL = () => process.env.SEMRUSH_API_URL || 'https://api.semrush.com/';
const DATABASE = () => process.env.SEMRUSH_DATABASE || 'us';
const TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map();

// ---------- Mode selection ----------

function mode() {
  const explicit = (process.env.SEMRUSH_MODE || '').toLowerCase();
  if (explicit === 'api') return process.env.SEMRUSH_API_KEY ? 'api' : null;
  if (explicit === 'mcp') return 'mcp';
  if (process.env.SEMRUSH_API_KEY) return 'api';
  if (mcp.isReady()) return 'mcp';
  return null;
}

function isEnabled() {
  return mode() !== null;
}

function status() {
  const m = mode();
  return {
    mode: m,
    ready: m === 'api' ? true : m === 'mcp' ? mcp.isReady() : false,
    authMethod: m === 'mcp' ? mcp.authMethod() : m === 'api' ? 'apikey' : null,
  };
}

// ---------- Analytics API backend ----------

async function request(params) {
  const cacheKey = JSON.stringify(params);
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.rows;

  const url = new URL(BASE_URL());
  url.search = new URLSearchParams({
    key: process.env.SEMRUSH_API_KEY,
    database: DATABASE(),
    ...params,
  }).toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    // Semrush signals errors in the body (often with HTTP 200),
    // e.g. "ERROR 50 :: NOTHING FOUND" or "ERROR 120 :: WRONG KEY - ID PAIR".
    if (text.startsWith('ERROR')) {
      if (/NOTHING FOUND/i.test(text)) {
        cache.set(cacheKey, { rows: [], expires: Date.now() + CACHE_TTL_MS });
        return [];
      }
      throw new Error(text.trim().slice(0, 140));
    }
    if (!res.ok) throw new Error(`Semrush HTTP ${res.status}`);
    const rows = parseCsv(text);
    cache.set(cacheKey, { rows, expires: Date.now() + CACHE_TTL_MS });
    return rows;
  } finally {
    clearTimeout(timer);
  }
}

async function keywordOverview(phrase) {
  const rows = await request({
    type: 'phrase_this',
    phrase,
    export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
  });
  if (!rows || !rows.length) return null;
  const norm = normalizeRow(rows[0]);
  return { ...norm, keyword: norm.keyword || phrase };
}

async function relatedKeywords(phrase, limit = 10) {
  const rows = await request({
    type: 'phrase_related',
    phrase,
    export_columns: 'Ph,Nq,Cp,Co',
    display_sort: 'nq_desc',
    display_limit: String(limit),
  });
  return (rows || []).map(normalizeRow).filter((r) => r.keyword)
    .map((r) => ({ keyword: r.keyword, volume: r.volume, cpc: r.cpc, competition: r.competition }));
}

async function questionKeywords(phrase, limit = 8) {
  const rows = await request({
    type: 'phrase_questions',
    phrase,
    export_columns: 'Ph,Nq',
    display_sort: 'nq_desc',
    display_limit: String(limit),
  });
  return (rows || []).map(normalizeRow).filter((r) => r.keyword)
    .map((r) => ({ keyword: r.keyword, volume: r.volume }));
}

async function getSearchInsightsViaApi(productText) {
  try {
    let overview = null;
    for (const candidate of deriveKeywordCandidates(productText)) {
      overview = await keywordOverview(candidate);
      if (overview && overview.volume > 0) break;
      overview = null;
    }
    if (!overview) return { ...NO_MATCH, source: 'api' };
    const [related, questions] = await Promise.all([
      relatedKeywords(overview.keyword).catch(() => []),
      questionKeywords(overview.keyword).catch(() => []),
    ]);
    return composeInsights({ overview, related, questions, database: DATABASE(), source: 'api' });
  } catch (err) {
    console.error('Semrush enrichment failed:', err.message);
    return { available: true, matched: false, source: 'api', error: err.message };
  }
}

// ---------- Dispatcher ----------

// Never throws — analysis must still work when Semrush is down, out of
// units, or finds nothing.
async function getSearchInsights(productText) {
  const m = mode();
  if (!m) return null;
  if (m === 'mcp') {
    if (!mcp.isReady()) return { available: false, needsConnect: true, source: 'mcp' };
    return mcp.getSearchInsights(productText);
  }
  return getSearchInsightsViaApi(productText);
}

module.exports = {
  isEnabled, mode, status, getSearchInsights,
  keywordOverview, relatedKeywords, questionKeywords,
  deriveKeywordCandidates, parseCsv,
};
