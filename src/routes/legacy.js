// Legacy acquisition-leads API, preserved from the original deployment.
const express = require('express');
const config = require('../config');

const router = express.Router();

router.post('/scout', async (req, res) => {
  if (!config.airtableApiKey || !config.airtableBaseId) {
    return res.status(503).json({
      error: 'Lead scout is not configured (AIRTABLE_API_KEY / AIRTABLE_BASE_ID missing)',
    });
  }

  try {
    const { lead_id } = req.body || {};
    if (lead_id === undefined || lead_id === null) {
      return res.status(400).json({ error: 'Missing required field: lead_id' });
    }
    if (!Number.isInteger(lead_id)) {
      return res.status(400).json({ error: 'lead_id must be an integer' });
    }

    const { getLeadById } = require('../airtable');
    const lead = await getLeadById(lead_id);
    if (!lead) {
      return res.status(404).json({ error: `Lead with ID ${lead_id} not found` });
    }
    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error('Error in /agent/scout:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
