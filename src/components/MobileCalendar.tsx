"use client";

import { useState, type ReactNode } from "react";

export type MobileDay = {
  day: string;
  number: number;
  /** "Subota, 14. novembar" */
  title: string;
  inMonth: boolean;
  today: boolean;
  /** Po jedna klasa boje za svaku trku tog dana. */
  dots: string[];
};

export type MobileEvent = {
  id: string;
  start: string;
  end: string;
  startTitle: string;
  inMonth: boolean;
  /** Red u spisku, pripremljen na serveru. */
  row: ReactNode;
};

/** Koliko tačkica stane u kockicu; ostale trke se pišu kao „+2”. */
const DOTS = 3;

/** Kalendar za telefon: dodir na dan prikazuje njegove trke, a bez izbora je ispod ceo mesec po danima. */
export default function MobileCalendar({
  weekdays,
  days,
  events,
  legend,
}: {
  weekdays: string[];
  days: MobileDay[];
  /** Trke iz vidljivih dana, poređane po datumu. */
  events: MobileEvent[];
  legend: ReactNode;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = days.find((d) => d.day === selected);

  const groups: { key: string; title: string; events: MobileEvent[] }[] = [];
  if (chosen) {
    const onDay = events.filter((e) => e.start <= chosen.day && chosen.day <= e.end);
    groups.push({ key: chosen.day, title: chosen.title, events: onDay });
  } else {
    // Ceo mesec: trka koja traje više dana stoji samo pod danom kada počinje.
    for (const event of events.filter((e) => e.inMonth)) {
      const last = groups.at(-1);
      if (last?.key === event.start) last.events.push(event);
      else groups.push({ key: event.start, title: event.startTitle, events: [event] });
    }
  }

  return (
    <div className="sm:hidden">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-medium text-slate-500">
          {weekdays.map((name) => (
            <div key={name} className="py-2">
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {days.map((d) => (
            <button
              key={d.day}
              type="button"
              data-day={d.day}
              disabled={d.dots.length === 0}
              aria-pressed={d.day === selected}
              aria-label={`${d.title}, trka: ${d.dots.length}`}
              onClick={() => setSelected(d.day === selected ? null : d.day)}
              className={`flex h-12 min-w-0 flex-col items-center gap-1 pt-1 text-sm enabled:cursor-pointer ${
                d.day === selected ? "bg-slate-100" : d.inMonth ? "bg-white" : "bg-slate-50"
              } ${d.inMonth ? "" : "text-slate-400"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  d.day === selected
                    ? "bg-brand font-semibold text-white"
                    : d.today
                      ? "bg-accent font-semibold text-white"
                      : d.dots.length > 0
                        ? "font-semibold"
                        : ""
                }`}
              >
                {d.number}
              </span>
              <span className="flex h-2 items-center gap-0.5">
                {d.dots.slice(0, DOTS).map((dot, index) => (
                  <span key={index} className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                ))}
                {d.dots.length > DOTS && (
                  <span className="text-[10px] leading-none text-slate-500">+{d.dots.length - DOTS}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">{legend}</div>

      {groups.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">U ovom mesecu nema objavljenih trka.</p>
      )}

      {groups.map((group) => (
        <section key={group.key} className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-brand">{group.title}</h3>
            {chosen && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="h-9 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-brand"
              >
                Ceo mesec
              </button>
            )}
          </div>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {group.events.map((event) => (
              <li key={event.id}>{event.row}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
