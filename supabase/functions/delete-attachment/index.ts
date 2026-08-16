// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som övriga _shared-konsumerande EF:er.
//
// delete-attachment — TASK-147.11 "Äkta ersätt och radera för bilagor" (PRD
// task-147, uppföljning av task-147.6:s fynd 3: "adaptern saknar delete/
// replace-primitiv (grep -n delete DataSourceAdapter.ts = 0 träffar) — att
// lägga till ett sådant är backend-arkitektur utanför det kortets scope".
// Det kortet byggde i stället en klientsidig `grupperaPerNamn`-attrapp
// (DokumentYta.tsx) som bara GRUPPERADE samma-namn-rader i UI:t — den gamla
// raden och dess Storage-bytes blev kvarliggande skräp i basen. Denna EF är
// den riktiga primitiven `grupperaPerNamn` saknade.
//
// Repots ANDRA delete-operation (den FÖRSTA: `_shared/receipt-numbering.ts`
// § `LedgerRemover`, TASK-147.7, en förlorad kvittonummer-allokerings-
// kandidat) — SAMMA `deleteAirtableRecord` (`_shared/airtable-client.ts`)
// återanvänds här, ingen parallell implementation.
//
// EN POST PER ANROP, ALDRIG BULK (SECURITY-SPEC §6.10-ribban): body bär
// EXAKT ett `attachmentId`, aldrig en lista. Adaptern (`AirtableAdapter.
// deleteAttachment`) exponerar samma en-i-taget-form; Dokument-ytans
// "Ersätt"-knapp anropar den en gång per fil, aldrig batchat.
//
// ÄGARSKAPS-GUARDEN (EF-ribbans "guard", SECURITY-SPEC §6.10): klienten
// skickar BÅDE `eventId` och `attachmentId`. EF:en hämtar bilage-raden och
// kräver att dess `Event`-länk FAKTISKT innehåller det angivna `eventId`:t
// INNAN något raderas (403 annars, `ForbiddenError`) — en klient som
// skickar ett giltigt, existerande `attachmentId` men fel `eventId` nekas.
// Samma försvar-i-djupet-linje som `finalize-attachment-upload`s path-
// verifiering (`_shared/attachments.ts` § `buildAttachmentPath`): en
// operation kan aldrig pekas mot en resurs utan att servern SJÄLV verifierar
// att resursen faktiskt hör dit klienten påstår.
//
// RADERAR BÅDE STORAGE-BYTESEN OCH BILAGOR-METADATARADEN. `Lagringsnyckel`
// (TASK-147.5, additiv) ÄR redan den fullständiga Storage-LEAF:en
// (`buildAttachmentLeaf(attachmentId, filnamn)` — se `upload-attachment`/
// `finalize-attachment-upload`/`generate-event-attachment`, som alla tre
// skriver fältet med exakt den formeln) — full path är alltså
// `${eventId}/${Lagringsnyckel}`, SAMMA formel `buildAttachmentPath` bygger,
// utan att den hjälparen behöver importeras separat.
//
// STORAGE-BORTTAGNINGEN ÄR BEST-EFFORT (loggad varning vid fel eller saknad
// `Lagringsnyckel` — legacy-rader från FÖRE TASK-147.5 kan sakna fältet;
// blockerar aldrig). BILAGOR-RADENS BORTTAGNING ÄR HÅRT KRAV: det är RADEN
// som gör bilagan "borta" ur appens perspektiv (Dokument-ytans lista läser
// `fetchEventAttachments`, som bara ser Bilagor-rader) — en Storage-orphan
// är ofarligt skräp (samma avgränsning `upload-attachment.staging.test.ts`
// § STORAGE-BYTESEN redan bokför för uppladdningsvägen), en kvarlevande
// Bilagor-rad är EXAKT det detta kort finns för att åtgärda. Misslyckas
// Airtable-borttagningen returneras 502 — klienten vet då att raden
// fortfarande finns och kan visa ett ärligt fel i stället för att tyst tro
// att bilagan är borta.
//
// AUKTORISATION: samma nivå som create-event-note/generate-event-attachment
// (requireUser, ingen extra ADMIN_EMAILS-gate) — att radera en bilaga är en
// likvärdig admin-handling, ingen kontohantering.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { deleteAirtableRecord, fetchAirtableRecord } from '../_shared/airtable-client.ts';
import {
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  isValidEventId as isValidRecordId,
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

// Eventets omvända länkfält — SAMMA namn som get-event-attachments använder
// för att LÄSA listan (Bilagor.Event är den framåtriktade länken denna EF
// kontrollerar; ATTACHMENTS_LINK_FIELD där är den omvända spegeln på
// Eventplanering-sidan — två olika fält, samma relation).
const EVENT_LINK_FIELD = 'Event';
const LAGRINGSNYCKEL_FIELD = 'Lagringsnyckel';

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

    // EN post per anrop (SECURITY-SPEC §6.10) — body-formen bär inte ens
    // plats för en lista, men den explicita formen är öppen bokföring, inte
    // bara implicit av typen.
    if (!isValidRecordId(eventId)) {
      throw new ValidationError('eventId is required and must be an Airtable record ID (rec…)');
    }
    if (!isValidRecordId(attachmentId)) {
      throw new ValidationError(
        'attachmentId is required and must be an Airtable record ID (rec…)',
      );
    }

    // 1) Bilage-raden måste existera — 404 annars (ärver get-event/get-event-
    //    attachments-kontraktet: "hittades inte" är ett normalt, hanterat
    //    tillstånd, ingen 500).
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
    const linkedEventIds = attachmentRecord.fields[EVENT_LINK_FIELD];
    const belongsToEvent =
      Array.isArray(linkedEventIds) && (linkedEventIds as unknown[]).includes(eventId);
    if (!belongsToEvent) {
      console.warn(
        `[delete-attachment] DENY ownership guard | caller_user_id=${user.id} | attachment=${attachmentId} | claimed_event=${eventId}`,
      );
      throw new ForbiddenError('Bilagan hör inte till det angivna eventet.');
    }

    // 3) Storage-bytesen — BEST-EFFORT (se filhuvudet). `Lagringsnyckel`
    //    ÄR redan den fulla leaf-strängen (buildAttachmentLeaf), så
    //    `${eventId}/${lagringsnyckel}` är EXAKT samma path
    //    buildAttachmentPath byggde vid uppladdning/generering.
    const lagringsnyckel = attachmentRecord.fields[LAGRINGSNYCKEL_FIELD];
    if (typeof lagringsnyckel === 'string' && lagringsnyckel.length > 0) {
      const path = `${eventId}/${lagringsnyckel}`;
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { error: removeError } = await supabaseAdmin.storage
        .from(BILAGOR_BUCKET_ID)
        .remove([path]);
      if (removeError) {
        // Loggat, inte kastat — se filhuvudets BEST-EFFORT-resonemang.
        console.warn(
          `[delete-attachment] Storage-borttagning misslyckades (fortsätter ändå) | caller_user_id=${user.id} | path=${path} | error=${removeError.message}`,
        );
      }
    } else {
      console.warn(
        `[delete-attachment] Ingen Lagringsnyckel på raden — legacy-rad från före TASK-147.5, ` +
          `hoppar över Storage-borttagning | caller_user_id=${user.id} | attachment=${attachmentId}`,
      );
    }

    // 4) Bilagor-raden — HÅRT KRAV. Misslyckas denna vet klienten (502) att
    //    bilagan FORTFARANDE finns, i stället för att tyst tro motsatsen.
    try {
      await deleteAirtableRecord(BILAGOR_TABLE, attachmentId);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : String(deleteError);
      throw new HttpError(502, `Bilagan kunde inte raderas ur registret: ${message}. Prova igen.`);
    }

    console.log(
      `[delete-attachment] ALLOW | caller_user_id=${user.id} | event=${eventId} | attachment=${attachmentId}`,
    );

    return new Response(JSON.stringify({ deleted: true, requestId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'delete-attachment',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
