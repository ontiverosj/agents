"use client";

import { useState } from "react";
import type { MemoryEntry } from "@/lib/data";

/** Editable agent memory — add, edit, and delete durable facts the agent uses on every run. */
export function MemoryEditor({ initial }: { initial: MemoryEntry[] }) {
  const [entries, setEntries] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newFact, setNewFact] = useState("");

  function saveEdit(id: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, fact: draft, source: "user", updatedAt: "just now" } : e)));
    setEditingId(null);
  }

  function addEntry() {
    if (!newFact.trim()) return;
    setEntries((prev) => [
      ...prev,
      { id: `m${Date.now()}`, fact: newFact.trim(), source: "user", updatedAt: "just now" },
    ]);
    setNewFact("");
    setAdding(false);
  }

  return (
    <div className="px-5 py-4">
      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.id} className="group rounded-xl bg-ink-50/70 p-3">
            {editingId === e.id ? (
              <div>
                <textarea
                  value={draft}
                  onChange={(ev) => setDraft(ev.target.value)}
                  rows={2}
                  autoFocus
                  className="w-full rounded-lg border border-violet-200 bg-white p-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
                <div className="mt-2 flex gap-2">
                  <button onClick={() => saveEdit(e.id)} className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg px-3 py-1 text-xs font-medium text-ink-500">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-ink-700">{e.fact}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${e.source === "learned" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"}`}>
                    {e.source === "learned" ? "Learned by agent" : "Added by you"}
                  </span>
                  <span className="text-[11px] text-ink-400">{e.updatedAt}</span>
                  <span className="ml-auto flex gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => { setEditingId(e.id); setDraft(e.fact); }}
                      className="text-[11px] font-medium text-violet-600 hover:text-violet-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))}
                      className="text-[11px] font-medium text-ink-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </span>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="mt-3">
          <textarea
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
            rows={2}
            autoFocus
            placeholder="e.g. Exclude companies headquartered outside North America."
            className="w-full rounded-lg border border-violet-200 bg-white p-2 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={addEntry} className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
              Add to memory
            </button>
            <button onClick={() => setAdding(false)} className="rounded-lg px-3 py-1 text-xs font-medium text-ink-500">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 w-full rounded-xl border border-dashed border-ink-200 py-2 text-xs font-medium text-ink-500 transition hover:border-violet-300 hover:text-violet-700"
        >
          + Add memory
        </button>
      )}
    </div>
  );
}
