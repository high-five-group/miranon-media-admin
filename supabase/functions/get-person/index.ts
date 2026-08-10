import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName, stringArray } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas (tbl-id:n är bas-unika; ADR-050). Spegel av get-persons.
const PERSONER_TABLE = 'Personer';
const DELTAGANDEN_TABLE = 'Deltaganden';
const TOUCHPOINTS_TABLE = 'Touchpoints';
const ANMALNINGAR_TABLE = 'Anmälningar';

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

// Fält att hämta ur Touchpoints för hämtningarna (S103 steg 2). Live-schema
// (tbl22SCvlHrgcAiZi, describe_table 2026-08-10): `Erbjudande` (singleSelect,
// satt bara på "Angett e-post för att ta del av ett erbjudande") + `Typ`
// (singleSelect, alla sju touchpoint-typerna) + `Datum` (dateTime, genuint
// skalärt fält — inte en lookup). Medvetet UTELÄMNADE: `Kanal` (i praktiken
// alltid tom i denna genomgång) och de sex formel-/sortkey-fälten (redundanta
// med `erbjudande`+`datum`, som appen härleder själv i stället för att lita på
// basens strängformatering).
const TOUCHPOINT_FIELDS = ['Erbjudande', 'Typ', 'Datum'];

// Fält att hämta ur Anmälningar för motiveringarna (S103 steg 2). Live-schema
// (tbloOcrppVoyrHbrq, describe_table 2026-08-10): den RÅA motiveringstexten
// (`Varför vill du gå den här utbildningen?`, multilineText — INTE
// `Motivering (sammanfattning)`/`fldrMT8cWP3NmBc9T`, som redan bakar in
// event+ort+datum i en enda formaterad sträng och därmed dubblar det `event`/
// `datum` nedan levererar separat), `Kurs (from Event)` (lookup via
// Event-länken, eventets kanoniska kursnamn) + `Vill anmäla sig till`
// (multipleSelects, fallback när Event-länken saknas — backfill-anmälningar)
// för `event`, och `Rad skapad` (createdTime) för `datum` — INTE `Inskickad`
// (data-model.md § "Senaste anmälan datum": ojämnt ifylld, samma val basens
// egen rollup gör).
const ANMALNINGAR_MOTIVERING_FIELDS = [
  'Varför vill du gå den här utbildningen?',
  'Kurs (from Event)',
  'Vill anmäla sig till',
  'Rad skapad',
];

// Max record-ID:n per batch-anrop (Deltaganden/Touchpoints/Anmälningar delar
// samma gräns — samma env-override, samma chunk-mekanik nedan). En person kan
// ha hundratals deltaganden (en/session; ~924 backfillade rader förekommer) —
// en enda `OR(RECORD_ID()=…)`-formel över alla skulle spränga Airtables
// formel-/URL-längd. Vi chunkar ID-listan: varje chunk ger en kort formel
// (≤50 IDs ≈ ~1.5 kB, väl under gränsen) och matchar ≤50 unika records = ETT
// listanrop per chunk (ej per record → ej N+1). Övre gräns: obegränsat antal
// länkade poster (ceil(N/50) anrop), NOLL trunkering. Sort sker i JS efter
// sammanslagning (per-chunk-sort räcker inte över chunk-gränser).
//
// Env-override (`HISTORY_BATCH_SIZE`) finns ENBART för conformance-testbarhet:
// staging sätter den lågt (=2) så att chunk-merge-vägen exerceras med en liten
// fixtur (bevisar noll-trunkering vid chunk-gräns). Prod sätter inte secreten →
// default 50 (oförändrat beteende). Ogiltigt/saknat värde → default. Namnet
// (`historyBatchSize`) är kvar från Deltaganden-batchens ursprung — funktionen
// governar numera tre batcher, inte bara historiken; ett byte skulle kräva en
// ny/omdöpt Supabase-secret för ett rent namnbyte, inget beteende vinns.
function historyBatchSize(): number {
  const raw = Number.parseInt(Deno.env.get('HISTORY_BATCH_SIZE') ?? '', 10);
  return Number.isInteger(raw) && raw > 0 ? raw : 50;
}

// Datum-desc, datumlösa sist — EN sorteringsregel, återanvänd för historik/
// hämtningarna/motiveringarna (tre anropsställen i Deno.serve nedan). ISO 8601
// (datum ELLER datetime) sorterar korrekt som sträng.
function sortDatumDescNullsLast<T extends { datum: string | null }>(entries: T[]): void {
  entries.sort((a, b) => {
    if (a.datum === b.datum) return 0;
    if (a.datum === null) return 1;
    if (b.datum === null) return -1;
    return a.datum < b.datum ? 1 : -1;
  });
}

