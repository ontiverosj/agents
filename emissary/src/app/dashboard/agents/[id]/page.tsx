"use client";

import { use } from "react";
import Link from "next/link";
import { AgentAvatar } from "@/components/ui";
import {
  PageHeader,
  Panel,
  AgentStatusBadge,
  BrowserPreview,
  StatCard,
} from "@/components/dashboard/widgets";
import { MemoryEditor } from "@/components/dashboard/memory-editor";
import { useWorkspace, workspace } from "@/lib/workspace";

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ws = useWorkspace();
  const agent = ws.agents.find((a) => a.id === id);

  if (!agent) {
    return (
      <div className="mx-auto max-w-md pt-16 text-center">
        <p className="text-lg font-semibold text-ink-950">Agent not found</p>
        <p className="mt-1 text-sm text-ink-400">It may have been removed from this workspace.</p>
        <Link href="/dashboard/agents" className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
          Back to agents
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2">
        <Link href="/dashboard/agents" className="text-sm font-medium text-violet-600 hover:text-violet-800">
          ← All agents
        </Link>
      </div>
      <PageHeader
        title={agent.name}
        description={`${agent.role} · ${agent.schedule} · last active ${agent.lastActive}`}
        action={
          <div className="flex items-center gap-3">
            <AgentStatusBadge status={agent.status} />
            <button className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50">
              {agent.status === "paused" ? "Resume" : "Pause"}
            </button>
            <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
              Run now
            </button>
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
        <AgentAvatar initials={agent.initials} hue={agent.avatarHue} size="lg" />
        <p className="text-sm leading-relaxed text-ink-600">{agent.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tasks completed" value={`${agent.tasksCompleted}`} sub={`Since ${agent.createdAt}`} />
        <StatCard label="Hours saved" value={`${agent.hoursSaved}`} sub="vs. estimated manual time" />
        <StatCard label="Success rate" value={agent.successRate > 0 ? `${agent.successRate}%` : "—"} sub="Runs without human rescue" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {agent.browserSteps ? (
            <Panel title="Live browser preview">
              <div className="p-4">
                <BrowserPreview
                  steps={agent.browserSteps}
                  url={agent.browserSteps.find((s) => s.url)?.url}
                  live={agent.status === "working"}
                />
                {agent.currentActivity && (
                  <p className="mt-3 text-xs text-ink-400">{agent.currentActivity}</p>
                )}
              </div>
            </Panel>
          ) : (
            <Panel title="Live browser preview">
              <p className="px-5 py-8 text-center text-sm text-ink-400">
                The preview appears here the moment this agent starts its first browser session.
              </p>
            </Panel>
          )}

          <Panel title="Task history">
            <p className="px-5 py-8 text-center text-sm text-ink-400">
              No runs yet — the first is scheduled. Every step, output, and approval will be
              recorded here.
            </p>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Instructions" action={<button className="text-xs font-medium text-violet-600 hover:text-violet-800">Edit</button>}>
            <p className="px-5 py-4 text-sm leading-relaxed text-ink-600">{agent.instructions}</p>
          </Panel>

          <Panel title="Memory" action={<span className="text-xs text-ink-400">{agent.memory.length} entries</span>}>
            <MemoryEditor initial={agent.memory} />
          </Panel>

          <Panel title="Connected tools">
            <ul className="space-y-2 px-5 py-4">
              {agent.tools.map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-sm text-ink-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
          </Panel>

          {(
            <button
              onClick={() => {
                workspace.removeAgent(id);
                window.location.href = "/dashboard/agents";
              }}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Remove this agent
            </button>
          )}
        </div>
      </div>
    </>
  );
}
