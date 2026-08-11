import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { scalarNumber, scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { requireUser } from '../_shared/auth.ts';

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
const TABLE_NAME = 'Utskickslogg';

type Fields = Record<string, unknown>;

/**
 * Mappar en Utskickslogg-rad → maillogg-kontraktet. Live-verifierad fält-grund
 * (Session 33 L2 STEG 1, staging `tblIesjbuSWNp6oxK`):
 * - Länkfält (`Utskicks-ID`→Bulkutskick, `Skickat till`→Personer) bevaras som
 *   record-ID-ARRAYER (aldrig skalär-reducerade — Lottas tappa-aldrig-data-krav).
 * - `Antal skickade` (formula COUNTA) → number via `scalarNumber ?? 0` (0 vid 0 mottagare;
 *   specialValue-objekt vid NaN/Infinity coercas till null → fångas av `?? 0`).
 * - `Öppningsgrad (%)` (percent-formula) → DECIMAL 0–1 via `scalarNumber`; null vid
 *   division-by-zero (Antal skickade=0 → Airtable ger specialValue/tomt).
 * - `Datum` (createdTime) ur record-METADATA, alltid present (= sort-nyckel).
 */
function mapMailLogEntry(record: { id: string; fields: Fields; createdTime: string }) {
  const f = record.fields;
  return {
    id: record.id,
    utskicksNamn: scalarString(f['Namn på utskick']), // singleLineText
    utskicksIds: Array.isArray(f['Utskicks-ID']) ? (f['Utskicks-ID'] as string[]) : [], // länk→Bulkutskick
    skickatTill: Array.isArray(f['Skickat till']) ? (f['Skickat till'] as string[]) : [], // länk→Personer
    antalSkickade: scalarNumber(f['Antal skickade']) ?? 0, // formula COUNTA → number
    datum: record.createdTime, // record-metadata, alltid present
    oppningsgrad: scalarNumber(f['Öppningsgrad (%)']), // percent-formula → decimal 0–1; null vid 0/0
    filterSnapshot: scalarString(f['Filter snapshot']), // multilineText
    mailutskickCopy: scalarString(f['Mailutskick copy']), // singleLineText
  };
}

type MailLogRow = ReturnType<typeof mapMailLogEntry>;

/** createdTime desc (senaste-först). `datum` är alltid en giltig ISO-sträng (createdTime). */
function byCreatedTimeDesc(a: MailLogRow, b: MailLogRow): number {
  return Date.parse(b.datum) - Date.parse(a.datum);
}

/**
 * get-mail-log — utskicksloggen (Utskickslogg) som GLOBAL läs-lista (Fas 6e L2).
 *
 * GLOBAL DESIGN: Utskickslogg har ingen event-gren och inget aktiv-filter — varje
 * rad är ett verkligt mailutskick. EF:en hämtar HELA tabellen (`fetchFromAirtable`
 * utan filter) och sorterar createdTime desc (JS-side; createdTime är record-metadata,
 * inte ett sorterbart Airtable-fält). INGET `?filter`, INGEN cursor (volymen är liten
 * → get-waitlist-mönstret, EJ get-leads cursor), INGEN 404 (tom lista = giltigt
 * tillstånd; loggen är de facto tom tills L3 send-email skriver första raden), INGEN
 * länk-ID-filter → ingen T15-yta. LÄSER bara — inga formula-fält (Antal skickade /
 * Öppningsgrad) skrivs.
 *
 * FEL-KONTRAKT: `{ error }` (401 anon, 500 → `{ error, requestId }`) — samma
 * konvention som get-waitlist.
 */
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

  try {
    const records = await fetchFromAirtable(TABLE_NAME);
    const maillog = records.map(mapMailLogEntry);
    maillog.sort(byCreatedTimeDesc);

    return new Response(JSON.stringify({ maillog }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-mail-log',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
