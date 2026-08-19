import { z } from 'zod';
import { PersonSchema } from './Person.schema';

/**
 * En INTRESSERAD = en PERSON som är ett lead: har hämtat något men ännu inte
 * anmält sig (noll Anmälningar totalt). Läsning 2 (Marcus-låst, Fas 6e L1) —
 * INTE en nedladdningshändelse (det vore Läsning 1, den förkastade
 * tolkningen; den föräldralösa `Lead`-domänen rensas i L1 Landning 2).
 * Server-filtret (get-leads) uttrycker definitionen:
 * `AND({Totalt antal hämtningar (erbjudande)} > 0, {Antal anmälningar
 * (totalt)} = 0)` (TASK-277 AC #6 — pekades om från `{Antal hämtningar}` =
 * `COUNTA(Engagemang)`, som missade leads vars `Engagemang`-rad aldrig
 * skapades — fälla 47, data-model.md).
 *
 * Rikare än list-`PersonSchema` med exakt de två leads-rollups listan utelämnar:
 * `antalHamtningar` (= `COUNTA(Engagemang)`, appens kanoniska hämtnings-mått —
 * speglar get-person:s mappning) och `allaHamtningar` ("vad de nappat på").
 * Senaste interaktion (text/datum) finns REDAN i `PersonSchema` → dubblas EJ.
 *
 * `Person.schema.ts` lämnas ORÖRD — list-, detalj- och intresserad-vägen har
 * olika behov; var och en är ett eget kontrakt (jfr PersonDetailSchema +
 * ADR-056:s list-optimerade delmängd). TS-typen härleds via z.infer.
 */
export const IntresseradSchema = PersonSchema.extend({
  antalHamtningar: z.number(),
  // "Alla hämtningar" = rollup över Touchpoints (1→MÅNGA) → FLER-VÄRT; namnet
  // säger "alla" → string[] bevarar samtliga (en reduktion till en vore
  // data-förlust). ALDRIG firstString. (Spegel av PersonDetailSchema.)
  allaHamtningar: z.array(z.string()),
});

export type Intresserad = z.infer<typeof IntresseradSchema>;
