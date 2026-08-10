import { z } from 'zod';

/** De tre betalsätten Marcus-beslutet (S102, Implementation Notes a) namnger. */
export const BETALSATT_VARDEN = ['Swish', 'Bankgiro', 'Plusgiro'] as const;
export type Betalsatt = (typeof BETALSATT_VARDEN)[number];

/**
 * [TASK-147.7, ADR-109] Kvittosändningens write-shape och svars-schema —
 * klientens kontrakt mot `send-receipt-email`-EF:en (`supabase/functions/
 * _shared/send-receipt.ts`). SAMMA UPPDELNING som `SendActionEmail.schema.ts`
 * (TASK-147.2): klienten skickar ENDAST registration-/event-ID + de TVÅ
 * fälten basen inte kan härleda (belopp/betalsätt, se `send-receipt-email/
 * index.ts` filhuvud — basen har inget prisfält) + en idempotensnyckel.
 * Adress och kundnamn löses SERVER-SIDE ur Anmälningar (mottagaren kan
 * aldrig komma från klienten).
 */
export type SendReceiptInput = {
  registrationId: string;
  eventId: string;
  betalning: 'avgift' | 'slut';
  /** Kronor, Lotta-inmatat (basen saknar ett prisfält — ADR-109 § Öppna punkter). */
  belopp: number;
  betalsatt: Betalsatt;
  /** Klient-genererad UUID v4 — EF:en accepterar den i body (eller header). */
  idempotencyKey: string;
};

/**
 * Serverns utfall — ALDRIG binärt bara i den meningen att `failed` bär ett
 * skäl (samma disciplin som `SendActionTestEmailResultSchema`): kvittot är
 * per konstruktion EN mottagare, så det finns inget delutfall att partitionera.
 */
export const SendReceiptResultSchema = z.object({
  status: z.enum(['sent', 'failed']),
  kvittonummer: z.string().optional(),
  lopnummer: z.number().optional(),
  ar: z.number().optional(),
  reason: z.string().optional(),
});

export type SendReceiptResult = z.infer<typeof SendReceiptResultSchema>;
