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
- `scripts/setup-clickup.js` — one-time ClickUp setup: discovers your
  workspace, picks the leads list, creates any missing custom fields (with
  the correct dropdown options), and prints the env vars to set. Run it
  locally: `CLICKUP_API_TOKEN=pk_xxx node scripts/setup-clickup.js`
- `scripts/setup-elevenlabs.js` — one-time ElevenLabs setup: creates the
  three webhook tools pointed at your server and the Scout agent wired to
  them (idempotent — re-run to update after changing `SERVER_URL`). Run it
  locally: `ELEVENLABS_API_KEY=xi_xxx SERVER_URL=https://your-host node
  scripts/setup-elevenlabs.js`

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /` | Health check |
| `GET /api/integrations/adobe/connect` | Create a short-lived Adobe OAuth authorization URL |
| `GET /api/integrations/adobe/status` | Report configured/connected state without exposing credentials |
| `GET /api/integrations/firefly/status` | Report Firefly server configuration/token state without exposing credentials |
| `POST /api/integrations/firefly/verify` | Verify Firefly OAuth Server-to-Server credentials and cache a short-lived token |
| `POST /api/video-edits/firefly/reframe` | Submit an Adobe Firefly Reframe v2 job using signed source/destination URLs |
| `GET /api/video-edits/firefly/jobs/:jobId` | Read Firefly render progress and output status |
| `GET /api/integrations/adobe/callback` | Adobe OAuth callback |
| `GET/POST /api/integrations/adobe/webhook` | Adobe event challenge and signed event receiver |
| `GET /leads` | List all leads from the ClickUp leads list |
| `POST /agent/scout` | Scout tool: fetch lead by `lead_id` (ClickUp task ID) |
| `PATCH /agent/scout/lead` | Scout tool: update qualification custom fields |
| `POST /agent/scout/followup` | Scout tool: book a follow-up |
| `POST /webhooks/elevenlabs/post-call` | Scribe: Claude analysis → ClickUp fields + call-log comment |
| `POST /jobs/outbound-call` | Trigger one outbound Scout call (`{ lead_id }`) — wire a ClickUp Automation here; requires Contact Consent |
| `POST /jobs/sentry-sweep` | Human-approved batch re-engagement: proposes a ClickUp approval task, dials only after an "approve" comment |
| `POST /agent/sage` | Sage: answer a question about the pipeline (`{ question }`) |
| `POST /jobs/enrich-lead` | Scholar: web-research the lead and write a Pre-Call Brief (`{ lead_id }`) |
| `POST /api/video-edits/combine` | Render two trimmed clips with crop, reverse, filters, optional SRT captions, and 720p–4K presets |

All endpoints except `GET /` and the webhook require `Authorization: Bearer
$AGENT_TOOLS_TOKEN`. Protected routes fail closed with `503` when the server token
is not configured. The webhook is authenticated by
ElevenLabs HMAC signature (`ELEVENLABS_WEBHOOK_SECRET`). Copy `.env.example`
to `.env` (or set the vars on your host) to configure.

## ElevenLabs agents plan (Obsidian notes)

The full plan lives in [`obsidian/ElevenLabs Agents/`](obsidian/ElevenLabs%20Agents/)
as Obsidian-ready markdown (frontmatter + wikilinks + Mermaid diagrams).
Start at `00 - ElevenLabs Agents Overview.md`.

To use in Obsidian: copy the `ElevenLabs Agents` folder into your vault, or
sync this repo into the vault with the obsidian-git plugin.

## Authentication safety

- Set `AGENT_TOOLS_TOKEN` before exposing the service. Protected routes reject requests when it is missing.
- Store secrets only in the host environment or a password manager; never commit `.env`.
- Rotate the shared token by updating the server, ElevenLabs tools, ClickUp automation, and cron together.
- Run `npm test` to verify bearer-token comparison and fail-closed behavior.

## Adobe integration

Configure these values on the Render service and never commit their values:

- `ADOBE_CLIENT_ID`
- `ADOBE_CLIENT_SECRET`
- `ADOBE_REDIRECT_URI` — `https://everflow-agents-api.onrender.com/api/integrations/adobe/callback`
- `ADOBE_OAUTH_STATE_SECRET` — optional dedicated signing secret; defaults to the client secret
- `ADOBE_SCOPES` — optional; defaults to `openid,AdobeID,creative_cloud`
- `ADOBE_WEBHOOK_SECRET` — required before accepting Adobe asset events

OAuth access and refresh tokens stay server-side and are never returned by status routes.
The initial token cache is in memory and clears on a service restart, so reconnect Adobe after
a deploy. Add an encrypted persistent token store before enabling multi-user accounts.

## Adobe Firefly Audio/Video APIs

Add the Audio/Video API to an Adobe Developer Console project using OAuth Server-to-Server,
then configure `ADOBE_FIREFLY_CLIENT_ID` and `ADOBE_FIREFLY_CLIENT_SECRET` on Render. The
server obtains and caches 24-hour tokens with `openid,AdobeID,firefly_api,ff_apis`; tokens and
client secrets are never returned to the browser. Reframe v2 requires HTTPS pre-signed source
and destination URLs. Submit those URLs with output dimensions and optional `focal_points`,
then poll the returned job ID through the protected status endpoint.