type Fields = Record<string, unknown>;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function asNumber(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

/** Mappar en Deltaganden-rad → en kurshistorik-post (PersonHistoryEntry-form). */
function mapHistoryEntry(record: { id: string; fields: Fields }) {
  const f = record.fields;
  return {
    id: record.id,
    // Alla historik-fält är 1→1 per Deltagande-rad (lookup/rollup av ETT event,
    // eller egen singleSelect/formel) → explicit SKALÄR coercion (scalarString),
    // aldrig array-droppande. `Event startdatum` (rollup) → kritiskt för
    // datum-desc-ordningen.
    kursnamn: scalarString(f['Kursnamn (lookup)']),
    eventLabel: scalarString(f['Eventlabel (text)']),
    datum: scalarString(f['Event startdatum']),
    session: scalarString(f['Session']),
    status: scalarString(f['Status']),
    narvaro: f['Närvaropoäng'] === 1,
    ort: scalarString(f['Event ort']),
    typ: scalarString(f['Event typ']),
  };
}

/** Mappar en Touchpoints-rad → en hämtnings-post (PersonTouchpointEntry-form). */
function mapTouchpointEntry(record: { id: string; fields: Fields }) {
  const f = record.fields;
  return {
    id: record.id,
    // `Erbjudande` är satt bara på touchpoints av typen "Angett e-post för att
    // ta del av ett erbjudande" — övriga typer ger null (inte en tom sträng;
    // `typ` nedan säger vilken sort det VAR). Genuint skalärt fält
    // (singleSelect, ej lookup/rollup) → selectName.
    erbjudande: selectName(f['Erbjudande']),
    typ: selectName(f['Typ']),
    // Genuint skalärt fält (dateTime, ej lookup/rollup) → scalarString ändå,
    // samma defensiva disciplin som historik-mappningen ovan.
    datum: scalarString(f['Datum']),
  };
}

/** Mappar en Anmälningar-rad → en motiverings-post (PersonMotiveringEntry-form). */
function mapMotiveringEntry(record: { id: string; fields: Fields }) {
  const f = record.fields;
  return {
    id: record.id,
    motivering: scalarString(f['Varför vill du gå den här utbildningen?']),
    // `Kurs (from Event)` (lookup via Event-länken) är eventets KANONISKA
    // kursnamn — samma källa basens egen `Senaste anmälan (sammanfattning)`-
    // formel föredrar (TASK-184). Faller tillbaka på anmälans EGNA `Vill
    // anmäla sig till` när eventlänken saknas (backfill-anmälningar utan
    // Event-länk) — samma idiom som den formeln, ingen egen uppfinning.
    event: scalarString(f['Kurs (from Event)']) ?? scalarString(f['Vill anmäla sig till']),
    // `Rad skapad` (createdTime), INTE `Inskickad` — se ANMALNINGAR_MOTIVERING_FIELDS-kommentaren.
    datum: scalarString(f['Rad skapad']),
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
  hamtningar: ReturnType<typeof mapTouchpointEntry>[],
  motiveringar: ReturnType<typeof mapMotiveringEntry>[],
) {
  const f = record.fields;
  return {
    id: record.id,
    namn: f['Namn'] ?? null,
    fornamn: f['Förnamn'] ?? null,
    efternamn: f['Efternamn'] ?? null,
    email: f['E-post'] ?? null,
    telefon: f['Telefon'] ?? null,
    // `Ort` är en ROLLUP över personens Anmälningar (1→MÅNGA) → genuint
    // FLER-VÄRT. stringArray bevarar ALLA orter (en person kan vara anmäld i
    // flera orter); tyst reduktion till en vore data-förlust (Lottas kärnkrav).
    ort: stringArray(f['Ort']),
    manuellFlagga: selectName(f['Manuella flagga']),
    aiFlagga: selectName(f['AI-flagga']),
    anteckningar: f['Anteckningar'] ?? null,
    antalAnmalningar: asNumber(f['Antal anmälningar (totalt)']),
    antalDeltaganden: asNumber(f['Totala deltaganden']),
    erfarenhetsniva: f['Erfarenhetsnivå (Miranon Media)'] ?? null,
    erfarenhetsbadge: f['Erfarenhetsbadge'] ?? null,
    // 'Senaste interaktion (text)' VÄLJER mellan 'Senast touchpoint (text)'/
    // 'Senast deltagande (text)' — BÅDA delar Motiverings formelmönster
    // (IF/FIND/LEFT; ELSE-grenen returnerar sin källrollup ORÖRD) och ärver
    // därför samma array-risk TRANSITIVT om källrollupen någonsin blir
    // fler-värd. EJ ett bekräftat fel (data-model.md §46: "strukturell
    // misstanke, ej belagd") — defensiv scalarString per samma genomgång som
    // stängde `motivering` (TASK-52): noll kostnad för dagens enkelvärdes-fall
    // (fältet BÄR redan skarpa strängvärden i drift), loggar i stället för att
    // krascha sidan om fältet någonsin blir fler-värt.
    senasteInteraktion: scalarString(f['Senaste interaktion (text)']),
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
    // Samma formelmönster som Motivering/senasteInteraktion (IF/FIND/LEFT,
    // ELSE-gren returnerar källrollupen ORÖRD) — i praktiken ALLTID null i
    // drift (`PersonDetailPrototyp.tsx` § variant A, `fixture-data.ts` §
    // RIK_DETALJ not 2), men defensiv scalarString ändå: samma genomgång som
    // stängde TASK-52, noll observerbar skillnad idag.
    nastaEvent: scalarString(f['Nästa event (text)']),
    antalGenomfordaEvent: asNumber(f['Antal genomförda event']),
    // "Senaste deltagande datum" = MAX-rollup → ett värde → explicit skalär.
    senasteDeltagandeDatum: scalarString(f['Senaste deltagande datum']),
    antalHamtningar: asNumber(f['Antal hämtningar']),
    // "Alla hämtningar" = rollup över Touchpoints (1→MÅNGA) → FLER-VÄRT; namnet
    // säger "alla" → stringArray bevarar samtliga (firstString vore data-förlust).
    allaHamtningar: stringArray(f['Alla hämtningar']),
    // `Motivering (text)` (fld4ENxbma679wvcC) är en FORMEL vars ELSE-gren
    // returnerar rollupen `Motivering (från anmälningsformulär)` ORÖRD —
    // rollup över personens Anmälningar (1→MÅNGA), trots att fältet deklarerar
    // `singleLineText`. API:et levererar därför en ARRAY så fort minst en
    // anmälan bär en motivering (live-verifierat, data-model.md §Kända fällor
    // #46; TASK-52/68/89). stringArray bevarar ALLA motiveringar — flera
    // anmälningar kan var och en bära en; tyst första-element vore data-
    // förlust (Lottas kärnkrav) — samma mönster som `ort`/`allaHamtningar`
    // ovan. TASK-52 stänger den app-sidiga konsekvensen; bas-sidans egen
    // typdeklaration (singleLineText vs faktisk array) kvarstår som öppen
    // T16-maximeringskandidat, ej rörd här.
    motivering: stringArray(f['Motivering (text)']),
    inbjudenCommunity: f['Inbjuden till community'] ?? false,
    skapatKontoCommunity: f['Skapat konto i community'] ?? false,
    historik,
    // S103 steg 2: hämtningarna/motiveringarna som RIKTIGA poster, batch-
    // hämtade av callern (samma mönster som `historik`) — bredvid, aldrig i
    // stället för, `allaHamtningar`/`motivering` ovan.
    hamtningar,
    motiveringar,
    // Lottas fritext-flagga (`Personer.Flagga`, singleLineText, S103) — läst
    // per NAMN (ADR-050). Ersätter `Manuella flagga` (`manuellFlagga` ovan,
    // som förblir orörd — dess avveckling är ett separat beslut).
    flagga: scalarString(f['Flagga']),
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
      sortDatumDescNullsLast(historik);
    }

    // 3) Hämtningarna — batch-hämtad ur Touchpoints på de länkade record-ID:na
    //    (`Personer.Touchpoints`). Samma chunkning/noll-trunkering/tomt-hopp
    //    som historiken ovan (S103 steg 2) — ersätter INTE `allaHamtningar`
    //    (rollup-formen), som mapPersonDetail fortsätter läsa orört.
    const touchpointIds: string[] = Array.isArray(personRecord.fields['Touchpoints'])
      ? (personRecord.fields['Touchpoints'] as string[])
      : [];

    const hamtningar: ReturnType<typeof mapTouchpointEntry>[] = [];
    if (touchpointIds.length > 0) {
      for (const ids of chunk(touchpointIds, historyBatchSize())) {
        const filterByFormula = `OR(${ids.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
        const records = await fetchFromAirtable(TOUCHPOINTS_TABLE, {
          filterByFormula,
          fields: TOUCHPOINT_FIELDS,
        });
        hamtningar.push(...records.map(mapTouchpointEntry));
      }
      sortDatumDescNullsLast(hamtningar);
    }

    // 4) Motiveringarna — batch-hämtad ur Anmälningar på de länkade
    //    record-ID:na (`Personer.Anmälningar (länkat fält)`). Samma
    //    chunkning/noll-trunkering/tomt-hopp som historiken ovan (S103 steg
    //    2) — ersätter INTE `motivering` (rollup-formen), som mapPersonDetail
    //    fortsätter läsa orört.
    const anmalningIdsForMotivering: string[] = Array.isArray(
      personRecord.fields['Anmälningar (länkat fält)'],
    )
      ? (personRecord.fields['Anmälningar (länkat fält)'] as string[])
      : [];

    const motiveringar: ReturnType<typeof mapMotiveringEntry>[] = [];
    if (anmalningIdsForMotivering.length > 0) {
      for (const ids of chunk(anmalningIdsForMotivering, historyBatchSize())) {
        const filterByFormula = `OR(${ids.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
        const records = await fetchFromAirtable(ANMALNINGAR_TABLE, {
          filterByFormula,
          fields: ANMALNINGAR_MOTIVERING_FIELDS,
        });
        motiveringar.push(...records.map(mapMotiveringEntry));
      }
      sortDatumDescNullsLast(motiveringar);
    }

    const person = mapPersonDetail(personRecord, historik, hamtningar, motiveringar);

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
