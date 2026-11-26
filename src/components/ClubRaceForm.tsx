"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { addClubRace, updateClubRace, type ClubRaceState } from "@/lib/club-race-actions";
import { Field, Section, inputCls, submitCls } from "@/components/form-ui";

export type EditableRace = {
  id: string;
  name: string;
  /** "YYYY-MM-DD" */
  date: string;
  location: string;
  distances: { id: string; km: number }[];
};

/** Ručni unos trke koje nema u kalendaru, ili izmena već dodate (`race`). */
export default function ClubRaceForm({ race }: { race?: EditableRace }) {
  const action = race ? updateClubRace.bind(null, race.id) : addClubRace;
  const [state, formAction, pending] = useActionState<ClubRaceState, FormData>(action, {});
  // Svaka distanca ima svoj ključ, da brisanje jedne ne pomeri upisane vrednosti.
  const [rows, setRows] = useState(() =>
    race?.distances.length
      ? race.distances.map((d, key) => ({ key, id: d.id, value: String(d.km).replace(".", ",") }))
      : [{ key: 0, id: "", value: "" }],
  );
  const err = (name: string) => state.errors?.[name]?.[0];

  // Ručni submit da React ne resetuje formu kada server vrati greške.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {state.message && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}{" "}
          {state.existing?.started && (
            <Link href={`/trke/nova?dogadjaj=${state.existing.id}`} className="font-semibold underline">
              Upiši rezultat za nju
            </Link>
          )}
        </p>
      )}

      <Section title="Trka">
        <Field label="Naziv trke" name="name" error={err("name")} required wide>
          <input id="name" name="name" maxLength={120} defaultValue={race?.name} className={inputCls} aria-invalid={!!err("name")} />
        </Field>
        <Field label="Datum održavanja" name="date" error={err("date")} required>
          <input id="date" name="date" type="date" defaultValue={race?.date} className={inputCls} aria-invalid={!!err("date")} />
        </Field>
        <Field label="Mesto" name="location" error={err("location")}>
          <input
            id="location"
            name="location"
            maxLength={80}
            defaultValue={race?.location}
            className={inputCls}
            aria-invalid={!!err("location")}
          />
        </Field>
      </Section>

      <Section title="Distance">
        <div className="space-y-2 sm:col-span-2">
          {rows.map((row, index) => (
            <div key={row.key} className="flex items-center gap-2">
              <input type="hidden" name="distanceId" value={row.id} />
              <input
                name="distance"
                inputMode="decimal"
                defaultValue={row.value}
                aria-label={`Distanca ${index + 1} (km)`}
                placeholder="npr. 21,1"
                className={`${inputCls} max-w-40`}
                aria-invalid={!!err("distance")}
              />
              <span className="text-sm text-slate-500">km</span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((list) => list.filter((r) => r.key !== row.key))}
                  className="cursor-pointer px-2 text-sm text-red-600 hover:underline"
                >
                  Ukloni
                </button>
              )}
            </div>
          ))}
          {err("distance") && <p className="text-xs text-red-600">{err("distance")}</p>}
          <button
            type="button"
            onClick={() => setRows((list) => [...list, { key: Math.max(...list.map((r) => r.key)) + 1, id: "", value: "" }])}
            className="cursor-pointer text-sm font-medium text-brand hover:underline"
          >
            + Još jedna distanca
          </button>
        </div>
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={submitCls}>
          {pending ? "Čuvam…" : race ? "Sačuvaj izmene" : "Dodaj trku u kalendar"}
        </button>
      </div>
    </form>
  );
}
