// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid deploy,
// ej av Node-tsc). Mönster: send-registration-confirmation (task-18.6) + send-email (6h).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@6';
import { fetchAirtableRecord, updateAirtableRecord } from '../_shared/airtable-client.ts';
import { BILAGOR_BUCKET_ID, BILAGOR_TABLE, toBase64 } from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import {
  type ActionSender,
  type ActionSingleSender,
  type ActionTarget,
  type ActionType,
  type AttachmentPayload,
  type AttachmentReader,
  deriveContentType,
  type EventContext,
  isActionType,
  mapRegistrationFields,
  parseActionOutcome,
  type ResolvedAttachment,
  runActionSend,
  runActionTestSend,
} from '../_shared/send-action-email.ts';
import { isUtskickSparrat, NonProdAddressError, UtskickSparratError } from '../_shared/send-bulk.ts';

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
//
// TESTMAIL-GRENEN (TASK-147.10, ADR-067 D10/T53 väg C): body.testSend === true
// grenar mot `runActionTestSend` i stället för `runActionSend` — SAMMA EF, SAMMA
// input-kontrakt (actionType/eventId/registrationIds/amne/mailtext/idempotencyKey),
// ingen ny gren att underhålla parallellt. Skillnaden: EN mottagare (FÖRSTA
// registrationId — endast platshållar-data), adressen ÖVERSKRIVS ALLTID med
// `user.email` (den autentiserade anroparens egen, `requireUser`), TEST-prefixad
// ämnesrad, och INGEN fält-skrivning sker — urvalets anmälan lämnas ORÖRD.
// Bär INGA bilagor — attachmentIds ignoreras strukturellt i testmail-grenen
// (T53/ADR-067 D10-scopet är diagnostik, inte den handling AC #1/#2 gäller).
//
// BILAGE-VALET (TASK-147.5, ADR-067 D9): additivt `attachmentIds` i body —
// klienten skickar Bilagor-record-ID:n (INTE bytes, INTE en storage-path).
// `resolveAttachments` (nedan) löser dem SERVER-SIDE (existens/event-ägarskap/
// Lagringsnyckel-närvaro) INNAN orkestratorn nås; TOM/frånvarande lista ⇒
// `runActionSend` väljer den bilage-fria batchgrenen AUTOMATISKT (AC #1 —
// grenvalet lever i `_shared/send-action-email.ts`, inte här). Icke-tom lista
// ⇒ loopad singelsändning, ETT `/emails`-anrop per mottagare
// (`makeRealSingleSender`), bytesen hämtade EN gång ur Supabase Storage
// (`makeRealAttachmentReader`) och delade av alla mottagare — klass A
// (uppladdad, TASK-146.4) och klass B (event-mallad, TASK-146.5) sändbara;
// klass C (kvitto, ej byggd) är strukturellt frånvarande ur Bilagor-tabellen
// och kan alltså inte väljas än.

const OPERATION_KEY = 'send-action-email';
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REGISTRATIONS_TABLE = 'Anmälningar';
const EVENTS_TABLE = 'Eventplanering';
const REC_ID_RE = /^rec[A-Za-z0-9]+$/;
// Resend /emails/batch-tak (≤100 mail per anrop) — ett åtgärdsurval på EN
// eventsida ligger med bred marginal under, men gränsen är hård så en
// felkallelse inte kan spränga taket (send-registration-confirmation-mönstret).
const MAX_IDS = 100;
// [TASK-147.5] Hård gräns på bilageväljarens urval — samma "gränsen är hård
// så en felkallelse inte kan spränga taket"-motiv som MAX_IDS. Resends
// 40 MB/mail-tak (efter bas64) är den verkliga begränsningen; detta talet
// är en tidig, billig avvisning innan Storage/Resend ens nås. REC_ID_RE
// (nedan) återanvänds för attachmentIds-formen — samma record-ID-form som
// registrationIds/eventId.
const MAX_ATTACHMENTS = 5;

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

