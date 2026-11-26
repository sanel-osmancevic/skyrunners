import "server-only";
import { prisma } from "@/lib/prisma";
import { RUNTRACE_URL, getRuntraceEvents, getRuntraceRaces } from "@/lib/runtrace";
import { TRKA_URL, getTrkaEvents, getTrkaRaces } from "@/lib/trka-rs";
import type { TrkaEvent, TrkaRace } from "@/lib/trka-rs-parse";

export const SOURCES = {
  trka: { name: "trka.rs", url: TRKA_URL },
  runtrace: { name: "runtrace.net", url: RUNTRACE_URL },
  club: { name: "trke koje su dodali članovi", url: null },
} as const;

export type RaceEvent = TrkaEvent & {
  source: keyof typeof SOURCES;
  /** Distance poznate već iz spiska (ručno dodate trke); za ostale se čitaju sa stranice trke. */
  races?: TrkaRace[];
  /** Ko je dodao ručnu trku. */
  createdById?: string | null;
};

/** Trke koje su članovi dodali ručno. Nemaju stranicu (url je prazan). */
async function getClubEvents(): Promise<RaceEvent[]> {
  const races = await prisma.clubRace.findMany({ include: { distances: { orderBy: { distanceKm: "desc" } } } });
  return races.map((race) => {
    const day = race.date.toISOString().slice(0, 10);
    return {
      id: `club-${race.id}`,
      name: race.name,
      start: day,
      end: day,
      location: race.location ?? "",
      url: "",
      source: "club",
      createdById: race.createdById,
      // Bez naziva distance: prikazuje se samo dužina.
      races: race.distances.map((d) => ({ id: d.id, name: "", distanceKm: d.distanceKm })),
    };
  });
}

/** Trke iz svih izvora po datumu. Nedostupan izvor se preskače i navodi u `unavailable`. */
export async function getCalendar() {
  const loaders = {
    trka: async (): Promise<RaceEvent[]> => (await getTrkaEvents()).map((event) => ({ ...event, source: "trka" })),
    runtrace: async (): Promise<RaceEvent[]> =>
      (await getRuntraceEvents()).map((event) => ({ ...event, source: "runtrace" })),
    club: getClubEvents,
  };
  const keys = Object.keys(loaders) as (keyof typeof loaders)[];
  const results = await Promise.allSettled(keys.map((key) => loaders[key]()));

  const events: RaceEvent[] = [];
  const unavailable: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") events.push(...result.value);
    else {
      console.error(`Preuzimanje trka nije uspelo (${SOURCES[keys[index]].name}):`, result.reason);
      unavailable.push(SOURCES[keys[index]].name);
    }
  });

  events.sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name, "sr"));
  return { events, unavailable };
}

/** Trke koje su već počele – samo za njih može da se unese rezultat. Najnovije prve. */
export async function getStartedEvents(today: string) {
  const { events, unavailable } = await getCalendar();
  return { events: events.filter((event) => event.start <= today).reverse(), unavailable };
}

/** Distance jedne trke; prazan spisak znači da dužinu član upisuje sam. */
export async function getEventRaces(event: RaceEvent): Promise<TrkaRace[]> {
  if (event.races) return event.races;
  return event.source === "runtrace" ? getRuntraceRaces(event) : getTrkaRaces(event);
}
