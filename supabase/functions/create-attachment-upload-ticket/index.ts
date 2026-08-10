// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som upload-attachment/index.ts.
//
// create-attachment-upload-ticket — TASK-146.4 mönster 2, steg 1 ("stora
// filer"): utfärdar ett TIDSBEGRÄNSAT, PATH-SCOPAT uppladdningstillstånd
// (AC #4). Bytesen passerar ALDRIG denna funktion — klienten (adaptern,
// `AirtableAdapter.uploadAttachmentLarge`) laddar upp direkt mot Supabase
// Storage med det utfärdade tillståndet, och slutför sedan via
// finalize-attachment-upload.
//
// AUKTORISATIONSBESLUTET (AC #5) fattas HÄR, server-side: eventet måste
// finnas (404 annars), filen måste vara en PDF, och storleken måste rymmas
// under bucketens FAKTISKA gräns — läst LIVE (`storage.getBucket`), inte en
// duplicerad konstant, samma disciplin som test-attachments-storage
// (TASK-146.3). Klienten får ALDRIG välja path eller attachmentId — båda
// genereras/deriveras HÄR och skickas TILLBAKA till klienten, som sedan
// måste presentera samma (eventId, attachmentId, filnamn) vid finalize för
// att path ska stämma (_shared/attachments.ts buildAttachmentPath).
//
// "Få veta direkt när en fil är för stor" (PRD US11, AC #6): storleks-
// kontrollen sker HÄR, INNAN något uppladdningstillstånd utfärdas — klienten
// slipper vänta på en uppladdning som ändå skulle avvisas av bucketen.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchAirtableRecord } from '../_shared/airtable-client.ts';
import {
  BILAGOR_BUCKET_ID,
  buildAttachmentPath,
  EVENTPLANERING_TABLE,
  formatMB,
  isValidEventId,
  SIGNED_UPLOAD_URL_TTL_SECONDS,
} from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, HttpError, mapErrorToResponse } from '../_shared/errors.ts';

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
    const filnamn = body?.filnamn;
    const contentType = body?.contentType;
    const sizeBytes = body?.sizeBytes;

    if (!isValidEventId(eventId)) {
      return badRequest('Ogiltigt event-id.', corsHeaders);
    }
    if (typeof filnamn !== 'string' || !filnamn.trim()) {
      return badRequest('Filen saknar namn.', corsHeaders);
    }
    if (contentType !== 'application/pdf') {
      return badRequest('Bara PDF-filer kan laddas upp just nu.', corsHeaders);
    }
    if (typeof sizeBytes !== 'number' || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return badRequest('Filstorleken saknas eller är ogiltig.', corsHeaders);
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

    // Bucketens FAKTISKA gräns läses LIVE — inte en duplicerad konstant
    // (samma disciplin som test-attachments-storage, TASK-146.3).
    const { data: bucket, error: bucketError } = await supabaseAdmin.storage.getBucket(
      BILAGOR_BUCKET_ID,
    );
    if (bucketError || !bucket || typeof bucket.file_size_limit !== 'number') {
      throw new HttpError(
        502,
        `Lagringen kunde inte kontrolleras just nu (${bucketError?.message ?? 'okänt fel'}). Prova igen.`,
      );
    }

    if (sizeBytes > bucket.file_size_limit) {
      return badRequest(
        `Filen är ${formatMB(sizeBytes)}, vilket är för stort ` +
          `(max ${formatMB(bucket.file_size_limit)}). Prova en mindre fil.`,
        corsHeaders,
      );
    }

    const attachmentId = crypto.randomUUID();
    const path = buildAttachmentPath(eventId, attachmentId, filnamn);

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .createSignedUploadUrl(path);
    if (signError || !signed) {
      throw new HttpError(
        502,
        `Uppladdningstillståndet kunde inte skapas: ${signError?.message ?? 'okänt fel'}. Prova igen.`,
      );
    }

    console.log(
      `[create-attachment-upload-ticket] ALLOW | caller_user_id=${user.id} | event=${eventId} | path=${path} | sizeBytes=${sizeBytes}`,
    );

    return new Response(
      JSON.stringify({
        ticket: {
          attachmentId,
          path: signed.path,
          token: signed.token,
          signedUrl: signed.signedUrl,
          maxBytes: bucket.file_size_limit,
          expiresInSec: SIGNED_UPLOAD_URL_TTL_SECONDS,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'create-attachment-upload-ticket',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
