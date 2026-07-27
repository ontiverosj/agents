# agents

Everflow Acquisitions agents API — an Express server on Railway backed by the
`Acquisition Leads` table in Airtable, plus the build-out plan for ElevenLabs
voice agents and automations.

## Code

- `server.js` — Express app: health check, agent tool endpoints, ElevenLabs
  post-call webhook, and job triggers
- `src/airtable.js` — Airtable client: lead lookup/update, call logs, stale-lead queries
- `src/elevenlabs.js` — ElevenLabs client: webhook HMAC verification, outbound
  calls, batch calling
- `src/index.js` — leads listing router (mounted at `/leads`)
- `railway.toml` — Railway deployment config

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /` | Health check |
| `GET /leads` | List all leads |
| `POST /agent/scout` | Scout tool: fetch lead by `lead_id` |
| `PATCH /agent/scout/lead` | Scout tool: update qualification fields |
| `POST /agent/scout/followup` | Scout tool: book a follow-up |
| `POST /webhooks/elevenlabs/post-call` | Scribe: persist call transcript/summary to Airtable |
| `POST /jobs/outbound-call` | Trigger one outbound Scout call (`{ lead_id }`) |
| `POST /jobs/sentry-sweep` | Batch re-engagement calls for stale leads |

All endpoints except `GET /` and the webhook require `Authorization: Bearer
$AGENT_TOOLS_TOKEN` once that env var is set. The webhook is authenticated by
ElevenLabs HMAC signature (`ELEVENLABS_WEBHOOK_SECRET`). Copy `.env.example`
to `.env` (or set the vars on Railway) to configure.

## ElevenLabs agents plan (Obsidian notes)

The full plan lives in [`obsidian/ElevenLabs Agents/`](obsidian/ElevenLabs%20Agents/)
as Obsidian-ready markdown (frontmatter + wikilinks + Mermaid diagrams).
Start at `00 - ElevenLabs Agents Overview.md`.

To use in Obsidian: copy the `ElevenLabs Agents` folder into your vault, or
sync this repo into the vault with the obsidian-git plugin.
