// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som update-event/index.ts m.fl.
//
// save-place-standard — TASK-309.3 AC #2, ADR-125 § 2, Del 2 § D beslut 6+8.
// "Spara som platsens standard": sparar adress/parkering/transport/kläder
// på PLATSEN (inte eventet), föder Platser-raden om eventets `Ort` saknar
// en, länkar eventet till den, och TÖMMER eventets EGEN (bilagetext)-kopia
// för exakt de block som just sparades som standard (så standarden gäller
// — beslut 6). `Ort` rörs ALDRIG (beslut 8).
//
// TVÅ TABELLER, TVÅ OPERATIONER: Platser-raden (find-or-create by `Namn` =
// `Ort`) och Eventplanering-raden (Plats-länk + kopia-rensning) skrivs i
// SAMMA request men gates:as var för sig i field-allowlists.ts
// ('save-place-standard-plats'/'save-place-standard-event') — en
// OperationDef bär exakt ETT tableId, se den filens kommentar.
//
// SKRIVMÖNSTER: speglar update-event/save-segment (POST→405,
// requireUser→401, body-JSON-fel→400, manuell deny-by-default-validering —
// INTE Zod, se update-event/index.ts:s filhuvud för motiveringen; ADR-026),
// allowlist-SSOT, deny→400, {error}+requestId, central mapErrorToResponse.
//
// FIND-OR-CREATE ÄR INTE ATOMISKT (Airtable saknar en upsert-by-formula-
// primitiv för icke-idempotensnyckel-fält — `upsertAirtableRecord` kräver
// ETT skrivbart merge-fält, och `Namn` är primärfältet men INTE
// deklarerat som ett `performUpsert.fieldsToMergeOn`-kandidatfält i
// samtliga Airtable-fält-typer generellt; ett GET+skapa/patch-par är
// samma mönster `get-document-sources` redan använder för uppslaget
// Event×Typ). Ett race mellan två samtidiga "spara som standard"-anrop på
// SAMMA ny plats kan i teorin skapa två Platser-rader med samma `Namn` —
// bokfört öppet, ingen UI-yta finns än som gör detta race frekvent
// (redigeringsytan byggs i en senare skiva, ADR-125 § 7).

import {
  createAirtableRecord,
  fetchAirtableRecord,
  fetchFromAirtable,
  updateAirtableRecord,
} from '../_shared/airtable-client.ts';
import { buildEqualsFilter } from '../_shared/airtable-filter.ts';
import { EVENTPLANERING_TABLE } from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import {
  bilagetextFieldName,
  EVENT_TEXT_BASFALT,
  PLATS_FALT_KEYS,
  type PlatsFalt,
} from '../_shared/eventinnehall-falt.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

