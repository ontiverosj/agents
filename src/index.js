const express = require('express');
const router = express.Router();
const { listLeads } = require('./clickup');

// GET / — list all leads from the ClickUp leads list
router.get('/', async (req, res) => {
    try {
        const leads = await listLeads();
        res.status(200).json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error.message);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

module.exports = router;
