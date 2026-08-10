// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som create-event-note/index.ts och
// test-attachments-storage/index.ts.
//
// upload-attachment — TASK-146.4 mönster 1 ("små filer"): bytesen skickas i
// request-body, EF:en skriver dem till lagringen MED FÖRHÖJD BEHÖRIGHET
// (service-role) OCH en Bilagor-metadatarad i SAMMA operation (AC #3).
// Filer över SMALL_UPLOAD_MAX_BYTES avvisas här — de går via
// create-attachment-upload-ticket + finalize-attachment-upload i stället
// (mönster 2, AC #4).
//
// AUKTORISATIONSBESLUTET (AC #5) fattas HÄR, server-side: eventet måste
// finnas (404 annars), filen måste vara en PDF (matchar bucketens
// allowedMimeTypes, försvar-i-djupet), och storleken måste rymmas under
// mönster 1:s gräns. Klienten får aldrig välja path själv — attachmentId
// genereras HÄR (crypto.randomUUID()) och path byggs deterministiskt
// (_shared/attachments.ts buildAttachmentPath).
//
// FELMEDDELANDEN PÅ LOTTAS SPRÅK (AC #6): varje avvisning ger ett
// människoläsbart svenskt fel (filstorlek i MB, inte byte) — aldrig en rå
// bytejämförelse.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createAirtableRecord, fetchAirtableRecord } from '../_shared/airtable-client.ts';
import {
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  buildAttachmentPath,
  EVENTPLANERING_TABLE,
  formatMB,
  isValidEventId,
  mapAttachmentRecord,
  SMALL_UPLOAD_MAX_BYTES,
} from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import {
  generateRequestId,
  HttpError,
  mapErrorToResponse,
  ValidationError,
} from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

const OPERATION_KEY = 'create-attachment';

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Avkodar base64 → Uint8Array. Kastar ValidationError vid ogiltig base64 (klientfel, ej krasch). */
function decodeBase64(bytesBase64: string): Uint8Array {
  let binary: string;
  try {
    binary = atob(bytesBase64);
  } catch {
    throw new ValidationError('Filen kunde inte tolkas — den verkar vara skadad.');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
    const filnamn = body?.filnamn;
    const contentType = body?.contentType;
    const bytesBase64 = body?.bytesBase64;

    if (!isValidEventId(eventId)) {
      return badRequest('Ogiltigt event-id.', corsHeaders);
    }
    if (typeof filnamn !== 'string' || !filnamn.trim()) {
      return badRequest('Filen saknar namn.', corsHeaders);
    }
    if (contentType !== 'application/pdf') {
      return badRequest('Bara PDF-filer kan laddas upp just nu.', corsHeaders);
    }
    if (typeof bytesBase64 !== 'string' || bytesBase64.length === 0) {
      return badRequest('Filen saknar innehåll.', corsHeaders);
    }

    const bytes = decodeBase64(bytesBase64);
    if (bytes.length === 0) {
      return badRequest('Filen verkar vara tom.', corsHeaders);
    }
    if (bytes.length > SMALL_UPLOAD_MAX_BYTES) {
      return badRequest(
        `Filen är ${formatMB(bytes.length)}, vilket är för stort för direktuppladdning ` +
          `(max ${formatMB(SMALL_UPLOAD_MAX_BYTES)}). Prova en mindre fil.`,
        corsHeaders,
      );
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

    const attachmentId = crypto.randomUUID();
    const path = buildAttachmentPath(eventId, attachmentId, filnamn);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .upload(path, bytes, { contentType });
    if (uploadError) {
      throw new HttpError(502, `Uppladdningen misslyckades: ${uploadError.message}. Prova igen.`);
    }

    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      throw new HttpError(500, `Okänd operation: ${OPERATION_KEY}`);
    }

    const fields: Record<string, unknown> = {
      Namn: filnamn.trim(),
      'Storlek (bytes)': bytes.length,
      Skapad: new Date().toISOString(),
      Event: [eventId],
    };

    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[upload-attachment] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      // Storage-objektet står kvar utan metadatarad här — känt fall, se
      // slutrapportens § avvikelser. Kan inte hända i normal drift (fields
      // är hårdkodade ovan) — detta är en SSOT-grind mot framtida kod-drift.
      return badRequest(`Fält "${disallowed}" är inte tillåtet.`, corsHeaders);
    }

    console.log(
      `[upload-attachment] ALLOW | caller_user_id=${user.id} | event=${eventId} | path=${path} | bytes=${bytes.length}`,
    );

    let created: { id: string; fields: Record<string, unknown>; createdTime: string };
    try {
      created = await createAirtableRecord(BILAGOR_TABLE, fields);
    } catch (airtableError) {
      // Bytesen ligger redan i lagringen men metadataraden misslyckades —
      // känd, öppet bokförd lucka (ingen kompenserande borttagning i v1, se
      // slutrapportens § avvikelser). Felet är fortfarande begripligt för
      // Lotta, inte en rå stack-trace.
      const message =
        airtableError instanceof Error ? airtableError.message : String(airtableError);
      throw new HttpError(
        502,
        `Filen laddades upp men kunde inte sparas i registret: ${message}. Prova igen.`,
      );
    }

    return new Response(
      JSON.stringify({
        attachment: mapAttachmentRecord(created),
        record: { id: created.id, fields: created.fields, createdTime: created.createdTime },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'upload-attachment',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
