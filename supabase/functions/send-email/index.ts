// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid deploy,
// ej av Node-tsc). Mönster: create-event (6f) säkerhets-/idempotens-kontrakt.
import { Resend } from 'https://esm.sh/resend@4';
import { upsertAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import { parseBatchOutcome } from '../_shared/resend-batch.ts';
import { resolveSegmentMembers, SegmentNotResolvableError } from '../_shared/segment-resolution.ts';
import {
  type BatchOutcome,
  type BatchSender,
  type LogWriter,
  NonProdAddressError,
  runBulkSend,
} from '../_shared/send-bulk.ts';

// send-email — bulk-mail på segment (Fas 6h, ADR-067). Repots fjärde write-vertikal.
// Säkerhets-kontrakt = create-event EXAKT: POST→405, requireUser→401, body-JSON-fel→400,
// allowlist-SSOT (deny→400), {error}+requestId, central mapErrorToResponse. Idempotency-Key
// (header-företräde + body-fallback + UUIDv4) som jobId (ADR-067 D4). Mottagar-upplösning
// SERVER-SIDE via _shared/segment-resolution.ts (segmentIds→union); ALDRIG klient-lista.
// Konformans-kärnan (consent/dedup/chunk/status/icke-prod-spärr) bor i den injicerade
// orkestratorn _shared/send-bulk.ts (api-pure-testad); HÄR wiras de SKARPA gränserna.

const OPERATION_KEY = 'send-email';
const MERGE_FIELD = 'Idempotensnyckel';
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return jsonResponse({ error: message }, 400, corsHeaders);
}

/**
 * SKARP Resend-sender (lazy). Konstruerar `new Resend(key)` ENDAST när RESEND_API_KEY
 * finns — annars distinkt 503-väg (läge 1: ingen nyckel). batch.send([...], { idempotencyKey,
 * batchValidation: 'permissive' }).
 *
 * L2c-PIN UPPLÖST (L2d, STEG 0 strukturobservation mot resolverad resend@4 + förstaparts-
 * SDK-typ CreateBatchSuccessResponse):
 *   permissive-svaret = { data: { id }[]  (de GILTIGA, kompakterade)
 *                         errors?: { index: number; message: string }[]  (de OGILTIGA, med
 *                                  NOLLBASERAT index i originalpayloaden + skäl) }
 *   — `errors` är FRÅNVARANDE (undefined), ej tom array, när inget rad-fel finns
 *   (STEG 0-observerat: dataKeys=["data"], errorsValue=undefined vid 2/2 giltiga).
 *   errors-fel = VALIDERINGSfel (ej leverans-utfall); de är ej live-framkallbara i icke-prod
 *   (spärren blockerar utlösande input) → branschen låses med fixtur (L2d STEG 2), schema-
 *   bekräftad mot Resend-doc.
 *
 * Parsning är RAD-EXAKT via index (ej via data.data-ordningen — den är kompakterad och bär
 * bara id, ej e-post): rejected härleds ur errors[].index → batch[index].email; accepted är
 * index-komplementet. Cross-check: |accepted| måste == data.data.length (annars struktur-drift
 * → varna, men lita på index-komplementet som auktoritativt).
 */
function makeRealBatchSender(): BatchSender {
  return async (batch, ctx): Promise<BatchOutcome> => {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      const err = new Error('RESEND_API_KEY not set — send unavailable (läge 1)');
      err.name = 'ResendNotConfiguredError';
      throw err;
    }
    const from = Deno.env.get('RESEND_FROM');
    if (!from) {
      const err = new Error('RESEND_FROM not set');
      err.name = 'ResendNotConfiguredError';
      throw err;
    }
    const resend = new Resend(apiKey);
    const payload = batch.map((spec) => ({
      from,
      to: [spec.email],
      subject: ctx.subject,
      html: ctx.html,
      text: ctx.text,
    }));
    const { data, error } = await resend.batch.send(payload, {
      idempotencyKey: ctx.idempotencyKey,
      batchValidation: 'permissive',
    });
    if (error) {
      // Top-level batch-fel (hela anropet) → hela batchen avvisad (no-throw inspektion).
      return { accepted: [], rejected: batch.map((s) => ({ email: s.email, reason: error.message })) };
    }
    return parseBatchOutcome(batch, data);
  };
}

