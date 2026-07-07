import Link from "next/link";
import { ButtonLink, SectionHeading, Card, CheckIcon, ArrowRight, AgentAvatar } from "@/components/ui";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { useCases, customers } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="animate-rise mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-1.5 text-sm text-ink-600 shadow-card">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-emerald-500" />
              The AI workforce platform for business teams
            </p>
            <h1 className="animate-rise text-4xl font-semibold leading-[1.1] tracking-tight text-ink-950 sm:text-6xl" style={{ animationDelay: "0.08s" }}>
              Hire AI coworkers for the repetitive web work your team hates.
            </h1>
            <p className="animate-rise mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-600" style={{ animationDelay: "0.16s" }}>
              Create always-on AI workers that browse websites, collect data, monitor changes,
              fill forms, and deliver reports — with human approvals, audit trails, and
              business-ready controls.
            </p>
            <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.22s" }}>
              <ButtonLink href="/signup" size="lg">Start Free</ButtonLink>
              <ButtonLink href="/product" variant="secondary" size="lg">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M5.5 3.8v8.4c0 .6.65.97 1.17.66l6.6-4.2a.78.78 0 000-1.32l-6.6-4.2a.78.78 0 00-1.17.66z" />
                </svg>
                Watch Demo
              </ButtonLink>
            </div>
            <p className="animate-rise mt-5 text-sm text-ink-400" style={{ animationDelay: "0.28s" }}>
              Free plan included · No credit card required · Set up your first coworker in minutes
            </p>
          </div>

          <div className="mt-16">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- Social proof */}
      <section className="border-y border-ink-100 bg-ink-50/50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-ink-400">
            Trusted by operations, sales, and research teams at
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-ink-400">
            {customers.map((c) => (
              <span key={c.company} className="text-base font-semibold tracking-tight">
                {c.company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------- 1. Describe the work */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="01 — Describe the work"
              title="Assign tasks in plain English"
              lede="No flowcharts, no code, no brittle selectors. Describe the job the way you'd brief a new hire — what to do, where to look, what 'done' looks like. Your coworker plans the steps, remembers your preferences, and gets better with every correction."
            />
            <ul className="mt-8 space-y-3">
              {[
                "Write instructions like an onboarding doc — the agent follows them literally",
                "Editable memory holds your ICP, lists, and rules between runs",
                "Multi-step workflow builder for jobs that span sites and tools",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-ink-700">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">New task · Lead Hunter</p>
            <div className="mt-4 rounded-xl bg-ink-50 p-4 font-mono text-sm leading-relaxed text-ink-700">
              Find SaaS companies in North America with 50–500 employees that posted a RevOps
              job in the last 14 days. Confirm fit on their website, identify the VP Sales,
              score each lead against my ICP, and deliver a ranked CSV. Stage new contacts in
              HubSpot as drafts — never publish without my approval.
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-ink-400">Understood · 6-step plan created</span>
              <span className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-medium text-white">Run task</span>
            </div>
          </Card>
        </div>
      </section>

      {/* --------------------------------------- 2. Watch it work (dark) */}
      <section className="bg-ink-950 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-card-lg">
                <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-xs text-ink-400">
                    <span className="h-2 w-2 animate-pulse-dot rounded-full bg-emerald-400" />
                    Live browser preview · Ops Assistant
                  </span>
                  <span className="rounded bg-ink-800 px-2 py-0.5 font-mono text-[11px] text-ink-400">
                    portal.freightwise.com
                  </span>
                </div>
                <div className="space-y-2.5 p-4 font-mono text-xs">
                  {[
                    ["08:02:11", "Login", "Authenticated via vault credential", "text-emerald-400"],
                    ["08:02:30", "Navigate", "Opened invoices dashboard", "text-sky-400"],
                    ["08:02:48", "Download", "invoices_2026-06-29.csv (42 rows)", "text-violet-300"],
                    ["08:03:15", "Reconcile", "1 discrepancy found — $612 on #FW-88213", "text-amber-400"],
                    ["08:03:22", "Pause", "Approval required before submitting dispute form", "text-amber-400"],
                  ].map(([time, action, detail, color]) => (
                    <div key={time} className="flex gap-3">
                      <span className="shrink-0 text-ink-600">{time}</span>
                      <span className={`w-20 shrink-0 font-semibold ${color}`}>{action}</span>
                      <span className="text-ink-300">{detail}</span>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <span className="shrink-0 text-ink-600">08:03:23</span>
                    <span className="h-4 w-2 animate-pulse-dot bg-violet-400" />
                  </div>
                </div>
                <div className="border-t border-ink-800 px-4 py-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                    <div className="h-full animate-progress rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
                  </div>
                  <p className="mt-2 text-xs text-ink-500">Step 9 of 20 · Reconciling FreightWise invoices</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">
                02 — Watch your AI coworker work
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                See every step, live
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-300">
                Every task runs in a sandboxed browser session you can watch in real time —
                every page visited, every field read, every file downloaded. No black boxes.
                When a run finishes, scrub through the full replay or export the step log.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Live browser preview with step-by-step progress",
                  "Full task replay with screenshots at every state change",
                  "Isolated, ephemeral sessions — destroyed when the task ends",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-ink-200">
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------- 3. Approve actions */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="03 — Approve important actions"
              title="Autonomy with a human hand on the wheel"
              lede="Sending messages, submitting forms, publishing CRM records, anything touching money or personal data — sensitive actions pause the task and wait for a human. You set the rules once; the platform enforces them on every run."
            />
            <ul className="mt-8 space-y-3">
              {[
                "Approval policies per agent, per action type, per team",
                "Full context with every request — what, why, and what happens next",
                "Approve from the dashboard, Slack, or email in one click",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-ink-700">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            {[
              {
                agent: "Market Monitor", initials: "MM", hue: 205, risk: "Medium risk",
                riskColor: "bg-amber-50 text-amber-700",
                action: "Post pricing alert to #general in Slack",
                detail: "Posting outside the approved channel list requires sign-off.",
              },
              {
                agent: "Ops Assistant", initials: "OA", hue: 152, risk: "High risk",
                riskColor: "bg-red-50 text-red-700",
                action: "Submit dispute form on FreightWise portal",
                detail: "Form submissions on vendor portals always pause for approval.",
              },
            ].map((a) => (
              <Card key={a.action} className="p-5">
                <div className="flex items-start gap-3">
                  <AgentAvatar initials={a.initials} hue={a.hue} size="md" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink-950">{a.agent}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${a.riskColor}`}>{a.risk}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-ink-800">{a.action}</p>
                    <p className="mt-1 text-sm text-ink-500">{a.detail}</p>
                    <div className="mt-3 flex gap-2">
                      <span className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white">Approve</span>
                      <span className="rounded-lg border border-ink-200 px-4 py-1.5 text-xs font-medium text-ink-600">Decline</span>
                      <span className="rounded-lg px-4 py-1.5 text-xs font-medium text-ink-400">View steps</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------- 4. Real deliverables */}
      <section className="bg-ink-50/60 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="04 — Get real deliverables"
            title="Work products, not chat transcripts"
            lede="Every task ends in something your team can use immediately — a spreadsheet, a report, a CRM update, an email draft. Delivered where you already work."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Spreadsheets & CSVs", desc: "Structured rows with sources — straight to Google Sheets, Airtable, or download.", icon: "M3 5.5A1.5 1.5 0 014.5 4h15A1.5 1.5 0 0121 5.5v13a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5v-13zM3 9h18M3 14h18M9 9v10.5" },
              { title: "PDF reports", desc: "Formatted briefs and digests with charts, citations, and change summaries.", icon: "M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5M9 13h6M9 17h4" },
              { title: "CRM updates", desc: "Contacts and companies staged as drafts in HubSpot or Salesforce, published on approval.", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" },
              { title: "Email drafts & summaries", desc: "Digests to your inbox, personalized outreach drafts a human reviews and sends.", icon: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11zM3.5 7l8.5 6 8.5-6" },
            ].map((d) => (
              <Card key={d.title} className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={d.icon} />
                  </svg>
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-950">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{d.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------- 5. Scale with confidence */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading
          center
          eyebrow="05 — Scale with confidence"
          title="Built for teams that answer to auditors"
          lede="Emissary is designed so that security, compliance, and finance say yes — not just the person automating their own work."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Immutable audit logs", desc: "Every step, credential use, approval, and output is logged and exportable. Answer 'who changed this and why' in two clicks." },
            { title: "Roles & permissions", desc: "Team workspaces with owner, admin, editor, and viewer roles. Control who creates agents, grants approvals, and connects tools." },
            { title: "Encrypted credential vault", desc: "Portal logins are AES-256 encrypted and injected directly into browser sessions. The model never sees a password." },
            { title: "Guardrails by default", desc: "Payments, logins, personal data, and form submissions are classified sensitive and pause for approval — platform-enforced, not prompt-enforced." },
            { title: "Task replay", desc: "Scrub through any past run step by step with screenshots. Compliance reviews take minutes, not meetings." },
            { title: "Your stack, connected", desc: "Gmail, Google Sheets, Slack, Zapier, HubSpot, Salesforce, Airtable, and Notion — with scoped, revocable access." },
          ].map((f) => (
            <Card key={f.title} className="p-6">
              <h3 className="text-base font-semibold text-ink-950">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- Use cases */}
      <section className="bg-ink-50/60 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Use cases"
              title="One platform, every repetitive web job"
            />
            <ButtonLink href="/use-cases" variant="secondary">
              All use cases <ArrowRight />
            </ButtonLink>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((u) => (
              <Link key={u.slug} href={`/use-cases/${u.slug}`} className="group">
                <Card className="h-full p-6 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-card-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-ink-950">{u.name}</h3>
                    <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-violet-700">{u.headline}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-500">{u.summary}</p>
                  <p className="mt-4 text-sm font-semibold text-ink-950">
                    {u.metric.value} <span className="font-normal text-ink-400">{u.metric.label}</span>
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- Assistant pitch */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Emissary Assistant"
              title="Don't build one agent. Deploy a team."
              lede="Inside every workspace is an assistant that already knows how businesses like yours run. Describe what your company does, and it assembles a pre-configured team of coworkers, connects the right apps, and schedules the first runs — usable deliverables within a day."
            />
            <ul className="mt-8 space-y-3">
              {[
                "Ready-made teams for real estate, ecommerce, SaaS, recruiting, agencies, and ops",
                "Integrations connected in the same flow — no app-by-app setup",
                "Approval guardrails applied to every agent from the first run",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-ink-700">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ButtonLink href="/signup">Meet your Assistant <ArrowRight /></ButtonLink>
            </div>
          </div>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Assistant · new workspace</p>
            <div className="mt-4 rounded-xl bg-ink-50 p-4 text-sm leading-relaxed text-ink-700">
              &ldquo;We flip houses in Austin and San Antonio — finding deals fast is everything.&rdquo;
            </div>
            <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-xs font-semibold text-violet-700">Proposed team — ready in minutes</p>
              <ul className="mt-3 space-y-2.5">
                {[
                  ["Deal Spotter", "watches listings every 30 min, alerts with comps"],
                  ["Comp Analyst", "prices every match against recent sales"],
                  ["Client Digest", "weekly market summaries, drafted for review"],
                ].map(([name, desc]) => (
                  <li key={name} className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold text-ink-950">{name}</span>
                    <span className="text-xs text-ink-500">{desc}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-violet-100 pt-3 text-xs text-ink-500">
                Connects Gmail, Sheets & Slack · guardrails on · first alert by tomorrow morning
              </p>
            </div>
            <div className="mt-4 rounded-full bg-violet-600 py-2.5 text-center text-sm font-semibold text-white">
              Deploy this team
            </div>
          </Card>
        </div>
      </section>

      {/* -------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-ink-950 py-24">
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(ellipse 60% 70% at 50% 110%, rgb(107 43 247 / 0.55), transparent)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Your team&rsquo;s next hire doesn&rsquo;t need a desk.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-300">
            Create your first AI coworker in minutes. Free plan included — no credit card, no sales call.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg">Start Free</ButtonLink>
            <ButtonLink href="/pricing" variant="inverted" size="lg">See Pricing</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
