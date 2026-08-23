// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som update-event/index.ts m.fl.
//
// save-place-standard — TASK-309.3 AC #2 + TASK-309.7 AC #3, ADR-125 § 2+7,
// Del 2 § D beslut 6+8.
//
// TRE LÄGEN, samma EF (en fjärde skrivväg hade dubblerat allowlist +
// find-or-create-logiken nedan för noll semantisk vinst):
//
//   1. `eventId` satt (TASK-309.3, OFÖRÄNDRAD) — "Spara som platsens
//      standard" FRÅN ett event: sparar adress/parkering/transport/kläder
//      på PLATSEN, föder Platser-raden om eventets `Ort` saknar en, länkar
//      eventet till den, och TÖMMER eventets EGEN (bilagetext)-kopia för
//      exakt de block som just sparades (så standarden gäller — beslut 6).
//      `Ort` rörs ALDRIG (beslut 8).
//   2. `platsId` satt, inget `eventId` (TASK-309.7, NY) — REN plats-
//      redigering UTAN event: Mer-sidans Platser-yta redigerar en
//      BEFINTLIG plats rad direkt. Ingen Eventplanering-rad rörs (det
//      finns inget event i detta anrop).
//   3. `namn` satt, varken `eventId` eller `platsId` (TASK-309.7, NY) —
//      SKAPA en ny plats direkt (Mer-sidans "ny plats"-knapp), find-or-
//      create by `Namn` (samma säkerhetsnät mot en oavsiktlig dubblett som
//      läge 1 redan bär för `Ort`-vägen).
//
// TVÅ TABELLER, TVÅ OPERATIONER (läge 1 ENDAST): Platser-raden
// (find-or-create by `Namn` = `Ort`) och Eventplanering-raden (Plats-länk +
// kopia-rensning) skrivs i SAMMA request men gates:as var för sig i
// field-allowlists.ts ('save-place-standard-plats'/'save-place-standard-
// event') — en OperationDef bär exakt ETT tableId, se den filens kommentar.
// Läge 2/3 skriver ENDAST Platser-tabellen, samma `save-place-standard-
// plats`-operation (samma tabell, samma fyra+Namn-fält — ingen ny
// allowlist-post behövs).
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
// Event×Typ). Ett race mellan två samtidiga anrop mot SAMMA nya platsnamn
// kan i teorin skapa två Platser-rader med samma `Namn` — bokfört öppet,
// samma restrisk som läge 1 redan bar innan denna skiva.

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

  // Lägesväxeln (TASK-309.7): exakt ETT av eventId/platsId/namn avgör vilket
  // av de tre lägena filhuvudet beskriver. `eventId` vinner om den råkar stå
  // tillsammans med någon av de andra — men det är ett anropsfel, inte ett
  // giltigt kombinerat läge, så det avvisas explicit i stället för att gissa.
  const eventIdRaw = body?.eventId;
  const platsIdRaw = body?.platsId;
  const namnRaw = body?.namn;
  const harEventId = eventIdRaw !== undefined;
  const harPlatsId = platsIdRaw !== undefined;
  const harNamn = namnRaw !== undefined;

  if (Number(harEventId) + Number(harPlatsId) + Number(harNamn) > 1) {
    return badRequest('Ange endast ETT av eventId, platsId eller namn', corsHeaders);
  }

  let eventId: string | null = null;
  let platsIdInput: string | null = null;
  let nyttNamn: string | null = null;

  if (harEventId) {
    if (typeof eventIdRaw !== 'string' || !eventIdRaw.startsWith('rec')) {
      return badRequest('eventId must be a record-ID (rec-prefix)', corsHeaders);
    }
    eventId = eventIdRaw;
  } else if (harPlatsId) {
    if (typeof platsIdRaw !== 'string' || !platsIdRaw.startsWith('rec')) {
      return badRequest('platsId must be a record-ID (rec-prefix)', corsHeaders);
    }
    platsIdInput = platsIdRaw;
  } else if (harNamn) {
    if (typeof namnRaw !== 'string' || namnRaw.trim().length === 0) {
      return badRequest('namn must be a non-empty string', corsHeaders);
    }
    nyttNamn = namnRaw.trim();
  } else {
    return badRequest('One of eventId, platsId or namn is required', corsHeaders);
  }

  // Läge 3 (namn, ny plats) FÅR utelämna `falt` helt — Mer-ytans "ny
  // plats"-knapp skapar en TOM shell (bara Namn) som redigeras i ett andra
  // steg via samma block-dialog. Läge 1/2 kräver `falt` precis som förut:
  // en no-op-uppdatering är meningslös där.
  const faltRaw = body?.falt;
  const harFalt = faltRaw !== undefined;
  const ar3 = eventId === null && platsIdInput === null; // ⇒ nyttNamn !== null

  if (!harFalt && !ar3) {
    return badRequest('falt is required (object)', corsHeaders);
  }
  if (harFalt && (typeof faltRaw !== 'object' || faltRaw === null || Array.isArray(faltRaw))) {
    return badRequest('falt must be an object when present', corsHeaders);
  }
  const faltObj = (harFalt ? faltRaw : {}) as Record<string, unknown>;
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

  if (Object.keys(platsFields).length === 0 && !ar3) {
    return badRequest('falt must contain at least one non-empty field', corsHeaders);
  }

  try {
    // Läge 2/3 (TASK-309.7): REN plats-redigering utan event — ingen
    // Eventplanering-rad i sikte, bara Platser-tabellens fyra fält.
    if (eventId === null) {
      const platsOperation = getOperation(PLATS_OPERATION_KEY);
      if (!platsOperation) {
        return badRequest(`Unknown operation: ${PLATS_OPERATION_KEY}`, corsHeaders);
      }
      const disallowedPlats = findDisallowedField(platsOperation, platsFields);
      if (disallowedPlats !== null) {
        console.warn(
          `[save-place-standard] DENY field not in allowlist (plats, event-lös) | caller_user_id=${user.id} | field=${disallowedPlats}`,
        );
        return badRequest(
          `Field "${disallowedPlats}" not allowed for operation "${PLATS_OPERATION_KEY}"`,
          corsHeaders,
        );
      }

      if (platsIdInput !== null) {
        // Läge 2: uppdatera en BEFINTLIG plats direkt — ingen Namn-ändring
        // (Mer-ytans redigering rör bara adress/parkering/transport/kläder).
        const existing = await fetchAirtableRecord(PLATSER_TABLE, platsIdInput);
        if (!existing) {
          return badRequest('Plats not found', corsHeaders);
        }
        const updated = await updateAirtableRecord(platsOperation.tableId, platsIdInput, platsFields);
        console.log(
          `[save-place-standard] ALLOW plats (event-lös, uppdatera) | caller_user_id=${user.id} | plats=${updated.id} | fields=${Object.keys(platsFields).join(',')}`,
        );
        return new Response(
          JSON.stringify({
            ok: true,
            plats: {
              id: updated.id,
              namn: scalarString(updated.fields['Namn']) ?? '',
              skapad: false,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Läge 3: SKAPA en ny plats — find-or-create by exakt Namn (samma
      // säkerhetsnät mot en oavsiktlig dubblett som läge 1 bär för Ort-vägen).
      if (nyttNamn === null) {
        return badRequest('namn is required when platsId is absent', corsHeaders);
      }
      const existingByNamn = await fetchFromAirtable(PLATSER_TABLE, {
        filterByFormula: buildEqualsFilter('Namn', nyttNamn),
        maxRecords: 1,
      });
      if (existingByNamn.length > 0) {
        const updated = await updateAirtableRecord(
          platsOperation.tableId,
          existingByNamn[0].id,
          platsFields,
        );
        console.log(
          `[save-place-standard] ALLOW plats (event-lös, namn fanns redan) | caller_user_id=${user.id} | plats=${updated.id} | namn=${nyttNamn}`,
        );
        return new Response(
          JSON.stringify({ ok: true, plats: { id: updated.id, namn: nyttNamn, skapad: false } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const created = await createAirtableRecord(platsOperation.tableId, {
        Namn: nyttNamn,
        ...platsFields,
      });
      console.log(
        `[save-place-standard] ALLOW plats (event-lös, skapa) | caller_user_id=${user.id} | plats=${created.id} | namn=${nyttNamn}`,
      );
      return new Response(
        JSON.stringify({ ok: true, plats: { id: created.id, namn: nyttNamn, skapad: true } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

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
