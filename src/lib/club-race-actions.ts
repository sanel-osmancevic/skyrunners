"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { formatKm, todayISO } from "@/lib/race-stats";
import { getCalendar } from "@/lib/race-events";
import { MAX_DISTANCES, canManageRace, clubEventId, normalizeName } from "@/lib/club-races";
import { distanceSchema } from "@/lib/distance";

export type ClubRaceState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  /** Trka sa istim nazivom i datumom koja je već u kalendaru. */
  existing?: { id: string; started: boolean };
};

const CHECK_FIELDS = "Proveri označena polja.";

const raceSchema = z.object({
  name: z.string().trim().min(3, "Upiši naziv trke (najmanje 3 znaka).").max(120, "Naziv može imati najviše 120 znakova."),
  date: z.iso.date("Izaberi datum održavanja.").refine((d) => d >= "2000-01-01" && d <= "2100-12-31", "Proveri godinu."),
  location: z.string().trim().max(80, "Mesto može imati najviše 80 znakova."),
});

const midnight = (date: string) => new Date(`${date}T00:00:00Z`);

/** Podaci iz forme; `data` je null ako ima grešaka. `id` distance je prazan za novu. */
function parseRace(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "");
  const errors: Record<string, string[] | undefined> = {};
  const parsed = raceSchema.safeParse({ name: text("name"), date: text("date"), location: text("location") });
  if (!parsed.success) Object.assign(errors, z.flattenError(parsed.error).fieldErrors);

  const ids = formData.getAll("distanceId").map(String);
  const typed = formData
    .getAll("distance")
    .map((value, index) => ({ id: ids[index] ?? "", value: String(value).trim() }))
    .filter((row) => row.value);
  const rows: { id: string; km: number }[] = [];
  for (const { id, value } of typed) {
    const km = distanceSchema.safeParse(value);
    if (km.success) rows.push({ id, km: km.data });
    else errors.distance = [km.error.issues[0].message];
  }
  if (typed.length === 0) errors.distance = ["Upiši bar jednu distancu."];
  else if (typed.length > MAX_DISTANCES) errors.distance = [`Najviše ${MAX_DISTANCES} distanci.`];
  else if (new Set(rows.map((row) => row.km)).size < rows.length) errors.distance = ["Ista distanca je upisana dva puta."];

  const data = parsed.success && Object.keys(errors).length === 0 ? { ...parsed.data, rows } : null;
  return { errors, data };
}

/** Trka sa istim nazivom i datumom, osim one koja se upravo menja. */
async function findSame(name: string, date: string, exceptId?: string) {
  const { events } = await getCalendar();
  return events.find((e) => e.id !== exceptId && e.start === date && normalizeName(e.name) === normalizeName(name));
}

/** Dodaje trku koje nema u kalendaru, da je koriste svi članovi. */
export async function addClubRace(_prev: ClubRaceState, formData: FormData): Promise<ClubRaceState> {
  const { user } = await requireMember();
  const { errors, data } = parseRace(formData);
  if (!data) return { errors, message: CHECK_FIELDS };

  const { name, date, location, rows } = data;
  const same = await findSame(name, date);
  const started = date <= todayISO();

  let eventId: string;
  if (same && same.source !== "club") {
    return { message: "Ta trka je već u kalendaru.", existing: { id: same.id, started } };
  } else if (same) {
    // Već ju je dodao neki član: dopisuju se samo nove distance.
    eventId = same.id;
    const raceId = same.id.slice(clubEventId("").length);
    const known = new Set(same.races?.map((race) => race.distanceKm));
    const added = rows.filter((row) => !known.has(row.km));
    if (known.size + added.length > MAX_DISTANCES) return { message: `Trka može imati najviše ${MAX_DISTANCES} distanci.` };
    await prisma.clubRaceDistance.createMany({ data: added.map((row) => ({ raceId, distanceKm: row.km })) });
  } else {
    const race = await prisma.clubRace.create({
      data: {
        name,
        date: midnight(date),
        location: location || null,
        createdById: user.id,
        distances: { create: rows.map((row) => ({ distanceKm: row.km })) },
      },
    });
    eventId = clubEventId(race.id);
  }

  revalidatePath("/", "layout");
  // Održana trka: odmah na upis rezultata. Predstojeća: u kalendar na njen mesec.
  redirect(started ? `/trke/nova?dogadjaj=${eventId}` : `/kalendar?mesec=${date.slice(0, 7)}`);
}

/** Ispravka ručno dodate trke; važi i za rezultate koji su za nju već upisani. */
export async function updateClubRace(raceId: string, _prev: ClubRaceState, formData: FormData): Promise<ClubRaceState> {
  const { user } = await requireMember();
  const race = await prisma.clubRace.findUnique({ where: { id: raceId }, include: { distances: true } });
  if (!race || !canManageRace(user, race)) return { message: "Ovu trku može da menja samo član koji ju je dodao." };

  const { errors, data } = parseRace(formData);
  if (!data) return { errors, message: CHECK_FIELDS };
  const { name, date, location } = data;
  const eventId = clubEventId(raceId);
  if (await findSame(name, date, eventId)) return { message: "Trka sa tim nazivom i datumom je već u kalendaru." };

  // Svaki postojeći ID sme da se pojavi jednom; sve ostalo je nova distanca.
  const unused = new Set(race.distances.map((d) => d.id));
  const rows = data.rows.map((row) => ({ km: row.km, id: unused.delete(row.id) ? row.id : undefined }));

  const results = await prisma.raceResult.findMany({ where: { trkaEventId: eventId }, select: { trkaRaceId: true } });
  const blocked = race.distances.find((d) => unused.has(d.id) && results.some((r) => r.trkaRaceId === d.id));
  if (blocked) {
    errors.distance = [
      `Distanca ${formatKm(blocked.distanceKm)} km ima upisan rezultat, pa se ne može ukloniti. Možeš da joj ispraviš dužinu.`,
    ];
  }
  if (results.length > 0 && date > todayISO()) {
    errors.date = ["Za ovu trku već postoje rezultati, pa datum ne može biti u budućnosti."];
  }
  if (Object.keys(errors).length > 0) return { errors, message: CHECK_FIELDS };

  const day = midnight(date);
  await prisma.$transaction([
    prisma.clubRace.update({ where: { id: raceId }, data: { name, date: day, location: location || null } }),
    // Distance se upisuju iznova (sa istim ID-jevima), da zamena dužina ne udari u jedinstvenost.
    prisma.clubRaceDistance.deleteMany({ where: { raceId } }),
    prisma.clubRaceDistance.createMany({ data: rows.map((row) => ({ id: row.id, raceId, distanceKm: row.km })) }),
    prisma.raceResult.updateMany({ where: { trkaEventId: eventId }, data: { name, date: day } }),
    ...rows
      .filter((row) => row.id)
      .map((row) =>
        prisma.raceResult.updateMany({ where: { trkaEventId: eventId, trkaRaceId: row.id }, data: { distanceKm: row.km } }),
      ),
  ]);

  revalidatePath("/", "layout");
  redirect("/trke/rucno");
}

/** Uklanja trku iz kalendara. Upisani rezultati ostaju: imaju svoj naziv, datum i distancu. */
export async function deleteClubRace(raceId: string) {
  const { user } = await requireMember();
  await prisma.clubRace.deleteMany({
    where: { id: raceId, ...(user.role === "ADMIN" ? {} : { createdById: user.id }) },
  });
  revalidatePath("/", "layout");
  redirect("/trke/rucno");
}
