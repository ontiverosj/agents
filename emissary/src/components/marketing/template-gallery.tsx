"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { templates, templateCategories } from "@/lib/data";

export function TemplateGallery() {
  const [category, setCategory] = useState("All");
  const filtered = category === "All" ? templates : templates.filter((t) => t.category === category);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {templateCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              category === c
                ? "bg-ink-950 text-white"
                : "border border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-950"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className="flex flex-col p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600">{t.category}</span>
              {t.popular && (
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">Popular</span>
              )}
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink-950">{t.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{t.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.outputs.map((o) => (
                <span key={o} className="rounded-md bg-ink-50 px-2 py-1 text-xs text-ink-500">{o}</span>
              ))}
            </div>
            <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-400">
              Saves ~{Math.round(t.estMinutesSaved / 60)} hrs per run vs. manual work
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
