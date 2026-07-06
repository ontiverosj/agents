// Free search-demand backend: Google Trends (interest trend, related and
// rising queries) + Google Autocomplete (the questions people actually type).
// No API key, no account.
//
// Google Trends has no official API; this uses the same internal endpoints
// the trends.google.com site calls (the pytrends approach):
//   1. GET /trends/explore            — seeds the NID cookie
//   2. GET /trends/api/explore        — returns widget tokens (refreshes cookie)
//   3. GET /trends/api/widgetdata/*   — timeline + related queries
// Responses are prefixed with ")]}'," garbage that must be stripped, and the
// first API hit can 429 until the cookie is established — we retry once.
//
// Important caveat encoded in the output: Trends values are normalized per
// query (peak = 100), so they show momentum and seasonality, NOT absolute
// volume, and are not comparable across keywords.

const { deriveKeywordCandidates } = require('./searchCommon');

const TRENDS_BASE = () => process.env.GOOGLE_TRENDS_URL || 'https://trends.google.com';
const SUGGEST_BASE = () => process.env.GOOGLE_SUGGEST_URL || 'https://suggestqueries.google.com';
const GEO = () => (process.env.SEMRUSH_DATABASE || 'us').toUpperCase();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map();
const cookieJar = new Map();

function cookieHeader() {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function storeCookies(res) {
  const setCookies = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
  for (const c of setCookies) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) cookieJar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
}

