---
tags: [elevenlabs, agents, moc, everflow, clickup, claude]
created: 2026-07-27
status: active
---

# ElevenLabs Agents — Overview & Roadmap

Voice AI layer for the Everflow Acquisitions lead pipeline. **Stack: ClickUp + Claude + ElevenLabs.** Leads live as tasks in a ClickUp list; a small Express API (`server.js`, host-agnostic — runs anywhere Node runs) connects ElevenLabs Conversational AI agents to ClickUp, and Claude analyzes every call transcript into structured qualification data. The agents call leads, qualify them, log everything back to ClickUp, and keep follow-ups moving without manual dialing.

## The agent lineup

| Agent | Type | Job | Note |
|---|---|---|---|
| **Scout** | Conversational (voice) | Calls & qualifies acquisition leads, books follow-ups | [[01 - Agent - Scout (Lead Qualification)]] |
| **Scribe** | Automation (webhook + Claude) | Analyzes transcripts, writes summaries & data to ClickUp | [[02 - Agent - Scribe (Post-Call Notes)]] |
| **Sentry** | Conversational (voice, scheduled) | Re-engages quiet leads, call reminders | [[03 - Agent - Sentry (Follow-up & Reminders)]] |
| **Sage** | Assistant (text/voice) | Q&A over collected deal data | [[04 - Agents - Sage & Scholar (Later Phases)]] |
| **Scholar** | Automation | Pre-call research & lead enrichment | [[04 - Agents - Sage & Scholar (Later Phases)]] |

Supporting notes:
- [[10 - Automations & Webhooks]] — the glue: post-call webhook, new-lead outbound trigger
- [[20 - Architecture & Integration]] — system map, ClickUp fields needed, code layout
- [[30 - Setup Checklist & Credentials]] — accounts, keys, env vars, first-run steps

## Roadmap

### Phase 0 — Foundation ✅ code done
- [x] Express server boots correctly (`npm start` → `server.js`)
- [x] ClickUp client (`src/clickup.js`): lead lookup, custom-field updates by name, call-log comments, stale-lead queries
- [x] Claude client (`src/claude.js`): transcript → structured qualification data (Claude Opus with automatic refusal fallback)
- [ ] Deploy the server somewhere reachable by ElevenLabs (any Node host — Render, Fly, VPS, or ngrok for testing) and confirm `GET /` health check
- [ ] Set env vars per [[30 - Setup Checklist & Credentials]]

### Phase 1 — Scout live
- [ ] Create ElevenLabs account / API key
- [ ] Build Scout agent in the ElevenLabs dashboard per [[01 - Agent - Scout (Lead Qualification)]]
- [x] Wire Scout's tools to the lead API — endpoints live: `POST /agent/scout`, `PATCH /agent/scout/lead`, `POST /agent/scout/followup`
- [ ] Add the qualification custom fields to the ClickUp leads list ([[20 - Architecture & Integration]])
- [ ] Test conversations in the ElevenLabs playground
- [ ] Attach a phone number (ElevenLabs native or Twilio)
- [ ] First real inbound test call

### Phase 2 — Automations (Scribe)
- [x] `POST /webhooks/elevenlabs/post-call` endpoint with HMAC verification
- [x] Claude transcript analysis → ClickUp custom fields + call-log comment on the lead task (idempotent per conversation)
- [x] New-lead trigger endpoint → outbound Scout call: `POST /jobs/outbound-call`
- [ ] ClickUp automation: when a task is flagged "ready to call" → webhook action → `/jobs/outbound-call`

### Phase 3 — Sentry
- [x] Stale-lead sweep endpoint: `POST /jobs/sentry-sweep` (batch calling)
- [ ] Scheduler invoking the sweep daily (host cron, GitHub Actions cron, or ClickUp recurring automation)
- [ ] Reminder calls for booked appointments

### Phase 4 — Sage & Scholar + analytics
- [ ] Sage: deal Q&A assistant over accumulated call data (Claude over ClickUp tasks + comments)
- [ ] Scholar: pre-call enrichment pipeline
- [ ] Dashboard: call outcomes, qualification rates, cost per qualified lead
