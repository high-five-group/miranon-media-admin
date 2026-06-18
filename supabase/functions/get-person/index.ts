import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas (tbl-id:n är bas-unika; ADR-050). Spegel av get-persons.
const PERSONER_TABLE = 'Personer';
const DELTAGANDEN_TABLE = 'Deltaganden';

// Fält att hämta ur Deltaganden för event-för-event-historik. Ett urval (fields[])
// håller batch-svaret litet; alla finns verifierade i data-model.md + live-schema
// (tbldWHH6sSHWoQPHH).
const HISTORY_FIELDS = [
  'Kursnamn (lookup)',
  'Eventlabel (text)',
  'Event startdatum',
  'Session',
  'Status',
  'Närvaropoäng',
  'Event ort',
  'Event typ',
];

type Fields = Record<string, unknown>;

/** singleSelect → namnet; sträng → strängen; annars null. */
function selectName(val: unknown): string | null {
  if (val && typeof val === 'object' && 'name' in (val as Record<string, unknown>)) {
    return (val as Record<string, string>).name;
  }
  return typeof val === 'string' ? val : null;
}

/** Lookup-fält levereras ofta som array → ta första värdet (sträng eller {name}). */
function firstString(val: unknown): string | null {
  if (Array.isArray(val)) {
    const first = val[0];
    return selectName(first);
  }
  return selectName(val);
}

function asString(val: unknown): string | null {
  return typeof val === 'string' && val.length > 0 ? val : null;
}

function asNumber(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

/** Mappar en Deltaganden-rad → en kurshistorik-post (PersonHistoryEntry-form). */
function mapHistoryEntry(record: { id: string; fields: Fields }) {
  const f = record.fields;
  return {
    id: record.id,
    kursnamn: firstString(f['Kursnamn (lookup)']),
    eventLabel: asString(f['Eventlabel (text)']),
    datum: asString(f['Event startdatum']),
    session: asString(f['Session']),
    status: asString(f['Status']),
    narvaro: f['Närvaropoäng'] === 1,
    ort: firstString(f['Event ort']),
    typ: firstString(f['Event typ']),
  };
}

/**
 * Mappar Personer-raden → PersonDetail-form. Speglar get-persons `mapPerson`
 * (samma list-fält) och lägger till detaljvyns engagemangs-/lead-rollups.
 * `historik` injiceras av callern (batch-hämtad separat).
 */
function mapPersonDetail(
  record: { id: string; fields: Fields },
  historik: ReturnType<typeof mapHistoryEntry>[],
) {
  const f = record.fields;
  return {
    id: record.id,
    namn: f['Namn'] ?? null,
    fornamn: f['Förnamn'] ?? null,
    efternamn: f['Efternamn'] ?? null,
    email: f['E-post'] ?? null,
    telefon: f['Telefon'] ?? null,
    ort: f['Ort'] ?? null,
    manuellFlagga: selectName(f['Manuella flagga']),
    aiFlagga: selectName(f['AI-flagga']),
    anteckningar: f['Anteckningar'] ?? null,
    antalAnmalningar: asNumber(f['Antal anmälningar (totalt)']),
    antalDeltaganden: asNumber(f['Totala deltaganden']),
    erfarenhetsniva: f['Erfarenhetsnivå (Miranon Media)'] ?? null,
    erfarenhetsbadge: f['Erfarenhetsbadge'] ?? null,
    senasteInteraktion: f['Senaste interaktion (text)'] ?? null,
    senasteInteraktionDatum: f['Senaste interaktion (datum)'] ?? null,
    dagarSedanSenaste: typeof f['Dagar sedan senaste interaktion'] === 'number'
      ? f['Dagar sedan senaste interaktion']
      : null,
    harAktivAnmalan: f['Har en aktiv anmälan?'] ?? null,
    ejGodkandMail: f['Ej godkänd för mailutskick'] ?? false,
    radSkapad: f['Rad skapad'] ?? null,
    anmalningIds: Array.isArray(f['Anmälningar (länkat fält)'])
      ? f['Anmälningar (länkat fält)']
      : [],
    deltagandeIds: Array.isArray(f['Deltaganden']) ? f['Deltaganden'] : [],
    // Detaljvyns extra rollups (ej i list-PersonSchema).
    aterkommande: f['Återkommande?'] ?? null,
    nastaEvent: f['Nästa event (text)'] ?? null,
    antalGenomfordaEvent: asNumber(f['Antal genomförda event']),
    senasteDeltagandeDatum: f['Senaste deltagande datum'] ?? null,
    antalHamtningar: asNumber(f['Antal hämtningar']),
    allaHamtningar: f['Alla hämtningar'] ?? null,
    motivering: f['Motivering (text)'] ?? null,
    inbjudenCommunity: f['Inbjuden till community'] ?? false,
    skapatKontoCommunity: f['Skapat konto i community'] ?? false,
    historik,
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
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1) Person-raden — ETT single-get-anrop (alla rollups följer med). null = 404.
    const personRecord = await fetchAirtableRecord(PERSONER_TABLE, id);
    if (!personRecord) {
      // 404-KONTRAKT (single-get-mallens nya element; 6b get-event ärver):
      // icke-existerande ID → 404, aldrig 500/tomt 200.
      return new Response(JSON.stringify({ error: 'Person not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Event-för-event-historik — ETT batch-anrop mot Deltaganden på de
    //    länkade record-ID:na (filterByFormula OR(RECORD_ID()=…)), ALDRIG
    //    ett-anrop-per-rad (N+1-undvikande, världsklass-rationale). Hoppas
    //    helt om personen saknar deltaganden (inget onödigt anrop).
    const deltagandeIds: string[] = Array.isArray(personRecord.fields['Deltaganden'])
      ? (personRecord.fields['Deltaganden'] as string[])
      : [];

    let historik: ReturnType<typeof mapHistoryEntry>[] = [];
    if (deltagandeIds.length > 0) {
      const filterByFormula = `OR(${deltagandeIds.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
      const records = await fetchFromAirtable(DELTAGANDEN_TABLE, {
        filterByFormula,
        fields: HISTORY_FIELDS,
        sort: [{ field: 'Event startdatum', direction: 'desc' }],
      });
      historik = records.map(mapHistoryEntry);
    }

    const person = mapPersonDetail(personRecord, historik);

    return new Response(JSON.stringify({ person }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-person',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
