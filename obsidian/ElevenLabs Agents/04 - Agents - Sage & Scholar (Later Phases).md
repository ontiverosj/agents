---
tags: [elevenlabs, agent, sage, scholar, backlog]
created: 2026-07-27
status: backlog
---

# Sage & Scholar — Later-Phase Agents

Scoping notes only. Neither gets built until Scout, Scribe, and Sentry are live and producing data. Back to [[00 - ElevenLabs Agents Overview]].

## Sage — Deal Analysis Assistant

**What:** an assistant (text-first, voice optional) Jake can query about the pipeline: "Which open leads over $1M revenue haven't been called in 30 days?" "Summarize everything we know about lead 214."

**How, roughly:**
- Data source: ClickUp (lead tasks + the call-log comments with transcripts accumulated by [[02 - Agent - Scribe (Post-Call Notes)]]).
- Could be an ElevenLabs conversational agent with a ClickUp-query tool, or just a Claude-powered endpoint on the existing agents API. Decide when there's real data — the transcripts are the moat, the interface is swappable.

**Prereq:** months of Call Log data. Value scales with call volume.

## Scholar — Pre-Call Research & Enrichment

**What:** before Scout or Sentry dials, Scholar enriches the lead: website, industry classification, size signals, news, registry data — and writes a one-paragraph pre-call brief to the lead record. Scout receives it as a dynamic variable, so calls open smart ("I saw you've been running the shop since 2009…").

**How, roughly:**
- Automation triggered when a lead enters the calling queue.
- Enrichment sources: web search/scrape, plus any data tools already connected (Apollo, Clay, Semrush are available as integrations).
- Output fields: `Pre-Call Brief`, `Enrichment Data` (JSON), `Enriched At`.

**Prereq:** Phase 2 outbound trigger flow exists, so there's a queue to hook into ([[10 - Automations & Webhooks]]).
