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
  // "Ingen andra walk" (TASK-286.1 AC #2): SAMMA fullwalk-primitiv
  // (`fetchFromAirtable`) som fram till TASK-286.3 också bar totalsiffrans
  // walk nedan — bara BREDDAD till alla fält (`fields` utelämnat helt i
  // stället för `['Namn']`) och posterna returneras i stället för att räknas.
  // Ignorerar sök/cursor/pageSize helt: registret är HELA basfiltrets mängd,
  // aldrig en delmängd av den.
  //
  // [ENDA WALKEN, TASK-286.3] Sedan totalsiffrans walk är riven är detta
  // funktionens ENDA fullwalk. Den omfördelning ADR-123 § Kontext fynd 2
  // beskrev är därmed genomförd i koden, inte bara i planen: ett anrop per
  // vy-besök i stället för två parallella.
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
    //
    // [TOTAL-WALKEN RIVEN, TASK-286.3 AC #2] Här låg TASK-277 Del 1:s
    // `totalPromise` — en andra, FULLSTÄNDIG walk (`fields: ['Namn']`) mot
    // samma `filterByFormula`, körd parallellt med sid-anropet enbart för att
    // kunna svara med ett `total`-fält. Airtable saknar en count-primitiv för
    // ett filtrerat urval (`airtable-constraints.md` P6), så en walk var den
    // enda vägen till ett äkta antal.
    //
    // Den behövs inte längre, och det är hela poängen med ADR-123: listan
    // laddar HELA registret en gång (`?register=true` ovan) och räknar både
    // "Visar N" och "av TOTAL" ur arrayen i minnet. Att behålla walken hade
    // betytt att varje sidanrop fortsatte betala för ett tal ingen läser —
    // ADR-123 § Kontext fynd 2 räknade det som EN av de två parallella
    // hämtningar registerläget ersätter med en.
    //
    // Det som rivs med den: `total` ur svarskuvertet (kvar är
    // `{ persons, nextCursor }`), klientens skew-säkra avläsning i
    // `AirtableAdapter.listPersons` (metoden själv riven), `PersonsPage.total`
    // och felisolerings-regressionstestet `get-persons-totalisolering.test.ts`
    // — vars hela objekt var `totalPromise`s `.catch()`.
    //
    // SÖK-/CURSOR-GRENEN SJÄLV LEVER KVAR, och det är ett MÄTT beslut, inte
    // en glömska. TASK-286.3 AC #3 river den bara om ett grep-svep visar noll
    // andra konsumenter; svepet (2026-08-22, hela repot utom node_modules)
    // visade FYRA, samtliga blockerande testytor som anropar `?search=` eller
    // `?cursor=` direkt över HTTP:
    //
    //   · `tests/api/get-persons-sok-paritet.staging.test.ts` — ADR-123
    //     beslut 2:s BEVISINSTRUMENT: kör kortets termlista mot både denna
    //     gren och klientfiltret. Rivs grenen finns ingen mätbar referens
    //     kvar att väga klientfiltret mot alls. (Att kravet i dag lyder
    //     "identiska träffmängder" är en EGENSKAP hos dagens semantik, inte
    //     ett evigt kontrakt: `TASK-286.5` är beslutad JA — klientsöket ska
    //     bli diakritik-tolerant, och då byter denna svit facit i det
    //     kortet. Behovet av EF-grenen som referensyta står kvar oavsett.)
    //   · `tests/api/get-persons.staging.test.ts` — cursor-port-conformance
    //     (ADR-056), sid-sekvens [2,2,1] med opak cursor.
    //   · `tests/kontraktsvakt/kontraktsfall.ts` — FELKONTRAKTET
    //     `?cursor=inte-en-cursor` → 400 "Invalid cursor" (TASK-69).
    //   · `tests/api/airtable-filter.staging.test.ts` — injektions-fuzzen
    //     ("illvillig search=TRUE-tautology / OR-injection → aldrig 500").
    //
    // ADR-123 § Konsekvenser förutsåg exakt detta: paritetstestet underhålls
    // "så länge båda vägarna finns". Klientens väg hit är riven; EF-vägen
    // står kvar som den mätbara referens klientfiltret vägs mot.
    const { records, nextOffset } = await fetchAirtablePage(TABLE_NAME, {
      filterByFormula,
      sort: [{ field: 'Namn', direction: 'asc' }],
      pageSize,
      offset,
    });

    const persons = records.map(mapPerson);
    // Wrappa Airtables offset opakt; null på sista sidan.
    const nextCursor = nextOffset ? encodeCursor(nextOffset) : null;

    return new Response(JSON.stringify({ persons, nextCursor }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-persons',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
