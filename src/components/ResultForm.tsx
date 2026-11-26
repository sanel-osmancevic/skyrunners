"use client";

import { useActionState, useState, startTransition } from "react";
import { addResult, updateResult } from "@/lib/race-actions";
import type { FormState } from "@/lib/form";
import type { TrkaRace } from "@/lib/trka-rs-parse";
import { MEDALS, formatKm } from "@/lib/race-stats";
import { OTHER_DISTANCE } from "@/lib/club-races";
import { Field, Section, inputCls, submitCls } from "@/components/form-ui";

type Props = {
  /**
   * Novi rezultat: trka iz kalendara i njene distance (`canAddDistance` za ručno dodatu trku,
   * kojoj član može da dopiše distancu). Izmena: postojeći rezultat.
   */
  target: { eventId: string; races: TrkaRace[]; canAddDistance?: boolean } | { resultId: string };
  initial?: Record<string, string>;
  submitLabel: string;
};

const TIME_PARTS = [
  { name: "hours", label: "sati", max: 999 },
  { name: "minutes", label: "minuti", max: 59 },
  { name: "seconds", label: "sekunde", max: 59 },
] as const;

/** Prihvata samo cifre do zadate granice; sve ostalo se odmah vraća na prethodnu vrednost. */
function limitInput(input: HTMLInputElement, max: number) {
  if (/^\d*$/.test(input.value) && Number(input.value) <= max) input.dataset.last = input.value;
  else input.value = input.dataset.last ?? input.defaultValue;
}

const PODIUMS = [
  { name: "place", label: "Individualno postolje" },
  { name: "agePlace", label: "Postolje u AGE kategoriji" },
  { name: "teamPlace", label: "Timsko postolje" },
] as const;

const choiceCls =
  "flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-3 py-2 text-sm transition has-[:checked]:border-brand has-[:checked]:bg-brand/5";

/** Postolje na telefonu: četiri dugmeta u redu bez kružića, izabrano je obojeno. */
const segmentCls =
  "max-sm:flex-col max-sm:justify-center max-sm:gap-0.5 max-sm:px-1 max-sm:text-xs max-sm:whitespace-nowrap max-sm:has-[:checked]:bg-brand max-sm:has-[:checked]:text-white";

export default function ResultForm({ target, initial = {}, submitLabel }: Props) {
  const action = "eventId" in target ? addResult.bind(null, target.eventId) : updateResult.bind(null, target.resultId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const v = state?.values ?? initial;
  const err = (name: string) => state?.errors?.[name]?.[0];

  // Posle slanja važe distance koje je našao server; mogu se razlikovati od onih sa kojima je stranica otvorena.
  const races = "races" in target ? (state?.races ?? target.races) : null;
  const [selected, setSelected] = useState(races?.length === 1 ? races[0].id : "");
  const canAdd = "eventId" in target && target.canAddDistance === true;
  const adding = canAdd && selected === OTHER_DISTANCE;
  const needsDistance =
    races !== null && (adding || races.length === 0 || races.find((r) => r.id === selected)?.distanceKm === null);

  // Ručni submit da React ne resetuje formu kada server vrati greške.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form key={JSON.stringify(v)} onSubmit={onSubmit} noValidate className="space-y-8">
      {state?.message && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}

      {races !== null && (
        <Section title="Distanca">
          {races.length > 0 && (
            <div className="space-y-2 sm:col-span-2" role="radiogroup" aria-label="Distanca">
              {races.map((race) => (
                <label key={race.id} className={`${choiceCls} max-sm:py-3`}>
                  <input
                    type="radio"
                    name="race"
                    value={race.id}
                    checked={selected === race.id}
                    onChange={() => setSelected(race.id)}
                    className="accent-brand"
                  />
                  <span className="w-20 shrink-0 font-semibold text-brand">
                    {race.distanceKm === null ? "? km" : `${formatKm(race.distanceKm)} km`}
                  </span>
                  <span className="min-w-0 break-words text-slate-600">{race.name}</span>
                </label>
              ))}
              {canAdd && (
                <label className={`${choiceCls} max-sm:py-3`}>
                  <input
                    type="radio"
                    name="race"
                    value={OTHER_DISTANCE}
                    checked={adding}
                    onChange={() => setSelected(OTHER_DISTANCE)}
                    className="accent-brand"
                  />
                  <span className="shrink-0 font-semibold text-brand">Druga distanca</span>
                  <span className="min-w-0 text-slate-600">nema je na spisku</span>
                </label>
              )}
            </div>
          )}
          {err("race") && <p className="text-xs text-red-600 sm:col-span-2">{err("race")}</p>}
          {needsDistance && (
            <Field
              label="Dužina (km)"
              name="distanceKm"
              error={err("distanceKm")}
              hint={
                adding
                  ? "Distanca se dodaje trci, pa će je moći izabrati i drugi članovi."
                  : "U kalendaru nema dužine za ovu trku, pa je upiši ovde."
              }
              required
              wide
            >
              <input id="distanceKm" name="distanceKm" inputMode="decimal" defaultValue={v.distanceKm} placeholder="21,1" className={inputCls} aria-invalid={!!err("distanceKm")} />
            </Field>
          )}
        </Section>
      )}

      <Section title="Rezultat">
        <div className="sm:col-span-2">
          <p className="mb-1 text-sm font-medium text-slate-700">
            Vreme <span className="text-red-600">*</span>
          </p>
          <div className="flex gap-3">
            {TIME_PARTS.map((part) => (
              <label key={part.name} className="min-w-0 max-w-24 flex-1 text-xs text-slate-500">
                <input
                  id={part.name}
                  name={part.name}
                  inputMode="numeric"
                  maxLength={String(part.max).length}
                  defaultValue={v[part.name]}
                  onInput={(e) => limitInput(e.currentTarget, part.max)}
                  placeholder="0"
                  className={`${inputCls} text-center text-slate-900 max-sm:py-3 max-sm:text-xl`}
                  aria-invalid={!!err("time")}
                />
                <span className="mt-1 block text-center">{part.label}</span>
              </label>
            ))}
          </div>
          {err("time") && <p className="mt-1 text-xs text-red-600">{err("time")}</p>}
        </div>

        {PODIUMS.map((podium) => (
          <div key={podium.name} className="sm:col-span-2">
            <p className="mb-1 text-sm font-medium text-slate-700">{podium.label}</p>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={podium.label}>
              {["", "1", "2", "3"].map((place) => (
                <label key={place} className={`${choiceCls} ${segmentCls}`}>
                  <input
                    type="radio"
                    name={podium.name}
                    value={place}
                    defaultChecked={(v[podium.name] ?? "") === place}
                    className="accent-brand max-sm:sr-only"
                  />
                  {place === "" ? (
                    <>
                      <span aria-hidden className="text-lg leading-6 sm:hidden">
                        —
                      </span>
                      <span>
                        Bez<span className="max-sm:hidden"> postolja</span>
                      </span>
                    </>
                  ) : (
                    <span className="max-sm:flex max-sm:flex-col max-sm:items-center">
                      <span aria-hidden className="max-sm:text-lg max-sm:leading-6">
                        {MEDALS[Number(place)]}
                      </span>{" "}
                      <span>{place}. mesto</span>
                    </span>
                  )}
                </label>
              ))}
            </div>
            {err(podium.name) && <p className="mt-1 text-xs text-red-600">{err(podium.name)}</p>}
          </div>
        ))}
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={submitCls}>
          {pending ? "Čuvam…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
