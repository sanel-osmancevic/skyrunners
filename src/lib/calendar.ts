// Mesečni kalendar. Datumi su tekst "YYYY-MM-DD", mesec "YYYY-MM", nedelja počinje ponedeljkom.

export const WEEKDAYS = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

/** Mesec iz adrese; neispravna vrednost daje podrazumevani mesec. */
export function parseMonth(value: unknown, fallback: string) {
  return typeof value === "string" && /^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(value) ? value : fallback;
}

const toISO = (date: Date) => date.toISOString().slice(0, 10);

export function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  return toISO(new Date(Date.UTC(year, m - 1 + delta, 1))).slice(0, 7);
}

/** Svi dani koji se vide u mreži: cele nedelje koje pokrivaju mesec. */
export function monthDays(month: string) {
  const [year, m] = month.split("-").map(Number);
  const daysBefore = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const total = Math.ceil((daysBefore + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, i) => toISO(new Date(Date.UTC(year, m - 1, 1 - daysBefore + i))));
}

export const formatDay = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("sr-Latn-RS", { timeZone: "UTC" });

/** Datum trke; višednevna se prikazuje kao period. */
export const formatPeriod = (start: string, end: string) =>
  start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`;

/** Naslov dana: "Subota, 14. novembar". */
export function dayTitle(day: string) {
  const title = new Date(`${day}T00:00:00Z`).toLocaleDateString("sr-Latn-RS", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function monthTitle(month: string) {
  const title = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("sr-Latn-RS", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return title.charAt(0).toUpperCase() + title.slice(1);
}
