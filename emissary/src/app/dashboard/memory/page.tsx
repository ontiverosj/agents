import { AgentAvatar } from "@/components/ui";
import { PageHeader, Panel } from "@/components/dashboard/widgets";
import { MemoryEditor } from "@/components/dashboard/memory-editor";
import { agents } from "@/lib/data";

export const metadata = { title: "Memory" };

export default function MemoryPage() {
  return (
    <>
      <PageHeader
        title="Agent memory"
        description="The durable facts each coworker uses on every run. Edit anything — corrections persist forever, and agents mark what they've learned on their own."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {agents.map((a) => (
          <Panel
            key={a.id}
            title={a.name}
            action={
              <span className="flex items-center gap-2">
                <AgentAvatar initials={a.initials} hue={a.avatarHue} size="sm" />
              </span>
            }
          >
            <MemoryEditor initial={a.memory} />
          </Panel>
        ))}
      </div>
    </>
  );
}
