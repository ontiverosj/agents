# agents

- **`emissary/`** — Emissary, an AI workforce platform MVP: marketing site + product
  dashboard for creating always-on AI coworkers that browse the web, collect data,
  monitor changes, fill forms, and deliver reports with human approvals and audit
  trails. Next.js 16 + Tailwind CSS 4. See [`emissary/README.md`](emissary/README.md)
  for the full feature list and production architecture.

  ```bash
  cd emissary && npm install && npm run dev
  ```

- **`src/` + `server.js`** — a small legacy Express service exposing `POST /agent/scout`
  (Airtable lead lookup).
