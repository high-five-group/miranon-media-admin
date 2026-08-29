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
// [UTBYGGD, TASK-275.2, ADR-118 beslut 3 · TASK-338.2, ADR-125 § Beslut 1]
// `eventId` ÄR VALFRI — signalen som skiljer "ur eventkontext" från "i
// räckviddsläge" för en GEMENSAM bilaga (Räckvidd `Gemensam`, eller ett av
// legacy-värdena Kurstyp/Alla event som normaliseras dit):
//   - Bilagans Räckvidd är Event (eller legacy/okänt, fail-closed mot den
//     STRIKTARE vägen): `eventId` KRÄVS fortfarande, ägarskaps-guarden ovan
//     gäller OFÖRÄNDRAT.
//   - Bilagans Räckvidd är Gemensam (eller legacy Kurstyp/Alla event):
//       * `eventId` ANGIVEN → 403 NEKAS ("ur eventkontext" — AC #3, olycks-
//         skyddet: att städa ett events lista får aldrig radera kurs-
//         familjens/alla-event-dokumentet).
//       * `eventId` UTELÄMNAD → TILLÅTS ("räckviddsläge" — Dokument-ytans
//         läge utan valt event, ADR-118 beslut 5). Inget ägarskaps-guard
//         här: det finns inget "claimed event" att verifiera mot.
// Auktorisationen läser alltså `Räckvidd`, ALDRIG `Event`s satthet — se
// upload-attachment/index.ts § filhuvudet för varför `Event` fortfarande är
// satt även på gemensamma bilagor (storage-path-ankaret).
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
  arGemensam,
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  buildStorageAnchor,
  isValidEventId as isValidRecordId,
  normaliseraRackvidd,
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
    const rawEventId = body?.eventId;
    const attachmentId = body?.attachmentId;

    // [TASK-275.2] `eventId` är NU VALFRI — se filhuvudet. ANGES den måste
    // den ändå ha rec-formen (en ogiltig-format-eventId är ALLTID ett
    // klientfel, oavsett räckvidd).
    if (rawEventId !== undefined && rawEventId !== null && !isValidRecordId(rawEventId)) {
      throw new ValidationError('eventId must be an Airtable record ID (rec…) when provided');
    }
    const eventId: string | null = typeof rawEventId === 'string' ? rawEventId : null;

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

    // 2) AUKTORISATIONEN — läser bilagans EGEN `Räckvidd`, ALDRIG `Event`s
    //    satthet (se filhuvudet, [UTBYGGD, TASK-275.2]).
    //    [TASK-338.2, ADR-125 § Beslut 1] Predikatet läser NU den delade
    //    `arGemensam` efter `normaliseraRackvidd` i stället för att räkna
    //    upp legacy-värdena själv. Utan den ändringen hade varje bilaga
    //    skriven med den NYA räckvidden (`Gemensam`) klassats som
    //    Event-räckviddig och därmed blivit ORADERBAR i räckviddsläget —
    //    fail-closed åt fel håll, och en tyst regression eftersom
    //    uppräkningen såg fullständig ut.
    const rackvidd = attachmentRecord.fields['Räckvidd'];
    const isGemensam = arGemensam(
      normaliseraRackvidd({
        rackvidd: typeof rackvidd === 'string' && rackvidd.length > 0 ? rackvidd : null,
        kursfamilj: null,
        kursniva: null,
        platsIds: [],
      }).rackvidd,
    );

    if (isGemensam) {
      if (eventId !== null) {
        console.warn(
          `[delete-attachment] DENY gemensam bilaga ur eventkontext | caller_user_id=${user.id} | attachment=${attachmentId} | rackvidd=${rackvidd} | claimed_event=${eventId}`,
        );
        throw new ForbiddenError(
          'Gemensamma bilagor kan bara raderas i sitt räckviddsläge, inte ur ett enskilt events sida.',
        );
      }
      // räckviddsläge (inget eventId angivet) — TILLÅTET, inget ägarskaps-
      // guard: det finns inget "claimed event" att verifiera mot.
    } else {
      // Event-räckvidd (eller legacy/okänt Räckvidd-värde — fail-closed mot
      // den STRIKTARE av de två vägarna): eventId krävs, ägarskaps-guarden
      // gäller OFÖRÄNDRAT (samma beteende som före TASK-275.2).
      if (eventId === null) {
        throw new ValidationError('eventId is required and must be an Airtable record ID (rec…)');
      }
      const linkedEventIds = attachmentRecord.fields[EVENT_LINK_FIELD];
      const belongsToEvent =
        Array.isArray(linkedEventIds) && (linkedEventIds as unknown[]).includes(eventId);
      if (!belongsToEvent) {
        console.warn(
          `[delete-attachment] DENY ownership guard | caller_user_id=${user.id} | attachment=${attachmentId} | claimed_event=${eventId}`,
        );
        throw new ForbiddenError('Bilagan hör inte till det angivna eventet.');
      }
    }

    // 3) Storage-bytesen — BEST-EFFORT (se filhuvudet). Path-ankaret HÄRLEDS
    //    ur bilagans EGNA fält via `buildStorageAnchor` (_shared/
    //    attachments.ts, TASK-275.3) — INTE bara `Event`-länken längre:
    //    en GENUINT event-lös gemensam bilaga (räckviddslägets
    //    event-lösa uppladdning, ADR-118 beslut 5) saknar `Event` helt, och
    //    dess Storage-objekt ligger i stället under `kurstyp/<kursfamilj>`
    //    eller `alla-event` — SAMMA formel `upload-attachment/index.ts` skrev
    //    med vid uppladdning (en formel, två användningar, se den
    //    funktionens docblock). Rader FRÅN FÖRE TASK-275.3 (alla bar en
    //    `Event`-länk oavsett räckvidd, 275.2:s design) tar fortfarande
    //    gren 1 (eventId satt) — beteendet för dem är BYTE FÖR BYTE
    //    OFÖRÄNDRAT.
    //    `Lagringsnyckel` ÄR redan den fulla leaf-strängen
    //    (buildAttachmentLeaf), så `${anchor}/${lagringsnyckel}` är
    //    EXAKT samma path buildAttachmentPath byggde vid uppladdning.
    const linkedEvent = attachmentRecord.fields[EVENT_LINK_FIELD];
    const linkedEventId =
      Array.isArray(linkedEvent) && linkedEvent.length > 0 ? (linkedEvent[0] as string) : null;
    const anchor = buildStorageAnchor({
      eventId: linkedEventId,
      rackvidd: typeof rackvidd === 'string' ? rackvidd : '',
      kursfamilj:
        typeof attachmentRecord.fields['Kursfamilj'] === 'string'
          ? (attachmentRecord.fields['Kursfamilj'] as string)
          : null,
    });
    const lagringsnyckel = attachmentRecord.fields[LAGRINGSNYCKEL_FIELD];
    if (anchor && typeof lagringsnyckel === 'string' && lagringsnyckel.length > 0) {
      const path = `${anchor}/${lagringsnyckel}`;
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
        `[delete-attachment] Ingen Lagringsnyckel/Event-länk på raden — legacy-rad från före ` +
          `TASK-147.5, hoppar över Storage-borttagning | caller_user_id=${user.id} | attachment=${attachmentId}`,
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
      `[delete-attachment] ALLOW | caller_user_id=${user.id} | event=${eventId ?? '(räckviddsläge)'} | attachment=${attachmentId}`,
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
