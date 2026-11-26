import Link from "next/link";
import type { ReactNode } from "react";
import { requireMember } from "@/lib/session";
import { formatKm, todayISO } from "@/lib/race-stats";
import { WEEKDAYS, dayTitle, formatPeriod, monthDays, monthTitle, parseMonth, shiftMonth } from "@/lib/calendar";
import { SOURCES, getCalendar, type RaceEvent } from "@/lib/race-events";
import { canManageRace, clubEventId } from "@/lib/club-races";
import Header from "@/components/Header";
import MobileCalendar from "@/components/MobileCalendar";
import ResetOnLeave from "@/components/ResetOnLeave";

// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

// Na telefonu su strelice veće, za prst.
const navCls =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-brand hover:bg-slate-50 max-sm:flex max-sm:h-11 max-sm:w-11 max-sm:items-center max-sm:justify-center max-sm:text-xl";

/** Koliko se trka vidi u kockici pre dugmeta „još”. */
const VISIBLE = 3;

const STYLES: Record<RaceEvent["source"], { card: string; dot: string; legend: string }> = {
  trka: { card: "border-accent bg-orange-50", dot: "bg-accent", legend: "trka.rs" },
  runtrace: { card: "border-violet-600 bg-violet-50", dot: "bg-violet-600", legend: "runtrace.net" },
  club: { card: "border-emerald-600 bg-emerald-50", dot: "bg-emerald-600", legend: "Dodali članovi" },
};

const distances = (event: RaceEvent) =>
  event.races?.flatMap((race) => (race.distanceKm === null ? [] : `${formatKm(race.distanceKm)} km`)).join(", ") ?? "";

/** Ko gleda kalendar: od toga zavisi kuda vodi ručno dodata trka. */
type Viewer = { id: string; role: string; today: string };

/**
 * Kuda vodi trka: na stranicu izvora (nova kartica), a ručno dodata na upis rezultata.
 * Ručno dodata trka koja još nije održana vodi na izmenu samo onoga ko sme da je menja.
 */
function eventTarget(event: RaceEvent, viewer: Viewer) {
  if (event.url) return { href: event.url, external: true, hint: "stranica trke" };
  if (event.start <= viewer.today) {
    return { href: `/trke/nova?dogadjaj=${event.id}`, external: false, hint: "upiši rezultat" };
  }
  if (canManageRace(viewer, event)) {
    const href = `/trke/rucno/${event.id.slice(clubEventId("").length)}/izmena`;
    return { href, external: false, hint: "izmeni trku" };
  }
  return null;
}

function EventLink({ event, viewer, className, children }: { event: RaceEvent; viewer: Viewer; className: string; children: ReactNode }) {
  const title = [event.name, event.location, distances(event)].filter(Boolean).join(" · ");
  const target = eventTarget(event, viewer);
  if (target?.external) {
    return (
      <a href={target.href} target="_blank" rel="noopener noreferrer" title={title} className={`${className} hover:brightness-95`}>
        {children}
      </a>
    );
  }
  if (target) {
    return (
      <Link href={target.href} title={`${title} – ${target.hint}`} className={`${className} hover:brightness-95`}>
        {children}
      </Link>
    );
  }
  return (
    <div title={title} className={className}>
      {children}
    </div>
  );
}

function EventCard({ event, viewer }: { event: RaceEvent; viewer: Viewer }) {
  return (
    <li className="text-xs leading-tight">
      <EventLink event={event} viewer={viewer} className={`block rounded border-l-2 px-1 py-0.5 text-brand ${STYLES[event.source].card}`}>
        <span className="line-clamp-3 break-words">{event.name}</span>
      </EventLink>
    </li>
  );
}

