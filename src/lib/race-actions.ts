"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { formValues, type FormState } from "@/lib/form";
import { formatKm, homeHref, todayISO } from "@/lib/race-stats";
import { getEventRaces, getStartedEvents } from "@/lib/race-events";
import { distanceSchema } from "@/lib/distance";
import { MAX_DISTANCES, OTHER_DISTANCE, clubEventId, normalizeName, sameLength } from "@/lib/club-races";

const timePart = (max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d{1,3}$/.test(v) && Number(v) <= max))
    .transform((v) => Number(v));

/** Postolje: "" (nema) ili mesto 1–3. */
const podium = z
  .enum(["", "1", "2", "3"], { error: "Izaberi postolje." })
  .transform((v) => (v === "" ? null : Number(v)));

const resultSchema = z.object({
  hours: timePart(999),
  minutes: timePart(59),
  seconds: timePart(59),
  place: podium,
  agePlace: podium,
  teamPlace: podium,
});

/** Vreme i postolje – zajedničko za unos i izmenu rezultata. */
function parseResult(raw: Record<string, string>) {
  const errors: Record<string, string[]> = {};
  const parsed = resultSchema.safeParse(raw);
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    if (fields.hours || fields.minutes || fields.seconds) {
      errors.time = ["Sati idu od 0 do 999, a minuti i sekunde od 0 do 59."];
    }
    for (const name of ["place", "agePlace", "teamPlace"] as const) {
      if (fields[name]) errors[name] = fields[name];
    }
    return { errors, data: null };
  }

  const { hours, minutes, seconds, place, agePlace, teamPlace } = parsed.data;
  const timeSeconds = hours * 3600 + minutes * 60 + seconds;
  if (timeSeconds === 0) errors.time = ["Upiši vreme za koje je trka istrčana."];
  return { errors, data: { timeSeconds, place, agePlace, teamPlace } };
}

async function findStartedEvent(eventId: string) {
  return (await getStartedEvents(todayISO())).events.find((event) => event.id === eventId);
}

const invalid = (errors: Record<string, string[]>, values: Record<string, string>): FormState => ({
  errors,
  message: "Proveri označena polja.",
  values,
});

type Entry = { eventId: string; raceId: string | null; name: string; date: Date; distanceKm: number };

/**
 * Već upisan rezultat za istu trku. Obrisana pa ponovo dodata trka (kao i ista trka sa drugog izvora)
 * ima drugi ID, pa se prepoznaje po datumu, dužini i nazivu; kod obrisane trke naziv nije važan.
 */
async function findDuplicate(userId: string, entry: Entry) {
  const results = await prisma.raceResult.findMany({
    where: { userId, OR: [{ trkaEventId: entry.eventId }, { date: entry.date }] },
  });
  const same = results.find((r) => r.trkaEventId === entry.eventId && r.trkaRaceId === entry.raceId);
  if (same) return same;

  // Rezultati sa drugim ID-jem su ovde samo oni sa istim datumom.
  const others = results.filter((r) => r.trkaEventId !== entry.eventId && sameLength(r.distanceKm, entry.distanceKm));
  if (others.length === 0) return undefined;
  const kept = new Set((await prisma.clubRace.findMany({ select: { id: true } })).map((race) => clubEventId(race.id)));
  const deleted = (id: string | null) => id !== null && id.startsWith(clubEventId("")) && !kept.has(id);
  return others.find((r) => deleted(r.trkaEventId) || normalizeName(r.name) === normalizeName(entry.name));
}

/** Dopisuje distancu ručno dodatoj trci i vraća njen ID. */
async function addClubDistance(eventId: string, distanceKm: number) {
  const raceId = eventId.slice(clubEventId("").length);
  const distance = await prisma.clubRaceDistance.upsert({
    where: { raceId_distanceKm: { raceId, distanceKm } },
    update: {},
    create: { raceId, distanceKm },
  });
  return distance.id;
}

