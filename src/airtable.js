const Airtable = require('airtable');

// Initialize Airtable with environment variables
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Table configuration
const LEADS_TABLE = process.env.AIRTABLE_LEADS_TABLE || 'Acquisition Leads';
const CALL_LOGS_TABLE = process.env.AIRTABLE_CALL_LOGS_TABLE || 'Call Logs';
// Field used to look up leads by numeric id (src/index.js maps 'Lead ID'; the
// scout lookup historically filtered on {ID} — override via env if the base differs)
const LEAD_ID_FIELD = process.env.AIRTABLE_LEAD_ID_FIELD || 'ID';

const leadsTable = base(LEADS_TABLE);
const callLogsTable = base(CALL_LOGS_TABLE);

const findLeadRecord = async (leadId) => {
    const records = await leadsTable
        .select({
            filterByFormula: `{${LEAD_ID_FIELD}} = '${leadId}'`,
            maxRecords: 1,
        })
        .firstPage();
    return records[0] || null;
};

// Function to get lead by ID — returns a single record's fields or null
const getLeadById = async (leadId) => {
    const record = await findLeadRecord(leadId);
    if (!record) return null;
    return { recordId: record.id, ...record.fields };
};

const listLeads = async () => {
    return leadsTable.select().all();
};

// Update a lead's fields, looked up by lead id
const updateLeadByLeadId = async (leadId, fields) => {
    const record = await findLeadRecord(leadId);
    if (!record) return null;
    const updated = await leadsTable.update(record.id, fields);
    return { recordId: updated.id, ...updated.fields };
};

// Idempotency helper: has this ElevenLabs conversation already been logged?
const findCallLogByConversationId = async (conversationId) => {
    const records = await callLogsTable
        .select({
            filterByFormula: `{Conversation ID} = '${conversationId}'`,
            maxRecords: 1,
        })
        .firstPage();
    return records[0] || null;
};

const createCallLog = async (fields) => {
    const record = await callLogsTable.create(fields);
    return { recordId: record.id, ...record.fields };
};

// Leads eligible for a Sentry re-engagement sweep: intent still open, not DNC,
// last called more than `staleDays` ago (or never called)
const getStaleLeads = async (staleDays = 14) => {
    const formula = `AND(
        {Seller Intent} = 'open',
        NOT({DNC}),
        OR(
            {Last Called At} = BLANK(),
            IS_BEFORE({Last Called At}, DATEADD(NOW(), -${Number(staleDays)}, 'days'))
        )
    )`.replace(/\s+/g, ' ');
    const records = await leadsTable.select({ filterByFormula: formula }).all();
    return records.map((r) => ({ recordId: r.id, ...r.fields }));
};

module.exports = {
    getLeadById,
    listLeads,
    updateLeadByLeadId,
    findCallLogByConversationId,
    createCallLog,
    getStaleLeads,
    LEAD_ID_FIELD,
};