/**
 * [TASK-147.5, ADR-067 D9] SKARP singel-sender — Resends `/emails` (INTE
 * `/emails/batch`, som strukturellt inte stödjer bilagor, se
 * `_shared/send-action-email.ts` § `ActionSingleSender`). En rad = ett
 * `resend.emails.send()`-anrop, med `attachments[].content` som en BAS64-
 * STRÄNG (Resends HTTP-API accepterar "a buffer eller Base64 string" —
 * strängformen sidesteppar frågan om Deno-global `Buffer` helt, se
 * docs/research/utskicks-bilage-arkitektur-2026-08-03.md § Delfråga 1,
 * bekräftat mot Resend Node-SDK:ns egen typedefinition via context7,
 * `interface Attachment { content?: string | Buffer; … }`).
 *
 * `resend.emails.send()` kastar INTE för radfel (samma no-throw-inspektion
 * som `makeRealSender` ovan) — `{data, error}` inspekteras.
 */
function makeRealSingleSender(): ActionSingleSender {
  return async (spec, ctx) => {
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
    const { error } = await resend.emails.send(
      {
        from,
        to: [spec.email],
        subject: spec.subject,
        html: spec.html,
        text: spec.text,
        attachments: ctx.attachments.map((a) => ({
          filename: a.filename,
          content: a.contentBase64,
          contentType: deriveContentType(a.filename),
        })),
        ...(replyTo && replyTo.trim() ? { replyTo } : {}),
      },
      { idempotencyKey: ctx.idempotencyKey },
    );
    if (error) {
      return { accepted: false, reason: error.message };
    }
    return { accepted: true };
  };
}

/**
 * [TASK-147.5] SKARP Storage-läsare — service-role `.download()` (samma
 * förhöjd-behörighet-mönster som generate-event-attachment/index.ts,
 * `create-admin-user`-precedenten, se docs/research/utskicks-bilage-
 * arkitektur-2026-08-03.md § Delfråga 2 väg (a)). Path deriveras
 * DETERMINISTISKT ur `eventId` + den redan RESOLVED `lagringsnyckel`
 * (validerad av `resolveAttachments` innan denna funktion någonsin nås) —
 * ingen gissning, ingen `storage.list()`-suffixmatchning (se
 * scripts/create-bilagor-table.mjs § Lagringsnyckel för varför den vägen
 * avvisades: flera Bilagor-rader kan dela identiskt Namn).
 *
 * EF-side download+bas64 valdes i stället för forskningspassets
 * förstahandsval (signerad URL i Resends `path`-fält) — en MEDVETEN
 * avvikelse: realistiska brev-/kvitto-PDF:er är KB-stora (146.5:s egna
 * genererade filer är ~1,3 kB), gott inom EF:ens 256 MB-minne/2s-CPU-budget,
 * och sidesteppar signerad-URL-TTL-osäkerheten (`SIGNED_UPLOAD_URL_TTL_
 * SECONDS`-noten i _shared/attachments.ts) för en lång sekventiell loop.
 */
function makeRealAttachmentReader(): AttachmentReader {
  return async (attachments, eventId) => {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const payloads: AttachmentPayload[] = [];
    for (const a of attachments) {
      const path = `${eventId}/${a.lagringsnyckel}`;
      const { data, error } = await supabaseAdmin.storage.from(BILAGOR_BUCKET_ID).download(path);
      if (error || !data) {
        throw new Error(
          `Bilagan "${a.namn}" kunde inte hämtas ur lagringen: ${
            error?.message ?? 'okänt fel'
          }. Prova igen.`,
        );
      }
      const bytes = new Uint8Array(await data.arrayBuffer());
      payloads.push({ filename: a.namn, contentBase64: toBase64(bytes) });
    }
    return payloads;
  };
}

/**
 * [TASK-147.5] Löser `attachmentIds` (klient-buret) → `ResolvedAttachment[]`
 * (namn + lagringsnyckel, server-läst). HTTP-VALIDERING HÄR, INTE i
 * orkestratorn (samma uppdelning som registrationIds → targets): existens
 * (404), event-ägarskap (400, fail-closed — en bilaga från ETT event kan
 * aldrig bifogas på ETT ANNAT events utskick), och Lagringsnyckel-närvaro
 * (422 — en rad skapad FÖRE TASK-147.5s additiva fält saknar den och kan
 * inte skickas; ett tydligt fel i stället för en trasig sändning).
 *
 * Returnerar antingen `{ ok: true, attachments }` eller `{ ok: false,
 * response }` — anroparen returnerar `response` direkt utan att gissa status.
 */
