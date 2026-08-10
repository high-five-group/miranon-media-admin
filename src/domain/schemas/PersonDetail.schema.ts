import { z } from 'zod';
import { PersonSchema } from './Person.schema';

/**
 * En kurshistorik-post — en rad ur Deltaganden (person × event × session),
 * batch-hämtad i ETT anrop av get-person (aldrig N+1). `narvaro` speglar
 * Närvaropoäng (1 = Närvarande/Deltog online, annars 0; data-model.md
 * §Insiktskedjan). `datum` är Event startdatum (ISO YYYY-MM-DD) eller null.
 */
export const PersonHistoryEntrySchema = z.object({
  id: z.string(),
  kursnamn: z.string().nullable(),
  eventLabel: z.string().nullable(),
  datum: z.string().nullable(),
  session: z.string().nullable(),
  status: z.string().nullable(),
  narvaro: z.boolean(),
  ort: z.string().nullable(),
  typ: z.string().nullable(),
});

/**
 * Rikare än list-`PersonSchema`: bär hela detaljvyns kravbild (byggplan §6a —
 * full kurshistorik + leads + kontakt). Återanvänder list-schemats fält via
 * `.extend()` och lägger till (a) person-radens engagemangs-/lead-rollups som
 * listan utelämnar och (b) en typad `historik`-array (event-för-event).
 *
 * `Person.schema.ts` (list-delmängden) lämnas ORÖRD — list- och detalj-vägen
 * har olika behov; detaljen är ett eget, bredare kontrakt (jfr ADR-056:s
 * list-optimerade delmängd). TS-typen härleds via z.infer (prompt-direktiv).
 *
 * OBS `aterkommande` ("Återkommande?"): missvisande fält-namn i basen — se
 * data-model.md §"Återkommande? — missvisande namn". Visas som rådata.
 */
export const PersonDetailSchema = PersonSchema.extend({
  aterkommande: z.string().nullable(),
  nastaEvent: z.string().nullable(),
  antalGenomfordaEvent: z.number(),
  senasteDeltagandeDatum: z.string().nullable(),
  antalHamtningar: z.number(),
  // "Alla hämtningar" = rollup över Touchpoints (1→många) → FLER-VÄRT; namnet
  // säger "alla" → string[] bevarar samtliga (en reduktion till en vore data-förlust).
  allaHamtningar: z.array(z.string()),
  // `Motivering (text)` är en rollup-baserad FORMEL över personens
  // Anmälningar (1→många) → FLER-VÄRT, samma skäl som `allaHamtningar`. Airtable
  // returnerar en array så fort minst en anmälan bär en motivering — get-person
  // coercar med `stringArray` (TASK-52; data-model.md §Kända fällor #46).
  motivering: z.array(z.string()),
  inbjudenCommunity: z.boolean(),
  skapatKontoCommunity: z.boolean(),
  historik: z.array(PersonHistoryEntrySchema),
});

export type PersonHistoryEntry = z.infer<typeof PersonHistoryEntrySchema>;
export type PersonDetail = z.infer<typeof PersonDetailSchema>;
