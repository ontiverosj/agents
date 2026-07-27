---
tags: [elevenlabs, agent, sentry, voice, automation]
created: 2026-07-27
status: phase-3
---

# Sentry — Follow-up & Reminder Agent

Sentry keeps the pipeline warm. It re-engages leads that went quiet and calls sellers the day before a booked appointment. Same voice stack as Scout, different mission and much tighter script.

Back to [[00 - ElevenLabs Agents Overview]].

## Two jobs

### 1. Stale-lead re-engagement
- Trigger: a scheduled job hits `POST /jobs/sentry-sweep`, which finds lead tasks with `Seller Intent = open`, no `DNC`, and `Last Called At` older than N days (start with 14).
- Sentry calls, references the earlier conversation ("we spoke a couple weeks ago…"), asks whether anything has changed, and offers to book time with Jake.
- Outcome written back via the same post-call webhook → [[02 - Agent - Scribe (Post-Call Notes)]].

### 2. Appointment reminders
- Trigger: follow-up records with a call scheduled in the next 24h.
- 60-second reminder call: confirm the time, offer to reschedule, done.

## Mechanics

- Use the **ElevenLabs Batch Calling API** to submit the day's call list in one job (recipient list = phone numbers + dynamic variables per lead: `lead_id`, `owner_name`, `business_name`, `last_call_summary`).
- Calling window: 10am–6pm lead-local time only; skip weekends. Enforce in the scheduler, not the agent.
- Retry policy: no-answer → one retry next day, then mark `Call Status = unreachable` and stop. Never more than 2 attempts per week per lead — this is re-engagement, not collections.
- Do-not-call: any lead with `Seller Intent = not_interested` or a DNC flag is excluded at query time.

## Agent config deltas vs Scout

- First message references history: "Hi {{owner_name}}, it's Scout from Everflow Acquisitions — we spoke on {{last_call_date}}…" (keep the Scout persona name on the phone; "Sentry" is internal).
- Max duration 5 min.
- System prompt adds: if the lead sounds annoyed, apologize, offer removal, end quickly. Preserving goodwill beats one more data point.

## Prereqs

- Phase 2 complete (webhook + ClickUp custom fields live) — see [[10 - Automations & Webhooks]] and [[20 - Architecture & Integration]].
- A scheduler invoking `POST /jobs/sentry-sweep` daily: host cron, a GitHub Actions cron workflow, or a ClickUp recurring automation.
