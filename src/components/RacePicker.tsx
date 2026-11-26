"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export type PickerEvent = { id: string; name: string; location: string; date: string; month: string };

/** Pretraga bez kvačica: "nocni" nalazi "Noćni". */
const normalize = (text: string) =>
  text.toLocaleLowerCase("sr").replace(/đ/g, "dj").normalize("NFD").replace(/\p{Diacritic}/gu, "");

/** Spisak trka iz kalendara, grupisan po mesecima, sa pretragom. */
export default function RacePicker({ events }: { events: PickerEvent[] }) {
  const [query, setQuery] = useState("");
  const top = useRef<HTMLDivElement>(null);
  const needle = normalize(query.trim());
  const found = events.filter((e) => normalize(`${e.name} ${e.location}`).includes(needle));

  const months = new Map<string, PickerEvent[]>();
  for (const event of found) {
    months.set(event.month, [...(months.get(event.month) ?? []), event]);
  }

  return (
    <>
      <div ref={top} />
      {/* Na telefonu pretraga ostaje na vrhu dok se skroluje kroz dugačak spisak. */}
      <div className="max-sm:sticky max-sm:top-0 max-sm:z-10 max-sm:-mx-4 max-sm:bg-background/85 max-sm:px-4 max-sm:backdrop-blur-sm max-sm:py-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Kucanje sa sredine spiska vraća na prve pronađene trke.
            if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView();
          }}
          placeholder="Pretraži po nazivu ili mestu…"
          aria-label="Pretraga trka"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 sm:text-sm"
        />
      </div>

      {found.length === 0 && <p className="mt-6 text-center text-sm text-slate-500">Nema trka za ovu pretragu. Ako je trka nema, dodaj je dugmetom iznad.</p>}

      {[...months].map(([month, list]) => (
        <section key={month} className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand">{month}</h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {list.map((event) => (
              <li key={event.id}>
                <Link href={`/trke/nova?dogadjaj=${event.id}`} className="block px-5 py-3 hover:bg-orange-50">
                  <p className="font-medium break-words">{event.name}</p>
                  <p className="text-sm text-slate-500">
                    {event.date}
                    {event.location && ` · ${event.location}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
