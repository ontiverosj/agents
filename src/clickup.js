const axios = require('axios');

// ClickUp REST API v2 client. Leads live as tasks in a ClickUp list; the
// task ID is the lead_id used across all endpoints.
const client = axios.create({
    baseURL: 'https://api.clickup.com/api/v2',
    headers: { Authorization: process.env.CLICKUP_API_TOKEN },
    timeout: 30000,
});

const LEADS_LIST_ID = process.env.CLICKUP_LEADS_LIST_ID;

// Custom field names on the leads list — override via env if yours differ
const FIELDS = {
    phone: process.env.CLICKUP_FIELD_PHONE || 'Phone',
    sellerIntent: process.env.CLICKUP_FIELD_SELLER_INTENT || 'Seller Intent',
    callStatus: process.env.CLICKUP_FIELD_CALL_STATUS || 'Call Status',
    lastCalledAt: process.env.CLICKUP_FIELD_LAST_CALLED_AT || 'Last Called At',
    revenueRange: process.env.CLICKUP_FIELD_REVENUE_RANGE || 'Revenue Range',
    timeline: process.env.CLICKUP_FIELD_TIMELINE || 'Timeline',
    reasonForSelling: process.env.CLICKUP_FIELD_REASON || 'Reason for Selling',
    nextStep: process.env.CLICKUP_FIELD_NEXT_STEP || 'Next Step',
    dnc: process.env.CLICKUP_FIELD_DNC || 'DNC',
    businessName: process.env.CLICKUP_FIELD_BUSINESS_NAME || 'Business Name',
    ownerName: process.env.CLICKUP_FIELD_OWNER_NAME || 'Owner Name',
    industry: process.env.CLICKUP_FIELD_INDUSTRY || 'Industry',
};

// ---- Custom field definitions (cached per list) ----

let fieldDefsCache = null;
let fieldDefsCacheAt = 0;

const getListFieldDefs = async () => {
    if (fieldDefsCache && Date.now() - fieldDefsCacheAt < 5 * 60 * 1000) return fieldDefsCache;
    const { data } = await client.get(`/list/${LEADS_LIST_ID}/field`);
    fieldDefsCache = data.fields || [];
    fieldDefsCacheAt = Date.now();
    return fieldDefsCache;
};

const getFieldValue = (task, fieldName) => {
    const field = (task.custom_fields || []).find(
        (f) => f.name.toLowerCase() === fieldName.toLowerCase()
    );
    if (!field || field.value === undefined || field.value === null) return null;
    // Dropdown values come back as an option index or id — resolve to the option name
    if (field.type === 'drop_down' && field.type_config?.options) {
        const opt = field.type_config.options.find(
            (o) => o.id === field.value || o.orderindex === field.value
        );
        return opt ? opt.name : field.value;
    }
    if (field.type === 'checkbox') return field.value === 'true' || field.value === true;
    return field.value;
};

// ---- Leads ----

const getLeadTask = async (taskId) => {
    try {
        const { data } = await client.get(`/task/${taskId}`);
        return data;
    } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 401) return null;
        throw err;
    }
};

// Flatten a ClickUp task into the lead shape the agents consume
const taskToLead = (task) => ({
    lead_id: task.id,
    name: task.name,
    status: task.status?.status,
    url: task.url,
    business_name: getFieldValue(task, FIELDS.businessName) || task.name,
    owner_name: getFieldValue(task, FIELDS.ownerName),
    industry: getFieldValue(task, FIELDS.industry),
    phone: getFieldValue(task, FIELDS.phone),
    seller_intent: getFieldValue(task, FIELDS.sellerIntent),
    call_status: getFieldValue(task, FIELDS.callStatus),
    last_called_at: getFieldValue(task, FIELDS.lastCalledAt),
    revenue_range: getFieldValue(task, FIELDS.revenueRange),
    timeline: getFieldValue(task, FIELDS.timeline),
    reason_for_selling: getFieldValue(task, FIELDS.reasonForSelling),
    next_step: getFieldValue(task, FIELDS.nextStep),
    dnc: getFieldValue(task, FIELDS.dnc) === true,
    description: task.description || '',
});

const listLeads = async () => {
    const { data } = await client.get(`/list/${LEADS_LIST_ID}/task`, {
        params: { include_closed: false },
    });
    return (data.tasks || []).map(taskToLead);
};

// Set custom fields by display name; dropdown values resolve to option IDs
const setCustomFieldsByName = async (taskId, values) => {
    const defs = await getListFieldDefs();
    const applied = [];
    for (const [name, value] of Object.entries(values)) {
        if (value === undefined || value === null || value === '') continue;
        const def = defs.find((d) => d.name.toLowerCase() === name.toLowerCase());
        if (!def) {
            console.warn(`ClickUp custom field not found on leads list: "${name}" — skipped`);
            continue;
        }
        let fieldValue = value;
        if (def.type === 'drop_down') {
            const opt = (def.type_config?.options || []).find(
                (o) => o.name.toLowerCase() === String(value).toLowerCase()
            );
            if (!opt) {
                console.warn(`No dropdown option "${value}" on field "${name}" — skipped`);
                continue;
            }
            fieldValue = opt.id;
        }
        if (def.type === 'date') {
            fieldValue = new Date(value).getTime();
        }
        await client.post(`/task/${taskId}/field/${def.id}`, { value: fieldValue });
        applied.push(name);
    }
    return applied;
};

// ---- Comments (call logs live as task comments) ----

const getTaskComments = async (taskId) => {
    const { data } = await client.get(`/task/${taskId}/comment`);
    return data.comments || [];
};

const createTaskComment = async (taskId, commentText) => {
    const { data } = await client.post(`/task/${taskId}/comment`, {
        comment_text: commentText,
        notify_all: false,
    });
    return data;
};

// Idempotency: has this ElevenLabs conversation already been logged on the task?
const hasCallLogComment = async (taskId, conversationId) => {
    const comments = await getTaskComments(taskId);
    return comments.some((c) => (c.comment_text || '').includes(conversationId));
};

// ---- Sentry sweep ----

// Leads still open, not DNC, last called more than `staleDays` ago (or never)
const getStaleLeads = async (staleDays = 14) => {
    const leads = await listLeads();
    const cutoff = Date.now() - staleDays * 24 * 60 * 60 * 1000;
    return leads.filter((lead) => {
        if (lead.dnc) return false;
        if (lead.seller_intent && lead.seller_intent !== 'open') return false;
        if (!lead.last_called_at) return true;
        return Number(lead.last_called_at) < cutoff;
    });
};

module.exports = {
    FIELDS,
    getLeadTask,
    taskToLead,
    listLeads,
    setCustomFieldsByName,
    createTaskComment,
    hasCallLogComment,
    getStaleLeads,
};
