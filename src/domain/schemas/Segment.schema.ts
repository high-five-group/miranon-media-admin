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

/**
 * [GA] En SPARAD segment-rad (Fas 6g L3, ADR-065). `rule` = den typade regeln som
 * persisterades i `App-segmentregel`-fältet (`JSON.stringify` ↔ `JSON.parse`-rundtur);
 * `namn`/`definition` speglar `Namn på segment` / `Segmentdefinition`. Båda nullbara:
 * get-segments läser via `scalarString` (tomt fält → null), och kontraktet (L193)
 * tillåter en rad utan namn/definition. `rule` är ALLTID närvarande — get-segments
 * filtrerar bort rader utan giltig `App-segmentregel` (de 9 legacy-Make-segmenten),
 * så en SavedSegment bär per definition en regel.
 */
export const SavedSegmentSchema = z.object({
  id: z.string(),
  namn: z.string().nullable(),
  rule: SegmentRuleSchema,
  definition: z.string().nullable(),
});

export type SavedSegment = z.infer<typeof SavedSegmentSchema>;

/** Write-input till save-segment (Fas 6g L3): namn + typad regel + klartext-spegling. */
export type SaveSegmentInput = {
  namn: string;
  rule: SegmentRule;
  definition: string;
};
