const express = require('express');
const router = express.Router();
const airtable = require('airtable');

const base = airtable.base('YOUR_BASE_ID');

// Single GET / endpoint to fetch leads
router.get('/', async (req, res) => {
    try {
        const records = await base('Leads').select().all();
        const leads = records.map(record => ({
            businessName: record.get('Business Name'),
            leadID: record.get('Lead ID'),
            industry: record.get('Industry'),
            ownerName: record.get('Owner Name'),
            email: record.get('Email'),
            phone: record.get('Phone'),
            address: record.get('Address'),
            website: record.get('Website'),
            yearsInBusiness: record.get('Years in Business'),
            employeeCount: record.get('Employee Count'),
            estimatedRevenue: record.get('Estimated Revenue'),
            leadSource: record.get('Lead Source'),
            dateAdded: record.get('Date Added'),
            leadStatus: record.get('Lead Status'),
            notes: record.get('Notes'),
            priority: record.get('Priority'),
            leadQualityScore: record.get('Lead Quality Score'),
        }));
        res.status(200).json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

module.exports = router;