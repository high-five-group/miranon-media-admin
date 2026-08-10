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
