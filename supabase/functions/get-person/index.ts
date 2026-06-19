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

// Max record-ID:n per Deltaganden-batch-anrop. En person kan ha hundratals
// deltaganden (en/session; ~924 backfillade rader förekommer) — en enda
// `OR(RECORD_ID()=…)`-formel över alla skulle spränga Airtables formel-/
// URL-längd. Vi chunkar ID-listan: varje chunk ger en kort formel (≤50 IDs ≈
// ~1.5 kB, väl under gränsen) och matchar ≤50 unika records = ETT listanrop per
// chunk (ej per record → ej N+1). Övre gräns: obegränsat antal deltaganden
// (ceil(N/50) anrop), NOLL trunkering. Sort sker i JS efter sammanslagning
// (per-chunk-sort räcker inte över chunk-gränser).
//
// Env-override (`HISTORY_BATCH_SIZE`) finns ENBART för conformance-testbarhet:
// staging sätter den lågt (=2) så att chunk-merge-vägen exerceras med en liten
// fixtur (bevisar noll-trunkering vid chunk-gräns). Prod sätter inte secreten →
// default 50 (oförändrat beteende). Ogiltigt/saknat värde → default.
function historyBatchSize(): number {
  const raw = Number.parseInt(Deno.env.get('HISTORY_BATCH_SIZE') ?? '', 10);
  return Number.isInteger(raw) && raw > 0 ? raw : 50;
}

type Fields = Record<string, unknown>;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

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
    // `Event startdatum` är en rollup → coerce array→sträng (robust mot
    // list-endpointens rollup-form); kritiskt för datum-desc-ordningen.
    datum: firstString(f['Event startdatum']),
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
    // `Ort` är en ROLLUP → levereras som array (ev. tom) av record-endpointen,
    // till skillnad mot list-endpointen som utelämnar tomma fält. Coerce till
    // sträng/null så PersonDetailSchema (string|null) håller. Samma gäller
    // övriga rollup-strängfält nedan (allaHamtningar, senasteDeltagandeDatum).
    ort: firstString(f['Ort']),
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
    senasteDeltagandeDatum: firstString(f['Senaste deltagande datum']),
    antalHamtningar: asNumber(f['Antal hämtningar']),
    allaHamtningar: firstString(f['Alla hämtningar']),
    motivering: f['Motivering (text)'] ?? null,
    inbjudenCommunity: f['Inbjuden till community'] ?? false,
    skapatKontoCommunity: f['Skapat konto i community'] ?? false,
    historik,
  };
}

/**
 * get-person — aggregerande detalj-EF (single-get-mall; 6b get-event ärver).
 *
 * FEL-KONTRAKT: `{ error: <message> }` (klient-fel) — matchar den ETABLERADE
 * konventionen i get-persons/auth.ts/errors.ts (400/401/404 → `{ error }`,
 * 500 → `{ error, requestId }`). Medvetet INTE RFC 9457 problem+json: hela
 * EF-sviten är redan konsistent på `{ error }`, och Google-konsistens väger
 * tyngre än att införa en avvikande standard i en enda EF. Detta är fel-formen
 * 6b ärver. (Migrering av hela sviten till problem+json är en separat
 * tråd-kandidat, ej denna landning.)
 *
 * ATOMICITET: aggregeringen (person-fetch + Deltaganden-batch) är ICKE-atomär —
 * records kan ändras mellan anropen. Det är acceptabelt för en admin-läsvy och
 * byggs MEDVETET utan snapshot-isolering (undviker över-engineering; ingen
 * transaktions-semantik finns i Airtable-REST ändå).
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

    // 2) Event-för-event-historik — batch-hämtad ur Deltaganden på de länkade
    //    record-ID:na. KOMPLETT oavsett antal (kärnkrav: historik trunkeras
    //    ALDRIG tyst — "appen ska minnas bättre än Lotta"): ID-listan chunkas
    //    (HISTORY_BATCH_SIZE) → ETT listanrop per chunk (`fetchFromAirtable`
    //    offset-vandrar dessutom om en chunk någonsin gav >100). Det är
    //    paginering (ett anrop per ≤50 rader), INTE N+1 (ett per record).
    //    Hoppas helt om personen saknar deltaganden (inget onödigt anrop).
    const deltagandeIds: string[] = Array.isArray(personRecord.fields['Deltaganden'])
      ? (personRecord.fields['Deltaganden'] as string[])
      : [];

    const historik: ReturnType<typeof mapHistoryEntry>[] = [];
    if (deltagandeIds.length > 0) {
      for (const ids of chunk(deltagandeIds, historyBatchSize())) {
        const filterByFormula = `OR(${ids.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
        const records = await fetchFromAirtable(DELTAGANDEN_TABLE, {
          filterByFormula,
          fields: HISTORY_FIELDS,
        });
        historik.push(...records.map(mapHistoryEntry));
      }
      // Sortera datum desc över ALLA chunks (per-chunk-sort räcker inte). Saknat
      // datum sist; ISO YYYY-MM-DD sorterar korrekt som sträng.
      historik.sort((a, b) => {
        if (a.datum === b.datum) return 0;
        if (a.datum === null) return 1;
        if (b.datum === null) return -1;
        return a.datum < b.datum ? 1 : -1;
      });
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
