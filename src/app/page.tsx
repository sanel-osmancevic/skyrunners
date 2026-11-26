import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { yearPeriod } from "@/lib/race-filters";
import { MEDALS, formatKm, formatTime, homeHref, summarize, todayISO } from "@/lib/race-stats";
import Header from "@/components/Header";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { deleteRace } from "@/lib/race-actions";
import { RowActions, rowButtonCls } from "@/components/form-ui";
import DetailsPopover from "@/components/DetailsPopover";
import PodiumTable from "@/components/PodiumTable";
import ResetOnLeave from "@/components/ResetOnLeave";

// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

// Početna posle prijave: sumarni podaci i spisak trka ulogovanog takmičara za jednu godinu (podrazumevano tekuću).
export default async function Home({ searchParams }: PageProps<"/">) {
  const { user, profile } = await requireMember();
  const { godina } = await searchParams;
  const currentYear = todayISO().slice(0, 4);
  // Biraju se tekuća godina i one za koje član ima rezultate.
  const dates = await prisma.raceResult.findMany({ where: { userId: user.id }, select: { date: true } });
  const years = [...new Set([currentYear, ...dates.map((r) => r.date.toISOString().slice(0, 4))])].sort().reverse();
  const year = years.find((y) => y === godina) ?? currentYear;
  const races = await prisma.raceResult.findMany({
    where: { userId: user.id, date: yearPeriod(year) },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const stats = summarize(races);

  return (
    <>
      <Header name={user.name} image={user.image} active="home" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-brand">Zdravo, {profile.firstName}!</h1>
        <p className="mt-1 mb-4 text-sm text-slate-500">Tvoji rezultati u {year}. godini.</p>

        {years.length > 1 && (
          <nav aria-label="Godina" className="mb-4 flex flex-wrap gap-2">
            {years.map((y) => (
              <Link
                key={y}
                href={homeHref(y)}
                scroll={false}
                aria-current={y === year ? "page" : undefined}
                className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-brand hover:bg-slate-50 aria-[current=page]:border-brand aria-[current=page]:bg-brand aria-[current=page]:text-white"
              >
                {y}.
              </Link>
            ))}
          </nav>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Istrčane trke" value={stats.races} />
          <Stat label="Kilometri" value={formatKm(stats.km)} />
          <PodiumStat stats={stats} />
        </div>

        <div className="mt-10 mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand">Moje trke</h2>
          <Link
            href="/trke/nova"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
          >
            + Dodaj trku
          </Link>
        </div>

        {races.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
            Još nemaš unetih trka u {year}. godini. Dodaj prvu i prati svoje kilometre i postolja.
          </p>
        ) : (
          // Na telefonu je svaka trka zasebna kartica, a na širem ekranu red u zajedničkom spisku.
          <ul className="max-sm:space-y-3 sm:divide-y sm:divide-slate-100 sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:shadow-sm">
            {races.map((race) => (
              <li
                key={race.id}
                className="flex flex-col gap-3 p-4 max-sm:rounded-xl max-sm:border max-sm:border-slate-200 max-sm:bg-white max-sm:shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-medium break-words">{race.name}</p>
                  {race.raceName && race.raceName !== race.name && (
                    <p className="text-sm break-words text-slate-600">{race.raceName}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    {race.date.toLocaleDateString("sr-Latn-RS", { timeZone: "UTC" })} · {formatKm(race.distanceKm)} km
                    {race.timeSeconds !== null && (
                      <>
                        {" "}
                        · <span className="font-semibold text-brand">⏱ {formatTime(race.timeSeconds)}</span>
                      </>
                    )}
                  </p>
                  {(race.place !== null || race.agePlace !== null || race.teamPlace !== null) && (
                    <p className="mt-1 flex flex-wrap gap-2 text-xs">
                      <PodiumBadge label="Individualno" place={race.place} />
                      <PodiumBadge label="AGE kategorija" place={race.agePlace} />
                      <PodiumBadge label="Timski" place={race.teamPlace} />
                    </p>
                  )}
                </div>
                <RowActions>
                  <Link href={`/trke/${race.id}/izmena`} className={`${rowButtonCls} bg-blue-600`}>
                    Izmeni
                  </Link>
                  <ConfirmDeleteButton action={deleteRace.bind(null, race.id)} />
                </RowActions>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

const cardCls = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={`${cardCls} flex flex-col`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-auto pt-1 text-3xl font-bold text-brand">{value}</p>
    </div>
  );
}

/** Kartica postolja: ukupno i po mestima; „Detaljnije” pokazuje u kojoj su kategoriji. */
function PodiumStat({ stats }: { stats: ReturnType<typeof summarize> }) {
  const total = stats.podiums;
  const summary = [
    { label: "Ukupno", value: total.total },
    { label: "🥇 1. mesto", value: total.gold },
    { label: "🥈 2. mesto", value: total.silver },
    { label: "🥉 3. mesto", value: total.bronze },
  ];
  return (
    <div className={`${cardCls} relative col-span-2 flex flex-col`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Postolja</p>
        <ResetOnLeave>
          <DetailsPopover label="Detaljnije">
            <PodiumTable individual={stats.individual} age={stats.age} team={stats.team} />
          </DetailsPopover>
        </ResetOnLeave>
      </div>
      <dl className="mt-auto grid grid-cols-4 pt-1 text-center max-[374px]:-mx-2">
        {summary.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse justify-end">
            <dt className="text-xs whitespace-nowrap text-slate-500 max-[374px]:text-[11px]">{label}</dt>
            <dd className="text-3xl font-bold text-brand">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PodiumBadge({ label, place }: { label: string; place: number | null }) {
  if (place === null) return null;
  return (
    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-brand">
      {MEDALS[place]} {label}: {place}. mesto
    </span>
  );
}
