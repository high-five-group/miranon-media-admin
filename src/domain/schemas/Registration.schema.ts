import { z } from 'zod';
import { FlagStatus, PaymentStatus, RegistrationStatus } from '../types/Status';

// Enum-fälten härleds ur Status.ts-konstanterna (single source) och är
// data-verifierade mot live-basen 2026-06-10: 0 records utanför
// optionslistorna (Fas 2.5 klunga 3, MCP filterByFormula-svep).
export const RegistrationSchema = z.object({
  id: z.string(),
  namn: z.string().nullable(),
  fornamn: z.string().nullable(),
  efternamn: z.string().nullable(),
  email: z.string().nullable(),
  telefon: z.string().nullable(),
  eventNamn: z.string().nullable(),
  ort: z.string().nullable(),
  status: z.enum(RegistrationStatus).nullable(),
  flagga: z.enum(FlagStatus).nullable(),
  anmalningsavgift: z.enum(PaymentStatus).nullable(),
  slutbetalning: z.enum(PaymentStatus).nullable(),
  betalningspaminnelseSkickad: z.string().nullable(),
  inskickad: z.string().nullable(),
  motivering: z.string().nullable(),
  tidigareErfarenhet: z.string().nullable(),
  antalPlatser: z.number(),
  notering: z.string().nullable(),
  eventId: z.string().nullable(),
  personId: z.string().nullable(),
  // Betalnings-vertikalens fyra ADDITIVA fält (task-18.8; ADR-063 —
  // per-betalnings-notering + senaste påminnelse per betalning). ADDITIVT-
  // OPTIONAL (18.2:s Event-form): äldre mockar/cachade svar utan fälten
  // parsar oförändrat; deployad get-registrations levererar dem alltid
  // (?? null). Konsumtion normaliserar ?? null.
  noteringAnmalningsavgift: z.string().nullable().optional(),
  noteringSlutbetalning: z.string().nullable().optional(),
  paminnelseAnmalningsavgiftSkickad: z.string().nullable().optional(),
  paminnelseSlutbetalningSkickad: z.string().nullable().optional(),
});
