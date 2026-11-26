import "server-only";
import { cacheLife } from "next/cache";
import { FIRST_SEASON, todayISO, yearRange } from "@/lib/race-stats";
import { parseRuntraceEventPage, parseRuntraceEvents } from "@/lib/runtrace-parse";
import { parseKm, type TrkaEvent, type TrkaRace } from "@/lib/trka-rs-parse";

// NAPOMENA: uslovi na runtrace.net zabranjuju kopiranje i distribuciju sadržaja bez zvanične dozvole
// agencije BalkanIQ. Pribaviti je pre javnog objavljivanja sajta.
export const RUNTRACE_URL = "https://runtrace.net";

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "ClubRaceCalendar/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

/** Predstojeće trke i održane od prve sezone (tokom nje i iz godine pre). Keširano na najviše 6 sati. */
export async function getRuntraceEvents(): Promise<TrkaEvent[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 6 * 60 * 60, expire: 7 * 24 * 60 * 60 });

  const year = Number(todayISO().slice(0, 4));
  const passed = (y: number) => `${RUNTRACE_URL}/?filters%5Byear%5D=${y}&filters%5Bstatus%5D=passed`;
  const years = yearRange(Math.min(FIRST_SEASON, year - 1), year);
  const pages = await Promise.all([`${RUNTRACE_URL}/`, ...years.map(passed)].map(fetchHtml));

  const events = pages.flatMap((html) => parseRuntraceEvents(html, RUNTRACE_URL));
  // Prazan spisak znači da se stranica promenila – greška se ne kešira.
  if (events.length === 0) throw new Error("runtrace.net: nijedna trka nije prepoznata");
  return [...new Map(events.map((event) => [event.id, event])).values()];
}

async function getEventPageRaces(url: string, eventName: string): Promise<TrkaRace[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 12 * 60 * 60, expire: 7 * 24 * 60 * 60 });

  const { options, distanceKm } = parseRuntraceEventPage(await fetchHtml(url));
  if (options.length === 0) return distanceKm === null ? [] : [{ id: "0", name: eventName, distanceKm }];

  return Promise.all(
    options.slice(0, 12).map(async ({ id, name, selected }) => {
      // Dužina iz naziva ("13 km") ili sa stranice te distance.
      let km = selected ? distanceKm : parseKm(name);
      if (km === null && !selected) {
        km = parseRuntraceEventPage(await fetchHtml(`${url}?race_id=${id}`)).distanceKm;
      }
      return { id, name, distanceKm: km };
    }),
  );
}

/** Distance jedne trke; prazan spisak ako ih trenutno nije moguće pročitati. */
export async function getRuntraceRaces(event: TrkaEvent): Promise<TrkaRace[]> {
  if (!event.url.startsWith(`${RUNTRACE_URL}/`)) return [];
  try {
    return await getEventPageRaces(event.url, event.name);
  } catch (error) {
    console.error("Preuzimanje distanci nije uspelo:", error);
    return [];
  }
}
