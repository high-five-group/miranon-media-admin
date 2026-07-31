import {
  buildSearchAcrossFieldsFilter,
  type SearchField,
} from '../_shared/airtable-filter.ts';
import { fetchAirtablePage } from '../_shared/airtable-client.ts';
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
  let filterByFormula: string | undefined;
  if (search) {
    try {
      filterByFormula = buildSearchAcrossFieldsFilter(search, SEARCH_FIELDS);
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
