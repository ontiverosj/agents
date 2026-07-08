"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { templates, integrations } from "@/lib/data";
import { workspace } from "@/lib/workspace";

const steps = [
  "Name",
  "Role",
  "Instructions",
  "Tools",
  "Approvals",
  "Output",
  "Schedule",
] as const;

const roles = [
  { id: "custom", name: "Start from scratch", desc: "A blank brief — describe any browser-based job." },
  ...templates.slice(0, 5).map((t) => ({ id: t.id, name: t.name, desc: t.description })),
];

const approvalOptions = [
  { id: "messages", label: "Sending emails or messages", locked: false, default: true },
  { id: "forms", label: "Submitting web forms", locked: false, default: true },
  { id: "crm", label: "Publishing CRM or database records", locked: false, default: true },
  { id: "payments", label: "Entering payment details", locked: true, default: true },
  { id: "pii", label: "Accessing personal data fields", locked: true, default: true },
];

const outputOptions = [
  { id: "csv", label: "CSV / Spreadsheet", desc: "Structured rows to download, Google Sheets, or Airtable" },
  { id: "pdf", label: "PDF report", desc: "Formatted brief with summaries, tables, and citations" },
  { id: "crm", label: "CRM updates", desc: "Draft records staged in HubSpot or Salesforce" },
  { id: "email", label: "Email digest", desc: "A summary to your inbox or a Slack channel" },
];

const scheduleOptions = [
  { id: "once", label: "Run once now", desc: "Watch it work in the live preview, then decide" },
  { id: "daily", label: "Daily", desc: "Every weekday morning before your team logs in" },
  { id: "weekly", label: "Weekly", desc: "A recurring weekly deliverable, like a Monday report" },
  { id: "custom", label: "Custom schedule", desc: "Cron-style timing for anything else" },
];

