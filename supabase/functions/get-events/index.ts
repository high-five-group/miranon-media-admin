import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { withConcurrencyLimit } from '../_shared/concurrency.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { mapEventBas } from '../_shared/event-map.ts';
import { hamtaStandardpriser, standardprisFor } from '../_shared/eventpris.ts';

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

// [TASK-458] Max antal SAMTIDIGA chunk-anrop i `fetchByRecordIds` — mot P4
// (Airtables DELADE 5 req/s-tak, docs/reference/airtable-constraints.md).
// Motiverat i TVÅ lager: get-events EGEN samlade samtidighet, och därefter
// den SAMLADE samtidigheten mot ANDRA EF:er som kan köra parallellt med
// denna (review-runda 2, FYND B — det snävare scopet i runda 1 räknade bara
// det förra).
//
// LAGER 1 — get-events EGEN samtidighet: `fetchByRecordIds` anropas i denna
// fil ENDAST från `fetchBorOverAntalByEvent`, som körs i SAMMA `Promise.all`
// som `hamtaStandardpriser` (Deno.serve nedan) — och `hamtaStandardpriser`
// gör högst ETT Airtable-anrop (`_shared/eventpris.ts` § ETT ANROP FÖR HELA
// LÄSNINGEN; noll om varje eventrad redan har eget pris). Med tak 2 här är
// get-events EGEN största samtidighet alltså 2 (Bor-över-chunkar) + 1
// (standardpriser, om fortfarande i flykt) = **3** samtidiga Airtable-anrop
// — samma tak och samma motiv som get-event-attachments redan etablerar
// (TASK-416.12: ATTACHMENTS_CHUNK_CONCURRENCY=2, "aldrig fler än 3
// Airtable-anrop i luften samtidigt"). Steg 1 (`fetchFromAirtable(TABLE_NAME)`
// i Deno.serve, full paginering av Eventplanering) är seriell och redan
// KLAR innan detta Promise.all startar — den bidrar aldrig till
// samtidigheten här.
//
// LAGER 2 — DEN FAKTISKA SAMLADE SAMTIDIGHETEN när get-events anropas av
// startvärmningsmotorn (`src/data/warmup/startvarmningen.ts`): motorn
// batchar sina sju datahämtningar i grupper om `BATCH_SIZE = 2`
// (startvarmningen.ts rad 140) och kör grupperna SEKVENTIELLT (`for`-loop
// med `await Promise.allSettled(...)` per grupp, rad 456–459) — men INOM en
// grupp körs de `BATCH_SIZE` posterna SAMTIDIGT. `WARMUP_ITEMS` (rad 280–354)
// har ordningen `[events, registrations, waitlist, intresserade, maillog,
// segment, activityLog]`, så grupp 1 = `[events, registrations]` — get-events
// och get-registrations (event-lösa grenen, `ds.fetchRegistrations()` utan
// argument) körs alltså ALLTID tillsammans, som samma EF-par, oavsett
// nätverkets hastighet. get-registrations event-lösa gren
// (`get-registrations/index.ts`, ~rad 158–166) gör ETT `fetchFromAirtable`-
// anrop med intern SEKVENTIELL paginering (samma `do…while(offset)`-mönster
// som get-events steg 1) — dess EGEN samtidighetsbidrag är alltså alltid
// EXAKT 1, aldrig mer (offset-kedjan kan per definition inte parallelliseras,
// P6). DEN FAKTISKA STÖRSTA SAMLADE SAMTIDIGHETEN under denna EF-parning blir
// därför get-events LAGER 1-tak (3) + get-registrations bidrag (1) =
// **4 samtidiga Airtable-anrop**, mot P4:s DELADE tak på 5/sekund — alltså
// 4/5 av HELA budgeten från EN enda användares kallstart, innan någon annan
// samtidig klient (en annan användare, en annan flik, ett CI-jobb mot
// staging) räknas in. Detta är ett FAKTALÄGE, inte ett beslut om det är
// acceptabelt — se PR-kroppen/kortets notes (TASK-458 review-runda 2) för
// 429-vägens konsekvens (`_shared/airtable-retry.ts`: varje `fetchFromAirtable`-
// anrop backar av OBEROENDE, 30 s+ golv per anrop, långt över
// startvärmningens egna 9 s hårda timeout `DEFAULT_TIMEOUT_MS`,
// startvarmningen.ts rad 137).
const BOR_OVER_CHUNK_CONCURRENCY = 2;

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

/**
 * Batch-hämta record-ID:n ur en tabell via chunkad `OR(RECORD_ID()=…)`
 * (get-event-mall).
 *
 * [TASK-458, mönster från TASK-416.12] Chunkarna hämtas parallellt via den
 * delade `withConcurrencyLimit` (`_shared/concurrency.ts`) i stället för en
 * sekventiell for-loop med await — de är oberoende anrop (olika
 * `RECORD_ID()`-mängder, samma tabell/fält). Se `BOR_OVER_CHUNK_CONCURRENCY`
 * för samtidighetstaket och dess motiv mot P4. Resultatordningen bevaras
 * deterministiskt (`withConcurrencyLimit` skriver per index, aldrig i
 * svarsordning) — union-ordningen spelar dessutom ingen roll för anroparen
 * här: `fetchBorOverAntalByEvent` bygger en `Map` keyed på record-ID.
 */
async function fetchByRecordIds(
  table: string,
  ids: readonly string[],
  fields: readonly string[],
): Promise<{ id: string; fields: Fields }[]> {
  const tasks = chunk(ids, BATCH_SIZE).map((idChunk) => () => {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    return fetchFromAirtable(table, { filterByFormula, fields: [...fields] });
  });
  const chunks = await withConcurrencyLimit(tasks, BOR_OVER_CHUNK_CONCURRENCY);
  return chunks.flat();
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

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-events',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
