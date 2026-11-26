"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Dugme koje otvara panel sa detaljima: mišem čim se pređe preko njega,
 * a klikom ili dodirom panel ostaje otvoren (zatvara ga novi klik, klik sa strane ili Esc).
 * Panel se postavlja u odnosu na najbližeg `relative` roditelja.
 */
export default function DetailsPopover({ label, children }: { label: string; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const open = hovered || pinned;

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setHovered(false);
      setPinned(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setPinned((value) => !value)}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-brand hover:bg-slate-50 aria-expanded:border-brand aria-expanded:bg-brand aria-expanded:text-white"
      >
        {label}
      </button>
      {open && (
        // Panel počinje uz dugme (razmak je njegov padding), pa miš može da pređe na detalje a da se ne zatvore.
        <div className="absolute inset-x-0 top-10 z-10 pt-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">{children}</div>
        </div>
      )}
    </div>
  );
}
