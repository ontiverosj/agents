// Pure registry that combines the Claude subagents (parsed from .claude/agents)
// with the operational agents that make up the Everflow pipeline, and derives the
// counts + stage map the agents dashboard renders. Dependency-free / testable.

// Operational (non-Claude) agents in the acquisition pipeline. Keep in sync with
// the actual scripts/endpoints in the repo.
const OPERATIONAL_AGENTS = [
  {
    name: 'Lead Sourcing Agent',
    kind: 'Python', stage: 'Source', status: 'active',
    entrypoint: 'lead_sourcing_agent.py',
    does: 'Apollo firmographic net + Buy Box v2.0 disqualifiers + partial succession scoring → ranked prospects.json.',
  },
  {
    name: 'Deep Enrichment (Clay)',
    kind: 'External', stage: 'Enrich', status: 'external',
    entrypoint: 'Clay table (webhook)',
    does: 'Owner age/tenure, recurring-revenue %, BizBuySell check → fills known_succession_signals.',
  },
  {
    name: 'Qualification Agent',
    kind: 'Planned', stage: 'Qualify', status: 'planned',
    entrypoint: '—',
    does: 'Applies the FULL Buy Box on enriched data; turns "enrich" into proceed/hold and writes qualified deals.',
  },
  {
    name: 'Outreach Agent',
    kind: 'Planned', stage: 'Outreach', status: 'planned',
    entrypoint: '—',
    does: 'Owner-to-owner outreach in Jake’s voice; routes replies (suppress opt-outs, hand the rest to Shifa).',
  },
  {
    name: 'Compliance Helper',
    kind: 'Python', stage: 'Guard', status: 'active',
    entrypoint: 'compliance.py',
    does: 'CAN-SPAM footer + opt-out detection + suppression.txt that feeds back into sourcing.',
  },
  {
    name: 'Scout',
    kind: 'Endpoint', stage: 'CRM', status: 'active',
    entrypoint: 'POST /agent/scout',
    does: 'Fetch a single lead by id from the Airtable "Acquisition Leads" base.',
  },
];

// The linear deal flow, with which agent owns each stage.
const STAGE_FLOW = [
  { stage: 'Source', owner: 'Lead Sourcing Agent' },
  { stage: 'Enrich', owner: 'Deep Enrichment (Clay)' },
  { stage: 'Qualify', owner: 'Qualification Agent' },
  { stage: 'Outreach', owner: 'Outreach Agent' },
];

function buildRegistry(claudeAgents = [], opAgents = OPERATIONAL_AGENTS) {
  const claude = (claudeAgents || []).map((a) => ({
    name: a.name || '(unnamed)',
    description: a.description || '',
    model: a.model || 'inherit',
    role: 'Claude subagent',
  }));

  const ops = opAgents || [];
  const kpis = {
    total: claude.length + ops.length,
    claude: claude.length,
    active: ops.filter((a) => a.status === 'active').length,
    planned: ops.filter((a) => a.status === 'planned').length,
  };

  // Resolve stage flow against current op statuses for the flow strip.
  const statusByName = Object.fromEntries(ops.map((a) => [a.name, a.status]));
  const flow = STAGE_FLOW.map((s) => ({ ...s, status: statusByName[s.owner] || 'planned' }));

  return { claudeAgents: claude, opAgents: ops, kpis, flow };
}

module.exports = { buildRegistry, OPERATIONAL_AGENTS, STAGE_FLOW };
