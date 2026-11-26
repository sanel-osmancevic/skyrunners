// Ručno dodate trke – zajednička pravila.

/** Najviše distanci po ručno dodatoj trci. */
export const MAX_DISTANCES = 15;

/** Vrednost izbora „Druga distanca” u formi za upis rezultata. */
export const OTHER_DISTANCE = "other";

/** Za poređenje naziva trka: bez velikih slova, kvačica i znakova. */
export const normalizeName = (name: string) =>
  name.toLocaleLowerCase("sr").replace(/đ/g, "dj").normalize("NFD").replace(/[^\p{Letter}\p{Number}]/gu, "");

/** Ista dužina i kad je jednom upisana kao 42, a drugi put kao 42,195 km (razlika do 2%). */
export const sameLength = (a: number, b: number) => Math.abs(a - b) <= 0.02 * Math.max(a, b);

/** ID ručno dodate trke u kalendaru (RaceResult.trkaEventId). */
export const clubEventId = (raceId: string) => `club-${raceId}`;

/** Trku menja i briše član koji ju je dodao, ili administrator. */
export function canManageRace(user: { id: string; role: string }, race: { createdById?: string | null }) {
  return user.role === "ADMIN" || race.createdById === user.id;
}
