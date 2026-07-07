import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SectionHeading, Card, ButtonLink, CheckIcon, ArrowRight } from "@/components/ui";
import { useCases, getUseCase } from "@/lib/data";

export function generateStaticParams() {
  return useCases.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) return {};
  return { title: `${uc.name} — Use Case`, description: uc.summary };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  const others = useCases.filter((u) => u.slug !== slug).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">
              Emissary for {uc.name}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">{uc.headline}</h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">{uc.summary}</p>
            <div className="mt-8 flex justify-center gap-3">
              <ButtonLink href="/signup" size="lg">Start Free</ButtonLink>
              <ButtonLink href="/templates" variant="secondary" size="lg">See Templates</ButtonLink>
            </div>
            <p className="mt-8 inline-flex items-baseline gap-2 rounded-full bg-violet-50 px-5 py-2">
              <span className="text-xl font-semibold text-violet-700">{uc.metric.value}</span>
              <span className="text-sm text-violet-700/80">{uc.metric.label}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-950">The problem it removes</h2>
            <ul className="mt-6 space-y-4">
              {uc.painPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-4 text-ink-700 shadow-card">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                  </span>
                  <span className="text-sm leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-950">What the coworker delivers</h2>
            <ul className="mt-6 space-y-4">
              {uc.outputs.map((o) => (
                <li key={o} className="flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-4 text-ink-700 shadow-card">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                  <span className="text-sm leading-relaxed">{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="How it works" title={`The ${uc.name.toLowerCase()} workflow`} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {uc.workflow.map((w, i) => (
            <Card key={w.step} className="p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-950">{w.step}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{w.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-ink-50/60 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Card className="p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Example brief · {uc.exampleAgent.name}
            </p>
            <p className="mt-4 rounded-xl bg-ink-50 p-5 font-mono text-sm leading-relaxed text-ink-700">
              &ldquo;{uc.exampleAgent.instruction}&rdquo;
            </p>
            <p className="mt-4 text-sm text-ink-500">
              That&rsquo;s the entire setup. Connect your tools, set the approval rules, and schedule it.
            </p>
            <div className="mt-6">
              <ButtonLink href="/signup">Create this coworker <ArrowRight /></ButtonLink>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-ink-950">More use cases</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {others.map((u) => (
            <Link key={u.slug} href={`/use-cases/${u.slug}`} className="group">
              <Card className="h-full p-6 transition group-hover:-translate-y-1 group-hover:shadow-card-lg">
                <h3 className="font-semibold text-ink-950">{u.name}</h3>
                <p className="mt-1 text-sm text-violet-700">{u.headline}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
