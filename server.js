require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { getLeadById, getAllLeads } = require('./src/airtable');
const { computeMetrics } = require('./src/metrics');
const { renderDashboard } = require('./src/dashboard');
const { computePipelineMetrics } = require('./src/pipelineMetrics');
const { renderPipelineDashboard } = require('./src/pipelineDashboard');

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