import Link from "next/link";
import { Logo } from "@/components/ui";

const columns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/product", label: "Overview" },
      { href: "/templates", label: "Templates" },
      { href: "/pricing", label: "Pricing" },
      { href: "/security", label: "Security" },
      { href: "/developers", label: "Developers & API" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { href: "/use-cases/sales", label: "Sales" },
      { href: "/use-cases/recruiting", label: "Recruiting" },
      { href: "/use-cases/operations", label: "Operations" },
      { href: "/use-cases/real-estate", label: "Real estate" },
      { href: "/use-cases/ecommerce", label: "Ecommerce" },
      { href: "/use-cases/research", label: "Research" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/customers", label: "Customers" },
      { href: "/blog", label: "Blog" },
      { href: "/security", label: "Trust center" },
      { href: "/signup", label: "Start Free" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50/50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              AI coworkers that complete real web work — with human approvals, audit trails, and business-ready controls.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink-950">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-sm text-ink-500 transition hover:text-ink-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-ink-100 pt-8 text-sm text-ink-400 sm:flex-row">
          <p>© 2026 Emissary Labs, Inc. All rights reserved.</p>
          <p>SOC 2-ready controls · Data encrypted in transit and at rest</p>
        </div>
      </div>
    </footer>
  );
}
