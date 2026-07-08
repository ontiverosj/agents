"use client";

import Link from "next/link";
import { AgentAvatar } from "@/components/ui";
import { PageHeader, PrimaryButton, TaskStatusBadge } from "@/components/dashboard/widgets";
import { useWorkspace } from "@/lib/workspace";

export default function TasksPage() {
  const ws = useWorkspace();

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Every run your agents make — queued, in progress, and delivered."
        action={<PrimaryButton href="/dashboard/assistant">+ New agent</PrimaryButton>}
      />

      {ws.agents.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-ink-200 p-12 text-center">
          <p className="text-base font-semibold text-ink-900">Nothing scheduled yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-ink-400">
            Create an agent and its runs will appear here — with live progress, step logs,
            and the files it delivers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ws.agents.map((a) => (
            <div key={a.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <AgentAvatar initials={a.initials} hue={a.avatarHue} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/agents/${a.id}`} className="text-sm font-semibold text-ink-950 hover:text-violet-700">
                      First run — {a.name}
                    </Link>
                    <TaskStatusBadge status="queued" />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-400">{a.schedule}</p>
                </div>
              </div>
              <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-500">
                Queued. When the execution runtime lands, this run will show live browser steps,
                progress, and its deliverables right here.
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
