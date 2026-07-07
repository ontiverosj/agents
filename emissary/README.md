# Emissary — AI coworkers for real web work

Emissary is an AI workforce platform: businesses create always-on AI workers that browse
the web, collect data, monitor websites, fill out forms, research leads, and deliver
structured outputs (CSVs, PDFs, reports, CRM updates, email drafts) — with human approval
checkpoints, live browser previews, task replay, and full audit logs.

This directory contains the **MVP**: the complete marketing site, the product dashboard
with realistic sample data, the seven-step agent-creation flow, and stub API routes that
mirror the production data model.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build
```

## What's in the MVP

**Marketing site** (all responsive, statically prerendered):

| Route | Page |
| --- | --- |
| `/` | Home — hero with three active AI coworkers, five product story sections |
| `/product` | Capabilities + the 7-step creation flow |
| `/use-cases`, `/use-cases/[slug]` | Sales, Recruiting, Operations, Real estate, Ecommerce, Research |
| `/templates` | Filterable template gallery |
| `/pricing` | Free / Pro / Team / Enterprise + FAQ |
| `/security` | Security architecture and controls |
| `/customers` | Case-study wall with outcome stats |
| `/developers` | REST API reference, SDK sample, webhooks |
| `/blog`, `/blog/[slug]` | Four full posts |
| `/login`, `/signup` | Email/password + Google (stubbed for the demo) |

**Dashboard** (`/dashboard`, seeded with a realistic demo workspace):

- Overview — workspace analytics (hours saved, tasks completed, rows collected, success
  rate), pending approvals (interactive), running tasks, agent roster
- Agents — list, detail pages (live browser preview, editable memory, task history with
  outputs, approval requests, per-agent analytics), and the 7-step creation wizard
  (name → role/template → plain-English instructions → tools → approval rules → output
  format → run/schedule)
- Tasks — inbox / running / completed tabs with progress and deliverables
- Templates, Integrations (connect/disconnect), Memory (add/edit/delete facts),
  Audit logs (filterable), Billing (plan, usage meters, invoices), Settings (team roles,
  approval policies)

**API stubs** (`src/app/api/*`) — `auth`, `agents`, `tasks`, `approvals`. They validate
input and return data shaped exactly like the production schema below, so the frontend
swaps to real persistence without changes.

## Production architecture

The MVP is the top layer of this design; each stub marks its production replacement.

```
┌────────────────────────────────────────────────────────────┐
│ Next.js app (this repo)                                    │
│   marketing site · dashboard · REST API routes             │
├────────────────────────────────────────────────────────────┤
│ Control plane                                              │
│   Auth: Supabase Auth (email/password + Google OAuth)      │
│   Payments: Stripe subscriptions + usage records           │
│   Postgres: workspaces, users, agents, tasks, task_steps,  │
│     approvals, memories, integrations, audit_events,       │
│     outputs, credentials (encrypted)                       │
│   Queue: task scheduler (cron + on-demand runs)            │
├────────────────────────────────────────────────────────────┤
│ Agent runtime                                              │
│   LLM layer: provider-agnostic (Anthropic / OpenAI / BYOK) │
│   Planner: instructions + memory → step plan               │
│   Browser workers: one ephemeral, sandboxed container per  │
│     task (isolated profile, destroyed on completion)       │
│   Action gate: sensitive actions (send / submit / publish  │
│     / pay / PII) intercepted at the browser layer and      │
│     held until an approval event arrives                   │
├────────────────────────────────────────────────────────────┤
│ Delivery                                                   │
│   Outputs: CSV / XLSX / PDF renderers → object storage     │
│   Integrations: Gmail, Google Sheets, Slack, Zapier        │
│     (then HubSpot, Salesforce, Airtable, Notion)           │
│   Webhooks: task lifecycle + approval events               │
└────────────────────────────────────────────────────────────┘
```

### Data model (Postgres)

- `workspaces` (id, name, plan, white_label_config) / `users` / `memberships` (role:
  owner | admin | editor | viewer)
- `agents` (workspace_id, name, role, instructions, schedule_cron, output_config, status)
- `agent_memories` (agent_id, fact, source: user | learned, updated_at)
- `tasks` (agent_id, status, started_at, finished_at, progress) and `task_steps`
  (task_id, seq, action, detail, url, screenshot_ref) — the step table powers live
  preview, replay, and audit export
- `approvals` (task_id, action_type, payload_summary, risk, requested_at, decided_by,
  decision, decided_at)
- `credentials` (workspace_id, name, AES-256-GCM ciphertext, scopes) — decrypted only
  inside the browser worker, never passed through the model
- `audit_events` (append-only: actor, actor_type, event, detail, category, created_at)
- `outputs` (task_id, type, storage_ref, size)

### Security model

1. **Sandboxed sessions** — every task runs in a fresh container with its own browser
   profile; nothing persists except explicit outputs.
2. **Credential vault** — credentials are injected into the browser session by the
   worker supervisor; the LLM sees only success/failure.
3. **Platform-enforced approvals** — the action gate sits between the model and the
   browser. Flagged actions (messages, form submits, CRM publishes, payments, PII access)
   cannot execute without a recorded human decision. Two guardrails (payments, PII) are
   not disableable by any role.
4. **Append-only audit log** — every step, credential use, approval, and output is
   recorded and exportable.
5. **RBAC** — role checks on every API route; SSO/SAML + SCIM at the Enterprise tier.

### Environment variables (production wiring)

```
DATABASE_URL=            # Postgres / Supabase
SUPABASE_URL=            # auth
SUPABASE_ANON_KEY=
GOOGLE_OAUTH_CLIENT_ID=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=       # or per-workspace BYOK
CREDENTIAL_VAULT_KEY=    # KMS-wrapped master key
BROWSER_POOL_URL=        # sandboxed browser worker fleet
```

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · React 19. No UI framework beyond
Tailwind — all components are first-party (`src/components`). Sample data lives in
`src/lib/data.ts` and mirrors the production schema.
