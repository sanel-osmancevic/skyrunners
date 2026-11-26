import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { canManageRace } from "@/lib/club-races";
import Header from "@/components/Header";
import ClubRaceForm from "@/components/ClubRaceForm";
import ResetOnLeave from "@/components/ResetOnLeave";

// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

export default async function IzmenaRucneTrkePage({ params }: PageProps<"/trke/rucno/[id]/izmena">) {
  const { user } = await requireMember();
  const { id } = await params;

  // Tuđa trka se tretira kao nepostojeća.
  const race = await prisma.clubRace.findUnique({
    where: { id },
    include: { distances: { orderBy: { distanceKm: "desc" } } },
  });
  if (!race || !canManageRace(user, race)) notFound();

  return (
    <>
      <Header name={user.name} image={user.image} active="kalendar" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/trke/rucno" className="text-sm text-brand hover:underline">← Nazad na dodate trke</Link>
        <h1 className="mt-2 mb-2 text-2xl font-bold text-brand">Izmena trke</h1>
        <p className="mb-6 text-sm text-slate-600">Ispravka naziva, datuma i dužine važi i za već upisane rezultate.</p>
        <ResetOnLeave key={race.id}>
          <ClubRaceForm
            race={{
              id: race.id,
              name: race.name,
              date: race.date.toISOString().slice(0, 10),
              location: race.location ?? "",
              distances: race.distances.map((d) => ({ id: d.id, km: d.distanceKm })),
            }}
          />
        </ResetOnLeave>
      </main>
    </>
  );
}
