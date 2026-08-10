// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid deploy,
// ej av Node-tsc). Mönster: send-registration-confirmation (task-18.6) + send-email (6h).
import { Resend } from 'https://esm.sh/resend@6';
import { fetchAirtableRecord, updateAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import {
  type ActionSender,
  type ActionTarget,
  type ActionType,
  type EventContext,
  isActionType,
  parseActionOutcome,
  runActionSend,
} from '../_shared/send-action-email.ts';
import { NonProdAddressError } from '../_shared/send-bulk.ts';

// send-action-email — åtgärdsutskickens sändväg (TASK-147.1, ADR-067-revisionen).
// Repots SJUNDE write-vertikal, TREDJE mail-vertikal.
//
// EN EF, FYRA ÅTGÄRDSTYPER (bekräftelse/påminnelse/eventinfo/fritt): kontraktet är
// GENERISKT så 147.2 (bekräftelse) och 147.3 (de tre övriga) kopplar UI:t till
// SAMMA sändväg utan att duplicera säkerhets-/idempotens-/icke-prod-mönstren.
//
// Säkerhets-kontrakt = send-registration-confirmation/send-email EXAKT: POST→405,
// requireUser→401, body-JSON-fel→400, allowlist-SSOT (deny→400), {error}+requestId,
// central mapErrorToResponse. Idempotency-Key (header-företräde + body-fallback +
// UUIDv4) som jobId.
//
// MOTTAGARNA LÖSES SERVER-SIDE: klienten skickar ENDAST registration-ID:n (INTE
// segmentIds — SCOPE-KÄRNAN, åtgärdssidans urval är event-bundna anmälningar,
// task-147 § Implementationsbeslut) + eventId. Adress, förnamn, status och
// betalningsläge läses ur Airtable här. En klient kan därför aldrig styra vem
// mailet går till eller vad basen tror hände.
//
// EVENT-BUNDENHETEN VERIFIERAS SERVER-SIDE (fail-closed): varje registrationId
// måste höra till DET angivna eventId:t — annars 400, aldrig en tyst sändning
// till fel kontext.
//
// KONFORMANS-KÄRNAN (partitionering, icke-prod-spärr, atomicitet mail→fält,
// aldrig binär status, per-typ stämpel-fält) bor i den injicerade orkestratorn
// _shared/send-action-email.ts (api-pure-testad); HÄR wiras de SKARPA gränserna:
// Resend-sändningen och Airtable-läsningen/-PATCH:en.

const OPERATION_KEY = 'send-action-email';
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REGISTRATIONS_TABLE = 'Anmälningar';
const EVENTS_TABLE = 'Eventplanering';
const REC_ID_RE = /^rec[A-Za-z0-9]+$/;
// Resend /emails/batch-tak (≤100 mail per anrop) — ett åtgärdsurval på EN
// eventsida ligger med bred marginal under, men gränsen är hård så en
// felkallelse inte kan spränga taket (send-registration-confirmation-mönstret).
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
 * SKARP Resend-sender (lazy — `new Resend(key)` konstrueras ENDAST när
 * RESEND_API_KEY finns, annars distinkt 503-väg). Varje rad är sin egen payload
 * med sitt EGET ämne och sin egen text (åtgärdsmailet är personligt — platshållarna
 * fylls per mottagare i orkestratorn INNAN sändaren nås). Svaret tolkas RAD-EXAKT
 * via `parseActionOutcome` (= confirm-registrations.ts:s TASK-111 AC2-bevisade
 * `parseConfirmOutcome`, återanvänd oförändrad).
 *
 * `batchValidation: 'permissive'` delar send-emails/send-registration-confirmations
 * SDK-pin-historia (TASK-111, 2026-08-02) — fullständig genomgång bor i
 * send-email/index.ts:s `makeRealBatchSender`-header, ej duplicerad här.
 */
function makeRealSender(): ActionSender {
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
    return parseActionOutcome(specs, data);
  };
}

