import {
  buildSearchAcrossFieldsFilter,
  type SearchField,
} from '../_shared/airtable-filter.ts';
import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';

const TABLE_ID = 'tbl6ZyCm3V026iFTU'; // Personer

function mapPerson(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;

  const selectName = (val: unknown): string | null => {
    if (val && typeof val === 'object' && 'name' in (val as Record<string, unknown>)) {
      return (val as Record<string, string>).name;
    }
    return typeof val === 'string' ? val : null;
  };

  return {
    id: record.id,
    namn: f['Namn'] ?? null, // formula (primary)
    fornamn: f['Förnamn'] ?? null, // text
    efternamn: f['Efternamn'] ?? null, // text
    email: f['E-post'] ?? null, // text
    telefon: f['Telefon'] ?? null, // text
    ort: f['Ort'] ?? null, // rollup
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
  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const search = url.searchParams.get('search');
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);

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
    const records = await fetchFromAirtable(TABLE_ID, {
      filterByFormula,
      sort: [{ field: 'Namn', direction: 'asc' }],
      maxRecords: limit,
    });

    const persons = records.map(mapPerson);

    return new Response(JSON.stringify({ persons }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('get-persons error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
