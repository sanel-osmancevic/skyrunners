"use client";

import { Fragment, useLayoutEffect, useState, type ReactNode } from "react";

/**
 * Next.js (Cache Components) čuva stanje stranica koje napustiš.
 * Ovo resetuje sadržaj (npr. formu) pri odlasku, da sledeća poseta krene iz početka.
 */
export default function ResetOnLeave({ children }: { children: ReactNode }) {
  const [instance, setInstance] = useState(0);
  useLayoutEffect(() => () => setInstance((n) => n + 1), []);
  return <Fragment key={instance}>{children}</Fragment>;
}
