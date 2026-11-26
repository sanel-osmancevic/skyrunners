import "server-only";
import { cacheLife } from "next/cache";
import { FIRST_SEASON, todayISO, yearRange } from "@/lib/race-stats";
import { parseEventRaces, parseEvents, type TrkaEvent, type TrkaRace } from "@/lib/trka-rs-parse";

// NAPOMENA: uslovi korišćenja trka.rs (https://trka.rs/terms/) traže izričitu dozvolu
// za korišćenje sadržaja. Pribaviti je pre javnog objavljivanja sajta.
export const TRKA_URL = "https://trka.rs";

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "ClubRaceCalendar/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

const fetchEvents = async (path: string) => parseEvents(await fetchHtml(`${TRKA_URL}${path}`), TRKA_URL);

/** Predstojeće trke sa trka.rs i održane od prve sezone. Keširano: izvor se osvežava najviše na 6 sati. */
export async function getTrkaEvents(): Promise<TrkaEvent[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 6 * 60 * 60, expire: 7 * 24 * 60 * 60 });

  const year = Number(todayISO().slice(0, 4));
  // Spisak /events/past/ daje samo tekuću godinu; ranije se čitaju iz arhive (?year=).
  const archive = yearRange(FIRST_SEASON, year - 1).map((y) => `/events/past/?year=${y}`);
  const lists = await Promise.all([...archive, "/events/past/", "/events/"].map(fetchEvents));

  // Ista trka može biti u više spiskova – ostaje jedna po ID-u.
  const events = [...new Map(lists.flat().map((event) => [event.id, event])).values()];
  // Prazan spisak znači da se stranica promenila – greška se ne kešira.
  if (events.length === 0) throw new Error("trka.rs: nijedna trka nije prepoznata");

  return events.sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name, "sr"));
}

async function getEventPageRaces(url: string): Promise<TrkaRace[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 12 * 60 * 60, expire: 7 * 24 * 60 * 60 });
  return parseEventRaces(await fetchHtml(url));
}

/**
 * Distance jedne trke. Prazan spisak: trka.rs je nema (spoljna prijava) ili stranica trenutno nije dostupna.
 * Adresa mora doći iz spiska sa trka.rs, nikad od korisnika.
 */
export async function getTrkaRaces(event: TrkaEvent): Promise<TrkaRace[]> {
  if (!event.url.startsWith(`${TRKA_URL}/events/`)) return [];
  try {
    return await getEventPageRaces(event.url);
  } catch (error) {
    console.error("Preuzimanje distanci nije uspelo:", error);
    return [];
  }
}
