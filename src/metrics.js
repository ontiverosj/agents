// Pure, dependency-free metric computation for the leads dashboard.
// Takes an array of mapped lead objects (see airtable.js getAllLeads) and
// returns the aggregates the executive dashboard renders. Kept side-effect free
// so it can be unit-tested / dry-run without Airtable or Express.

const DAY_MS = 24 * 60 * 60 * 1000;

// Parse a revenue value that may arrive as a number or a string like
// "$1,200,000" / "1.2M". Returns a number (0 when unparseable).
function parseRevenue(value) {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value !== 'string') return 0;
  const cleaned = value.trim().replace(/[$,\s]/g, '');
  const suffixMatch = cleaned.match(/^([0-9]*\.?[0-9]+)([kmb])$/i);
  if (suffixMatch) {
    const n = parseFloat(suffixMatch[1]);
    const mult = { k: 1e3, m: 1e6, b: 1e9 }[suffixMatch[2].toLowerCase()];
    return isFinite(n) ? n * mult : 0;
  }
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

function parseScore(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return isFinite(n) ? n : null;
}

// Group leads by a field, returning [{ label, count }] sorted desc by count.
function groupBy(leads, field) {
  const counts = new Map();
  for (const lead of leads) {
    const raw = lead[field];
    const label = raw === undefined || raw === null || raw === '' ? 'Unknown' : String(raw);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function computeMetrics(leads, now = Date.now()) {
  const safeLeads = Array.isArray(leads) ? leads : [];
  const total = safeLeads.length;

  let newThisWeek = 0;
  let pipelineValue = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  for (const lead of safeLeads) {
    const added = lead.dateAdded ? Date.parse(lead.dateAdded) : NaN;
    if (!isNaN(added) && now - added <= 7 * DAY_MS) newThisWeek += 1;

    pipelineValue += parseRevenue(lead.estimatedRevenue);

    const score = parseScore(lead.leadQualityScore);
    if (score !== null) {
      scoreSum += score;
      scoreCount += 1;
    }
  }

  const byStatus = groupBy(safeLeads, 'leadStatus');
  const bySource = groupBy(safeLeads, 'leadSource');
  const byPriority = groupBy(safeLeads, 'priority');
  const byIndustry = groupBy(safeLeads, 'industry').slice(0, 8);

  // "Qualified" / "won" style statuses count toward a simple qualified KPI.
  const qualified = byStatus
    .filter((s) => /qualif|won|closed won|hot/i.test(s.label))
    .reduce((sum, s) => sum + s.count, 0);

  const recent = [...safeLeads]
    .sort((a, b) => (Date.parse(b.dateAdded) || 0) - (Date.parse(a.dateAdded) || 0))
    .slice(0, 10);

  return {
    kpis: {
      total,
      newThisWeek,
      qualified,
      pipelineValue,
      avgQualityScore: scoreCount ? scoreSum / scoreCount : null,
    },
    byStatus,
    bySource,
    byPriority,
    byIndustry,
    recent,
  };
}

module.exports = { computeMetrics, parseRevenue, groupBy };
