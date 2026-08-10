import { z } from 'zod';

/**
 * [TASK-147.2] Åtgärdsutskickens write-shape och svars-schema — klientens
 * kontrakt mot `send-action-email`-EF:en (TASK-147.1, `supabase/functions/
 * _shared/send-action-email.ts`). SAMMA UPPDELNING som `ConfirmRegistrations.
 * schema.ts` (task-18.6): klienten skickar ENDAST åtgärdstyp + event-ID +
 * mottagar-ID:n + den redigerade ämnesraden/brödtexten + en idempotensnyckel
 * — adress, namn, status och betalningsläge löses SERVER-SIDE ur basen
 * (mottagaren kan aldrig komma från klienten, SCOPE-KÄRNAN i task-147.1).
 *
 * EN OPERATION BÄR ALLA FYRA ÅTGÄRDSTYPER (bekräftelse/påminnelse/eventinfo/
 * fritt) — `actionType` väljer vilken. TASK-147.2 kopplar bara `bekraftelse`
 * mot denna sändväg; de tre övriga förblir prototyp-simulerade
 * (`AtgardsSida.tsx` § `simuleraUtfall`) tills TASK-147.3.
 *
 * SKIP-SKÄLEN ÄR EN EGEN ENUM, INTE ÅTERANVÄND UR `ConfirmRegistrations.
 * schema.ts`, trots att värdemängden råkar sammanfalla i dag (båda ärver
 * `_shared/confirm-registrations.ts`s golv-lista server-side). De två
 * verticalerna kan divergera oberoende av varandra — att importera en delad
 * typ hade bakat in ett antagande om att de alltid kommer göra det.
 */
export type SendActionEmailInput = {
  actionType: 'bekraftelse' | 'paminnelse' | 'eventinfo' | 'fritt';
  /** Eventet mottagarurvalet är bundet till (Eventplanering record-ID). */
  eventId: string;
  registrationIds: string[];
  /** Redigerad ämnesrad-MALL (kan bära {förnamn}/{event}/{datum}/{ort}/{deadline}). */
  amne: string;
  /** Redigerad brödtext-MALL (samma platshållar-set). */
  mailtext: string;
  /** Klient-genererad UUID v4 — EF:en accepterar den i body (eller header). */
  idempotencyKey: string;
  /**
   * [TASK-147.5, ADR-067 D9] Bilagor valda i väljaren — Bilagor-record-ID:n
   * (INTE bytes). VALFRI, default TOM: frånvaro/tom lista ⇒ servern väljer
   * den bilage-fria batchgrenen AUTOMATISKT (AC #1 — grenvalet lever
   * server-side i `_shared/send-action-email.ts`, klienten behöver inte
   * veta vilken mekanism som används). Icke-tom ⇒ loopad singelsändning
   * med bilagorna bifogade på varje mail.
   */
  attachmentIds?: string[];
};

/** Varför en mottagare hoppades över — server-satt, aldrig gissad i UI:t. */
export const ActionSkipReasonSchema = z.enum(['inactive', 'already_confirmed', 'no_email']);
export type ActionSkipReason = z.infer<typeof ActionSkipReasonSchema>;

/**
 * Serverns utfall — ALDRIG binärt (send-bulk/confirm-registrations D3-formen
 * ärvd av `runActionSend`). `completed` = mottagare som fick BÅDE mail och
 * (om åtgärden har en) fält-skrivning i samma operation (atomicitets-
 * kontraktet, `_shared/send-action-email.ts` § `runActionSend` steg 4).
 */
export const SendActionEmailResultSchema = z.object({
  status: z.enum(['sent', 'partial', 'failed', 'skipped']),
  requested: z.number(),
  attempted: z.number(),
  completed: z.array(z.string()),
  skipped: z.array(z.object({ registrationId: z.string(), reason: ActionSkipReasonSchema })),
  failed: z.array(z.object({ registrationId: z.string(), reason: z.string() })),
});

export type SendActionEmailResult = z.infer<typeof SendActionEmailResultSchema>;

/**
 * [TASK-147.10] "Skicka test till mig" — SAMMA EF (`send-action-email`),
 * SAMMA fem grundfält som `SendActionEmailInput`, plus `testSend: true` som
 * växlar EF:en till testgrenen (`_shared/send-action-email.ts` §
 * `runActionTestSend`). `registrationIds` bär ALLTID exakt ETT ID — den
 * FÖRSTA mottagaren i granskningens urval (T53 väg C / ADR-067 D10: "ett
 * urval på längd 1"). Servern läser upp den anmälan ENDAST för platshållar-
 * data (förnamn m.fl.); adressen mailet går till är alltid den inloggade
 * användarens egen (`requireUser`) — ALDRIG registrationens, ALDRIG
 * klient-buren. Ingen anmälan i urvalet berörs (AC #2): EF:ens testgren har
 * ingen `ActionFieldWriter`-deps, så en fält-skrivning är strukturellt
 * omöjlig härifrån, inte bara oanvänd.
 */
export type SendActionTestEmailInput = {
  actionType: 'bekraftelse' | 'paminnelse' | 'eventinfo' | 'fritt';
  eventId: string;
  /** Längd 1 — den FÖRSTA mottagaren i urvalet. Adressen kontaktas ALDRIG. */
  registrationIds: string[];
  amne: string;
  mailtext: string;
  idempotencyKey: string;
};

/**
 * Testmailets svar — enklare än `SendActionEmailResultSchema` (en mottagare,
 * ingen partitionering, aldrig fält-skrivning): binärt `sent`/`failed` räcker
 * ärligt när urvalet strukturellt bara kan vara längd 1.
 */
export const SendActionTestEmailResultSchema = z.object({
  status: z.enum(['sent', 'failed']),
  reason: z.string().optional(),
});

export type SendActionTestEmailResult = z.infer<typeof SendActionTestEmailResultSchema>;
