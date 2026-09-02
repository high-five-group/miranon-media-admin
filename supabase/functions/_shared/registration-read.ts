import { fetchFromAirtable } from './airtable-client.ts';
import { scalarString, selectName } from './coerce.ts';

// Delad läs-kärna för Anmälningar (task-18.17: get-registration ÅTERANVÄNDER
// get-registrations-berikningen — kortets låsta shape-väg; aldrig en parallell
// mapper). Extraherad ur get-registrations/index.ts OFÖRÄNDRAD i beteende:
// mapRegistration (rad-shapen), berikaPersonhistorik (person-batchen +
// Deltaganden-batchen) och batch-hjälparna. Tabeller adresseras per NAMN
// (ej tbl-id) så samma kod fungerar mot prod- och staging-bas (ADR-050).

export const REGISTRATIONS_TABLE = 'Anmälningar';
export const PERSONER_TABLE = 'Personer';
export const DELTAGANDEN_TABLE = 'Deltaganden';

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

// Fält att hämta ur Deltaganden för per-person-kurshistorik (task-18.10).
// SAMMA urval som get-person:s HISTORY_FIELDS → PersonHistoryEntry-shapen
// återanvänds oförändrad (ingen parallell kurshistorik-form). Ett urval
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
export function registrationsBatchSize(): number {
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
export async function fetchByRecordIds(
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
export function mapHistoryEntry(record: { id: string; fields: Fields }) {
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

export function mapRegistration(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;

  return {
    id: record.id,
    namn: f['Namn'] ?? null, // formula
    fornamn: f['Förnamn'] ?? null, // text
    efternamn: f['Efternamn'] ?? null, // text
    email: f['E-post'] ?? null, // text
    telefon: f['Mobilnummer'] ?? null, // text
    // TASK-363: `Kurs (from Event)` (lookup via Event-länken, eventets
    // KANONISKA kursnamn) FÖRST — samma källa `get-person`s `mapMotiveringEntry`
    // (TASK-184) och basens egen "Senaste anmälan (sammanfattning)"-formel
    // föredrar. Fallback till `Event (namn)` (formeln `{Vill anmäla sig till}`
    // — anmälans EGNA, self-reported val) för raden som saknar Event-länken helt
    // (backfill/orörda anmälningar utan länk — `Kurs (from Event)` är då tom
    // eftersom det inte finns något att slå upp). En MANUELL create (TASK-363)
    // lämnar `Vill anmäla sig till` osatt, så `Event (namn)` är alltid tom för
    // den raden — före denna ändring blev `eventNamn` därmed `null` så fort en
    // admin skapade anmälan manuellt ("(okänt event)" i aktivitetsloggen); nu
    // löses den via lookupen precis som webbformulär-anmälningar redan gör.
    eventNamn: scalarString(f['Kurs (from Event)']) ?? f['Event (namn)'] ?? null,
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
    deltagarinfoSkickad: f['Deltagarinfo skickad'] ?? null, // dateTime (mail 2 = UI:ts "deltagarinfo", TASK-303)
    // Bor över-markeringen (task-18.7, ADR-063 — ADDITIVT checkbox-fält
    // fldGYYNnQi7XlfbhP, staging-fött 2026-07-22). `=== true` (ej `?? null`):
    // Airtable UTELÄMNAR en omarkerad checkbox ur record-svaret, så en
    // null-mappning hade gjort "urkryssad" till "vet ej". Mot en bas UTAN
    // fältet (prod före prod-deployen) ger den false — läsningen tål det
    // (fälla 37 gäller bara skrivningar).
    borOver: f['Bor över'] === true, // checkbox (additiv)
    // Fylls av person-batchen (berikaPersonhistorik). Sätts ALLTID här så
    // shapen är komplett även utan berikning — nyckeln finns, värdet är null
    // (aldrig undefined).
    antalGenomfordaEvent: null as number | null,
    // Gruppdynamik (task-18.10). Fylls av berikaPersonhistorik:
    // `erfarenhetsbadge` ur person-batchen (samma anrop som
    // antalGenomfordaEvent), `kurshistorik` ur en tredje chunkad
    // Deltaganden-batch. Sätts ALLTID här så shapen är komplett även utan
    // berikning (nyckeln finns, värdet null).
    erfarenhetsbadge: null as string | null,
    kurshistorik: null as ReturnType<typeof mapHistoryEntry>[] | null,
    eventId: Array.isArray(f['Event']) ? f['Event'][0] : null, // linked record → first ID
    personId: Array.isArray(f['Person']) ? f['Person'][0] : null, // linked record → first ID
    // Eventlänkens vakt (task-284.1; ADR-122 beslut 3). Formelfält, alltid
    // exakt ett av 'OK' | 'Avviker' | 'Utan event' — aldrig BLANK() (formeln
    // har ingen väg som returnerar tom sträng), så `?? null` är null-safety,
    // inte en förväntad väg. Samma skalära formulär-mönster som `eventNamn`.
    eventmatchning: f['Eventmatchning'] ?? null,
    // Eventlänkens vakt — resolutionens facit-underlag (task-284.3; ADR-122 §
    // Fynd 1). Anmälans EGNA `Datum`-textkopia (singleLineText) — SAMMA fält
    // `Eventmatchning`-formeln jämför, aldrig facit-lookupen `Datum (from
    // Event)` (den hör till det ev. FELAKTIGA länkade eventet).
    datum: scalarString(f['Datum']),
  };
}

export type Registration = ReturnType<typeof mapRegistration>;

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
 *      samma kontrakt som get-person:s historik). Konsumenter härleder
 *      genomförda+deduperade kurser klientside.
 *
 * Anropas av get-registrations eventId-gren (hela arbetskön) och av
 * get-registration (en rad) — samma berikning, olika kardinalitet.
 *
 * NULL-SEMANTIKEN: anmälan utan Person-länk (manuella/+1 innan A2 kopplat dem)
 * behåller null på alla tre fälten — "vet ej" är sanningen, aldrig 0/"" (0
 * betyder "första eventet" i UI:t, [] betyder "inga deltaganden"). Muterar
 * raderna på plats — de är EF-lokala objekt ur mapRegistration.
 */
export async function berikaPersonhistorik(registrations: Registration[]): Promise<void> {
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
