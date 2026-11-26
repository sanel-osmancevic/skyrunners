"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GENDERS } from "@/lib/member-options";
import { formValues, type FormState } from "@/lib/form";

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-/()]{6,20}$/, "Unesi ispravan broj telefona (npr. +381 64 123 4567).");

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Najviše ${max} karaktera.`)
    .transform((v) => (v === "" ? null : v));

const values = <T extends readonly { value: string }[]>(list: T) =>
  list.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

const schema = z.object({
  firstName: z.string().trim().min(2, "Unesi ime.").max(50),
  lastName: z.string().trim().min(2, "Unesi prezime.").max(50),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Unesi datum rođenja.")
    .transform((v) => new Date(`${v}T00:00:00Z`))
    .refine((d) => {
      const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 10 && age <= 100;
    }, "Datum rođenja nije ispravan."),
  gender: z.enum(values(GENDERS), { error: "Izaberi pol." }),
  phone,
  city: z.string().trim().min(2, "Unesi grad.").max(80),
  address: optional(150),
});

/** Čuva (kreira ili menja) podatke ulogovanog člana. */
export async function saveMemberProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const raw = formValues(formData);

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: z.flattenError(parsed.error).fieldErrors,
      message: "Proveri označena polja.",
      values: raw,
    };
  }

  const data = parsed.data;

  await prisma.$transaction([
    prisma.memberProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { name: `${data.firstName} ${data.lastName}` },
    }),
  ]);

  revalidatePath("/", "layout");
  redirect("/");
}
