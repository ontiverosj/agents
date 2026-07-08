"use client";

import Link from "next/link";
import { AgentAvatar } from "@/components/ui";
import { StatCard, Panel, AgentStatusBadge } from "@/components/dashboard/widgets";
import { useWorkspace } from "@/lib/workspace";

export default function DashboardOverview() {
  const ws = useWorkspace();

  /* ------------------------------------------------ first-run state */
  if (ws.agents.length === 0) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-950">Welcome to Emissary</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
            Three steps and your first AI coworker is on the clock.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {[
            {
              n: 1,
              title: "Describe the work",
              desc: "Tell the Assistant what eats your team's time, in plain English. It designs one agent for the job.",
              href: "/dashboard/assistant",
              cta: "Create your agent",
              primary: true,
            },
            {
              n: 2,
              title: "Connect its tools",
              desc: "Attach the apps, APIs, or MCP servers the agent needs — one tap for built-ins, paste an endpoint for your own.",
              href: "/dashboard/integrations",
              cta: "Browse connections",
            },
            {
              n: 3,
              title: "Approve and relax",
              desc: "The agent runs on schedule and pauses for your sign-off before anything sensitive — every step logged.",
            },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                {s.n}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-ink-950">{s.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{s.desc}</p>
              </div>
              {s.href && (
                <Link
                  href={s.href}
                  className={`shrink-0 self-center rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    s.primary
                      ? "bg-violet-600 text-white shadow-[0_4px_14px_rgb(107_43_247/0.3)] hover:bg-violet-700"
                      : "border border-ink-200 text-ink-700 hover:bg-ink-50"
                  }`}
                >
                  {s.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------- active state */
  const scheduled = ws.agents.filter((a) => a.status === "working").length;
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Overview</h1>
          <p className="mt-1 text-sm text-ink-500">
            {ws.agents.length} agent{ws.agents.length === 1 ? "" : "s"} ·{" "}
            {ws.connections.length + ws.connectedIntegrations.length} connection{ws.connections.length + ws.connectedIntegrations.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/dashboard/assistant"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.3)] transition hover:bg-violet-700"
        >
          + New agent
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Agents" value={`${ws.agents.length}`} sub={`${scheduled} scheduled to run`} />
        <StatCard
          label="Connections"
          value={`${ws.connections.length + ws.connectedIntegrations.length}`}
          sub="Apps, APIs & MCP servers"
        />
        <StatCard label="Completed runs" value="0" sub="Analytics appear after the first run" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Your agents"
          action={<Link href="/dashboard/agents" className="text-xs font-medium text-violet-600 hover:text-violet-800">Manage →</Link>}
        >
          <ul className="divide-y divide-ink-100">
            {ws.agents.map((a) => (
              <li key={a.id}>
                <Link href={`/dashboard/agents/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-ink-50/60">
                  <AgentAvatar initials={a.initials} hue={a.avatarHue} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-950">{a.name}</p>
                    <p className="truncate text-xs text-ink-400">{a.currentActivity ?? a.role}</p>
                  </div>
                  <AgentStatusBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent activity" action={<Link href="/dashboard/audit" className="text-xs font-medium text-violet-600 hover:text-violet-800">Audit log →</Link>}>
          {ws.events.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">Workspace activity appears here.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {ws.events.slice(0, 6).map((e) => (
                <li key={e.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-ink-900">{e.event}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">{e.detail} · {e.time}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