/** SKARP fält-write: PATCH Anmälningar med allowlist-SSOT-grind före Airtable-anropet. */
function makeRealFieldWriter(callerUserId: string) {
  return async (registrationId: string, fields: Record<string, unknown>): Promise<void> => {
    const operation = getOperation(OPERATION_KEY);
    if (!operation) throw new Error(`Unknown operation: ${OPERATION_KEY}`);

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

/** Länk-fältets record-ID-array (frånvarande/ickearray → tom) — get-event-mönstret. */
function linkedIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** Läs upp EN anmälan server-side → orkestratorns target-shape + dess Event-länk. */
async function readRegistration(
  id: string,
): Promise<{ target: ActionTarget; eventIds: string[] } | null> {
  const record = await fetchAirtableRecord(REGISTRATIONS_TABLE, id);
  if (!record) return null;
  const f = record.fields;
  return {
    target: {
      id: record.id,
      email: scalarString(f['E-post']),
      fornamn: scalarString(f['Förnamn']),
      status: selectName(f['Status'] ?? null),
      anmalningsavgift: selectName(f['Anmälningsavgift'] ?? null),
      slutbetalning: selectName(f['Slutbetalning'] ?? null),
    },
    eventIds: linkedIds(f['Event (länk)']),
  };
}

/** Läs upp eventet — bär de fyra platshållarna {event}/{ort}/{datum}/{deadline}. */
async function readEvent(id: string): Promise<EventContext | null> {
  const record = await fetchAirtableRecord(EVENTS_TABLE, id);
  if (!record) return null;
  const f = record.fields;
  return {
    eventNamn: selectName(f['Event (source)']), // singleSelect — get-event/get-events-mönstret
    ort: scalarString(f['Ort']),
    startdatum: typeof f['Startdatum'] === 'string' ? f['Startdatum'] : null,
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

  // Input-validering (deny-by-default).
  const actionType = body?.actionType;
  if (!isActionType(actionType)) {
    return badRequest(
      "actionType is required (one of: 'bekraftelse', 'paminnelse', 'eventinfo', 'fritt')",
      corsHeaders,
    );
  }

  const eventId = body?.eventId;
  if (typeof eventId !== 'string' || !REC_ID_RE.test(eventId)) {
    return badRequest('eventId is required (Eventplanering record-ID, rec-prefix)', corsHeaders);
  }

  const registrationIds = body?.registrationIds;
  if (
    !Array.isArray(registrationIds) ||
    registrationIds.length === 0 ||
    !registrationIds.every((s) => typeof s === 'string' && REC_ID_RE.test(s))
  ) {
    return badRequest(
      'registrationIds is required (non-empty array of Anmälningar record-IDs, rec-prefix)',
      corsHeaders,
    );
  }
  if (registrationIds.length > MAX_IDS) {
    return badRequest(`registrationIds exceeds max ${MAX_IDS} per request`, corsHeaders);
  }
  // Dubbletter kollapsas — samma anmälan två gånger i samma anrop är ett klient-
  // misstag, inte två mail (send-registration-confirmation-mönstret).
  const ids = [...new Set(registrationIds as string[])];

  if (typeof body?.amne !== 'string' || !body.amne.trim()) {
    return badRequest('amne is required (non-empty string)', corsHeaders);
  }
  if (typeof body?.mailtext !== 'string' || !body.mailtext.trim()) {
    return badRequest('mailtext is required (non-empty string)', corsHeaders);
  }
  const amne = body.amne;
  const mailtext = body.mailtext;

  // Idempotency-Key (jobId): header-företräde + body-fallback + UUIDv4.
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
    // Eventet — 404 om okänt (get-event-kontraktet, aldrig 500).
    const event = await readEvent(eventId);
    if (!event) {
      return jsonResponse({ error: `Event not found: ${eventId}` }, 404, corsHeaders);
    }

    // Mottagar-upplösning SERVER-SIDE (record-ID → adress/namn/status/betalning).
    // Okänt ID → 404; känt men FEL event → 400 (fail-closed, aldrig en tyst
    // sändning till fel kontext — SCOPE-KÄRNAN: urvalet är event-bundet).
    const targets: ActionTarget[] = [];
    for (const id of ids) {
      const read = await readRegistration(id);
      if (!read) {
        return jsonResponse({ error: `Registration not found: ${id}` }, 404, corsHeaders);
      }
      if (!read.eventIds.includes(eventId)) {
        return badRequest(
          `Registration ${id} does not belong to event ${eventId}`,
          corsHeaders,
        );
      }
      targets.push(read.target);
    }

    const result = await runActionSend(
      {
        actionType: actionType as ActionType,
        targets,
        event,
        amne,
        mailtext,
        jobId,
        isProd,
        nu: new Date().toISOString(),
      },
      {
        sender: makeRealSender(),
        writeFields: makeRealFieldWriter(user.id),
      },
    );

    console.log(
      `[${OPERATION_KEY}] DONE | caller_user_id=${user.id} | jobId=${jobId} | actionType=${actionType} | ` +
        `status=${result.status} | requested=${result.requested} attempted=${result.attempted} ` +
        `completed=${result.completed.length} skipped=${result.skipped.length} failed=${result.failed.length}`,
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
