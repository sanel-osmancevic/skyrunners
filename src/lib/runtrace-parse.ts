// Čitanje trka sa runtrace.net. Ako runtrace.net promeni izgled, menja se ovaj fajl.

import { clean, parseKm, type TrkaEvent } from "@/lib/trka-rs-parse";

/** runtrace.net vrste koje nisu trčanje: 5 plivanje, 6 bicikl. */
const SKIPPED_TYPES = new Set(["5", "6"]);

/** Spisak trka sa naslovne strane runtrace.net (i one koje se prikazuju tek skrolovanjem). */
export function parseRuntraceEvents(html: string, baseUrl: string): TrkaEvent[] {
  return html
    .split('class="grid__item js-event_thumb')
    .slice(1)
    .flatMap((card) => {
      const slug = card.match(/data-slug_event="([A-Za-z0-9_-]+)"/)?.[1];
      const name = clean(card.match(/data-title="([^"]*)"/)?.[1] ?? "");
      const type = card.match(/data-type="(\d*)"/)?.[1] ?? "";
      const date = card.match(/class="race-date">\s*(\d{2})\.(\d{2})\.(\d{4})/);
      if (!slug || !name || !date || SKIPPED_TYPES.has(type)) return [];

      const day = `${date[3]}-${date[2]}-${date[1]}`;
      return [
        {
          id: `rt-${slug}`,
          name,
          start: day,
          end: day,
          location: clean(card.match(/class="race-location">[\s\S]*?<span>([\s\S]*?)<\/span>/)?.[1] ?? ""),
          url: `${baseUrl}/${slug}`,
        },
      ];
    });
}

/**
 * Sa stranice jedne trke: spisak distanci za izbor i dužina one koja je prikazana
 * (runtrace.net na jednoj stranici prikazuje dužinu samo izabrane distance).
 */
export function parseRuntraceEventPage(html: string) {
  const select = html.match(/<select[^>]*id="race-filter"[^>]*>([\s\S]*?)<\/select>/)?.[1] ?? "";
  const options = [...select.matchAll(/<option\s+value="(\d+)"([^>]*)>([\s\S]*?)<\/option>/g)].map(
    ([, id, attributes, name]) => ({ id, name: clean(name), selected: attributes.includes("selected") }),
  );
  const distanceKm = parseKm(html.match(/class="distance-in">([\s\S]*?)<\/div>/)?.[1] ?? "");
  return { options, distanceKm };
}
