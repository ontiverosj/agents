const Airtable = require('airtable');

// Lazily initialize the Airtable client so the server can boot without Airtable
// credentials (only the leads routes need them). Constructing the client eagerly
// throws "An API key is required" at import time and takes the whole app down.
let _leadsTable = null;
const leadsTable = () => {
    if (_leadsTable) return _leadsTable;
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        throw new Error('Airtable not configured: set AIRTABLE_API_KEY and AIRTABLE_BASE_ID');
    }
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    _leadsTable = base('Acquisition Leads');
    return _leadsTable;
};

// Function to get lead by ID
const getLeadById = async (leadId) => {
    const record = await leadsTable()
        .select({
            filterByFormula: `{ID} = '${leadId}'`
        })
        .firstPage();
    return record;
};

// Map a raw Airtable record into a plain lead object for the dashboard.
const mapLead = (record) => ({
    businessName: record.get('Business Name'),
    leadID: record.get('Lead ID'),
    industry: record.get('Industry'),
    ownerName: record.get('Owner Name'),
    email: record.get('Email'),
    phone: record.get('Phone'),
    website: record.get('Website'),
    estimatedRevenue: record.get('Estimated Revenue'),
    leadSource: record.get('Lead Source'),
    dateAdded: record.get('Date Added'),
    leadStatus: record.get('Lead Status'),
    priority: record.get('Priority'),
    leadQualityScore: record.get('Lead Quality Score'),
});

// Fetch every lead, mapped for the dashboard aggregations.
const getAllLeads = async () => {
    const records = await leadsTable().select().all();
    return records.map(mapLead);
};

module.exports = { getLeadById, getAllLeads };