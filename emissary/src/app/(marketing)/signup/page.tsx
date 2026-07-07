import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/marketing/auth-form";
import { CheckIcon } from "@/components/ui";

export const metadata: Metadata = { title: "Start Free" };

export default function SignupPage() {
  return (
    <div className="relative overflow-hidden py-20">
      <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-4xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
        <div className="hidden lg:block">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-950">
            Your first AI coworker is minutes away.
          </h1>
          <ul className="mt-8 space-y-4">
            {[
              "Free plan with real task runs — no credit card",
              "Templates for sales, ops, recruiting, and research",
              "Human approvals and audit logs on from day one",
              "Watch your agent work in the live browser preview",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-ink-700">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-card-lg">
            <h2 className="text-2xl font-semibold tracking-tight text-ink-950">Create your account</h2>
            <p className="mt-1.5 text-sm text-ink-500">Free forever plan. Upgrade only when the work does.</p>
            <div className="mt-7">
              <AuthForm mode="signup" />
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-violet-600 hover:text-violet-800">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
