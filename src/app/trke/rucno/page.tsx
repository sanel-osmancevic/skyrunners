import Link from "next/link";
import { requireMember } from "@/lib/session";
import Header from "@/components/Header";
import ClubRaceForm from "@/components/ClubRaceForm";
import ManagedRaceList from "@/components/ManagedRaceList";
import ResetOnLeave from "@/components/ResetOnLeave";

// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

export default async function RucnaTrkaPage() {
  const { user } = await requireMember();

  return (
    <>
      <Header name={user.name} image={user.image} active="kalendar" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/trke/nova" className="text-sm text-brand hover:underline">← Nazad na izbor trke</Link>
        <h1 className="mt-2 mb-2 text-2xl font-bold text-brand">Nova trka u kalendaru</h1>
        <p className="mb-6 text-sm text-slate-600">
          Dodaj trku samo ako je nema u kalendaru. Videće je i moći da koriste svi članovi kluba.
        </p>
        <ResetOnLeave>
          <ClubRaceForm />
        </ResetOnLeave>
        <ManagedRaceList user={user} />
      </main>
    </>
  );
}
