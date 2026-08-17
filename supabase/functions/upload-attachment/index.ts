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
//
// [TASK-275.2, ADR-118] RÄCKVIDDSPARAMETRARNA (`rackvidd`/`kursfamilj`/
// `kursniva`, valfria — default 'Event', dagens beteende oförändrat)
// valideras STRIKT via `_shared/attachments.ts`s `AttachmentScopeInputSchema`
// innan `fields` byggs (`buildScopeFields`). Anges `eventId` skrivs
// `Event: [eventId]` OAVSETT räckvidd (oförändrat 275.2-beteende: den bär
// storage-path-ankaret och den befintliga ägarskaps-mekaniken i delete-
// attachment/get-attachment-download-url; olycksskyddet mot radering ur
// eventkontext läses av `Räckvidd`, inte av `Event`s satthet — se
// delete-attachment/index.ts).
//
// [UTBYGGD, TASK-275.3, ADR-118 beslut 5] `eventId` ÄR NU VALFRI — men
// ENDAST för Kurstyp/Alla event (GEMENSAM bilaga). Räckvidd Event kräver
// FORTFARANDE `eventId` (400 annars — en event-specifik bilaga utan event
// att specifik-vara-mot är en kontradiktion, inte ett läge). Det här är den
// "gemensamt läge utan valt event"-uppladdningen (ADR-118 beslut 5,
// Dokument-ytans räckviddsläge) som 275.2 flaggade öppet som ostödd — löst
// HÄR, inte gissad i förväg.
//
// `Event`-FÄLTET UTELÄMNAS (aldrig satt till en tom länk) när `eventId`
// saknas — ingen radlänk att peka mot. Storage-path-ANKARET härleds då i
// stället av `buildStorageAnchor` (_shared/attachments.ts): `kurstyp/
// <kursfamilj>` respektive den fasta strängen `alla-event` — SAMMA funktion
// `delete-attachment`/`get-attachment-download-url` läser tillbaka från
// (via bilagans EGNA fält, inte klient-buret) vid radering/nedladdning, så
// path-formeln kan aldrig drifta isär mellan skrivning och läsning.
//
// MEDVETEN AVGRÄNSNING (bokförd öppet, inte gissad): event-löst stöd gäller
// BARA mönster 1 (denna EF, filer ≤ SMALL_UPLOAD_MAX_BYTES). Mönster 2
// (create-attachment-upload-ticket + finalize-attachment-upload) rör INTE
// denna skiva — `eventId` är FORTFARANDE obligatorisk där. Adaptern
// (`AirtableAdapter.uploadAttachment`) avvisar därför ett event-löst
// uppladdningsförsök över gränsen med ett ärligt klientfel INNAN den ens
// försöker mönster 2 (se dess docblock för resonemanget) — Lottas verkliga
// dokument (hörlursinfo, meny) är PDF:er på några hundra kB, ordentligt
// under 6 MB-gränsen, så avgränsningen kostar inget i praktiken.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createAirtableRecord, fetchAirtableRecord } from '../_shared/airtable-client.ts';
import {
  ATTACHMENT_CLASS_UPPLADDAD,
  ATTACHMENT_SCOPE_EVENT,
  AttachmentScopeInputSchema,
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  buildAttachmentLeaf,
  buildAttachmentPath,
  buildScopeFields,
  buildStorageAnchor,
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
    const rawEventId = body?.eventId;
    const filnamn = body?.filnamn;
    const contentType = body?.contentType;
    const bytesBase64 = body?.bytesBase64;

    // [TASK-275.3, ADR-118 beslut 5] `eventId` är VALFRI på KROPPS-nivå —
    // ANGES den måste den ändå ha rec-formen (ett klientfel oavsett räckvidd).
    // Om den KRÄVS avgörs nedan, EFTER att räckvidden är känd (se
    // scopeParsed nedan) — samma tvåstegs-validering som delete-attachment/
    // index.ts redan etablerar för samma `eventId: string | null`-form.
    if (rawEventId !== undefined && rawEventId !== null && !isValidEventId(rawEventId)) {
      return badRequest('Ogiltigt event-id.', corsHeaders);
    }
    const eventId: string | null = typeof rawEventId === 'string' ? rawEventId : null;

    if (typeof filnamn !== 'string' || !filnamn.trim()) {
      return badRequest('Filen saknar namn.', corsHeaders);
    }
    if (contentType !== 'application/pdf') {
      return badRequest('Bara PDF-filer kan laddas upp just nu.', corsHeaders);
    }
    if (typeof bytesBase64 !== 'string' || bytesBase64.length === 0) {
      return badRequest('Filen saknar innehåll.', corsHeaders);
    }

    // [TASK-275.2] Räckviddsparametrarna — strikt Zod (AC #2). Ogiltig
    // kombination (t.ex. Kurstyp utan Kursfamilj, eller Kursfamilj angiven
    // trots räckvidd Event) → 400 med Zod:s egna, specifika felmeddelande.
    const scopeParsed = AttachmentScopeInputSchema.safeParse({
      rackvidd: body?.rackvidd,
      kursfamilj: body?.kursfamilj,
      kursniva: body?.kursniva,
    });
    if (!scopeParsed.success) {
      return badRequest(
        scopeParsed.error.issues[0]?.message ?? 'Ogiltig räckvidd.',
        corsHeaders,
      );
    }

    // [TASK-275.3, ADR-118 beslut 5] `eventId` KRÄVS fortfarande för räckvidd
    // Event (en event-specifik bilaga utan event är en kontradiktion) — men
    // ÄR VALFRI för Kurstyp/Alla event (gemensam bilaga, räckviddsläget).
    if (eventId === null && scopeParsed.data.rackvidd === ATTACHMENT_SCOPE_EVENT) {
      return badRequest('Ogiltigt event-id.', corsHeaders);
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

    // Eventet FINNS-kontrollen görs bara när ett eventId faktiskt angetts —
    // en genuint event-lös gemensam uppladdning har inget event att slå upp.
    if (eventId !== null) {
      const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
      if (!eventRecord) {
        return new Response(JSON.stringify({ error: 'Eventet hittades inte.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const attachmentId = crypto.randomUUID();
    // [TASK-275.3] Ankaret HÄRLEDS — se `buildStorageAnchor`s docblock för de
    // tre grenarna. `null` är strukturellt ouppnåeligt här: schemat ovan
    // garanterar redan att (eventId satt) ELLER (rackvidd=Kurstyp+kursfamilj)
    // ELLER (rackvidd=Alla event) håller — men en explicit 500 (i stället för
    // att skicka `null` vidare till `buildAttachmentPath` och få en trasig
    // `null/...`-path) är fail-closed, inte ett tyst antagande.
    const anchor = buildStorageAnchor({
      eventId,
      rackvidd: scopeParsed.data.rackvidd,
      kursfamilj: scopeParsed.data.kursfamilj ?? null,
    });
    if (anchor === null) {
      throw new HttpError(500, 'Kunde inte härleda lagringsplats för filen.');
    }
    const path = buildAttachmentPath(anchor, attachmentId, filnamn);

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
      // [TASK-275.3, ADR-118 beslut 5] `Event` sätts BARA när `eventId` är
      // känd — UTELÄMNAD (aldrig en tom länk), inte satt, för en genuint
      // event-lös gemensam uppladdning. Se filhuvudet.
      ...(eventId !== null ? { Event: [eventId] } : {}),
      // [TASK-147.5] Additivt — den bilage-bärande sändvägen läser detta för
      // att hämta EXAKT rätt Storage-objekt (se _shared/attachments.ts §
      // buildAttachmentLeaf för varför Namn ensamt inte räcker). SAMMA
      // `filnamn` som `path` ovan byggdes med — `sanitizeFilnamn` trimmar
      // internt, så resultatet är per konstruktion identiskt med path-suffixet.
      Lagringsnyckel: buildAttachmentLeaf(attachmentId, filnamn),
      // [TASK-147.12] Additivt — mönster 1 (denna EF) ÄR klass A per
      // definition (Lotta laddar upp en fil). Konstanten importeras, aldrig
      // en bokstavlig sträng inline (se field-allowlists.ts § Dokumentklass).
      Dokumentklass: ATTACHMENT_CLASS_UPPLADDAD,
      // [TASK-275.2, ADR-118] Räckvidd (+ Kursfamilj/Kursnivå vid Kurstyp) —
      // se filhuvudet för varför `Event` ovan förblir satt oavsett räckvidd
      // NÄR den är känd.
      ...buildScopeFields(scopeParsed.data),
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
      `[upload-attachment] ALLOW | caller_user_id=${user.id} | event=${eventId ?? '(räckviddsläge)'} | path=${path} | bytes=${bytes.length} | rackvidd=${scopeParsed.data.rackvidd}`,
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
