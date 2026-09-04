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
// genereras HÄR (deterministiskt sedan TASK-316, se § IDEMPOTENS nedan —
// tidigare crypto.randomUUID()) och path byggs deterministiskt
// (_shared/attachments.ts buildAttachmentPath).
//
// FELMEDDELANDEN PÅ LOTTAS SPRÅK (AC #6): varje avvisning ger ett
// människoläsbart svenskt fel (filstorlek i MB, inte byte) — aldrig en rå
// bytejämförelse.
//
// [TASK-275.2, ADR-118 · OMBYGGT TASK-338.2, ADR-125 § Beslut 1]
// RÄCKVIDDSPARAMETRARNA (`rackvidd`/`kursfamilj`/`kursniva`/`plats`, alla
// valfria — default 'Event', dagens beteende oförändrat) valideras STRIKT
// via `_shared/attachments.ts`s `AttachmentScopeInputSchema` innan `fields`
// byggs (`buildScopeFields`).
//
// TVÅ levande räckvidder: `Event` och `Gemensam`. `Gemensam` bär tre
// VALFRIA axlar (Kursfamilj · Kursnivå, bara med familj · Plats) som
// kombineras med OCH; NOLL axlar är giltigt och betyder "alla event".
// Legacy-värdena `Kurstyp`/`Alla event` ACCEPTERAS fortfarande (installerade
// PWA-klienter kan skicka dem tills de uppdaterats) och SPARAS som
// `Gemensam` med sina axlar bevarade — rivningsskuld, bokförd i
// AttachmentScopeInputSchemas docblock. Deras egna gamla regler bevaras
// oförändrade: `Kurstyp` KRÄVER fortfarande `kursfamilj`.
//
// `plats` är ett Platser-record-ID och EXISTENSKONTROLLERAS mot
// Platser-tabellen (`platsFinns`) FÖRE lagringsskrivningen — samma vaktklass
// som generate-event-attachments ersatt-guard. Skälet: Airtable tystar ett
// okänt ID i ett länkfält, så ett felstavat plats-ID hade gett en PLATS-LÖS
// bilaga synlig på ALLA event i stället för ett fel.
//
// Anges `eventId` skrivs
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
//
// IDEMPOTENS [TASK-316] — INNEHÅLLS-DERIVERAD nyckel, INTE crypto.randomUUID()
// och INTE finalize-attachment-upload/index.ts:s mönster (client-relayat
// attachmentId). Skälet de skiljer sig: mönster 2 håller ett STABILT,
// server-utfärdat attachmentId hos klienten mellan create-attachment-upload-
// ticket (utfärdande) och finalize (skrivning) — ett fetchWithRetry-omförsök
// av FINALIZE återanvänder samma id, vilket gör Lagringsnyckel-återanvändning
// (TASK-183) korrekt DÄR. Mönster 1 (denna EF) är EN ENDA request — före
// denna fix genererades attachmentId FRISKT (`crypto.randomUUID()`) VARJE
// gång funktionen kördes, så ett äkta nätverks-omförsök (samma body,
// `postEdgeFunction`/`fetchWithRetry`, `src/data/config/supabase-client.ts` +
// `src/data/utils.ts`) fick TVÅ OLIKA attachmentId → TVÅ Storage-objekt PÅ
// OLIKA paths OCH två Bilagor-rader. Att bara byta `createAirtableRecord` mot
// `upsertAirtableRecord` med Lagringsnyckel som merge-fält (TASK-183:s
// bokstavliga förlaga) hade INTE löst detta: en frisk attachmentId per
// anrop ger en frisk Lagringsnyckel per anrop, och merge-fältet hade aldrig
// matchat sig själv — se skivans slutrapport (premiss-pass) för det fulla
// resonemanget kring varför förlagan avviker här.
//
// MEKANISM: attachmentId härleds i stället DETERMINISTISKT — SHA-256 över
// (storage-ankaret, den SANERADE filnamnet, de FAKTISKA bytesen) formaterad
// till samma 8-4-4-4-12-hex-form `isValidAttachmentId` känner igen (samma
// `crypto.subtle.digest('SHA-256', …)`-idiom som `_shared/mall-hash.ts`
// redan etablerar för ett annat ändamål). Fortfarande 100 % SERVER-
// BERÄKNAT — aldrig klient-buret eller klient-valt — så invarianten
// `_shared/attachments.ts`s `isValidAttachmentId`-docblock dokumenterar
// ("attachmentId genereras alltid av oss … aldrig av klienten") står kvar
// OFÖRÄNDRAD; bara ALGORITMEN ändras (deterministisk i stället för slumpad).
// Ingen klient-ändring krävs, ingen ny Airtable-kolumn — samma minimala
// fotavtryck TASK-183 etablerade.
//
// SAMMA (anchor, filnamn, bytes) → SAMMA attachmentId → SAMMA Storage-path
// (`upsert: true` skriver över IDENTISKA bytes, ingen läckt duplikat-fil) →
// SAMMA Lagringsnyckel → `upsertAirtableRecord` matchar EN rad (200,
// idempotent replay). En GENUINT ny uppladdning (andra bytes, ELLER annat
// filnamn, ELLER annat event/räckvidd-ankare) hashar annorlunda → egen
// attachmentId → egen rad (201) — mekanismen dedupar bara äkta retries,
// aldrig två olika filer. `anchor` ingår i hash-indata specifikt för att
// samma fil+filnamn uppladdat till TVÅ OLIKA event inte ska kollidera till
// en enda rad.
//
// [TASK-309.22, HASH-BESLUT — REVIDERAT I REVIEW-RUNDA 1] `deriveAttachmentId`
// hashar `sanitizeFilnamn(filnamn)` — men EN TIDIGARE VERSION av detta beslut
// (samma korts första bygg-varv) lät `sanitizeFilnamn` SJÄLV falla till
// ASCII, vilket gjorde hash-underlaget ASCII-säkert också. Det var FEL:
// review-runda 1 visade empiriskt att `toStorageSafe` (ASCII-fallet)
// kollapsar OLIKA filnamn till IDENTISK sträng långt bortom "bara
// diakritik" — TVÅ HELT OLIKA CJK-strängar (`填报指南.pdf`/`肆意妄为.pdf`)
// och TVÅ HELT OLIKA emoji (`😀`/`🎉`) föll till samma ASCII-form precis
// lika lätt som ett diakritik-par. Eftersom `deriveAttachmentId` hashar
// (anchor, hash-underlag, bytes) hade DETTA gjort att två filer med OLIKA
// namn och byte-identiskt innehåll fick SAMMA attachmentId — en genuint ny
// uppladdning hade av misstag blivit en "idempotent replay" av en HELT
// annan fil (fel Namn kvarstående i Airtable).
//
// BESLUTET NU: `sanitizeFilnamn` (`_shared/attachment-filename.ts`) faller
// INTE längre till ASCII alls — den gör bara det den alltid gjort
// (separator-/styrtecken-städning, trim, 200-cap). ASCII-fallet
// (`toStorageSafe`) körs ENDAST inuti `buildAttachmentLeaf`, för
// Storage-nyckeln/`Lagringsnyckel` — ALDRIG för hash-underlaget. Två olika
// filnamn (oavsett skript) ger därför ALLTID olika `sanitizeFilnamn`-utdata
// och därmed olika attachmentId, PRECIS som innan denna hela skiva någonsin
// rörde vid ASCII-frågan. Bakåtkompatibiliteten (befintliga ASCII-namns
// hash/nyckel OFÖRÄNDRADE) håller fortfarande: för rena ASCII-namn är
// `sanitizeFilnamn`s utdata och den ASCII-fallna leaf-formen IDENTISKA (inget
// tecken att falla), så ingenting ändras för dem. Se
// `_shared/attachment-filename.ts`s docblock för `sanitizeFilnamn`/
// `toStorageSafe`/`buildAttachmentLeaf` för den fullständiga uppdelningen.
//
// DEN TIDIGARE "KÄND, ACCEPTERAD BIEFFEKT"-NOTEN HÄR ÄR DÄRFÖR BORTTAGEN,
// INTE OMFORMULERAD: bieffekten den beskrev (två diakritik-varianter av
// samma namn kolliderar) finns INTE LÄNGRE — hash-underlaget ascii-faller
// aldrig, så `café.pdf` och `cafe.pdf` hashar till OLIKA attachmentId igen,
// exakt som före hela detta korts arbete.
//
// MÖNSTER 2 (create-attachment-upload-ticket/finalize-attachment-upload)
// PÅVERKAS INTE av detta beslut: verifierat via kodläsning att den vägen
// aldrig hashar ett filnamn alls — `attachmentId` där är ALLTID
// `crypto.randomUUID()`, utfärdat av create-attachment-upload-ticket och
// sedan client-relayat till finalize (se `create-attachment-upload-ticket/
// index.ts` respektive `finalize-attachment-upload/index.ts`s § IDEMPOTENS).
// Hash-frågan är UNIK för mönster 1 (denna EF).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchAirtableRecord, upsertAirtableRecord } from '../_shared/airtable-client.ts';
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
  platsFinns,
  sanitizeFilnamn,
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
// IDEMPOTENS-MERGE-FÄLTET [TASK-316] — se filhuvudets § IDEMPOTENS. Samma fält,
// samma ADR-066-upsert-mekanism som finalize-attachment-upload/index.ts —
// bara attachmentId:ts HÄRLEDNING skiljer sig (deterministisk hash här,
// klient-relayat där).
const MERGE_FIELD = 'Lagringsnyckel';

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

