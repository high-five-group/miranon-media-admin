// Resend permissive-batch-svar → normaliserat BatchOutcome (Fas 6h L2d, ADR-067 D3).
// REN (ingen Resend-SDK-import, inga Deno-globaler, inget I/O) → Node-importerbar för
// api-pure enhetstest OCH Deno-importerbar av send-email-EF:ens sender. Isolerar den enda
// Resend-form-specifika mappningen i en egen testbar modul (lager-oberoende): EF:ens sender
// gör nätverksanropet, denna modul tolkar formen.
//
// TASK-111 (2026-08-02): "STEG 0"-observationen nedan kördes mot den då-okända trasiga pinnen
// `esm.sh/resend@4` (→4.8.0), som saknar `batchValidation` helt (0 dist-träffar) — optionen
// nådde aldrig API:et, som därför alltid körde strict. STEG 0 observerade alltså strict-svaret
// för en allt-giltig batch, inte ett genuint permissive-svar. SDK:n bumpad till `resend@6`
// (→6.18.1; optionen finns sedan 6.1.0) löser pin-defekten — källkods-verifierat mot 6.1.0/
// 6.18.1 dist: `"x-batch-validation": options?.batchValidation ?? "strict"`.
//
// Förstaparts-form (resend-node CreateBatchSuccessResponse, permissive — SDK-typ 6.1.0/6.18.1
// + verifierad mot resend.com/changelog/batch-validation-modes exempel):
//   { data: { id: string }[]                        // de GILTIGA raderna (kompakterade)
//     errors: { index: number; message: string }[]  // de OGILTIGA, NOLLBASERAT index + skäl }
// SDK-typen deklarerar `errors` som OBLIGATORISKT (ej `errors?:`) när batchValidation='permissive'
// — STEG 0:s "errors FRÅNVARANDE (undefined), ej tom array" var en övertolkning av ett fönster
// som aldrig körde permissive. `parseBatchOutcome` nedan behandlar `undefined`/`[]` identiskt
// (se `errors = Array.isArray(...) ? ... : []`), så invarianten håller oavsett faktisk form.
// errors = VALIDERINGSfel, ej leverans-utfall; ej live-framkallbart i icke-prod — INTE p.g.a.
// SDK-pinnen (den var separat och nu löst), utan p.g.a. icke-prod-spärren (send-bulk.ts): de
// fyra Resend-test-adresserna är alla välformade och kan aldrig trigga ett `to`-valideringsfel.
// Låses därför fortsatt med fixtur (STEG 2, denna moduls test), nu bevisat mot den väg som
// faktiskt levererar (TASK-111 AC2) — inte längre bara schema-gissad.

import type { BatchOutcome } from './send-bulk.ts';

/** Resend permissive-svarets data-del (det vi tolkar). Bärs som struktur, ej SDK-klass. */
export type ResendBatchData = {
  data?: { id: string }[];
  errors?: { index: number; message: string }[];
};

/**
 * En utgående Resend-email-spec (en CreateEmailOptions per mottagare). Bärs som struktur,
 * ej SDK-klass. `replyTo` (resend-node camelCase, ej REST `reply_to`) är optional.
 */
export type ResendEmailSpec = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Bygg Resend batch-payloaden — en email-spec per mottagare. REN/Node-importerbar (ingen
 * Deno-global, inget I/O), så den enda payload-formen kan api-pure-testas; EF:ens sender
 * läser secrets och gör nätverksanropet. `replyTo` inkluderas ENDAST när en icke-tom sträng
 * ges (secret satt) — saknas/tom → fältet UTELÄMNAS, vilket bevarar nuvarande beteende
 * (Reply-To är optional; endast `from` är obligatorisk, EF:ens 503-väg).
 */
export function buildBatchPayload(
  batch: readonly { email: string }[],
  ctx: { subject: string; html: string; text: string },
  opts: { from: string; replyTo?: string | null },
): ResendEmailSpec[] {
  const replyTo =
    typeof opts.replyTo === 'string' && opts.replyTo.trim().length > 0 ? opts.replyTo : undefined;
  return batch.map((spec) => ({
    from: opts.from,
    to: [spec.email],
    subject: ctx.subject,
    html: ctx.html,
    text: ctx.text,
    ...(replyTo ? { replyTo } : {}),
  }));
}

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
