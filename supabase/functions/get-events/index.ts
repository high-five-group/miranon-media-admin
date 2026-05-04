import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';

const TABLE_ID = 'tblVE3UKWl1CKrphV'; // Eventplanering

// Fältnamn från Airtable → ren API-respons
function mapEvent(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;

  // Select-fält kan komma som { id, name, color } eller string
  const selectName = (val: unknown): string | null => {
    if (val && typeof val === 'object' && 'name' in (val as Record<string, unknown>)) {
      return (val as Record<string, string>).name;
    }
    return typeof val === 'string' ? val : null;
  };

  return {
    id: record.id,
    eventlabel: f['Eventlabel'] ?? null, // formula (primary)
    eventNamn: selectName(f['Event (source)']), // singleSelect
    typ: selectName(f['Typ']), // singleSelect
    ort: f['Ort'] ?? null, // text
    startdatum: f['Startdatum'] ?? null, // date
    slutdatum: f['Slutdatum'] ?? null, // date
    tidKvarTillEvent: f['Tid kvar till event'] ?? null, // formula → text
    maxPlatser: f['Max antal platser'] ?? null, // number
    antalAnmalda: f['Antal anmälda'] ?? 0, // formula → number
    platserKvar: f['Platser kvar'] ?? null, // formula → number
    anmaldBelaggning: f['Anmäld beläggning (%)'] ?? null, // formula
    bekraftadBelaggning: f['Bekräftad beläggning (%)'] ?? null, // formula
    antalNyaAnmalningar: f['Antal nya anmälningar'] ?? 0, // rollup → number
    antalAnmalningsavgifter: f['Antal mottagna anmälningsavgifter'] ?? 0, // rollup
    antalSlutbetalningar: f['Antal mottagna slutbetalningar'] ?? 0, // rollup
    antalSlutbetalningFelande: f['Antal slutbetalning saknas'] ?? 0, // formula
    status: selectName(f['Status'] ?? null), // singleSelect (om det finns)
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const records = await fetchFromAirtable(TABLE_ID);
    const events = records.map(mapEvent);

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('get-events error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
