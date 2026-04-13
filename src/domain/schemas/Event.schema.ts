import { z } from 'zod';

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
  status: z.string().nullable(),
});
