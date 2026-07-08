import type { Metadata } from "next";
import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-screen flex-col bg-ink-50/50 lg:flex-row">
      <Sidebar user={session?.user ?? null} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
    </div>
  );
}
