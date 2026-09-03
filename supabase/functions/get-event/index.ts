import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { BELAGGNING_ANMALAN_FALT, raknaAnmalningar } from '../_shared/belaggning.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { mapEventBas, mapEventKategorifalt } from '../_shared/event-map.ts';
import { hamtaStandardpriser, standardprisFor } from '../_shared/eventpris.ts';

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
// Spegel av get-events (samma tabell, samma bas-mappning, EN rad).
const TABLE_NAME = 'Eventplanering';
const REGISTRATIONS_TABLE = 'Anmälningar';
const WAITLIST_TABLE = 'Väntelista';

/** Loggprefix för uppslagets varning (`_shared/eventpris.ts` § ETT UPPSLAG SOM FALLERAR). */
const LOGG = '[get-event]';

// Max record-ID:n per batch-anrop — en chunk = en kort `OR(RECORD_ID()=…)`-formel
// (≤50 IDs ≈ ~1.5 kB, väl under Airtables formel-/URL-längd) → ETT listanrop per
// chunk (ej N+1), ceil(N/50) anrop, NOLL trunkering. Samma mall som
// get-registrations/get-attendance (medveten duplicering — EF:er delar kod
// endast via _shared; extraktion hör till en egen refaktor-landning).
const BATCH_SIZE = 50;

type Fields = Record<string, unknown>;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Batch-hämta record-ID:n ur en tabell via chunkad `OR(RECORD_ID()=…)` (get-registrations-mall). */
async function fetchByRecordIds(
  table: string,
  ids: readonly string[],
  fields: readonly string[],
): Promise<{ id: string; fields: Fields }[]> {
  const out: { id: string; fields: Fields }[] = [];
  for (const idChunk of chunk(ids, BATCH_SIZE)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = await fetchFromAirtable(table, { filterByFormula, fields: [...fields] });
    out.push(...records);
  }
  return out;
}

/** Länk-fältets record-ID-array ur eventraden (frånvarande/ickearray → tom). */
function linkedIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Beläggningens innehållsmodell (task-18.2; S73-facit K16, PRD task-18 beslut 5)
 * — mappar basen 1-till-1:
 *   viaFormular       = AKTIVA länkade Anmälningar med Källa TOM
 *                       (formuläranmälningar; frånvaro är sanning —
 *                       data-model §Källa-värden)
 *   medfoljande       = AKTIVA länkade Anmälningar med Källa '+1' (CompanionModal)
 *   ovrigaAnmalningar = AKTIVA länkade Anmälningar med ALLT ANNAT Källa-värde:
 *                       'Manuell' (appens Ny anmälan), 'Väntelista' (uppflyttad
 *                       ur kön) och varje FRAMTIDA värde (TASK-373)
 *   vantelista        = AKTIVA event-kopplade Väntelisteplatser via nya länkfältet
 *                       'Event (länk)' (additivt staging-först, ADR-063), räknade
 *                       från eventradens inverse-spegel 'Väntelista (länkat fält)'
 *                       med get-waitlist:s aktiv-semantik (NOT Flyttad till anmälan)
 *
 * DE TRE FÖRSTA ÄR EN PARTITION av eventets aktiva anmälningar — ingen aktiv
 * anmälan får tappas (TASK-373: `Källa = 'Manuell'` räknades tidigare i INGEN
 * del, och prod-mätaren undervärderade med en plats per sådan anmälan). Delarna
 * och aktiv-filtret bor i `_shared/belaggning.ts` (hermetiskt testade,
 * `tests/api/belaggning.test.ts`); den här funktionen gör I/O:t.
 *
 * K16:s "Manuellt tillagda" förblir basens SKRIVBARA NUMBER-fält 'Manuella
 * platser' (via `mapEventKategorifalt`) och är alltså INTE en Källa-räkning —
 * en anmälan med Källa 'Manuell' är en anmäld DELTAGARE med egen rad och eget
 * deltagarkort, ett Manuella platser-snäpp är en PLATS utan rad. Att lägga
 * Källa-räkningen i det skrivbara fältets rad hade brutit Ändra-morfens
 * "ändrar från"-tal på eventsidan (se `Belaggning.tsx` § segmentbeslutet).
 *
 * RECORD-ID-BATCH från event-hållet (get-registrations-mallen); ALDRIG
 * länk-filter i formel (T15-klassen — matchar primär-display, ej ID).
 * Saknar basen länkfälten (t.ex. prod före den separat auktoriserade
 * fält-deployen) → tomma arrays → 0-räkningar, aldrig fel.
 *
 * borOverAntal (task-17.5): HÄRLEDD räkning av ikryssade 'Bor över' bland
 * eventets länkade Anmälningar — listkortets/eventsidans säng-rad. Läses ur
 * SAMMA registrerings-batch som per-källa-uppdelningen (fältet adderat till
 * fields-listan) → ingen extra rundtur. Checkbox: Airtable UTELÄMNAR en
 * okryssad ruta ur svaret → `=== true` normaliserar (aldrig null; samma
 * mappning som get-registrations, task-18.7). Inget lagrat räknefält (ADR-063).
 * MEDVETET UTANFÖR TASK-373:s snitt: säng-räkningen tar fortfarande MED
 * avbokade/inställda anmälningar. Samma härledning görs på list-nivå i
 * get-events (`fetchBorOverAntalByEvent`), så en ändring hör hemma i en egen
 * landning som rör båda EF:erna och deras e2e-facit — registrerad, ej tyst
 * förkastad (ADR-053).
 */
