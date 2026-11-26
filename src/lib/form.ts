// Zajedničko za forme koje se šalju server akcijama.

import type { TrkaRace } from "@/lib/trka-rs-parse";

export type FormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  values?: Record<string, string>;
  /** Unos rezultata: distance koje je server našao pri proveri. */
  races?: TrkaRace[];
};

/** Tekstualna polja forme kao običan objekat (bez internih $ACTION polja). */
export function formValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}
