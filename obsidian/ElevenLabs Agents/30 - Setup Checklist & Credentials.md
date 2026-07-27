---
tags: [elevenlabs, setup, credentials, checklist, clickup, claude]
created: 2026-07-27
status: phase-1
---

# Setup Checklist & Credentials

Everything needed to go from zero to Scout's first call. **No actual secrets in this note — names only.** Values live in the host's env vars and a password manager. Back to [[00 - ElevenLabs Agents Overview]].

## Accounts

- [ ] **ElevenLabs** — paid plan with Conversational AI (calls billed per minute; Creator tier is fine to start, watch usage)
- [ ] **ClickUp** — existing workspace; personal API token (Settings → Apps → API Token) and a leads list with the custom fields from [[20 - Architecture & Integration]]
- [ ] **Anthropic** — API key for Claude (console.anthropic.com) — powers Scribe's transcript analysis
- [ ] **A Node host** — anywhere the Express server can run with a public HTTPS URL (Render, Fly.io, a VPS; ngrok works for testing)
- [ ] **Twilio** — optional, only if not using ElevenLabs native numbers

## Env vars

| Variable | What it is |
|---|---|
| `CLICKUP_API_TOKEN` | ClickUp personal API token |
| `CLICKUP_LEADS_LIST_ID` | ID of the leads list (in the list URL) |
| `CLICKUP_FIELD_*` | Optional custom-field name overrides — see `.env.example` |
| `ANTHROPIC_API_KEY` | Claude API key (transcript analysis) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key (dashboard → Profile → API keys) |
| `ELEVENLABS_AGENT_ID_SCOUT` | Scout's agent ID after creation |
| `ELEVENLABS_AGENT_ID_SENTRY` | Optional — falls back to Scout's ID |
| `ELEVENLABS_PHONE_NUMBER_ID` | Phone number ID for outbound calls |
| `ELEVENLABS_WEBHOOK_SECRET` | Shared secret for post-call webhook HMAC |
| `AGENT_TOOLS_TOKEN` | Bearer token protecting the `/agent/*`, `/jobs/*`, `/leads` endpoints |

## First-run sequence (Phase 1)

1. [x] ClickUp is set up ✅ — the **Acquisition Leads** list (`901616160330`) exists with all 12 custom fields and a sample lead. Verified end-to-end 2026-07-27 (field writes, dropdown resolution, call-log comments, idempotency). ⚠️ **Rotate the ClickUp API token** (Settings → Apps → API Token) since the setup one was shared in chat, and put the new one only in the host's env. Re-run `scripts/setup-clickup.js` any time to re-verify fields.
2. [ ] Deploy the server (`npm start`); confirm `GET /` returns healthy on the public URL. (ngrok works while testing: `ngrok http 3000`.)
3. [ ] Run `ELEVENLABS_API_KEY=xi_xxx SERVER_URL=https://<host> AGENT_TOOLS_TOKEN=<token> node scripts/setup-elevenlabs.js` — creates the three webhook tools and the Scout agent (per [[01 - Agent - Scout (Lead Qualification)]]) and prints `ELEVENLABS_AGENT_ID_SCOUT`. Idempotent; re-run after changing the server URL.
4. [x] ~~Manually add the webhook tools~~ — handled by the script above.
5. [ ] Test in the **playground**: run 5+ mock conversations (eager seller, hostile owner, wrong person, silence, "what's my business worth?" trap). Tune the prompt until all pass.
6. [ ] Set up the **post-call webhook** in workspace settings → `https://<host>/webhooks/elevenlabs/post-call` with the shared secret. Verify a test call produces a comment + field updates on the lead task.
7. [ ] Buy/assign a **phone number** to Scout; place a real test call yourself.
8. [ ] Record agent ID + phone number here:
	- Scout agent ID: `…`
	- Phone number: `…`

## Cost guardrails

- [ ] Usage alert in ElevenLabs billing; spend limit on the Anthropic console.
- [ ] Cap max call duration at 10 min in agent settings.
- [ ] Review the first week of call-log comments manually before scaling outbound volume ([[10 - Automations & Webhooks]]).

## Compliance notes (US outbound calling)

- Outbound AI voice calls to cell phones generally require **prior express consent** (TCPA); AI-generated voice calls fall under FCC robocall rules. Leads should have opted in to contact (e.g., inbound form submission).
- Honor DNC immediately — the `DNC` checkbox on the lead task excludes it from all calling, and Scribe checks it automatically when a lead asks not to be contacted ([[02 - Agent - Scribe (Post-Call Notes)]]).
- The agent should disclose it's an AI assistant when asked; calling windows are restricted to 10am–6pm local.
- Worth a quick review with counsel before scaling cold outbound.
