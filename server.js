require('dotenv').config();
const express = require('express');
const { getLeadById } = require('./airtable');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Agent API is running' });
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