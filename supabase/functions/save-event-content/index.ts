// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som update-event/index.ts m.fl.
//
// save-event-content — TASK-309.3 AC #3, ADR-125 § 2. Sparar en
// Eventinnehåll-radens STANDARDTEXTER (de tolv egna textfälten) och/eller
// dess STANDARDAGENDA (Agendapunkter länkade via `Eventinnehåll`, ersatta
// atomärt per dag — `_shared/agendapunkter.ts`) — Mer-sidans redigeringsyta
// (ADR-125 § 7, byggs i en senare skiva).
//
// `Namn` SÄTTS VID VARJE SKRIVNING (plattformsväggen, data-model.md §
// Bilagornas datamodell + ADR-125 § Updates 2026-08-23): `Namn` är
// singleLineText, INTE en levande formel (Airtables Meta-API kan inte
// skapa ett formelfält som primärfält i samma tabellskapelse) — en
// ÖGONBLICKSBILD som skrivkoden ansvarar för att hålla i synk med radens
// `Event`/`Typ`. Denna EF läser därför raden FÖRST (för att få dess
// NUVARANDE Event/Typ — de redigeras aldrig via denna operation) och
// bygger `Namn = "<Event> · <Typ>"` (samma sträng-form som
// `scripts/seed-eventinnehall-modell.mjs`s `eventinnehallNamn()`) INNAN
// PATCH:en, oavsett om `falt` bär några ändringar alls.
//
// TÖMNING (symmetrisk med save-event-text, om än inte AC-krävd): `falt.
// <nyckel>: null` rensar textfältet till `''`.
//
// SKRIVMÖNSTER: speglar update-event/save-segment (POST→405,
// requireUser→401, body-JSON-fel→400, manuell deny-by-default-validering —
// INTE Zod, se update-event/index.ts:s filhuvud; ADR-026), allowlist-SSOT,
// deny→400, {error}+requestId, central mapErrorToResponse.

import { replaceAgendaForDag } from '../_shared/agendapunkter.ts';
import { fetchAirtableRecord, updateAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import {
  EVENT_TEXT_BASFALT,
  EVENTINNEHALL_FALT_KEYS,
  eventinnehallNamn,
  type EventinnehallFalt,
} from '../_shared/eventinnehall-falt.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

const OPERATION_KEY = 'save-event-content';
const EVENTINNEHALL_TABLE = 'Eventinnehåll';

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isEventinnehallFaltKey(key: string): key is EventinnehallFalt {
  return (EVENTINNEHALL_FALT_KEYS as readonly string[]).includes(key);
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

  const eventinnehallId = body?.eventinnehallId;
  if (typeof eventinnehallId !== 'string' || !eventinnehallId.startsWith('rec')) {
    return badRequest(
      'eventinnehallId is required (Eventinnehåll record-ID, rec-prefix)',
      corsHeaders,
    );
  }

  // --- falt: valfritt, deny-by-default per nyckel ---
  const faltRaw = body?.falt;
  const faltFields: Record<string, unknown> = {};
  if (faltRaw !== undefined) {
    if (typeof faltRaw !== 'object' || faltRaw === null || Array.isArray(faltRaw)) {
      return badRequest('falt must be an object when present', corsHeaders);
    }
    const faltObj = faltRaw as Record<string, unknown>;
    for (const key of Object.keys(faltObj)) {
      if (!isEventinnehallFaltKey(key)) {
        return badRequest(`Unknown falt key: ${key}`, corsHeaders);
      }
    }
    for (const key of EVENTINNEHALL_FALT_KEYS) {
      if (!(key in faltObj)) continue;
      const raw = faltObj[key];
      if (raw !== null && typeof raw !== 'string') {
        return badRequest(`falt.${key} must be a string or null when present`, corsHeaders);
      }
      if (typeof raw === 'string' && raw.trim().length === 0) {
        return badRequest(`falt.${key} must be non-empty; send null to clear`, corsHeaders);
      }
      // Textfält: null RENSAR via '' (samma Airtable-konvention som save-event-text).
      faltFields[EVENT_TEXT_BASFALT[key]] = raw === null ? '' : raw.trim();
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

  if (Object.keys(faltFields).length === 0 && agendaDag === undefined) {
    return badRequest('At least one of falt or agenda is required', corsHeaders);
  }

  try {
    let record: { id: string; fields: Record<string, unknown> } | null = null;

    // `Namn` sätts VID VARJE SKRIVNING (se filhuvudet) — bara relevant om vi
    // faktiskt PATCH:ar raden (falt närvarande). Läser raden FÖRST för dess
    // NUVARANDE Event/Typ (redigeras aldrig via denna operation).
    if (Object.keys(faltFields).length > 0) {
      const current = await fetchAirtableRecord(EVENTINNEHALL_TABLE, eventinnehallId);
      if (!current) {
        return badRequest('Eventinnehåll not found', corsHeaders);
      }
      const event = selectName(current.fields['Event']);
      const typ = selectName(current.fields['Typ']);
      if (!event || !typ) {
        return badRequest('Eventinnehåll-raden saknar Event/Typ — kan inte bygga Namn', corsHeaders);
      }

      const fields: Record<string, unknown> = { Namn: eventinnehallNamn(event, typ), ...faltFields };

      const operation = getOperation(OPERATION_KEY);
      if (!operation) {
        return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
      }
      const disallowed = findDisallowedField(operation, fields);
      if (disallowed !== null) {
        console.warn(
          `[save-event-content] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
        );
        return badRequest(
          `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
          corsHeaders,
        );
      }
      console.log(
        `[save-event-content] ALLOW falt | caller_user_id=${user.id} | record=${eventinnehallId} | fields=${Object.keys(fields).join(',')}`,
      );
      const updated = await updateAirtableRecord(operation.tableId, eventinnehallId, fields);
      record = { id: updated.id, fields: updated.fields };
    }

    let agenda: { createdIds: string[]; deletedIds: string[] } | null = null;
    if (agendaDag !== undefined) {
      console.log(
        `[save-event-content] ALLOW agenda | caller_user_id=${user.id} | record=${eventinnehallId} | dag=${agendaDag} | rader=${agendaRader?.length ?? 0}`,
      );
      agenda = await replaceAgendaForDag({
        parentField: 'Eventinnehåll',
        parentId: eventinnehallId,
        dag: agendaDag,
        rader: agendaRader ?? [],
      });
    }

    return new Response(JSON.stringify({ ok: true, record, agenda }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'save-event-content',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
