// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som update-event/index.ts m.fl.
//
// save-event-text — TASK-309.3 AC #1, ADR-125 § 2. Sparar EVENTETS EGEN
// kopia av ett block: antingen ett (bilagetext)-textfält på Eventplanering,
// eller en dags Agendapunkter-rader (länkade via `Event`, ersatta atomärt
// — `_shared/agendapunkter.ts`). Ett anrop kan sätta `falt`, `agenda`,
// eller båda; minst ett krävs.
//
// TÖMNING (kan vända kopian tillbaka till standarden, ADR-125 beslut 1):
// `falt.<nyckel>: null` rensar TEXT-fält till `''` (Airtable-konventionen
// för "osatt" — `get-document-sources`s `scalarString`/`bilagetext()`
// coercar ett osatt fält till `null`, samma väg som ett fält som aldrig
// skrivits) och rensar DATUM-fältet (`sistaBetalningsdag`) med ett
// explicit `null` (samma mönster som `update-event`s
// `deltagarinfoSchemalagd`). `agenda: { dag, rader: [] }` tömmer den dagens
// kopia; körs det för BÅDA dagarna faller läsvägens
// `eventHarEgenAgenda`-boolean tillbaka till standarden för BÅDA (hela-
// agendan-eller-inget-formen, ADR-125 § 2).
//
// SKRIVMÖNSTER: speglar update-event EXAKT (POST→405, requireUser→401,
// body-JSON-fel→400, manuell deny-by-default-validering — INTE Zod, se
// update-event/index.ts:s eget filhuvud för motiveringen (ADR-026: Zod bor
// i klient-/adapter-lagret, kodbas-konsistens > abstrakt schema-kanon) —
// allowlist-SSOT via field-allowlists.ts, deny→400, {error}+requestId,
// central mapErrorToResponse.

