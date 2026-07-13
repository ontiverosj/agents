const Airtable = require('airtable');
const config = require('./config');

// Lazy init so the server boots without Airtable credentials.
let leadsTable = null;
function getTable() {
  if (!leadsTable) {
    const base = new Airtable({ apiKey: config.airtableApiKey }).base(config.airtableBaseId);
    leadsTable = base('Acquisition Leads');
  }
  return leadsTable;
}

const getLeadById = async (leadId) => {
  const records = await getTable()
    .select({ filterByFormula: `{ID} = '${leadId}'` })
    .firstPage();
  if (!records || records.length === 0) return null;
  return { id: records[0].id, ...records[0].fields };
};

module.exports = { getLeadById };
