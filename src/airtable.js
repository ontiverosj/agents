const Airtable = require('airtable');

// Initialize Airtable with environment variables
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Table configuration
const leadsTable = base('Acquisition Leads');

// Function to get lead by ID
const getLeadById = async (leadId) => {
    const record = await leadsTable
        .select({
            filterByFormula: `{ID} = '${leadId}'`
        })
        .firstPage();
    return record;
};

module.exports = { getLeadById };