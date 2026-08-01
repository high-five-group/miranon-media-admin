// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid deploy,
// ej av Node-tsc). Mönster: create-event (6f) säkerhets-/idempotens-kontrakt.
import { Resend } from 'https://esm.sh/resend@6';
import { upsertAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import { buildBatchPayload, parseBatchOutcome } from '../_shared/resend-batch.ts';
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
 * L2c-PIN-KOMMENTAREN HÄR VAR FALSIFIERAD (TASK-111, 2026-08-02) — RÄTTAD:
 * "UPPLÖST" var fel. STEG 0 observerade `resolverad resend@4` (→4.8.0), och 4.8.0 saknar
 * `batchValidation` HELT (0 träffar i dist-typer/js/README) — optionen spreadas in i
 * fetch-init där okända medlemmar släpps tyst, når aldrig headern. API:et körde alltså
 * ALLTID strict, oavsett vad koden bad om; STEG 0:s "permissive-svar" var i själva verket
 * default-strict-svaret för en allt-giltig batch — identiskt i båda lägena (samma fälla
 * `resend-batch.ts` beskriver). `errors`-parsningsvägen nedan var därför onåbar i produktion.
 *
 * FAKTISK LÖSNING: SDK-importen bumpad `resend@4` → `resend@6` (esm.sh flytande major-pin,
 * resolverar idag 6.18.1; `batchValidation` introducerades i 6.1.0 2025-09-15, GitHub-release
 * `resend/resend-node#599`). Källkods-verifierat (ej bara doc-trott) genom att packa ned och
 * läsa `dist/index.js` för 6.1.0 OCH 6.18.1: `"x-batch-validation": options?.batchValidation ??
 * "strict"` — optionen sätter nu genuint headern. 4.8.0 packad och läst parallellt: 0 träffar,
 * bekräftar den gamla defekten. Breaking-changes-genomgång 4→6 (GitHub releases v5.0.0/v6.0.0):
 * endast `react`-options-peer-dep (v5) och attachment-`contentId`-namnbyte (v6, preview-fält) —
 * ingen av EF:ens ytor (`batch.send`, `replyTo`, `{data,error}`-svaret) berörs. 6.1.0→6.18.1
 * innehåller noll BREAKING-märkta releaser (endast additiva: tags/scheduledAt i batch-options,
 * suppressions-API).
 *
 * PERMISSIVE-SVARSFORMEN (verifierad mot resend.com/changelog/batch-validation-modes exempel +
 * SDK-typen `CreateBatchSuccessResponse` i 6.1.0/6.18.1, ej längre bara "schema-bekräftad"):
 *   permissive-svaret = { data: { id }[]  (de GILTIGA, kompakterade)
 *                         errors: { index: number; message: string }[]  (de OGILTIGA, med
 *                                 NOLLBASERAT index i originalpayloaden + skäl) }
 *   SDK-TYPEN deklarerar `errors` som OBLIGATORISKT fält (ej `errors?:`) när `batchValidation`
 *   är `'permissive'` — STEG 0:s tolkning ("errors FRÅNVARANDE, ej tom array") var därför också
 *   en övertolkning av ett observationsfönster som aldrig körde permissive på riktigt.
 *   `resend-batch.ts#parseBatchOutcome` behandlar redan `undefined` och `[]` identiskt (ingen
 *   kodändring krävdes), så invarianten håller oavsett vilken av de två formerna API:et ger.
 *   errors-fel = VALIDERINGSfel (ej leverans-utfall); de är ej live-framkallbara i icke-prod —
 *   INTE p.g.a. SDK-pinnen (den var separat), utan p.g.a. icke-prod-spärren (send-bulk.ts): varje
 *   upplöst adress måste vara en Resend-test-adress, och de fyra är alla välformade → kan aldrig
 *   trigga en `to`-fält-valideringsfel. Branschen låses därför fortsatt med fixtur (L2d STEG 2,
 *   tests/api/resend-batch.test.ts), nu bevisat mot den väg som faktiskt levererar (TASK-111 AC2).
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
    // Reply-To är OPTIONAL (speglar RESEND_FROM-läsningen men kastar ej): satt → inkluderas
    // i varje payload-rad; saknas → utelämnas (nuvarande beteende bevaras).
    const replyTo = Deno.env.get('RESEND_REPLY_TO');
    const resend = new Resend(apiKey);
    const payload = buildBatchPayload(
      batch,
      { subject: ctx.subject, html: ctx.html, text: ctx.text },
      { from, replyTo },
    );
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
