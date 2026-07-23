import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { buildEqualsFilter, combineWithAnd } from '../_shared/airtable-filter.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
const TABLE_NAME = 'Anmälningar';
const EVENTPLANERING_TABLE = 'Eventplanering';
const PERSONER_TABLE = 'Personer';
const DELTAGANDEN_TABLE = 'Deltaganden';

// Personer-fälten arbetskön + gruppdynamiken behöver. Alla tre bor på PERSONER
// (inte på Anmälningar) → hämtas i SAMMA person-batch (en projektion).
//   `Antal genomförda event` (flddy8JND3YnlgZxe, formel) = RIM 1 × + RIM 2 × +
//     RIM 3 × + Fjärrskådning × — arbetsköns räknare (task-18.4).
//   `Erfarenhetsbadge` (fld04qqDQLgbJbBef, formel) = gruppdynamikens kanoniska
//     erfarenhetsklass (task-18.10). RÅ ur basen: badgen är RIM 3-BLIND
//     (data-model §Kända buggar) — den kända luckan (T16) visas som den är.
//   `Deltaganden` (fld5shm9UER5CMyTl, länk) = personens deltagande-record-ID:n,
//     ingången till kurshistorik-batchen (task-18.10).
const PERSON_EVENTS_FIELD = 'Antal genomförda event';
const PERSON_BADGE_FIELD = 'Erfarenhetsbadge';
const PERSON_DELTAGANDEN_FIELD = 'Deltaganden';

// Fält att hämta ur Deltaganden för gruppdynamikens per-person-kurshistorik
// (task-18.10). SAMMA urval som get-person:s HISTORY_FIELDS → PersonHistoryEntry-
// shapen återanvänds oförändrad (ingen parallell kurshistorik-form). Ett urval
// håller batch-svaret litet; alla verifierade i live-schemat (tbldWHH6sSHWoQPHH).
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

// Max record-ID:n per batch-anrop (Anmälningar-ID:n). En chunk = en kort
// `OR(RECORD_ID()=…)`-formel (≤50 IDs ≈ ~1.5 kB, väl under Airtables formel-/URL-
// längd) → ETT listanrop per chunk (ej N+1). ceil(N/50) anrop, NOLL trunkering.
// Spegel av get-attendance:s attendanceBatchSize.
//
// Env-override (`REGISTRATIONS_BATCH_SIZE`) finns ENBART för conformance-testbarhet:
// staging sätter den lågt (=2) så chunk-merge-vägen exerceras med en liten fixtur
// (bevisar noll-trunkering vid chunk-gräns). Prod sätter inte secreten → default 50.
function registrationsBatchSize(): number {
  const raw = Number.parseInt(Deno.env.get('REGISTRATIONS_BATCH_SIZE') ?? '', 10);
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

/** Batch-hämta record-ID:n ur en tabell via chunkad `OR(RECORD_ID()=…)` (get-attendance-mall). */
async function fetchByRecordIds(
  table: string,
  ids: readonly string[],
  fields: readonly string[] | undefined,
): Promise<{ id: string; fields: Fields }[]> {
  const out: { id: string; fields: Fields }[] = [];
  for (const idChunk of chunk(ids, registrationsBatchSize())) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = await fetchFromAirtable(
      table,
      fields ? { filterByFormula, fields: [...fields] } : { filterByFormula },
    );
    out.push(...records);
  }
  return out;
}

/**
 * Mappar en Deltaganden-rad → en kurshistorik-post (PersonHistoryEntry-form).
 * TECKENEXAKT spegel av get-person:s `mapHistoryEntry` — samma value-object, så
 * gruppdynamikens `kurshistorik` och persondetaljens `historik` delar kontrakt.
 * Alla fält är 1→1 per Deltagande (lookup/rollup av ETT event, eller egen
 * singleSelect/formel) → explicit SKALÄR coercion (scalarString), aldrig
 * array-droppande. `narvaro` speglar Närvaropoäng (1 = närvaro).
 */