/** Upisuje rezultat ulogovanog člana za trku izabranu iz kalendara. */
export async function addResult(eventId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireMember();
  const raw = formValues(formData);

  // Naziv, datum i distanca uzimaju se iz kalendara, ne iz forme.
  const event = await findStartedEvent(eventId);
  if (!event) return { message: "Izabrana trka trenutno nije dostupna u kalendaru.", values: raw };

  const { errors, data } = parseResult(raw);

  const races = await getEventRaces(event);
  const race = races.find((r) => r.id === raw.race);
  // Ručno dodatoj trci član može da dopiše distancu koje nema.
  const adding = event.source === "club" && raw.race === OTHER_DISTANCE;
  if (races.length > 0 && !race && !adding) errors.race = ["Izaberi distancu."];

  // Dužina se upisuje ručno kad je kalendar nema ili kad član dodaje novu distancu.
  let distanceKm = race?.distanceKm ?? null;
  if (adding || (distanceKm === null && (races.length === 0 || race))) {
    const parsed = distanceSchema.safeParse(raw.distanceKm ?? "");
    if (parsed.success) distanceKm = parsed.data;
    else errors.distanceKm = [parsed.error.issues[0].message];
  }

  if (adding && distanceKm !== null) {
    const km = distanceKm;
    const listed = races.flatMap((r) => (r.distanceKm !== null && sameLength(r.distanceKm, km) ? [r.distanceKm] : []));
    if (listed.length > 0) errors.distanceKm = [`Trka već ima distancu ${formatKm(listed[0])} km, izaberi je na spisku.`];
    else if (races.length >= MAX_DISTANCES) errors.distanceKm = [`Trka može imati najviše ${MAX_DISTANCES} distanci.`];
  }

  // Uz greške se vraćaju i distance: forma je možda otvorena bez njih ili sa drugačijim spiskom.
  if (!data || distanceKm === null || Object.keys(errors).length > 0) return { ...invalid(errors, raw), races };

  const date = new Date(`${event.start}T00:00:00Z`);
  const entry = { eventId: event.id, raceId: race?.id ?? null, name: event.name, date, distanceKm };
  const duplicate = await findDuplicate(user.id, entry);
  if (duplicate) {
    const year = duplicate.date.toISOString().slice(0, 4);
    const message = `Ova trka je već među tvojim rezultatima („${duplicate.name}”). Možeš je izmeniti na početnoj, pod ${year}. godinom.`;
    return { message, values: raw, races };
  }

  // Nova distanca se upisuje tek kada je sve ostalo ispravno.
  const trkaRaceId = adding ? await addClubDistance(event.id, distanceKm) : entry.raceId;

  await prisma.raceResult.create({
    data: {
      userId: user.id,
      trkaEventId: event.id,
      trkaRaceId,
      name: event.name,
      raceName: race?.name || null,
      date,
      distanceKm,
      ...data,
    },
  });

  revalidatePath("/", "layout");
  redirect(homeHref(event.start.slice(0, 4)));
}

/** Menja vreme i postolje. Druga trka ili distanca: brisanje pa novi unos. */
export async function updateResult(resultId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireMember();
  const raw = formValues(formData);

  const { errors, data } = parseResult(raw);
  if (!data || Object.keys(errors).length > 0) return invalid(errors, raw);

  // userId u uslovu: član može da menja samo svoje rezultate.
  const own = { id: resultId, userId: user.id };
  const result = await prisma.raceResult.findFirst({ where: own, select: { date: true } });
  const { count } = await prisma.raceResult.updateMany({ where: own, data });
  if (!result || count === 0) return { message: "Rezultat nije pronađen.", values: raw };

  revalidatePath("/", "layout");
  redirect(homeHref(result.date.toISOString().slice(0, 4)));
}

export async function deleteRace(raceId: string) {
  const { user } = await requireMember();
  await prisma.raceResult.deleteMany({ where: { id: raceId, userId: user.id } });
  revalidatePath("/", "layout");
}
