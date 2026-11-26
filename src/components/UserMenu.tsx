"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** Slika i ime člana – klik na njih otvara podmeni. */
  trigger: ReactNode;
  /** Stavke podmenija. */
  children: ReactNode;
  /** Istaknuto dok je otvorena stranica iz podmenija. */
  current?: boolean;
};

/** Podmeni uz ime u zaglavlju. Zatvaraju ga izbor stavke, klik sa strane i Esc. */
export default function UserMenu({ trigger, children, current }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Next čuva stanje napuštenih stranica, a meni treba uvek da krene zatvoren.
  useLayoutEffect(() => () => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`group flex max-w-full cursor-pointer items-center gap-2 rounded-full py-0.5 pr-3 pl-0.5 hover:bg-white/10 aria-expanded:bg-white/15 ${current ? "bg-white/15" : ""}`}
      >
        {trigger}
        <span aria-hidden className="text-xs text-white/70">▾</span>
      </button>
      {/* Stavke ostaju u stranici i kad je meni zatvoren, da forma za odjavu stigne da se pošalje. */}
      <div
        hidden={!open}
        onClick={() => setOpen(false)}
        className="absolute top-full right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-slate-700 shadow-lg"
      >
        {children}
      </div>
    </div>
  );
}
