"use client";

import Link from "next/link";
import { AgentAvatar } from "@/components/ui";
import { PageHeader, PrimaryButton, AgentStatusBadge } from "@/components/dashboard/widgets";
import { agents as demoAgents } from "@/lib/data";
import { useWorkspace, workspace } from "@/lib/workspace";

export default function AgentsPage() {
  const ws = useWorkspace();
  const list = [...ws.agents, ...(ws.hideDemo ? [] : demoAgents)];

  return (
    <>
      <PageHeader
        title="Agents"
        description="Your AI coworkers — what they do, when they run, and what they've saved you."
        action={<PrimaryButton href="/dashboard/assistant">+ New agent or team</PrimaryButton>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
        <p className="text-sm text-ink-500">
          {ws.agents.length > 0
            ? `${ws.agents.length} agent${ws.agents.length === 1 ? "" : "s"} you created${ws.hideDemo ? "" : " · demo workspace shown for reference"}`
            : "No agents of your own yet — the demo workspace is shown so you can explore."}
        </p>
        <button
          onClick={() => workspace.setHideDemo(!ws.hideDemo)}
          className="text-xs font-medium text-violet-600 hover:text-violet-800"
        >
          {ws.hideDemo ? "Show demo agents" : "Hide demo agents"}
        </button>
      </div>

      {list.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-ink-200 p-12 text-center">
          <p className="text-sm font-semibold text-ink-800">A clean slate</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-400">
            Describe your business to the Architect and it will design your first team — lead
            agent, sub-agents, and connections.
          </p>
          <div className="mt-5">
            <PrimaryButton href="/dashboard/assistant">Open the Architect</PrimaryButton>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {list.map((a) => (
          <Link key={a.id} href={`/dashboard/agents/${a.id}`} className="group">
            <div className="flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-card transition group-hover:-translate-y-0.5 group-hover:shadow-card-lg">
              <div className="flex items-start gap-4">
                <AgentAvatar initials={a.initials} hue={a.avatarHue} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-ink-950">{a.name}</h2>
                    <AgentStatusBadge status={a.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-ink-400">{a.role} · {a.schedule}</p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-500">{a.description}</p>
              {a.currentActivity && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-emerald-500" />
                  <span className="truncate">{a.currentActivity}</span>
                </p>
              )}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-100 pt-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-ink-950">{a.tasksCompleted}</p>
                  <p className="text-[11px] text-ink-400">tasks done</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-ink-950">{a.hoursSaved}</p>
                  <p className="text-[11px] text-ink-400">hours saved</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-ink-950">{a.successRate > 0 ? `${a.successRate}%` : "—"}</p>
                  <p className="text-[11px] text-ink-400">success rate</p>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {list.length > 0 && (
          <Link href="/dashboard/assistant" className="group">
            <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 p-6 text-center transition group-hover:border-violet-300 group-hover:bg-violet-50/40">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-2xl font-light text-ink-500 transition group-hover:bg-violet-100 group-hover:text-violet-700">
                +
              </span>
              <p className="mt-3 text-sm font-semibold text-ink-800">Build another team</p>
              <p className="mt-1 max-w-48 text-xs text-ink-400">Describe the work — the Architect designs agents and connections</p>
            </div>
          </Link>
        )}
      </div>
    </>
  );
}
