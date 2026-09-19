import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { mapEventBas } from '../_shared/event-map.ts';
import { hamtaStandardpriser, standardprisFor } from '../_shared/eventpris.ts';

/**
 * § PER-STEG-TIDSLOGGNING (TASK-459, AC #4)
 *
 * task-451.6 (docs/research/startvarmningen-batch1-kall-latens-2026-09-18.md) mätte
 * denna EF enbart som EN extern väggtid per anrop — koden loggade inga steg, så
 * kallstart (Deno-isolat-boot), auth (`requireUser`) och varje Airtable-anrops
 * svarstid gick inte att särskilja utan extern gissning. Denna EF loggar därför:
 *   - `ef_step_timing` (här, vid handlerns slut): `authMs` + total `totalMs`.
 *   - `airtable_call` (centralt i `_shared/airtable-client.ts`): EN rad per faktiskt
 *     Airtable-HTTP-anrop (helper, tabell, status, varaktighet) — `fetchFromAirtable`s
 *     paginering och `fetchByRecordIds`s chunkade batch ärver detta GRATIS, ingen egen
 *     instrumentering krävs här.
 *   - `airtable_429_retry`/`airtable_429_exhausted` (centralt i `_shared/airtable-retry.ts`):
 *     EXPLICIT rad per 429-svar — utan den syns en 429-lockout bara indirekt som en
 *     ovanligt lång `airtable_call`-rad.
 * Ren instrumentering — INGEN ändring i svarets form eller i backoff-beteendet
 * (AC #3). Sökbart i Supabase Logs Explorer (`function_edge_logs.event_message`) utan
 * en ny extern mätrigg (AC #2) — se PR-kroppens mätanvisning för en körbar fråga.
 */

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
const TABLE_NAME = 'Eventplanering';
const REGISTRATIONS_TABLE = 'Anmälningar';

/** Loggprefix för uppslagets varning (`_shared/eventpris.ts` § ETT UPPSLAG SOM FALLERAR). */
const LOGG = '[get-events]';

// Max record-ID:n per batch-anrop — en chunk = en kort `OR(RECORD_ID()=…)`-formel
// (≤50 IDs, väl under Airtables formel-/URL-längd) → ETT listanrop per chunk (ej
// N+1), ceil(N/50) anrop, NOLL trunkering. Samma mall som get-event/
// get-registrations (medveten duplicering — EF:er delar kod endast via _shared;
// extraktion hör till en egen refaktor-landning).
const BATCH_SIZE = 50;

type Fields = Record<string, unknown>;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Länk-fältets record-ID-array ur eventraden (frånvarande/ickearray → tom). */
function linkedIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** Batch-hämta record-ID:n ur en tabell via chunkad `OR(RECORD_ID()=…)` (get-event-mall). */
async function fetchByRecordIds(
  table: string,
  ids: readonly string[],
  fields: readonly string[],
): Promise<{ id: string; fields: Fields }[]> {
  const out: { id: string; fields: Fields }[] = [];
  for (const idChunk of chunk(ids, BATCH_SIZE)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = await fetchFromAirtable(table, { filterByFormula, fields: [...fields] });
    out.push(...records);
  }
  return out;
}

/**
 * Bor över-summeringen PER EVENT (task-17.5, PRD task-18 beslut 8 / task-17
 * story 9): HÄRLEDD räkning av ikryssade 'Bor över' bland varje events länkade
 * Anmälningar — listkortets säng-rad läser den. Inget lagrat räknefält (ADR-063:
 * härleds ALLTID ur kryssen; fältet fött task-18.7).
 *
 * Alla events länk-ID:n samlas EN gång och batch-hämtas chunkat (get-event:s
 * fetchBelaggning-mönster, lyft till list-nivå) — ceil(N/50) anrop för HELA
 * listan, ej per event (aldrig N+1). Checkbox: Airtable UTELÄMNAR en okryssad
 * ruta → `=== true` normaliserar (aldrig null; samma mappning som
 * get-registrations). Saknar basen fältet (t.ex. prod före den separat
 * auktoriserade fält-deployen) → utelämnat → 0, aldrig fel.
 */
