// Resend permissive-batch-svar → normaliserat BatchOutcome (Fas 6h L2d, ADR-067 D3).
// REN (ingen Resend-SDK-import, inga Deno-globaler, inget I/O) → Node-importerbar för
// api-pure enhetstest OCH Deno-importerbar av send-email-EF:ens sender. Isolerar den enda
// Resend-form-specifika mappningen i en egen testbar modul (lager-oberoende): EF:ens sender
// gör nätverksanropet, denna modul tolkar formen.
//
// Förstaparts-form (resend-node CreateBatchSuccessResponse, permissive — L2d STEG 0 + SDK-typ):
//   { data: { id: string }[]                         // de GILTIGA raderna (kompakterade)
//     errors?: { index: number; message: string }[]  // de OGILTIGA, NOLLBASERAT index + skäl }
// `errors` är FRÅNVARANDE (undefined), ej tom array, när inget rad-fel finns (STEG 0-observerat).
// errors = VALIDERINGSfel, ej leverans-utfall; ej live-framkallbart i icke-prod (spärren
// blockerar utlösande input) → låses med fixtur (STEG 2), schema-bekräftad mot Resend-doc.

import type { BatchOutcome } from './send-bulk.ts';

/** Resend permissive-svarets data-del (det vi tolkar). Bärs som struktur, ej SDK-klass. */
export type ResendBatchData = {
  data?: { id: string }[];
  errors?: { index: number; message: string }[];
};

/**
 * Permissive-svar → rad-exakt BatchOutcome. rejected härleds ur `errors[].index`
 * (→ batch[index].email); accepted är index-KOMPLEMENTET — rad-exakt och OBEROENDE av
 * data.data-ordningen (den är kompakterad och bär bara id, ej e-post). Defensiv invariant:
 * |accepted| ska == data.data.length; vid avvikelse varnas (struktur-drift) men index-
 * komplementet är auktoritativt. Fabricerar aldrig en e-post vid index utanför intervall.
 */
export function parseBatchOutcome(
  batch: readonly { email: string }[],
  data: ResendBatchData | null | undefined,
): BatchOutcome {
  const errors = Array.isArray(data?.errors) ? data.errors : [];
  const rejectedIdx = new Set<number>();
  const rejected: { email: string; reason: string }[] = [];
  for (const e of errors) {
    const idx = typeof e?.index === 'number' ? e.index : -1;
    const reason =
      typeof e?.message === 'string' && e.message.length > 0 ? e.message : 'Resend validation error';
    if (idx >= 0 && idx < batch.length) {
      rejectedIdx.add(idx);
      rejected.push({ email: batch[idx].email, reason });
    } else {
      // Index utanför intervall (struktur-drift) — fäll synligt, fabricera ingen e-post.
      console.warn(`[resend-batch] errors[].index utanför intervall: ${idx} (batch=${batch.length})`);
      rejected.push({ email: '(okänd — index utanför intervall)', reason });
    }
  }
  const accepted = batch.filter((_, i) => !rejectedIdx.has(i)).map((s) => ({ email: s.email }));

  // Defensiv invariant: de GILTIGA (data.data) ska vara lika många som index-komplementet.
  const validCount = Array.isArray(data?.data) ? data.data.length : null;
  if (validCount !== null && validCount !== accepted.length) {
    console.warn(
      `[resend-batch] struktur-drift: data.data.length=${validCount} != accepted=${accepted.length} ` +
        `(rejected=${rejected.length}, batch=${batch.length}) — litar på index-komplementet`,
    );
  }
  return { accepted, rejected };
}
