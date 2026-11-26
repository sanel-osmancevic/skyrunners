// Šifarnici za formu člana – koriste ih i forma (klijent) i validacija (server).

export const GENDERS = [
  { value: "M", label: "Muški" },
  { value: "Z", label: "Ženski" },
] as const;

export function labelOf(list: readonly { value: string; label: string }[], value: string) {
  return list.find((o) => o.value === value)?.label ?? value;
}
