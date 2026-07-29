require('dotenv').config();
const express = require('express');
const {
  FIELDS,
  getLeadTask,
  taskToLead,
  setCustomFieldsByName,
  createTaskComment,
  getTaskComments,
  hasCallLogComment,
  getStaleLeads,
  createApprovalTask,
  findTaskByNamePrefix,
  renameTask,
} = require('./src/clickup');
const { verifyWebhookSignature, startOutboundCall, submitBatchCall } = require('./src/elevenlabs');
const { analyzeCallTranscript, askSage, generatePreCallBrief } = require('./src/claude');
const leadsRouter = require('./src/index');

const app = express();
// Keep the raw body around — the ElevenLabs webhook signature is computed over it
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));

const PORT = process.env.PORT || 3000;

// Bearer-token guard for agent tools and job triggers (these are public once
// deployed). Only enforced once AGENT_TOOLS_TOKEN is set.
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

// lead_id is a ClickUp task ID (string)
const validLeadId = (leadId) =>
  typeof leadId === 'string' && /^[a-z0-9_-]+$/i.test(leadId);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Agent API is running' });
});

// Lead listing from the ClickUp leads list
app.use('/leads', requireToolsToken, leadsRouter);

// POST /agent/scout - Fetch lead by lead_id (Scout's get_lead tool)
app.post('/agent/scout', requireToolsToken, async (req, res) => {
  try {
    const { lead_id } = req.body;
    if (!validLeadId(lead_id)) {
      return res.status(400).json({ error: 'lead_id must be a ClickUp task ID string' });
    }

    const task = await getLeadTask(lead_id);
    if (!task) {
      return res.status(404).json({ error: `Lead ${lead_id} not found` });
    }
    return res.status(200).json({ success: true, data: taskToLead(task) });
  } catch (error) {
    console.error('Error in /agent/scout:', error.message);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// PATCH /agent/scout/lead - Scout's update_lead_status tool
// Body: { lead_id, seller_intent?, call_status?, revenue_range?, timeline?,
//         reason_for_selling?, next_step?, dnc? }
app.patch('/agent/scout/lead', requireToolsToken, async (req, res) => {
  try {
    const { lead_id, ...updates } = req.body;
    if (!validLeadId(lead_id)) {
      return res.status(400).json({ error: 'lead_id must be a ClickUp task ID string' });
    }

    const fieldMap = {
      seller_intent: FIELDS.sellerIntent,
      call_status: FIELDS.callStatus,
      revenue_range: FIELDS.revenueRange,
      timeline: FIELDS.timeline,
      reason_for_selling: FIELDS.reasonForSelling,
      next_step: FIELDS.nextStep,
      dnc: FIELDS.dnc,
    };
    const fields = {};
    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) fields[column] = updates[key];
    }
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    const task = await getLeadTask(lead_id);
    if (!task) {
      return res.status(404).json({ error: `Lead ${lead_id} not found` });
    }
    const applied = await setCustomFieldsByName(lead_id, fields);
    return res.status(200).json({ success: true, applied });
  } catch (error) {
    console.error('Error in PATCH /agent/scout/lead:', error.message);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /agent/scout/followup - Scout's book_followup tool
// Body: { lead_id, followup_at (ISO datetime), notes? }
app.post('/agent/scout/followup', requireToolsToken, async (req, res) => {
  try {
    const { lead_id, followup_at, notes } = req.body;
    if (!validLeadId(lead_id) || !followup_at) {
      return res.status(400).json({ error: 'Required fields: lead_id, followup_at' });
    }
    if (Number.isNaN(Date.parse(followup_at))) {
      return res.status(400).json({ error: 'followup_at must be an ISO datetime' });
    }

    const task = await getLeadTask(lead_id);
    if (!task) {
      return res.status(404).json({ error: `Lead ${lead_id} not found` });
    }

    const nextStep = `Follow-up booked for ${followup_at}${notes ? ` — ${notes}` : ''}`;
    await setCustomFieldsByName(lead_id, { [FIELDS.nextStep]: nextStep });
    await createTaskComment(lead_id, `📅 ${nextStep}`);
    return res.status(200).json({ success: true, data: { lead_id, followup_at, next_step: nextStep } });
  } catch (error) {
    console.error('Error in /agent/scout/followup:', error.message);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /webhooks/elevenlabs/post-call - Scribe: persist every finished call to ClickUp
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

    const dynamicVars = data.conversation_initiation_client_data?.dynamic_variables || {};
    const leadId = dynamicVars.lead_id;
    if (!leadId) {
      console.warn(`Post-call webhook for ${conversationId} carried no lead_id — nothing to log`);
      return res.status(200).json({ success: true, unmatched: true });
    }

    // Idempotency: webhook retries must not duplicate call-log comments
    if (await hasCallLogComment(leadId, conversationId)) {
      return res.status(200).json({ success: true, duplicate: true });
    }

    const transcriptText = (data.transcript || [])
      .map((t) => `${t.role}: ${t.message}`)
      .join('\n');

    // Claude extracts qualification data from the transcript; fall back to
    // ElevenLabs' own analysis if the Claude call fails or is declined
    let analysis = null;
    if (transcriptText && process.env.ANTHROPIC_API_KEY) {
      try {
        analysis = await analyzeCallTranscript(transcriptText, {
          business_name: dynamicVars.business_name,
          owner_name: dynamicVars.owner_name,
        });
      } catch (err) {
        console.error('Claude transcript analysis failed:', err.message);
      }
    }
    const elAnalysis = data.analysis || {};
    const summary = analysis?.summary || elAnalysis.transcript_summary || '(no summary)';

    // Update lead custom fields
    const fields = {
      [FIELDS.lastCalledAt]: new Date().toISOString(),
      [FIELDS.callStatus]: 'completed',
    };
    if (analysis?.seller_intent) fields[FIELDS.sellerIntent] = analysis.seller_intent;
    if (analysis?.revenue_range) fields[FIELDS.revenueRange] = analysis.revenue_range;
    if (analysis?.timeline) fields[FIELDS.timeline] = analysis.timeline;
    if (analysis?.reason_for_selling) fields[FIELDS.reasonForSelling] = analysis.reason_for_selling;
    if (analysis?.next_step) fields[FIELDS.nextStep] = analysis.next_step;
    if (analysis?.dnc_requested) fields[FIELDS.dnc] = true;
    await setCustomFieldsByName(leadId, fields);

    // Call log as a task comment (carries the conversation ID for idempotency)
    const durationSecs = data.metadata?.call_duration_secs;
    await createTaskComment(
      leadId,
      [
        `📞 Call log — conversation ${conversationId}`,
        `Agent: ${dynamicVars.agent_role || 'scout'} | Duration: ${durationSecs ?? '?'}s`,
        `Summary: ${summary}`,
        analysis?.seller_intent ? `Seller intent: ${analysis.seller_intent}` : null,
        analysis?.next_step ? `Next step: ${analysis.next_step}` : null,
        '',
        'Transcript:',
        transcriptText || '(empty)',
      ]
        .filter((line) => line !== null)
        .join('\n')
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in /webhooks/elevenlabs/post-call:', error.message);
    // 500 → ElevenLabs retries; payload is logged for manual replay
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /jobs/outbound-call - trigger a single Scout outbound call
// Body: { lead_id }  (wire a ClickUp automation's webhook action at this endpoint)
app.post('/jobs/outbound-call', requireToolsToken, async (req, res) => {
  try {
    const { lead_id } = req.body;
    if (!validLeadId(lead_id)) {
      return res.status(400).json({ error: 'lead_id must be a ClickUp task ID string' });
    }

    const task = await getLeadTask(lead_id);
    if (!task) {
      return res.status(404).json({ error: `Lead ${lead_id} not found` });
    }
    const lead = taskToLead(task);
    if (lead.dnc) {
      return res.status(409).json({ error: 'Lead is flagged do-not-call' });
    }
    if (!lead.contact_consent) {
      return res.status(403).json({
        error: 'Lead has no recorded contact consent — check the Contact Consent field on the ClickUp task before calling',
      });
    }
    if (!lead.phone) {
      return res.status(422).json({ error: 'Lead has no phone number' });
    }

    const result = await startOutboundCall({
      agentId: process.env.ELEVENLABS_AGENT_ID_SCOUT,
      agentPhoneNumberId: process.env.ELEVENLABS_PHONE_NUMBER_ID,
      toNumber: lead.phone,
      dynamicVariables: {
        lead_id: lead.lead_id,
        business_name: lead.business_name || '',
        owner_name: lead.owner_name || '',
        industry: lead.industry || '',
        pre_call_brief: lead.pre_call_brief || '',
      },
    });

    await setCustomFieldsByName(lead_id, { [FIELDS.callStatus]: 'queued' });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error in /jobs/outbound-call:', error.message);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /jobs/sentry-sweep - human-approved batch re-engagement calls.
// No call is ever placed without sign-off:
//   1st run: finds eligible leads (consented, not DNC, stale) and creates a
//            "📋 Sentry sweep approval" task in ClickUp listing them.
//   Jake reviews and comments "approve" (or "skip") on that task.
//   Next run: executes the approved batch (re-checking eligibility), then
//             renames the task ✅ so it can't run twice.
// Body: { stale_days? } (default 14)
const APPROVAL_PREFIX = '📋 Sentry sweep approval';

app.post('/jobs/sentry-sweep', requireToolsToken, async (req, res) => {
  try {
    const staleDays = Number(req.body?.stale_days) || 14;

    const pending = await findTaskByNamePrefix(APPROVAL_PREFIX);
    if (pending) {
      const comments = await getTaskComments(pending.id);
      const decision = comments
        .map((c) => (c.comment_text || '').trim().toLowerCase())
        .find((t) => /^(approve|approved|yes|go)\b/.test(t) || /^(skip|deny|no|cancel)\b/.test(t));

      if (!decision) {
        return res.status(200).json({ success: true, status: 'awaiting_approval', task_id: pending.id });
      }
      if (/^(skip|deny|no|cancel)\b/.test(decision)) {
        await renameTask(pending.id, `🚫 Sentry sweep skipped — ${pending.name.slice(APPROVAL_PREFIX.length).trim()}`);
        await createTaskComment(pending.id, 'Sweep skipped per your comment — no calls placed.');
        return res.status(200).json({ success: true, status: 'skipped' });
      }

      // Approved: re-check eligibility at execution time (consent/DNC may have changed)
      const idsMatch = (pending.description || pending.text_content || '').match(/lead_ids:\s*(\[[^\]]*\])/);
      const approvedIds = idsMatch ? JSON.parse(idsMatch[1]) : [];
      const eligible = (await getStaleLeads(staleDays)).filter(
        (l) => l.phone && approvedIds.includes(l.lead_id)
      );
      if (eligible.length === 0) {
        await renameTask(pending.id, `✅ Sentry sweep executed (0 calls) — ${new Date().toISOString().slice(0, 10)}`);
        await createTaskComment(pending.id, 'Approved, but no leads were still eligible at execution time.');
        return res.status(200).json({ success: true, queued: 0 });
      }

      const recipients = eligible.map((lead) => ({
        phone_number: lead.phone,
        conversation_initiation_client_data: {
          dynamic_variables: {
            lead_id: lead.lead_id,
            business_name: lead.business_name || '',
            owner_name: lead.owner_name || '',
            last_call_summary: lead.next_step || '',
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

      await renameTask(pending.id, `✅ Sentry sweep executed (${recipients.length} calls) — ${new Date().toISOString().slice(0, 10)}`);
      await createTaskComment(pending.id, `Queued ${recipients.length} re-engagement call(s).`);
      return res.status(200).json({ success: true, queued: recipients.length, data: result });
    }

    // No pending approval: propose one
    const leads = (await getStaleLeads(staleDays)).filter((l) => l.phone);
    if (leads.length === 0) {
      return res.status(200).json({ success: true, status: 'no_eligible_leads', queued: 0 });
    }

    const lines = leads.map((l) => `- ${l.business_name || l.name} (${l.owner_name || 'owner unknown'}) — last called: ${l.last_called_at ? new Date(Number(l.last_called_at)).toISOString().slice(0, 10) : 'never'}`);
    const task = await createApprovalTask(
      `${APPROVAL_PREFIX} — ${new Date().toISOString().slice(0, 10)} (${leads.length} lead${leads.length === 1 ? '' : 's'})`,
      `Sentry wants to place re-engagement calls to these leads (all have Contact Consent, no DNC, stale ${staleDays}+ days):\n\n` +
        `${lines.join('\n')}\n\n` +
        `To APPROVE: comment "approve" on this task.\nTo SKIP: comment "skip".\n` +
        `Calls go out on the next scheduled sweep (or trigger the sentry-sweep cron manually).\n\n` +
        `lead_ids: ${JSON.stringify(leads.map((l) => l.lead_id))}`
    );

    return res.status(200).json({ success: true, status: 'approval_requested', task_id: task.id, proposed: leads.length });
  } catch (error) {
    console.error('Error in /jobs/sentry-sweep:', error.message);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /agent/sage - deal-analysis Q&A over the ClickUp pipeline
// Body: { question }
app.post('/agent/sage', requireToolsToken, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Missing required field: question' });
    }

    const { listLeads } = require('./src/clickup');
    const leads = await listLeads();

    // Pull call logs for the most recently called leads (bounded for context size)
    const called = leads
      .filter((l) => l.last_called_at)
      .sort((a, b) => Number(b.last_called_at) - Number(a.last_called_at))
      .slice(0, 10);
    const callLogs = {};
    for (const lead of called) {
      const comments = await getTaskComments(lead.lead_id);
      callLogs[lead.lead_id] = comments
        .map((c) => c.comment_text || '')
        .filter((t) => t.startsWith('📞'))
        .slice(0, 5);
    }

    const answer = await askSage(question, { leads, call_logs: callLogs });
    if (answer === null) {
      return res.status(502).json({ error: 'Sage could not answer this question' });
    }
    return res.status(200).json({ success: true, answer });
  } catch (error) {
    console.error('Error in /agent/sage:', error.message);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /jobs/enrich-lead - Scholar: research the business and write a
// pre-call brief onto the lead task. Wire a ClickUp automation at this
// endpoint (e.g. when a lead is created) or call it before queueing a call.
// Body: { lead_id }
app.post('/jobs/enrich-lead', requireToolsToken, async (req, res) => {
  try {
    const { lead_id } = req.body;
    if (!validLeadId(lead_id)) {
      return res.status(400).json({ error: 'lead_id must be a ClickUp task ID string' });
    }
    const task = await getLeadTask(lead_id);
    if (!task) {
      return res.status(404).json({ error: `Lead ${lead_id} not found` });
    }

    const brief = await generatePreCallBrief(taskToLead(task));
    if (brief === null) {
      return res.status(502).json({ error: 'Could not generate a brief for this lead' });
    }

    await setCustomFieldsByName(lead_id, { [FIELDS.preCallBrief]: brief });
    await createTaskComment(lead_id, `🔎 Pre-call brief (Scholar)\n\n${brief}`);
    return res.status(200).json({ success: true, brief });
  } catch (error) {
    console.error('Error in /jobs/enrich-lead:', error.message);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
