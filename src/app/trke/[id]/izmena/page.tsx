import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { formatKm, homeHref } from "@/lib/race-stats";
import { formatDay } from "@/lib/calendar";
import Header from "@/components/Header";
import ResultForm from "@/components/ResultForm";
import ResetOnLeave from "@/components/ResetOnLeave";

// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

export default async function IzmenaTrkePage({ params }: PageProps<"/trke/[id]/izmena">) {
  const { user } = await requireMember();
  const { id } = await params;

  // Tuđi rezultat se tretira kao nepostojeći.
  const result = await prisma.raceResult.findFirst({ where: { id, userId: user.id } });
  if (!result) notFound();

  const time = result.timeSeconds;
  const podium = (place: number | null) => (place !== null && place <= 3 ? String(place) : "");
  const initial: Record<string, string> = {
    hours: time === null ? "" : String(Math.floor(time / 3600)),
    minutes: time === null ? "" : String(Math.floor(time / 60) % 60),
    seconds: time === null ? "" : String(time % 60),
    place: podium(result.place),
    agePlace: podium(result.agePlace),
    teamPlace: podium(result.teamPlace),
  };

  return (
    <>
      <Header name={user.name} image={user.image} active="home" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href={homeHref(result.date.toISOString().slice(0, 4))} className="text-sm text-brand hover:underline">
          ← Nazad na početnu
        </Link>
        <h1 className="mt-2 mb-6 text-2xl font-bold text-brand">Izmena rezultata</h1>

        <div className="mb-8 rounded-xl border-l-4 border-accent bg-white px-5 py-4 shadow-sm">
          <p className="text-lg font-semibold break-words text-brand">{result.name}</p>
          <p className="text-sm text-slate-500">
            {formatDay(result.date.toISOString().slice(0, 10))} · {formatKm(result.distanceKm)} km
            {result.raceName && result.raceName !== result.name && ` · ${result.raceName}`}
          </p>
          <p className="mt-1 text-xs text-slate-400">Za drugu trku ili distancu obriši ovaj rezultat i dodaj novi.</p>
        </div>

        <ResetOnLeave>
          <ResultForm target={{ resultId: result.id }} initial={initial} submitLabel="Sačuvaj izmene" />
        </ResetOnLeave>
      </main>
    </>
  );
}
