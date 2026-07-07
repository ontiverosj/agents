import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading, Card, ArrowRight, ButtonLink } from "@/components/ui";
import { useCases } from "@/lib/data";

export const metadata: Metadata = {
  title: "Use Cases",
  description: "How teams in sales, recruiting, operations, real estate, ecommerce, and research put AI coworkers to work.",
};

export default function UseCasesPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="Use cases"
            title="If it happens in a browser, a coworker can own it"
            lede="The repetitive web work is different in every department — the pattern is the same. Describe it once, approve the sensitive parts, and get the deliverable on schedule."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {useCases.map((u) => (
            <Link key={u.slug} href={`/use-cases/${u.slug}`} className="group">
              <Card className="flex h-full flex-col p-7 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-card-lg">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
                    {u.name}
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink-950">{u.headline}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{u.summary}</p>
                <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                  <p className="text-sm">
                    <span className="font-semibold text-ink-950">{u.metric.value}</span>{" "}
                    <span className="text-ink-400">{u.metric.label}</span>
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-ink-950 px-8 py-12 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Don&rsquo;t see your workflow?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-300">
            Templates are starting points, not limits. If you can describe the job in plain English, you can hand it to a coworker.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <ButtonLink href="/signup" size="lg">Start Free</ButtonLink>
            <ButtonLink href="/templates" variant="inverted" size="lg">Browse Templates</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
