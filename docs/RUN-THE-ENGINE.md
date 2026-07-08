# Running the real agent engine (gobii-platform) as Emissary

Strategy: self-host the MIT-licensed [gobii-ai/gobii-platform](https://github.com/gobii-ai/gobii-platform)
as the execution engine — real browser agents, scheduling, triggers — rebranded as
Emissary, with our Next.js site (`emissary/`) as the public marketing front.

## Legal ground rules (read once)

- The code is **MIT licensed** — free to use, modify, and run commercially.
  Keep their `LICENSE` and `NOTICE` files in the source tree.
- The **"Gobii" name and logos are trademarks** and NOT covered by MIT. Rebrand
  everything customer-facing (the platform supports this via env vars — below).
- **Leave `GOBII_PROPRIETARY_MODE` off** (it defaults off). Proprietary-marked
  components require a commercial license from Gobii, Inc. The open-source core
  is everything we need.

## Run it on the Mac (full stack, ~15 min)

1. Install **Docker Desktop** and give it **12 GB RAM** (Settings → Resources).
2. Then:

```bash
git clone https://github.com/gobii-ai/gobii-platform.git
cd gobii-platform
```

3. Create a `.env` in that folder — this is the Emissary skin plus your model key:

```bash
# --- brand (the open-source build is designed to be rebranded via env) ---
PUBLIC_BRAND_NAME=Emissary
PUBLIC_SITE_URL=http://localhost:8000
PUBLIC_CONTACT_EMAIL=jake@everflowacquisitions.com
PUBLIC_SUPPORT_EMAIL=jake@everflowacquisitions.com

# --- model provider (agents think with this) ---
ANTHROPIC_API_KEY=sk-ant-...
```

4. Launch:

```bash
docker compose up --build          # app + workers + Postgres + Redis
# optional extras:
# docker compose --profile beat up    # cron/event scheduler
# docker compose --profile email up   # inbound-email triggers
```

5. Open **http://localhost:8000**, create the admin account, spawn an agent, and
   give it a task — this one actually browses.

Lighter developer mode (4 GB RAM: Django + Celery on the host, only Postgres/Redis
in Docker) is documented in the repo's `DEVELOPMENT.md`.

## Rebrand checklist (Emissary skin)

| What | Where | Done by |
| --- | --- | --- |
| Product name everywhere | `PUBLIC_BRAND_NAME=Emissary` env | env var (no code) |
| Site URL / emails | `PUBLIC_SITE_URL`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_SUPPORT_EMAIL` | env vars |
| Logo | replace files in `assets/logo/` + check `templates/includes/_header_logo_image.html` | swap our violet bars mark (in `emissary/src/components/ui.tsx` as SVG) |
| Accent colors | frontend Tailwind/CSS in `frontend/` | optional pass: ink `#171b36`, violet `#6b2bf7` |
| Keep attribution | `LICENSE`, `NOTICE` stay in the tree | nothing to do |

## How the pieces fit

```
emissary/  (this repo)          gobii-platform (self-hosted)
Next.js marketing site   --->   the actual product console
home, pricing, security         agents, runs, schedules, triggers
CTAs point at the app URL       http://localhost:8000 (later app.yourdomain.com)
```

When the engine is deployed to a real domain, point the marketing site's
Start Free / Log in CTAs at it (add `NEXT_PUBLIC_APP_URL` and swap the hrefs),
and keep our Emissary dashboard as design reference for restyling the console.
