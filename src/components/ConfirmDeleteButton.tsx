"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { rowButtonCls } from "@/components/form-ui";

const halfCls = "flex flex-1 cursor-pointer items-center justify-center transition hover:brightness-110 disabled:opacity-60";

/** Brisanje u dva koraka: „Obriši”, pa se na dugmetu bira ✕ (ne) ili ✓ (obriši). `action` je server akcija. */
export default function ConfirmDeleteButton({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  useLayoutEffect(() => () => setConfirming(false), []);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`${rowButtonCls} bg-red-600`}>
        Obriši
      </button>
    );
  }

  return (
    // Iste mere kao „Obriši”, pa se ništa ne pomera.
    <span className="inline-flex gap-px overflow-hidden rounded-lg text-white shadow-sm">
      <button
        type="button"
        aria-label="Ne briši"
        title="Ne briši"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className={`${halfCls} bg-slate-500`}
      >
        <Icon path="M6 6l12 12M18 6 6 18" />
      </button>
      <button
        type="button"
        aria-label="Potvrdi brisanje"
        title="Potvrdi brisanje"
        disabled={pending}
        // Drugi klik duplog klika (detail > 1) se zanemaruje, da se ništa ne obriše slučajno.
        onClick={(e) => e.detail < 2 && startTransition(() => action())}
        className={`${halfCls} bg-red-600`}
      >
        {pending ? "…" : <Icon path="M5 13l4 4L19 7" />}
      </button>
    </span>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 sm:h-4 sm:w-4"
    >
      <path d={path} />
    </svg>
  );
}
