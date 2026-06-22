import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { buildEqualsFilter, combineWithAnd } from '../_shared/airtable-filter.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
const TABLE_NAME = 'Väntelista';

// Aktiv-filtret: väntelistan visar bara rader som INTE flyttats till anmälan.
// `NOT({Flyttad till anmälan})` evaluerar checkboxen (1/0); en omarkerad ruta
// (blank/0) → NOT(0)=1 → raden inkluderas. Fält-namnet är hårdkodat (ingen
// user-input → ingen injection-yta), wrappas inte via buildEqualsFilter.
const ACTIVE_FILTER = 'NOT({Flyttad till anmälan})';

type Fields = Record<string, unknown>;

/**
 * Mappar en Väntelista-rad → roster-kontraktet. ENDAST de fält vy:n konsumerar
 * (id, namn, kontakt, informationsmail-1-status, createdTime). utm/eventdatum
 * läses medvetet INTE — inget konsumerar dem (förbygge-fakta, Chat-låst). Alla
 * text-/dateTime-fält coercas via scalarString (aldrig tyst array-drop, samma
 * disciplin som get-attendance/get-registrations).
 *
 * `createdTime` tas från record-METADATA (Airtable returnerar den på varje
 * record-topnivå, alltid present) — INTE ur fields. Det är "datum" i roster
 * ("när de ställde sig") OCH sort-nyckeln. Inget Airtable-fält bär den, så
 * sorteringen sker JS-side (Airtables sort-param kräver ett fält).
 */
function mapWaitlistEntry(record: { id: string; fields: Fields; createdTime: string }) {
  const f = record.fields;
  return {
    id: record.id,
    fornamn: scalarString(f['Förnamn']), // singleLineText
    efternamn: scalarString(f['Efternamn']), // singleLineText
    email: scalarString(f['E-post']), // singleLineText
    telefon: scalarString(f['Telefonnummer']), // singleLineText
    informationsmail1Skickad: scalarString(f['Informationsmail 1 skickad']), // dateTime (ISO|null)
    createdTime: record.createdTime, // record-metadata, alltid present
  };
}

type WaitlistEntryRow = ReturnType<typeof mapWaitlistEntry>;

/** createdTime desc (senaste-först). createdTime är alltid en giltig ISO-sträng. */
function byCreatedTimeDesc(a: WaitlistEntryRow, b: WaitlistEntryRow): number {
  return Date.parse(b.createdTime) - Date.parse(a.createdTime);
}

/**
 * get-waitlist — väntelistan (Väntelista) som GLOBAL läs-lista (Fas 6c, Leverabel 3).
 *
 * GLOBAL DESIGN (ej per-event): Väntelista.Event är ett singleLineText-fält (en
 * text-konstant per kampanj, INGET länkfält) — alltså finns ingen record-ID-batch-
 * väg som get-attendance/get-registrations bär. EF:en filtrerar serverside på
 * NOT({Flyttad till anmälan}) (aktiva rader) och returnerar HELA den aktiva listan.
 * Valfritt `?event=`-filter (by-name, AND {Event}=value) implementeras minimalt +
 * ärligt — vy-konsumenten passar inga filters → global. LÄSER bara.
 *
 * INGEN 404 (tom lista är ett giltigt tillstånd — global lista, inget by-id-uppslag),
 * INGEN väg-D/record-ID-batch, INGEN chunk-merge. Sort: createdTime desc (JS-side,
 * createdTime är record-metadata, inte ett sorterbart Airtable-fält).
 *
 * FEL-KONTRAKT: `{ error }` (klient-fel) — samma konvention som get-registrations
 * (400 vid ogiltig filter-input, 401 anon, 500 → `{ error, requestId }`).
 */
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const event = url.searchParams.get('event');

  // Bygg filterByFormula: alltid aktiv-filtret, + valfritt {Event}=value.
  // buildEqualsFilter kastar vid kontrolltecken / Unicode-bidi / för lång input
  // → 400 (klient-fel, inte server-fel). Servern loggar; klient ser generic.
  let filterByFormula: string | undefined;
  try {
    const filters: string[] = [ACTIVE_FILTER];
    if (event) {
      filters.push(buildEqualsFilter('Event', event));
    }
    filterByFormula = combineWithAnd(filters);
  } catch (filterError) {
    console.warn(`[get-waitlist] DENY invalid filter input: ${(filterError as Error).message}`);
    return new Response(JSON.stringify({ error: 'Invalid filter input' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const records = await fetchFromAirtable(TABLE_NAME, { filterByFormula });
    const waitlist = records.map(mapWaitlistEntry);
    waitlist.sort(byCreatedTimeDesc);

    return new Response(JSON.stringify({ waitlist }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-waitlist',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
