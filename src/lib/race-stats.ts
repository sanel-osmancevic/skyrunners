// Sumarni podaci o trkama – koriste ih početna strana i dashboard.

export const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function countPodiums(places: (number | null)[]) {
  const count = (wanted: number) => places.filter((place) => place === wanted).length;
  const gold = count(1);
  const silver = count(2);
  const bronze = count(3);
  return { gold, silver, bronze, total: gold + silver + bronze };
}

export type Podiums = ReturnType<typeof countPodiums>;

type Places = { place: number | null; agePlace: number | null; teamPlace: number | null };

/** Postolje je plasman 1, 2 ili 3. Individualna, AGE i timska postolja broje se odvojeno i ukupno. */
export function summarize(races: ({ distanceKm: number } & Places)[]) {
  const individual = races.map((race) => race.place);
  const age = races.map((race) => race.agePlace);
  const team = races.map((race) => race.teamPlace);
  return {
    races: races.length,
    km: races.reduce((sum, race) => sum + race.distanceKm, 0),
    individual: countPodiums(individual),
    age: countPodiums(age),
    team: countPodiums(team),
    podiums: countPodiums([...individual, ...age, ...team]),
  };
}

export function formatKm(km: number) {
  return km.toLocaleString("sr-Latn-RS", { maximumFractionDigits: 1 });
}

/** Vreme trke: "45:30" ili "1:45:30". */
export function formatTime(totalSeconds: number) {
  const two = (n: number) => String(n).padStart(2, "0");
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = two(totalSeconds % 60);
  return hours > 0 ? `${hours}:${two(minutes)}:${seconds}` : `${minutes}:${seconds}`;
}

/** Adresa početne sa rezultatima te godine: tekuća je "/", ostale "/?godina=2025". */
export const homeHref = (year: string) => (year === todayISO().slice(0, 4) ? "/" : `/?godina=${year}`);

/** Prva godina čije održane trke ostaju u kalendaru i pošto ona prođe. */
export const FIRST_SEASON = 2026;

/** Sve godine od `from` do `to`, obe uključene; prazno ako je `from` posle `to`. */
export const yearRange = (from: number, to: number) =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/** Današnji datum (YYYY-MM-DD) po lokalnom vremenu kluba. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade" }).format(new Date());
}
