"use client";

import { useState } from "react";
import { auditEvents } from "@/lib/data";

const categories = ["all", "task", "approval", "auth", "settings", "integration", "billing"] as const;

const actorStyles: Record<string, string> = {
  agent: "bg-violet-50 text-violet-700",
  user: "bg-sky-50 text-sky-700",
  system: "bg-ink-100 text-ink-600",
};

export function AuditLog() {
  const [filter, setFilter] = useState<(typeof categories)[number]>("all");
  const list = filter === "all" ? auditEvents : auditEvents.filter((e) => e.category === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${
              filter === c
                ? "bg-ink-950 text-white"
                : "border border-ink-200 bg-white text-ink-600 hover:border-ink-300"
            }`}
          >
            {c === "all" ? "All events" : c}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/70 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Time</th>
                <th className="px-5 py-3 font-semibold">Actor</th>
                <th className="px-5 py-3 font-semibold">Event</th>
                <th className="px-5 py-3 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {list.map((e) => (
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
      <p className="mt-3 text-xs text-ink-400">
        Logs are append-only and retained per your plan&rsquo;s retention policy. Task replays are linked from each task event.
      </p>
    </div>
  );
}
