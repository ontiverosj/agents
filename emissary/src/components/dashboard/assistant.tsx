"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgentAvatar } from "@/components/ui";
import { teamPlaybooks } from "@/lib/data";
import type { TeamBlueprint } from "@/lib/blueprint";
import { workspace, agentsFromBlueprint, useWorkspace } from "@/lib/workspace";

type Stage = "ask" | "thinking" | "plan" | "building" | "done";

/**
 * The Emissary Architect: describe your business and it designs a team —
 * a lead agent that decomposes the work, sub-agents that execute it, and
 * the API/MCP connections the team needs. POSTs to /api/architect (live
 * LLM when ANTHROPIC_API_KEY is set, playbook fallback otherwise) and
 * deploys into the persistent workspace store.
 */
export function Assistant() {
  const router = useRouter();
  const ws = useWorkspace();
  const [stage, setStage] = useState<Stage>("ask");
  const [text, setText] = useState("");
  const [bp, setBp] = useState<TeamBlueprint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function architect(description: string) {
    setStage("thinking");
    setError(null);
    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "The architect hit an error.");
      const { blueprint } = await res.json();
      setBp(blueprint);
      setStage("plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The architect hit an error.");
      setStage("ask");
    }
  }

  function connectionStatus(integrationId?: string) {
    if (!integrationId) return "setup"; // custom API/MCP — needs adding on Integrations
    // demo-connected built-ins + anything the user toggled on
    const demoConnected = ["gmail", "gsheets", "slack", "hubspot"];
    return demoConnected.includes(integrationId) || ws.connectedIntegrations.includes(integrationId)
      ? "connected"
      : "connect";
  }

  function buildSteps(b: TeamBlueprint): string[] {
    return [
      ...b.connections.map((c) => `Connecting ${c.name} (${c.kind.toUpperCase()}, scoped access)`),
      `Creating ${b.lead.name} — team lead`,
      ...b.subAgents.map((a) => `Creating sub-agent ${a.name} — ${a.role.toLowerCase()}`),
      "Applying approval guardrails to every agent",
      "Scheduling first runs",
    ];
  }

  function deploy() {
    if (!bp) return;
    // auto-connect the built-in integrations the blueprint calls for
    bp.connections.forEach((c) => c.integrationId && workspace.setIntegration(c.integrationId, true));
    setStage("building");
    setBuildStep(0);
    const steps = buildSteps(bp);
    steps.forEach((_, i) => timers.current.push(setTimeout(() => setBuildStep(i + 1), 500 * (i + 1))));
    timers.current.push(
      setTimeout(() => {
        workspace.addAgents(agentsFromBlueprint(bp));
        setStage("done");
      }, 500 * (steps.length + 1) + 250),
    );
  }

  /* ---------------------------------------------------------- ask */
  if (stage === "ask" || stage === "thinking") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-ink-900 p-[1px] shadow-card-lg">
          <div className="rounded-2xl bg-white p-6 sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <SparkIcon /> Emissary Architect
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-950">
              Describe your business. I&rsquo;ll design the team and its connections.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              I&rsquo;ll create a lead agent that owns the outcome, sub-agents it delegates to,
              and the API and MCP connections the team needs — with approval guardrails from
              the first run.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              disabled={stage === "thinking"}
              placeholder="e.g. We're a 6-person freight brokerage. Every morning someone checks three load boards, calls carriers for rates, and updates a spreadsheet. Quotes need to go out before 9am."
              className="mt-5 w-full rounded-xl border border-ink-200 px-4 py-3 text-sm leading-relaxed text-ink-900 placeholder:text-ink-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              onClick={() => text.trim() && architect(text)}
              disabled={!text.trim() || stage === "thinking"}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.35)] transition hover:bg-violet-700 disabled:opacity-40 disabled:shadow-none"
            >
              {stage === "thinking" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Designing your team…
                </>
              ) : (
                "Design my team"
              )}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-semibold uppercase tracking-widest text-ink-400">
          or start from a business type
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {teamPlaybooks.map((pb) => (
            <button
              key={pb.id}
              disabled={stage === "thinking"}
              onClick={() => architect(pb.business)}
              className="rounded-xl border border-ink-200 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-card-lg disabled:opacity-60"
            >
              <p className="text-sm font-semibold text-ink-950">{pb.business}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{pb.headline}</p>
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-ink-400">
          Live design uses your configured LLM key (Settings → workspace). Without one, the
          Architect uses the built-in playbook library.{" "}
          <Link href="/dashboard/agents/new" className="font-medium text-violet-600 hover:text-violet-800">
            Or create a single agent manually ›
          </Link>
        </p>
      </div>
    );
  }

  /* --------------------------------------------------------- plan */
  if (stage === "plan" && bp) {
    return (
      <div className="mx-auto max-w-2xl">
        <button onClick={() => setStage("ask")} className="text-sm font-medium text-violet-600 hover:text-violet-800">
          ← Revise the description
        </button>
        <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <SparkIcon /> Proposed team · {bp.teamName}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${bp.mode === "live" ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"}`}>
              {bp.mode === "live" ? "Designed live by the Architect" : "Sample mode — playbook match"}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-950">{bp.headline}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{bp.summary}</p>

          {/* Lead agent */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-400">Team lead</p>
          <div className="mt-2 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
            <AgentAvatar initials={bp.lead.initials} hue={bp.lead.hue} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-semibold text-ink-950">{bp.lead.name}</p>
                <p className="text-xs text-ink-400">{bp.lead.role}</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">{bp.lead.brief}</p>
              <p className="mt-1.5 text-[11px] text-ink-400">{bp.lead.schedule} → {bp.lead.output}</p>
            </div>
          </div>

          {/* Sub-agents */}
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-ink-400">
            Sub-agents ({bp.subAgents.length}) — the lead delegates to these
          </p>
          <div className="mt-2 space-y-2.5 border-l-2 border-ink-100 pl-4">
            {bp.subAgents.map((a) => (
              <div key={a.name} className="flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3.5">
                <AgentAvatar initials={a.initials} hue={a.hue} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-semibold text-ink-950">{a.name}</p>
                    <p className="text-xs text-ink-400">{a.role}</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-600">{a.brief}</p>
                  <p className="mt-1 text-[11px] text-ink-400">{a.schedule} → {a.output}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Connections */}
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-ink-400">Connections this team needs</p>
          <div className="mt-2 space-y-2">
            {bp.connections.map((c) => {
              const status = connectionStatus(c.integrationId);
              return (
                <div key={c.name} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3.5">
                  <span className="rounded-md bg-ink-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-500">
                    {c.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900">{c.name}</p>
                    <p className="truncate text-xs text-ink-400">{c.purpose}</p>
                  </div>
                  {status === "connected" ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                    </span>
                  ) : status === "connect" ? (
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                      Auto-connects on deploy
                    </span>
                  ) : (
                    <Link href="/dashboard/integrations" className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">
                      Add on Integrations ›
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Guardrails */}
          <div className="mt-5 rounded-xl bg-ink-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Approval guardrails</p>
            <ul className="mt-2 space-y-1">
              {bp.approvalRules.map((r) => (
                <li key={r} className="flex items-start gap-2 text-xs leading-relaxed text-ink-600">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-500" /> {r}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-ink-200/60 pt-3 text-xs text-ink-500">
              First deliverable: {bp.firstDeliverable}
            </p>
          </div>

          <button
            onClick={deploy}
            className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.35)] transition hover:bg-violet-700"
          >
            Deploy this team
          </button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------- building */
  if (stage === "building" && bp) {
    const steps = buildSteps(bp);
    return (
      <div className="mx-auto max-w-md pt-8">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
          <p className="text-sm font-semibold text-ink-950">Deploying {bp.teamName}…</p>
          <ul className="mt-5 space-y-3">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                {i < buildStep ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none"><path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                ) : i === buildStep ? (
                  <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-ink-100" />
                )}
                <span className={i <= buildStep ? "text-ink-800" : "text-ink-300"}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------- done */
  if (stage === "done" && bp) {
    return (
      <div className="mx-auto max-w-2xl pt-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-950">{bp.teamName} is on the clock</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
          {bp.lead.name} is coordinating {bp.subAgents.length} sub-agent{bp.subAgents.length === 1 ? "" : "s"},
          connections are live, and first runs are scheduled. {bp.firstDeliverable}.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => router.push("/dashboard/agents")}
            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.35)] transition hover:bg-violet-700"
          >
            See them in your roster
          </button>
          <button
            onClick={() => { setStage("ask"); setText(""); setBp(null); }}
            className="rounded-xl border border-ink-200 bg-white px-6 py-3 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
          >
            Design another team
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5l1.4 3.6a2 2 0 001.5 1.5L14.5 8l-3.6 1.4a2 2 0 00-1.5 1.5L8 14.5 6.6 10.9a2 2 0 00-1.5-1.5L1.5 8l3.6-1.4a2 2 0 001.5-1.5L8 1.5z" />
    </svg>
  );
}
