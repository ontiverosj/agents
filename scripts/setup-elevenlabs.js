#!/usr/bin/env node
/*
 * One-time ElevenLabs setup for the Scout voice agent.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=xi_xxx SERVER_URL=https://your-host.example \
 *     [AGENT_TOOLS_TOKEN=...] [ELEVENLABS_VOICE_ID=...] [ELEVENLABS_LLM=...] \
 *     node scripts/setup-elevenlabs.js
 *
 * Creates (idempotently, matched by name):
 *   - three webhook tools pointing at your deployed agents API:
 *       get_lead, update_lead_status, book_followup
 *   - the "Scout" conversational agent wired to those tools
 *
 * SERVER_URL must be the public HTTPS base URL of server.js (ngrok is fine
 * while testing). Re-run after changing SERVER_URL to update the tools.
 *
 * Manual steps that can't be scripted are printed at the end.
 */
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const SERVER_URL = (process.env.SERVER_URL || '').replace(/\/$/, '');
const TOOLS_TOKEN = process.env.AGENT_TOOLS_TOKEN;

if (!API_KEY || !SERVER_URL) {
  console.error(
    'Required env vars:\n' +
    '  ELEVENLABS_API_KEY  (elevenlabs.io → Profile → API keys)\n' +
    '  SERVER_URL          (public HTTPS base URL of the deployed agents API; ngrok works for testing)'
  );
  process.exit(1);
}

const api = axios.create({
  baseURL: 'https://api.elevenlabs.io',
  headers: { 'xi-api-key': API_KEY },
  timeout: 30000,
});

const authHeaders = TOOLS_TOKEN ? { Authorization: `Bearer ${TOOLS_TOKEN}` } : {};

const leadIdProp = {
  type: 'string',
  description: 'The ClickUp task ID of the lead (provided as the lead_id dynamic variable at call start).',
};

const TOOLS = [
  {
    name: 'get_lead',
    description:
      'Fetch the lead record (business name, owner, industry, phone, prior call notes) by lead_id. ' +
      'Call this once at the start of the call when a lead_id dynamic variable is present.',
    api_schema: {
      url: `${SERVER_URL}/agent/scout`,
      method: 'POST',
      request_headers: authHeaders,
      request_body_schema: {
        type: 'object',
        properties: { lead_id: leadIdProp },
        required: ['lead_id'],
      },
    },
  },
  {
    name: 'update_lead_status',
    description:
      'Save qualification data for the lead. Call before ending every call with whatever was learned. ' +
      'Only include fields the caller actually stated.',
    api_schema: {
      url: `${SERVER_URL}/agent/scout/lead`,
      method: 'PATCH',
      request_headers: authHeaders,
      request_body_schema: {
        type: 'object',
        properties: {
          lead_id: leadIdProp,
          seller_intent: {
            type: 'string',
            enum: ['selling_now', 'open', 'not_interested', 'unknown'],
            description: 'How interested the owner is in selling the business.',
          },
          call_status: {
            type: 'string',
            enum: ['completed', 'no-answer', 'voicemail', 'declined'],
            description: 'Outcome of this call.',
          },
          revenue_range: { type: 'string', description: "Approximate annual revenue if stated, e.g. '$500k-$1M'." },
          timeline: { type: 'string', description: 'Selling timeline if stated.' },
          reason_for_selling: { type: 'string', description: 'Why they are considering selling, if stated.' },
          next_step: { type: 'string', description: 'The agreed next step.' },
          dnc: { type: 'boolean', description: 'True ONLY if the caller asked not to be contacted again.' },
        },
        required: ['lead_id'],
      },
    },
  },
  {
    name: 'book_followup',
    description:
      'Book a follow-up call with Jake. Use after the caller agrees to a specific date and time. ' +
      'followup_at must be an ISO 8601 datetime.',
    api_schema: {
      url: `${SERVER_URL}/agent/scout/followup`,
      method: 'POST',
      request_headers: authHeaders,
      request_body_schema: {
        type: 'object',
        properties: {
          lead_id: leadIdProp,
          followup_at: { type: 'string', description: 'ISO 8601 datetime for the follow-up call.' },
          notes: { type: 'string', description: 'Anything Jake should know before the follow-up.' },
        },
        required: ['lead_id', 'followup_at'],
      },
    },
  },
];

