"use client";

import { useLayoutEffect, useState } from "react";
import { formatKm, type summarize } from "@/lib/race-stats";
import { GENDERS, labelOf } from "@/lib/member-options";
import PodiumTable from "@/components/PodiumTable";

export type Standing = {
  userId: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string | null;
  /** Red prijavljenog člana. */
  own: boolean;
  stats: ReturnType<typeof summarize>;
};

export const cellCls = "px-1 py-3 max-[359px]:px-0.5 sm:px-3";
/** Svaka druga kolona je osenčena, da se kolone lakše razlikuju. */
export const shadeCls = "bg-slate-900/5";
const numberCls = `${cellCls} text-right tabular-nums`;

/** Boja tačke pored imena po polu. */
const GENDER_DOTS: Record<string, string> = { M: "bg-blue-500", Z: "bg-pink-400" };

/** Red tabele uspeha; „Detaljnije” ispod njega otvara postolja po vrsti. */
export default function CompetitorRow({ row, rank }: { row: Standing; rank: number }) {
  const { firstName, lastName, gender, image, own, stats } = row;
  const [open, setOpen] = useState(false);
  // Dugo prezime sme da se prelomi kod crtice; tačka za pol ostaje uz poslednji deo.
  const lastNameParts = lastName.split(/(?<=[- ])/);
  const lastPart = lastNameParts.pop();
  // Next čuva stanje napuštenih stranica, a detalji treba uvek da krenu zatvoreni.
  useLayoutEffect(() => () => setOpen(false), []);

  return (
    <>
      <tr className={`${own ? "bg-orange-50" : ""} ${open ? "border-b-0" : ""}`}>
        <td className={`${cellCls} text-slate-400`}>{rank}</td>
        <td className={cellCls}>
          <div className="flex items-center gap-3">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="hidden h-9 w-9 rounded-full sm:block" referrerPolicy="no-referrer" />
            ) : (
              <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-brand sm:flex">
                {firstName[0]}
              </span>
            )}
            <div>
              <p className="font-medium">
                {firstName} {lastNameParts.join("")}
                {/* Tačka se ne prelama sama u novi red, već zajedno sa prezimenom. */}
                <span className="whitespace-nowrap">
                  {lastPart}
                  <span
                    role="img"
                    aria-label={labelOf(GENDERS, gender)}
                    title={labelOf(GENDERS, gender)}
                    className={`ml-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle ${GENDER_DOTS[gender] ?? "bg-slate-300"}`}
                  />
                </span>
              </p>
              {stats.podiums.total > 0 && (
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpen((value) => !value)}
                  className="cursor-pointer py-1 text-xs font-medium whitespace-nowrap text-brand underline underline-offset-2"
                >
                  {open ? "Sakrij ▴" : "Detaljnije ▾"}
                </button>
              )}
            </div>
          </div>
        </td>
        <td className={`${numberCls} ${shadeCls}`}>{stats.races}</td>
        <td className={`${numberCls} font-semibold`}>{formatKm(stats.km)}</td>
        <td className={`${numberCls} ${shadeCls} font-semibold`}>{stats.podiums.total}</td>
        <td className={numberCls}>{stats.podiums.gold}</td>
        <td className={`${numberCls} ${shadeCls}`}>{stats.podiums.silver}</td>
        <td className={numberCls}>{stats.podiums.bronze}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="bg-slate-50 px-3 py-3 sm:px-4">
            <div className="max-w-md">
              <PodiumTable individual={stats.individual} age={stats.age} team={stats.team} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
