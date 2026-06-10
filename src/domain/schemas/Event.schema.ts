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
});
