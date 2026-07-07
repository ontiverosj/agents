"use client";

import { useState } from "react";
import { AgentAvatar } from "@/components/ui";
import { riskPill } from "@/components/dashboard/widgets";
import { agents, type Approval } from "@/lib/data";

/** Interactive approval queue — decisions post to the stub API and update locally. */
export function ApprovalList({ initial }: { initial: Approval[] }) {
  const [items, setItems] = useState(initial.map((a) => ({ ...a, decided: undefined as string | undefined })));

  async function decide(id: string, decision: "approve" | "decline") {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, decided: decision } : a)));
    await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    }).catch(() => {});
  }

  if (items.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-ink-400">No pending approvals. Your coworkers are working within their rules.</p>;
  }

  return (
    <ul className="divide-y divide-ink-100">
      {items.map((a) => {
        const agent = agents.find((ag) => ag.id === a.agentId);
        return (
          <li key={a.id} className="flex items-start gap-4 px-5 py-4">
            {agent && <AgentAvatar initials={agent.initials} hue={agent.avatarHue} size="md" />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink-950">{agent?.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${riskPill[a.risk]}`}>
                  {a.risk} risk
                </span>
                <span className="text-xs text-ink-400">{a.requestedAt}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-ink-800">{a.action}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{a.detail}</p>
              <div className="mt-3 flex items-center gap-2">
                {a.decided ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${a.decided === "approve" ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"}`}>
                    {a.decided === "approve" ? "Approved — resuming task" : "Declined — action skipped"}
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => decide(a.id, "approve")}
                      className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(a.id, "decline")}
                      className="rounded-lg border border-ink-200 px-4 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-50"
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
