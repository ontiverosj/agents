require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { getLeadById, getAllLeads } = require('./src/airtable');
const { computeMetrics } = require('./src/metrics');
const { renderDashboard } = require('./src/dashboard');
const { computePipelineMetrics } = require('./src/pipelineMetrics');
const { renderPipelineDashboard } = require('./src/pipelineDashboard');
const { parseFrontmatter } = require('./src/frontmatter');
const { buildRegistry } = require('./src/agentsRegistry');
const { renderAgentsDashboard } = require('./src/agentsDashboard');
const { listAgents, chatWithAgent } = require('./src/agentChat');
const { renderChatDashboard } = require('./src/chatDashboard');

// Read Claude subagent definitions from .claude/agents/*.md (frontmatter only).
function loadClaudeAgents() {
  const dir = path.join(__dirname, '.claude', 'agents');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .map((f) => parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8')).data)
    .filter((d) => d && d.name);
}

// Load the latest sourcing-agent output. Prefers PROSPECTS_FILE / data/prospects.json
// (the live run), falling back to the bundled sample so the dashboard always renders.
function loadProspects() {
  const candidates = [
    process.env.PROSPECTS_FILE,
    path.join(__dirname, 'data', 'prospects.json'),
    path.join(__dirname, 'data', 'prospects.sample.json'),
  ].filter(Boolean);

  for (const file of candidates) {
    if (file && fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const isSample = file.endsWith('prospects.sample.json');
      return { data, file, isSample };
    }
  }
  return { data: { prospects: [] }, file: null, isSample: false };
}

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Agent API is running' });
});

// GET /dashboard - Acquisition pipeline dashboard (sourcing-agent prospects.json)
app.get('/dashboard', (req, res) => {
  try {
    const { data, file, isSample } = loadProspects();
    let warning = null;
    if (!file) {
      warning = 'No prospects file found. Run lead_sourcing_agent.py to produce data/prospects.json.';
    } else if (isSample) {
      warning = 'Showing bundled sample data (data/prospects.sample.json). Set PROSPECTS_FILE or drop a live run at data/prospects.json.';
    }
    const metrics = computePipelineMetrics(data);
    res.status(200).send(renderPipelineDashboard(metrics, { warning }));
  } catch (error) {
    console.error('Error rendering pipeline dashboard:', error);
    res.status(500).send(`<pre>Failed to render dashboard: ${error.message}</pre>`);
  }
});

// GET /dashboard/agents - Fleet view of every agent (Claude subagents + pipeline)
app.get('/dashboard/agents', (req, res) => {
  try {
    const registry = buildRegistry(loadClaudeAgents());
    res.status(200).send(renderAgentsDashboard(registry));
  } catch (error) {
    console.error('Error rendering agents dashboard:', error);
    res.status(500).send(`<pre>Failed to render agents dashboard: ${error.message}</pre>`);
  }
});

// GET /dashboard/chat - Live chat UI for talking to the Claude subagents
app.get('/dashboard/chat', (req, res) => {
  try {
    const agents = listAgents();
    const warning = process.env.ANTHROPIC_API_KEY
      ? null
      : 'ANTHROPIC_API_KEY is not set in this environment — the agent will reply with a setup error until a key is configured.';
    res.status(200).send(renderChatDashboard(agents, { warning }));
  } catch (error) {
    console.error('Error rendering chat dashboard:', error);
    res.status(500).send(`<pre>Failed to render chat: ${error.message}</pre>`);
  }
});

// POST /agent/chat - Send a conversation to a Claude subagent, return its reply
app.post('/agent/chat', async (req, res) => {
  const { agent, messages } = req.body || {};
  try {
    const result = await chatWithAgent({ agentName: agent, messages });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    // Map known failure modes to friendly, actionable messages.
    const map = {
      NO_API_KEY: 'Chat is not configured: set ANTHROPIC_API_KEY on the server.',
      UNKNOWN_AGENT: `Unknown agent "${agent}".`,
      BAD_MESSAGES: 'The conversation was malformed (it must end with a user message).',
    };
    if (map[error.code]) {
      return res.status(400).json({ ok: false, error: map[error.code] });
    }
    if (error.constructor && error.constructor.name === 'AuthenticationError') {
      return res.status(502).json({ ok: false, error: 'Claude API rejected the API key (authentication error).' });
    }
    if (error.constructor && error.constructor.name === 'APIConnectionError') {
      return res.status(502).json({ ok: false, error: 'Could not reach the Claude API (network error in this environment).' });
    }
    console.error('Error in /agent/chat:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Internal error' });
  }
});

// GET /dashboard/leads - Airtable "Acquisition Leads" view (CRM-style snapshot)
app.get('/dashboard/leads', async (req, res) => {
  let leads = [];
  let warning = null;

  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    warning = 'Airtable is not configured (set AIRTABLE_API_KEY and AIRTABLE_BASE_ID). Showing empty pipeline.';
  } else {
    try {
      leads = await getAllLeads();
    } catch (error) {
      console.error('Error loading leads for dashboard:', error);
      warning = `Could not load leads from Airtable: ${error.message}. Showing empty pipeline.`;
    }
  }

  const metrics = computeMetrics(leads);
  res.status(200).send(renderDashboard(metrics, { warning }));
});

// POST /agent/scout - Fetch lead by lead_id
app.post('/agent/scout', async (req, res) => {
  try {
    const { lead_id } = req.body;

    // Validate input
    if (lead_id === undefined || lead_id === null) {
      return res.status(400).json({
        error: 'Missing required field: lead_id'
      });
    }

    if (!Number.isInteger(lead_id)) {
      return res.status(400).json({
        error: 'lead_id must be an integer'
      });
    }

    // Fetch the lead
    const lead = await getLeadById(lead_id);

    if (!lead) {
      return res.status(404).json({
        error: `Lead with ID ${lead_id} not found`
      });
    }

    // Return the lead data
    return res.status(200).json({
      success: true,
      data: lead
    });

  } catch (error) {
    console.error('Error in /agent/scout:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});