"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo, ButtonLink } from "@/components/ui";

const links = [
  { href: "/product", label: "Product" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/customers", label: "Customers" },
  { href: "/developers", label: "Developers" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-ink-100/80 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Emissary home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-950"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/login" variant="ghost">Log in</ButtonLink>
          <ButtonLink href="/signup">Start Free</ButtonLink>
        </div>

        <button
          className="rounded-lg p-2 text-ink-700 hover:bg-ink-50 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 pb-6 pt-2 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-ink-700 hover:bg-ink-50"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-4 flex gap-3">
            <ButtonLink href="/login" variant="secondary" className="flex-1">Log in</ButtonLink>
            <ButtonLink href="/signup" className="flex-1">Start Free</ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
