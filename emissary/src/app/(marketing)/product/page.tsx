import type { Metadata } from "next";
import { ButtonLink, SectionHeading, Card, CheckIcon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Product",
  description: "How Emissary AI coworkers plan, browse, act, and deliver — with approvals, memory, scheduling, and audit trails built in.",
};

const capabilities = [
  {
    title: "Plain-English tasking",
    desc: "Describe the job like you're briefing a new hire. The agent turns your instructions into a step-by-step plan you can review before it runs.",
    icon: "M8 9h8M8 13h5M21 12a9 9 0 11-4.2-7.6L21 3l-1 4.2A8.96 8.96 0 0121 12z",
  },
  {
    title: "Sandboxed web browsing",
    desc: "Agents work in isolated, ephemeral browser sessions — logging into portals, reading pages, downloading files — with every step recorded.",
    icon: "M12 21a9 9 0 100-18 9 9 0 000 18zM3.5 9h17M3.5 15h17M12 3a15 15 0 010 18M12 3a15 15 0 000 18",
  },
  {
    title: "Human approval checkpoints",
    desc: "Sensitive actions — messages, form submissions, payments, CRM publishes — pause the run and wait for a person. Enforced by the platform, not the prompt.",
    icon: "M9 12l2 2 4-4M12 22c4.5-1.5 8-5.5 8-10V5l-8-3-8 3v7c0 4.5 3.5 8.5 8 10z",
  },
  {
    title: "Editable memory",
    desc: "Each coworker keeps durable, human-readable memory — your ICP, your lists, your corrections. Edit it anytime; fixes persist across every future run.",
    icon: "M12 4a4 4 0 014 4c2 .5 3.5 2.2 3.5 4.4 0 1.7-.9 3.1-2.2 3.9L17 21h-4M12 4a4 4 0 00-4 4c-2 .5-3.5 2.2-3.5 4.4 0 1.7.9 3.1 2.2 3.9L7 21h4M12 4v17",
  },
  {
    title: "Live preview & replay",
    desc: "Watch any task work in real time, or scrub through past runs step by step with screenshots. Nothing your coworker does is a black box.",
    icon: "M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 14.5v-9zM10 8l4 2.5L10 13V8zM8 20h8",
  },
  {
    title: "Scheduled recurring work",
    desc: "Run once, daily, weekly, or on a cron schedule. Coworkers show up on time, every time, and deliver before your team logs in.",
    icon: "M12 8v4l2.5 2.5M21 12a9 9 0 11-9-9 9 9 0 019 9z",
  },
  {
    title: "Workflow builder",
    desc: "Chain steps across sites and tools — collect, transform, cross-check, deliver — with a visual builder made for non-technical operators.",
    icon: "M6 8a2 2 0 100-4 2 2 0 000 4zM18 14a2 2 0 100-4 2 2 0 000 4zM10 20a2 2 0 100-4 2 2 0 000 4zM6 8v4a4 4 0 004 4M18 14h-4",
  },
  {
    title: "Structured deliverables",
    desc: "CSVs, spreadsheets, PDF reports, CRM drafts, and email summaries — delivered to Sheets, Slack, your inbox, or wherever the work belongs.",
    icon: "M4 17l6-6 4 4 6-6M20 9V5h-4",
  },
  {
    title: "Usage analytics",
    desc: "Hours saved, tasks completed, rows collected, success rate — per agent and per workspace, so ROI is a report, not a guess.",
    icon: "M5 20V10M12 20V4M19 20v-7",
  },
];

const flow = [
  { step: "1", title: "Name your coworker", desc: "Give it a name and a role — 'Lead Hunter', 'Market Monitor', 'Ops Assistant'." },
  { step: "2", title: "Pick a template or start fresh", desc: "Start from a proven playbook for sales, ops, recruiting, and more — or a blank brief." },
  { step: "3", title: "Describe the task", desc: "Plain English. What to do, where to look, what done looks like." },
  { step: "4", title: "Connect tools", desc: "Sheets, Gmail, Slack, your CRM. Scoped access, revocable anytime." },
  { step: "5", title: "Set approval rules", desc: "Choose which actions always pause for a human. Defaults are safe out of the box." },
  { step: "6", title: "Choose the output", desc: "CSV, PDF report, CRM drafts, email digest — the deliverable your team actually uses." },
  { step: "7", title: "Run or schedule", desc: "Fire it once to watch it work, then put it on a schedule and get your hours back." },
];

export default function ProductPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="Product"
            title="A full-time worker's output. A browser tab's overhead."
            lede="Emissary coworkers plan real multi-step work, browse the live web in sandboxed sessions, pause for your approval at the moments that matter, and deliver structured results — on a schedule you set."
          />
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink href="/signup" size="lg">Start Free</ButtonLink>
            <ButtonLink href="/templates" variant="secondary" size="lg">Browse Templates</ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <Card key={c.title} className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={c.icon} />
                </svg>
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-950">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{c.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-ink-50/60 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="From idea to always-on"
            title="Create a coworker in seven steps"
            lede="Most teams go from signup to a scheduled, working agent in under fifteen minutes."
          />
          <ol className="mx-auto mt-14 max-w-3xl space-y-4">
            {flow.map((s) => (
              <li key={s.step} className="flex items-start gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink-950">{s.title}</h3>
                  <p className="mt-1 text-sm text-ink-500">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="For teams"
              title="Shared workspaces, individual accountability"
              lede="Bring your whole team into one workspace. Every agent, task, approval, and output is visible to the people who should see it — and only them."
            />
            <ul className="mt-8 space-y-3">
              {[
                "Owner, admin, editor, and viewer roles with granular permissions",
                "Approval routing — high-risk actions go to the right person",
                "Shared template library so wins spread across the team",
                "White-label option for agencies running client workspaces",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-ink-700">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Workspace · Everflow Acquisitions</p>
            <div className="mt-4 space-y-3">
              {[
                { name: "Jake Ontiveros", role: "Owner", perms: "All permissions" },
                { name: "Priya Shah", role: "Admin", perms: "Manage agents · Grant approvals" },
                { name: "Sam Torres", role: "Editor", perms: "Create & run agents" },
                { name: "Finance team", role: "Viewer", perms: "View outputs & audit logs" },
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-950">{m.name}</p>
                    <p className="text-xs text-ink-400">{m.perms}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-600 ring-1 ring-ink-200">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-ink-950 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            See it work on your task, not ours.
          </h2>
          <p className="mt-4 text-lg text-ink-300">The free plan includes real task runs. Bring the job your team dreads most.</p>
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink href="/signup" size="lg">Start Free</ButtonLink>
            <ButtonLink href="/dashboard" variant="inverted" size="lg">View Live Demo</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
