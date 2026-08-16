// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som övriga _shared-konsumerande EF:er.
//
// get-attachment-download-url — TASK-245 "Signerad nedladdnings-EF för
// bilagor — Visa-overlayens saknade fil-URL". Fynd ur dokument-varv 3
// (PR #1415, DokumentYta.tsx § filhuvud, skärpningsvarv 3 punkt 5): Marcus
// kvitterade overlay-förhandsvisning + ladda ner-fallback för bilagor, men
// INGEN väg till filens bytes fanns — bucketen `bilagor` är PRIVAT
// (`scripts/provision-attachments-bucket.mjs`, `public: false`, ingen
// `storage.objects`-policy), och `supabase/functions/` bar bara en
// UPPLADDNINGS-signatur (`create-attachment-upload-ticket`), aldrig en
// NEDLADDNINGS-motsvarighet. Denna EF är den saknade primitiven.
//
// SAMMA ÄGARSKAPS-GUARD-MÖNSTER SOM delete-attachment (TASK-147.11): klienten
// skickar BÅDE `eventId` och `attachmentId` (Airtable-record-ID, `rec…` — SAMMA
// ID som `Attachment.id` på klientkontraktet, INTE den interna
// uppladdnings-UUID:n som bara lever i `Lagringsnyckel`). EF:en hämtar
// bilage-raden och kräver att dess `Event`-länk FAKTISKT innehåller det
// angivna `eventId`:t INNAN en signerad URL utfärdas (403 annars,
// `ForbiddenError`) — en klient som skickar ett giltigt, existerande
// `attachmentId` men fel `eventId` nekas. Samma försvar-i-djupet-linje som
// `finalize-attachment-upload`s path-verifiering och `delete-attachment`s
// guard.
//
// LÄSER BARA (GET, query-params `?eventId=&attachmentId=`) — ingen
// mutation, ingen allowlist-grind behövs. Speglar `get-event-attachments`s
// verb-val, inte `delete-attachment`s POST (den ÄR en mutation).
//
// TTL — 300 sekunder (5 minuter), se `_shared/attachments.ts` §
// SIGNED_DOWNLOAD_URL_TTL_SECONDS för det fulla, källbelagda resonemanget
// (AWS Prescriptive Guidance: korta TTL:er är branschstandard för signerade
// URL:er; kort men gott om tid för en Visa-overlay-session).
//
// LEGACY-RADER UTAN `Lagringsnyckel` (pre-TASK-147.5) KAN INTE FÅ EN URL —
// till skillnad mot `delete-attachment`s BEST-EFFORT-hantering (radering
// fungerar även utan fältet, Storage-borttagningen hoppas bara över) finns
// här INGEN väg att derivera Storage-path utan fältet. 409 Conflict (samma
// statuskod `create-registration/index.ts` redan etablerar för denna klass
// av "resursen finns, men kan inte behandlas som begärt") med ett
// Lotta-läsbart fel — INTE 404 (raden finns, den saknar bara det denna
// operation behöver) och INTE 500 (förväntat, hanterat tillstånd för
// historiska rader, inte en serverbugg).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchAirtableRecord } from '../_shared/airtable-client.ts';
import {
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  isValidEventId as isValidRecordId,
  SIGNED_DOWNLOAD_URL_TTL_SECONDS,
} from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import {
  ForbiddenError,
  generateRequestId,
  HttpError,
  mapErrorToResponse,
  ValidationError,
} from '../_shared/errors.ts';

// SAMMA fältnamn som delete-attachment/index.ts — se den filens kommentar
// för varför dessa är duplicerade lokala konstanter i stället för
// _shared-export (etablerad konvention, 147.11).
const EVENT_LINK_FIELD = 'Event';
const LAGRINGSNYCKEL_FIELD = 'Lagringsnyckel';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get('eventId');
    const attachmentId = url.searchParams.get('attachmentId');

    if (!isValidRecordId(eventId)) {
      throw new ValidationError('eventId is required and must be an Airtable record ID (rec…)');
    }
    if (!isValidRecordId(attachmentId)) {
      throw new ValidationError(
        'attachmentId is required and must be an Airtable record ID (rec…)',
      );
    }

    // 1) Bilage-raden måste existera — 404 annars (ärver get-event/
    //    delete-attachment-kontraktet: "hittades inte" är ett normalt,
    //    hanterat tillstånd, ingen 500).
    const attachmentRecord = await fetchAirtableRecord(BILAGOR_TABLE, attachmentId);
    if (!attachmentRecord) {
      return new Response(JSON.stringify({ error: 'Bilagan hittades inte.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) ÄGARSKAPS-GUARDEN: bilagans Event-länk måste FAKTISKT innehålla det
    //    angivna eventId:t. En klient som skickar ett giltigt attachmentId
    //    men fel/gissat eventId nekas — server-side, inte klient-litad.
    //    SAMMA mönster som delete-attachment/index.ts steg 2.
    const linkedEventIds = attachmentRecord.fields[EVENT_LINK_FIELD];
    const belongsToEvent =
      Array.isArray(linkedEventIds) && (linkedEventIds as unknown[]).includes(eventId);
    if (!belongsToEvent) {
      console.warn(
        `[get-attachment-download-url] DENY ownership guard | caller_user_id=${user.id} | attachment=${attachmentId} | claimed_event=${eventId}`,
      );
      throw new ForbiddenError('Bilagan hör inte till det angivna eventet.');
    }

    // 3) Lagringsnyckel krävs för att kunna derivera Storage-path — se
    //    filhuvudets stycke om legacy-rader. Ingen best-effort-väg här
    //    (till skillnad mot delete-attachment): utan fältet finns ingen
    //    path att signera.
    const lagringsnyckel = attachmentRecord.fields[LAGRINGSNYCKEL_FIELD];
    if (typeof lagringsnyckel !== 'string' || lagringsnyckel.length === 0) {
      console.warn(
        `[get-attachment-download-url] Ingen Lagringsnyckel på raden — legacy-rad från före ` +
          `TASK-147.5, kan inte signera URL | caller_user_id=${user.id} | attachment=${attachmentId}`,
      );
      throw new HttpError(
        409,
        'Den här filen kan inte öppnas här — den skapades innan förhandsvisning stöddes. Kontakta support om du behöver den.',
      );
    }

    // 4) Samma deterministiska path-formel som upload-attachment/
    //    finalize-attachment-upload/delete-attachment: `${eventId}/${Lagringsnyckel}`
    //    (Lagringsnyckel ÄR redan den fulla leaf-strängen, se
    //    _shared/attachments.ts § buildAttachmentLeaf).
    const path = `${eventId}/${lagringsnyckel}`;
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .createSignedUrl(path, SIGNED_DOWNLOAD_URL_TTL_SECONDS);
    if (signError || !signed) {
      throw new HttpError(
        502,
        `Kunde inte skapa en nedladdningslänk: ${signError?.message ?? 'okänt fel'}. Prova igen.`,
      );
    }

    console.log(
      `[get-attachment-download-url] ALLOW | caller_user_id=${user.id} | event=${eventId} | attachment=${attachmentId}`,
    );

    return new Response(
      JSON.stringify({
        url: signed.signedUrl,
        expiresInSeconds: SIGNED_DOWNLOAD_URL_TTL_SECONDS,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-attachment-download-url',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
