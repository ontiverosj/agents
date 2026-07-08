"use client";

import { useState } from "react";
import { integrations as builtIns, integrationBundles } from "@/lib/data";
import { useWorkspace, workspace, type CustomConnection } from "@/lib/workspace";

const brandHues: Record<string, number> = {
  gmail: 4, gsheets: 145, slack: 265, zapier: 25,
  hubspot: 16, salesforce: 205, airtable: 190, notion: 220,
};

export function IntegrationGrid() {
  const ws = useWorkspace();

  // demo defaults + user toggles from the workspace store
  const items = builtIns.map((i) => ({
    ...i,
    connected: i.connected || ws.connectedIntegrations.includes(i.id),
  }));

  function toggle(id: string, on: boolean) {
    workspace.setIntegration(id, on);
  }

  return (
    <div>
      <CustomConnections />

      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink-950">One-tap stacks</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {integrationBundles.map((b) => {
          const allOn = b.items.every((id) => items.find((i) => i.id === id)?.connected);
          return (
            <div key={b.id} className="flex flex-col rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
              <p className="text-sm font-semibold text-ink-950">{b.name}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-500">{b.desc}</p>
              <p className="mt-2 text-[11px] text-ink-400">
                {b.items.map((id) => builtIns.find((i) => i.id === id)?.name).join(" + ")}
              </p>
              <button
                onClick={() => b.items.forEach((id) => toggle(id, true))}
                disabled={allOn}
                className="mt-3 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:bg-emerald-500 disabled:opacity-90"
              >
                {allOn ? "✓ Stack connected" : "Connect all"}
              </button>
            </div>
          );
        })}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink-950">Built-in integrations</h2>
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
            <h3 className="mt-3 text-sm font-semibold text-ink-950">{i.name}</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-500">{i.description}</p>
            {i.connected && i.scopes && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {i.scopes.map((s) => (
                  <span key={s} className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] text-ink-500">{s}</span>
                ))}
              </div>
            )}
            <button
              onClick={() => toggle(i.id, !i.connected)}
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

/** User-added MCP servers and REST APIs, with a live reachability check. */
function CustomConnections() {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"mcp" | "rest">("mcp");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!name.trim() || !url.trim()) return;
    setBusy(true);
    setError(null);
    let status: CustomConnection["status"] = "unverified";
    try {
      const res = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.status === 400) {
        setError(data.error);
        setBusy(false);
        return;
      }
      status = data.ok ? "reachable" : "unreachable";
    } catch {
      status = "unverified";
    }
    workspace.addConnection({
      id: `conn-${Date.now().toString(36)}`,
      name: name.trim(),
      kind,
      url: url.trim(),
      hasSecret: secret.trim().length > 0,
      status,
      addedAt: "just now",
    });
    setName(""); setUrl(""); setSecret(""); setOpen(false); setBusy(false);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-950">Your API & MCP connections</h2>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
        >
          {open ? "Cancel" : "+ Add connection"}
        </button>
      </div>

      {open && (
        <div className="mb-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-card">
          <div className="flex gap-2">
            {(["mcp", "rest"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${kind === k ? "bg-ink-950 text-white" : "border border-ink-200 text-ink-600"}`}
              >
                {k === "mcp" ? "MCP server" : "REST API"}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "mcp" ? "e.g. Linear MCP" : "e.g. Load-board API"}
              className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={kind === "mcp" ? "https://mcp.example.com/mcp" : "https://api.example.com/v1"}
              className="rounded-xl border border-ink-200 px-4 py-2.5 font-mono text-xs focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            type="password"
            placeholder="API key / bearer token (optional — stored in the encrypted vault in production)"
            className="mt-3 w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={add}
            disabled={busy || !name.trim() || !url.trim()}
            className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40"
          >
            {busy ? "Testing endpoint…" : "Test & add"}
          </button>
        </div>
      )}

      {ws.connections.length === 0 && !open ? (
        <p className="rounded-2xl border border-dashed border-ink-200 px-5 py-6 text-center text-sm text-ink-400">
          No custom connections yet. Add any MCP server or REST API your agents need — the
          Architect will reference them when it designs teams.
        </p>
      ) : (
        <div className="space-y-2">
          {ws.connections.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
              <span className="rounded-md bg-ink-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-500">
                {c.kind}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{c.name}</p>
                <p className="truncate font-mono text-[11px] text-ink-400">{c.url}</p>
              </div>
              {c.hasSecret && <span className="text-[11px] text-ink-400">🔒 key set</span>}
              {c.status === "reachable" ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Reachable
                </span>
              ) : c.status === "unreachable" ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">Unreachable</span>
              ) : (
                <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-500">Unverified</span>
              )}
              <button
                onClick={() => workspace.removeConnection(c.id)}
                className="text-xs font-medium text-ink-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
