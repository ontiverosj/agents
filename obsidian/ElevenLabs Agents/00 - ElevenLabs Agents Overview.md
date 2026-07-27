---
tags: [elevenlabs, agents, moc, everflow]
created: 2026-07-27
status: active
---

# ElevenLabs Agents — Overview & Roadmap

Voice AI layer for the Everflow Acquisitions lead pipeline. The existing stack is an Express API on Railway (`server.js`) backed by the **Acquisition Leads** table in Airtable. ElevenLabs Conversational AI agents sit on top of that: they call leads, qualify them, log everything back to Airtable, and keep follow-ups moving without manual dialing.

## The agent lineup

| Agent | Type | Job | Note |
|---|---|---|---|
| **Scout** | Conversational (voice) | Calls & qualifies acquisition leads, books follow-ups | [[01 - Agent - Scout (Lead Qualification)]] |
| **Scribe** | Automation (webhook) | Writes post-call summaries & data back to Airtable | [[02 - Agent - Scribe (Post-Call Notes)]] |
| **Sentry** | Conversational (voice, scheduled) | Re-engages quiet leads, call reminders | [[03 - Agent - Sentry (Follow-up & Reminders)]] |
| **Sage** | Assistant (text/voice) | Q&A over collected deal data | [[04 - Agents - Sage & Scholar (Later Phases)]] |
| **Scholar** | Automation | Pre-call research & lead enrichment | [[04 - Agents - Sage & Scholar (Later Phases)]] |

Supporting notes:
- [[10 - Automations & Webhooks]] — the glue: post-call webhook, new-lead outbound trigger
- [[20 - Architecture & Integration]] — system map, Airtable schema changes, repo fixes
- [[30 - Setup Checklist & Credentials]] — accounts, keys, env vars, first-run steps

## Roadmap

### Phase 0 — Repo fixes (prerequisite) ✅ code done
The Railway server must actually boot before webhooks can land. Details in [[20 - Architecture & Integration]].
- [x] Point `package.json` `start` at `server.js` (previously booted `src/index.js`, a router with no `app.listen`)
- [x] Add `dotenv` and `airtable` to `dependencies`
- [x] Remove hardcoded `YOUR_BASE_ID` in `src/index.js`; unify table name to `Acquisition Leads` (router now mounted at `/leads`)
- [x] Fix `getLeadById` to return a single record (it returned an array, so the 404 check never fired)
- [ ] Redeploy to Railway and verify `GET /` health check

### Phase 1 — Scout live
- [ ] Create ElevenLabs account / API key
- [ ] Build Scout agent in the ElevenLabs dashboard per [[01 - Agent - Scout (Lead Qualification)]]
- [x] Wire Scout's tools to the lead API — endpoints live: `POST /agent/scout`, `PATCH /agent/scout/lead`, `POST /agent/scout/followup`
- [ ] Test conversations in the ElevenLabs playground
- [ ] Attach a phone number (ElevenLabs native or Twilio)
- [ ] First real inbound test call

### Phase 2 — Automations (Scribe)
- [x] Add `POST /webhooks/elevenlabs/post-call` endpoint with HMAC verification (`server.js`)
- [ ] Add call-log fields + `Call Logs` table to Airtable (see [[20 - Architecture & Integration]])
- [x] Post-call webhook → summary + qualification data into Airtable (code; needs the Airtable fields to exist)
- [x] New-lead trigger endpoint → outbound Scout call: `POST /jobs/outbound-call` (needs Airtable automation pointed at it)

### Phase 3 — Sentry
- [x] Stale-lead sweep endpoint: `POST /jobs/sentry-sweep` (batch calling; needs a Railway cron to invoke it)
- [ ] Scheduled cron configured on Railway
- [ ] Reminder calls for booked appointments

### Phase 4 — Sage & Scholar + analytics
- [ ] Sage: deal Q&A assistant over accumulated call data
- [ ] Scholar: pre-call enrichment pipeline
- [ ] Dashboard: call outcomes, qualification rates, cost per qualified lead
