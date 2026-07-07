# Everflow Acquisitions — Agent Dashboard

An Express app that surfaces the acquisition pipeline and lets you **chat live with AI agents** (the `executive` Chief of Staff and any other Claude subagent in `.claude/agents/`).

## What's inside

| Route | What it shows | Needs |
| --- | --- | --- |
| `GET /dashboard` | **Acquisition pipeline** — verdict funnel, priorities, action queue, Buy Box disqualifiers, enrichment gaps (from the sourcing agent's `prospects.json`) | nothing (bundled sample) |
| `GET /dashboard/agents` | **Agent fleet** — orchestrator, Source→Enrich→Qualify→Outreach flow, agent roster | nothing |
| `GET /dashboard/chat` | **Chat with an agent** — live conversation with the `executive` agent via the Claude API | `ANTHROPIC_API_KEY` |
| `GET /dashboard/leads` | Airtable "Acquisition Leads" CRM snapshot | `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` |
| `POST /agent/scout` | Fetch one lead by id from Airtable | Airtable vars |

The dashboards work with **no configuration**. Only the **AI chat** needs an Anthropic API key.

## Run it locally

```bash
git clone https://github.com/ontiverosj/agents.git everflow-dashboard
cd everflow-dashboard
npm install
cp .env.example .env      # then paste your ANTHROPIC_API_KEY into .env
npm start                 # -> http://localhost:3000/dashboard
```

Open **http://localhost:3000/dashboard/chat** to talk to the agents.
(If you already have a folder named `agents`, the `everflow-dashboard` name above avoids the clash — call it whatever you like.)

## Get the AI chat working (the one required key)

1. Create a key at **https://console.anthropic.com** → **Settings → API Keys** (the account needs billing enabled — chat costs a few cents per message).
2. Put it where the app reads `process.env.ANTHROPIC_API_KEY`:
   - **Local:** in `.env` → `ANTHROPIC_API_KEY=sk-ant-...`
   - **Hosted (Railway/Render/etc.):** add it as an environment variable in the dashboard, then redeploy.
3. Reload `/dashboard/chat` — the setup banner disappears and the agent replies.

Optional: `CHAT_MODEL` overrides the model (defaults to `claude-opus-4-8`; `claude-sonnet-4-6` or `claude-haiku-4-5` are cheaper).

## Deploy to a public URL (Railway)

1. Push this branch to GitHub (already done).
2. In **Railway** → **New Project → Deploy from GitHub repo** → pick `ontiverosj/agents`.
3. Railway auto-detects Node and runs `npm start`.
4. Add environment variables: `ANTHROPIC_API_KEY` (for chat), optionally `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` (leads) and `CHAT_MODEL`.
5. Railway gives you a `https://<name>.up.railway.app` URL → that's your live, shareable dashboard.

`PORT` is provided by the host automatically; the app respects it.

## Environment variables

See [`.env.example`](./.env.example). Only `ANTHROPIC_API_KEY` is needed for the core chat experience; everything else is optional.

## Project layout

```
server.js                 Express routes
src/pipelineMetrics.js    pipeline aggregation (pure)
src/pipelineDashboard.js  pipeline HTML (pure)
src/agentsRegistry.js     agent fleet registry (pure)
src/agentsDashboard.js    fleet HTML (pure)
src/agentChat.js          talks to Claude subagents via the Messages API
src/chatDashboard.js      chat UI (pure)
src/airtable.js           Airtable client (lazy)
.claude/agents/           agent definitions (executive Chief of Staff)
lead_sourcing_agent.py    Apollo net + Buy Box v2.1 + succession scoring
data/prospects.sample.json  bundled sample so dashboards render offline
```
