// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid deploy,
// ej av Node-tsc). Mönster: send-email (6h) + update-event (task-18.1).
import { Resend } from 'https://esm.sh/resend@6';
import { fetchAirtableRecord, updateAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import {
  type ConfirmationSender,
  type ConfirmTarget,
  confirmRegistrations,
  FALT_BEKRAFTELSE_SKICKAD,
  FALT_STATUS,
  parseConfirmOutcome,
  STATUS_BEKRAFTAD,
  type StatusFlipper,
} from '../_shared/confirm-registrations.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import { NonProdAddressError } from '../_shared/send-bulk.ts';

// send-registration-confirmation — bekräftelse-vertikalen (task-18.6, PRD task-18
// beslut 7). Repots sjätte write-vertikal och andra mail-vertikal.
//
// NAMNVALET (öppet bokfört på kortet): verb-substantiv per registrets konvention
// (mark-registration-fee-paid / log-payment-reminder / send-email) — `send-` bär
// mail-handlingen, `-registration-confirmation` objektet. Status-flippen är
// bekräftelsens BOKFÖRING i basen (ORDLISTA: Bekräftad ⟺ bekräftelsen skickad,
// S73 K53), inte en egen handling — därför ETT verb i namnet.
//
// Säkerhets-kontrakt = send-email/create-event EXAKT: POST→405, requireUser→401,
// body-JSON-fel→400, allowlist-SSOT (deny→400), {error}+requestId, central
// mapErrorToResponse. Idempotency-Key (header-företräde + body-fallback + UUIDv4).
//
// MOTTAGARNA LÖSES SERVER-SIDE: klienten skickar ENDAST record-ID:n — adress, namn
// och status läses ur Airtable här. En klient kan därför aldrig styra vem mailet går
// till (samma disciplin som send-emails segment-upplösning).
//
// KONFORMANS-KÄRNAN (partitionering, icke-prod-spärr, atomicitet mail→flip, aldrig
// binär status) bor i den injicerade orkestratorn _shared/confirm-registrations.ts
// (api-pure-testad); HÄR wiras de SKARPA gränserna: Resend-sändningen och
// Airtable-PATCH:en.

const OPERATION_KEY = 'send-registration-confirmation';
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Resend /emails/batch-tak (≤100 mail per anrop) — Bekräfta alla på ett event ligger
// med bred marginal under, men gränsen är hård så en felkallelse inte kan spränga taket.
const MAX_IDS = 100;

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
 * SKARP Resend-sender (lazy — `new Resend(key)` konstrueras ENDAST när RESEND_API_KEY
 * finns, annars distinkt 503-väg). Till skillnad mot bulk-sändningen är VARJE rad sin
 * egen payload med sitt EGET ämne och sin egen text (bekräftelsen är personlig).
 * Svaret tolkas RAD-EXAKT via `parseConfirmOutcome` (api-pure-testad).
 *
 * `batchValidation: 'permissive'` delar send-emails SDK-pin-historia (TASK-111, 2026-08-02):
 * fullständig genomgång + källverifiering av `resend@4`→`resend@6`-bumpen bor i
 * send-email/index.ts:s `makeRealBatchSender`-header — duplicerad inte här.
 */
function makeRealSender(): ConfirmationSender {
  return async (specs, ctx) => {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      const err = new Error('RESEND_API_KEY not set — send unavailable');
      err.name = 'ResendNotConfiguredError';
      throw err;
    }
    const from = Deno.env.get('RESEND_FROM');
    if (!from) {
      const err = new Error('RESEND_FROM not set');
      err.name = 'ResendNotConfiguredError';
      throw err;
    }
    const replyTo = Deno.env.get('RESEND_REPLY_TO');
    const resend = new Resend(apiKey);
    const payload = specs.map((s) => ({
      from,
      to: [s.email],
      subject: s.subject,
      html: s.html,
      text: s.text,
      ...(replyTo && replyTo.trim() ? { replyTo } : {}),
    }));
    const { data, error } = await resend.batch.send(payload, {
      idempotencyKey: ctx.idempotencyKey,
      batchValidation: 'permissive',
    });
    if (error) {
      // Top-level batch-fel (hela anropet) → hela urvalet avvisat (no-throw inspektion).
      return {
        accepted: [],
        rejected: specs.map((s) => ({ registrationId: s.registrationId, reason: error.message })),
      };
    }
    return parseConfirmOutcome(specs, data);
  };
}

