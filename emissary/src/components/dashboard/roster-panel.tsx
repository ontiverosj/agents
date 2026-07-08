"use client";

import Link from "next/link";
import { AgentAvatar } from "@/components/ui";
import { Panel, AgentStatusBadge } from "@/components/dashboard/widgets";
import { agents as demoAgents } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";

/** Overview roster: your workspace agents first, demo agents unless hidden. */
export function RosterPanel() {
  const ws = useWorkspace();
  const list = [...ws.agents, ...(ws.hideDemo ? [] : demoAgents)];

  return (
    <Panel
      title="Your coworkers"
      action={<Link href="/dashboard/agents" className="text-xs font-medium text-violet-600 hover:text-violet-800">Manage →</Link>}
    >
      {list.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-ink-400">No agents yet.</p>
          <Link href="/dashboard/assistant" className="mt-2 inline-block text-sm font-medium text-violet-600 hover:text-violet-800">
            Ask the Architect to build your team ›
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {list.map((a) => (
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
      )}
    </Panel>
  );
}
