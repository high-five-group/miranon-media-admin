import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Tabell adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
const TABLE_NAME = 'Eventplanering';

// Fältnamn från Airtable → ren API-respons (kanonisk coercion ur _shared/coerce).
function mapEvent(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;

  return {
    id: record.id,
    eventlabel: f['Eventlabel'] ?? null, // formula (primary)
    eventNamn: selectName(f['Event (source)']), // singleSelect
    typ: selectName(f['Typ']), // singleSelect
    ort: scalarString(f['Ort']), // text (eget fält, skalärt)
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
  const requestId = generateRequestId();

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const records = await fetchFromAirtable(TABLE_NAME);
    const events = records.map(mapEvent);

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
