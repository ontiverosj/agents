import Link from "next/link";
import type { ReactNode } from "react";
import type { AgentStatus, TaskStatus, BrowserStep } from "@/lib/data";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.3)] transition hover:bg-violet-700"
    >
      {children}
    </Link>
  );
}

const agentStatusMeta: Record<AgentStatus, { label: string; dot: string; pill: string; pulse?: boolean }> = {
  working: { label: "Working", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", pulse: true },
  idle: { label: "Idle", dot: "bg-ink-300", pill: "bg-ink-50 text-ink-600" },
  needs_approval: { label: "Needs approval", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700", pulse: true },
  paused: { label: "Paused", dot: "bg-ink-400", pill: "bg-ink-100 text-ink-600" },
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const meta = agentStatusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.pulse ? "animate-pulse-dot" : ""}`} />
      {meta.label}
    </span>
  );
}

const taskStatusMeta: Record<TaskStatus, { label: string; pill: string }> = {
  queued: { label: "Queued", pill: "bg-ink-50 text-ink-600" },
  running: { label: "Running", pill: "bg-sky-50 text-sky-700" },
  awaiting_approval: { label: "Awaiting approval", pill: "bg-amber-50 text-amber-700" },
  completed: { label: "Completed", pill: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Failed", pill: "bg-red-50 text-red-700" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const meta = taskStatusMeta[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${meta.pill}`}>
      {meta.label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number[];
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <p className="text-sm text-ink-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-ink-950">{value}</p>
        {trend && <Sparkline data={trend} />}
      </div>
      {sub && <p className="mt-1.5 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

export function Sparkline({ data, className = "h-9 w-24" }: { data: number[]; className?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 96;
  const h = 32;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / range) * (h - 6)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`${className} shrink-0`} aria-hidden="true">
      <polyline points={points} fill="none" stroke="#6b2bf7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={w}
        cy={h - 3 - ((data[data.length - 1] - min) / range) * (h - 6)}
        r="2.5"
        fill="#6b2bf7"
      />
    </svg>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-ink-100 bg-white shadow-card ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink-950">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const actionColors: Record<string, string> = {
  Login: "text-emerald-600",
  Navigate: "text-sky-600",
  Extract: "text-violet-600",
  Screenshot: "text-violet-600",
  Download: "text-violet-600",
  Record: "text-emerald-600",
  Reconcile: "text-amber-600",
  Diff: "text-amber-600",
  Compose: "text-sky-600",
  Pause: "text-amber-600",
};

/** Terminal-style live view of an agent's browser session steps. */
export function BrowserPreview({ steps, url, live = true }: { steps: BrowserStep[]; url?: string; live?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-950">
      <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs text-ink-400">
          {live && <span className="h-2 w-2 animate-pulse-dot rounded-full bg-emerald-400" />}
          {live ? "Live browser preview" : "Session replay"}
        </span>
        {url && <span className="rounded bg-ink-800 px-2 py-0.5 font-mono text-[11px] text-ink-400">{url}</span>}
      </div>
      <div className="space-y-2.5 p-4 font-mono text-xs">
        {steps.map((s) => (
          <div key={s.time + s.detail} className="flex gap-3">
            <span className="shrink-0 text-ink-600">{s.time}</span>
            <span className={`w-24 shrink-0 font-semibold ${actionColors[s.action] ?? "text-ink-300"}`}>
              {s.action}
            </span>
            <span className="min-w-0 text-ink-300">
              {s.detail}
              {s.url && <span className="text-ink-500"> · {s.url}</span>}
            </span>
          </div>
        ))}
        {live && (
          <div className="flex gap-3">
            <span className="h-4 w-2 animate-pulse-dot bg-violet-400" />
          </div>
        )}
      </div>
    </div>
  );
}

const outputIcons: Record<string, string> = {
  csv: "M3 5.5A1.5 1.5 0 014.5 4h15A1.5 1.5 0 0121 5.5v13a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5v-13zM3 9h18M3 14h18M9 9v10.5",
  sheet: "M3 5.5A1.5 1.5 0 014.5 4h15A1.5 1.5 0 0121 5.5v13a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5v-13zM3 9h18M3 14h18M9 9v10.5",
  pdf: "M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5",
  report: "M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5M9 13h6M9 17h4",
  email: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11zM3.5 7l8.5 6 8.5-6",
  crm: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1",
};

export function OutputChip({ name, type, size }: { name: string; type: string; size: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-1.5 text-xs text-ink-700">
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-violet-600" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={outputIcons[type] ?? outputIcons.report} />
      </svg>
      <span className="font-medium">{name}</span>
      {size !== "—" && <span className="text-ink-400">{size}</span>}
    </span>
  );
}

export const riskPill: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};
