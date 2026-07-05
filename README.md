# BrandForge

**From product idea to personal brand.** BrandForge helps entrepreneurs, creators, and small businesses discover product opportunities in the U.S. market and turn them into complete personal brand strategies — including brand names, taglines, original logo concepts, color palettes, fonts, social bios, content ideas, and a launch marketing plan.

## Features

| Step | What it does |
|---|---|
| **1. Discover** | Enter any product, niche, or idea. BrandForge detects the category and scores the opportunity. |
| **2. Insights** | Market trends, target audiences with pain points and channels, competitor landscape, pricing tiers, and positioning strategies for the category. |
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

Requires Node 18+. No API keys or external services needed — the analysis and generation engines are built in.

## API

All generation is available headlessly:

- `GET /api/meta` — categories, tones, and design styles for building forms
- `POST /api/analyze` — `{ product, description?, categoryId?, goals?, tone? }` → market/audience analysis
- `POST /api/brands` — `{ product, categoryId?, tone?, founderName?, variant? }` → brand concepts
- `POST /api/identity` — `{ brandName, categoryId?, style?, preferredColors?, variant? }` → palettes, fonts, SVG logos
- `GET/POST /api/clients`, `GET/DELETE /api/clients/:id` — client onboarding records
- `POST /api/package` — `{ clientId }` or a full spec → complete brand package

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
    identity.js       Palettes, font pairings, original SVG logo generation
    packageBuilder.js Brand package assembly (content ideas, marketing plan)
    store.js          JSON-file persistence for clients
public/               Single-page app (vanilla JS, no build step)
data/                 Client records (gitignored, created at runtime)
```

## A note on originality

Logo concepts are generated from original geometry and the brand's own letterforms — nothing is copied from existing marks. Even so, always run a USPTO trademark search and check social handle availability before committing to a name or logo commercially. The app repeats this disclaimer wherever names and logos are generated.
