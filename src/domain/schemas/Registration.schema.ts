import { z } from 'zod';

export const RegistrationSchema = z.object({
  id: z.string(),
  namn: z.string().nullable(),
  fornamn: z.string().nullable(),
  efternamn: z.string().nullable(),
  email: z.string().nullable(),
  telefon: z.string().nullable(),
  eventNamn: z.string().nullable(),
  ort: z.string().nullable(),
  status: z.string().nullable(),
  flagga: z.string().nullable(),
  anmalningsavgift: z.string().nullable(),
  slutbetalning: z.string().nullable(),
  betalningspaminnelseSkickad: z.string().nullable(),
  inskickad: z.string().nullable(),
  motivering: z.string().nullable(),
  tidigareErfarenhet: z.string().nullable(),
  antalPlatser: z.number(),
  notering: z.string().nullable(),
  eventId: z.string().nullable(),
  personId: z.string().nullable(),
});
