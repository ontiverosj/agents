---
tags: [elevenlabs, agent, sage, scholar]
created: 2026-07-27
status: shipped
---

# Sage & Scholar

Both shipped as Claude-powered endpoints on the agents API. Back to [[00 - ElevenLabs Agents Overview]].

## Sage — Deal Analysis Assistant ✅

**What:** ask questions about the pipeline in plain English: *"Which open leads haven't been called in 30 days?"*, *"Summarize everything we know about Acme HVAC."*

**How it works:** `POST /agent/sage` with `{ "question": "..." }` (bearer token required). The server gathers all lead tasks plus the call-log comments of the 10 most recently called leads, and Claude answers strictly from that data — it's instructed never to invent leads or numbers.

```bash
curl -X POST https://<host>/agent/sage \
  -H "Authorization: Bearer $AGENT_TOOLS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"question": "Which leads look most promising and why?"}'
```

Answers get sharper as call volume grows — the transcripts in the call logs are the moat.

## Scholar — Pre-Call Research & Enrichment ✅

**What:** before a call, Scholar researches the business on the web (Claude with server-side web search) and writes a ≤150-word **Pre-Call Brief** to the lead task — field + a 🔎 comment. Outbound Scout calls automatically receive it as the `pre_call_brief` dynamic variable, so calls open smart ("I saw you've been running the shop since 2009…") without ever revealing the research.

**How it works:** `POST /jobs/enrich-lead` with `{ "lead_id": "..." }`. Wire a ClickUp Automation at it (e.g. *when a task is created → Call webhook*) or hit it manually before queueing a call. If Claude can't confidently identify the business online, the brief says so rather than guessing.

**Later ideas:** enrich from Apollo/Clay/Semrush connectors; a voice interface for Sage.