/** Red u spisku na telefonu. Datum je u naslovu iznad, pa se ovde piše samo za višednevne trke. */
function MobileRow({ event, viewer }: { event: RaceEvent; viewer: Viewer }) {
  const target = eventTarget(event, viewer);
  const period = event.start === event.end ? "" : formatPeriod(event.start, event.end);
  const meta = [period, event.location, distances(event)].filter(Boolean).join(" · ");
  return (
    <EventLink event={event} viewer={viewer} className="flex items-center gap-3 px-4 py-3 text-sm">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STYLES[event.source].dot}`} />
      <span className="min-w-0 flex-1">
        <span className="block font-medium break-words">{event.name}</span>
        {meta && <span className="block text-slate-500">{meta}</span>}
        {target && !target.external && (
          <span className="mt-1 block font-medium text-accent first-letter:uppercase">{target.hint}</span>
        )}
      </span>
      {target && (
        <span aria-hidden className="shrink-0 text-lg text-slate-400">
          {target.external ? "↗" : "›"}
        </span>
      )}
    </EventLink>
  );
}

/** Šta znače boje. */
function Legend({ className }: { className: string }) {
  return (
    <ul className={`flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 ${className}`}>
      {Object.entries(STYLES).map(([source, style]) => (
        <li key={source} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {style.legend}
        </li>
      ))}
    </ul>
  );
}

export default async function KalendarPage({ searchParams }: PageProps<"/kalendar">) {
  const { user } = await requireMember();
  const params = await searchParams;

  const today = todayISO();
  const currentMonth = today.slice(0, 7);
  const month = parseMonth(params.mesec, currentMonth);
  const days = monthDays(month);
  const viewer = { id: user.id, role: user.role, today };

  const { events, unavailable } = await getCalendar();
  // Trka koja traje više dana upisuje se u svaki od njih.
  const eventsOn = (day: string) => events.filter((e) => e.start <= day && day <= e.end);
  const isInMonth = (e: RaceEvent) => e.start.slice(0, 7) <= month && month <= e.end.slice(0, 7);

  const mobileDays = days.map((day) => ({
    day,
    number: Number(day.slice(8)),
    title: dayTitle(day),
    inMonth: day.startsWith(month),
    today: day === today,
    dots: eventsOn(day).map((event) => STYLES[event.source].dot),
  }));
  const mobileEvents = events
    .filter((e) => e.start <= days[days.length - 1] && days[0] <= e.end)
    .map((event) => ({
      id: event.id,
      start: event.start,
      end: event.end,
      startTitle: dayTitle(event.start),
      inMonth: isInMonth(event),
      row: <MobileRow event={event} viewer={viewer} />,
    }));

  const href = (targetMonth: string) => `/kalendar?mesec=${targetMonth}`;

  return (
    <>
      <Header name={user.name} image={user.image} active="kalendar" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-brand">Kalendar trka</h1>
          <Link href="/trke/rucno" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110">
            + Nova trka
          </Link>
        </div>

        {unavailable.length > 0 && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Trke sa izvora {unavailable.join(" i ")} trenutno nisu dostupne. Pokušaj ponovo kasnije.
          </p>
        )}

        <div className="mb-3 flex items-center justify-between gap-2">
          <Link href={href(shiftMonth(month, -1))} scroll={false} className={navCls} aria-label="Prethodni mesec">
            ‹
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-brand">{monthTitle(month)}</h2>
            {month !== currentMonth && (
              <Link href={href(currentMonth)} scroll={false} className="text-sm text-accent hover:underline">
                Danas
              </Link>
            )}
          </div>
          <Link href={href(shiftMonth(month, 1))} scroll={false} className={navCls} aria-label="Sledeći mesec">
            ›
          </Link>
        </div>

        {/* Telefon: male kockice sa tačkicama i spisak ispod. */}
        <ResetOnLeave key={month}>
          <MobileCalendar weekdays={WEEKDAYS} days={mobileDays} events={mobileEvents} legend={<Legend className="flex" />} />
        </ResetOnLeave>

        {/* Širi ekran: nazivi trka u kockicama. */}
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:block">
          <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-medium text-slate-500">
            {WEEKDAYS.map((name) => (
              <div key={name} className="py-2">
                {name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-200">
            {days.map((day) => {
              const dayEvents = eventsOn(day);
              return (
                <div
                  key={day}
                  data-day={day}
                  className={`min-h-28 min-w-0 p-1 text-sm ${day.startsWith(month) ? "bg-white" : "bg-slate-50 text-slate-400"}`}
                >
                  <span
                    className={
                      day === today
                        ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent font-semibold text-white"
                        : "inline-block px-1"
                    }
                  >
                    {Number(day.slice(8))}
                  </span>

                  <div className="mt-1">
                    <ul className="space-y-1">
                      {dayEvents.slice(0, VISIBLE).map((event) => (
                        <EventCard key={event.id} event={event} viewer={viewer} />
                      ))}
                    </ul>
                    {dayEvents.length > VISIBLE && (
                      <details className="group mt-1">
                        <summary className="cursor-pointer list-none px-1 text-xs font-medium text-brand underline underline-offset-2">
                          <span className="group-open:hidden">Još {dayEvents.length - VISIBLE}</span>
                          <span className="hidden group-open:inline">Sakrij</span>
                        </summary>
                        <ul className="mt-1 space-y-1">
                          {dayEvents.slice(VISIBLE).map((event) => (
                            <EventCard key={event.id} event={event} viewer={viewer} />
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!events.some(isInMonth) && (
          <p className="mt-4 hidden text-center text-sm text-slate-500 sm:block">U ovom mesecu nema objavljenih trka.</p>
        )}

        <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
          <Legend className="hidden sm:flex" />
          <p className="text-slate-500">
            Izvori:{" "}
            {[SOURCES.trka, SOURCES.runtrace].map((source, index) => (
              <span key={source.name}>
                {index > 0 && ", "}
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {source.name}
                </a>
              </span>
            ))}
          </p>
        </div>
      </main>
    </>
  );
}
