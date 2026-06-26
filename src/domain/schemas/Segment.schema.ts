import { z } from 'zod';
import { Modalitet as ModalitetEnum } from '../types/Status';

/**
 * [GA] Runtime-validering av compute-segment-EF:ns REGEL (request) + SVAR.
 *
 * Request-sidan (L2): klienten bygger regeln och adaptern POST:ar den. Detta är
 * alignment-ankaret för Modalitet över runtime-gränsen Deno↔Vite — `ModalitetSchema`
 * speglar `_shared/segment-membership.ts` Modalitet-typen + `Status.ts` Modalitet-
 * konsten (samma två värden). EF:n validerar därtill regeln manuellt
 * (parseSegmentRule) eftersom EF:er inte använder Zod. `kurs` valideras INTE mot
 * en lista — öppen taxonomi (ADR-064 beslut 2).
 *
 * Svars-sidan: nullbarhet matchar EF-utdatan: Personer.Namn = formel-primärfält
 * (skalär; tom → null via scalarString), E-post = text (kan saknas → null),
 * ejGodkandMail = checkbox (alltid boolean). Consent FILTRERAS EJ i motorn —
 * ejGodkandMail bärs med och appliceras vid L4 (export/mail).
 */
export const ModalitetSchema = z.enum(ModalitetEnum);

export const ParSchema = z.object({
  kurs: z.string().min(1),
  modalitet: ModalitetSchema,
});

export const SegmentRuleSchema = z.object({
  include: z.array(ParSchema),
  exclude: z.array(ParSchema),
});

export type Modalitet = z.infer<typeof ModalitetSchema>;
export type Par = z.infer<typeof ParSchema>;
export type SegmentRule = z.infer<typeof SegmentRuleSchema>;
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
