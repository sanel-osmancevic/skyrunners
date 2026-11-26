import Link from "next/link";
import { requireMember } from "@/lib/session";
import Header from "@/components/Header";
import MemberForm from "@/components/MemberForm";
import ResetOnLeave from "@/components/ResetOnLeave";

// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

export default async function IzmenaPage() {
  const { user, profile: p } = await requireMember();

  const initial: Record<string, string> = {
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth.toISOString().slice(0, 10),
    gender: p.gender,
    phone: p.phone,
    city: p.city,
    address: p.address ?? "",
  };

  return (
    <>
      <Header name={user.name} image={user.image} active="profil" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/" className="text-sm text-brand hover:underline">← Nazad na početnu</Link>
        <h1 className="mt-2 mb-8 text-2xl font-bold text-brand">Izmena podataka</h1>
        <ResetOnLeave>
          <MemberForm initial={initial} submitLabel="Sačuvaj izmene" />
        </ResetOnLeave>
      </main>
    </>
  );
}
