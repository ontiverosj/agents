// Semrush Analytics API client — enriches analysis with live U.S. search data.
//
// Requires SEMRUSH_API_KEY (an API key from a Semrush plan with API units).
// Every response line consumes API units, so results are cached in-memory
// for 24h. When no key is configured, all functions return null and the app
// falls back to knowledge-base-only insights.

const BASE_URL = () => process.env.SEMRUSH_API_URL || 'https://api.semrush.com/';
const DATABASE = () => process.env.SEMRUSH_DATABASE || 'us';
const TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map();

function isEnabled() {
  return Boolean(process.env.SEMRUSH_API_KEY);
}

function parseCsv(text) {
  const lines = String(text).trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(';');
  return lines.slice(1).map((line) => {
    const values = line.split(';');
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i]; });
    return row;
  });
}

async function request(params) {
  if (!isEnabled()) return null;
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

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

async function keywordOverview(phrase) {
  const rows = await request({
    type: 'phrase_this',
    phrase,
    export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
  });
  if (!rows || !rows.length) return null;
  const r = rows[0];
  return {
    keyword: r['Keyword'] || phrase,
    volume: num(r['Search Volume']),
    cpc: num(r['CPC']),
    competition: num(r['Competition']),
    results: num(r['Number of Results']),
    trend: String(r['Trends'] || '').split(',').map(Number).filter(Number.isFinite),
  };
}

async function relatedKeywords(phrase, limit = 10) {
  const rows = await request({
    type: 'phrase_related',
    phrase,
    export_columns: 'Ph,Nq,Cp,Co',
    display_sort: 'nq_desc',
    display_limit: String(limit),
  });
  if (!rows) return [];
  return rows.map((r) => ({
    keyword: r['Keyword'],
    volume: num(r['Search Volume']),
    cpc: num(r['CPC']),
    competition: num(r['Competition']),
  })).filter((r) => r.keyword);
}

async function questionKeywords(phrase, limit = 8) {
  const rows = await request({
    type: 'phrase_questions',
    phrase,
    export_columns: 'Ph,Nq',
    display_sort: 'nq_desc',
    display_limit: String(limit),
  });
  if (!rows) return [];
  return rows.map((r) => ({
    keyword: r['Keyword'],
    volume: num(r['Search Volume']),
  })).filter((r) => r.keyword);
}

// Product inputs are often long ("Handmade soy candles with nostalgic
// scents"); search keywords are short. Try progressively shorter noun-phrase
// candidates until one has real search volume.
const STOP_WORDS = new Set(['a', 'an', 'the', 'my', 'our', 'your', 'some', 'small-batch', 'handmade', 'hand-poured', 'artisan', 'premium', 'custom', 'unique', 'high-quality', 'stylish', 'minimalist']);

function deriveKeywordCandidates(text) {
  let t = String(text || '').toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  // Drop trailing qualifier clauses: "... with nostalgic scents", "... for busy parents"
  t = t.split(/\s(?:with|for|that|which|inspired|made|designed|aimed)\s/)[0].trim();
  const words = t.split(' ').filter((w) => w && !STOP_WORDS.has(w));
  const candidates = [];
  if (words.length) candidates.push(words.join(' '));
  if (words.length > 3) candidates.push(words.slice(-3).join(' '));
  if (words.length > 2) candidates.push(words.slice(-2).join(' '));
  if (words.length > 1) candidates.push(words[words.length - 1]);
  return [...new Set(candidates)];
}

// Main enrichment entry point. Never throws — analysis must still work when
// Semrush is down, out of units, or finds nothing.
async function getSearchInsights(productText) {
  if (!isEnabled()) return null;
  try {
    let overview = null;
    for (const candidate of deriveKeywordCandidates(productText)) {
      overview = await keywordOverview(candidate);
      if (overview && overview.volume > 0) break;
      overview = null;
    }
    if (!overview) {
      return { available: true, matched: false, note: 'No U.S. search volume found for this phrase — try a more common product term.' };
    }
    const [related, questions] = await Promise.all([
      relatedKeywords(overview.keyword).catch(() => []),
      questionKeywords(overview.keyword).catch(() => []),
    ]);
    return {
      available: true,
      matched: true,
      database: DATABASE(),
      keyword: overview.keyword,
      volume: overview.volume,
      cpc: overview.cpc,
      competition: overview.competition,
      results: overview.results,
      trend: overview.trend,
      demandLabel: demandLabel(overview.volume),
      competitionLabel: competitionLabel(overview.competition),
      related,
      questions,
    };
  } catch (err) {
    console.error('Semrush enrichment failed:', err.message);
    return { available: true, matched: false, error: err.message };
  }
}

function demandLabel(volume) {
  if (volume >= 100000) return 'Mass-market demand';
  if (volume >= 10000) return 'Strong demand';
  if (volume >= 1000) return 'Healthy niche demand';
  if (volume > 0) return 'Emerging / micro-niche demand';
  return 'No measurable demand';
}

function competitionLabel(co) {
  if (co >= 0.8) return 'crowded paid market';
  if (co >= 0.5) return 'moderately competitive paid market';
  return 'low paid competition';
}

module.exports = { isEnabled, getSearchInsights, keywordOverview, relatedKeywords, questionKeywords, deriveKeywordCandidates, parseCsv };
