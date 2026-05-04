import {
  buildEqualsFilter,
  buildLinkedRecordFilter,
  combineWithAnd,
} from '../_shared/airtable-filter.ts';
import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

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

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  const status = url.searchParams.get('status');
  const flagga = url.searchParams.get('flagga');

  // Bygg filterByFormula via parameteriserade builders (M5).
  // Builders kastar vid kontrolltecken / ogiltigt recordId-format /
  // för långa strängar / Unicode-bidi-overrides → 400 (klient-fel,
  // inte server-fel). Servern loggar full detail för audit; klient
  // ser generic "Invalid filter input".
  let filterByFormula: string | undefined;
  try {
    const filters: string[] = [];
    if (eventId) {
      filters.push(buildLinkedRecordFilter('Event', eventId));
    }
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
    const records = await fetchFromAirtable(TABLE_ID, {
      filterByFormula,
      sort: [{ field: 'Inskickad', direction: 'desc' }],
    });

    const registrations = records.map(mapRegistration);

    return new Response(JSON.stringify({ registrations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-registrations',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
