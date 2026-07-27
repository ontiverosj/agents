# agents

Everflow Acquisitions agents API — ElevenLabs voice agents wired to **ClickUp**
(leads live as tasks) with **Claude** analyzing every call transcript into
structured qualification data. Includes the full build-out plan as Obsidian
notes.

## Code

- `server.js` — Express app: health check, Scout tool endpoints, ElevenLabs
  post-call webhook, and job triggers. Host-agnostic — runs anywhere Node runs.
- `src/clickup.js` — ClickUp API v2 client: lead lookup, custom-field updates
  by name, call-log comments, stale-lead queries
- `src/claude.js` — Claude client: transcript → schema-validated qualification
  data (summary, seller intent, revenue, timeline, next step, DNC)
- `src/elevenlabs.js` — ElevenLabs client: webhook HMAC verification, outbound
  calls, batch calling
- `src/index.js` — leads listing router (mounted at `/leads`)

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /` | Health check |
| `GET /leads` | List all leads from the ClickUp leads list |
| `POST /agent/scout` | Scout tool: fetch lead by `lead_id` (ClickUp task ID) |
| `PATCH /agent/scout/lead` | Scout tool: update qualification custom fields |
| `POST /agent/scout/followup` | Scout tool: book a follow-up |
| `POST /webhooks/elevenlabs/post-call` | Scribe: Claude analysis → ClickUp fields + call-log comment |
| `POST /jobs/outbound-call` | Trigger one outbound Scout call (`{ lead_id }`) — wire a ClickUp Automation here |
| `POST /jobs/sentry-sweep` | Batch re-engagement calls for stale leads — invoke on a schedule |

All endpoints except `GET /` and the webhook require `Authorization: Bearer
$AGENT_TOOLS_TOKEN` once that env var is set. The webhook is authenticated by
ElevenLabs HMAC signature (`ELEVENLABS_WEBHOOK_SECRET`). Copy `.env.example`
to `.env` (or set the vars on your host) to configure.

## ElevenLabs agents plan (Obsidian notes)

The full plan lives in [`obsidian/ElevenLabs Agents/`](obsidian/ElevenLabs%20Agents/)
as Obsidian-ready markdown (frontmatter + wikilinks + Mermaid diagrams).
Start at `00 - ElevenLabs Agents Overview.md`.

To use in Obsidian: copy the `ElevenLabs Agents` folder into your vault, or
sync this repo into the vault with the obsidian-git plugin.
