import { fetchAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarNumber, scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Tabell adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
// Spegel av get-events (samma tabell, samma mappning, EN rad).
const TABLE_NAME = 'Eventplanering';

// Fältnamn från Airtable → ren API-respons. IDENTISK mappning som get-events
// `mapEvent` (samma berikade shape per EventSchema) — get-event speglar
// get-events för EN rad, ingen aggregering (Fas 6b L2). Håll i synk med
// get-events/index.ts om fält ändras.
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
    // Number-fält via scalarNumber: Airtable ger formel-/procent-fält som blir
    // NaN/Infinity (0/0, osatt maxPlatser) som OBJEKT {specialValue} — scalarNumber
    // coercar det till null så .parse() håller (konsekvent över get-event/get-events).
    maxPlatser: scalarNumber(f['Max antal platser']), // number (osatt → null)
    antalAnmalda: scalarNumber(f['Antal anmälda']) ?? 0, // formel → number
    platserKvar: scalarNumber(f['Platser kvar']), // formel → number|null
    anmaldBelaggning: scalarNumber(f['Anmäld beläggning (%)']), // formel-% (NaN→null)
    bekraftadBelaggning: scalarNumber(f['Bekräftad beläggning (%)']), // formel-% (NaN→null)
    antalNyaAnmalningar: scalarNumber(f['Antal nya anmälningar']) ?? 0, // rollup → number
    antalAnmalningsavgifter: scalarNumber(f['Antal mottagna anmälningsavgifter']) ?? 0, // rollup
    antalSlutbetalningar: scalarNumber(f['Antal mottagna slutbetalningar']) ?? 0, // rollup
    antalSlutbetalningFelande: scalarNumber(f['Antal slutbetalning saknas']) ?? 0, // formel
    status: selectName(f['Status'] ?? null), // singleSelect (om det finns)
    // eventKey (task-18.1): formel "Event-" & {Event-nr} — EventKey-pillen på
    // detaljsidans topprad. Håll i synk med get-events (fältet är OPTIONAL i
    // EventSchema — saknas värdet UTELÄMNAS nyckeln: JSON.stringify droppar
    // undefined; aldrig null). Båda EF:erna bär fältet sedan samma leverans.
    eventKey: typeof f['EventKey'] === 'string' ? f['EventKey'] : undefined,
  };
}

/**
 * get-event — enskilt event via ID (single-get-mall; ärver get-person:s 404-
 * kontrakt). LÄSER bara — ingen write/mutation. Speglar get-events-mappningen
 * för EN rad (all data finns redan i Eventplanering-raden, ingen aggregering).
 *
 * FEL-KONTRAKT: `{ error: <message> }` (klient-fel) — samma etablerade konvention
 * som get-person/get-persons/auth.ts (400/401/404 → `{ error }`, 500 →
 * `{ error, requestId }`). 404 = okänt ID (aldrig 500/tomt 200), kopierat från
 * get-person.
 */
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ETT single-get-anrop (alla formler/rollups följer med). null = 404.
    const record = await fetchAirtableRecord(TABLE_NAME, id);
    if (!record) {
      // 404-KONTRAKT (single-get-mallen, ärvd från get-person): icke-existerande
      // ID → 404, aldrig 500/tomt 200.
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const event = mapEvent(record);

    return new Response(JSON.stringify({ event }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-event',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
