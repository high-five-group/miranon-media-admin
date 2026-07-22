import { z } from 'zod';

/**
 * [GA] Bekräftelse-vertikalens write-shape och svars-schema (task-18.6; PRD task-18
 * beslut 7).
 *
 * Klienten skickar ENDAST record-ID:n + en idempotensnyckel — adress, namn och status
 * läses server-side ur basen (mottagaren får aldrig komma från klienten). EN operation
 * bär både den enskilda bekräftelsen (ett ID) och Bekräfta alla (N ID:n); skillnaden är
 * UI:ts kontrollfråga och optimism, inte serverns kontrakt.
 *
 * `idempotencyKey` är en klient-genererad UUID v4 per klick (ADR-059-formen) — EF:en
 * härleder Resends idempotens-nyckel ur den, så en retry av samma klick inte dubblerar
 * mailet.
 */
export type ConfirmRegistrationsInput = {
  registrationIds: string[];
  idempotencyKey: string;
};

/** Varför en anmälan hoppades över — server-satt, aldrig gissad i UI:t. */
export const ConfirmSkipReasonSchema = z.enum(['inactive', 'already_confirmed', 'no_email']);

/**
 * Serverns utfall — ALDRIG binärt (send-bulks D3-form ärvd): `skipped` betyder
 * noll-leverans (inget mail, ingen ändring), `partial` att något föll. UI:t
 * annonserar utfallet ur dessa räknare i stället för att anta framgång.
 */
export const ConfirmRegistrationsResultSchema = z.object({
  status: z.enum(['sent', 'partial', 'failed', 'skipped']),
  requested: z.number(),
  attempted: z.number(),
  /** Anmälningar som fick BÅDE mail och status-flip (atomicitets-kontraktet). */
  confirmed: z.array(z.string()),
  skipped: z.array(z.object({ registrationId: z.string(), reason: ConfirmSkipReasonSchema })),
  failed: z.array(z.object({ registrationId: z.string(), reason: z.string() })),
  /** ISO-tidsstämpeln som skrevs till 'Bekräftelse skickad' (null om inget skrevs). */
  bekraftelseSkickad: z.string().nullable(),
});

export type ConfirmRegistrationsResult = z.infer<typeof ConfirmRegistrationsResultSchema>;
