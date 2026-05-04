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

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);

    let filterByFormula: string | undefined;
    if (search) {
      const term = search.replace(/"/g, '\\"');
      filterByFormula = `OR(
        SEARCH(LOWER("${term}"), LOWER({Namn})),
        SEARCH(LOWER("${term}"), LOWER({E-post})),
        SEARCH(LOWER("${term}"), LOWER({Telefon})),
        SEARCH(LOWER("${term}"), LOWER(ARRAYJOIN({Ort})))
      )`;
    }

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
