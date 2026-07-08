"use client";

import { PageHeader } from "@/components/dashboard/widgets";
import { useWorkspace } from "@/lib/workspace";

const actorStyles: Record<string, string> = {
  agent: "bg-violet-50 text-violet-700",
  user: "bg-sky-50 text-sky-700",
  system: "bg-ink-100 text-ink-600",
};

export default function AuditPage() {
  const ws = useWorkspace();

  return (
    <>
      <PageHeader
        title="Audit log"
        description="An append-only record of everything that happens in this workspace — agent actions, connections, and your changes."
      />

      {ws.events.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-ink-200 p-12 text-center">
          <p className="text-base font-semibold text-ink-900">Nothing logged yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-ink-400">
            Create an agent or add a connection and it will be recorded here, permanently.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/70 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Actor</th>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {ws.events.map((e) => (
                  <tr key={e.id} className="transition hover:bg-ink-50/40">
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-ink-400">{e.time}</td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${actorStyles[e.actorType]}`}>
                        {e.actor}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-ink-900">{e.event}</td>
                    <td className="px-5 py-3.5 text-ink-500">{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
