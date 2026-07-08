"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

/**
 * MVP auth form. Submits to the stub /api/auth route and enters the demo
 * workspace. In production this is replaced by Supabase Auth (email/password
 * + Google OAuth) — see README "Authentication".
 */
export function AuthForm({ mode, googleEnabled = false }: { mode: "login" | "signup"; googleEnabled?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password, company }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <button
        type="button"
        onClick={() =>
          googleEnabled
            ? signIn("google", { callbackUrl: "/dashboard" })
            : router.push("/dashboard")
        }
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-800 transition hover:border-ink-300 hover:bg-ink-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 01-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0012 24z" />
          <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 010-4.56v-3.1H1.29a12 12 0 000 10.76l4-3.1z" />
          <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43A11.97 11.97 0 0012 0 12 12 0 001.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
        </svg>
        Continue with Google
      </button>
      {!googleEnabled && (
        <p className="text-center text-xs text-ink-400">
          Google sign-in isn&rsquo;t configured yet — this opens the demo workspace. Add
          AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET to .env.local to enable it.
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-100" />
        or with email
        <span className="h-px flex-1 bg-ink-100" />
      </div>

      {mode === "signup" && (
        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-ink-800">
            Company name
          </label>
          <input
            id="company"
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
            className="w-full rounded-xl border border-ink-200 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-800">
          Work email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-xl border border-ink-200 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-800">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
          className="w-full rounded-xl border border-ink-200 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(107_43_247/0.35)] transition hover:bg-violet-700 disabled:opacity-60"
      >
        {busy ? "One moment…" : mode === "signup" ? "Create free account" : "Log in"}
      </button>

      {mode === "signup" && (
        <p className="text-center text-xs leading-relaxed text-ink-400">
          By signing up you agree to our terms. Free plan — no credit card required.
        </p>
      )}
    </form>
  );
}