async function fetchBelaggning(f: Fields): Promise<{
  viaFormular: number;
  medfoljande: number;
  ovrigaAnmalningar: number;
  vantelista: number;
  borOverAntal: number;
}> {
  const regIds = linkedIds(f['Anmälningar (länkat fält)']);
  const waitIds = linkedIds(f['Väntelista (länkat fält)']);

  const [regs, waits] = await Promise.all([
    regIds.length > 0
      ? fetchByRecordIds(REGISTRATIONS_TABLE, regIds, [...BELAGGNING_ANMALAN_FALT, 'Bor över'])
      : Promise.resolve([]),
    waitIds.length > 0
      ? fetchByRecordIds(WAITLIST_TABLE, waitIds, ['Flyttad till anmälan'])
      : Promise.resolve([]),
  ]);

  const { viaFormular, medfoljande, ovrigaAnmalningar } = raknaAnmalningar(regs);

  let borOverAntal = 0;
  for (const reg of regs) {
    // Bor över är checkbox-fältet på anmälan (task-18.7): true = bor över.
    if (reg.fields['Bor över'] === true) borOverAntal += 1;
  }
  // Checkbox: true = flyttad (historik, utanför kön); blank/false = aktiv.
  const vantelista = waits.filter((w) => w.fields['Flyttad till anmälan'] !== true).length;

  return { viaFormular, medfoljande, ovrigaAnmalningar, vantelista, borOverAntal };
}

// Fältnamn från Airtable → ren API-respons. Bas-shapen (21 fält) och beläggningens
// två skrivbara kategorifält + auto-utskickets två fält kommer ur
// `_shared/event-map.ts` — SSOT sedan TASK-23, delad med get-events/update-event.
// Därtill bär get-event ENSAM beläggningens AGGREGERADE räkningar (task-18.2), som
// kräver egna batch-läsningar och därför stannar här. Spread i samma ordning som
// inline-kopian hade: bas → kategorifält → aggregeringar, så svarets nyckelordning är
// oförändrad.
function mapEvent(
  record: { id: string; fields: Record<string, unknown> },
  belaggning: {
    viaFormular: number;
    medfoljande: number;
    ovrigaAnmalningar: number;
    vantelista: number;
    borOverAntal: number;
  },
  standardPris: number | null,
) {
  return {
    // `standardPris` = Eventinnehåll-standarden (prisets nivå 3, TASK-368.7),
    // uppslagen av `hamtaStandardpriser` och noll anrop när eventet redan har
    // ett eget pris. Samma tal som serverns `lasEvent` ger ombokningens
    // prisskillnad — se `_shared/event-map.ts` § EVENTETS PRIS.
    ...mapEventBas(record, standardPris),
    ...mapEventKategorifalt(record),
    viaFormular: belaggning.viaFormular, // AKTIVA länkade Anmälningar, Källa TOM
    medfoljande: belaggning.medfoljande, // AKTIVA länkade Anmälningar, Källa '+1'
    // TASK-373: AKTIVA länkade Anmälningar med varje ANNAT Källa-värde
    // ('Manuell' · 'Väntelista' · framtida). ADDITIVT-optional i klientschemat
    // så en app mot en ÄLDRE deployad get-event får `undefined → 0` (samma
    // beteende som före fixen) i stället för ett parse-fel.
    ovrigaAnmalningar: belaggning.ovrigaAnmalningar,
    vantelista: belaggning.vantelista, // aktiva event-kopplade Väntelisteplatser
    // Bor över-summeringen (task-17.5): härlett antal ikryssade 'Bor över'
    // bland eventets Anmälningar (eventsidans säng-rad) — get-events härleder
    // samma tal ur sin list-nivå-batch.
    borOverAntal: belaggning.borOverAntal,
  };
}

/**
 * get-event — enskilt event via ID (single-get-mall; ärver get-person:s 404-
 * kontrakt). LÄSER bara — ingen write/mutation. Speglar get-events-mappningen
 * för EN rad; sedan task-18.2 AGGREGERAR den därtill beläggningens
 * innehållsmodell (per-källa-räkningar + väntelista — get-person-klassens
 * batch-mönster; Fas 6b L2:s "ingen aggregering" ersatt öppet av K16-behovet).
 *
 * ATOMICITET: event-fetch + batcharna är ICKE-atomär — acceptabelt för en
 * admin-läsvy, medvetet utan snapshot-isolering (samma disciplin som
 * get-registrations/get-attendance/get-person).
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

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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
    // Single-get-anropet (alla formler/rollups + länk-ID-arrays följer med). null = 404.
    const record = await fetchAirtableRecord(TABLE_NAME, id);
    if (!record) {
      // 404-KONTRAKT (single-get-mallen, ärvd från get-person): icke-existerande
      // ID → 404, aldrig 500/tomt 200.
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Beläggnings-aggregationen (task-18.2): batch-hämtningarna körs efter
    // eventraden (ID-listorna kommer ur den).
    const [belaggning, standardpriser] = await Promise.all([
      fetchBelaggning(record.fields),
      hamtaStandardpriser([record], LOGG),
    ]);
    const event = mapEvent(record, belaggning, standardprisFor(standardpriser, record));

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
