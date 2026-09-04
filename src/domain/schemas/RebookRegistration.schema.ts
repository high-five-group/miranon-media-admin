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
 * `aterupptaget` är `true` när ALLT redan var gjort: ingen anmälan skapades,
 * noll rader flyttades, ingen status skrevs, ingen loggrad tillkom. Dit hamnar
 * ett andra identiskt anrop — och BARA det. Servern adopterar en befintlig
 * anmälan på mål-eventet enbart när anropet bevisligen är samma request
 * upprepad; i alla andra lägen avvisas ombokningen med 409
 * `redan_anmald_pa_malet`, eftersom två anmälningars ekonomi aldrig slås ihop
 * automatiskt (ADR-130 § Konsekvenser). `nyAnmalanSkapad` är därför den exakta
 * komplementen till `aterupptaget`.
 *
 * `prisskillnad` är positiv när personen ska betala mellanskillnaden, negativ
 * när pengar ska tillbaka och `null` när priset inte går att avgöra. Talet är
 * nytt pris minus det som nu sitter på den nya anmälan.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `flyttadeRader`/`flyttadSumma` ÄR PER ANROP — INTE ETT TILLSTÅND
 * ═══════════════════════════════════════════════════════════════════════════
 * De beskriver vad DETTA anrop flyttade, och är `0` vid en återupptagning
 * trots att pengarna sitter rätt sedan förra gången. En text som säger
 * "X kr flyttades" byggd på `flyttadSumma` skulle alltså påstå "0 kr" om en
 * omkörning. Använd `summaNyAnmalan` — talet spegeln faktiskt skrev till den
 * nya anmälan — för allt som beskriver ett TILLSTÅND.
 *
 * `spegelGammal`/`spegelNy` bär basens eftersläpning per anmälan — samma form
 * och samma skäl som betalningsdomänens övriga svar (ADR-128 beslut 5: en
 * eftersläpning SYNS i stället för att tystas). De bär UTFALLET av skrivningen,
 * inte beloppet; beloppet är `summaNyAnmalan`.
 */
export const RebookRegistrationResultSchema = z.object({
  gammalAnmalanId: z.string(),
  nyAnmalanId: z.string(),
  /** Skapades raden i detta anrop? Exakt komplementen till `aterupptaget`. */
  nyAnmalanSkapad: z.boolean(),
  aterupptaget: z.boolean(),
  nyttEventId: z.string(),
  /** Gamla anmälans status efter operationen. */
  status: z.string(),
  /** Gamla anmälans Notering efter appendet (hela fältet). */
  notering: z.string(),
  /** PER ANROP — se docblocket ovan innan talet visas. */
  flyttadeRader: z.number(),
  /** PER ANROP — se docblocket ovan innan talet visas. */
  flyttadSumma: z.number(),
  /** Aktiva inbetalningar på den NYA anmälan efter operationen. Stabilt över omkörningar. */
  summaNyAnmalan: z.number(),
  nyttPris: z.number().nullable(),
  prisskillnad: z.number().nullable(),
  spegelGammal: SpegelUtfallSchema,
  spegelNy: SpegelUtfallSchema,
});
export type RebookRegistrationResult = z.infer<typeof RebookRegistrationResultSchema>;
