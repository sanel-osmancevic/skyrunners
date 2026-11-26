import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Header from "@/components/Header";
import MemberForm from "@/components/MemberForm";

// Forma koja se prikazuje posle prvog logovanja (dok član nema MemberProfile).
// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
  if (existing) redirect("/");

  // Ime i prezime predlažemo iz Google naloga.
  const [firstName = "", ...rest] = (user.name ?? "").trim().split(/\s+/);

  return (
    <>
      <Header name={user.name} image={user.image} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-brand">Dobrodošao/la u Spartak SkyRunners!</h1>
        <p className="mt-2 mb-8 text-slate-600">
          Pre nego što nastaviš, popuni osnovne podatke o sebi. Polja označena sa{" "}
          <span className="text-red-600">*</span> su obavezna.
        </p>
        <MemberForm initial={{ firstName, lastName: rest.join(" ") }} submitLabel="Sačuvaj i nastavi" />
      </main>
    </>
  );
}
