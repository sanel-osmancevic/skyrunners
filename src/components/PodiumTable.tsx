import type { Podiums } from "@/lib/race-stats";

type Props = { individual: Podiums; age: Podiums; team: Podiums };

/** Detalji postolja: po vrsti (individualna, AGE, timska) i po mestima. */
export default function PodiumTable({ individual, age, team }: Props) {
  const rows = [
    { label: "Individualna", podiums: individual },
    { label: "AGE kategorija", podiums: age },
    { label: "Timska", podiums: team },
  ];
  return (
    <table className="w-full text-sm">
      <thead className="text-slate-500">
        <tr>
          <th className="pb-2 text-left font-medium">Kategorija</th>
          <th className="w-9 pb-2 font-medium" title="Prva mesta">🥇</th>
          <th className="w-9 pb-2 font-medium" title="Druga mesta">🥈</th>
          <th className="w-9 pb-2 font-medium" title="Treća mesta">🥉</th>
          <th className="pb-2 text-right font-medium">Ukupno</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 border-t border-slate-100 text-center tabular-nums">
        {rows.map(({ label, podiums }) => (
          <tr key={label}>
            <th className="py-1.5 pr-2 text-left font-normal">{label}</th>
            <td>{podiums.gold}</td>
            <td>{podiums.silver}</td>
            <td>{podiums.bronze}</td>
            <td className="text-right font-semibold text-brand">{podiums.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
