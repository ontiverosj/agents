import Link from "next/link";
import { PageHeader } from "@/components/dashboard/widgets";
import { templates } from "@/lib/data";

export const metadata = { title: "Templates" };

export default function DashboardTemplatesPage() {
  return (
    <>
      <PageHeader
        title="Template library"
        description="Proven agent playbooks — pick one and it pre-fills the creation flow."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/agents/new?template=${t.id}`}
            className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-600">{t.category}</span>
              {t.popular && <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">Popular</span>}
            </div>
            <h2 className="mt-3 text-sm font-semibold text-ink-950 group-hover:text-violet-700">{t.name}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-500">{t.description}</p>
            <p className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-400">
              Outputs: {t.outputs.join(", ")} · saves ~{Math.round(t.estMinutesSaved / 60)} hrs/run
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
