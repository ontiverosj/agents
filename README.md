# TikTok Niche Finder

A dashboard that helps you find promising TikTok niches and turn them into a content strategy. It tracks public video performance per niche over time, scores each niche's opportunity, and generates a concrete game plan (hooks, formats, posting schedule, hashtags, video outlines) for making videos in it.

> **About "watch time":** TikTok does not expose watch time for other creators' videos — real retention data exists only for your own videos in TikTok's creator analytics. This app computes an **estimated retention score** (0–100) from public engagement signals (comments, shares, and saves per view, adjusted for video length). It's labeled as an estimate everywhere it appears.

## What it does

- **Niche leaderboard** — every tracked niche ranked by an opportunity score built from five signals: demand (median views), engagement, achievability (share of videos NOT from 500K+ accounts), momentum (view velocity trend), and estimated retention.
- **Niche detail** — metric cards for each score component, views-over-time and score-history charts, and a sortable top-videos table with links to TikTok.
- **Game plans** — a full content strategy per niche: 5-8 hooks with reasoning, formats with target durations, a 7-day posting schedule, tiered hashtag strategy, 3 video outlines with second-by-second beats, and KPIs.
- **Discover** — preview any topic's stats before committing to tracking it.
- **Automatic history** — a background scheduler re-fetches tracked niches (default every 6 hours) so velocity and trend charts build over time.

## Zero-config demo mode

With no environment variables set, the app runs fully on a realistic built-in sample-data provider and a template-based plan generator — so you can explore everything before paying for any API.

| Capability | Free default | Upgrade | Env var |
|---|---|---|---|
| TikTok data | Deterministic sample data (~10 seed niches, any search works) | Live public data via [Apify's TikTok Scraper](https://apify.com/clockworks/tiktok-scraper) | `APIFY_TOKEN` |
| Game plans | Template generator driven by niche stats | AI plans via the Claude API | `ANTHROPIC_API_KEY` |

The header pill shows which mode is active (`data: sample · plans: template` vs `data: live · plans: AI`).

## Running locally

```bash
npm install                # backend deps
npm run build              # installs client deps + builds the dashboard
npm start                  # http://localhost:3000
```

For frontend development with hot reload:

```bash
npm run dev                # API on :3000
npm run dev:client         # Vite dev server on :5173, proxies /api
```

Configuration lives in `.env` (see `.env.example` — everything is optional).

## Deploying on Railway

Already configured via `railway.toml` (build: `npm ci && npm run build`, start: `npm start`). Two things to set up in the Railway dashboard:

1. **Volume** — mount a volume (e.g. at `/data`) and set `DATA_DIR=/data` so the SQLite database survives deploys.
2. **Env vars** — add `APIFY_TOKEN` / `ANTHROPIC_API_KEY` when you're ready for live data and AI plans. Optionally `DASHBOARD_PASSWORD` to put the dashboard behind basic auth (username can be anything).

## API

All endpoints under `/api` return JSON:

- `GET /api/health` — active providers
- `GET /api/niches` — leaderboard with latest scores + sparkline history
- `POST /api/niches` `{name, hashtags[]}` — track a niche (refreshes immediately)
- `GET /api/niches/:id` · `DELETE /api/niches/:id` (archive)
- `POST /api/niches/:id/refresh` — pull fresh metrics now
- `GET /api/niches/:id/timeseries?days=30` — score + aggregate metric history
- `GET /api/niches/:id/videos?sort=views|velocity|engagement|watch`
- `GET /api/discover?q=topic` — preview without persisting
- `POST /api/niches/:id/gameplan` · `GET /api/niches/:id/gameplan` · `GET /api/niches/:id/gameplans`

The legacy lead API (`POST /agent/scout`, Airtable-backed) is preserved and returns 503 when Airtable credentials are not configured.

## How scoring works

Per video (from its latest snapshot): weighted engagement rate `(likes + 2·comments + 3·shares + 2·saves) / views`, view velocity (views/hr between snapshots), and the estimated retention score. Per niche, on every refresh:

```
opportunity = 100 × ( 0.30·demand        log10(median views) / 7
            + 0.20·engagement            avg ER vs a 10% ceiling
            + 0.25·achievability         1 − share of videos from 500K+ accounts
            + 0.15·momentum              velocity now vs ~7 days ago
            + 0.10·retention )           avg estimated retention / 100
```

Weights live in one constants object at the top of `src/services/scoring.js` for easy tuning.

## Project layout

```
src/
  server.js            Express entry: /api, legacy /agent, serves client/dist
  config.js            env parsing
  db/                  better-sqlite3 + schema (niches, videos, snapshots, scores, plans)
  providers/           pluggable data layer: mockProvider (default) / apifyProvider
  services/
    scoring.js         pure scoring functions
    nicheService.js    fetch → upsert videos → snapshot → score
    scheduler.js       periodic refresh (node-cron)
    gameplan/          claudePlanner (AI) + rulePlanner (template) + dispatcher
  routes/              api.js, legacy.js
client/                React + Vite + recharts dashboard (dark theme)
```