async function gfetch(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers = { 'User-Agent': UA, Accept: '*/*' };
    const cookies = cookieHeader();
    if (cookies) headers.Cookie = cookies;
    const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
    storeCookies(res);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function stripPrefix(text) {
  const start = text.indexOf('{');
  if (start < 0) throw new Error('Unexpected Google Trends response format');
  return JSON.parse(text.slice(start));
}

async function ensureCookies(keyword) {
  if (cookieJar.has('NID')) return;
  await gfetch(`${TRENDS_BASE()}/trends/explore?geo=${GEO()}&q=${encodeURIComponent(keyword)}`).catch(() => {});
}

async function explore(keyword) {
  await ensureCookies(keyword);
  const req = {
    comparisonItem: [{ keyword, geo: GEO(), time: 'today 12-m' }],
    category: 0,
    property: '',
  };
  const url = `${TRENDS_BASE()}/trends/api/explore?hl=en-US&tz=360&req=${encodeURIComponent(JSON.stringify(req))}`;
  let res = await gfetch(url);
  if (res.status === 429) {
    // First hit often 429s while the cookie settles; the 429 itself
    // refreshes it. Retry once.
    res = await gfetch(url);
  }
  if (!res.ok) throw new Error(`Google Trends explore HTTP ${res.status}`);
  const { widgets } = stripPrefix(await res.text());
  return {
    timeseries: widgets.find((w) => w.id === 'TIMESERIES'),
    related: widgets.find((w) => w.id === 'RELATED_QUERIES'),
  };
}

async function widgetData(endpoint, widget) {
  const url = `${TRENDS_BASE()}/trends/api/widgetdata/${endpoint}?hl=en-US&tz=360` +
    `&req=${encodeURIComponent(JSON.stringify(widget.request))}&token=${encodeURIComponent(widget.token)}`;
  let res = await gfetch(url);
  if (res.status === 429) res = await gfetch(url);
  if (!res.ok) throw new Error(`Google Trends ${endpoint} HTTP ${res.status}`);
  return stripPrefix(await res.text());
}

// ---------- Autocomplete ----------

async function suggestions(query) {
  const url = `${SUGGEST_BASE()}/complete/search?client=firefox&hl=en&gl=${GEO().toLowerCase()}&q=${encodeURIComponent(query)}`;
  const res = await gfetch(url);
  if (!res.ok) return [];
  try {
    const data = JSON.parse(await res.text());
    return Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
  } catch {
    return [];
  }
}

const QUESTION_PREFIXES = ['how', 'why', 'are', 'is', 'can', 'what', 'do'];

async function questionQueries(keyword, limit = 8) {
  const batches = await Promise.all(
    QUESTION_PREFIXES.map((p) => suggestions(`${p} ${keyword}`).catch(() => []))
  );
  const seen = new Set();
  const out = [];
  for (const batch of batches) {
    for (const s of batch) {
      const q = s.trim();
      if (!q || seen.has(q)) continue;
      seen.add(q);
      out.push({ keyword: q });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ---------- Analysis ----------

function analyzeTimeline(timelineData) {
  const values = (timelineData || []).map((p) => (p.value && p.value[0]) || 0);
  const total = values.reduce((a, b) => a + b, 0);
  if (!values.length || total === 0) return null;
  const avg = Math.round(total / values.length);
  const half = Math.floor(values.length / 2);
  const first = values.slice(0, half);
  const second = values.slice(half);
  const avgOf = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  const a = avgOf(first);
  const b = avgOf(second);
  const momentum = a > 0 ? Math.round(((b - a) / a) * 100) : 100;
  let peakIdx = 0;
  values.forEach((v, i) => { if (v > values[peakIdx]) peakIdx = i; });
  const peakLabel = (timelineData[peakIdx].formattedAxisTime || '').replace(/\s\d+,/, ',');
  return { values, avg, momentum, peakLabel };
}

function trendLabel(momentum) {
  if (momentum >= 25) return 'Rising interest';
  if (momentum >= 8) return 'Growing interest';
  if (momentum <= -25) return 'Declining interest';
  if (momentum <= -8) return 'Cooling interest';
  return 'Steady interest';
}

function mapRelated(relatedJson, limit = 10) {
  const lists = (relatedJson && relatedJson.default && relatedJson.default.rankedList) || [];
  const top = (lists[0] && lists[0].rankedKeyword) || [];
  const rising = (lists[1] && lists[1].rankedKeyword) || [];
  const out = [];
  const seen = new Set();
  for (const r of rising.slice(0, 4)) {
    if (seen.has(r.query)) continue;
    seen.add(r.query);
    out.push({ keyword: r.query, rising: true, growth: r.formattedValue || 'Rising' });
  }
  for (const t of top) {
    if (out.length >= limit) break;
    if (seen.has(t.query)) continue;
    seen.add(t.query);
    out.push({ keyword: t.query, interest: t.value, rising: false });
  }
  return out;
}

// ---------- Public entry point (same contract as the Semrush backends) ----------

async function getSearchInsights(productText) {
  const cacheKey = `google:${GEO()}:${String(productText).toLowerCase().trim()}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.value;

  let value;
  try {
    let matchedKeyword = null;
    let timeline = null;
    let relatedWidget = null;
    for (const candidate of deriveKeywordCandidates(productText)) {
      const widgets = await explore(candidate);
      if (!widgets.timeseries) continue;
      const data = await widgetData('multiline', widgets.timeseries);
      const analyzed = analyzeTimeline(data.default && data.default.timelineData);
      if (analyzed) {
        matchedKeyword = candidate;
        timeline = analyzed;
        relatedWidget = widgets.related;
        break;
      }
    }
    if (!matchedKeyword) {
      value = {
        available: true, matched: false, source: 'google',
        note: 'Google Trends has no measurable interest for this phrase — try a more common product term.',
      };
    } else {
      const [relatedJson, questions] = await Promise.all([
        relatedWidget ? widgetData('relatedsearches', relatedWidget).catch(() => null) : null,
        questionQueries(matchedKeyword).catch(() => []),
      ]);
      value = {
        available: true,
        matched: true,
        source: 'google',
        database: GEO().toLowerCase(),
        keyword: matchedKeyword,
        interestIndex: timeline.avg,
        momentum: timeline.momentum,
        peakLabel: timeline.peakLabel,
        trend: timeline.values,
        demandLabel: trendLabel(timeline.momentum),
        related: mapRelated(relatedJson),
        questions,
        note: 'Google Trends shows interest relative to this keyword\'s own 12-month peak (100), not absolute search volume.',
      };
    }
  } catch (err) {
    console.error('Google Trends enrichment failed:', err.message);
    return { available: true, matched: false, source: 'google', error: err.message };
  }
  cache.set(cacheKey, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}

module.exports = { getSearchInsights, suggestions, questionQueries };
