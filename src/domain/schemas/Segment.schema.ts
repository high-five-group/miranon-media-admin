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
  // TASK-249.5 (ADR-115 EF-krav 2/5): valfritt ISO-tidsfönster per par —
  // klientspegeln av servern (_shared/segment-membership.ts Par.period).
  // `.optional()` är icke-brytande: befintliga Par-värden (utan fältet)
  // förblir giltiga, och deltagande "när som helst" är fortsatt default.
  period: z.object({ start: z.string(), end: z.string() }).optional(),
});

export const SegmentRuleSchema = z.object({
  include: z.array(ParSchema),
  exclude: z.array(ParSchema),
});

/**
 * [TASK-249.5, ADR-115] Ett include-VILLKOR i DNF-formen: antingen ett enkelt
 * `Par` (ren OR, dagens form) eller en Konjunkt-grupp (AND, `Par[]`) —
 * speglar servern exakt (`_shared/segment-membership.ts` `MedVillkor`).
 */
export const MedVillkorSchema = z.union([ParSchema, z.array(ParSchema)]);

/**
 * DNF-formen av regeln — BREDARE än `SegmentRuleSchema`, som förblir ORÖRD
 * (den platta OR-formen) för att inte bredda typen under de äldre
 * konsumenterna (`SegmentBuilder.tsx`, prototyp-varianterna A/B/C: samtliga
 * gör `rule.include.map(labelForPar)`, vilket kräver `Par[]`, inte
 * `MedVillkor[]`). Varje giltig `SegmentRule`-regel är strukturellt en giltig
 * `SegmentRuleDnf` (`Par[]` ⊂ `MedVillkor[]`) — befintliga anrops-platser
 * (`SegmentBuilder.tsx` m.fl.) kräver därför noll ändringar när adaptrarnas
 * `computeSegment`/`saveSegment`-signaturer breddas till denna typ.
 */
export const SegmentRuleDnfSchema = z.object({
  include: z.array(MedVillkorSchema),
  exclude: z.array(ParSchema),
});

export type Modalitet = z.infer<typeof ModalitetSchema>;
export type Par = z.infer<typeof ParSchema>;
export type SegmentRule = z.infer<typeof SegmentRuleSchema>;
export type MedVillkor = z.infer<typeof MedVillkorSchema>;
export type SegmentRuleDnf = z.infer<typeof SegmentRuleDnfSchema>;
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
 *
 * [TASK-249.5] `rule` FÖRBLIR den platta `SegmentRuleSchema` — 249.5 breddar
 * ENDAST läsvägens fråge-kontrakt (`computeSegment`, `SegmentRuleDnf`, se
 * ovan); spara/skicka rörs inte (AC#1: den promoverade formen är identisk
 * med den körande prototypen — `saveSegment`/`sendEmail` var no-op/simulerade
 * innan flippen och förblir det). En bredare `SavedSegmentSchema.rule` hade
 * kaskaderat in i VariantA/B/C.tsx (`.rule.include.map(labelForPar)`,
 * `SegmentEntitet`-typerna) helt utanför denna skivas scope.
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
