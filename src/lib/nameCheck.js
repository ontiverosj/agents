// Name availability checker: USPTO trademark knockout search + domain
// availability + social handle check links.
//
// Data sources, chosen for reliability:
//   - Domains: registry RDAP (official, free, no key). 404 = available,
//     200 = registered. Verisign serves .com/.net directly; rdap.org
//     bootstraps other TLDs.
//   - Trademarks: Marker API (markerapi.com) searches the USPTO database;
//     free tier is 1,000 searches/month with username/password auth
//     (MARKER_API_USERNAME / MARKER_API_PASSWORD). Without credentials we
//     still return a pre-filled USPTO search link. The USPTO's own
//     tmsearch.uspto.gov sits behind an AWS WAF bot challenge, so it can't
//     be queried server-side reliably.
//   - Social handles: no platform offers an availability API and all block
//     server-side probing, so we return one-click check links — honest
//     "check manually" beats guessed data here.
//
// IMPORTANT: this is a knockout search, not legal clearance. Confusingly
// similar marks in related classes can still conflict. The API response
// carries a disclaimer that the UI must show.

// Only TLDs whose registries run official RDAP servers — popular TLDs
// without RDAP (.co, .io, .us) are deliberately excluded because absence
// of a record would falsely read as "available".
const RDAP_BASES = {
  com: 'https://rdap.verisign.com/com/v1/domain/',
  net: 'https://rdap.verisign.com/net/v1/domain/',
  org: 'https://rdap.publicinterestregistry.org/rdap/domain/',
  shop: 'https://rdap.gmoregistry.net/rdap/domain/',
};
const MARKER_URL = () => process.env.MARKER_API_URL || 'https://markerapi.com/api/v2/trademarks';
const TLDS = Object.keys(RDAP_BASES);
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map();

function cleanHandle(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Domains (RDAP) ----------

async function checkDomain(domain, attempt = 0) {
  const tld = domain.split('.').pop();
  const base = RDAP_BASES[tld];
  if (!base) return { domain, status: 'unknown' };
  try {
    const res = await fetchWithTimeout(`${base}${domain}`, { headers: { Accept: 'application/rdap+json' } });
    if (res.status === 404) return { domain, status: 'available' };
    if (res.ok) return { domain, status: 'taken' };
    throw new Error(`RDAP HTTP ${res.status}`);
  } catch (err) {
    if (attempt < 1) return checkDomain(domain, attempt + 1);
    console.error(`RDAP check failed for ${domain}:`, err.message);
    return { domain, status: 'unknown' };
  }
}

async function checkDomains(handle) {
  const key = `domains:${handle}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const results = await Promise.all(TLDS.map((tld) => checkDomain(`${handle}.${tld}`)));
  // Only cache clean results — "unknown" is usually a transient failure.
  if (results.every((r) => r.status !== 'unknown')) {
    cache.set(key, { value: results, expires: Date.now() + CACHE_TTL_MS });
  }
  return results;
}

// ---------- Trademarks (Marker API over the USPTO database) ----------

function markerConfigured() {
  return Boolean(process.env.MARKER_API_USERNAME && process.env.MARKER_API_PASSWORD);
}

async function searchTrademarks(name) {
  const user = encodeURIComponent(process.env.MARKER_API_USERNAME);
  const pass = encodeURIComponent(process.env.MARKER_API_PASSWORD);
  const term = encodeURIComponent(name);
  const url = `${MARKER_URL()}/trademark/${term}/status/active/start/1/username/${user}/password/${pass}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Trademark search HTTP ${res.status}`);
  const data = await res.json();
  const marks = Array.isArray(data.trademarks) ? data.trademarks : [];
  return marks.slice(0, 10).map((t) => ({
    wordmark: t.wordmark || t.trademark || '',
    serialNumber: t.serialnumber || t.serialNumber || '',
    status: t.status || '',
    description: (t.description || '').slice(0, 160),
    owner: t.owner || '',
    registrationDate: t.registrationdate || t.registrationDate || '',
  }));
}

function assessTrademarkRisk(name, marks) {
  if (!marks.length) {
    return {
      level: 'lower',
      summary: 'No active exact-word matches found in the USPTO database. This is a good first sign — but similar-sounding marks and related categories can still conflict.',
    };
  }
  const target = name.trim().toLowerCase();
  const exact = marks.some((m) => (m.wordmark || '').trim().toLowerCase() === target);
  if (exact) {
    return {
      level: 'high',
      summary: 'An ACTIVE trademark exactly matching this name exists. Using it for related goods or services is high-risk — strongly consider a different name or consult a trademark attorney.',
    };
  }
  return {
    level: 'medium',
    summary: `${marks.length} active mark(s) contain this name. Review whether any covers goods or services similar to yours before committing.`,
  };
}

// ---------- Check links (always provided) ----------

function buildLinks(name, handle) {
  return {
    uspto: `https://tmsearch.uspto.gov/search/search-information?query=${encodeURIComponent(name)}`,
    instagram: `https://www.instagram.com/${handle}/`,
    tiktok: `https://www.tiktok.com/@${handle}`,
    x: `https://x.com/${handle}`,
    youtube: `https://www.youtube.com/@${handle}`,
  };
}

// ---------- Public entry point ----------

async function checkName(name) {
  const trimmed = String(name || '').trim();
  const handle = cleanHandle(trimmed);
  if (!trimmed || !handle) throw new Error('A name is required.');

  const domainsPromise = checkDomains(handle);
  let trademarks = null;
  if (markerConfigured()) {
    const key = `tm:${trimmed.toLowerCase()}`;
    try {
      const hit = cache.get(key);
      let marks;
      if (hit && hit.expires > Date.now()) {
        marks = hit.value;
      } else {
        marks = await searchTrademarks(trimmed);
        cache.set(key, { value: marks, expires: Date.now() + CACHE_TTL_MS });
      }
      trademarks = { checked: true, matches: marks, risk: assessTrademarkRisk(trimmed, marks) };
    } catch (err) {
      console.error('Trademark search failed:', err.message);
      trademarks = { checked: false, error: err.message };
    }
  } else {
    trademarks = { checked: false, notConfigured: true };
  }

  return {
    name: trimmed,
    handle: `@${handle}`,
    domains: await domainsPromise,
    trademarks,
    links: buildLinks(trimmed, handle),
    disclaimer:
      'Automated checks are a first-pass knockout search, not legal clearance. Trademark law also covers confusingly similar names and related product categories, and state/common-law marks don\'t appear in USPTO records. Before investing in a name, verify on USPTO.gov and consider a professional clearance search or trademark attorney.',
  };
}

module.exports = { checkName, markerConfigured };