async function resolveAttachments(
  rawIds: readonly string[],
  eventId: string,
  corsHeaders: Record<string, string>,
): Promise<{ ok: true; attachments: ResolvedAttachment[] } | { ok: false; response: Response }> {
  const resolved: ResolvedAttachment[] = [];
  for (const id of rawIds) {
    const record = await fetchAirtableRecord(BILAGOR_TABLE, id);
    if (!record) {
      return {
        ok: false,
        response: jsonResponse({ error: `Attachment not found: ${id}` }, 404, corsHeaders),
      };
    }
    const eventIds = linkedIds(record.fields['Event']);
    if (!eventIds.includes(eventId)) {
      return {
        ok: false,
        response: badRequest(`Attachment ${id} does not belong to event ${eventId}`, corsHeaders),
      };
    }
    const lagringsnyckel = record.fields['Lagringsnyckel'];
    if (typeof lagringsnyckel !== 'string' || lagringsnyckel.length === 0) {
      return {
        ok: false,
        response: jsonResponse(
          {
            error: `Bilagan "${id}" kan inte skickas — den saknar lagringsnyckel (skapad före TASK-147.5).`,
            code: 'attachment_missing_lagringsnyckel',
          },
          422,
          corsHeaders,
        ),
      };
    }
    const namn = typeof record.fields['Namn'] === 'string' ? record.fields['Namn'] : 'bilaga.pdf';
    resolved.push({ id, namn, lagringsnyckel });
  }
  return { ok: true, attachments: resolved };
}

/**
 * Läs upp EN anmälan server-side → orkestratorns target-shape + dess Event-länk.
 * Fält-mappningen (inkl. VILKET fältnamn Event-länken bär) lever i
 * `mapRegistrationFields` (_shared/send-action-email.ts) — dual-importable och
 * Node-testad (tests/api/send-action-email.test.ts § S102-regression), i
 * stället för duplicerad här där den bara vore Deno-nåbar.
 */