function mapHistoryEntry(record: { id: string; fields: Fields }) {
  const f = record.fields;
  return {
    id: record.id,
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

function mapRegistration(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;

  return {
    id: record.id,
    namn: f['Namn'] ?? null, // formula
    fornamn: f['Förnamn'] ?? null, // text
    efternamn: f['Efternamn'] ?? null, // text
    email: f['E-post'] ?? null, // text
    telefon: f['Mobilnummer'] ?? null, // text
    eventNamn: f['Event (namn)'] ?? null, // formula
    ort: scalarString(f['Ort']), // text (eget fält, skalärt)
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
    // Betalnings-vertikalens fyra ADDITIVA fält (task-18.8, ADR-063 —
    // per-betalnings-notering + senaste påminnelse per betalning; vägvalet
    // additiva fält är öppet bokfört i kortet). Fälten är staging-födda
    // 2026-07-22; mot en bas där de ännu saknas (prod före prod-deployen)
    // ger ?? null — shapen är alltid komplett, aldrig undefined.
    noteringAnmalningsavgift: f['Notering anmälningsavgift'] ?? null, // text (additiv)
    noteringSlutbetalning: f['Notering slutbetalning'] ?? null, // text (additiv)
    paminnelseAnmalningsavgiftSkickad: f['Påminnelse anmälningsavgift skickad'] ?? null, // dateTime (additiv)
    paminnelseSlutbetalningSkickad: f['Påminnelse slutbetalning skickad'] ?? null, // dateTime (additiv)
    // Arbetsköns deltagar-shape (task-18.4; PRD task-18 beslut 10). Fälten är
    // BEFINTLIGA i basen (live-verifierade mot staging-schemat 2026-07-22, L294
    // — inga nya bas-fält). `Källa` TOM (formuläranmälningar lämnar fältet
    // orört) ⇒ selectName ger null ⇒ klienten läser "via formulär".
    kalla: selectName(f['Källa']), // singleSelect: Manuell | +1 | Väntelista | TOM
    medfoljandeTill: Array.isArray(f['Medföljande till']) ? f['Medföljande till'][0] : null, // self-link → first ID
    bekraftelseSkickad: f['Bekräftelse skickad'] ?? null, // dateTime (mail 1)
    deltagarinfoSkickad: f['Deltagarinfo skickad'] ?? null, // dateTime (mail 2 = UI:ts "eventinfo")
    // Bor över-markeringen (task-18.7, ADR-063 — ADDITIVT checkbox-fält
    // fldGYYNnQi7XlfbhP, staging-fött 2026-07-22). `=== true` (ej `?? null`):
    // Airtable UTELÄMNAR en omarkerad checkbox ur record-svaret, så en
    // null-mappning hade gjort "urkryssad" till "vet ej". Mot en bas UTAN
    // fältet (prod före prod-deployen) ger den false — läsningen tål det
    // (fälla 37 gäller bara skrivningar).
    borOver: f['Bor över'] === true, // checkbox (additiv)
    // Fylls av person-batchen i eventId-grenen (se berikaPersonhistorik). Sätts
    // ALLTID här så shapen är komplett även i den event-lösa grenen — nyckeln
    // finns, värdet är null (aldrig undefined).
    antalGenomfordaEvent: null as number | null,
    // Gruppdynamik (task-18.10). Fylls i eventId-grenen: `erfarenhetsbadge` ur
    // person-batchen (samma anrop som antalGenomfordaEvent), `kurshistorik` ur
    // en tredje chunkad Deltaganden-batch. Sätts ALLTID här så shapen är
    // komplett även i den event-lösa grenen (nyckeln finns, värdet null).
    erfarenhetsbadge: null as string | null,
    kurshistorik: null as ReturnType<typeof mapHistoryEntry>[] | null,
    eventId: Array.isArray(f['Event']) ? f['Event'][0] : null, // linked record → first ID
    personId: Array.isArray(f['Person']) ? f['Person'][0] : null, // linked record → first ID
  };
}

type Registration = ReturnType<typeof mapRegistration>;

/**
 * Berikar anmälningarna med PERSONENS gruppdynamik-data (task-18.4 + task-18.10):
 * `antalGenomfordaEvent`, `erfarenhetsbadge` och `kurshistorik`.
 *
 * TVÅ chunkade `OR(RECORD_ID()=…)`-batchar (get-person-/get-attendance-mallen —
 * ALDRIG ett anrop per person/deltagande, alltid ceil(N/50) listanrop):
 *   1) PERSONER-batch (en projektion; Personer är ~90 fält): hämtar
 *      `Antal genomförda event` + `Erfarenhetsbadge` (formelfält som bor på
 *      Personer, inte Anmälningar) + `Deltaganden`-länken (ingången till batch 2).
 *   2) DELTAGANDEN-batch: personernas samlade deltagande-record-ID:n hämtas i
 *      EN chunkad batch → mappas till PersonHistoryEntry (RÅA per-session-rader,
 *      samma kontrakt som get-person:s historik). Gruppdynamik-vyn härleder
 *      genomförda+deduperade kurser klientside.
 *
 * ASYMMETRI (medveten, bokförd i header-docen): körs ENDAST i eventId-grenen.
 * Den event-lösa grenen hämtar hela basens anmälningar — en person/deltagande-
 * batch där vore O(hela basen) läsanrop per request utan konsument.
 *
 * NULL-SEMANTIKEN: anmälan utan Person-länk (manuella/+1 innan A2 kopplat dem)
 * behåller null på alla tre fälten — "vet ej" är sanningen, aldrig 0/"" (0
 * betyder "första eventet" i UI:t, [] betyder "inga deltaganden"). Muterar
 * raderna på plats — de är EF-lokala objekt ur mapRegistration.
 */
async function berikaPersonhistorik(registrations: Registration[]): Promise<void> {
  const personIds = [
    ...new Set(registrations.map((r) => r.personId).filter((id): id is string => id != null)),
  ];
  if (personIds.length === 0) return;

  // 1) PERSONER-batch — räknare + badge + deltagande-länkar i EN projektion.
  const personer = await fetchByRecordIds(PERSONER_TABLE, personIds, [
    PERSON_EVENTS_FIELD,
    PERSON_BADGE_FIELD,
    PERSON_DELTAGANDEN_FIELD,
  ]);
  const antalPerPerson = new Map<string, number | null>();
  const badgePerPerson = new Map<string, string | null>();
  const deltagandeIdsPerPerson = new Map<string, string[]>();
  for (const p of personer) {
    const raw = p.fields[PERSON_EVENTS_FIELD];
    // Formelfält kan beräknas till NaN/Infinity och levereras då som OBJEKT
    // ({ specialValue }) — endast ändliga tal passerar (coerce-familjens regel).
    antalPerPerson.set(p.id, typeof raw === 'number' && Number.isFinite(raw) ? raw : null);
    // Erfarenhetsbadge är en formel-STRÄNG (SWITCH); tom/objekt → null.
    const badge = p.fields[PERSON_BADGE_FIELD];
    badgePerPerson.set(p.id, typeof badge === 'string' && badge !== '' ? badge : null);
    deltagandeIdsPerPerson.set(
      p.id,
      Array.isArray(p.fields[PERSON_DELTAGANDEN_FIELD])
        ? (p.fields[PERSON_DELTAGANDEN_FIELD] as string[])
        : [],
    );
  }

  // 2) DELTAGANDEN-batch — alla personers deltaganden i EN chunkad läsning.
  //    En Map<deltagandeId, entry> så varje persons historik kan återskapas i
  //    länkens ordning (Personer.Deltaganden). Personen behöver inte bära
  //    reverse-länken `Person (länk)` på raden — vi vet redan vilka ID:n hör vart.
  const allaDeltagandeIds = [...new Set([...deltagandeIdsPerPerson.values()].flat())];
  const entryPerId = new Map<string, ReturnType<typeof mapHistoryEntry>>();
  if (allaDeltagandeIds.length > 0) {
    for (const d of await fetchByRecordIds(DELTAGANDEN_TABLE, allaDeltagandeIds, HISTORY_FIELDS)) {
      entryPerId.set(d.id, mapHistoryEntry(d));
    }
  }

  for (const r of registrations) {
    if (r.personId != null) {
      r.antalGenomfordaEvent = antalPerPerson.get(r.personId) ?? null;
      r.erfarenhetsbadge = badgePerPerson.get(r.personId) ?? null;
      // Personen fanns i batchen ⇒ kurshistorik är en (ev. tom) array; annars null.
      const ids = deltagandeIdsPerPerson.get(r.personId);
      r.kurshistorik = ids
        ? ids.flatMap((id) => {
            const e = entryPerId.get(id);
            return e ? [e] : [];
          })
        : null;
    }
  }
}

/** Inskickad desc, nulls sist (dateTime ISO → Date.parse; båda null → 0; en null → sist). */
function byInskickadDesc(a: Registration, b: Registration): number {
  const ta = a.inskickad ? Date.parse(a.inskickad as string) : null;
  const tb = b.inskickad ? Date.parse(b.inskickad as string) : null;
  if (ta === null && tb === null) return 0;
  if (ta === null) return 1; // a (null) sist
  if (tb === null) return -1; // b (null) sist
  return tb - ta; // desc
}

/**
 * get-registrations — anmälningar (Anmälningar) per event/status/flagga (Fas 6c).
 *
 * EVENTID-GRENEN: RECORD-ID-BATCH FRÅN EVENT-HÅLLET (speglar get-attendance/get-person):
 * hämtar eventraden, läser dess `Anmälningar (länkat fält)`-länk (read-only spegel av
 * `Anmälningar.Event`, fldUAjTutSM0fziMT → Anmälningar-record-ID:n) och batch-hämtar dem
 * via chunkad `OR(RECORD_ID()=…)`. ANVÄNDER MEDVETET INTE `buildLinkedRecordFilter` — den
 * matchar länkens primär-display (eventlabel), inte record-ID (T15-klass-bugg). Record-ID =
 * enda tillförlitliga nyckeln. Status/flagga filtreras klientside (JS, mot selectName-utdata,
 * ekvivalent med `{Status}='x'`), Inskickad-desc-sortering klientside (nulls sist). LÄSER bara.
 * 404 = okänt eventId (ärver get-event/get-attendance-kontraktet); event utan
 * `Anmälningar (länkat fält)` → tom lista (ej fel).
 *
 * EVENT-LÖSA GRENEN (eventId saknas): OFÖRÄNDRAD — serverside filterByFormula via
 * buildEqualsFilter (status/flagga) + fetchFromAirtable med Inskickad-desc-sort. 404:ar INTE.
 *
 * DELTAGAR-SHAPEN (task-18.4 + task-18.10): utöver Anmälningar-fälten bär
 * eventId-grenen PERSONENS gruppdynamik-data via TVÅ chunkade record-ID-batchar
 * i berikaPersonhistorik — en mot Personer (`Antal genomförda event` +
 * `Erfarenhetsbadge` + `Deltaganden`-länken) och en mot Deltaganden (personernas
 * kurshistorik, PersonHistoryEntry-shapen återanvänd ur get-person). ASYMMETRIN
 * ÄR MEDVETEN OCH BOKFÖRD: den event-lösa grenen hämtar HELA basens anmälningar
 * (Hem-vyn/anmälningslistan) — batcharna där vore O(hela basen) läsanrop per
 * request utan konsument. Där lämnas `antalGenomfordaEvent`/`erfarenhetsbadge`/
 * `kurshistorik` null; nycklarna finns alltid i shapen.
 *
 * ATOMICITET: event-fetch + Anmälningar-batch är ICKE-atomär — acceptabelt för en admin-
 * läsvy, medvetet utan snapshot-isolering (samma disciplin som get-attendance/get-person).
 */
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

  // EVENTID-GRENEN — väg D (record-ID-batch från event-hållet, T15-fix).
  if (eventId) {
    try {
      // 1) Eventraden — ETT single-get. null = 404 (ärver get-event/get-attendance-kontraktet).
      const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
      if (!eventRecord) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2) Eventets Anmälningar-record-ID:n ur `Anmälningar (länkat fält)`-länken (read-only
      //    spegel av Anmälningar.Event). Tom/saknad → tom lista (event utan anmälningar är
      //    ett giltigt tillstånd; conformance-grind G1 bevakar att spegeln populeras skarpt).
      const anmIds: string[] = Array.isArray(eventRecord.fields['Anmälningar (länkat fält)'])
        ? (eventRecord.fields['Anmälningar (länkat fält)'] as string[])
        : [];

      // 3) Batch-hämta anmälningarna (fields=undefined → ALLA fält; mapRegistration läser
      //    ~19 fält, en projektion vore brittle).
      let registrations =
        anmIds.length > 0
          ? (await fetchByRecordIds(TABLE_NAME, anmIds, undefined)).map(mapRegistration)
          : [];

      // 4) JS-filter (status/flagga = selectName-utdata, ekvivalent med {Status}='x').
      if (status) registrations = registrations.filter((r) => r.status === status);
      if (flagga) registrations = registrations.filter((r) => r.flagga === flagga);

      // 5) JS-sort: Inskickad desc, nulls sist.
      registrations.sort(byInskickadDesc);

      // 6) Person-batch (task-18.4): arbetsköns `Antal genomförda event`. Sker
      //    EFTER filtreringen så bara de faktiskt returnerade personerna hämtas,
      //    och ENDAST i denna gren: den event-lösa grenen returnerar hela basens
      //    anmälningar, där en person-batch vore O(hela basen) per anrop.
      await berikaPersonhistorik(registrations);

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
  }

  // EVENT-LÖSA GRENEN — OFÖRÄNDRAD (serverside filter + sort, 404:ar inte).
  // Bygg filterByFormula via parameteriserade builders (M5).
  // Builders kastar vid kontrolltecken / ogiltigt recordId-format /
  // för långa strängar / Unicode-bidi-overrides → 400 (klient-fel,
  // inte server-fel). Servern loggar full detail för audit; klient
  // ser generic "Invalid filter input".
  let filterByFormula: string | undefined;
  try {
    const filters: string[] = [];
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
    const records = await fetchFromAirtable(TABLE_NAME, {
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
