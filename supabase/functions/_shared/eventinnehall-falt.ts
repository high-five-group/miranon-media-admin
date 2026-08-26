// _shared/eventinnehall-falt.ts — TASK-309.3, ADR-125 § 2. Fält-namn-SSOT
// för bilagornas SKRIVVÄGAR (save-event-text/save-place-standard/
// save-event-content): en enda karta domän-nyckel → Airtable-BAS-fältnamn,
// delad av de tre EF:erna så namnen aldrig kan glida isär mellan dem.
//
// De 17 nycklarna är EXAKT samma som `DocumentSourcesKopior`
// (`src/domain/models/DocumentSources.ts`) — samma "sjutton redigerbara
// textblocken" ADR-125 § 2 räknar, samma nycklar läsvägen
// (`get-document-sources/index.ts`) redan använder i sitt svar. Ny kod
// SKA importera nycklarna härifrån, aldrig skriva en fjärde parallell lista.
//
// BILAGETEXT_SUFFIX duplicerar den lokala konstanten i
// `get-document-sources/index.ts` — den filen ligger utanför denna skivas scope
// (TASK-309.2, redan landad i #1870) och rörs inte här.
//
// NB: raden hänvisade tidigare till update-event/index.ts som precedent för att
// hålla MANAD_AR_MONTHS i synk mellan EF:er. Den precedenten finns inte längre —
// TASK-23 flyttade MANAD_AR_MONTHS och `deriveManadAr` till `_shared/event-map.ts`
// just för att håll-i-synk-plikten var driftrisken. Kvarvarande duplicering här är
// alltså en ÖPPEN skuld av samma klass, inte ett mönster att härma.

export const EVENT_TEXT_FALT_KEYS = [
  'tid',
  'pris',
  'anmalningsavgift',
  'resterandeBelopp',
  'sistaBetalningsdag',
  'beskrivning',
  'forberedelser',
  'tagMed',
  'rokning',
  'parfym',
  'mat',
  'overnattning',
  'utrustning',
  'adress',
  'parkering',
  'transport',
  'klader',
] as const;

export type EventTextFalt = (typeof EVENT_TEXT_FALT_KEYS)[number];

/** Domän-nyckel → Airtable BAS-fältnamn (utan "(bilagetext)"-suffix). Delad
 *  av alla tre skrivvägarna: `save-event-content` skriver dessa NAMN direkt
 *  på Eventinnehåll; `save-event-text` lägger BILAGETEXT_SUFFIX på för
 *  Eventplanerings egen kopia; `save-place-standard` använder de FYRA
 *  plats-nycklarna (PLATS_FALT_KEYS) för Platser-radens egna fält. */
export const EVENT_TEXT_BASFALT: Record<EventTextFalt, string> = {
  tid: 'Tid',
  pris: 'Pris',
  anmalningsavgift: 'Anmälningsavgift',
  resterandeBelopp: 'Resterande belopp',
  sistaBetalningsdag: 'Sista betalningsdag',
  beskrivning: 'Beskrivning',
  forberedelser: 'Förberedelser',
  tagMed: 'Tag med',
  rokning: 'För dig som röker',
  parfym: 'Parfym och kosmetika',
  mat: 'Mat/fika',
  overnattning: 'Övernattning',
  utrustning: 'Utrustning',
  adress: 'Adress',
  parkering: 'Parkering',
  transport: 'Transport',
  klader: 'Kläder',
};

/** Eventplanerings (bilagetext)-suffix — inledande mellanslag, ADR-125 § 2. */
export const BILAGETEXT_SUFFIX = ' (bilagetext)';

/** Eventplanerings egen kopia-fältnamn för en given domän-nyckel, t.ex.
 *  `bilagetextFieldName('tid')` → `"Tid (bilagetext)"`. */
export function bilagetextFieldName(key: EventTextFalt): string {
  return `${EVENT_TEXT_BASFALT[key]}${BILAGETEXT_SUFFIX}`;
}

/** De FYRA blocken som ÄVEN har en platsstandard (ADR-125 § 2 Platser-tabellen
 *  + `save-place-standard`s allowlist) — delmängd av EVENT_TEXT_FALT_KEYS. */
export const PLATS_FALT_KEYS = ['adress', 'parkering', 'transport', 'klader'] as const;
export type PlatsFalt = (typeof PLATS_FALT_KEYS)[number];

/** De TOLV Eventinnehåll-egna textfälten (`save-event-content`s allowlist) —
 *  EVENT_TEXT_FALT_KEYS minus `sistaBetalningsdag` (härledd, aldrig lagrad
 *  på Eventinnehåll, ADR-125 § 2) och minus de FYRA plats-fälten (de bor på
 *  Platser, inte Eventinnehåll). */
export const EVENTINNEHALL_FALT_KEYS = [
  'tid',
  'pris',
  'anmalningsavgift',
  'resterandeBelopp',
  'beskrivning',
  'forberedelser',
  'tagMed',
  'rokning',
  'parfym',
  'mat',
  'overnattning',
  'utrustning',
] as const;
export type EventinnehallFalt = (typeof EVENTINNEHALL_FALT_KEYS)[number];

/** Namn-strängen (icke-levande snapshot, plattformsväggen — ADR-125 § 2,
 *  data-model.md § Bilagornas datamodell). VERBATIM samma form som
 *  `scripts/seed-eventinnehall-modell.mjs`s `eventinnehallNamn()` — Node-
 *  respektive Deno-runtime delar ingen modul här (scripts/ är Node-only,
 *  supabase/functions/ är Deno-only), så denna endra rad hålls i synk för
 *  hand i stället för att tvinga fram en artificiell cross-runtime-delning
 *  för en enda strängmall. `save-event-content` sätter `Namn` med denna
 *  funktion VID VARJE SKRIVNING (ADR-125 § Updates 2026-08-23).
 */
export function eventinnehallNamn(event: string, typ: string): string {
  return `${event} · ${typ}`;
}
