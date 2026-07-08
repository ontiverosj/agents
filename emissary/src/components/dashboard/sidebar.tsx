"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/ui";

export interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const nav = [
  {
    section: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z" },
      { href: "/dashboard/assistant", label: "Assistant", icon: "M12 3l1.9 4.8a2.5 2.5 0 001.4 1.4L20 11l-4.7 1.8a2.5 2.5 0 00-1.4 1.4L12 19l-1.9-4.8a2.5 2.5 0 00-1.4-1.4L4 11l4.7-1.8a2.5 2.5 0 001.4-1.4L12 3zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z" },
      { href: "/dashboard/agents", label: "Agents", icon: "M16 8a4 4 0 11-8 0 4 4 0 018 0zM4 20v-.5A5.5 5.5 0 019.5 14h5a5.5 5.5 0 015.5 5.5v.5" },
      { href: "/dashboard/tasks", label: "Tasks", icon: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" },
    ],
  },
  {
    section: "Control",
    items: [
      { href: "/dashboard/integrations", label: "Connections", icon: "M9 3v4M15 3v4M7 7h10a2 2 0 012 2v2a7 7 0 01-14 0V9a2 2 0 012-2zM12 18v3" },
      { href: "/dashboard/audit", label: "Audit log", icon: "M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM9 8h6M9 12h6M9 16h4" },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: "M3 8.5A1.5 1.5 0 014.5 7h15A1.5 1.5 0 0121 8.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-9zM3 11h18M6 15.5h4" },
      { href: "/dashboard/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 01-.1 1.2l2 1.5-2 3.4-2.3-.9a7 7 0 01-2.1 1.2L14 21h-4l-.5-2.6a7 7 0 01-2.1-1.2l-2.3.9-2-3.4 2-1.5A7 7 0 015 12a7 7 0 01.1-1.2l-2-1.5 2-3.4 2.3.9a7 7 0 012.1-1.2L10 3h4l.5 2.6a7 7 0 012.1 1.2l2.3-.9 2 3.4-2 1.5c.07.4.1.8.1 1.2z" },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {nav.map((group) => (
        <div key={group.section}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-400">
            {group.section}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-violet-50 text-violet-800"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink-950"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className={`h-[18px] w-[18px] ${active ? "text-violet-600" : "text-ink-400"}`} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ user }: { user: SidebarUser | null }) {
  return (
    <div className="border-t border-ink-100 p-4">
      <div className="flex items-center gap-3">
        {user?.image ? (
          <Image src={user.image} alt="" width={36} height={36} className="h-9 w-9 rounded-full" unoptimized />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-semibold text-white">
            {(user?.name ?? "You").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-950">{user?.name ?? "Your workspace"}</p>
          <p className="truncate text-xs text-ink-400">{user?.email ?? "Not signed in"}</p>
        </div>
        {user ? (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="ml-auto text-ink-400 hover:text-ink-700"
            aria-label="Sign out"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11" />
            </svg>
          </button>
        ) : (
          <Link href="/login" className="ml-auto text-xs font-medium text-violet-600 hover:text-violet-800">
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ user = null }: { user?: SidebarUser | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 lg:hidden">
        <Link href="/dashboard"><Logo /></Link>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-ink-700 hover:bg-ink-50"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white pt-16 shadow-card-lg">
            <NavLinks onNavigate={() => setOpen(false)} />
            <SidebarFooter user={user} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-100 bg-white lg:flex">
        <div className="border-b border-ink-100 px-5 py-4">
          <Link href="/dashboard"><Logo /></Link>
        </div>
        <NavLinks />
        <SidebarFooter user={user} />
      </aside>
    </>
  );
}
