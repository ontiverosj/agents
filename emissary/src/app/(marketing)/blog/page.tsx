import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading, Card, ArrowRight } from "@/components/ui";
import { blogPosts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Blog",
  description: "Product thinking, engineering deep-dives, and playbooks for putting AI coworkers to work.",
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="Blog"
            title="Notes from the AI workforce"
            lede="Product thinking, engineering deep-dives, and practical playbooks from the team building Emissary."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Link href={`/blog/${featured.slug}`} className="group block">
          <Card className="grid gap-8 p-8 transition group-hover:shadow-card-lg md:grid-cols-2 md:p-10">
            <div className="flex items-center">
              <div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  {featured.category} · Featured
                </span>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink-950 group-hover:text-violet-700 sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-3 leading-relaxed text-ink-500">{featured.excerpt}</p>
                <p className="mt-5 text-sm text-ink-400">{featured.date} · {featured.readMinutes} min read</p>
              </div>
            </div>
            <div className="hidden items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-ink-900 p-10 md:flex">
              <svg viewBox="0 0 120 120" className="h-40 w-40 text-white/90" fill="none" aria-hidden="true">
                <rect x="20" y="30" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="3" />
                <path d="M35 55l10 10 18-20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="78" cy="58" r="10" stroke="currentColor" strokeWidth="3" />
                <path d="M60 20v10M40 100v-10M80 100v-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </Card>
        </Link>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {rest.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group">
              <Card className="flex h-full flex-col p-7 transition group-hover:-translate-y-1 group-hover:shadow-card-lg">
                <span className="self-start rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600">
                  {p.category}
                </span>
                <h2 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-ink-950 group-hover:text-violet-700">
                  {p.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{p.excerpt}</p>
                <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4 text-sm text-ink-400">
                  <span>{p.date} · {p.readMinutes} min</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:text-violet-600" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
