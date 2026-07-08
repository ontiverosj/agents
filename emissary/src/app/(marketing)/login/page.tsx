import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/marketing/auth-form";
import { googleConfigured } from "@/auth";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="relative overflow-hidden py-20">
      <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-md px-4">
        <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-card-lg">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-500">Your coworkers kept working while you were away.</p>
          <div className="mt-7">
            <AuthForm mode="login" googleEnabled={googleConfigured} />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-ink-500">
          New to Emissary?{" "}
          <Link href="/signup" className="font-medium text-violet-600 hover:text-violet-800">
            Start free
          </Link>
        </p>
      </div>
    </div>
  );
}
