import { z } from 'zod';
import { EventStatus } from '../types/Status';

// status härleds ur EventStatus-konstanten (single source) — data-verifierad
// mot live-basen 2026-06-10: 0 records utanför optionslistan (Fas 2.5 klunga 4).
export const EventSchema = z.object({
  id: z.string(),
  eventlabel: z.string().nullable(),
  eventNamn: z.string().nullable(),
  typ: z.string().nullable(),
  ort: z.string().nullable(),
  startdatum: z.string().nullable(),
  slutdatum: z.string().nullable(),
  tidKvarTillEvent: z.string().nullable(),
  maxPlatser: z.number().nullable(),
  antalAnmalda: z.number(),
  platserKvar: z.number().nullable(),
  anmaldBelaggning: z.number().nullable(),
  bekraftadBelaggning: z.number().nullable(),
  antalNyaAnmalningar: z.number(),
  antalAnmalningsavgifter: z.number(),
  antalSlutbetalningar: z.number(),
  antalSlutbetalningFelande: z.number(),
  status: z.enum(EventStatus).nullable(),
  // eventKey (task-18.1): system-genererad formel "Event-N" (EventKey-pillen på
  // detaljsidans topprad). OPTIONAL — inte required/nullable — så en klient med
  // äldre EF-svar i cachen (utan fältet) inte fäller z.array-parsen av hela listan;
  // EF:erna UTELÄMNAR nyckeln när värdet mot förmodan saknas (aldrig null), och
  // BÅDA läs-EF:erna (get-event + get-events) returnerar fältet sedan samma leverans.
  eventKey: z.string().optional(),

  // Basdimensionerna (TASK-249.4, ADR-115) — Kursfamilj/Kursnivå. `.nullable()` bär det
  // ÄRLIGA "ingen känd familj/nivå"-läget (aldrig gissat); `.optional()` är en
  // BAKÅTKOMPATIBILITETS-lucka för svar/cache från FÖRE denna leverans (eventKey-formen)
  // — get-events/get-event/update-event bär nyckeln ALLTID sedan denna leverans, se
  // Event.ts. Håll i synk med Event.ts.
  kursfamilj: z.string().nullable().optional(),
  kursniva: z.string().nullable().optional(),

  // EVENTETS PRIS (TASK-368.7) — prisets nivå 2 med Eventinnehåll-standarden
  // (nivå 3) som fallback, löst server-side (`_shared/event-map.ts` § EVENTETS
  // PRIS + `_shared/eventpris.ts`). Ombokningssteget räknar prisbeskedet FÖRE
  // bekräftelsen ur detta tal (`ombokning-pris.ts` § `prisskillnadFore`).
  //
  // `.nullable()` bär det ÄRLIGA "inget pris satt"-läget: varken eventet eller
  // dess Eventinnehåll-standard har ett pris, och då säger appen att priset är
  // okänt i stället för att gissa. `.optional()` är BAKÅTKOMPATIBILITETS-luckan
  // (samma form som kursfamilj/kursniva ovan) — svar och persist-cache från
  // FÖRE denna leverans bär inte nyckeln, och `z.array(EventSchema)`-parsen av
  // hela listan får inte falla på det. get-events/get-event/update-event bär
  // nyckeln ALLTID sedan denna leverans. Håll i synk med Event.ts.
  //
  // 0 ÄR ETT SATT PRIS, inte "inget pris" (`betalningsharledning.ts` § NOLL) —
  // varje konsument prövar `=== null`, aldrig sanningsvärde.
  pris: z.number().nullable().optional(),

  // ── Beläggningens innehållsmodell (task-18.2; S73-facit K16, PRD task-18
  // beslut 5) — mappar basen 1-till-1. SAMTLIGA fält ADDITIVT-OPTIONAL i
  // eventKey-formen: UTELÄMNAS-vid-saknas, ALDRIG null (null skulle kollidera
  // med list-prototypens ProtoEvent-typ — 18.1-precedenten). get-events
  // (P1-listan) och äldre cache-svar bär dem inte, och endast get-event
  // aggregerar (update-event returnerar de två skrivbara men aldrig
  // räkningarna — useUpdateEvent MERGE-cachar därför, se hooken). ──

  // Reserverade = basens 'Extra platser' (skrivbart number; osatt i basen →
  // nyckeln utelämnas).
  reserverade: z.number().optional(),
  // Manuellt tillagda = basens 'Manuella platser' (osatt → nyckeln utelämnas).
  manuelltTillagda: z.number().optional(),
  // Antal AKTIVA länkade Anmälningar med Källa TOM (= formuläranmälningar;
  // frånvaro är sanning — data-model §Källa-värden).
  viaFormular: z.number().optional(),
  // Antal AKTIVA länkade Anmälningar med Källa '+1' (CompanionModal-medföljande).
  medfoljande: z.number().optional(),
  // TASK-373: antal AKTIVA länkade Anmälningar med varje ANNAT Källa-värde —
  // 'Manuell' (appens Ny anmälan), 'Väntelista' (uppflyttad ur kön) och varje
  // framtida option. FAIL-CLOSED restpost: tillsammans med de två ovan är detta
  // ALLA aktiva anmälningar, så mätaren aldrig kan tappa en plats (buggen kortet
  // rättar: prod visade "12 av 20" mot basens 13). ADDITIVT-OPTIONAL i samma
  // form som fälten omkring — en app mot en ÄLDRE deployad get-event läser
  // `undefined → 0` i stället för att fälla parsen.
  ovrigaAnmalningar: z.number().optional(),
  // Auto-utskicket för eventinfo (task-18.6; PRD task-18 beslut 14) — de två
  // ADDITIVA bas-fälten som eventsidans auto-utskicks-kryss läser och skriver:
  // 'Deltagarinfo schemalagd' (date ISO) respektive 'Deltagarinfo auto-utskick
  // avstängt' (checkbox, OPT-OUT: true = skickas INTE automatiskt). Basens ord är
  // Deltagarinfo, och sedan 2026-08-23 (TASK-303) är UI-ordet detsamma
  // — tidigare 'eventinfo' (ORDLISTA § Deltagarinfo). ADDITIVT-OPTIONAL i samma form
  // som fälten ovan: get-events och äldre cache-svar bär dem inte. get-event och
  // update-event bär ALLTID opt-out:en (Airtable utelämnar okryssad checkbox →
  // EF:en normaliserar till false) och datumet endast när det är satt.
  // UTSKICKS-MOTORN ingår INTE i kortet — fälten är styrningen, inte sändningen.
  deltagarinfoSchemalagd: z.string().optional(),
  deltagarinfoAutoAvstangt: z.boolean().optional(),
  // Antal AKTIVA event-kopplade Väntelisteplatser via nya länkfältet
  // 'Event (länk)' (task-18.2, additivt staging-fält; NOT Flyttad till anmälan
  // — get-waitlist:s aktiv-semantik). Utanför taket, aldrig ett segment (K22).
  vantelista: z.number().optional(),

  // Bor över-summeringen (task-17.5, PRD task-18 beslut 8 / task-17 story 9):
  // HÄRLEDD räkning av ikryssade 'Bor över' bland eventets länkade Anmälningar —
  // listkortets säng-rad (EventCard) läser den. INGET lagrat räknefält (ADR-063:
  // antalet härleds ALLTID ur kryssen; själva checkbox-fältet fött i task-18.7).
  // ADDITIVT-OPTIONAL i samma form som beläggningsräkningarna ovan: get-events OCH
  // get-event aggregerar den (ALLTID ett tal ≥0 där), medan update-event/
  // create-event och äldre cache-svar UTELÄMNAR den (undefined droppas av
  // JSON.stringify — aldrig null, OPTIONAL i EventSchema så z.array-parsen håller).
  borOverAntal: z.number().optional(),
});
