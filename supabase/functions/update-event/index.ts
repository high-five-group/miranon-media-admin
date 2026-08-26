import { fetchAirtableRecord, updateAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarNumber, scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

// update-event — uppdaterar ett BEFINTLIGT event i Eventplanering (task-18.1,
// PRD task-18 Implementationsbeslut 2–3). Repots femte write-vertikal; speglar
// create-event (6f, ADR-066) EXAKT i säkerhets-kontraktet: POST→405,
// requireUser→401, body-JSON-fel→400, allowlist-SSOT via field-allowlists.ts
// (deny→400), {error}+requestId, central mapErrorToResponse — men PATCH:ar en
// befintlig rad i stället för att skapa.
//
// FÄLT-SHAPE byggs SERVER-SIDE ur typade inputs — klienten skickar ALDRIG en rå
// `fields`-map. Alla uppdaterbara fält är OPTIONAL (partiell update — Om eventet
// skickar typ/ort/datum/status; Beläggningens Ändra [task-18.2] skickar
// maxPlatser/reserverade/manuelltTillagda — K16-modellens tre skrivbara); minst
// ETT måste vara satt. Endast live-verifierade skrivbara fält (L294,
// staging-schema 2026-07-21): Typ/Status (singleSelect), Ort (singleLineText),
// Startdatum/Slutdatum (date ISO), Max antal platser/Extra platser/Manuella
// platser (number). System-genererade fält sätts ALDRIG (EventKey formel /
// Event-nr autoNumber); spegel-/länk- och formel-/rollup-fält rörs aldrig.
//
// MÅNAD/ÅR-HÄRLEDNINGEN (ADR-066 b6-arvet): ändras Startdatum OMHÄRLEDS `Månad/år`
// server-side ur det nya datumet — annars driftar basens manuella singleSelect mot
// Startdatum (exakt den drift b6 eliminerade vid create). Out-of-range-datum
// (utanför options-listan Nov 2025–Dec 2026) FELAR (typecast:false → 500) i stället
// för att tyst skapa en option — medvetet, samma beteende som create-event
// (§Kända fällor 36; maximerings-kandidat T16).
//
// INGEN IDEMPOTENSNYCKEL (medvetet delta mot create-event): en PATCH med absoluta
// värden är naturligt idempotent — en retry av samma submit ger samma sluttillstånd
// (samma klass som update-record-operationerna mark-registration-fee-paid/
// update-person-note). ADR-066 b3:s nyckel löser create-dubblett-korruption; den
// felvägen finns inte för update.
//
// VALIDERING (manuell deny-by-default): speglar create-event/create-registration —
// manuell validering, INTE Zod (Zod bor i klient-/adapter-lagret, ADR-026;
// kodbas-konsistens > abstrakt schema-kanon).
//
// 404-KONTRAKTET (TASK-24-fyndet, rättat): ett rec-prefixat men okänt/raderat
// eventId gav tidigare 500 i stället för 404. Grundorsaken var att
// `updateAirtableRecord` kastar en GENERISK `Error` på varje icke-2xx-svar
// (samma helper alla PATCH-EF:er delar), och den generiska Error:en är ingen
// `HttpError` — `mapErrorToResponse` faller därför till 500-grenen. Fixen
// speglar det MALL-kontrakt get-event/create-event-note redan bär: en
// pre-check-`fetchAirtableRecord` läser raden FÖRE skrivningen och returnerar
// 404 manuellt om den är `null`, i stället för att förlita sig på PATCH:ens
// egen felhantering. Live-verifierat mot staging 2026-08-26: en PATCH mot ett
// rec-prefixat men obefintligt ID (`recZZZZZZZZZZZZZZ`) ger Airtable-svaret
// 403 `INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND` — SAMMA statuskod
// `fetchAirtableRecord`s egen docblock redan beskriver för GET (record-GET
// konflaterar medvetet "saknas" och "ingen behörighet"); PATCH beter sig
// identiskt. Ett malformat (icke rec-prefixat) ID fälls redan tidigare, som
// 400 (se `eventId`-valideringen ovan) — det Airtable-läget (404 `NOT_FOUND`
// på en URL-form som inte matchar route-mönstret) når därför aldrig hit.

const OPERATION_KEY = 'update-event';

// ISO-datum YYYY-MM-DD (Airtable date-fält-form; samma pragmatiska format-grind
// som create-event — exakt kalender-validitet vilar på Airtable).
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Svenska månadsnamn för `Månad/år`-härledningen — HÅLL I SYNK med create-event
// (samma medvetna duplicering som get-event/get-events mapEvent; EF:er delar kod
// endast via _shared, och en extraktion hör till en egen refaktor-landning).
const MANAD_AR_MONTHS = [
  'Januari',
  'Februari',
  'Mars',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Augusti',
  'September',
  'Oktober',
  'November',
  'December',
];

/** Härleder `Månad/år`-värdet ("Mars 2026") ur ett ISO-datum (YYYY-MM-DD). */
function deriveManadAr(isoDate: string): string {
  const [year, month] = isoDate.split('-');
  return `${MANAD_AR_MONTHS[Number(month) - 1]} ${year}`;
}

// Fältnamn från Airtable → ren API-respons (BERIKADE läs-shapen). IDENTISK mappning
// som get-event/get-events mapEvent — PATCH-svaret från Airtable bär ALLA fält
// (inkl. formler/rollups), så update-svaret kan bära samma domän-shape som
// läs-vägen och klienten kan cache-sätta direkt. Håll i synk med get-event/
// get-events om fält ändras.
function mapEvent(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;

  return {
    id: record.id,
    eventlabel: f['Eventlabel'] ?? null, // formula (primary)
    eventNamn: selectName(f['Event (source)']), // singleSelect
    typ: selectName(f['Typ']), // singleSelect
    ort: scalarString(f['Ort']), // text (eget fält, skalärt)
    startdatum: f['Startdatum'] ?? null, // date
    slutdatum: f['Slutdatum'] ?? null, // date
    tidKvarTillEvent: f['Tid kvar till event'] ?? null, // formula → text
    maxPlatser: scalarNumber(f['Max antal platser']), // number (osatt → null)
    antalAnmalda: scalarNumber(f['Antal anmälda']) ?? 0, // formel → number
    platserKvar: scalarNumber(f['Platser kvar']), // formel → number|null
    anmaldBelaggning: scalarNumber(f['Anmäld beläggning (%)']), // formel-% (NaN→null)
    bekraftadBelaggning: scalarNumber(f['Bekräftad beläggning (%)']), // formel-% (NaN→null)
    antalNyaAnmalningar: scalarNumber(f['Antal nya anmälningar']) ?? 0, // rollup → number
    antalAnmalningsavgifter: scalarNumber(f['Antal mottagna anmälningsavgifter']) ?? 0, // rollup
    antalSlutbetalningar: scalarNumber(f['Antal mottagna slutbetalningar']) ?? 0, // rollup
    antalSlutbetalningFelande: scalarNumber(f['Antal slutbetalning saknas']) ?? 0, // formel
    status: selectName(f['Status'] ?? null), // singleSelect (om det finns)
    // eventKey: saknas värdet UTELÄMNAS nyckeln (undefined droppas av
    // JSON.stringify; OPTIONAL i EventSchema — aldrig null). Håll i synk.
    eventKey: typeof f['EventKey'] === 'string' ? f['EventKey'] : undefined,
    // Basdimensionerna (TASK-249.4, ADR-115): direkta singleSelect-fält, alltid lästa ur
    // PATCH-svarets fullständiga fields (kommentaren ovan mapEvent) — selectName ger
    // string|null (aldrig gissat). Håll i synk med get-event/get-events.
    kursfamilj: selectName(f['Kursfamilj']),
    kursniva: selectName(f['Kursnivå']),
    // Beläggningens TVÅ skrivbara kategorifält (task-18.2, K16) — PATCH-svaret
    // bär dem. Räkningarna (viaFormular/medfoljande/vantelista) aggregeras
    // MEDVETET INTE här (write-EF:en förblir ett Airtable-anrop; ADDITIVT-
    // OPTIONAL i EventSchema) — klienten MERGE-cachar (useUpdateEvent) och
    // onSettled-refetchen mot get-event bär hela modellen. Osatt → nyckeln
    // UTELÄMNAS (eventKey-formen — aldrig null).
    reserverade: scalarNumber(f['Extra platser']) ?? undefined,
    manuelltTillagda: scalarNumber(f['Manuella platser']) ?? undefined,
    // Auto-utskickets två ADDITIVA fält (task-18.6). Datumet: osatt → nyckeln
    // UTELÄMNAS (eventKey-formen). Opt-out: Airtable utelämnar en OKRYSSAD checkbox
    // ur svaret — normaliseras därför till FALSE (aldrig undefined), så krysset alltid
    // har ett definit läge att rendera. Håll i synk med get-event.
    deltagarinfoSchemalagd: scalarString(f['Deltagarinfo schemalagd']) ?? undefined,
    deltagarinfoAutoAvstangt: f['Deltagarinfo auto-utskick avstängt'] === true,
  };
}

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
    const body = (await req.json()) as Record<string, unknown> | null;
    const eventId = body?.eventId;
    const typ = body?.typ;
    const ort = body?.ort;
    const startdatum = body?.startdatum;
    const slutdatum = body?.slutdatum;
    const status = body?.status;
    const maxPlatser = body?.maxPlatser;
    const reserverade = body?.reserverade;
    const manuelltTillagda = body?.manuelltTillagda;
    // Auto-utskicket (task-18.6): schemalagt datum + opt-out. Datumet får vara NULL
    // (= rensa fältet) — därför skiljs "frånvarande" (ändra inte) från "null" (rensa).
    const deltagarinfoSchemalagd = body?.deltagarinfoSchemalagd;
    const deltagarinfoAutoAvstangt = body?.deltagarinfoAutoAvstangt;

    // Mål-raden: Airtable-record-ID (rec-prefix — create-registrations eventId-grind).
    if (typeof eventId !== 'string' || !eventId.startsWith('rec')) {
      return badRequest('eventId is required (Eventplanering record-ID, rec-prefix)', corsHeaders);
    }

    // Input-validering per NÄRVARANDE fält (deny-by-default; frånvaro = "ändra inte").
    if (typ !== undefined && (typeof typ !== 'string' || !typ.trim())) {
      return badRequest('typ must be a non-empty string when present', corsHeaders);
    }
    if (ort !== undefined && (typeof ort !== 'string' || !ort.trim())) {
      return badRequest('ort must be a non-empty string when present', corsHeaders);
    }
    if (startdatum !== undefined && (typeof startdatum !== 'string' || !ISO_DATE_RE.test(startdatum))) {
      return badRequest('startdatum must be ISO YYYY-MM-DD when present', corsHeaders);
    }
    if (slutdatum !== undefined && (typeof slutdatum !== 'string' || !ISO_DATE_RE.test(slutdatum))) {
      return badRequest('slutdatum must be ISO YYYY-MM-DD when present', corsHeaders);
    }
    if (status !== undefined && (typeof status !== 'string' || !status.trim())) {
      return badRequest('status must be a non-empty string when present', corsHeaders);
    }
    if (
      maxPlatser !== undefined &&
      (typeof maxPlatser !== 'number' || !Number.isFinite(maxPlatser) || maxPlatser < 0)
    ) {
      return badRequest('maxPlatser must be a non-negative number when present', corsHeaders);
    }
    if (
      reserverade !== undefined &&
      (typeof reserverade !== 'number' || !Number.isFinite(reserverade) || reserverade < 0)
    ) {
      return badRequest('reserverade must be a non-negative number when present', corsHeaders);
    }
    if (
      manuelltTillagda !== undefined &&
      (typeof manuelltTillagda !== 'number' ||
        !Number.isFinite(manuelltTillagda) ||
        manuelltTillagda < 0)
    ) {
      return badRequest('manuelltTillagda must be a non-negative number when present', corsHeaders);
    }
    if (
      deltagarinfoSchemalagd !== undefined &&
      deltagarinfoSchemalagd !== null &&
      (typeof deltagarinfoSchemalagd !== 'string' || !ISO_DATE_RE.test(deltagarinfoSchemalagd))
    ) {
      return badRequest(
        'deltagarinfoSchemalagd must be ISO YYYY-MM-DD or null when present',
        corsHeaders,
      );
    }
    if (deltagarinfoAutoAvstangt !== undefined && typeof deltagarinfoAutoAvstangt !== 'boolean') {
      return badRequest('deltagarinfoAutoAvstangt must be a boolean when present', corsHeaders);
    }

    // Bygg write-fält SERVER-SIDE — endast närvarande inputs, endast live-verifierade
    // skrivbara fält (L294). Månad/år OMHÄRLEDS när Startdatum ändras (ADR-066 b6-arvet).
    const fields: Record<string, unknown> = {};
    if (typeof typ === 'string') fields['Typ'] = typ.trim();
    if (typeof ort === 'string') fields['Ort'] = ort.trim();
    if (typeof startdatum === 'string') {
      fields['Startdatum'] = startdatum;
      fields['Månad/år'] = deriveManadAr(startdatum);
    }
    if (typeof slutdatum === 'string') fields['Slutdatum'] = slutdatum;
    if (typeof status === 'string') fields['Status'] = status.trim();
    if (typeof maxPlatser === 'number') fields['Max antal platser'] = maxPlatser;
    // K16-modellens mappning (task-18.2): reserverade → 'Extra platser',
    // manuelltTillagda → 'Manuella platser' (domänspråket i API:t, basens
    // fältnamn endast här server-side).
    if (typeof reserverade === 'number') fields['Extra platser'] = reserverade;
    if (typeof manuelltTillagda === 'number') fields['Manuella platser'] = manuelltTillagda;
    // Auto-utskicket (task-18.6): basens ord är 'Deltagarinfo' (UI-ordet detsamma sedan TASK-303,
    // ORDLISTA). NULL skickas VIDARE som null → Airtable RENSAR datumet (krysset kan
    // ta bort ett schema), medan frånvaro betyder "ändra inte" som för alla andra fält.
    if (deltagarinfoSchemalagd !== undefined) {
      fields['Deltagarinfo schemalagd'] = deltagarinfoSchemalagd;
    }
    if (typeof deltagarinfoAutoAvstangt === 'boolean') {
      fields['Deltagarinfo auto-utskick avstängt'] = deltagarinfoAutoAvstangt;
    }

    if (Object.keys(fields).length === 0) {
      return badRequest(
        'At least one updatable field is required (typ, ort, startdatum, slutdatum, status, maxPlatser, reserverade, manuelltTillagda, deltagarinfoSchemalagd, deltagarinfoAutoAvstangt)',
        corsHeaders,
      );
    }

    // Allowlist-SSOT: hämta operationens tableId + allowedFields.
    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
    }

    // SSOT-grind: varje server-byggt fält måste vara på operationens allowlist
    // (defense-in-depth mot framtida kod-drift; deny → 400).
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[update-event] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(
        `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    // Mål-raden måste finnas — null = okänt/raderat ID → 404 (se 404-KONTRAKTET
    // i filens docblock ovan, TASK-24).
    const existing = await fetchAirtableRecord(operation.tableId, eventId);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `[update-event] ALLOW | caller_user_id=${user.id} | record=${eventId} | fields=${Object.keys(fields).join(',')}`,
    );

    const updated = await updateAirtableRecord(operation.tableId, eventId, fields);

    // Dubbel retur (create-event-mönstret): `event` = berikad domän-shape (adaptern
    // parse:ar denna i L2 och kan cache-sätta detaljen direkt); `record` = rått
    // skriv-bevis (id + fields) så staging-testet kan asserta att fälten sattes och
    // Månad/år omhärleddes.
    return new Response(
      JSON.stringify({
        event: mapEvent(updated),
        record: { id: updated.id, fields: updated.fields },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'update-event',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
