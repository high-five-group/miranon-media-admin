import {
  buildSearchAcrossFieldsFilter,
  type SearchField,
} from '../_shared/airtable-filter.ts';
import { fetchAirtablePage, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { selectName, stringArray } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { decodeCursor, encodeCursor } from '../_shared/cursor.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Cursor-paginering (ADR-056): default sidstorlek + Airtables tak (pageSize ≤ 100).
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Tabell adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
const TABLE_NAME = 'Personer';

// KONSTANT bas-filter (S103, Marcus 2026-08-10): Personer-vyn visar ENDAST
// personer med minst en anmälan. Tänkt som komplementet till get-leads
// LEAD_FILTER (numera `AND({Totalt antal hämtningar (erbjudande)} > 0,
// {Antal anmälningar (totalt)} = 0)`, TASK-277 AC #6 — citatet här hölls i
// synk med koden, den ändras varje gång LEAD_FILTER gör det): Intresserade
// bor under Mer, resten här. "Exakt komplement utan hål" var TASK-277:s
// ursprungliga Del 2-fynd FALSKT (35 personer föll mellan ytorna) — AC #6
// stänger den mätta klassen (33 av dem), men detta bas-filter RÖRS INTE av
// skivan (uttryckligt utanför omfattningen).
//
// GRÄNSEN GÅR VID ANMÄLAN, INTE VID GENOMFÖRT EVENT. Marcus formulering var
// "gått en eller flera kurser", men han preciserade skälet: personer med
// anmälningar men noll genomförda är de som AVBOKAT eller fått förhinder, och
// de hör hemma här - ORDLISTA kallar dem återaktiverbara kontakter och
// förbjuder att de tappas. Ett filter på {Antal genomförda event} hade tyst
// gömt dem, tillsammans med alla som är anmälda till ett kommande event utan
// att ha gått förut - just de Lotta ska maila INFÖR kursen.
//
// Konstant formel, inget klient-input - samma form som get-leads: den kan
// aldrig bära injektion och behöver därför ingen escaping. Kombineras med
// sökfiltret via AND() när båda finns.
//
// [FLYTTAD, TASK-286.1] Låg tidigare INUTI Deno.serve — flyttad hit
// (modul-nivå, oförändrat innehåll) så BÅDE sök-/cursor-grenen nedan och
// registerlägets EGEN gren (ADR-123 beslut 1) kan referera den utan att
// duplicera strängen. Ren relokering: samma värde, samma plats i AND()-
// kombinationen, ingen semantisk ändring.
const BAS_FILTER = '{Antal anmälningar (totalt)} > 0';

function mapPerson(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;

  return {
    id: record.id,
    namn: f['Namn'] ?? null, // formula (primary)
    fornamn: f['Förnamn'] ?? null, // text
    efternamn: f['Efternamn'] ?? null, // text
    email: f['E-post'] ?? null, // text
    telefon: f['Telefon'] ?? null, // text
    // `Ort` är en ROLLUP över Anmälningar (1→MÅNGA) → FLER-VÄRT. stringArray
    // bevarar alla orter (rå array hade kraschat PersonSchema; firstString hade
    // tappat data). Listan renderar inte ort, men domän-objektet bär den korrekt.
    ort: stringArray(f['Ort']), // rollup (multi-värt)
    manuellFlagga: selectName(f['Manuella flagga']), // singleSelect
    aiFlagga: selectName(f['AI-flagga']), // singleSelect
    anteckningar: f['Anteckningar'] ?? null, // text
    antalAnmalningar: f['Antal anmälningar (totalt)'] ?? 0, // rollup
    antalDeltaganden: f['Totala deltaganden'] ?? 0, // formula
    erfarenhetsniva: f['Erfarenhetsnivå (Miranon Media)'] ?? null, // formula
    erfarenhetsbadge: f['Erfarenhetsbadge'] ?? null, // formula
    senasteInteraktion: f['Senaste interaktion (text)'] ?? null, // formula
    senasteInteraktionDatum: f['Senaste interaktion (datum)'] ?? null, // formula
    dagarSedanSenaste: f['Dagar sedan senaste interaktion'] ?? null, // formula
    harAktivAnmalan: f['Har en aktiv anmälan?'] ?? null, // formula
    ejGodkandMail: f['Ej godkänd för mailutskick'] ?? false, // checkbox
    radSkapad: f['Rad skapad'] ?? null, // createdTime
    anmalningIds: Array.isArray(f['Anmälningar (länkat fält)'])
      ? f['Anmälningar (länkat fält)']
      : [],
    deltagandeIds: Array.isArray(f['Deltaganden']) ? f['Deltaganden'] : [],
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

  const url = new URL(req.url);

  // Registerläge (ADR-123 beslut 1, TASK-286.1): `register=true` är EF-
  // anropets EGEN signal — adapterns kontrakt (`DataSourceAdapter.
  // fetchPersonsRegister`) är parameterlöst, klienten skickar aldrig detta
  // som ett UI-argument. EN EGEN, TIDIG retur (inte en gren inuti sök-/
  // cursor-flödet nedan) håller AC #3 sant PER KONSTRUKTION: ett anrop UTAN
  // denna parameter når aldrig denna gren, så koden nedan är bokstavligen
  // orörd — inget att bevisa byte-identiskt, det är samma kod som körde
  // innan skivan.
  //
  // "Ingen andra walk" (AC #2): SAMMA fullwalk-primitiv (`fetchFromAirtable`)
  // som redan används för totalsiffran nedan — bara BREDDAD till alla fält
  // (`fields` utelämnat helt i stället för `['Namn']`) och posterna
  // returneras i stället för att räknas. Ignorerar sök/cursor/pageSize helt:
  // registret är HELA basfiltrets mängd, aldrig en delmängd av den.
  if (url.searchParams.get('register') === 'true') {
    try {
      const records = await fetchFromAirtable(TABLE_NAME, {
        filterByFormula: BAS_FILTER,
        sort: [{ field: 'Namn', direction: 'asc' }],
      });
      return new Response(JSON.stringify({ persons: records.map(mapPerson) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return mapErrorToResponse(error, requestId, corsHeaders, {
        function: 'get-persons',
        method: req.method,
        callerUserId: auth.user.id,
      });
    }
  }

  const search = url.searchParams.get('search');

  // pageSize: default 50, klamp till Airtables tak (≤100), ignorera skräp.
  const rawPageSize = parseInt(url.searchParams.get('pageSize') ?? '', 10);
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  // cursor: opak klient-token → Airtable offset. Felformad → 400 (klient-fel).
  const rawCursor = url.searchParams.get('cursor');
  let offset: string | undefined;
  if (rawCursor) {
    try {
      offset = decodeCursor(rawCursor);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid cursor' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Bygg filterByFormula via parameteriserade builders (M5).
  // Builders kastar vid kontrolltecken / för långa strängar /
  // Unicode-bidi-overrides → 400 (klient-fel). Servern loggar full
  // detail för audit; klient ser generic "Invalid filter input".
  const SEARCH_FIELDS: readonly SearchField[] = [
    { name: 'Namn', isArray: false },
    { name: 'E-post', isArray: false },
    { name: 'Telefon', isArray: false },
    { name: 'Ort', isArray: true },
  ];
  // BAS_FILTER är modul-nivå (se ovan, TASK-286.1-flytten) — samma konstant,
  // ingen ändring av värde eller AND()-kombination.
  let filterByFormula: string | undefined = BAS_FILTER;
  if (search) {
    try {
      const sokFilter = buildSearchAcrossFieldsFilter(search, SEARCH_FIELDS);
      filterByFormula = `AND(${BAS_FILTER}, ${sokFilter})`;
    } catch (filterError) {
      console.warn(
        `[get-persons] DENY invalid search input: ${(filterError as Error).message}`,
      );
      return new Response(JSON.stringify({ error: 'Invalid filter input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    // ETT Airtable-listanrop per sida (ingen full-walk) — cursor-port (ADR-056).
    const pagePromise = fetchAirtablePage(TABLE_NAME, {
      filterByFormula,
      sort: [{ field: 'Namn', direction: 'asc' }],
      pageSize,
      offset,
    });

    // TASK-277 Del 1 — äkta totalsiffra, ADDITIVT svarsfält (speglar
    // get-activity-log/TASK-225.2, `index.ts:236-269`). Airtable saknar en
    // count-primitiv för ett filtrerat urval (`airtable-constraints.md` P6:
    // "ingen numerisk offset, ingen totalräkning") — full-walk mot SAMMA
    // filterByFormula är den enda vägen till ett äkta antal. Beräknas ENBART
    // på FÖRSTA sidan (cursor saknas), aldrig per sida — annars hade varje
    // "Ladda fler" kostat en extra full-walk. `fields` begränsat till ETT
    // fält håller full-walk-payloaden minimal (record-ID + ett fält/rad,
    // inga övriga 20+ kolumner). Äldre klienter läser bara
    // {persons, nextCursor} och är obrutna.
    // FELISOLERING (orkestrerar-granskning, samma landning): full-walken gör
    // FLERA sekventiella Airtable-anrop — dess felyta (429, transient 5xx,
    // timeout mitt i walken) är därför mångdubbelt större än sid-anropets.
    // Utan egen .catch() hade en rejectad totalPromise kastat HELA
    // Promise.all och tagit ner listan (`mapErrorToResponse`, felruta i
    // stället för 50 rader) — en KOSMETISK siffra hade fällt appens
    // huvudyta. Listan är viktigare än räknaren: en trasig full-walk
    // degraderar till `undefined` (samma additiva/skew-säkra väg klienten
    // redan bär, `PersonsList.tsx`s `data?.pages[0]?.total ?? loadedCount`),
    // ALDRIG till ett kastat fel. Loggas ändå (samma
    // varna-och-degradera-mönster som `get-segments/index.ts`s
    // `toSavedSegment`) så en SYSTEMATISKT trasig full-walk syns i loggarna
    // i stället för att bli osynlig bakom en alltid-grön fallback.
    const totalPromise = offset
      ? Promise.resolve(undefined)
      : fetchFromAirtable(TABLE_NAME, { filterByFormula, fields: ['Namn'] })
          .then((records) => records.length)
          .catch((totalError) => {
            console.warn(
              `[get-persons] totalsiffra-full-walk fallerade, degraderar till undefined: ${(totalError as Error).message}`,
            );
            return undefined;
          });

    const [{ records, nextOffset }, total] = await Promise.all([pagePromise, totalPromise]);

    const persons = records.map(mapPerson);
    // Wrappa Airtables offset opakt; null på sista sidan.
    const nextCursor = nextOffset ? encodeCursor(nextOffset) : null;

    return new Response(
      JSON.stringify({ persons, nextCursor, ...(total !== undefined ? { total } : {}) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-persons',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
