import type { Metadata } from "next";
import { SectionHeading, ButtonLink, CheckIcon, Card } from "@/components/ui";
import { plans } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple plans from free to enterprise. Pay for the work your AI coworkers complete, not for seats you don't use.",
};

const faqs = [
  {
    q: "What counts as a task run?",
    a: "One execution of one agent's brief, end to end — however many pages it visits or files it produces along the way. A scheduled agent that runs daily uses about 30 runs a month.",
  },
  {
    q: "What happens when I hit my run limit?",
    a: "Running tasks finish; new ones queue until your cycle resets or you upgrade. We never silently bill overages.",
  },
  {
    q: "Can agents log into websites on my behalf?",
    a: "Yes, with credentials you store in the encrypted vault. Credentials are injected directly into the sandboxed browser session — the AI model never sees them — and every use is logged.",
  },
  {
    q: "Do you offer a trial of paid plans?",
    a: "Pro and Team include a 14-day free trial with full features. No credit card required to start.",
  },
  {
    q: "How does the white-label option work?",
    a: "On Enterprise, agencies can run client workspaces under their own domain, logo, and colors — with consolidated billing and per-client usage reporting.",
  },
  {
    q: "What LLM providers do you support?",
    a: "Emissary is model-agnostic. Use our managed models, or bring your own API keys for Anthropic, OpenAI, and other providers on Team and Enterprise.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="Pricing"
            title="Cheaper than the hours it replaces"
            lede="Start free, upgrade when the work does. Every paid plan pays for itself with the first few hours your coworkers give back."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-7 ${
                p.highlight
                  ? "border-violet-300 shadow-[0_8px_40px_rgb(107_43_247/0.18)] ring-1 ring-violet-300"
                  : "border-ink-100 shadow-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold text-ink-950">{p.name}</h2>
              <p className="mt-1 text-sm text-ink-500">{p.blurb}</p>
              <p className="mt-5">
                <span className="text-4xl font-semibold tracking-tight text-ink-950">{p.price}</span>
                <span className="ml-1.5 text-sm text-ink-400">{p.period}</span>
              </p>
              <div className="mt-6">
                <ButtonLink
                  href={p.name === "Enterprise" ? "/customers" : "/signup"}
                  variant={p.highlight ? "primary" : "secondary"}
                  className="w-full"
                >
                  {p.cta}
                </ButtonLink>
              </div>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-700">
                    <CheckIcon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-violet-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink-400">
          All plans include human approval checkpoints, sandboxed browsing, encrypted credentials, and task logging.
        </p>
      </section>

      <section className="bg-ink-50/60 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading center title="Common questions" />
          <div className="mt-12 space-y-4">
            {faqs.map((f) => (
              <Card key={f.q} className="p-6">
                <h3 className="text-base font-semibold text-ink-950">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
