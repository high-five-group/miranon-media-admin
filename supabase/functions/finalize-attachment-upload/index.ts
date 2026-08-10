// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som upload-attachment/index.ts.
//
// finalize-attachment-upload — TASK-146.4 mönster 2, steg 2 ("stora filer"):
// anropas EFTER att klienten (adaptern) laddat upp bytesen direkt mot
// lagringen med det tillstånd create-attachment-upload-ticket utfärdade.
// Skriver Bilagor-metadataraden — samma tabell, samma fält som mönster 1
// (upload-attachment), men storleken läses från lagringens FAKTISKA
// objekt-metadata, aldrig från ett klient-påstått tal.
//
// AUKTORISATIONSBESLUTET (AC #5), del 2: klienten skickar ALDRIG en path.
// Den skickar bara (eventId, attachmentId, filnamn) — EXAKT samma tre värden
// den fick/uppgav vid ticket-utfärdandet — och denna funktion DERIVERAR
// samma path SERVER-SIDE med samma formel
// (_shared/attachments.ts buildAttachmentPath). Sedan verifieras att ett
// objekt FAKTISKT finns där (storage.list) INNAN någon metadatarad skrivs.
// Det stänger den uppenbara attacken ("peka finalize mot en annan händelses
// fil"): eftersom attachmentId alltid är server-genererat vid ticket-
// utfärdandet och aldrig återanvänds mellan event, kan en klient bara
// "träffa" en path som den SJÄLV fick ett giltigt, scopat tillstånd för och
// FAKTISKT laddade upp bytes till — annars finns ingenting att hitta på den
// deriverade platsen och verifieringen faller.

import { createAirtableRecord, fetchAirtableRecord } from '../_shared/airtable-client.ts';
import {
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  buildAttachmentPath,
  EVENTPLANERING_TABLE,
  isValidAttachmentId,
  isValidEventId,
  mapAttachmentRecord,
  sanitizeFilnamn,
} from '../_shared/attachments.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, HttpError, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

const OPERATION_KEY = 'create-attachment';

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const eventId = body?.eventId;
    const attachmentId = body?.attachmentId;
    const filnamn = body?.filnamn;

    if (!isValidEventId(eventId)) {
      return badRequest('Ogiltigt event-id.', corsHeaders);
    }
    if (!isValidAttachmentId(attachmentId)) {
      return badRequest('Ogiltigt uppladdnings-id.', corsHeaders);
    }
    if (typeof filnamn !== 'string' || !filnamn.trim()) {
      return badRequest('Filen saknar namn.', corsHeaders);
    }

    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Eventet hittades inte.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Path DERIVERAS server-side — SAMMA formel som utfärdandet. Klienten
    // skickar aldrig en path direkt (§ AUKTORISATIONSBESLUTET ovan).
    const path = buildAttachmentPath(eventId, attachmentId, filnamn);
    const expectedFilename = `${attachmentId}-${sanitizeFilnamn(filnamn)}`;

    const { data: listing, error: listError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .list(eventId);
    if (listError) {
      throw new HttpError(
        502,
        `Lagringen kunde inte kontrolleras just nu: ${listError.message}. Prova igen.`,
      );
    }

    const found = (listing ?? []).find((entry) => entry.name === expectedFilename);
    if (!found) {
      return badRequest(
        'Uppladdningen verkar inte ha slutförts — filen hittades inte i lagringen. ' +
          'Prova att ladda upp igen.',
        corsHeaders,
      );
    }

    // Storleken kommer från LAGRINGENS FAKTISKA objekt-metadata — aldrig ett
    // klient-påstått tal (AC #5, server-side auktorisationsbeslut).
    const actualSizeBytes = found.metadata?.size;
    if (typeof actualSizeBytes !== 'number') {
      throw new HttpError(502, 'Filens storlek kunde inte läsas från lagringen. Prova igen.');
    }

    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      throw new HttpError(500, `Okänd operation: ${OPERATION_KEY}`);
    }

    const fields: Record<string, unknown> = {
      Namn: filnamn.trim(),
      'Storlek (bytes)': actualSizeBytes,
      Skapad: new Date().toISOString(),
      Event: [eventId],
    };

    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[finalize-attachment-upload] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(`Fält "${disallowed}" är inte tillåtet.`, corsHeaders);
    }

    console.log(
      `[finalize-attachment-upload] ALLOW | caller_user_id=${user.id} | event=${eventId} | path=${path} | bytes=${actualSizeBytes}`,
    );

    const created = await createAirtableRecord(BILAGOR_TABLE, fields);

    return new Response(
      JSON.stringify({
        attachment: mapAttachmentRecord(created),
        record: { id: created.id, fields: created.fields, createdTime: created.createdTime },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'finalize-attachment-upload',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
