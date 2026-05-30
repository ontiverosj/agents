// Pure, dependency-free metrics for the Everflow acquisition pipeline.
// Input: the parsed prospects.json emitted by lead_sourcing_agent.py — either the
// full { run_meta, prospects } object or a bare prospects array. Output: the
// aggregates the pipeline dashboard renders. No I/O so it can be unit-tested.

const VERDICT_ORDER = ['proceed', 'enrich', 'hold', 'disqualify'];

function asPayload(input) {
  if (Array.isArray(input)) return { run_meta: {}, prospects: input };
  if (input && Array.isArray(input.prospects)) return { run_meta: input.run_meta || {}, prospects: input.prospects };
  return { run_meta: {}, prospects: [] };
}

// Group a list of string values into [{ label, count }] sorted desc by count.
function tally(values) {
  const counts = new Map();
  for (const v of values) {
    const label = v === undefined || v === null || v === '' ? 'Unknown' : String(v);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function ev(p) {
  return (p && p.evaluation) || {};
}

function computePipelineMetrics(input) {
  const { run_meta, prospects } = asPayload(input);
  const total = prospects.length;

  // Verdict counts in canonical funnel order (always present, even at zero).
  const verdictCounts = VERDICT_ORDER.map((v) => ({
    label: v,
    count: prospects.filter((p) => ev(p).verdict === v).length,
  }));
  const verdictMap = Object.fromEntries(verdictCounts.map((v) => [v.label, v.count]));

  const byTrack = tally(prospects.map((p) => p.track));
  const byIndustry = tally(prospects.map((p) => p.industry)).slice(0, 8);

  // Priority distribution among still-live prospects (not disqualified).
  const live = prospects.filter((p) => ev(p).verdict !== 'disqualify');
  const priorityDist = tally(
    live.map((p) => {
      const pr = ev(p).partial_priority;
      return Number.isFinite(pr) ? `P${pr}` : 'P?';
    })
  ).sort((a, b) => {
    const na = parseInt(a.label.slice(1), 10);
    const nb = parseInt(b.label.slice(1), 10);
    return (isNaN(nb) ? -1 : nb) - (isNaN(na) ? -1 : na);
  });

  // Why prospects fail the Buy Box (flatten all disqualifiers_failed).
  const topDisqualifiers = tally(
    prospects.flatMap((p) => ev(p).disqualifiers_failed || [])
  ).slice(0, 8);

  // What data is missing before qualification (revenue, founded_year, etc.).
  const topEnrichmentGaps = tally(
    prospects.flatMap((p) => ev(p).criteria_unknown_at_source || [])
  ).slice(0, 8);

  const avgLivePriority = live.length
    ? live.reduce((s, p) => s + (Number(ev(p).partial_priority) || 0), 0) / live.length
    : null;

  // Action queue: what to work next — live prospects by priority, highest first.
  const actionQueue = [...live]
    .sort((a, b) => (Number(ev(b).partial_priority) || 0) - (Number(ev(a).partial_priority) || 0))
    .slice(0, 12)
    .map((p) => ({
      company: p.company,
      owner: p.owner_name,
      track: p.track,
      industry: p.industry,
      verdict: ev(p).verdict,
      priority: ev(p).partial_priority,
      nextStep: ev(p).recommended_next_step,
      confirmed: (ev(p).signals_confirmed || []).length,
      gaps: (ev(p).criteria_unknown_at_source || []).length,
    }));

  return {
    runMeta: {
      buyBoxVersion: run_meta.buy_box_version || null,
      generated: run_meta.generated || null,
      track: run_meta.track || null,
      industry: run_meta.industry || null,
      toEnrich: Number.isFinite(run_meta.to_enrich) ? run_meta.to_enrich : verdictMap.enrich || 0,
      pushedToClay: Number.isFinite(run_meta.pushed_to_clay) ? run_meta.pushed_to_clay : null,
      dataHonesty: run_meta.data_honesty || null,
    },
    kpis: {
      total,
      proceed: verdictMap.proceed || 0,
      enrich: verdictMap.enrich || 0,
      hold: verdictMap.hold || 0,
      disqualified: verdictMap.disqualify || 0,
      avgLivePriority,
    },
    verdictCounts,
    byTrack,
    byIndustry,
    priorityDist,
    topDisqualifiers,
    topEnrichmentGaps,
    actionQueue,
  };
}

module.exports = { computePipelineMetrics, tally };
