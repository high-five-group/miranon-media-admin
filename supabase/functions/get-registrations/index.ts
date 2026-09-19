import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { buildEqualsFilter, combineWithAnd } from '../_shared/airtable-filter.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import {
  berikaPersonhistorik,
  fetchByRecordIds,
  mapRegistration,
  REGISTRATIONS_TABLE,
  type Registration,
} from '../_shared/registration-read.ts';

// Läs-kärnan (mapRegistration + berikaPersonhistorik + record-ID-batcharna)
// bor i _shared/registration-read.ts sedan task-18.17 — get-registration
// (per-anmälan-detaljshapen) återanvänder EXAKT samma mappning/berikning
// (kortets låsta shape-väg; aldrig en parallell mapper). Beteendet här är
// OFÖRÄNDRAT av flytten. Tabeller adresseras per NAMN (ej tbl-id) så samma
// kod fungerar mot prod- och staging-bas (ADR-050).
const TABLE_NAME = REGISTRATIONS_TABLE;
const EVENTPLANERING_TABLE = 'Eventplanering';

/**
 * § PER-STEG-TIDSLOGGNING (TASK-459, AC #4)
 *
 * task-451.6 (docs/research/startvarmningen-batch1-kall-latens-2026-09-18.md) mätte
 * denna EF enbart som EN extern väggtid per anrop — koden loggade inga steg, så
 * kallstart (Deno-isolat-boot), auth (`requireUser`) och varje Airtable-anrops
 * svarstid gick inte att särskilja utan extern gissning. Denna EF loggar därför,
 * på BÅDA grenarna (eventId-grenen och den event-lösa grenen):
 *   - `ef_step_timing` (via `logStepTiming` nedan): `authMs` + total `totalMs`.
 *   - `airtable_call` (centralt i `_shared/airtable-client.ts`): EN rad per faktiskt
 *     Airtable-HTTP-anrop (helper, tabell, status, varaktighet) — eventuppslaget,
 *     `fetchByRecordIds`-batcharna och `berikaPersonhistorik`s Personer-/Deltaganden-
 *     batchar ärver detta GRATIS, ingen egen instrumentering krävs här.
 *   - `airtable_429_retry`/`airtable_429_exhausted` (centralt i `_shared/airtable-retry.ts`):
 *     EXPLICIT rad per 429-svar — utan den syns en 429-lockout bara indirekt som en
 *     ovanligt lång `airtable_call`-rad.
 * Ren instrumentering — INGEN ändring i svarets form eller i backoff-beteendet
 * (AC #3). Sökbart i Supabase Logs Explorer (`function_edge_logs.event_message`) utan
 * en ny extern mätrigg (AC #2) — se PR-kroppens mätanvisning för en körbar fråga.
 */
function logStepTiming(extra: Record<string, unknown>): void {
  console.info(
    JSON.stringify({
      level: 'info',
      event: 'ef_step_timing',
      function: 'get-registrations',
      ...extra,
    }),
  );
}

/** Inskickad desc, nulls sist (dateTime ISO → Date.parse; båda null → 0; en null → sist). */
function byInskickadDesc(a: Registration, b: Registration): number {
  const ta = a.inskickad ? Date.parse(a.inskickad as string) : null;
  const tb = b.inskickad ? Date.parse(b.inskickad as string) : null;
  if (ta === null && tb === null) return 0;
  if (ta === null) return 1; // a (null) sist
  if (tb === null) return -1; // b (null) sist
  return tb - ta; // desc
}

