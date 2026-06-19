import { z } from 'zod';

export const PersonSchema = z.object({
  id: z.string(),
  namn: z.string().nullable(),
  fornamn: z.string().nullable(),
  efternamn: z.string().nullable(),
  email: z.string().nullable(),
  telefon: z.string().nullable(),
  // `Ort` är en rollup över personens Anmälningar (1→många) → FLER-VÄRT. string[]
  // bevarar alla orter (aldrig tyst drop, Lottas kärnkrav). Listan renderar inte
  // ort, men domän-typen är konsekvent med detaljen (samma datakälla-port).
  ort: z.array(z.string()),
  manuellFlagga: z.string().nullable(),
  aiFlagga: z.string().nullable(),
  anteckningar: z.string().nullable(),
  antalAnmalningar: z.number(),
  antalDeltaganden: z.number(),
  erfarenhetsniva: z.string().nullable(),
  erfarenhetsbadge: z.string().nullable(),
  senasteInteraktion: z.string().nullable(),
  senasteInteraktionDatum: z.string().nullable(),
  dagarSedanSenaste: z.number().nullable(),
  harAktivAnmalan: z.string().nullable(),
  ejGodkandMail: z.boolean(),
  radSkapad: z.string().nullable(),
  anmalningIds: z.array(z.string()),
  deltagandeIds: z.array(z.string()),
});