async function fetchBorOverAntalByEvent(
  records: readonly { id: string; fields: Fields }[],
): Promise<Map<string, number>> {
  const idsByEvent = new Map<string, string[]>();
  const allRegIds = new Set<string>();
  for (const record of records) {
    const ids = linkedIds(record.fields['Anmälningar (länkat fält)']);
    idsByEvent.set(record.id, ids);
    for (const id of ids) allRegIds.add(id);
  }

  const regs =
    allRegIds.size > 0
      ? await fetchByRecordIds(REGISTRATIONS_TABLE, [...allRegIds], ['Bor över'])
      : [];
  const borOverById = new Map<string, boolean>();
  for (const reg of regs) borOverById.set(reg.id, reg.fields['Bor över'] === true);

  const result = new Map<string, number>();
  for (const [eventId, ids] of idsByEvent) {
    let antal = 0;
    for (const id of ids) if (borOverById.get(id) === true) antal += 1;
    result.set(eventId, antal);
  }
  return result;
}

// Fältnamn från Airtable → ren API-respons. Bas-shapen (21 fält) kommer ur
// `_shared/event-map.ts` — SSOT sedan TASK-23, delad med get-event/update-event, så
// ett nytt läs-fält landar på ETT ställe i stället för att kräva håll-i-synk-plikt i
// tre kopior. Spread FÖRST, funktionsspecifika fält efter: nyckelordningen i svaret är
// därmed oförändrad mot inline-kopian den ersätter.
function mapEvent(
  record: { id: string; fields: Record<string, unknown> },
  borOverAntal: number,
  standardPris: number | null,
) {
  return {
    // `standardPris` = Eventinnehåll-standarden (prisets nivå 3), uppslagen EN
    // gång för hela listan (`hamtaStandardpriser`). Utan den hade ett event vars
    // pris bara finns i standarden fått `pris: null` här medan servern efter en
    // ombokning svarat med ett riktigt tal — exakt den inkonsekvens TASK-368.7
    // finns för att ta bort.
    ...mapEventBas(record, standardPris),
    // Bor över-summeringen (task-17.5): härlett antal ikryssade 'Bor över' bland
    // eventets länkade Anmälningar (listkortets säng-rad). Aggregeras per event ur
    // registrerings-batchen (fetchBorOverAntalByEvent) och skickas in här — get-event
    // härleder samma tal ur sin egen beläggnings-batch.
    borOverAntal,
  };
}

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

  try {
    const records = await fetchFromAirtable(TABLE_NAME);
    // Bor över-summeringen (task-17.5): EN batch-läsning av alla events länkade
    // Anmälningar → antal ikryssade 'Bor över' per event (aldrig N+1).
    // Eventinnehåll-standarden (TASK-368.7): ETT anrop för hela listan, och
    // noll anrop när varje event redan har ett eget pris.
    const [borOverByEvent, standardpriser] = await Promise.all([
      fetchBorOverAntalByEvent(records),
      hamtaStandardpriser(records, LOGG),
    ]);
    const events = records.map((record) =>
      mapEvent(record, borOverByEvent.get(record.id) ?? 0, standardprisFor(standardpriser, record)),
    );

    // TASK-459 (AC #1): strukturerad per-steg-tidslogg (auth + total handler-tid; varje
    // Airtable-anrops egen varaktighet loggas redan centralt i airtable-client.ts, se
    // filhuvudet). `console.info` → Supabase Logs Explorer, `function_edge_logs.event_message`
    // (AC #2), samma strukturerade-JSON-form som `_shared/errors.ts:110`.
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'ef_step_timing',
        function: 'get-events',
        requestId,
        authMs,
        totalMs: Date.now() - handlerStart,
        eventCount: events.length,
      }),
    );

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-events',
      method: req.method,
      callerUserId: auth.user.id,
      // TASK-459: samma authMs/totalMs-fält på felvägen — en 429-utlöst lockout som slutar
      // i ett kastat fel ska bära lika mycket tidsinformation som lyckade svar.
      authMs,
      totalMs: Date.now() - handlerStart,
    });
  }
});
