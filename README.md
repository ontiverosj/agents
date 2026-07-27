# agents

Everflow Acquisitions agents API — an Express server on Railway backed by the
`Acquisition Leads` table in Airtable, plus the build-out plan for ElevenLabs
voice agents and automations.

## Code

- `server.js` — Express app: health check (`GET /`), lead lookup (`POST /agent/scout`)
- `src/airtable.js` — Airtable client (`AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`)
- `railway.toml` — Railway deployment config

## ElevenLabs agents plan (Obsidian notes)

The full plan lives in [`obsidian/ElevenLabs Agents/`](obsidian/ElevenLabs%20Agents/)
as Obsidian-ready markdown (frontmatter + wikilinks + Mermaid diagrams).
Start at `00 - ElevenLabs Agents Overview.md`.

To use in Obsidian: copy the `ElevenLabs Agents` folder into your vault, or
sync this repo into the vault with the obsidian-git plugin.
