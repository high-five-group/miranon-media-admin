import { z } from 'zod';
import { SpegelUtfallSchema } from './Betalningar.schema';

/**
 * Ombokningens write-shape och svars-schema (TASK-368.4, PRD TASK-368
 * beslut 7-8; ADR-130).
 *
 * Klienten skickar ENDAST de två record-ID:na. Allt annat härleds server-side:
 * den nya anmälans fält ur den gamla, avbokningsskälets Notering-rad ur
 * mål-eventet, statusen ur övergångstabellen, prisskillnaden ur
 * betalningshärledningen. Samma "servern är facit"-disciplin som
 * `CancelRegistration.schema.ts` och `ConfirmRegistrations.schema.ts`.
 *
 * INGET `skal`-FÄLT, med avsikt: kortets AC #2 låser Notering-radens form, och
 * skälet ÄR ombokningen. En fritextparameter hade gjort formen valfri.
 */
export type RebookRegistrationInput = {
  /** Anmälan som ska bokas om (den gamla). */
  registrationId: string;
  /** Eventet den ska bokas om till. */
  nyttEventId: string;
};

/**
 * Serverns svar.
 *
 * `nyAnmalanSkapad` skiljer de två vägarna till en ny anmälan: en NYSKAPAD rad
 * (normalfallet) eller en BEFINTLIG som adopterades. Adoption sker när personen
 * redan hade en anmälan på mål-eventet — antingen för att hon faktiskt var
 * anmäld dit, eller för att ett tidigare ombokningsförsök avbröts efter att
 * raden skapats. Appen (TASK-368.5) kan säga det rakt ut i stället för att
 * låtsas att en ny rad skapades.
 *
 * `aterupptaget` är `true` när ALLT redan var gjort: ingen anmälan skapades,
 * noll rader flyttades, ingen status skrevs, ingen loggrad tillkom. Ett andra
 * identiskt anrop hamnar här.
 *
 * `prisskillnad` är positiv när personen ska betala mellanskillnaden, negativ
 * när pengar ska tillbaka och `null` när priset inte går att avgöra. Talet är
 * nytt pris minus det som nu sitter på den nya anmälan (se EF:ens egen
 * kommentar för varför det är det sanna talet även vid adoption).
 *
 * `spegelGammal`/`spegelNy` bär basens eftersläpning per anmälan — samma form
 * och samma skäl som betalningsdomänens övriga svar (ADR-128 beslut 5: en
 * eftersläpning SYNS i stället för att tystas).
 */
export const RebookRegistrationResultSchema = z.object({
  gammalAnmalanId: z.string(),
  nyAnmalanId: z.string(),
  nyAnmalanSkapad: z.boolean(),
  aterupptaget: z.boolean(),
  nyttEventId: z.string(),
  /** Gamla anmälans status efter operationen. */
  status: z.string(),
  /** Gamla anmälans Notering efter appendet (hela fältet). */
  notering: z.string(),
  flyttadeRader: z.number(),
  flyttadSumma: z.number(),
  nyttPris: z.number().nullable(),
  prisskillnad: z.number().nullable(),
  spegelGammal: SpegelUtfallSchema,
  spegelNy: SpegelUtfallSchema,
});
export type RebookRegistrationResult = z.infer<typeof RebookRegistrationResultSchema>;