async function readRegistration(
  id: string,
): Promise<{ target: ActionTarget; eventIds: string[] } | null> {
  const record = await fetchAirtableRecord(REGISTRATIONS_TABLE, id);
  if (!record) return null;
  return mapRegistrationFields(record.id, record.fields);
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

  // [TASK-147.10] Testmail-flaggan — additiv, valfri, default false (bakåt-
  // kompatibel: befintliga anropare som aldrig sätter fältet är opåverkade).
  // Endast literalt `true` grenar mot testvägen; allt annat (frånvaro, false,
  // annan typ) går den befintliga verkliga sändvägen oförändrad.
  const testSend = body?.testSend === true;

  // [TASK-147.5, AC #1] attachmentIds — additiv, valfri, default TOM (bakåt-
  // kompatibel: befintliga anropare som aldrig sätter fältet är opåverkade,
  // grenval automatiskt). Formen valideras HÄR (samma disciplin som
  // registrationIds); RESOLUTION (existens/ägarskap/lagringsnyckel) sker
  // längre ned, EFTER eventet är läst upp och testmail-grenen avgjord — ett
  // testmail bär strukturellt aldrig bilagor (T53/ADR-067 D10-scopet är
  // diagnostik, inte den verkliga sändningen; se `_shared/send-action-
  // email.ts` § `runActionTestSend` som saknar en attachments-parameter helt).
  const attachmentIdsRaw = body?.attachmentIds;
  let attachmentIds: string[] = [];
  if (attachmentIdsRaw !== undefined) {
    if (
      !Array.isArray(attachmentIdsRaw) ||
      !attachmentIdsRaw.every((s) => typeof s === 'string' && REC_ID_RE.test(s))
    ) {
      return badRequest(
        'attachmentIds must be an array of Bilagor record-IDs (rec-prefix)',
        corsHeaders,
      );
    }
    attachmentIds = [...new Set(attachmentIdsRaw as string[])];
    if (attachmentIds.length > MAX_ATTACHMENTS) {
      return badRequest(`attachmentIds exceeds max ${MAX_ATTACHMENTS} per request`, corsHeaders);
    }
  }

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
  // [TASK-274] Utskicks-spärren (Marcus beslut B) — central kill-switch, LÄST PER
  // ANROP (ingen cache): frånvarande/uttryckligt 'av' = öppet, allt annat = blockerat.
  const utskickSparrat = isUtskickSparrat(Deno.env.get('UTSKICK_SPARR'));

  try {
    // Eventet — 404 om okänt (get-event-kontraktet, aldrig 500).
    const event = await readEvent(eventId);
    if (!event) {
      return jsonResponse({ error: `Event not found: ${eventId}` }, 404, corsHeaders);
    }

    // [TASK-147.10] TESTMAIL-GRENEN — EN mottagare (FÖRSTA registrationId,
    // ENDAST platshållar-data), adressen ALLTID `user.email` (aldrig
    // klient-buren, aldrig `target.email`). Egen retur-väg: `runActionSend`
    // nedan (targets-loopen, `runActionSend`, stämpel-fält) rörs INTE.
    if (testSend) {
      const firstId = ids[0];
      const read = await readRegistration(firstId);
      if (!read) {
        return jsonResponse({ error: `Registration not found: ${firstId}` }, 404, corsHeaders);
      }
      if (!read.eventIds.includes(eventId)) {
        return badRequest(`Registration ${firstId} does not belong to event ${eventId}`, corsHeaders);
      }
      if (!user.email) {
        return badRequest(
          'Inloggad användare saknar e-postadress — testmail kan inte skickas.',
          corsHeaders,
        );
      }

      const result = await runActionTestSend(
        {
          target: read.target,
          event,
          amne,
          mailtext,
          testRecipientEmail: user.email,
          jobId,
          isProd,
          utskickSparrat,
        },
        { sender: makeRealSender() },
      );

      console.log(
        `[${OPERATION_KEY}] TEST-SEND DONE | caller_user_id=${user.id} | jobId=${jobId} | ` +
          `actionType=${actionType} | status=${result.status}`,
      );
      return jsonResponse(result, 200, corsHeaders);
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

    // [TASK-147.5, AC #1] Bilage-upplösning SERVER-SIDE — samma existens-/
    // ägarskaps-disciplin som registrationIds ovan. TOM lista (normalfallet,
    // ingen bilaga vald) ⇒ `resolvedAttachments` blir `[]` ⇒ `runActionSend`
    // tar den bilage-fria batchgrenen, oförändrad.
    let resolvedAttachments: ResolvedAttachment[] = [];
    if (attachmentIds.length > 0) {
      const resolution = await resolveAttachments(attachmentIds, eventId, corsHeaders);
      if (!resolution.ok) return resolution.response;
      resolvedAttachments = resolution.attachments;
    }

    const result = await runActionSend(
      {
        actionType: actionType as ActionType,
        targets,
        event,
        eventId,
        amne,
        mailtext,
        jobId,
        isProd,
        utskickSparrat,
        nu: new Date().toISOString(),
        attachments: resolvedAttachments,
      },
      {
        sender: makeRealSender(),
        writeFields: makeRealFieldWriter(user.id),
        singleSender: makeRealSingleSender(),
        readAttachments: makeRealAttachmentReader(),
      },
    );

    console.log(
      `[${OPERATION_KEY}] DONE | caller_user_id=${user.id} | jobId=${jobId} | actionType=${actionType} | ` +
        `status=${result.status} | requested=${result.requested} attempted=${result.attempted} ` +
        `completed=${result.completed.length} skipped=${result.skipped.length} failed=${result.failed.length} | ` +
        `attachments=${resolvedAttachments.length}`,
    );
    return jsonResponse(result, 200, corsHeaders);
  } catch (error) {
    if (error instanceof UtskickSparratError) {
      console.warn(`[${OPERATION_KEY}] UTSKICK-SPARR REFUSED | caller_user_id=${user.id}`);
      return jsonResponse({ error: error.message, code: 'utskick_blockerat' }, 423, corsHeaders);
    }
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
