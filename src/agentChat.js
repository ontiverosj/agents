// Talk to a Claude subagent (defined in .claude/agents/*.md) through the Messages
// API. The agent's markdown body becomes the system prompt; the frontmatter gives
// us the name/description. Used by the chat dashboard's POST /agent/chat endpoint.
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { parseFrontmatter } = require('./frontmatter');

// Chat default per the claude-api skill: most capable model, adaptive thinking.
const CHAT_MODEL = process.env.CHAT_MODEL || 'claude-opus-4-8';
const AGENTS_DIR = path.join(__dirname, '..', '.claude', 'agents');

// This chat surface has no live MCP/tool access, so steer the agent away from
// pretending it does. Stable text → lives in the cached system prefix.
const NO_TOOLS_NOTE =
  'CHAT SURFACE NOTE: In this dashboard chat you have NO live integration or tool ' +
  'access (no Gmail, Calendar, ClickUp, Airtable, Apollo, Stripe, etc.). Reason from ' +
  'what the user tells you and any context they paste. Never fabricate inbox, calendar, ' +
  'CRM, or pipeline data. When you would need a tool, say what you would check and what ' +
  'you need from the user instead. Keep replies tight and lead with the answer.';

function listAgents() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .map((f) => {
      const { data } = parseFrontmatter(fs.readFileSync(path.join(AGENTS_DIR, f), 'utf8'));
      return data && data.name ? { name: data.name, description: data.description || '' } : null;
    })
    .filter(Boolean);
}

// Load one agent's system prompt (markdown body) by name. Validates the name to
// keep it inside the agents directory (no path traversal).
function loadAgentPrompt(name) {
  if (!/^[a-zA-Z0-9_-]+$/.test(String(name || ''))) return null;
  const file = path.join(AGENTS_DIR, `${name}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  if (!data || !data.name) return null;
  return { name: data.name, description: data.description || '', systemPrompt: body.trim() };
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.trim() }));
}

let _client = null;
function client() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('ANTHROPIC_API_KEY is not set');
    err.code = 'NO_API_KEY';
    throw err;
  }
  if (!_client) _client = new Anthropic();
  return _client;
}

// Send the conversation to the agent and return { reply, usage }.
async function chatWithAgent({ agentName, messages }) {
  const agent = loadAgentPrompt(agentName);
  if (!agent) {
    const err = new Error(`Unknown agent: ${agentName}`);
    err.code = 'UNKNOWN_AGENT';
    throw err;
  }

  const history = sanitizeMessages(messages);
  if (!history.length || history[history.length - 1].role !== 'user') {
    const err = new Error('Conversation must end with a user message');
    err.code = 'BAD_MESSAGES';
    throw err;
  }

  const response = await client().messages.create({
    model: CHAT_MODEL,
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    // Stable prefix (agent prompt + note) cached; cache_control on the last block
    // caches the whole system prefix. History varies per turn → after the prefix.
    system: [
      { type: 'text', text: agent.systemPrompt },
      { type: 'text', text: NO_TOOLS_NOTE, cache_control: { type: 'ephemeral' } },
    ],
    messages: history,
  });

  const reply = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return {
    reply: reply || '(no text response)',
    usage: response.usage,
    model: response.model,
    agent: agent.name,
  };
}

module.exports = { listAgents, loadAgentPrompt, chatWithAgent, CHAT_MODEL };