const SCOUT_PROMPT = `You are Scout, a friendly, professional acquisitions associate for Everflow
Acquisitions. You speak with small-business owners about potentially selling
their business.

Style: warm, concise, conversational. One question at a time. Mirror the
caller's pace. Never pushy.

Objectives, in order:
1. Verify you're speaking with the owner or a decision-maker.
2. Understand their interest in selling (now / someday / not at all).
3. Gather: industry, years in business, approximate annual revenue,
   approximate profit (SDE), employee count, reason for selling, timeline.
4. If qualified and interested, offer to schedule a call with Jake.

Hard rules:
- Never state a valuation, price range, or offer.
- Never promise confidentiality terms beyond "this conversation is
  confidential."
- If asked something you don't know, say you'll have Jake follow up.
- If they ask to be removed from contact, apologize, confirm removal (call
  update_lead_status with dnc=true), and end the call politely.
- If asked whether you are an AI, say yes plainly and continue helpfully.
- Keep calls under 8 minutes.

Tools: when a lead_id dynamic variable is present, call get_lead at the start
of the call. Always call update_lead_status before ending the call. Use
book_followup only after the caller agrees to a specific date and time.`;

const FIRST_MESSAGE =
  "Hi, this is Scout calling on behalf of Everflow Acquisitions — am I speaking with the owner of {{business_name}}?";

const listAll = async (path, key) => {
  const { data } = await api.get(path);
  return data[key] || [];
};

const main = async () => {
  // 1. Webhook tools (create or update, matched by name)
  const existingTools = await listAll('/v1/convai/tools', 'tools');
  const toolIds = [];
  for (const tool of TOOLS) {
    const existing = existingTools.find((t) => t.tool_config?.name === tool.name);
    if (existing) {
      await api.patch(`/v1/convai/tools/${existing.id}`, {
        tool_config: { type: 'webhook', ...tool },
      });
      console.log(`  ~ tool ${tool.name} (updated → ${tool.api_schema.url})`);
      toolIds.push(existing.id);
    } else {
      const { data } = await api.post('/v1/convai/tools', {
        tool_config: { type: 'webhook', ...tool },
      });
      console.log(`  + tool ${tool.name} (created → ${tool.api_schema.url})`);
      toolIds.push(data.id);
    }
  }

  // 2. Voice
  let voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    const voices = await listAll('/v1/voices', 'voices');
    const pick =
      voices.find((v) => v.category === 'premade' && /male|deep|conversational/i.test(JSON.stringify(v.labels || {}))) ||
      voices[0];
    if (!pick) {
      console.error('No voices available on this account.');
      process.exit(1);
    }
    voiceId = pick.voice_id;
    console.log(`  voice: ${pick.name} (${voiceId}) — override with ELEVENLABS_VOICE_ID`);
  }

  // 3. Scout agent (create or update, matched by name)
  const agentConfig = {
    name: 'Scout',
    conversation_config: {
      agent: {
        first_message: FIRST_MESSAGE,
        language: 'en',
        prompt: {
          prompt: SCOUT_PROMPT,
          llm: process.env.ELEVENLABS_LLM || 'claude-sonnet-4-5',
          temperature: 0.4,
          tool_ids: toolIds,
        },
      },
      tts: {
        voice_id: voiceId,
        stability: 0.5,
        similarity_boost: 0.75,
      },
      conversation: {
        max_duration_seconds: 600,
      },
    },
  };

  const { data: agentList } = await api.get('/v1/convai/agents', { params: { search: 'Scout' } });
  const existingAgent = (agentList.agents || []).find((a) => a.name === 'Scout');
  let agentId;
  if (existingAgent) {
    agentId = existingAgent.agent_id;
    await api.patch(`/v1/convai/agents/${agentId}`, agentConfig);
    console.log(`  ~ agent Scout (updated: ${agentId})`);
  } else {
    const { data } = await api.post('/v1/convai/agents/create', agentConfig);
    agentId = data.agent_id;
    console.log(`  + agent Scout (created: ${agentId})`);
  }

  console.log('\nDone. Set these env vars on your server host:');
  console.log(`  ELEVENLABS_AGENT_ID_SCOUT=${agentId}`);
  console.log('\nRemaining manual steps (ElevenLabs dashboard):');
  console.log('  1. Agents → Scout → test in the playground (pass lead_id/business_name as dynamic variables).');
  console.log('  2. Workspace Settings → Post-call webhook →');
  console.log(`       ${SERVER_URL}/webhooks/elevenlabs/post-call`);
  console.log('     Copy the signing secret into ELEVENLABS_WEBHOOK_SECRET on your server.');
  console.log('  3. Phone numbers → buy/import a number → assign to Scout →');
  console.log('     set ELEVENLABS_PHONE_NUMBER_ID on your server (needed for outbound).');
};

main().catch((err) => {
  console.error('Setup failed:', JSON.stringify(err.response?.data || err.message, null, 2));
  process.exit(1);
});
