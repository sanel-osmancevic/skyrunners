// Čitanje spiska trka iz HTML-a stranica trka.rs/events/. Ako trka.rs promeni izgled, menja se ovaj fajl.

export type TrkaEvent = {
  id: string;
  name: string;
  /** Prvi i poslednji dan trke, "YYYY-MM-DD". */
  start: string;
  end: string;
  location: string;
  url: string;
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? match;
    const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return n <= 0x10ffff ? String.fromCodePoint(n) : match;
  });
}

export const clean = (html: string) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

const toISO = (dayMonthYear: string) => dayMonthYear.split("/").reverse().join("-");

/** Dozvoljeni su samo http(s) linkovi; sve drugo vodi na početnu izvora. */
function safeUrl(href: string, base: string) {
  try {
    const url = new URL(decode(href), base);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : base;
  } catch {
    return base;
  }
}

/** Jedna distanca u okviru trke; distanceKm je null ako na trka.rs nema upotrebljivu vrednost. */
export type TrkaRace = { id: string; name: string; distanceKm: number | null };

export function parseEvents(html: string, baseUrl: string): TrkaEvent[] {
  return html
    .split('class="event-list-item"')
    .slice(1)
    .flatMap((card) => {
      const id = card.match(/data-id="(\d+)"/)?.[1];
      const name = clean(card.match(/<h5 class="card-title[^"]*">([\s\S]*?)<\/h5>/)?.[1] ?? "");
      const date = card.match(
        /bi-calendar-event[^>]*><\/i>\s*(\d{2}\/\d{2}\/\d{4})(?:\s*-\s*(\d{2}\/\d{2}\/\d{4}))?/,
      );
      if (!id || !name || !date) return [];

      const start = toISO(date[1]);
      const end = date[2] ? toISO(date[2]) : start;
      return [
        {
          id,
          name,
          start,
          end: end > start ? end : start,
          location: clean(card.match(/bi-geo-alt-fill[\s\S]*?title="([^"]*)"/)?.[1] ?? ""),
          url: safeUrl(card.match(/<a\s+href="([^"]+)"[^>]*class="stretched-link"/)?.[1] ?? "", baseUrl),
        },
      ];
    });
}

export function parseKm(text: string) {
  const match = clean(text).match(/^(\d+(?:[.,]\d+)?)\s*(km|m)$/i);
  if (!match) return null;
  const km = Number(match[1].replace(",", ".")) / (match[2].toLowerCase() === "m" ? 1000 : 1);
  // Na izvoru ima i grešaka (npr. 6700 km) – takve vrednosti član upisuje sam.
  return km > 0 && km <= 1000 ? km : null;
}

/** Spisak distanci sa stranice jedne trke (trka.rs/events/<id>-<naziv>/). */
export function parseEventRaces(html: string): TrkaRace[] {
  const start = html.indexOf('id="race-list"');
  if (start < 0) return [];
  const pattern =
    /href="\/races\/(\d+)-[^"]*"[\s\S]*?race-distance[^>]*>([\s\S]*?)<\/span>[\s\S]*?race-name[^>]*>([\s\S]*?)<\/span>/g;
  return [...html.slice(start).matchAll(pattern)].map(([, id, distance, name]) => ({
    id,
    name: clean(name),
    distanceKm: parseKm(distance),
  }));
}