import { replaceAgendaForDag } from '../_shared/agendapunkter.ts';
import { updateAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import {
  bilagetextFieldName,
  EVENT_TEXT_FALT_KEYS,
  type EventTextFalt,
} from '../_shared/eventinnehall-falt.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

const OPERATION_KEY = 'save-event-text';
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isFaltKey(key: string): key is EventTextFalt {
  return (EVENT_TEXT_FALT_KEYS as readonly string[]).includes(key);
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

  const eventId = body?.eventId;
  if (typeof eventId !== 'string' || !eventId.startsWith('rec')) {
    return badRequest('eventId is required (Eventplanering record-ID, rec-prefix)', corsHeaders);
  }

  // --- falt: valfritt, deny-by-default per nyckel ---
  const faltRaw = body?.falt;
  const fields: Record<string, unknown> = {};
  if (faltRaw !== undefined) {
    if (typeof faltRaw !== 'object' || faltRaw === null || Array.isArray(faltRaw)) {
      return badRequest('falt must be an object when present', corsHeaders);
    }
    const faltObj = faltRaw as Record<string, unknown>;
    for (const key of Object.keys(faltObj)) {
      if (!isFaltKey(key)) {
        return badRequest(`Unknown falt key: ${key}`, corsHeaders);
      }
    }
    for (const key of EVENT_TEXT_FALT_KEYS) {
      if (!(key in faltObj)) continue;
      const raw = faltObj[key];
      if (raw !== null && typeof raw !== 'string') {
        return badRequest(`falt.${key} must be a string or null when present`, corsHeaders);
      }
      const fieldName = bilagetextFieldName(key);
      if (key === 'sistaBetalningsdag') {
        if (raw !== null && !ISO_DATE_RE.test(raw)) {
          return badRequest('falt.sistaBetalningsdag must be ISO YYYY-MM-DD or null', corsHeaders);
        }
        // Datumfält: null RENSAR direkt (update-event-mönstret för
        // `deltagarinfoSchemalagd`) — ALDRIG en tom sträng ('' är inte ett
        // giltigt Airtable date-värde).
        fields[fieldName] = raw;
      } else {
        if (typeof raw === 'string' && raw.trim().length === 0) {
          return badRequest(`falt.${key} must be non-empty; send null to clear`, corsHeaders);
        }
        // Textfält: null RENSAR via '' (Airtable-konventionen — se filhuvudet).
        fields[fieldName] = raw === null ? '' : raw.trim();
      }
    }
  }

  // --- agenda: valfritt, en dag per anrop ---
  const agendaRaw = body?.agenda;
  let agendaDag: 1 | 2 | undefined;
  let agendaRader: { text: string; tid?: string; meditation?: boolean }[] | undefined;
  if (agendaRaw !== undefined) {
    if (typeof agendaRaw !== 'object' || agendaRaw === null || Array.isArray(agendaRaw)) {
      return badRequest('agenda must be an object when present', corsHeaders);
    }
    const agendaObj = agendaRaw as Record<string, unknown>;
    const dag = agendaObj.dag;
    if (dag !== 1 && dag !== 2) {
      return badRequest('agenda.dag must be 1 or 2', corsHeaders);
    }
    const rader = agendaObj.rader;
    if (!Array.isArray(rader)) {
      return badRequest('agenda.rader must be an array', corsHeaders);
    }
    const parsed: { text: string; tid?: string; meditation?: boolean }[] = [];
    for (let i = 0; i < rader.length; i++) {
      const rad = rader[i];
      if (typeof rad !== 'object' || rad === null) {
        return badRequest(`agenda.rader[${i}] must be an object`, corsHeaders);
      }
      const radObj = rad as Record<string, unknown>;
      const text = radObj.text;
      if (typeof text !== 'string' || text.trim().length === 0) {
        return badRequest(`agenda.rader[${i}].text is required (non-empty string)`, corsHeaders);
      }
      const tid = radObj.tid;
      if (tid !== undefined && typeof tid !== 'string') {
        return badRequest(`agenda.rader[${i}].tid must be a string when present`, corsHeaders);
      }
      const meditation = radObj.meditation;
      if (meditation !== undefined && typeof meditation !== 'boolean') {
        return badRequest(`agenda.rader[${i}].meditation must be a boolean when present`, corsHeaders);
      }
      parsed.push({ text: text.trim(), tid, meditation });
    }
    agendaDag = dag;
    agendaRader = parsed;
  }

  if (Object.keys(fields).length === 0 && agendaDag === undefined) {
    return badRequest('At least one of falt or agenda is required', corsHeaders);
  }

  try {
    let record: { id: string; fields: Record<string, unknown> } | null = null;

    if (Object.keys(fields).length > 0) {
      const operation = getOperation(OPERATION_KEY);
      if (!operation) {
        return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
      }
      const disallowed = findDisallowedField(operation, fields);
      if (disallowed !== null) {
        console.warn(
          `[save-event-text] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
        );
        return badRequest(
          `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
          corsHeaders,
        );
      }
      console.log(
        `[save-event-text] ALLOW falt | caller_user_id=${user.id} | record=${eventId} | fields=${Object.keys(fields).join(',')}`,
      );
      const updated = await updateAirtableRecord(operation.tableId, eventId, fields);
      record = { id: updated.id, fields: updated.fields };
    }

    let agenda: { createdIds: string[]; deletedIds: string[] } | null = null;
    if (agendaDag !== undefined) {
      console.log(
        `[save-event-text] ALLOW agenda | caller_user_id=${user.id} | record=${eventId} | dag=${agendaDag} | rader=${agendaRader?.length ?? 0}`,
      );
      agenda = await replaceAgendaForDag({
        parentField: 'Event',
        parentId: eventId,
        dag: agendaDag,
        rader: agendaRader ?? [],
      });
    }

    return new Response(JSON.stringify({ ok: true, record, agenda }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'save-event-text',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
