import { z } from 'zod';

/**
 * Avbokning/återtagning-vertikalens write-shape och svars-schema (TASK-368.2,
 * PRD TASK-368 beslut 1/3/4).
 *
 * Klienten skickar ENDAST `registrationId` + valfritt `skal` — status läses
 * server-side ur basen, och den nya statusen (avbokad respektive den härledda
 * statusen vid återtagande) beräknas ENTYDIGT av servern
 * (`_shared/cancel-registration.ts`), aldrig av UI:t. Samma "servern är
 * facit"-disciplin som `ConfirmRegistrations.schema.ts`.
 *
 * ETT EF (`cancel-registration`), TVÅ ADAPTER-METODER (`avbokaAnmalan`/
 * `atertaAvbokning`) — samma form som betalningsdomänens `raderaInbetalning`/
 * `makuleraInbetalning`, som delar EN EF (`hantera-inbetalning`) via ett
 * `atgard`-fält. `CancelRegistrationAtgard` är den unionen.
 */
export const CancelRegistrationAtgardSchema = z.enum(['avboka', 'aterta']);
export type CancelRegistrationAtgard = z.infer<typeof CancelRegistrationAtgardSchema>;

export type CancelRegistrationInput = {
  registrationId: string;
  /** Frivilligt fritextskäl — trimmas och tak-kontrolleras server-side. */
  skal?: string;
};

/**
 * Serverns svar. `status` är den NYA statusen som skrevs (Avbokad/Ombokad
 * respektive den härledda statusen); `notering` är hela fältets nya innehåll
 * EFTER appendet (befintlig text + den nya, datumstämplade raden) — så
 * klienten kan patcha cachen direkt utan en extra läsning (`useSendConfirmation
 * FromDetail`s mönster i `registrationConfirmation.ts`).
 */
export const CancelRegistrationResultSchema = z.object({
  atgard: CancelRegistrationAtgardSchema,
  registrationId: z.string(),
  status: z.string(),
  notering: z.string(),
});
export type CancelRegistrationResult = z.infer<typeof CancelRegistrationResultSchema>;
