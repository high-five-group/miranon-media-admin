import { z } from 'zod';

/**
 * [GA] Runtime-validering av compute-segment-EF:ns SVAR (Fas 6g L1, ADR-064).
 *
 * ENDAST svars-sidan i L1. Request-sidan (SegmentRule/Par/Modalitet som Zod)
 * skjuts till L2 när byggar-ytan konsumerar motorn — EF:n validerar regeln
 * manuellt (parseSegmentRule i `_shared/segment-membership.ts`, eftersom EF:er
 * inte använder Zod). Interface-spegel i `../models/` skjuts likaledes till L2
 * (parallell-sanningskälla-mönstret, jfr Attendance).
 *
 * Nullbarhet matchar EF-utdatan: Personer.Namn = formel-primärfält (skalär; tom
 * → null via scalarString), E-post = text (kan saknas → null), ejGodkandMail =
 * checkbox (alltid boolean). Consent FILTRERAS EJ i motorn — ejGodkandMail bärs
 * med och appliceras vid L4 (export/mail).
 */
export const SegmentMemberSchema = z.object({
  id: z.string(),
  namn: z.string().nullable(),
  email: z.string().nullable(),
  ejGodkandMail: z.boolean(),
});

export const SegmentResultSchema = z.object({
  members: z.array(SegmentMemberSchema),
  count: z.number(),
});

export type SegmentMember = z.infer<typeof SegmentMemberSchema>;
export type SegmentResult = z.infer<typeof SegmentResultSchema>;
