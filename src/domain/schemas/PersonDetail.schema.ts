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
 * En hämtning/interaktion — en rad ur Touchpoints, batch-hämtad i ETT anrop av
 * get-person (aldrig N+1) för de touchpoint-ID:n `Personer.Touchpoints`
 * länkar (S103 steg 2). `erbjudande` är satt bara för touchpoints av typen
 * "Angett e-post för att ta del av ett erbjudande" — övriga typer (Öppnat
 * e-post, Inskickad anmälan, Avbokad anmälan, Närvaro registrerad,
 * Soundwise-händelser) ger `null`; `typ` säger vilken sort det var så en
 * `null`:ad `erbjudande` inte tolkas som saknad data. `datum` är
 * Touchpoints egna `Datum`-fält (dateTime, ISO 8601) eller null. Ersätter
 * INTE `allaHamtningar` (plattat rollup-format, kvar orört nedan) — detta är
 * den strukturerade, icke-regex-beroende systern.
 */
export const PersonTouchpointEntrySchema = z.object({
  id: z.string(),
  erbjudande: z.string().nullable(),
  typ: z.string().nullable(),
  datum: z.string().nullable(),
});

/**
 * En motivering — en rad ur Anmälningar, batch-hämtad i ETT anrop av
 * get-person (aldrig N+1) för de anmälnings-ID:n `Personer.Anmälningar
 * (länkat fält)` länkar (S103 steg 2). `event` föredrar eventets kanoniska
 * kursnamn (`Kurs (from Event)`-lookupen) och faller tillbaka på anmälans
 * egna `Vill anmäla sig till` när eventlänken saknas (backfill-anmälningar
 * utan Event-länk) — samma idiom som basens egen `Senaste anmälan
 * (sammanfattning)`-formel (TASK-184).
 *
 * `datum` = NÄR PERSONEN ANMÄLDE SIG: `Inskickad` när det finns, annars
 * `Rad skapad` (createdTime). Fältet bar fram till 2026-08-12 ENBART `Rad
 * skapad`, med motiveringen att `Inskickad` är ojämnt ifylld (data-model.md
 * § "Senaste anmälan datum"). Den motiveringen håller för ett val mellan
 * ETT av två fält — den håller inte mot en fallback-kedja, och priset var
 * mätbart: på seedad data är `Rad skapad` seedningsögonblicket, så SAMTLIGA
 * anmälningar fick identiskt datum (Sofia Isaksson 2026-08-12: fyra
 * anmälningar, alla "10 augusti 2026", medan `Inskickad` bar 2026-05-21,
 * 2026-08-07 och två till). Den "fallande ordning" B6 lovar var alltså
 * ordningslös, och strömmens anmälnings-poster klumpades på en enda dag.
 *
 * `eventDatum` = EVENTETS startdatum (`Startdatum`, lookup via Event-länken).
 * Utan det går två anmälningar till samma KURS men olika TILLFÄLLEN inte att
 * skilja åt — samma person renderade två identiska rader "Anmäld till
 * Fjärrskådning" (tillfällena 2026-06-11 och 2026-08-18).
 *
 * `ort` = EVENTETS ort (`Ort (from Event)`, lookup). Anmälans EGNA `Ort` duger
 * inte — tom på backfill-anmälningar. Tillsammans med `event` och `eventDatum`
 * är detta atomerna tidslinjens mening komponeras av ("Anmälde sig till
 * <kurs> i <ort> <datum>", Marcus 2026-08-12); appen bygger meningen, basen
 * levererar delarna (ADR-108 beslut 1).
 *
 * ALLA TRE är `.default(null)`: en EF som ännu inte deployats med utökningen
 * utelämnar dem, och vyn ska då falla tillbaka på sitt tidigare beteende i
 * stället för att fälla schemat.
 *
 * Ersätter INTE `motivering` (plattat rollup-format, kvar orört nedan).
 */
export const PersonMotiveringEntrySchema = z.object({
  id: z.string(),
  motivering: z.string().nullable(),
  event: z.string().nullable(),
  datum: z.string().nullable(),
  eventDatum: z.string().nullable().default(null),
  ort: z.string().nullable().default(null),
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
  // S103 steg 2: hämtningarna/motiveringarna som RIKTIGA poster (id + datum +
  // erbjudande/event), BREDVID — inte i stället för — de äldre platta
  // rollup-arrayerna ovan. `allaHamtningar`/`motivering` rivs inte här:
  // `PersonDetailPrototyp.tsx` variant A/B/C konsumerar dem fortfarande.
  hamtningar: z.array(PersonTouchpointEntrySchema),
  motiveringar: z.array(PersonMotiveringEntrySchema),
  // Lottas fritext-flagga (`Personer.Flagga`, S103) — ersätter `manuellFlagga`
  // som aldrig kunde sättas (singleSelect med choices=[], data-model.md
  // §Kända fällor 25). `manuellFlagga` lämnas ORÖRD ovan; dess avveckling är
  // ett separat beslut som inte tas här.
  flagga: z.string().nullable(),
});

export type PersonTouchpointEntry = z.infer<typeof PersonTouchpointEntrySchema>;
export type PersonMotiveringEntry = z.infer<typeof PersonMotiveringEntrySchema>;
export type PersonHistoryEntry = z.infer<typeof PersonHistoryEntrySchema>;
export type PersonDetail = z.infer<typeof PersonDetailSchema>;