/** SKARP Utskickslogg-merge-writer (allowlist-SSOT + upsert på Idempotensnyckel=jobId). */
function makeRealLogWriter(corsHeaders: Record<string, string>, callerUserId: string): LogWriter {
  return async (entry): Promise<string> => {
    const operation = getOperation(OPERATION_KEY);
    if (!operation) throw new Error(`Unknown operation: ${OPERATION_KEY}`);

    const fields: Record<string, unknown> = {
      'Namn på utskick': entry.amne,
      'Skickat till': entry.acceptedPersonIds, // record-ID-array → Personer
      'Filter snapshot': entry.filterSnapshot,
      'Mailutskick copy': `${entry.amne}\n\n${entry.mailtext}`,
      [MERGE_FIELD]: entry.jobId,
    };

    // SSOT-grind (defense-in-depth): varje server-byggt fält måste vara allowlistat.
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[send-email] DENY field not in allowlist | caller_user_id=${callerUserId} | field=${disallowed}`,
      );
      throw new Error(`Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`);
    }

    const { record } = await upsertAirtableRecord(operation.tableId, fields, [MERGE_FIELD]);
    return record.id;
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405, corsHeaders);
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  // Body-parsning (felformad JSON → 400).
  let body: Record<string, unknown> | null;
  try {
    body = (await req.json()) as Record<string, unknown> | null;
  } catch {
    return badRequest('Invalid JSON body', corsHeaders);
  }

  // Input-validering (deny-by-default). segmentIds (icke-tom string-array) / amne / mailtext.
  // antalMottagare ignoreras MEDVETET — EF:en löser antal server-side (litar ej på klient).
  const segmentIds = body?.segmentIds;
  if (
    !Array.isArray(segmentIds) ||
    segmentIds.length === 0 ||
    !segmentIds.every((s) => typeof s === 'string' && s.trim().length > 0)
  ) {
    return badRequest('segmentIds is required (non-empty array of record-id strings)', corsHeaders);
  }
  if (typeof body?.amne !== 'string' || !body.amne.trim()) {
    return badRequest('amne is required (non-empty string)', corsHeaders);
  }
  if (typeof body?.mailtext !== 'string' || !body.mailtext.trim()) {
    return badRequest('mailtext is required (non-empty string)', corsHeaders);
  }
  const amne = body.amne.trim();
  const mailtext = body.mailtext;

  // Idempotency-Key (jobId): header-företräde + body-fallback + UUIDv4 (create-event-mönstret).
  const jobId =
    req.headers.get('Idempotency-Key') ??
    (typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : '');
  if (!jobId) {
    console.warn(`[send-email] DENY missing idempotency key | caller_user_id=${user.id}`);
    return badRequest('Idempotency-Key is required (header or body)', corsHeaders);
  }
  if (!UUID_V4_RE.test(jobId)) {
    console.warn(`[send-email] DENY malformed idempotency key | caller_user_id=${user.id}`);
    return badRequest('Idempotency-Key must be a UUID v4', corsHeaders);
  }

  // Fail-closed icke-prod-detektion: endast ENVIRONMENT==='production' är prod.
  const isProd = Deno.env.get('ENVIRONMENT') === 'production';

  try {
    // Mottagar-upplösning SERVER-SIDE (segmentIds → union-medlemmar). Okänt/legacy → 400.
    const members = await resolveSegmentMembers(segmentIds as string[]);

    const status = await runBulkSend(
      {
        members,
        amne,
        mailtext,
        jobId,
        isProd,
        filterSnapshot: `segmentIds: ${(segmentIds as string[]).join(', ')}`,
      },
      {
        batchSender: makeRealBatchSender(),
        writeLog: makeRealLogWriter(corsHeaders, user.id),
      },
    );

    console.log(
      `[send-email] DONE | caller_user_id=${user.id} | jobId=${jobId} | status=${status.status} | ` +
        `attempted=${status.attempted} accepted=${status.accepted} rejected=${status.rejected}`,
    );
    return jsonResponse(status, 200, corsHeaders);
  } catch (error) {
    // Distinkta klient-fel-vägar före generisk 500.
    if (error instanceof SegmentNotResolvableError) {
      return badRequest(error.message, corsHeaders);
    }
    if (error instanceof NonProdAddressError) {
      console.warn(
        `[send-email] NONPROD-GUARD REFUSED | caller_user_id=${user.id} | offending=${error.offending.length}`,
      );
      return jsonResponse(
        { error: error.message, code: 'non_prod_address_refused', offending: error.offending },
        422,
        corsHeaders,
      );
    }
    if (error instanceof Error && error.name === 'ResendNotConfiguredError') {
      return jsonResponse({ error: error.message, code: 'resend_not_configured' }, 503, corsHeaders);
    }
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'send-email',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
