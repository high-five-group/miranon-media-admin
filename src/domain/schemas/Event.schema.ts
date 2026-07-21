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
});
