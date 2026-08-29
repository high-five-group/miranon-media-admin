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
//
// [UTBYGGD, TASK-275.3, ADR-118] ÄGARSKAPS-GUARDEN OVAN GÄLLDE TIDIGARE
// OVILLKORAT — och 403:ade därmed VARJE gemensam bilaga (Räckvidd Gemensam,
// eller legacy Kurstyp/Alla event) öppnad från ett ANNAT event än det den
// råkade laddas upp
// ifrån, trots att ADR-118 beslut 2 uttryckligen kräver att en sådan bilaga
// SKA kunna öppnas från varje event unionen visar den på (eller från
// räckviddsläget). Guarden är nu RÄCKVIDDSMEDVETEN (SAMMA mönster
// delete-attachment/index.ts redan bar sedan 275.2): en gemensam bilaga
// bär inget ägarskaps-krav alls; en Event-räckviddig (eller legacy/okänd)
// bilaga bär det OFÖRÄNDRAT. `eventId` är därför också blivit en VALFRI
// query-param (`null` = "inget event/räckviddsläge") — och path-ankaret
// härleds numera ur BILAGANS EGNA fält (`buildStorageAnchor`), inte längre
// ur det klient-angivna `eventId`:t, eftersom det senare inte längre är
// garanterat att stämma med bilagans faktiska Storage-plats när guarden
// tillåter ett "främmande" event att fråga.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchAirtableRecord } from '../_shared/airtable-client.ts';
import {
  arGemensam,
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  buildStorageAnchor,
  isValidEventId as isValidRecordId,
  normaliseraRackvidd,
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
    const rawEventId = url.searchParams.get('eventId');
    const attachmentId = url.searchParams.get('attachmentId');

    // [TASK-275.3, ADR-118 beslut 5] `eventId` är NU VALFRI på QUERY-nivå —
    // ANGES den måste den ändå ha rec-formen. Om den KRÄVS avgörs i steg 2
    // nedan, EFTER att bilagans egen räckvidd är känd — SAMMA tvåstegs-
    // validering som delete-attachment/index.ts redan etablerar.
    if (rawEventId !== null && !isValidRecordId(rawEventId)) {
      throw new ValidationError('eventId must be an Airtable record ID (rec…) when provided');
    }
    const eventId: string | null = rawEventId;
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

    // 2) AUKTORISATIONEN — läser bilagans EGEN `Räckvidd`, ALDRIG bara
    //    `Event`s satthet (TASK-275.3, SAMMA mönster som
    //    delete-attachment/index.ts steg 2 — se den filens filhuvud för det
    //    fulla resonemanget kring VARFÖR):
    //      - GEMENSAM bilaga (Räckvidd Gemensam, eller legacy Kurstyp/
    //        Alla event som normaliseras dit — TASK-338.2): INGET
    //        ägarskaps-guard alls. Per definition ska en gemensam bilaga
    //        kunna öppnas från VARJE event den gäller (unionen,
    //        get-event-attachments) ELLER från räckviddsläget (inget
    //        eventId) — en klient-angiven `eventId` läses inte ens här,
    //        den behövs bara som "vilket events sida stod jag på", inte som
    //        en behörighetskälla. Detta är EXAKT AC #2s "förhandsvisning/
    //        nedladdning av ÄRVDA dokument MÅSTE fungera" — innan denna
    //        rättning 403:ade EF:en varje gemensam bilaga öppnad från ett
    //        ANNAT event än det den råkade laddas upp ifrån.
    //      - Event-räckvidd (eller legacy/okänt Räckvidd-värde —
    //        fail-closed mot den STRIKTARE av de två vägarna): `eventId`
    //        KRÄVS, ägarskaps-guarden gäller OFÖRÄNDRAT (samma beteende som
    //        före TASK-275.3 — regressionsskyddet: en Event-räckviddig
    //        bilaga nekas FORTFARANDE från fel event).
    //      [TASK-338.2, ADR-125 § Beslut 1] Predikatet läser NU den delade
    //      `arGemensam` efter `normaliseraRackvidd`, inte en egen
    //      uppräkning av legacy-värdena. Utan den ändringen hade varje
    //      bilaga med den NYA räckvidden (`Gemensam`) klassats som
    //      Event-räckviddig och 403:ats från varje ANNAT event än det den
    //      laddades upp ifrån — exakt den regression AC #2 i TASK-275.3
    //      redan en gång fällde, återuppstånden genom ett nytt optionsnamn.
    const rackvidd = attachmentRecord.fields['Räckvidd'];
    const isGemensam = arGemensam(
      normaliseraRackvidd({
        rackvidd: typeof rackvidd === 'string' && rackvidd.length > 0 ? rackvidd : null,
        kursfamilj: null,
        kursniva: null,
        platsIds: [],
      }).rackvidd,
    );

    if (!isGemensam) {
      if (eventId === null) {
        throw new ValidationError(
          'eventId is required and must be an Airtable record ID (rec…)',
        );
      }
      const linkedEventIds = attachmentRecord.fields[EVENT_LINK_FIELD];
      const belongsToEvent =
        Array.isArray(linkedEventIds) && (linkedEventIds as unknown[]).includes(eventId);
      if (!belongsToEvent) {
        console.warn(
          `[get-attachment-download-url] DENY ownership guard | caller_user_id=${user.id} | attachment=${attachmentId} | claimed_event=${eventId}`,
        );
        throw new ForbiddenError('Bilagan hör inte till det angivna eventet.');
      }
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

    // 4) [TASK-275.3] Path-ANKARET HÄRLEDS ur bilagans EGNA fält via
    //    `buildStorageAnchor` (_shared/attachments.ts) — INTE längre det
    //    klient-angivna `eventId`:t. Nödvändigt sedan steg 2 tillåter en
    //    gemensam bilaga öppnas från VILKET event/räckviddsläge som helst:
    //    ett klient-eventId kan då peka mot ett event bilagan INTE
    //    laddades upp ifrån, vilket hade gett en fel path (och en trasig
    //    signering) om det använts direkt. Bilagans EGEN `Event`-länk +
    //    `Räckvidd`/`Kursfamilj` är den enda källan som alltid stämmer med
    //    den path uppladdningen faktiskt skrev till — SAMMA formel
    //    delete-attachment/index.ts nu också läser tillbaka (en formel, två
    //    läsande konsumenter, se den filens motsvarande kommentar).
    const linkedEventIds2 = attachmentRecord.fields[EVENT_LINK_FIELD];
    const linkedEventId =
      Array.isArray(linkedEventIds2) && linkedEventIds2.length > 0
        ? (linkedEventIds2[0] as string)
        : null;
    const anchor = buildStorageAnchor({
      eventId: linkedEventId,
      rackvidd: typeof rackvidd === 'string' ? rackvidd : '',
      kursfamilj:
        typeof attachmentRecord.fields['Kursfamilj'] === 'string'
          ? (attachmentRecord.fields['Kursfamilj'] as string)
          : null,
    });
    if (anchor === null) {
      throw new HttpError(500, 'Kunde inte härleda lagringsplats för filen.');
    }
    const path = `${anchor}/${lagringsnyckel}`;
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
      `[get-attachment-download-url] ALLOW | caller_user_id=${user.id} | event=${eventId ?? '(inget/räckviddsläge)'} | attachment=${attachmentId}`,
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
