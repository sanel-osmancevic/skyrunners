import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKm } from "@/lib/race-stats";
import { formatDay } from "@/lib/calendar";
import { clubEventId } from "@/lib/club-races";
import { deleteClubRace } from "@/lib/club-race-actions";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { RowActions, rowButtonCls } from "@/components/form-ui";

/** Ručno dodate trke koje član sme da menja i briše (administrator sve). */
export default async function ManagedRaceList({ user }: { user: { id: string; role: string } }) {
  const admin = user.role === "ADMIN";
  const races = await prisma.clubRace.findMany({
    where: admin ? undefined : { createdById: user.id },
    include: { distances: { orderBy: { distanceKm: "desc" } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  if (races.length === 0) return null;

  const counts = await prisma.raceResult.groupBy({
    by: ["trkaEventId"],
    where: { trkaEventId: { in: races.map((race) => clubEventId(race.id)) } },
    _count: true,
  });
  const results = new Map(counts.map((c) => [c.trkaEventId, c._count]));

  return (
    <section className="mt-12">
      <h2 className="mb-1 text-lg font-semibold text-brand">{admin ? "Ručno dodate trke" : "Tvoje dodate trke"}</h2>
      <p className="mb-4 text-sm text-slate-500">
        Izmena važi i za već upisane rezultate. Posle brisanja trke upisani rezultati ostaju.
      </p>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {races.map((race) => (
          <li key={race.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
            <div className="min-w-0">
              <p className="font-medium break-words">{race.name}</p>
              <p className="text-sm text-slate-500">
                {[
                  formatDay(race.date.toISOString().slice(0, 10)),
                  race.location,
                  race.distances.map((d) => `${formatKm(d.distanceKm)} km`).join(", "),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-xs text-slate-400">Upisanih rezultata: {results.get(clubEventId(race.id)) ?? 0}</p>
            </div>
            <RowActions>
              <Link href={`/trke/rucno/${race.id}/izmena`} className={`${rowButtonCls} bg-blue-600`}>
                Izmeni
              </Link>
              <ConfirmDeleteButton action={deleteClubRace.bind(null, race.id)} />
            </RowActions>
          </li>
        ))}
      </ul>
    </section>
  );
}
