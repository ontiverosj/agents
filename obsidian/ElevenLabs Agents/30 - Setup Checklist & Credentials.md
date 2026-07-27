---
tags: [elevenlabs, setup, credentials, checklist]
created: 2026-07-27
status: phase-1
---

# Setup Checklist & Credentials

Everything needed to go from zero to Scout's first call. **No actual secrets in this note — names only.** Values live in Railway env vars and a password manager. Back to [[00 - ElevenLabs Agents Overview]].

## Accounts

- [ ] **ElevenLabs** — paid plan with Conversational AI (calls are billed per minute; Creator tier is fine to start, watch usage)
- [ ] **Airtable** — existing base with `Acquisition Leads`; PAT with `data.records:read` + `data.records:write` scoped to that base
- [ ] **Railway** — existing project (already deployed)
- [ ] **Twilio** — optional, only if not using ElevenLabs native numbers

## Env vars (Railway)

| Variable | What it is |
|---|---|
| `AIRTABLE_API_KEY` | Airtable personal access token (exists) |
| `AIRTABLE_BASE_ID` | Base ID (exists) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key (dashboard → Profile → API keys) |
| `ELEVENLABS_AGENT_ID_SCOUT` | Scout's agent ID after creation |
| `ELEVENLABS_WEBHOOK_SECRET` | Shared secret for post-call webhook HMAC |
| `AGENT_TOOLS_TOKEN` | Bearer token protecting the `/agent/*` tool endpoints |

## First-run sequence (Phase 1)

1. [ ] Complete Phase 0 repo fixes ([[20 - Architecture & Integration]]) and redeploy; confirm `GET /` returns healthy on the Railway URL.
2. [ ] ElevenLabs dashboard → **Agents** → create agent "Scout" using the config in [[01 - Agent - Scout (Lead Qualification)]] (first message, system prompt, voice, temperature).
3. [ ] Add the `get_lead` webhook tool pointing at `https://<railway-url>/agent/scout` with the bearer token header.
4. [ ] Test in the **playground**: run 5+ mock conversations (eager seller, hostile owner, wrong person, voicemail-style silence, "what's my business worth?" trap). Tune prompt until all pass.
5. [ ] Set up **post-call webhook** in workspace settings → point at `/webhooks/elevenlabs/post-call` (Phase 2 endpoint) with the shared secret.
6. [ ] Buy/assign a **phone number** to Scout; place a real test call yourself.
7. [ ] Record agent ID + phone number here:
	- Scout agent ID: `…`
	- Phone number: `…`

## Cost guardrails

- [ ] Set a usage alert in ElevenLabs billing.
- [ ] Cap max call duration at 10 min in agent settings.
- [ ] Review first week of Call Logs manually before scaling outbound volume ([[10 - Automations & Webhooks]]).

## Compliance notes (US outbound calling)

- Outbound AI voice calls to cell phones generally require **prior express consent** (TCPA); AI-generated voice calls fall under FCC robocall rules. Leads should have opted in to contact (e.g., inbound form submission).
- Honor DNC immediately — `DNC` checkbox in Airtable excludes at query time ([[03 - Agent - Sentry (Follow-up & Reminders)]]).
- The agent should disclose it's an AI assistant when asked, and calling windows are restricted to 10am–6pm local.
- Worth a quick review with counsel before scaling cold outbound.
