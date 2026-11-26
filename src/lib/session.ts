import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Sesija za tekući zahtev (uvek se renderuje u trenutku zahteva). */
export async function getSession() {
  await connection();
  return auth();
}

/** Ulogovan korisnik ili redirect na /login. */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/** Ulogovan član sa popunjenim podacima ili redirect na /login odnosno /onboarding. */
export async function requireMember() {
  const user = await requireUser();
  const profile = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding");
  return { user, profile };
}