/**
 * get-registrations — anmälningar (Anmälningar) per event/status/flagga (Fas 6c).
 *
 * EVENTID-GRENEN: RECORD-ID-BATCH FRÅN EVENT-HÅLLET (speglar get-attendance/get-person):
 * hämtar eventraden, läser dess `Anmälningar (länkat fält)`-länk (read-only spegel av
 * `Anmälningar.Event`, fldUAjTutSM0fziMT → Anmälningar-record-ID:n) och batch-hämtar dem
 * via chunkad `OR(RECORD_ID()=…)`. ANVÄNDER MEDVETET INTE `buildLinkedRecordFilter` — den
 * matchar länkens primär-display (eventlabel), inte record-ID (T15-klass-bugg). Record-ID =
 * enda tillförlitliga nyckeln. Status/flagga filtreras klientside (JS, mot selectName-utdata,
 * ekvivalent med `{Status}='x'`), Inskickad-desc-sortering klientside (nulls sist). LÄSER bara.
 * 404 = okänt eventId (ärver get-event/get-attendance-kontraktet); event utan
 * `Anmälningar (länkat fält)` → tom lista (ej fel).
 *
 * EVENT-LÖSA GRENEN (eventId saknas): OFÖRÄNDRAD — serverside filterByFormula via
 * buildEqualsFilter (status/flagga) + fetchFromAirtable med Inskickad-desc-sort. 404:ar INTE.
 *
 * DELTAGAR-SHAPEN (task-18.4 + task-18.10): utöver Anmälningar-fälten bär
 * eventId-grenen PERSONENS gruppdynamik-data via TVÅ chunkade record-ID-batchar
 * i berikaPersonhistorik — en mot Personer (`Antal genomförda event` +
 * `Erfarenhetsbadge` + `Deltaganden`-länken) och en mot Deltaganden (personernas
 * kurshistorik, PersonHistoryEntry-shapen återanvänd ur get-person). ASYMMETRIN
 * ÄR MEDVETEN OCH BOKFÖRD: den event-lösa grenen hämtar HELA basens anmälningar
 * (Hem-vyn/anmälningslistan) — batcharna där vore O(hela basen) läsanrop per
 * request utan konsument. Där lämnas `antalGenomfordaEvent`/`erfarenhetsbadge`/
 * `kurshistorik` null; nycklarna finns alltid i shapen.
 *
 * ATOMICITET: event-fetch + Anmälningar-batch är ICKE-atomär — acceptabelt för en admin-
 * läsvy, medvetet utan snapshot-isolering (samma disciplin som get-attendance/get-person).
 */
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();
  // TASK-459: total handler-tid — se filhuvudets § PER-STEG-TIDSLOGGNING för varför.
  const handlerStart = Date.now();

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authStart = Date.now();
  const auth = await requireUser(req, corsHeaders);
  const authMs = Date.now() - authStart;
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  const status = url.searchParams.get('status');
  const flagga = url.searchParams.get('flagga');

  // EVENTID-GRENEN — väg D (record-ID-batch från event-hållet, T15-fix).
  if (eventId) {
    try {
      // 1) Eventraden — ETT single-get. null = 404 (ärver get-event/get-attendance-kontraktet).
      const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
      if (!eventRecord) {
        logStepTiming({
          requestId,
          branch: 'eventId',
          outcome: 'event_not_found',
          authMs,
          totalMs: Date.now() - handlerStart,
        });
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2) Eventets Anmälningar-record-ID:n ur `Anmälningar (länkat fält)`-länken (read-only
      //    spegel av Anmälningar.Event). Tom/saknad → tom lista (event utan anmälningar är
      //    ett giltigt tillstånd; conformance-grind G1 bevakar att spegeln populeras skarpt).
      const anmIds: string[] = Array.isArray(eventRecord.fields['Anmälningar (länkat fält)'])
        ? (eventRecord.fields['Anmälningar (länkat fält)'] as string[])
        : [];

      // 3) Batch-hämta anmälningarna (fields=undefined → ALLA fält; mapRegistration läser
      //    ~19 fält, en projektion vore brittle).
      let registrations =
        anmIds.length > 0
          ? (await fetchByRecordIds(TABLE_NAME, anmIds, undefined)).map(mapRegistration)
          : [];

      // 4) JS-filter (status/flagga = selectName-utdata, ekvivalent med {Status}='x').
      if (status) registrations = registrations.filter((r) => r.status === status);
      if (flagga) registrations = registrations.filter((r) => r.flagga === flagga);

      // 5) JS-sort: Inskickad desc, nulls sist.
      registrations.sort(byInskickadDesc);

      // 6) Person-batch (task-18.4): arbetsköns `Antal genomförda event`. Sker
      //    EFTER filtreringen så bara de faktiskt returnerade personerna hämtas,
      //    och ENDAST i denna gren: den event-lösa grenen returnerar hela basens
      //    anmälningar, där en person-batch vore O(hela basen) per anrop.
      await berikaPersonhistorik(registrations);

      // TASK-459 (AC #1): auth + total handler-tid för eventId-grenen. Varje Airtable-
      // anrops egen varaktighet loggas redan centralt i airtable-client.ts.
      logStepTiming({
        requestId,
        branch: 'eventId',
        authMs,
        totalMs: Date.now() - handlerStart,
        registrationCount: registrations.length,
      });

      return new Response(JSON.stringify({ registrations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return mapErrorToResponse(error, requestId, corsHeaders, {
        function: 'get-registrations',
        method: req.method,
        callerUserId: auth.user.id,
        // TASK-459: samma authMs/totalMs-fält på felvägen — en 429-utlöst lockout som
        // slutar i ett kastat fel ska bära lika mycket tidsinformation som lyckade svar.
        authMs,
        totalMs: Date.now() - handlerStart,
      });
    }
  }

  // EVENT-LÖSA GRENEN — OFÖRÄNDRAD (serverside filter + sort, 404:ar inte).
  // Bygg filterByFormula via parameteriserade builders (M5).
  // Builders kastar vid kontrolltecken / ogiltigt recordId-format /
  // för långa strängar / Unicode-bidi-overrides → 400 (klient-fel,
  // inte server-fel). Servern loggar full detail för audit; klient
  // ser generic "Invalid filter input".
  let filterByFormula: string | undefined;
  try {
    const filters: string[] = [];
    if (status) {
      filters.push(buildEqualsFilter('Status', status));
    }
    if (flagga) {
      filters.push(buildEqualsFilter('Flagga', flagga));
    }
    filterByFormula = combineWithAnd(filters);
  } catch (filterError) {
    console.warn(
      `[get-registrations] DENY invalid filter input: ${(filterError as Error).message}`,
    );
    return new Response(JSON.stringify({ error: 'Invalid filter input' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const records = await fetchFromAirtable(TABLE_NAME, {
      filterByFormula,
      sort: [{ field: 'Inskickad', direction: 'desc' }],
    });

    const registrations = records.map(mapRegistration);

    // TASK-459 (AC #1): auth + total handler-tid för den event-lösa grenen. Varje
    // Airtable-anrops egen varaktighet loggas redan centralt i airtable-client.ts.
    logStepTiming({
      requestId,
      branch: 'eventLos',
      authMs,
      totalMs: Date.now() - handlerStart,
      registrationCount: registrations.length,
    });

    return new Response(JSON.stringify({ registrations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-registrations',
      method: req.method,
      callerUserId: auth.user.id,
      // TASK-459: samma authMs/totalMs-fält på felvägen — en 429-utlöst lockout som
      // slutar i ett kastat fel ska bära lika mycket tidsinformation som lyckade svar.
      authMs,
      totalMs: Date.now() - handlerStart,
    });
  }
});