/** SKARP status-flip: PATCH Anmälningar med allowlist-SSOT-grind före Airtable-anropet. */
function makeRealFlipper(callerUserId: string): StatusFlipper {
  return async (registrationId, tidpunkt) => {
    const operation = getOperation(OPERATION_KEY);
    if (!operation) throw new Error(`Unknown operation: ${OPERATION_KEY}`);

    const fields: Record<string, unknown> = {
      [FALT_STATUS]: STATUS_BEKRAFTAD,
      [FALT_BEKRAFTELSE_SKICKAD]: tidpunkt,
    };

    // SSOT-grind (defense-in-depth): varje server-byggt fält måste vara allowlistat.
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[${OPERATION_KEY}] DENY field not in allowlist | caller_user_id=${callerUserId} | field=${disallowed}`,
      );
      throw new Error(`Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`);
    }

    await updateAirtableRecord(operation.tableId, registrationId, fields);
  };
}

/** Läs upp EN anmälan server-side → orkestratorns target-shape. null = finns inte. */
async function readTarget(tableId: string, id: string): Promise<ConfirmTarget | null> {
  const record = await fetchAirtableRecord(tableId, id);
  if (!record) return null;
  const f = record.fields;
  return {
    id: record.id,
    email: scalarString(f['E-post']),
    namn: scalarString(f['Namn']) ?? scalarString(f['Förnamn']),
    status: selectName(f['Status'] ?? null),
    // 'Event (namn)' är lookup → array; scalarString plockar första skalären.
    eventNamn: scalarString(f['Event (namn)']),
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

  let body: Record<string, unknown> | null;
  try {
    body = (await req.json()) as Record<string, unknown> | null;
  } catch {
    return badRequest('Invalid JSON body', corsHeaders);
  }

  // Input-validering (deny-by-default): registrationIds = icke-tom array av rec-ID:n.
  const registrationIds = body?.registrationIds;
  if (
    !Array.isArray(registrationIds) ||
    registrationIds.length === 0 ||
    !registrationIds.every((s) => typeof s === 'string' && s.startsWith('rec'))
  ) {
    return badRequest(
      'registrationIds is required (non-empty array of Anmälningar record-IDs, rec-prefix)',
      corsHeaders,
    );
  }
  if (registrationIds.length > MAX_IDS) {
    return badRequest(`registrationIds exceeds max ${MAX_IDS} per request`, corsHeaders);
  }
  // Dubbletter kollapsas — samma anmälan två gånger i samma anrop är ett klient-misstag,
  // inte två mail.
  const ids = [...new Set(registrationIds as string[])];

  // Idempotency-Key (jobId): header-företräde + body-fallback + UUIDv4 (send-email-mönstret).
  const jobId =
    req.headers.get('Idempotency-Key') ??
    (typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : '');
  if (!jobId) {
    console.warn(`[${OPERATION_KEY}] DENY missing idempotency key | caller_user_id=${user.id}`);
    return badRequest('Idempotency-Key is required (header or body)', corsHeaders);
  }
  if (!UUID_V4_RE.test(jobId)) {
    console.warn(`[${OPERATION_KEY}] DENY malformed idempotency key | caller_user_id=${user.id}`);
    return badRequest('Idempotency-Key must be a UUID v4', corsHeaders);
  }

  const operation = getOperation(OPERATION_KEY);
  if (!operation) {
    return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
  }

  // Fail-closed icke-prod-detektion: endast ENVIRONMENT==='production' är prod.
  const isProd = Deno.env.get('ENVIRONMENT') === 'production';

  try {
    // Mottagar-upplösning SERVER-SIDE (record-ID → adress/namn/status). Okänt ID → 404
    // (get-event/get-person-kontraktet) — aldrig 500, aldrig tyst hoppa över.
    const targets: ConfirmTarget[] = [];
    for (const id of ids) {
      const target = await readTarget(operation.tableId, id);
      if (!target) {
        return jsonResponse({ error: `Registration not found: ${id}` }, 404, corsHeaders);
      }
      targets.push(target);
    }

    const result = await confirmRegistrations(
      { targets, jobId, isProd, nu: new Date().toISOString() },
      { sender: makeRealSender(), flipStatus: makeRealFlipper(user.id) },
    );

    console.log(
      `[${OPERATION_KEY}] DONE | caller_user_id=${user.id} | jobId=${jobId} | status=${result.status} | ` +
        `requested=${result.requested} attempted=${result.attempted} confirmed=${result.confirmed.length} ` +
        `skipped=${result.skipped.length} failed=${result.failed.length}`,
    );
    return jsonResponse(result, 200, corsHeaders);
  } catch (error) {
    if (error instanceof NonProdAddressError) {
      console.warn(
        `[${OPERATION_KEY}] NONPROD-GUARD REFUSED | caller_user_id=${user.id} | offending=${error.offending.length}`,
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
      function: OPERATION_KEY,
      method: req.method,
      callerUserId: user.id,
    });
  }
});
