# BrandForge

**From product idea to personal brand.** BrandForge helps entrepreneurs, creators, and small businesses discover product opportunities in the U.S. market and turn them into complete personal brand strategies — including brand names, taglines, original logo concepts, color palettes, fonts, social bios, content ideas, and a launch marketing plan.

## Features

| Step | What it does |
|---|---|
| **1. Discover** | Enter any product, niche, or idea. BrandForge detects the category and scores the opportunity. |
| **2. Insights** | Market trends, target audiences with pain points and channels, competitor landscape, pricing tiers, and positioning strategies for the category. With Semrush connected: live U.S. search volume, CPC, competition, 12-month trend, related keywords, and question searches. |
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

Requires Node 18+. No API keys are required — the analysis and generation engines are built in.

### Optional: live search data via Semrush

Set a Semrush API key to enrich the app with real search-demand data:

```bash
cp .env.example .env   # then paste your key into SEMRUSH_API_KEY
npm start
```

What it adds:

- **Insights step** — a "Live search demand" card: monthly U.S. search volume, average CPC, paid-competition density, a 12-month interest trend, the top related keywords by volume, and the questions people search (ready-made content ideas).
- **Brand package** — an "SEO keywords to target" section with keywords to work into the site/listings and questions to answer in content.

Notes:

- Keys come from Semrush's [Analytics API](https://www.semrush.com/api-documentation/) (requires a plan with API units). Every response line consumes units, so BrandForge caches responses in-memory for 24 hours.
- Long product descriptions are automatically distilled to a searchable keyword ("Handmade soy candles with nostalgic scents" → "soy candles"), falling back to shorter phrases until one has measurable volume.
- Without a key (or if Semrush is down/out of units) the app runs exactly as before — enrichment is additive and never blocks analysis.
- `SEMRUSH_DATABASE` can override the regional database (default `us`).

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
    semrush.js        Semrush Analytics API client (optional live search data)
    identity.js       Palettes, font pairings, original SVG logo generation
    packageBuilder.js Brand package assembly (content ideas, marketing plan)
    store.js          JSON-file persistence for clients
public/               Single-page app (vanilla JS, no build step)
data/                 Client records (gitignored, created at runtime)
```

## A note on originality

Logo concepts are generated from original geometry and the brand's own letterforms — nothing is copied from existing marks. Even so, always run a USPTO trademark search and check social handle availability before committing to a name or logo commercially. The app repeats this disclaimer wherever names and logos are generated.
