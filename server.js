require('dotenv').config();
const express = require('express');
const {
  getLeadById,
  updateLeadByLeadId,
  findCallLogByConversationId,
  createCallLog,
  getStaleLeads,
} = require('./src/airtable');
const { verifyWebhookSignature, startOutboundCall, submitBatchCall } = require('./src/elevenlabs');
const leadsRouter = require('./src/index');

const app = express();
// Keep the raw body around — the ElevenLabs webhook signature is computed over it
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));

const PORT = process.env.PORT || 3000;

// Bearer-token guard for agent tools and job triggers (these are public on Railway).
// Only enforced once AGENT_TOOLS_TOKEN is set, so existing integrations keep working
// until the token is configured.
const requireToolsToken = (req, res, next) => {
  const token = process.env.AGENT_TOOLS_TOKEN;
  if (!token) {
    console.warn('AGENT_TOOLS_TOKEN not set — tool endpoints are unauthenticated');
    return next();
  }
  const header = req.headers.authorization || '';
  if (header !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Agent API is running' });
});

// Lead listing (previously unreachable src/index.js router)
app.use('/leads', requireToolsToken, leadsRouter);

// POST /agent/scout - Fetch lead by lead_id (Scout's get_lead tool)
app.post('/agent/scout', requireToolsToken, async (req, res) => {
  try {
    const { lead_id } = req.body;

    if (lead_id === undefined || lead_id === null) {
      return res.status(400).json({ error: 'Missing required field: lead_id' });
    }
    if (!Number.isInteger(lead_id)) {
      return res.status(400).json({ error: 'lead_id must be an integer' });
    }

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

// PATCH /agent/scout/lead - Scout's update_lead_status tool
// Body: { lead_id, seller_intent?, call_status?, qualification_summary?,
//         revenue_range?, timeline?, reason_for_selling?, next_step? }
app.patch('/agent/scout/lead', requireToolsToken, async (req, res) => {
  try {
    const { lead_id, ...updates } = req.body;
    if (lead_id === undefined || lead_id === null) {
      return res.status(400).json({ error: 'Missing required field: lead_id' });
    }

    const fieldMap = {
      seller_intent: 'Seller Intent',
      call_status: 'Call Status',
      qualification_summary: 'Qualification Summary',
      revenue_range: 'Revenue Range',
      timeline: 'Timeline',
      reason_for_selling: 'Reason for Selling',
      next_step: 'Next Step',
      dnc: 'DNC',
    };
    const fields = {};
    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) fields[column] = updates[key];
    }
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    const updated = await updateLeadByLeadId(lead_id, fields);
    if (!updated) {
      return res.status(404).json({ error: `Lead with ID ${lead_id} not found` });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PATCH /agent/scout/lead:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /agent/scout/followup - Scout's book_followup tool
// Body: { lead_id, followup_at (ISO datetime), notes? }
app.post('/agent/scout/followup', requireToolsToken, async (req, res) => {
  try {
    const { lead_id, followup_at, notes } = req.body;
    if (lead_id === undefined || lead_id === null || !followup_at) {
      return res.status(400).json({ error: 'Required fields: lead_id, followup_at' });
    }
    if (Number.isNaN(Date.parse(followup_at))) {
      return res.status(400).json({ error: 'followup_at must be an ISO datetime' });
    }

    const nextStep = `Follow-up booked for ${followup_at}${notes ? ` — ${notes}` : ''}`;
    const updated = await updateLeadByLeadId(lead_id, { 'Next Step': nextStep });
    if (!updated) {
      return res.status(404).json({ error: `Lead with ID ${lead_id} not found` });
    }
    return res.status(200).json({ success: true, data: { lead_id, followup_at, next_step: nextStep } });
  } catch (error) {
    console.error('Error in /agent/scout/followup:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /webhooks/elevenlabs/post-call - Scribe: persist every finished call to Airtable
app.post('/webhooks/elevenlabs/post-call', async (req, res) => {
  try {
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    if (!verifyWebhookSignature(req.rawBody, req.headers['elevenlabs-signature'], secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    if (event.type && event.type !== 'post_call_transcription') {
      return res.status(200).json({ skipped: event.type });
    }
    const data = event.data || {};
    const conversationId = data.conversation_id;
    if (!conversationId) {
      return res.status(400).json({ error: 'Missing conversation_id' });
    }

    // Idempotency: webhook retries must not duplicate call logs
    if (await findCallLogByConversationId(conversationId)) {
      return res.status(200).json({ success: true, duplicate: true });
    }

    const analysis = data.analysis || {};
    const dynamicVars = data.conversation_initiation_client_data?.dynamic_variables || {};
    const leadId = dynamicVars.lead_id;
    const transcriptText = (data.transcript || [])
      .map((t) => `${t.role}: ${t.message}`)
      .join('\n');

    await createCallLog({
      'Conversation ID': conversationId,
      'Agent': dynamicVars.agent_role || 'scout',
      'Called At': new Date((event.event_timestamp || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      'Duration (s)': data.metadata?.call_duration_secs ?? null,
      'Outcome': analysis.call_successful || data.status || 'unknown',
      'Transcript': transcriptText,
      'Evaluation Results': JSON.stringify(analysis.evaluation_criteria_results || {}),
      ...(leadId !== undefined ? { 'Lead ID Ref': String(leadId) } : {}),
    });

    if (leadId !== undefined) {
      const collected = analysis.data_collection_results || {};
      const fields = {
        'Last Called At': new Date().toISOString(),
        'Call Status': 'completed',
      };
      if (analysis.transcript_summary) fields['Qualification Summary'] = analysis.transcript_summary;
      if (collected.seller_intent?.value) fields['Seller Intent'] = collected.seller_intent.value;
      if (collected.revenue_range?.value) fields['Revenue Range'] = collected.revenue_range.value;
      if (collected.timeline?.value) fields['Timeline'] = collected.timeline.value;
      await updateLeadByLeadId(Number(leadId), fields);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in /webhooks/elevenlabs/post-call:', error);
    // 500 → ElevenLabs retries; payload is logged above for manual replay
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /jobs/outbound-call - trigger a single Scout outbound call
// Body: { lead_id }
app.post('/jobs/outbound-call', requireToolsToken, async (req, res) => {
  try {
    const { lead_id } = req.body;
    if (lead_id === undefined || lead_id === null) {
      return res.status(400).json({ error: 'Missing required field: lead_id' });
    }

    const lead = await getLeadById(lead_id);
    if (!lead) {
      return res.status(404).json({ error: `Lead with ID ${lead_id} not found` });
    }
    if (lead['DNC']) {
      return res.status(409).json({ error: 'Lead is flagged do-not-call' });
    }
    if (!lead['Phone']) {
      return res.status(422).json({ error: 'Lead has no phone number' });
    }

    const result = await startOutboundCall({
      agentId: process.env.ELEVENLABS_AGENT_ID_SCOUT,
      agentPhoneNumberId: process.env.ELEVENLABS_PHONE_NUMBER_ID,
      toNumber: lead['Phone'],
      dynamicVariables: {
        lead_id: String(lead_id),
        business_name: lead['Business Name'] || '',
        owner_name: lead['Owner Name'] || '',
        industry: lead['Industry'] || '',
      },
    });

    await updateLeadByLeadId(lead_id, { 'Call Status': 'queued' });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error in /jobs/outbound-call:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /jobs/sentry-sweep - batch re-engagement calls for stale leads
// Body: { stale_days? } (default 14)
app.post('/jobs/sentry-sweep', requireToolsToken, async (req, res) => {
  try {
    const staleDays = Number(req.body?.stale_days) || 14;
    const leads = (await getStaleLeads(staleDays)).filter((l) => l['Phone']);
    if (leads.length === 0) {
      return res.status(200).json({ success: true, queued: 0 });
    }

    const recipients = leads.map((lead) => ({
      phone_number: lead['Phone'],
      conversation_initiation_client_data: {
        dynamic_variables: {
          lead_id: String(lead['Lead ID'] ?? lead['ID'] ?? ''),
          business_name: lead['Business Name'] || '',
          owner_name: lead['Owner Name'] || '',
          last_call_summary: lead['Qualification Summary'] || '',
          agent_role: 'sentry',
        },
      },
    }));

    const result = await submitBatchCall({
      callName: `sentry-sweep-${new Date().toISOString().slice(0, 10)}`,
      agentId: process.env.ELEVENLABS_AGENT_ID_SENTRY || process.env.ELEVENLABS_AGENT_ID_SCOUT,
      agentPhoneNumberId: process.env.ELEVENLABS_PHONE_NUMBER_ID,
      recipients,
    });

    return res.status(200).json({ success: true, queued: recipients.length, data: result });
  } catch (error) {
    console.error('Error in /jobs/sentry-sweep:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
