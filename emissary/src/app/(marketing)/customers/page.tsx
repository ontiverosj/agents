import type { Metadata } from "next";
import { SectionHeading, Card, ButtonLink } from "@/components/ui";
import { customers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Customers",
  description: "How operations, sales, recruiting, and research teams put Emissary AI coworkers to work — with the numbers to show for it.",
};

export default function CustomersPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="Customers"
            title="Teams that got their hours back"
            lede="From two-person agencies to compliance-heavy enterprises — measurable outcomes, not automation theater."
          />
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 text-center">
            {[
              ["46,000+", "hours returned to customers"],
              ["96%", "average task success rate"],
              ["1.2M+", "data rows collected monthly"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">{value}</p>
                <p className="mt-1 text-sm text-ink-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {customers.map((c) => (
            <Card key={c.company} className="flex flex-col p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink-950">{c.company}</h2>
                  <p className="text-sm text-ink-400">{c.industry}</p>
                </div>
                <div className="rounded-xl bg-violet-50 px-4 py-2 text-center">
                  <p className="text-lg font-semibold text-violet-700">{c.stat.value}</p>
                  <p className="text-xs text-violet-700/70">{c.stat.label}</p>
                </div>
              </div>
              <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-ink-700">
                &ldquo;{c.quote}&rdquo;
              </blockquote>
              <p className="mt-5 border-t border-ink-100 pt-4 text-sm">
                <span className="font-semibold text-ink-950">{c.person}</span>
                <span className="text-ink-400"> · {c.title}</span>
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-ink-950 px-8 py-12 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Ready to measure your own numbers?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-300">
            The dashboard tracks hours saved, tasks completed, and success rate from day one — so the ROI conversation is a screenshot.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <ButtonLink href="/signup" size="lg">Start Free</ButtonLink>
            <ButtonLink href="/pricing" variant="inverted" size="lg">Talk to Sales</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
