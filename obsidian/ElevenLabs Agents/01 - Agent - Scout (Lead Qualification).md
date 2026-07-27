---
tags: [elevenlabs, agent, scout, voice]
created: 2026-07-27
status: phase-1
---

# Scout — Lead Qualification Voice Agent

The first agent to ship. Scout handles inbound calls from acquisition leads and (Phase 2+) makes outbound qualification calls. Goal of every call: figure out whether the owner is a real seller, capture the key deal facts, and book a follow-up with Jake.

Back to [[00 - ElevenLabs Agents Overview]].

## What Scout must accomplish on a call

1. Confirm they're speaking with the business owner (or decision-maker).
2. Gauge **intent to sell** (actively selling / open to offers / not interested).
3. Capture core facts: industry, rough annual revenue, rough SDE/EBITDA if offered, employee count, reason for selling, timeline.
4. Book a follow-up call and set expectations.
5. Never quote valuations, never make offers, never commit to terms — that's Jake's job.

## ElevenLabs agent configuration (dashboard)

### First message
> "Hi, this is Scout calling on behalf of Everflow Acquisitions — am I speaking with the owner of {{business_name}}?"

### System prompt (draft)
```
You are Scout, a friendly, professional acquisitions associate for Everflow
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
- If they ask to be removed from contact, apologize, confirm removal,
  and end the call politely.
- Keep calls under 8 minutes.

Use the get_lead tool at call start when a lead_id is provided. Use
update_lead_status before ending every call.
```

### Model & voice settings
- LLM: default recommended model (Gemini/Claude class); temperature ~0.4 — consistent, low-hallucination.
- Voice: pick a natural mid-register voice from the Voice Library; test 2–3 in the playground. Stability ~0.5, similarity ~0.75.
- Turn-taking: default VAD; enable interruption handling (sellers talk over agents constantly).
- Max call duration: 10 min hard cap.

### Dynamic variables
Passed per-call (from the outbound trigger or looked up via tools): `lead_id`, `business_name`, `owner_name`, `industry`.

## Tools (webhooks Scout can call)

All point at the agents API — see [[10 - Automations & Webhooks]] for endpoint specs. `lead_id` is the ClickUp task ID.

| Tool name | Method/Path | Purpose |
|---|---|---|
| `get_lead` | `POST /agent/scout` | Fetch the lead task by `lead_id` at call start |
| `update_lead_status` | `PATCH /agent/scout/lead` | Write qualification custom fields mid/end of call |
| `book_followup` | `POST /agent/scout/followup` | Set Next Step + log a follow-up comment on the task |

## Telephony options

- **ElevenLabs native numbers** — fastest path; buy a number in the dashboard, assign to Scout. Good enough for Phase 1.
- **Twilio SIP trunk** — more control, better for scale/porting; revisit in Phase 3 when Sentry adds outbound volume.

## Evaluation criteria (set in dashboard)

- Did the agent confirm decision-maker? (yes/no)
- Intent captured? (`selling_now` / `open` / `not_interested` / `unknown`)
- Revenue range captured?
- Follow-up booked?
- Any rule violations (valuation talk, offers)?

These feed the post-call webhook payload that [[02 - Agent - Scribe (Post-Call Notes)]] analyzes with Claude and writes to ClickUp.