const PLATS_OPERATION_KEY = 'save-place-standard-plats';
const EVENT_OPERATION_KEY = 'save-place-standard-event';
const PLATSER_TABLE = 'Platser';
const PLATS_LINK_FIELD = 'Plats';

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isPlatsFaltKey(key: string): key is PlatsFalt {
  return (PLATS_FALT_KEYS as readonly string[]).includes(key);
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

  const faltRaw = body?.falt;
  if (typeof faltRaw !== 'object' || faltRaw === null || Array.isArray(faltRaw)) {
    return badRequest('falt is required (object)', corsHeaders);
  }
  const faltObj = faltRaw as Record<string, unknown>;
  for (const key of Object.keys(faltObj)) {
    if (!isPlatsFaltKey(key)) {
      return badRequest(`Unknown falt key: ${key}`, corsHeaders);
    }
  }

  const platsFields: Record<string, string> = {};
  const bilagetextClearFields: Record<string, string> = {};
  for (const key of PLATS_FALT_KEYS) {
    if (!(key in faltObj)) continue;
    const raw = faltObj[key];
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return badRequest(`falt.${key} must be a non-empty string`, corsHeaders);
    }
    platsFields[EVENT_TEXT_BASFALT[key]] = raw.trim();
    // Beslut 6: eventets egen kopia töms för EXAKT de block som sparas som
    // standard — så standarden gäller. Textfält rensas via '' (samma
    // Airtable-konvention som save-event-text).
    bilagetextClearFields[bilagetextFieldName(key)] = '';
  }

  if (Object.keys(platsFields).length === 0) {
    return badRequest('falt must contain at least one non-empty field', corsHeaders);
  }

  try {
    // 1) Eventets Ort — nyckeln in i Platser-tabellen (beslut 8: Platsen
    //    föds om Ort-namnet saknar en rad; Ort rörs ALDRIG).
    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return badRequest('Event not found', corsHeaders);
    }
    const ort = scalarString(eventRecord.fields['Ort']);
    if (!ort) {
      return badRequest('Event saknar Ort — kan inte härleda platsens namn', corsHeaders);
    }

    // 2) Allowlist-SSOT — Platser-operationen.
    const platsOperation = getOperation(PLATS_OPERATION_KEY);
    if (!platsOperation) {
      return badRequest(`Unknown operation: ${PLATS_OPERATION_KEY}`, corsHeaders);
    }
    const disallowedPlats = findDisallowedField(platsOperation, platsFields);
    if (disallowedPlats !== null) {
      console.warn(
        `[save-place-standard] DENY field not in allowlist (plats) | caller_user_id=${user.id} | field=${disallowedPlats}`,
      );
      return badRequest(
        `Field "${disallowedPlats}" not allowed for operation "${PLATS_OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    // 3) Find-or-create Platser by exakt Namn = Ort.
    const existing = await fetchFromAirtable(PLATSER_TABLE, {
      filterByFormula: buildEqualsFilter('Namn', ort),
      maxRecords: 1,
    });

    let platsId: string;
    let platsSkapad: boolean;
    if (existing.length > 0) {
      const updated = await updateAirtableRecord(platsOperation.tableId, existing[0].id, platsFields);
      platsId = updated.id;
      platsSkapad = false;
      console.log(
        `[save-place-standard] ALLOW plats (update) | caller_user_id=${user.id} | plats=${platsId} | fields=${Object.keys(platsFields).join(',')}`,
      );
    } else {
      const created = await createAirtableRecord(platsOperation.tableId, { Namn: ort, ...platsFields });
      platsId = created.id;
      platsSkapad = true;
      console.log(
        `[save-place-standard] ALLOW plats (create) | caller_user_id=${user.id} | plats=${platsId} | namn=${ort}`,
      );
    }

    // 4) Länka eventet + töm dess egen kopia — allowlist-SSOT (Eventplanering).
    const eventOperation = getOperation(EVENT_OPERATION_KEY);
    if (!eventOperation) {
      return badRequest(`Unknown operation: ${EVENT_OPERATION_KEY}`, corsHeaders);
    }
    const eventFields: Record<string, unknown> = {
      [PLATS_LINK_FIELD]: [platsId],
      ...bilagetextClearFields,
    };
    const disallowedEvent = findDisallowedField(eventOperation, eventFields);
    if (disallowedEvent !== null) {
      console.warn(
        `[save-place-standard] DENY field not in allowlist (event) | caller_user_id=${user.id} | field=${disallowedEvent}`,
      );
      return badRequest(
        `Field "${disallowedEvent}" not allowed for operation "${EVENT_OPERATION_KEY}"`,
        corsHeaders,
      );
    }
    console.log(
      `[save-place-standard] ALLOW event | caller_user_id=${user.id} | record=${eventId} | plats=${platsId} | rensat=${Object.keys(bilagetextClearFields).join(',')}`,
    );
    const updatedEvent = await updateAirtableRecord(eventOperation.tableId, eventId, eventFields);

    return new Response(
      JSON.stringify({
        ok: true,
        plats: { id: platsId, namn: ort, skapad: platsSkapad },
        event: { id: updatedEvent.id, fields: updatedEvent.fields },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'save-place-standard',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
