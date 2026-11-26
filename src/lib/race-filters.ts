// Filteri po polu i periodu – koriste ih početna strana i dashboard.

import { GENDERS } from "@/lib/member-options";

/** Datumi trka su upisani kao ponoć po UTC, pa su i granice perioda takve. */
const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

export function yearPeriod(year: string) {
  return { gte: utc(`${year}-01-01`), lte: utc(`${year}-12-31`) };
}

/** Ispravan datum YYYY-MM-DD; za prazno i sve neispravno vraća "". */
function parseDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = utc(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) ? value : "";
}

/** Čita filtere iz adrese (?pol=&od=&do=). Bez filtera: svi polovi i tekuća godina. */
export function parseFilters(params: Record<string, string | string[] | undefined>, today: string) {
  const gender = GENDERS.find((g) => g.value === params.pol)?.value ?? "";
  let from = parseDate(params.od);
  let to = parseDate(params.do);
  if (from && to && from > to) [from, to] = [to, from];

  const year = today.slice(0, 4);
  const dated = from !== "" || to !== "";
  // Može i samo jedna granica: "od tog dana" ili "do tog dana".
  const period = dated ? { gte: from ? utc(from) : undefined, lte: to ? utc(to) : undefined } : yearPeriod(year);

  return { gender, from, to, dated, period };
}
