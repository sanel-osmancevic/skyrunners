import { z } from "zod";

/** Ručno upisana dužina trke u kilometrima ("21,1" ili "21.1"). */
export const distanceSchema = z
  .string()
  .trim()
  .regex(/^\d+([.,]\d{1,3})?$/, "Upiši dužinu u kilometrima (npr. 21,1).")
  .transform((v) => Number(v.replace(",", ".")))
  .refine((km) => km > 0 && km <= 1000, "Dužina mora biti veća od 0 i najviše 1000 km.");
