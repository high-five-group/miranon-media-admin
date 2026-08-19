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

// Lead-filtret (Läsning 2, Marcus-låst Fas 6e L1): en INTRESSERAD = person som
// hämtat något men aldrig anmält sig ({Antal anmälningar (totalt)} = 0).
// KONSTANT formel — inget klient-input, inget länk-ID-filter → ingen
// injektions-yta, ingen T15. Deltaganden-klausulen är UTELÄMNAD som BEVISAT
// redundant: ett Deltagande är "en rad per Anmälan × Session" (data-model.md
// rad 74/107; A3 kräver Anmälan.Person) → 0 anmälningar ⟹ 0 deltaganden
// nödvändigtvis.
//
// TASK-277 AC #6 — "hämtat något" läser {Totalt antal hämtningar
// (erbjudande)}, INTE längre {Antal hämtningar}. `Antal hämtningar` är
// `COUNTA({Engagemang})` — den räknar rader i aggregeringstabellen
// `Engagemang`, inte hämtningar (fälla 47, data-model.md rad 1458,
// live-belagd S103). `Totalt antal hämtningar (erbjudande)` är i stället en
// ROLLUP direkt över `Touchpoints` (rålogget) och missar därför inte de
// hämtningar vars `Engagemang`-rad aldrig skapades. Mätt i prod 2026-08-19
// (TASK-277 premisskontroll): 69 personer bär rollup > 0 medan COUNTA ger 0,
// varav 33 var rena leads osynliga i HELA appen — LEAD_FILTER läckte dem.
const LEAD_FILTER =
  'AND({Totalt antal hämtningar (erbjudande)} > 0, {Antal anmälningar (totalt)} = 0)';

function asNumber(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

// mapLead = get-persons mapPerson-fälten + de två leads-rollups list-schemat
// utelämnar (IntresseradSchema = PersonSchema.extend). Coercion speglar
// get-person: antalHamtningar via asNumber (skalär), allaHamtningar via
// stringArray (FLER-VÄRT rollup, ALDRIG firstString).
function mapLead(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;

  return {
    id: record.id,
    namn: f['Namn'] ?? null, // formula (primary)
    fornamn: f['Förnamn'] ?? null, // text
    efternamn: f['Efternamn'] ?? null, // text
    email: f['E-post'] ?? null, // text
    telefon: f['Telefon'] ?? null, // text
    // `Ort` = ROLLUP över Anmälningar (1→MÅNGA) → FLER-VÄRT. stringArray bevarar
    // alla orter. (En lead har 0 anmälningar → typiskt tom array; korrekt ändå.)
    ort: stringArray(f['Ort']), // rollup (multi-värt)
    manuellFlagga: selectName(f['Manuella flagga']), // singleSelect
    aiFlagga: selectName(f['AI-flagga']), // singleSelect
    anteckningar: f['Anteckningar'] ?? null, // text
    antalAnmalningar: f['Antal anmälningar (totalt)'] ?? 0, // rollup (= 0 per filter)
    antalDeltaganden: f['Totala deltaganden'] ?? 0, // formula (= 0 per filter)
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
    // Leads-rollups (utöver list-schemat) — "vad de nappat på".
    //
    // ÖPPEN KANT (TASK-277, medvetet EJ löst här): `antalHamtningar` mappas
    // FORTSATT från `Antal hämtningar` (COUNTA(Engagemang), fälla 47) —
    // ENDAST LEAD_FILTER ovan pekades om, inte detta visningsfält. De 33 nya
    // leads som filtret nu släpper in (rollup > 0, COUNTA = 0) visar därför
    // `antalHamtningar: 0` trots att de uppenbarligen hämtat något; ett
    // kosmetiskt facit-fel, inte ett synlighets-fel (`allaHamtningar` nedan
    // fortsätter visa VAD de hämtat, eftersom den läser Touchpoints direkt).
    // Rätt fix är basens formel (fälla 47:s egen rekommendation) — en
    // PROD-SCHEMAÄNDRING utanför denna skivas mandat.
    antalHamtningar: asNumber(f['Antal hämtningar']), // formula COUNTA(Engagemang)
    allaHamtningar: stringArray(f['Alla hämtningar']), // rollup ö. Touchpoints (FLER-VÄRT)
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

  try {
    // ETT Airtable-listanrop per sida (ingen full-walk) — cursor-port (ADR-056).
    // Sort: senaste aktivitet först (verifierat sorterbart, Fas 0). Filter är
    // konstant (LEAD_FILTER) — ingen sök i v1.
    const { records, nextOffset } = await fetchAirtablePage(TABLE_NAME, {
      filterByFormula: LEAD_FILTER,
      sort: [{ field: 'Senaste interaktion (datum)', direction: 'desc' }],
      pageSize,
      offset,
    });

    const intresserade = records.map(mapLead);
    // Wrappa Airtables offset opakt; null på sista sidan.
    const nextCursor = nextOffset ? encodeCursor(nextOffset) : null;

    return new Response(JSON.stringify({ intresserade, nextCursor }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-leads',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
