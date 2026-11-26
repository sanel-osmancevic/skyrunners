"use client";

import { useState, type ReactNode } from "react";

/** Na telefonu su filteri skupljeni iza dugmeta koje pokazuje šta je izabrano; na širem ekranu su uvek otvoreni. */
export default function FilterPanel({ summary, children }: { summary: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 sm:mb-6">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm sm:hidden"
      >
        <span className="min-w-0">
          <span className="font-semibold text-brand">Filteri</span>
          <span className="text-slate-500"> · {summary}</span>
        </span>
        <span aria-hidden className="text-brand">
          {open ? "▴" : "▾"}
        </span>
      </button>
      <div className={open ? "max-sm:mt-2" : "max-sm:hidden"}>{children}</div>
    </div>
  );
}
