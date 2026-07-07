import type { Metadata } from "next";
import { SectionHeading, Card, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Security",
  description: "How Emissary keeps agent work safe: sandboxed sessions, encrypted credentials, platform-enforced approvals, and immutable audit logs.",
};

const pillars = [
  {
    title: "Sandboxed browser sessions",
    desc: "Every task runs in an isolated, ephemeral container with its own browser profile. No shared cookies, no cross-customer access, destroyed when the task ends.",
    icon: "M12 3l8 4v5c0 4.5-3.5 8.5-8 10-4.5-1.5-8-5.5-8-10V7l8-4z",
  },
  {
    title: "Encrypted credential vault",
    desc: "Logins are AES-256-GCM encrypted with per-workspace keys and injected directly into the browser session. The AI model never sees a password — it only learns 'login succeeded'.",
    icon: "M8 11V7a4 4 0 118 0v4M5 11h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9zM12 15v2.5",
  },
  {
    title: "Platform-enforced approvals",
    desc: "Sensitive actions are intercepted at the browser layer, not left to model judgment. A flagged form submission physically cannot complete until an authorized human approves it.",
    icon: "M9 12.5l2 2 4-4.5M4 6l8-3 8 3v6c0 4.7-3.4 8.6-8 10-4.6-1.4-8-5.3-8-10V6z",
  },
  {
    title: "Immutable audit logs",
    desc: "Every navigation, extraction, credential use, approval, and output is written to an append-only log with actor, timestamp, and context. Export to your SIEM anytime.",
    icon: "M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM9 8h6M9 12h6M9 16h4",
  },
  {
    title: "Guardrails for sensitive data",
    desc: "Payments, logins, personal data, and form submissions are classified as sensitive by default. Agents are blocked from entering payment details anywhere without explicit, per-instance approval.",
    icon: "M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  },
  {
    title: "Role-based access control",
    desc: "Owner, admin, editor, and viewer roles scope who can create agents, connect integrations, grant approvals, and read outputs. SCIM provisioning on Enterprise.",
    icon: "M17 21v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M10 12a4 4 0 100-8 4 4 0 000 8zM21 21v-1a4 4 0 00-3-3.85M15 4.15A4 4 0 0115 12",
  },
];

const practices = [
  ["Encryption in transit", "TLS 1.3 for all traffic, including agent browser sessions."],
  ["Encryption at rest", "AES-256 for all customer data, outputs, and logs."],
  ["SOC 2-ready controls", "Access reviews, change management, and monitoring mapped to SOC 2 criteria."],
  ["SSO / SAML", "Okta, Entra ID, and Google Workspace on Enterprise; Google login on all plans."],
  ["Data retention controls", "Configurable retention for task artifacts, replays, and logs."],
  ["Private deployment", "Dedicated infrastructure or your cloud, for regulated environments."],
  ["Least-privilege integrations", "OAuth scopes are requested per capability and revocable per integration."],
  ["No training on your data", "Your tasks, credentials, and outputs are never used to train models."],
];

export default function SecurityPage() {
  return (
    <>
      <section className="bg-ink-950">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">Security</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Automation your security team will sign off on
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-300">
              AI agents that touch real websites, real credentials, and real customer data need more
              than good intentions. Emissary is built so the safe path is the only path.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <Card key={p.title} className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={p.icon} />
                </svg>
              </span>
              <h2 className="mt-4 text-base font-semibold text-ink-950">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-ink-50/60 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            center
            title="Practices and controls"
            lede="The details your vendor-review checklist actually asks about."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
            {practices.map(([title, desc]) => (
              <div key={title} className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
                <h3 className="text-sm font-semibold text-ink-950">{title}</h3>
                <p className="mt-1 text-sm text-ink-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-2xl font-semibold text-ink-950 sm:text-3xl">Need a security review packet?</h2>
        <p className="mt-3 text-ink-500">
          We&rsquo;ll send our architecture overview, control mappings, and DPA template for your vendor review.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <ButtonLink href="/customers">Talk to Sales</ButtonLink>
          <ButtonLink href="/developers" variant="secondary">Read the Architecture</ButtonLink>
        </div>
      </section>
    </>
  );
}
