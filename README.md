# BrandForge

**From product idea to personal brand.** BrandForge helps entrepreneurs, creators, and small businesses discover product opportunities in the U.S. market and turn them into complete personal brand strategies — including brand names, taglines, original logo concepts, color palettes, fonts, social bios, content ideas, and a launch marketing plan.

## Features

| Step | What it does |
|---|---|
| **1. Discover** | Enter any product, niche, or idea. BrandForge detects the category and scores the opportunity. |
| **2. Insights** | Market trends, target audiences with pain points and channels, competitor landscape, pricing tiers, and positioning strategies for the category. Plus live search demand: interest trends, rising searches, and real question queries via Google Trends (free, default) or Semrush (volumes + CPC). |
| **3. Brand Ideas** | Six brand concepts per run — evocative names, invented words, personal-brand formats — each with taglines, naming rationale, and social handle ideas. Regenerate for fresh batches. |
| **4. Visual Identity** | Original SVG logo concepts (monogram, abstract mark, wordmark, badge, lockup), three color palettes, font pairings, and photography/visual direction. Download any logo as SVG. |
| **5. Clients** | Onboard clients: name, business idea, product, audience, personality, preferred colors, and style. Records persist to disk. |
| **6. Brand Package** | One-click deliverable combining everything: brand name, tagline, logos, palette, audience profile, social bios, 2-week content plan, and marketing direction. Export as JSON or print to PDF. |

## Running

```bash
npm install
npm start
# open http://localhost:3000
```

Requires Node 18+. No API keys are required — the analysis and generation engines are built in, and live search data comes from the free Google Trends backend by default.

### Live search data

Every analysis includes a **"Live search demand"** card and every brand package an **"SEO keywords to target"** section. Three interchangeable backends power them:

| Backend | Cost / setup | What you get |
|---|---|---|
| **Google Trends + Autocomplete** *(default — zero setup)* | Free, no key or account | 12-month interest trend + momentum, seasonality peak, related & **rising** searches (▲ +300%), and the real questions people type into Google |
| **Semrush Analytics REST API** | `SEMRUSH_API_KEY` in `.env`; plan with API units (usually the separate API add-on) | Absolute monthly search volume, CPC, paid-competition density, related keywords by volume, question keywords |
| **Semrush MCP server** | `SEARCH_MODE=semrush-mcp` in `.env`, then click **Connect Semrush account** in Insights; requires an [MCP-enabled plan](https://www.semrush.com/mcp-access) (Semrush One Starter/Pro+, SEO Classic Pro/Guru) | Same data as the REST API |

Selection is automatic: Semrush REST if a key is set, else Semrush MCP if connected, else Google. Force one with `SEARCH_MODE=google|semrush-api|semrush-mcp|off`.

**About the Google backend:** it calls the same internal endpoints the trends.google.com site uses (there is no official Trends API), plus Google's public autocomplete endpoint. Trends numbers are *relative* — interest is indexed to the keyword's own 12-month peak (100), so the card shows momentum, seasonality, and rising queries rather than absolute volumes (that's the Semrush upgrade). Unofficial endpoints can occasionally change or rate-limit; the 24-hour cache keeps request counts low, and failures degrade gracefully to an unenriched analysis.

**How Semrush MCP mode works:** the app is a full MCP client against Semrush's official endpoint (`https://mcp.semrush.com/v2/mcp`, streamable HTTP). Authentication is OAuth 2.0 with dynamic client registration and PKCE — `/api/semrush/connect` starts the flow, `/api/semrush/callback` completes it, and tokens persist in `data/semrush-oauth.json` (gitignored). Alternatively set `SEMRUSH_MCP_API_KEY` to authenticate with an `Authorization: Apikey` header and skip OAuth. `POST /api/semrush/disconnect` clears credentials; `GET /api/semrush/status` reports the active mode. Behind a domain/proxy, set `SEMRUSH_MCP_REDIRECT_URL` to your public callback URL.

Notes:

- All backends cache responses in-memory for 24 hours (Semrush bills per response line; Google rate-limits).
- Long product descriptions are automatically distilled to a searchable keyword ("Handmade soy candles with nostalgic scents" → "soy candles"), falling back to shorter phrases until one has measurable interest.
- Enrichment is additive and never blocks analysis — if a data source is down, the app runs exactly as before.
- `SEMRUSH_DATABASE` sets the region for all backends (default `us`); see `.env.example` for all overrides.

## API

All generation is available headlessly:

- `GET /api/meta` — categories, tones, design styles, and whether Semrush is enabled
- `POST /api/analyze` — `{ product, description?, categoryId?, goals?, tone? }` → market/audience analysis (+ `searchData` when Semrush is configured)
- `POST /api/brands` — `{ product, categoryId?, tone?, founderName?, variant? }` → brand concepts
- `POST /api/identity` — `{ brandName, categoryId?, style?, preferredColors?, variant? }` → palettes, fonts, SVG logos
- `GET/POST /api/clients`, `GET/DELETE /api/clients/:id` — client onboarding records
- `POST /api/package` — `{ clientId }` or a full spec → complete brand package (+ `searchInsights` when Semrush is configured)

Generation is seeded: the same inputs return the same results, and the `variant` counter produces fresh alternatives on demand.

## Architecture

```
src/
  index.js            Express server + static hosting
  routes/api.js       REST endpoints
  lib/
    knowledge.js      U.S. market knowledge base (12 product categories)
    analyzer.js       Product intake → opportunity analysis
    names.js          Brand name, tagline & handle generation
    searchCommon.js   Shared normalization for search-demand data
    searchData.js     Backend dispatcher (google / semrush-api / semrush-mcp)
    googleTrends.js   Free Google Trends + Autocomplete backend (default)
    semrush.js        Semrush Analytics REST API backend
    semrushMcp.js     Semrush MCP backend (OAuth + Apikey auth)
    identity.js       Palettes, font pairings, original SVG logo generation
    packageBuilder.js Brand package assembly (content ideas, marketing plan)
    store.js          JSON-file persistence for clients
public/               Single-page app (vanilla JS, no build step)
data/                 Client records (gitignored, created at runtime)
```

## A note on originality

Logo concepts are generated from original geometry and the brand's own letterforms — nothing is copied from existing marks. Even so, always run a USPTO trademark search and check social handle availability before committing to a name or logo commercially. The app repeats this disclaimer wherever names and logos are generated.
