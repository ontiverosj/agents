// Shared helpers for search-demand enrichment, used by both the Semrush
// Analytics API client (semrush.js) and the Semrush MCP client (semrushMcp.js).

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

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Semrush surfaces the same data under different key spellings depending on
// transport (CSV headers, short API codes, or JSON keys) — normalize them all.
const FIELD_ALIASES = {
  keyword: ['Keyword', 'Ph', 'keyword', 'phrase'],
  volume: ['Search Volume', 'Nq', 'search_volume', 'searchVolume', 'volume'],
  cpc: ['CPC', 'Cp', 'cpc'],
  competition: ['Competition', 'Co', 'competition'],
  results: ['Number of Results', 'Nr', 'number_of_results', 'results'],
  trend: ['Trends', 'Td', 'trends', 'trend'],
};

function normalizeRow(row) {
  const out = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (row[alias] !== undefined) { out[field] = row[alias]; break; }
    }
  }
  return {
    keyword: out.keyword !== undefined ? String(out.keyword) : undefined,
    volume: num(out.volume),
    cpc: num(out.cpc),
    competition: num(out.competition),
    results: num(out.results),
    trend: Array.isArray(out.trend)
      ? out.trend.map(Number).filter(Number.isFinite)
      : String(out.trend || '').split(',').map(Number).filter(Number.isFinite),
  };
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

// Assemble the searchData payload both clients return.
function composeInsights({ overview, related, questions, database, source }) {
  return {
    available: true,
    matched: true,
    source,
    database,
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
}

const NO_MATCH = {
  available: true,
  matched: false,
  note: 'No U.S. search volume found for this phrase — try a more common product term.',
};

module.exports = { parseCsv, num, normalizeRow, deriveKeywordCandidates, demandLabel, competitionLabel, composeInsights, NO_MATCH };
