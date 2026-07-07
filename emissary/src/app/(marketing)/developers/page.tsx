import type { Metadata } from "next";
import { SectionHeading, Card, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Developers & API",
  description: "Create agents, run tasks, stream progress, and receive webhooks — everything in the Emissary dashboard is available over the API.",
};

const endpoints = [
  ["POST", "/v1/agents", "Create an agent from instructions, tools, and approval rules"],
  ["POST", "/v1/agents/{id}/tasks", "Queue a task run, once or on a schedule"],
  ["GET", "/v1/tasks/{id}", "Poll status, step log, progress, and outputs"],
  ["GET", "/v1/tasks/{id}/stream", "Stream live browser steps over SSE"],
  ["POST", "/v1/approvals/{id}/decision", "Approve or decline a pending sensitive action"],
  ["GET", "/v1/audit-events", "Export the append-only audit log"],
];

const codeSample = `import { Emissary } from "@emissary/sdk";

const emissary = new Emissary({ apiKey: process.env.EMISSARY_API_KEY });

// Create an AI coworker
const agent = await emissary.agents.create({
  name: "Lead Hunter",
  instructions: \`Find SaaS companies (50-500 employees) hiring
    RevOps roles. Identify the VP Sales, score against the ICP
    in memory, and deliver a ranked CSV.\`,
  tools: ["browser", "google_sheets", "hubspot:draft"],
  approvalRules: [{ action: "crm.publish", require: "human" }],
  output: { format: "csv", destination: "google_sheets" },
});

// Run it and stream progress
const task = await emissary.tasks.create({ agentId: agent.id });

for await (const step of emissary.tasks.stream(task.id)) {
  console.log(step.time, step.action, step.detail);
  // 09:41:02 navigate  Opened careers page (northwindtech.com)
  // 09:41:09 extract   Found "Revenue Operations Manager"...
}`;

const webhookSample = `{
  "event": "approval.requested",
  "workspace": "ws_8Kj2m",
  "agent": { "id": "ag_leadhunter", "name": "Lead Hunter" },
  "task": "tk_1041",
  "action": {
    "type": "crm.publish",
    "summary": "Publish 23 draft contacts to HubSpot",
    "risk": "low"
  },
  "decide_url": "https://api.emissary.work/v1/approvals/apr_301/decision"
}`;

export default function DevelopersPage() {
  return (
    <>
      <section className="bg-ink-950">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">Developers & API</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                The whole platform, programmable
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-ink-300">
                Everything you can do in the dashboard — create agents, run tasks, stream browser steps,
                decide approvals — is a REST call away. Build agents into your product, or wire Emissary
                into your internal systems.
              </p>
              <div className="mt-8 flex gap-3">
                <ButtonLink href="/signup" size="lg">Get an API Key</ButtonLink>
                <ButtonLink href="/security" variant="inverted" size="lg">Security Model</ButtonLink>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-card-lg">
              <div className="flex items-center gap-2 border-b border-ink-800 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
                <span className="ml-2 font-mono text-xs text-ink-500">create-agent.ts</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-ink-200">
                <code>{codeSample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="REST API" title="Six endpoints cover most products" />
        <div className="mt-10 overflow-hidden rounded-2xl border border-ink-100 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Endpoint</th>
                  <th className="px-6 py-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 bg-white">
                {endpoints.map(([method, path, desc]) => (
                  <tr key={path}>
                    <td className="px-6 py-4">
                      <span className={`rounded-md px-2 py-1 font-mono text-xs font-semibold ${method === "GET" ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-ink-800">{path}</td>
                    <td className="px-6 py-4 text-ink-500">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-ink-50/60 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Webhooks"
                title="Approvals where your team already lives"
                lede="Subscribe to task lifecycle and approval events. Route approval requests into Slack, your ticketing system, or your own app — the decide URL closes the loop."
              />
              <ul className="mt-6 space-y-2 font-mono text-sm text-ink-600">
                {["task.started", "task.step", "task.completed", "task.failed", "approval.requested", "approval.decided", "output.ready"].map((e) => (
                  <li key={e} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <Card className="overflow-hidden">
              <div className="border-b border-ink-100 bg-ink-50/70 px-4 py-2.5 font-mono text-xs text-ink-400">
                POST https://yourapp.com/webhooks/emissary
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-ink-700">
                <code>{webhookSample}</code>
              </pre>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-2xl font-semibold text-ink-950 sm:text-3xl">Free tier includes API access</h2>
        <p className="mt-3 text-ink-500">SDKs for TypeScript and Python. Zapier for everything else.</p>
        <div className="mt-7">
          <ButtonLink href="/signup" size="lg">Start Building</ButtonLink>
        </div>
      </section>
    </>
  );
}