export function AgentWizard() {
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");
  const template = templates.find((t) => t.id === templateParam);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(template ? template.name : "");
  const [role, setRole] = useState(template?.id ?? "custom");
  const [instructions, setInstructions] = useState(
    template ? `${template.description}\n\nCustomize: describe your specific targets, criteria, and what "done" looks like.` : "",
  );
  const [tools, setTools] = useState<string[]>(["gsheets"]);
  const [rules, setRules] = useState<string[]>(approvalOptions.filter((o) => o.default).map((o) => o.id));
  const [output, setOutput] = useState("csv");
  const [schedule, setSchedule] = useState("once");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const canNext =
    (step !== 0 || name.trim().length > 0) &&
    (step !== 2 || instructions.trim().length > 20);

  async function submit() {
    setSubmitting(true);
    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, instructions, tools, approvalRules: rules, output, schedule }),
    }).catch(() => {});
    // persist to the local workspace so it appears in the roster immediately
    const toolNames = tools.map((t) => integrations.find((i) => i.id === t)?.name ?? t);
    tools.forEach((t) => workspace.setIntegration(t, true));
    workspace.addAgents([
      {
        id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36).slice(-4)}`,
        name,
        role: role === "custom" ? "Custom agent" : role,
        status: "working",
        avatarHue: (name.length * 47) % 360,
        initials: name.replace(/[^a-zA-Z ]/g, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "AG",
        description: instructions.slice(0, 140) + (instructions.length > 140 ? "…" : ""),
        instructions,
        schedule: scheduleOptions.find((s) => s.id === schedule)?.label ?? schedule,
        tools: ["Web browsing", ...toolNames],
        memory: [],
        tasksCompleted: 0,
        hoursSaved: 0,
        successRate: 0,
        createdAt: "just now",
        lastActive: "just now",
        currentActivity: schedule === "once" ? "First run in progress" : "First run scheduled",
      },
    ]);
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink-950">{name} is ready to work</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          {schedule === "once"
            ? "Your coworker is starting its first run. Watch it live from the agent page."
            : "Your coworker is scheduled. It will pause for your approval before any sensitive action."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/dashboard/agents" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
            Go to agents
          </Link>
          <Link href="/dashboard" className="rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50">
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2">
        <Link href="/dashboard/agents" className="text-sm font-medium text-violet-600 hover:text-violet-800">
          ← Cancel
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Create a new agent</h1>
      <p className="mt-1 text-sm text-ink-500">Seven quick steps — most teams finish in under five minutes.</p>

      {/* Stepper */}
      <ol className="mt-8 flex items-center gap-1.5">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`h-1.5 w-full rounded-full transition ${i <= step ? "bg-violet-600" : "bg-ink-200"}`}
            />
            <span className={`hidden text-[11px] font-medium sm:block ${i === step ? "text-violet-700" : "text-ink-400"}`}>
              {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Name your AI coworker</h2>
            <p className="mt-1 text-sm text-ink-500">Pick something your team will recognize in Slack and reports.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lead Hunter, Market Monitor, Deal Spotter"
              autoFocus
              className="mt-5 w-full rounded-xl border border-ink-200 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Choose a role or template</h2>
            <p className="mt-1 text-sm text-ink-500">Templates pre-fill instructions, tools, and approval rules.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    role === r.id
                      ? "border-violet-400 bg-violet-50/60 ring-2 ring-violet-100"
                      : "border-ink-200 hover:border-ink-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink-950">{r.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Describe the task in plain English</h2>
            <p className="mt-1 text-sm text-ink-500">
              Write it like an onboarding doc for a literal-minded new hire: what to do, where to look, and what &ldquo;done&rdquo; looks like.
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={8}
              autoFocus
              placeholder={`e.g. Every weekday at 7 AM, check the pricing pages of these competitors: …\nCapture plan names and prices, diff against yesterday, and if anything changed, write a short summary with a side-by-side table.`}
              className="mt-5 w-full rounded-xl border border-ink-200 px-4 py-3 font-mono text-sm leading-relaxed text-ink-900 placeholder:text-ink-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            <p className="mt-2 text-xs text-ink-400">
              Tip: name specific sites and thresholds. You can refine details later in the agent&rsquo;s memory.
            </p>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Connect tools and accounts</h2>
            <p className="mt-1 text-sm text-ink-500">
              Sandboxed web browsing is always included. Add the tools this agent delivers into.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {integrations.map((i) => {
                const on = tools.includes(i.id);
                return (
                  <button
                    key={i.id}
                    onClick={() => setTools((prev) => (on ? prev.filter((t) => t !== i.id) : [...prev, i.id]))}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                      on ? "border-violet-400 bg-violet-50/60 ring-2 ring-violet-100" : "border-ink-200 hover:border-ink-300"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-950">{i.name}</p>
                      <p className="text-xs text-ink-400">{i.category}</p>
                    </div>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-white ${
                        on ? "border-violet-600 bg-violet-600" : "border-ink-300"
                      }`}
                    >
                      {on && (
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                          <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Set approval rules</h2>
            <p className="mt-1 text-sm text-ink-500">
              These actions pause the task and wait for a human. Two are platform-enforced and can&rsquo;t be turned off.
            </p>
            <div className="mt-5 space-y-3">
              {approvalOptions.map((o) => {
                const on = rules.includes(o.id);
                return (
                  <button
                    key={o.id}
                    disabled={o.locked}
                    onClick={() => setRules((prev) => (on ? prev.filter((r) => r !== o.id) : [...prev, o.id]))}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                      o.locked ? "cursor-not-allowed border-ink-100 bg-ink-50/70" : on ? "border-violet-400 bg-violet-50/60" : "border-ink-200 hover:border-ink-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${on ? "bg-violet-600" : "bg-ink-200"}`}>
                        <span className={`h-4 w-4 rounded-full bg-white shadow transition ${on ? "translate-x-4" : ""}`} />
                      </span>
                      <span className="text-sm font-medium text-ink-900">{o.label}</span>
                    </div>
                    {o.locked && (
                      <span className="rounded-full bg-ink-950 px-2.5 py-0.5 text-[11px] font-medium text-white">
                        Always on
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Choose the output format</h2>
            <p className="mt-1 text-sm text-ink-500">What should land on your desk when a run finishes?</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {outputOptions.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOutput(o.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    output === o.id ? "border-violet-400 bg-violet-50/60 ring-2 ring-violet-100" : "border-ink-200 hover:border-ink-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink-950">{o.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Run once or schedule it</h2>
            <p className="mt-1 text-sm text-ink-500">Most teams run once first to watch the live preview, then schedule.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {scheduleOptions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSchedule(s.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    schedule === s.id ? "border-violet-400 bg-violet-50/60 ring-2 ring-violet-100" : "border-ink-200 hover:border-ink-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink-950">{s.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{s.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-ink-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Summary</p>
              <ul className="mt-2 space-y-1 text-sm text-ink-700">
                <li><span className="font-medium">{name || "Unnamed agent"}</span> · {roles.find((r) => r.id === role)?.name}</li>
                <li>{tools.length} tool{tools.length === 1 ? "" : "s"} connected · {rules.length} approval rules · delivers {outputOptions.find((o) => o.id === output)?.label}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-ink-50 disabled:opacity-40"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.3)] transition hover:bg-violet-700 disabled:opacity-40 disabled:shadow-none"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.3)] transition hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting ? "Creating…" : schedule === "once" ? "Create & run now" : "Create & schedule"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
