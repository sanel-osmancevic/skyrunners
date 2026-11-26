import Form from "next/form";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { summarize, todayISO } from "@/lib/race-stats";
import { parseFilters } from "@/lib/race-filters";
import { GENDERS, labelOf } from "@/lib/member-options";
import { formatDay } from "@/lib/calendar";
import Header from "@/components/Header";
import StandingsTable from "@/components/StandingsTable";
import FilterPanel from "@/components/FilterPanel";
import ResetOnLeave from "@/components/ResetOnLeave";
import { inputCls } from "@/components/form-ui";

// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

const filterCls = "min-w-0 text-sm font-medium text-slate-700";

// Sumarni podaci svih članova; red prijavljenog člana je istaknut. Lični podaci (telefon, adresa, datum rođenja…) se ne učitavaju.
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { user } = await requireMember();
  const today = todayISO();
  const { gender, from, to, dated, period } = parseFilters(await searchParams, today);
  const filtered = gender !== "" || dated;
  // Šta je izabrano – piše na dugmetu za filtere na telefonu.
  const range =
    from && to ? `${formatDay(from)} – ${formatDay(to)}` : from ? `od ${formatDay(from)}` : to ? `do ${formatDay(to)}` : "";
  const summary = `${gender ? labelOf(GENDERS, gender) : "Svi polovi"}, ${range || `${today.slice(0, 4)}.`}`;

  const members = await prisma.memberProfile.findMany({
    where: {
      gender: gender || undefined,
      // Uz izabran datum prikazuju se samo oni koji su tada trčali.
      user: dated ? { races: { some: { date: period } } } : undefined,
    },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      gender: true,
      user: {
        select: {
          image: true,
          races: { where: { date: period }, select: { distanceKm: true, place: true, agePlace: true, teamPlace: true } },
        },
      },
    },
  });

  // Redosled određuje tabela (klik na naslov kolone); početni je po kilometrima.
  const rows = members.map(({ user: member, ...profile }) => ({
    ...profile,
    image: member.image,
    own: profile.userId === user.id,
    stats: summarize(member.races),
  }));

  return (
    <>
      <Header name={user.name} image={user.image} active="dashboard" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-brand">Tabela uspeha</h1>

        <ResetOnLeave>
          {/* key: polja prate filtere iz adrese (npr. posle „Skini filtere”), a na telefonu se panel zatvara. */}
          <FilterPanel key={`${gender}|${from}|${to}`} summary={summary}>
            <Form
              action="/dashboard"
              className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <label className={`${filterCls} col-span-2 sm:col-span-1`}>
                Pol
                <select name="pol" defaultValue={gender} className={`${inputCls} mt-1 font-normal`}>
                  <option value="">Svi polovi</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={filterCls}>
                Trke od datuma
                <input type="date" name="od" defaultValue={from} className={`${inputCls} mt-1 font-normal`} />
              </label>
              <label className={filterCls}>
                Do datuma
                <input type="date" name="do" defaultValue={to} className={`${inputCls} mt-1 font-normal`} />
              </label>
              <div className="col-span-2 flex items-end gap-4 sm:col-span-1">
                <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                  Primeni
                </button>
                {filtered && (
                  <Link href="/dashboard" className="py-2 text-sm whitespace-nowrap text-brand hover:underline">
                    Skini filtere
                  </Link>
                )}
              </div>
            </Form>
          </FilterPanel>
        </ResetOnLeave>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
            {filtered ? "Nema takmičara za izabrane filtere." : "Još nema prijavljenih članova."}
          </p>
        ) : (
          <StandingsTable rows={rows} filterKey={`${gender}|${from}|${to}`} />
        )}
      </main>
    </>
  );
}
