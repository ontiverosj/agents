"use client";

import { useState } from "react";
import Link from "next/link";
import { AgentAvatar } from "@/components/ui";
import { TaskStatusBadge, ProgressBar, OutputChip } from "@/components/dashboard/widgets";
import { tasks, agents, type TaskStatus } from "@/lib/data";

const tabs: { key: string; label: string; statuses: TaskStatus[] }[] = [
  { key: "inbox", label: "Inbox", statuses: ["awaiting_approval", "queued"] },
  { key: "running", label: "Running", statuses: ["running"] },
  { key: "completed", label: "Completed", statuses: ["completed", "failed"] },
];

export function TaskBoard() {
  const [tab, setTab] = useState("inbox");
  const active = tabs.find((t) => t.key === tab)!;
  const list = tasks.filter((t) => active.statuses.includes(t.status));

  return (
    <div>
      <div className="flex gap-1 rounded-xl bg-ink-100/70 p-1 sm:w-fit">
        {tabs.map((t) => {
          const count = tasks.filter((x) => t.statuses.includes(x.status)).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-initial ${
                tab === t.key ? "bg-white text-ink-950 shadow-card" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-xs ${tab === t.key ? "bg-violet-100 text-violet-700" : "bg-ink-200/70 text-ink-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        {list.length === 0 && (
          <p className="rounded-2xl border border-ink-100 bg-white px-5 py-10 text-center text-sm text-ink-400 shadow-card">
            Nothing here right now.
          </p>
        )}
        {list.map((t) => {
          const agent = agents.find((a) => a.id === t.agentId);
          return (
            <div key={t.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                {agent && <AgentAvatar initials={agent.initials} hue={agent.avatarHue} size="sm" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink-950">{t.title}</p>
                    <TaskStatusBadge status={t.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-400">
                    <Link href={`/dashboard/agents/${t.agentId}`} className="hover:text-violet-600">{agent?.name}</Link>
                    {" · "}{t.finishedAt ? `finished ${t.finishedAt}` : t.startedAt} · {t.stepsDone}/{t.stepsTotal} steps
                  </p>
                </div>
                <span className="hidden shrink-0 cursor-pointer text-xs font-medium text-violet-600 hover:text-violet-800 sm:block">
                  {t.status === "completed" || t.status === "failed" ? "View replay" : "Watch live"}
                </span>
              </div>
              {(t.status === "running" || t.status === "awaiting_approval") && (
                <div className="mt-3.5">
                  <ProgressBar value={t.progress} />
                </div>
              )}
              {t.outputs.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {t.outputs.map((o) => (
                    <OutputChip key={o.name} name={o.name} type={o.type} size={o.size} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
