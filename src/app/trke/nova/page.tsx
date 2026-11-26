import Link from "next/link";
import { requireMember } from "@/lib/session";
import { todayISO } from "@/lib/race-stats";
import { formatPeriod, monthTitle } from "@/lib/calendar";
import { getEventRaces, getStartedEvents } from "@/lib/race-events";
import { canManageRace, clubEventId } from "@/lib/club-races";
import Header from "@/components/Header";
import RacePicker from "@/components/RacePicker";
import ResultForm from "@/components/ResultForm";
import ResetOnLeave from "@/components/ResetOnLeave";

// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

// Dva koraka: izbor trke iz kalendara, pa distanca, vreme i postolje.
export default async function NovaTrkaPage({ searchParams }: PageProps<"/trke/nova">) {
  const { user } = await requireMember();
  const { dogadjaj } = await searchParams;
  const { events, unavailable } = await getStartedEvents(todayISO());
  const selected = events.find((event) => event.id === dogadjaj);
  const races = selected ? await getEventRaces(selected) : [];

  return (
    <>
      <Header name={user.name} image={user.image} active="home" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href={selected ? "/trke/nova" : "/"} className="text-sm text-brand hover:underline">
          {selected ? "← Izaberi drugu trku" : "← Nazad na početnu"}
        </Link>
        <h1 className="mt-2 mb-6 text-2xl font-bold text-brand">Dodaj trku</h1>

        {unavailable.length > 0 && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Trke sa izvora {unavailable.join(" i ")} trenutno nisu dostupne. Pokušaj ponovo kasnije.
          </p>
        )}

        {!selected ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">Izaberi iz kalendara trku koju želiš da upišeš.</p>
              <Link
                href="/trke/rucno"
                className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand hover:text-white"
              >
                Nema tvoje trke? Dodaj je
              </Link>
            </div>
            <RacePicker
              events={events.map((event) => ({
                id: event.id,
                name: event.name,
                location: event.location,
                date: formatPeriod(event.start, event.end),
                month: monthTitle(event.start.slice(0, 7)),
              }))}
            />
          </>
        ) : (
          <>
            <div className="mb-8 rounded-xl border-l-4 border-accent bg-white px-5 py-4 shadow-sm">
              <p className="text-lg font-semibold break-words text-brand">{selected.name}</p>
              <p className="text-sm text-slate-500">
                {formatPeriod(selected.start, selected.end)}
                {selected.location && ` · ${selected.location}`}
              </p>
              {selected.url && (
                <a href={selected.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
                  Stranica trke
                </a>
              )}
              {selected.source === "club" && canManageRace(user, selected) && (
                <Link
                  href={`/trke/rucno/${selected.id.slice(clubEventId("").length)}/izmena`}
                  className="text-sm text-accent hover:underline"
                >
                  Izmeni trku
                </Link>
              )}
            </div>
            <ResetOnLeave key={selected.id}>
              <ResultForm
                target={{ eventId: selected.id, races, canAddDistance: selected.source === "club" }}
                submitLabel="Sačuvaj rezultat"
              />
            </ResetOnLeave>
          </>
        )}
      </main>
    </>
  );
}
