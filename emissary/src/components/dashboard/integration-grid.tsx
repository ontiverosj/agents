"use client";

import { useState } from "react";
import { integrations as initialIntegrations, integrationBundles } from "@/lib/data";

const brandHues: Record<string, number> = {
  gmail: 4, gsheets: 145, slack: 265, zapier: 25,
  hubspot: 16, salesforce: 205, airtable: 190, notion: 220,
};

export function IntegrationGrid() {
  const [items, setItems] = useState(initialIntegrations);

  function toggle(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)));
  }

  function connectBundle(ids: string[]) {
    setItems((prev) => prev.map((i) => (ids.includes(i.id) ? { ...i, connected: true } : i)));
  }

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {integrationBundles.map((b) => {
          const allOn = b.items.every((id) => items.find((i) => i.id === id)?.connected);
          return (
            <div key={b.id} className="flex flex-col rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
              <p className="text-sm font-semibold text-ink-950">{b.name}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-500">{b.desc}</p>
              <p className="mt-2 text-[11px] text-ink-400">
                {b.items.map((id) => items.find((i) => i.id === id)?.name).join(" + ")}
              </p>
              <button
                onClick={() => connectBundle(b.items)}
                disabled={allOn}
                className="mt-3 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:bg-emerald-500 disabled:opacity-90"
              >
                {allOn ? "✓ Stack connected" : "Connect all"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((i) => (
        <div key={i.id} className="flex flex-col rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: `linear-gradient(135deg, hsl(${brandHues[i.id]} 70% 55%), hsl(${brandHues[i.id] + 20} 65% 42%))` }}
              aria-hidden="true"
            >
              {i.name.slice(0, 2)}
            </span>
            {i.connected ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            ) : (
              <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-500">Not connected</span>
            )}
          </div>
          <h2 className="mt-3 text-sm font-semibold text-ink-950">{i.name}</h2>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-500">{i.description}</p>
          {i.connected && i.scopes && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {i.scopes.map((s) => (
                <span key={s} className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] text-ink-500">{s}</span>
              ))}
            </div>
          )}
          <button
            onClick={() => toggle(i.id)}
            className={`mt-4 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              i.connected
                ? "border border-ink-200 text-ink-600 hover:bg-ink-50"
                : "bg-violet-600 text-white hover:bg-violet-700"
            }`}
          >
            {i.connected ? "Disconnect" : "Connect"}
          </button>
        </div>
      ))}
      </div>
    </div>
  );
}
