const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

app.use(express.json());

const agents = ['scribe', 'sentry', 'sage', 'scholar'];

async function airtableRequest(table, method = 'GET', data = null) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`;
    const response = await axios({
        method,
        url,
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        data: data || undefined
    });
    return response.data;
}

app.get('/', (req, res) => {
    res.json({
        service: 'Acquisition Agents',
        agents: ['scout', ...agents],
        status: 'running'
    });
});

app.post('/agent/scout', async (req, res) => {
    const { lead_id } = req.body;
    try {
        const result = await airtableRequest('Leads');
        const record = result.records.find(r => r.id === lead_id || r.fields['lead_id'] === lead_id);
        if (!record) {
            return res.status(404).json({
                agent: 'scout',
                lead_id,
                status: 'error',
                error: 'Lead not found',
                timestamp: new Date().toISOString()
            });
        }
        res.json({
            agent: 'scout',
            lead_id,
            business_name: record.fields['business_name'] || null,
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            agent: 'scout',
            lead_id,
            status: 'error',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

agents.forEach(agent => {
    app.post(`/${agent}`, (req, res) => {
        res.json({
            agent: agent,
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    });
});

app.listen(port, () => {
    console.log(`Acquisition Agents service running on port ${port}`);
});
