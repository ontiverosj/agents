import { AgentAvatar } from "@/components/ui";

/* Stylized product screenshot: a workspace with three active AI coworkers. */

const heroAgents = [
  {
    name: "Lead Hunter",
    initials: "LH",
    hue: 258,
    role: "Sales prospecting",
    activity: "Found 23 qualified prospects · scoring against ICP",
    progress: 62,
    status: "Working",
    statusColor: "bg-emerald-500",
    output: "qualified-leads.csv",
  },
  {
    name: "Market Monitor",
    initials: "MM",
    hue: 205,
    role: "Competitor tracking",
    activity: "Competitor price change detected: +12.7% on Growth plan",
    progress: 92,
    status: "Needs approval",
    statusColor: "bg-amber-500",
    output: "pricing-diff.pdf",
  },
  {
    name: "Ops Assistant",
    initials: "OA",
    hue: 152,
    role: "Portal reconciliation",
    activity: "Updating Weekly Ops sheet from 3 vendor portals",
    progress: 45,
    status: "Working",
    statusColor: "bg-emerald-500",
    output: "Weekly Ops (Google Sheet)",
  },
];

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-4xl animate-rise" style={{ animationDelay: "0.25s" }}>
      {/* glow */}
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-violet-500/15 via-violet-400/5 to-sky-400/15 blur-2xl" aria-hidden="true" />

      <div className="relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card-lg">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/70 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <div className="mx-auto flex items-center gap-2 rounded-md bg-white px-8 py-1 text-xs text-ink-400 ring-1 ring-ink-100">
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
              <rect x="1.5" y="4.5" width="9" height="6.5" rx="1.5" stroke="currentColor" />
              <path d="M3.75 4.5V3.4a2.25 2.25 0 014.5 0v1.1" stroke="currentColor" />
            </svg>
            app.emissary.work
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-950">Active coworkers</p>
              <p className="text-xs text-ink-400">3 running · 1 approval waiting</p>
            </div>
            <span className="hidden rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 sm:block">
              92 hrs saved this month
            </span>
          </div>

          <div className="space-y-3">
            {heroAgents.map((a, i) => (
              <div
                key={a.name}
                className="animate-rise rounded-xl border border-ink-100 bg-white p-3.5 shadow-card sm:p-4"
                style={{ animationDelay: `${0.45 + i * 0.15}s` }}
              >
                <div className="flex items-center gap-3">
                  <AgentAvatar initials={a.initials} hue={a.hue} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink-950">{a.name}</p>
                      <span className="hidden text-xs text-ink-400 sm:inline">· {a.role}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-500">{a.activity}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700">
                    <span className={`h-1.5 w-1.5 animate-pulse-dot rounded-full ${a.statusColor}`} />
                    <span className="hidden sm:inline">{a.status}</span>
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                  <span className="flex items-center gap-1 text-xs text-ink-400">
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
                      <path d="M2 8.5L4.5 6 7 8.5 10 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {a.output}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating approval card */}
      <div
        className="absolute -right-3 top-24 hidden w-64 animate-float rounded-xl border border-ink-100 bg-white p-4 shadow-card-lg lg:block"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <path d="M8 5.5V8.5M8 11h.01M8 1.8l6.4 11.4H1.6L8 1.8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-xs font-semibold text-ink-950">Approval requested</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          Market Monitor wants to post a pricing alert to <span className="font-medium text-ink-800">#general</span>
        </p>
        <div className="mt-3 flex gap-2">
          <span className="flex-1 rounded-lg bg-violet-600 py-1.5 text-center text-xs font-medium text-white">Approve</span>
          <span className="flex-1 rounded-lg border border-ink-200 py-1.5 text-center text-xs font-medium text-ink-600">Decline</span>
        </div>
      </div>
    </div>
  );
}
