// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande. Samma
// undantags-mönster som send-email/index.ts, test-pdf-generation/index.ts
// och test-attachments-storage/index.ts.
//
// generate-event-attachment — TASK-146.5 "Klass B — event-mallad generering
// ur systemmall" (PRD task-146, bilage-fundamentet).
//
// SYFTE (kortets AC #1): ett event-mallat brev ("Deltagarinformation")
// genereras ur en HÅRDKODAD systemmall (AC #2 — mallen är INTE redigerbar i
// v1, mall-editorn ligger uttryckligen senare) med eventets egna uppgifter
// ifyllda, och landar som en rad i Bilagor-tabellen (TASK-146.2, additivt
// skapad av scripts/create-bilagor-table.mjs). Bytesen bor i samma privata
// Storage-bucket ("bilagor", TASK-146.3), path-prefixad per event — samma
// delade hemvist som PRD:n (§ Lösning) beskriver för alla tre
// dokumentklasser.
//
// [RÄTTAD, TASK-147.12] Stycket ovan sade tidigare att raden landar "MED
// EXAKT SAMMA FÄLTFORM som en uppladdad (klass A) bilaga... inga extra
// klass-markörer (AC #4, 'de tre dokumentklasserna är oskiljbara i
// metadatat')". Det VAR sant och var en avsiktlig AC (task-146.5) — men
// task-147.6:s granskning fann att odelbarheten var en DEFEKT, inte en
// egenskap (Dokument-ytan kunde inte visa verklig klass). Marcus-GO
// 2026-08-16 (ADR-063 — löses I BASEN): raden bär nu 'Dokumentklass' =
// 'Event-mallad' (additivt fält, staging fldr2CwboZ3M4USCX) — SEX fält, inte
// fem. tests/api/generate-event-attachment.staging.test.ts:s gamla
// "exakt fem fält, inget klass-fält"-assert är uppdaterat i samma commit.
//
// SAMTIDIGHETS-NOT (byggd 2026-08-10, S102-batchen, kort ③ av 14, ADR-086
// premiss-pass): TASK-146.4 (adapter-ytan + uppladdningsfunktionen, PR #1090)
// var vid DESIGN-tillfället INTE landad på main — `gh pr view 1090` visade
// `mergeStateStatus: BLOCKED` och jobbet "Lint + Audit + TypeCheck" RÖTT
// (verifierat, inte antaget). Ett divergerande utfall mot uppdragets premiss
// ("kan landa medan du arbetar" antydde aktiv progression, inte ett rött
// jobb) — bokfört öppet i skivans slutrapport, aldrig tyst justerat. Innan
// den delade `_shared/field-allowlists.ts`-posten skrevs lästes `gh pr diff
// 1090` FÖR att undvika en strukturell krock: samma operationsnyckel
// ('create-attachment') mot samma tabell/fält användes MEDVETET. 146.4
// LANDADE (#1090) INNAN denna skiva pushades — `git fetch` + omstart på
// färsk `origin/main` bekräftade det, och den egna field-allowlists.ts-posten
// TOGS BORT härifrån (redan landad, identisk nyttolast — ren dubblett).
// Denna funktion ÅTERANVÄNDER nu `_shared/attachments.ts`s BILAGOR_BUCKET_ID/
// EVENTPLANERING_TABLE/mapAttachmentRecord i stället för att duplicera dem
// (uppdragets egen instruktion, tillämpad efter landningen, inte bara i
// avsikt) — se full mätning + kronologi i skivans slutrapport.
//
// AUKTORISATION: samma nivå som create-event-note/create-event
// (requireUser, ingen extra ADMIN_EMAILS-gate) — att generera ett
// event-brev är en likvärdig admin-handling, ingen kontohantering.
//
// SVENSKA TECKEN (AC #3): samma bevisade mekanism som TASK-146.1:s
// runtime-bevis — pdf-lib@1.17.1, StandardFonts.Helvetica, WinAnsiEncoding
// (å/ä/ö delar kodpunkt med Latin-1 i 0xA0–0xFF-intervallet). Systemmallens
// brödtext är HÅRDKODAD svensk löptext (inte eventdata) så att AC #3 bevisas
// deterministiskt oavsett vilket event som testas.
//
// [TASK-246] FÖRHANDSVISNINGS-LÄGE (body-flaggan `preview: true`) — ÅTERANVÄND
// EF (AC #1: "ny EF byggs endast om befintlig yta bevisat inte räcker"; denna
// yta räckte, den behövde bara en väg som HOPPAR ÖVER persisteringen, inte en
// ny yta). Samma eventuppgifts-läsning och SAMMA `byggPdf`-anrop som den
// persisterande vägen (identisk PDF-kvalitet, "riktigt genererad ur eventets
// verkliga data" — Marcus-ordern 2026-08-16) — grenen som SKILJER dem ligger
// EFTER `pdfBytes` är byggda. Den rör ALDRIG Bilagor-radskapelsen NEDAN (ingen
// mail/bas-skrivning/kvarliggande Airtable-artefakt är relevant här — den
// delen av AC #3, TASK-146.5, står FORTFARANDE FAST).
//
// [ADR-124, TASK-302.2] AC #3 AMENDERAS ÖPPET, RIVS INTE — raden nedan löd
// till och med 2026-08-22: "`preview: true` returnerar `{pdfBase64}` direkt
// och rör VARKEN Storage-uppladdningen NEDAN eller Bilagor-radskapelsen …
// en förhandsvisning som aldrig når den koden har per konstruktion noll
// sidoeffekter, inte 'sidoeffekter som sedan städas'". Den premissen — att
// bytes till klienten räcker för att visa dokumentet — föll mot en mätning
// (sex klientleveransarmar, headed Chrome 151, `ADR-124` § Kontext): endast
// en URL SERVERAD AV NÄTVERKSTJÄNSTEN scrollar jämnt. Ny, amenderad AC #3,
// VERBATIM (`ADR-124` § Beslut 3):
//
//   Förhandsvisningen har noll KONSUMENT-SYNLIGA sidoeffekter: ingen
//   Bilagor-rad, inget allokerat kvittonummer, inget mail. Den skriver ett
//   TRANSIENT utkast under `utkast/<eventId>/<typ>.pdf` i bucket `bilagor`
//   — aldrig listat i appen, överskrivet per event och typ (`upsert`),
//   borttaget vid skarp generering — för att Chromes PDF-visare bara
//   scrollar jämnt på en URL serverad av nätverkstjänsten (ADR-124).
//
// `preview: true` returnerar nu `{ url, utgar }` (`laggUtkast`, `_shared/
// utkast.ts`, `typ: 'deltagarinformation'` — den enda systemmall v1 har
// (`MALL_NAMN` nedan) HETER bokstavligen "Deltagarinformation", samma
// enum-värde `UTKAST_TYPER` bär: ingen mall-gissning krävs). Den skriver ETT
// transient Storage-objekt men rör ALDRIG Bilagor-tabellen, allokerar inget
// kvittonummer och skickar inget mail — skyddets SYFTE (Lotta ser aldrig en
// artefakt hon inte bett om, inget räknas) hålls intakt.
//
// [ADR-124, TASK-302.3] DEN PERSISTERANDE GRENEN ANROPAR NU `rensaUtkast`
// EFTER lyckad Bilagor-radskapelse (ADR-124 § Beslut 2: "skarp generering …
// tar bort utkast/<eventId>/") — den skarpa artefakten ersätter
// förhandsvisningens syfte för eventet, så det transienta utkastet (alla
// typer under eventet, inte bara 'deltagarinformation') städas bort.
// BEST-EFFORT (se `_shared/utkast.ts` § `rensaUtkast`): ett städningsfel
// loggas och fäller ALDRIG den redan lyckade skarpa operationen.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';
import { createAirtableRecord, fetchAirtableRecord } from '../_shared/airtable-client.ts';
// BILAGOR_BUCKET_ID/EVENTPLANERING_TABLE/mapAttachmentRecord: ÅTERANVÄNDA ur
// TASK-146.4:s delade modul (landad #1090) i stället för dupliceras — se
// filhuvudets SAMTIDIGHETS-NOT.
import {
  ATTACHMENT_CLASS_EVENT_MALLAD,
  BILAGOR_BUCKET_ID,
  buildAttachmentLeaf,
  buildAttachmentPath,
  EVENTPLANERING_TABLE,
  mapAttachmentRecord,
  toBase64,
} from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse, ValidationError } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import { laggUtkast, rensaUtkast } from '../_shared/utkast.ts';