/** Hex-kodar en bytesekvens (gemener) — samma idiom som `_shared/mall-hash.ts` bytesToHex. */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * IDEMPOTENS [TASK-316] — deterministiskt attachmentId, se filhuvudets § IDEMPOTENS
 * för det fulla resonemanget. SHA-256 över (anchor, sanerat filnamn, bytes),
 * formaterad till samma 8-4-4-4-12-hex-form som `isValidAttachmentId` känner igen
 * (grupperna bär ingen UUID-version-semantik — bara ett stabilt, unikt 128-bitars
 * fingeravtryck, precis vad merge-nyckeln behöver).
 */
async function deriveAttachmentId(
  anchor: string,
  filnamn: string,
  bytes: Uint8Array,
): Promise<string> {
  // NUL-separerat (\0), inte mellanslag, så att ett anchor/filnamn som råkar
  // innehålla separatorn inte kan skapa en tvetydig gräns mellan fälten.
  const prefix = new TextEncoder().encode(`${anchor}\0${sanitizeFilnamn(filnamn)}\0`);
  const combined = new Uint8Array(prefix.length + bytes.length);
  combined.set(prefix, 0);
  combined.set(bytes, prefix.length);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', combined));
  const hex = bytesToHex(digest).slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
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

    // [TASK-275.2 · UTBYGGT TASK-338.2] Räckviddsparametrarna — strikt Zod.
    // Ogiltig kombination (t.ex. Kursnivå utan Kursfamilj, eller Plats
    // angiven trots räckvidd Event) → 400 med Zod:s egna, specifika
    // felmeddelande. `plats` är den tredje axeln (ADR-125 § Beslut 1);
    // legacy-värdena Kurstyp/Alla event accepteras och sparas som Gemensam
    // (se AttachmentScopeInputSchemas docblock för rivningsskulden).
    const scopeParsed = AttachmentScopeInputSchema.safeParse({
      rackvidd: body?.rackvidd,
      kursfamilj: body?.kursfamilj,
      kursniva: body?.kursniva,
      plats: body?.plats,
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

    // [TASK-338.2, ADR-125 § Beslut 1] PLATSEN FINNS-kontrollen — se
    // `platsFinns` (_shared/attachments.ts) för varför formkontrollen i Zod
    // inte räcker: Airtable tystar ett okänt record-ID i ett länkfält, så en
    // felstavad plats hade gett en PLATS-LÖS bilaga (synlig på alla event)
    // i stället för ett fel. Körs FÖRE bytesen skrivs till lagringen — ett
    // avvisat anrop ska inte lämna ett föräldralöst Storage-objekt efter sig.
    if (scopeParsed.data.plats && !(await platsFinns(scopeParsed.data.plats))) {
      return new Response(JSON.stringify({ error: 'Platsen hittades inte.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

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
    // IDEMPOTENS [TASK-316] — attachmentId härleds NU deterministiskt ur
    // (anchor, filnamn, bytes) i stället för crypto.randomUUID(). Se
    // filhuvudets § IDEMPOTENS för det fulla resonemanget. `anchor` måste
    // därför vara känt FÖRE attachmentId beräknas (ordningen bytt mot
    // tidigare, ingen annan beteendeförändring i denna kontroll).
    const attachmentId = await deriveAttachmentId(anchor, filnamn, bytes);
    const path = buildAttachmentPath(anchor, attachmentId, filnamn);

    // `upsert: true` [TASK-316] — ett äkta nätverks-omförsök (fetchWithRetry)
    // deriverar SAMMA attachmentId och skriver därför till SAMMA path. Bytesen
    // är per konstruktion IDENTISKA (samma bytesBase64 i request-body), så en
    // omskrivning är ofarlig — utan `upsert: true` skulle Storage i stället
    // avvisa omförsöket med "The resource already exists" (se _shared/utkast.ts
    // och generate-event-attachment/index.ts för samma precedent).
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .upload(path, bytes, { contentType, upsert: true });
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

    // IDEMPOTENS-MEKANISM [TASK-316]: upsert på Lagringsnyckel (ADR-066:s
    // mönster, samma som finalize-attachment-upload/index.ts — se filhuvudets
    // § IDEMPOTENS för varför attachmentId:ts HÄRLEDNING skiljer sig här).
    // Färsk Lagringsnyckel → createdRecords (ny rad); samma Lagringsnyckel
    // (äkta omförsök, samma anchor+filnamn+bytes) → updatedRecords
    // (idempotent replay, samma rad — INGEN dubblett skapas).
    let record: { id: string; fields: Record<string, unknown>; createdTime: string };
    let wasCreated: boolean;
    try {
      const upserted = await upsertAirtableRecord(BILAGOR_TABLE, fields, [MERGE_FIELD]);
      record = upserted.record;
      wasCreated = upserted.created;
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

    // 201 vid ny rad, 200 vid idempotent replay (samma Lagringsnyckel →
    // matchad, inget nytt skapades) — speglar finalize-attachment-upload/
    // index.ts (TASK-183) och create-event/index.ts (ADR-066) EXAKT.
    return new Response(
      JSON.stringify({
        attachment: mapAttachmentRecord(record),
        record: { id: record.id, fields: record.fields, createdTime: record.createdTime },
        created: wasCreated,
      }),
      {
        status: wasCreated ? 201 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'upload-attachment',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
