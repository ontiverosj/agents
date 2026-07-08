"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgentAvatar } from "@/components/ui";
import type { AgentBlueprint, BlueprintConnection } from "@/lib/blueprint";
import { workspace, agentFromBlueprint, useWorkspace } from "@/lib/workspace";

type Stage = "ask" | "thinking" | "plan" | "connect" | "building" | "done";

const EXAMPLES = [
  "We flip houses in Austin — finding deals fast is everything",
  "We run a Shopify store; competitor prices change daily",
  "B2B SaaS — reps spend mornings building lead lists",
  "Recruiting agency — sourcing candidates eats our evenings",
];

/**
 * The Assistant: describe the work, get ONE agent designed for it, attach
 * the API/MCP connections it needs, deploy. Live LLM design when
 * ANTHROPIC_API_KEY is set; playbook fallback otherwise.
 */
export function Assistant() {
  const router = useRouter();
  const ws = useWorkspace();
  const [stage, setStage] = useState<Stage>("ask");
  const [text, setText] = useState("");
  const [bp, setBp] = useState<AgentBlueprint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attached, setAttached] = useState<Record<string, boolean>>({});
  const [endpoints, setEndpoints] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const [newAgentId, setNewAgentId] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function design(description: string) {
    setStage("thinking");
    setError(null);
    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong designing the agent.");
      const { blueprint } = (await res.json()) as { blueprint: AgentBlueprint };
      setBp(blueprint);
      // everything attachable starts checked; custom endpoints need a URL first
      setAttached(Object.fromEntries(blueprint.connections.map((c) => [c.name, Boolean(c.integrationId)])));
      setStage("plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong designing the agent.");
      setStage("ask");
    }
  }

  async function testAndAttach(c: BlueprintConnection) {
    const url = endpoints[c.name]?.trim();
    if (!url) return;
    setTesting(c.name);
    let status: "reachable" | "unreachable" | "unverified" = "unverified";
    try {
      const res = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.status === 400) {
        setError(data.error);
        setTesting(null);
        return;
      }
      status = data.ok ? "reachable" : "unreachable";
    } catch {
      status = "unverified";
    }
    workspace.addConnection({
      id: `conn-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: c.name,
      kind: c.kind === "oauth" ? "rest" : c.kind,
      url,
      hasSecret: false,
      status,
      addedAt: "just now",
    });
    setAttached((prev) => ({ ...prev, [c.name]: true }));
    setError(null);
    setTesting(null);
  }

  function deploy() {
    if (!bp) return;
    const chosen = bp.connections.filter((c) => attached[c.name]);
    chosen.forEach((c) => c.integrationId && workspace.setIntegration(c.integrationId, true));
    setStage("building");
    setBuildStep(0);
    const steps = [
      ...chosen.map((c) => `Connecting ${c.name}`),
      `Creating ${bp.agent.name}`,
      "Applying approval guardrails",
      "Scheduling the first run",
    ];
    steps.forEach((_, i) => timers.current.push(setTimeout(() => setBuildStep(i + 1), 500 * (i + 1))));
    timers.current.push(
      setTimeout(() => {
        const agent = agentFromBlueprint(bp, chosen.map((c) => c.name));
        workspace.addAgents([agent]);
        setNewAgentId(agent.id);
        setStage("done");
      }, 500 * (steps.length + 1) + 250),
    );
  }

  /* ---------------------------------------------------------- ask */
  if (stage === "ask" || stage === "thinking") {
    return (
      <div className="mx-auto max-w-xl">
        <div className="pt-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-950">
            What should your agent do?
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
            Describe the work in plain English. You&rsquo;ll get one agent designed for it —
            then connect it to the apps and APIs it needs.
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-gradient-to-br from-violet-600 to-ink-900 p-[1px] shadow-card-lg">
          <div className="rounded-2xl bg-white p-5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              autoFocus
              disabled={stage === "thinking"}
              placeholder="e.g. Check our three vendor portals every Monday, pull last week's invoices, flag anything that doesn't match the shipment log, and email me the summary."
              className="w-full resize-none border-0 text-[15px] leading-relaxed text-ink-900 placeholder:text-ink-300 focus:outline-none disabled:opacity-60"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
              <span className="text-xs text-ink-400">Plain English — no setup needed</span>
              <button
                onClick={() => text.trim() && design(text)}
                disabled={!text.trim() || stage === "thinking"}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.35)] transition hover:bg-violet-700 disabled:opacity-40 disabled:shadow-none"
              >
                {stage === "thinking" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Designing…
                  </>
                ) : (
                  "Design my agent"
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              disabled={stage === "thinking"}
              onClick={() => setText(e)}
              className="rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-xs text-ink-600 transition hover:border-violet-300 hover:text-ink-950 disabled:opacity-60"
            >
              {e}
            </button>
          ))}
        </div>
        {ws.agents.length > 0 && (
          <p className="mt-8 text-center text-xs text-ink-400">
            <Link href="/dashboard/agents" className="font-medium text-violet-600 hover:text-violet-800">
              ← Back to your {ws.agents.length} agent{ws.agents.length === 1 ? "" : "s"}
            </Link>
          </p>
        )}
      </div>
    );
  }

  /* --------------------------------------------------------- plan */
  if (stage === "plan" && bp) {
    return (
      <div className="mx-auto max-w-xl">
        <button onClick={() => setStage("ask")} className="text-sm font-medium text-violet-600 hover:text-violet-800">
          ← Revise the description
        </button>
        <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-7">
          <div className="flex items-start gap-4">
            <AgentAvatar initials={bp.agent.initials} hue={bp.agent.hue} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-ink-950">{bp.agent.name}</h1>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${bp.mode === "live" ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"}`}>
                  {bp.mode === "live" ? "Designed live" : "Sample design"}
                </span>
              </div>
              <p className="text-sm text-ink-400">{bp.agent.role}</p>
            </div>
          </div>

          <p className="mt-4 rounded-xl bg-ink-50 p-4 text-sm leading-relaxed text-ink-700">{bp.agent.brief}</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-ink-100 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Runs</p>
              <p className="mt-1 text-sm font-medium text-ink-900">{bp.agent.schedule}</p>
            </div>
            <div className="rounded-xl border border-ink-100 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Delivers</p>
              <p className="mt-1 text-sm font-medium text-ink-900">{bp.agent.output}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-violet-50 p-4">
            <p className="text-xs leading-relaxed text-violet-900/80">
              <span className="font-semibold">First deliverable:</span> {bp.firstDeliverable}. Sensitive
              actions always pause for your approval.
            </p>
          </div>

          <button
            onClick={() => setStage("connect")}
            className="mt-5 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.35)] transition hover:bg-violet-700"
          >
            Looks right — connect its tools →
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------ connect */
  if (stage === "connect" && bp) {
    const anyAttached = bp.connections.some((c) => attached[c.name]);
    return (
      <div className="mx-auto max-w-xl">
        <button onClick={() => setStage("plan")} className="text-sm font-medium text-violet-600 hover:text-violet-800">
          ← Back to the agent
        </button>
        <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-7">
          <h1 className="text-xl font-semibold tracking-tight text-ink-950">
            Connect {bp.agent.name}&rsquo;s tools
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            These are the connections it needs. Built-in apps connect with one tap; for your own
            APIs or MCP servers, paste the endpoint and we&rsquo;ll verify it responds.
          </p>

          <div className="mt-5 space-y-3">
            {bp.connections.map((c) => {
              const on = attached[c.name];
              return (
                <div key={c.name} className={`rounded-xl border p-4 transition ${on ? "border-violet-300 bg-violet-50/40" : "border-ink-200"}`}>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-ink-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-500">
                      {c.kind}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-950">{c.name}</p>
                      <p className="text-xs text-ink-400">{c.purpose}</p>
                    </div>
                    {c.integrationId ? (
                      <button
                        onClick={() => setAttached((p) => ({ ...p, [c.name]: !on }))}
                        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${on ? "bg-violet-600" : "bg-ink-200"}`}
                        aria-label={`Toggle ${c.name}`}
                      >
                        <span className={`h-4 w-4 rounded-full bg-white shadow transition ${on ? "translate-x-4" : ""}`} />
                      </button>
                    ) : on ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Attached
                      </span>
                    ) : null}
                  </div>
                  {!c.integrationId && !on && (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={endpoints[c.name] ?? ""}
                        onChange={(e) => setEndpoints((p) => ({ ...p, [c.name]: e.target.value }))}
                        placeholder={c.kind === "mcp" ? "https://mcp.example.com/mcp" : "https://api.example.com/v1"}
                        className="min-w-0 flex-1 rounded-lg border border-ink-200 px-3 py-2 font-mono text-xs focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                      />
                      <button
                        onClick={() => testAndAttach(c)}
                        disabled={!endpoints[c.name]?.trim() || testing === c.name}
                        className="shrink-0 rounded-lg bg-ink-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:opacity-40"
                      >
                        {testing === c.name ? "Testing…" : "Test & attach"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <p className="mt-4 text-xs text-ink-400">
            You can add more connections anytime on the{" "}
            <Link href="/dashboard/integrations" className="font-medium text-violet-600 hover:text-violet-800">Connections</Link> page.
            Skipped ones just leave the agent without that tool.
          </p>

          <button
            onClick={deploy}
            className="mt-5 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.35)] transition hover:bg-violet-700"
          >
            {anyAttached ? `Deploy ${bp.agent.name}` : `Deploy without connections`}
          </button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------- building */
  if (stage === "building" && bp) {
    const chosen = bp.connections.filter((c) => attached[c.name]);
    const steps = [
      ...chosen.map((c) => `Connecting ${c.name}`),
      `Creating ${bp.agent.name}`,
      "Applying approval guardrails",
      "Scheduling the first run",
    ];
    return (
      <div className="mx-auto max-w-md pt-10">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
          <p className="text-sm font-semibold text-ink-950">Deploying {bp.agent.name}…</p>
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
      <div className="mx-auto max-w-md pt-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-950">{bp.agent.name} is ready</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          Connections are live and the first run is scheduled. {bp.firstDeliverable}.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => router.push(newAgentId ? `/dashboard/agents/${newAgentId}` : "/dashboard/agents")}
            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.35)] transition hover:bg-violet-700"
          >
            Open {bp.agent.name}
          </button>
          <button
            onClick={() => { setStage("ask"); setText(""); setBp(null); setError(null); }}
            className="rounded-xl border border-ink-200 bg-white px-6 py-3 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return null;
}
