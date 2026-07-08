"use client";

import { AgentAvatar } from "@/components/ui";
import { PageHeader, Panel, PrimaryButton } from "@/components/dashboard/widgets";
import { MemoryEditor } from "@/components/dashboard/memory-editor";
import { useWorkspace } from "@/lib/workspace";

export default function MemoryPage() {
  const ws = useWorkspace();

  return (
    <>
      <PageHeader
        title="Agent memory"
        description="The durable facts each agent uses on every run. Edit anything — corrections persist forever."
      />
      {ws.agents.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-ink-200 p-12 text-center">
          <p className="text-base font-semibold text-ink-900">No agents yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-ink-400">
            Each agent you create gets an editable memory — its lists, rules, and lessons learned.
          </p>
          <div className="mt-6">
            <PrimaryButton href="/dashboard/assistant">Create your first agent</PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {ws.agents.map((a) => (
            <Panel key={a.id} title={a.name} action={<AgentAvatar initials={a.initials} hue={a.avatarHue} size="sm" />}>
              <MemoryEditor initial={a.memory} />
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
