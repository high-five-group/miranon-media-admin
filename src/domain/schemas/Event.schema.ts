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
  // "Anmälda deltagare"-raden: antal länkade Anmälningar med Källa TOM
  // (= formuläranmälningar; frånvaro är sanning — data-model §Källa-värden).
  viaFormular: z.number().optional(),
  // Antal länkade Anmälningar med Källa '+1' (CompanionModal-medföljande).
  medfoljande: z.number().optional(),
  // Antal AKTIVA event-kopplade Väntelisteplatser via nya länkfältet
  // 'Event (länk)' (task-18.2, additivt staging-fält; NOT Flyttad till anmälan
  // — get-waitlist:s aktiv-semantik). Utanför taket, aldrig ett segment (K22).
  vantelista: z.number().optional(),
});
