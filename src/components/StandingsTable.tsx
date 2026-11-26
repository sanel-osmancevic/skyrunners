"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import CompetitorRow, { cellCls, shadeCls, type Standing } from "@/components/CompetitorRow";

type NumberKey = "races" | "km" | "total" | "gold" | "silver" | "bronze";
type SortKey = "name" | NumberKey;
type Sort = { key: SortKey; dir: "asc" | "desc" };

const subHeadCls = "px-1 pt-1 pb-3 text-right text-[11px] max-[359px]:px-0.5 sm:px-3 sm:text-xs";
const DEFAULT_SORT: Sort = { key: "km", dir: "desc" };

const VALUES: Record<NumberKey, (row: Standing) => number> = {
  races: (row) => row.stats.races,
  km: (row) => row.stats.km,
  total: (row) => row.stats.podiums.total,
  gold: (row) => row.stats.podiums.gold,
  silver: (row) => row.stats.podiums.silver,
  bronze: (row) => row.stats.podiums.bronze,
};

const fullName = (row: Standing) => `${row.firstName} ${row.lastName}`;
const compareNames = (a: Standing, b: Standing) => fullName(a).localeCompare(fullName(b), "sr-Latn");

/** Za iste vrednosti u izabranoj koloni: više kilometara, pa postolja (ukupno, 1, 2, 3. mesta), pa ime. */
function compareDefault(a: Standing, b: Standing) {
  for (const key of ["km", "total", "gold", "silver", "bronze"] as const) {
    const difference = VALUES[key](b) - VALUES[key](a);
    if (difference !== 0) return difference;
  }
  return compareNames(a, b);
}

function sortRows(rows: Standing[], { key, dir }: Sort) {
  return [...rows].sort((a, b) => {
    const ascending = key === "name" ? compareNames(a, b) : VALUES[key](a) - VALUES[key](b);
    return (dir === "asc" ? ascending : -ascending) || compareDefault(a, b);
  });
}

type Props = {
  rows: Standing[];
  /** Menja se sa filterima, pa se otvoreni detalji tada zatvaraju. */
  filterKey: string;
};

/** Tabela uspeha: klik na naslov kolone sortira po njoj, ponovni klik menja smer. */
export default function StandingsTable({ rows, filterKey }: Props) {
  const [sort, setSort] = useState(DEFAULT_SORT);
  // Posle povratka na stranicu ponovo važi početni poredak.
  useLayoutEffect(() => () => setSort(DEFAULT_SORT), []);

  // Prvi klik: imena od A, brojevi od najvećeg.
  const onSort = (key: SortKey) =>
    setSort((current) => {
      if (current.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" };
      return { key, dir: key === "name" ? "asc" : "desc" };
    });

  const column = { sort, onSort };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Na telefonu sitnije, da sve kolone stanu bez pomeranja u stranu. */}
      <table className="w-full text-xs min-[360px]:text-[13px] sm:text-sm">
        <thead className="border-b border-slate-200 text-left text-slate-500">
          <tr>
            <th rowSpan={2} className={`${cellCls} font-medium`}>#</th>
            <SortHeader {...column} by="name" title="ime" rowSpan={2} className={cellCls}>
              Takmičar
            </SortHeader>
            <SortHeader {...column} by="races" title="broj trka" rowSpan={2} className={`${cellCls} ${shadeCls} text-right`}>
              Trke
            </SortHeader>
            <SortHeader {...column} by="km" title="kilometri" rowSpan={2} className={`${cellCls} text-right`}>
              Km
            </SortHeader>
            <th colSpan={4} className="px-1 pt-3 text-center font-medium sm:px-3">
              Postolja
            </th>
          </tr>
          <tr>
            <SortHeader {...column} by="total" title="ukupno postolja" className={`${subHeadCls} ${shadeCls}`}>
              Ukupno
            </SortHeader>
            <SortHeader {...column} by="gold" title="prva mesta" className={subHeadCls}>
              🥇
            </SortHeader>
            <SortHeader {...column} by="silver" title="druga mesta" className={`${subHeadCls} ${shadeCls}`}>
              🥈
            </SortHeader>
            <SortHeader {...column} by="bronze" title="treća mesta" className={subHeadCls}>
              🥉
            </SortHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortRows(rows, sort).map((row, index) => (
            <CompetitorRow key={`${row.userId}|${filterKey}`} row={row} rank={index + 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type HeaderProps = {
  by: SortKey;
  title: string;
  sort: Sort;
  onSort: (key: SortKey) => void;
  className: string;
  rowSpan?: number;
  children: ReactNode;
};

function SortHeader({ by, title, sort, onSort, className, rowSpan, children }: HeaderProps) {
  const active = sort.key === by;
  return (
    <th rowSpan={rowSpan} className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
      <button
        type="button"
        onClick={() => onSort(by)}
        title={`Sortiraj: ${title}`}
        className={`relative -mx-0.5 -my-2 cursor-pointer px-0.5 py-2 hover:text-brand ${active ? "font-bold text-brand" : "font-medium"}`}
      >
        {children}
        {/* Strelica je ispod naslova, da ne širi kolonu na telefonu. */}
        {active && (
          <span aria-hidden className="absolute top-[calc(100%-0.5rem)] left-1/2 -translate-x-1/2 text-[8px] leading-tight">
            {sort.dir === "asc" ? "▲" : "▼"}
          </span>
        )}
      </button>
    </th>
  );
}
