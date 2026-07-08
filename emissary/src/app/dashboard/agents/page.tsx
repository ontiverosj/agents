"use client";

import Link from "next/link";
import { AgentAvatar } from "@/components/ui";
import { PageHeader, PrimaryButton, AgentStatusBadge } from "@/components/dashboard/widgets";
import { useWorkspace } from "@/lib/workspace";

export default function AgentsPage() {
  const ws = useWorkspace();

  if (ws.agents.length === 0) {
    return (
      <>
        <PageHeader title="Agents" description="Your AI coworkers live here." />
        <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-ink-200 p-12 text-center">
          <p className="text-base font-semibold text-ink-900">No agents yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-ink-400">
            Describe the work in plain English and the Assistant designs your first agent —
            plus the connections it needs.
          </p>
          <div className="mt-6">
            <PrimaryButton href="/dashboard/assistant">Create your first agent</PrimaryButton>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Agents"
        description={`${ws.agents.length} coworker${ws.agents.length === 1 ? "" : "s"} — what they do and when they run.`}
        action={<PrimaryButton href="/dashboard/assistant">+ New agent</PrimaryButton>}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {ws.agents.map((a) => (
          <Link key={a.id} href={`/dashboard/agents/${a.id}`} className="group">
            <div className="flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-card transition group-hover:-translate-y-0.5 group-hover:shadow-card-lg">
              <div className="flex items-start gap-4">
                <AgentAvatar initials={a.initials} hue={a.avatarHue} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-ink-950">{a.name}</h2>
                    <AgentStatusBadge status={a.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-ink-400">{a.role}</p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-500">{a.description}</p>
              <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-400">{a.schedule}</p>
            </div>
          </Link>
        ))}

        <Link href="/dashboard/assistant" className="group">
          <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 p-6 text-center transition group-hover:border-violet-300 group-hover:bg-violet-50/40">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-2xl font-light text-ink-500 transition group-hover:bg-violet-100 group-hover:text-violet-700">
              +
            </span>
            <p className="mt-3 text-sm font-semibold text-ink-800">New agent</p>
          </div>
        </Link>
      </div>
    </>
  );
}
