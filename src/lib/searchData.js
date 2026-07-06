// Search-demand enrichment dispatcher. Three interchangeable backends:
//
//   semrush-api — Semrush Analytics REST API (SEMRUSH_API_KEY)
//   semrush-mcp — Semrush's official MCP server (OAuth or Apikey header)
//   google      — Google Trends + Autocomplete (free, no key; the default)
//
// Selection: SEARCH_MODE=semrush-api|semrush-mcp|google|off forces one
// (legacy SEMRUSH_MODE=api|mcp still honored). Otherwise: Semrush API key
// wins if present, then a connected Semrush MCP, then Google as the free
// fallback so every install gets live data out of the box.

const semrushApi = require('./semrush');
const semrushMcp = require('./semrushMcp');
const google = require('./googleTrends');

function mode() {
  const forced = (process.env.SEARCH_MODE || '').toLowerCase();
  if (forced === 'off' || forced === 'none') return null;
  if (forced === 'google') return 'google';
  if (forced === 'semrush-api' || forced === 'api') return process.env.SEMRUSH_API_KEY ? 'semrush-api' : null;
  if (forced === 'semrush-mcp' || forced === 'mcp') return 'semrush-mcp';

  const legacy = (process.env.SEMRUSH_MODE || '').toLowerCase();
  if (legacy === 'api') return process.env.SEMRUSH_API_KEY ? 'semrush-api' : 'google';
  if (legacy === 'mcp') return 'semrush-mcp';

  if (process.env.SEMRUSH_API_KEY) return 'semrush-api';
  if (semrushMcp.isReady()) return 'semrush-mcp';
  return 'google';
}

function status() {
  const m = mode();
  return {
    mode: m,
    ready: m === 'semrush-mcp' ? semrushMcp.isReady() : m !== null,
    provider: m === 'google' ? 'Google Trends' : m ? 'Semrush' : null,
  };
}

// Never throws — analysis must still work when the data source is down,
// rate-limited, or finds nothing.
async function getSearchInsights(productText) {
  const m = mode();
  if (!m) return null;
  if (m === 'semrush-api') return semrushApi.getSearchInsights(productText);
  if (m === 'semrush-mcp') {
    if (!semrushMcp.isReady()) return { available: false, needsConnect: true, source: 'mcp' };
    return semrushMcp.getSearchInsights(productText);
  }
  return google.getSearchInsights(productText);
}

module.exports = { mode, status, getSearchInsights };
