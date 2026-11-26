"use client";

import { useActionState, startTransition } from "react";
import { saveMemberProfile } from "@/lib/member-actions";
import type { FormState } from "@/lib/form";
import { Field, Section, inputCls, submitCls } from "@/components/form-ui";
import { GENDERS } from "@/lib/member-options";

type Props = {
  initial: Record<string, string>;
  submitLabel: string;
};

export default function MemberForm({ initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveMemberProfile, {});
  const v = state?.values ?? initial;
  const err = (name: string) => state?.errors?.[name]?.[0];

  // Ručni submit da React ne resetuje formu kada server vrati greške.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  // key menja formu kad se promene podaci sa servera, pa defaultValue preuzima nove vrednosti.
  const formKey = JSON.stringify(v);

  return (
    <form key={formKey} onSubmit={onSubmit} noValidate className="space-y-8">
      {state?.message && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>
      )}

      <Section title="Lični podaci">
        <Field label="Ime" name="firstName" error={err("firstName")} required>
          <input id="firstName" name="firstName" defaultValue={v.firstName} autoComplete="given-name" className={inputCls} aria-invalid={!!err("firstName")} />
        </Field>
        <Field label="Prezime" name="lastName" error={err("lastName")} required>
          <input id="lastName" name="lastName" defaultValue={v.lastName} autoComplete="family-name" className={inputCls} aria-invalid={!!err("lastName")} />
        </Field>
        <Field label="Datum rođenja" name="dateOfBirth" error={err("dateOfBirth")} required>
          <input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={v.dateOfBirth} className={inputCls} aria-invalid={!!err("dateOfBirth")} />
        </Field>
        <Field label="Pol" name="gender" error={err("gender")} required>
          <select id="gender" name="gender" defaultValue={v.gender ?? ""} className={inputCls} aria-invalid={!!err("gender")}>
            <option value="" disabled>Izaberi…</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Telefon" name="phone" error={err("phone")} required>
          <input id="phone" name="phone" type="tel" defaultValue={v.phone} placeholder="+381 64 123 4567" autoComplete="tel" className={inputCls} aria-invalid={!!err("phone")} />
        </Field>
        <Field label="Grad" name="city" error={err("city")} required>
          <input id="city" name="city" defaultValue={v.city} autoComplete="address-level2" className={inputCls} aria-invalid={!!err("city")} />
        </Field>
        <Field label="Adresa" name="address" error={err("address")} wide>
          <input id="address" name="address" defaultValue={v.address} autoComplete="street-address" className={inputCls} aria-invalid={!!err("address")} />
        </Field>
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={submitCls}>
          {pending ? "Čuvam…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
