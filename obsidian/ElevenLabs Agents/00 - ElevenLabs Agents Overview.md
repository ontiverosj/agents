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

### Phase 0 — Repo fixes (prerequisite)
The Railway server must actually boot before webhooks can land. Details in [[20 - Architecture & Integration]].
- [ ] Point `package.json` `start` at `server.js` (currently boots `src/index.js`, a router with no `app.listen`)
- [ ] Add `dotenv` and `airtable` to `dependencies`
- [ ] Remove hardcoded `YOUR_BASE_ID` in `src/index.js`; unify table name to `Acquisition Leads`
- [ ] Fix `getLeadById` to return a single record (it returns an array, so the 404 check never fires)
- [ ] Redeploy to Railway and verify `GET /` health check

### Phase 1 — Scout live
- [ ] Create ElevenLabs account / API key
- [ ] Build Scout agent in the ElevenLabs dashboard per [[01 - Agent - Scout (Lead Qualification)]]
- [ ] Wire Scout's tools to the lead API (`POST /agent/scout`)
- [ ] Test conversations in the ElevenLabs playground
- [ ] Attach a phone number (ElevenLabs native or Twilio)
- [ ] First real inbound test call

### Phase 2 — Automations (Scribe)
- [ ] Add `POST /webhooks/elevenlabs/post-call` endpoint with HMAC verification
- [ ] Add call-log fields to Airtable (see [[20 - Architecture & Integration]])
- [ ] Post-call webhook → summary + qualification data into Airtable
- [ ] New-lead trigger → outbound Scout call (batch calling)

### Phase 3 — Sentry
- [ ] Scheduled job scans Airtable for stale leads
- [ ] Batch follow-up calls via ElevenLabs Batch Calling API
- [ ] Reminder calls for booked appointments

### Phase 4 — Sage & Scholar + analytics
- [ ] Sage: deal Q&A assistant over accumulated call data
- [ ] Scholar: pre-call enrichment pipeline
- [ ] Dashboard: call outcomes, qualification rates, cost per qualified lead
