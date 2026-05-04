import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const TABLE_ID = 'tbloOcrppVoyrHbrq'; // Anmälningar

function mapRegistration(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;

  const selectName = (val: unknown): string | null => {
    if (val && typeof val === 'object' && 'name' in (val as Record<string, unknown>)) {
      return (val as Record<string, string>).name;
    }
    return typeof val === 'string' ? val : null;
  };

  return {
    id: record.id,
    namn: f['Namn'] ?? null, // formula
    fornamn: f['Förnamn'] ?? null, // text
    efternamn: f['Efternamn'] ?? null, // text
    email: f['E-post'] ?? null, // text
    telefon: f['Mobilnummer'] ?? null, // text
    eventNamn: f['Event (namn)'] ?? null, // formula
    ort: f['Ort'] ?? null, // text
    status: selectName(f['Status']), // singleSelect
    flagga: selectName(f['Flagga']), // singleSelect
    anmalningsavgift: selectName(f['Anmälningsavgift']), // singleSelect
    slutbetalning: selectName(f['Slutbetalning']), // singleSelect
    betalningspaminnelseSkickad: f['Betalningspåminnelse skickad'] ?? null, // dateTime
    inskickad: f['Inskickad'] ?? null, // dateTime
    motivering: f['Varför vill du gå den här utbildningen?'] ?? null, // text
    tidigareErfarenhet: f['Vilka kurser från Roger och Lotta har du deltagit i tidigare?'] ?? null,
    antalPlatser: f['Antal platser'] ?? 1, // number
    notering: f['Notering'] ?? null, // text
    eventId: Array.isArray(f['Event']) ? f['Event'][0] : null, // linked record → first ID
    personId: Array.isArray(f['Person']) ? f['Person'][0] : null, // linked record → first ID
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get('eventId');
    const status = url.searchParams.get('status');
    const flagga = url.searchParams.get('flagga');

    // Bygg filterByFormula
    const filters: string[] = [];
    if (eventId) {
      filters.push(`FIND("${eventId}", ARRAYJOIN({Event}))`);
    }
    if (status) {
      filters.push(`{Status} = "${status}"`);
    }
    if (flagga) {
      filters.push(`{Flagga} = "${flagga}"`);
    }

    const filterByFormula =
      filters.length > 1 ? `AND(${filters.join(', ')})` : (filters[0] ?? undefined);

    const records = await fetchFromAirtable(TABLE_ID, {
      filterByFormula,
      sort: [{ field: 'Inskickad', direction: 'desc' }],
    });

    const registrations = records.map(mapRegistration);

    return new Response(JSON.stringify({ registrations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('get-registrations error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