const OPERATION_KEY = 'create-attachment';

// Systemmallens NAMN — v1 har en enda, hårdkodad mall (AC #2). Ett framtida
// mall-register (flera event-mallar) är uttryckligen utanför scope (PRD
// task-146 § Utanför omfattningen, "Mall-editor för klass B").
const MALL_NAMN = 'Deltagarinformation';

const MANADSNAMN = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

/** ISO-datum ("2026-02-06") → "6 februari 2026". Ogiltig/saknad input → null (skrivs inte ut). */
function formatSvenskDatum(iso: unknown): string | null {
  if (typeof iso !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const [, year, monthStr, dayStr] = match;
  const monthIdx = Number(monthStr) - 1;
  const manad = MANADSNAMN[monthIdx];
  if (!manad) return null;
  return `${Number(dayStr)} ${manad} ${year}`;
}

/**
 * Systemmallens brödtext — HÅRDKODAD svensk löptext (AC #2: inte redigerbar
 * i v1). Innehåller å/ä/ö i båda "riktigt förekommande" ord (inte en
 * konstgjord teststräng) så AC #3 bevisas mot verkligt mallinnehåll, inte
 * mot en synteststräng vid sidan om. Exporterad rad-för-rad (inte en enda
 * sammanhängande sträng) så konsumenten (PDF-layouten OCH staging-testet)
 * kan hålla exakt samma källa i synk.
 */
export const SYSTEMMALL_BRODTEXT: readonly string[] = [
  'Välkommen till kursen!',
  'Här är information du behöver inför ditt deltagande.',
  'Kom gärna i god tid och hör av dig till oss om något är oklart.',
  'Vi ses på plats!',
  '',
  'Hälsningar,',
  'Roger & Lotta',
];

interface EventUppgifter {
  eventlabel: string;
  kursnamn: string | null;
  ort: string | null;
  datumrad: string | null;
}

function lasEventUppgifter(record: { id: string; fields: Record<string, unknown> }): EventUppgifter {
  const f = record.fields;
  const eventlabel = typeof f['Eventlabel'] === 'string' ? f['Eventlabel'] : record.id;
  const kursnamn = selectName(f['Event (source)']);
  const ort = scalarString(f['Ort']);
  const start = formatSvenskDatum(f['Startdatum']);
  const slut = formatSvenskDatum(f['Slutdatum']);
  const datumrad = start && slut && start !== slut ? `${start} – ${slut}` : (start ?? slut);
  return { eventlabel, kursnamn, ort, datumrad };
}

/** Bygger PDF-bytesen ur systemmallen + eventets uppgifter. Ren funktion — inget I/O. */
async function byggPdf(uppgifter: EventUppgifter): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 420]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  let y = 380;
  const draw = (text: string, size: number, dy: number) => {
    if (text.length > 0) {
      page.drawText(text, { x: 40, y, size, font });
    }
    y -= dy;
  };

  draw(MALL_NAMN, 18, 30);
  if (uppgifter.kursnamn) draw(uppgifter.kursnamn, 13, 22);
  if (uppgifter.ort) draw(`Ort: ${uppgifter.ort}`, 11, 18);
  if (uppgifter.datumrad) draw(`Datum: ${uppgifter.datumrad}`, 11, 18);
  y -= 12;
  for (const rad of SYSTEMMALL_BRODTEXT) {
    draw(rad, 11, 18);
  }

  return doc.save();
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
    // [TASK-246] Se filhuvudets FÖRHANDSVISNINGS-LÄGE-stycke. Strikt boolean
    // — ett klient-skickat truthy-men-inte-`true`-värde (t.ex. `"true"` som
    // sträng) faller till den PERSISTERANDE vägen i stället för att tyst tolkas
    // som förhandsvisning (samma "gissa aldrig"-disciplin som resten av filen).
    const preview = body?.preview === true;

    // eventId: Airtable-recordId-format (speglar create-registration/create-event-note:s rec-prefix-grind).
    if (typeof eventId !== 'string' || !eventId.startsWith('rec')) {
      throw new ValidationError('eventId is required and must be an Airtable record ID (rec…)');
    }

    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const uppgifter = lasEventUppgifter(eventRecord);
    const pdfBytes = await byggPdf(uppgifter);

    // Bytesen skrivs med FÖRHÖJD behörighet (service-role) — samma mönster
    // som test-attachments-storage/index.ts (TASK-146.3). Klienten rör
    // aldrig lagringen direkt (ADR-057); auktorisationsbeslutet (vilket
    // event, vilken path) är redan fattat server-side ovan. [ADR-124,
    // TASK-302.2] Både förhandsvisnings- och den persisterande grenen
    // behöver klienten nu — instansierad EN gång, delad av båda.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (preview) {
      console.log(`[generate-event-attachment] PREVIEW | caller_user_id=${user.id} | event=${eventId}`);
      // [ADR-124, TASK-302.2] TRANSIENT utkast i Storage, inte bytes till
      // klienten — se filhuvudets amenderade AC #3-stycke. `typ:
      // 'deltagarinformation'` — systemmallens NAMN (`MALL_NAMN` nedan)
      // matchar exakt detta enum-värde.
      const { url, utgar } = await laggUtkast(supabaseAdmin, {
        eventId,
        typ: 'deltagarinformation',
        bytes: pdfBytes,
      });
      return new Response(JSON.stringify({ url, utgar, requestId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const attachmentId = crypto.randomUUID();
    // SAMMA deterministiska path-form som TASK-146.4:s mönster 1/2
    // (buildAttachmentPath, _shared/attachments.ts) — inte en egen variant
    // som råkar se likadan ut. `STORAGE_FILNAMN` är den fasta lagringsfil-
    // benämningen (skild från `namn`, det EVENT-SPECIFIKA visningsnamnet
    // nedan) — SAMMA sträng måste gå in i både path OCH Lagringsnyckel
    // (TASK-147.5), annars pekar de på olika leaf-strängar.
    const STORAGE_FILNAMN = 'deltagarinformation.pdf';
    const path = buildAttachmentPath(eventId, attachmentId, STORAGE_FILNAMN);
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .upload(path, pdfBytes, { contentType: 'application/pdf' });
    if (uploadError) {
      throw new Error(`Storage-uppladdning misslyckades: ${uploadError.message}`);
    }

    // Allowlist-SSOT (samma försvar-i-djupet som create-event-note): varje
    // server-byggt fält måste stå på operationens allowlist.
    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      throw new Error(`Unknown operation: ${OPERATION_KEY}`);
    }

    const namn = `${MALL_NAMN} – ${uppgifter.eventlabel}.pdf`;
    const fields: Record<string, unknown> = {
      Namn: namn,
      'Storlek (bytes)': pdfBytes.byteLength,
      Skapad: new Date().toISOString(),
      Event: [eventId],
      // [TASK-147.5] Additivt — se upload-attachment/index.ts:s motsvarande
      // rad. Byggd ur SAMMA `STORAGE_FILNAMN` som `path` ovan (inte `namn`,
      // som varierar per event och alltså INTE är vad som faktiskt ligger i
      // Storage).
      Lagringsnyckel: buildAttachmentLeaf(attachmentId, STORAGE_FILNAMN),
      // [TASK-147.12] Additivt — denna EF ÄR klass B per definition (mall +
      // eventfält, ingen mänsklig uppladdning). Se filhuvudets RÄTTAD-not.
      Dokumentklass: ATTACHMENT_CLASS_EVENT_MALLAD,
    };

    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[generate-event-attachment] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      throw new Error(`Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`);
    }

    console.log(
      `[generate-event-attachment] ALLOW | caller_user_id=${user.id} | event=${eventId} | path=${path}`,
    );

    const created = await createAirtableRecord(operation.tableId, fields);

    // [ADR-124, TASK-302.3] Den skarpa artefakten ERSÄTTER förhandsvisningens
    // syfte för detta eventet — ta bort HELA `utkast/<eventId>/`-mappen (alla
    // typer, inte bara 'deltagarinformation'). BEST-EFFORT: `rensaUtkast`
    // loggar och sväljer sina egna fel, kastar aldrig — anropas EFTER
    // lyckad persistering ovan, aldrig före.
    await rensaUtkast(supabaseAdmin, eventId);

    return new Response(
      JSON.stringify({
        // SAMMA mapper som klass A (upload-attachment, TASK-146.4) använder
        // för sin skriv-respons — två olika uppkomster (uppladdad vs
        // genererad) producerar samma domän-SHAPE via EN delad funktion,
        // inte två parallella som råkar se lika ut. [RÄTTAD, TASK-147.12]
        // Shapen är identisk, VÄRDET på `dokumentklass` är det som numera
        // skiljer dem — se filhuvudets RÄTTAD-not för varför "identisk
        // domän-shape" INTE längre betyder "oskiljbar".
        attachment: mapAttachmentRecord(created),
        record: { id: created.id, fields: created.fields },
        storagePath: path,
        // pdfBase64: samma DEN FAKTISKT PERSISTERADE byte-strömmen som skrevs till
        // Storage ovan (inte en separat regenerering) — så ett conformance-test kan
        // verifiera AC #3 (svenska tecken) mot "den genererade filen" utan en extra
        // signerad-URL-rundtur. Samma exponerings-resonemang som test-pdf-generation:
        // anroparen bad om att FÅ just detta innehåll, ingen ny läckage-yta.
        pdfBase64: toBase64(pdfBytes),
        requestId,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'generate-event-attachment',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
