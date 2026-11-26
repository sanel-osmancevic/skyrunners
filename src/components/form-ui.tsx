import type { ReactNode } from "react";

// Na telefonu 16 px: manji tekst u polju natera iPhone da uveća stranicu.
export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none sm:text-sm transition focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-500";

export const submitCls =
  "rounded-lg bg-accent px-6 py-3 font-semibold text-white shadow transition hover:brightness-110 disabled:opacity-60 max-sm:w-full";

/** Dugme uz stavku u spisku; boja se dodaje pored (npr. bg-red-600), a veličinu zadaje `RowActions`. */
export const rowButtonCls =
  "inline-flex cursor-pointer items-center justify-center rounded-lg text-sm font-semibold text-white shadow-sm transition hover:brightness-110";

/** Dugmad stavke: na telefonu ispod nje, preko cele širine i viša (za prst); na širem ekranu mala, sa strane. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="grid w-full grid-cols-2 gap-2 *:h-11 sm:flex sm:w-auto sm:*:h-8 sm:*:w-20">{children}</div>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-brand">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  required,
  wide,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}
