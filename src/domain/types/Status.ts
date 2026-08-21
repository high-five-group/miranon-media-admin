// Faktiska värden från Airtable (verifierade via MCP 2026-03-30; 6 värden
// för RegistrationStatus per docs/reference/data-model.md:121-130,
// live-verifierade via MCP 2026-06-10 i Synk-gate 1-inventeringen).

// Bridge mot Airtable-shape (pre-A-track-läget). A1 ändrar formeln
// "Är aktiv (1/0)", inte statusvärdena — enum:en håller över A-track.
// Ersätts inte av target-enum:en (06b §B3) förrän S-track byggs; separata
// kontrakt, unifiera inte. Se docs/archive/Code-verification-of-codex-analysis.md
// Tillägg Fråga 1.
export const RegistrationStatus = {
  OBEKRAFTAD: 'Obekräftad',
  BEKRAFTAD: 'Bekräftad (mail skickat)',
  BETALNINGSPAMINNELSE: 'Betalningspåminnelse skickad',
  AVBOKAD: 'Avbokad/Ombokad',
  FLYTTA_TILL_VANTELISTA: 'Flytta till väntelista',
  INSTALLT: 'Inställt',
} as const;

export type RegistrationStatusValue = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

// Anmälningar.Källa (fldwk2sl7CkBv9epw) — singleSelect med 3 options + TOM.
// Live-verifierad mot STAGING-schemat 2026-07-22 (task-18.4, L294) före
// shape-utökningen. TOM (frånvarande värde) är den BÄRANDE normen: en anmälan
// som kom via webbformuläret lämnar fältet orört — eventsidans arbetskö läser
// därför `kalla === null` som "via formulär" (S73-facit K16/K37: normen får
// inget märke; endast Manuell/+1 bär pill).
export const RegistrationSource = {
  MANUELL: 'Manuell',
  MEDFOLJANDE: '+1',
  VANTELISTA: 'Väntelista',
} as const;

export type RegistrationSourceValue = (typeof RegistrationSource)[keyof typeof RegistrationSource];

export const FlagStatus = {
  NY_ANMALAN: 'Ny anmälan',
  EJ_MOTTAGEN: 'Ej mottagen',
  MOTTAGEN: 'Mottagen',
} as const;

export type FlagStatusValue = (typeof FlagStatus)[keyof typeof FlagStatus];

export const PaymentStatus = {
  MOTTAGEN: 'Mottagen',
  EJ_MOTTAGEN: 'Ej mottagen',
  EJ_RELEVANT: 'Ej relevant (för föreläsningar)',
} as const;

export type PaymentStatusValue = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// Eventplanering.Status (fld2nXlS1UG0aOHLt) — 4 options, MCP-verifierade
// mot live-basen 2026-06-10 (matchar data-model.md inkl. option-ID:n;
// 0 records utanför listan vid data-svep). Fas 2.5 klunga 4.
export const EventStatus = {
  PLANERAT: 'Planerat',
  GENOMFORT: 'Genomfört',
  INSTALLT: 'Inställt',
  FLYTTAT: 'Flyttat',
} as const;

export type EventStatusValue = (typeof EventStatus)[keyof typeof EventStatus];

export const AttendanceSession = {
  DAG_1: 'Dag 1',
  DAG_2: 'Dag 2',
  FORELASNING: 'Föreläsning',
} as const;

export type AttendanceSessionValue = (typeof AttendanceSession)[keyof typeof AttendanceSession];

export const AttendanceStatus = {
  EJ_AVSTAMT: 'Ej avstämt',
  NARVARANDE: 'Närvarande',
  FRANVARANDE: 'Frånvarande',
  FORSENAD: 'Försenad',
  AVBROT: 'Avbröt',
  DELTOG_ONLINE: 'Deltog online',
} as const;

export type AttendanceStatusValue = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

// Modalitet = Eventplanering "Typ" (singleSelect) = segment-taxonomins andra axel
// (kurs × modalitet, ADR-064). MÅSTE spegla `_shared/segment-membership.ts`
// Modalitet-typen exakt (samma två värden) — runtime-gränsen Deno↔Vite tvingar
// spegling; ModalitetSchema (Segment.schema.ts, z.enum) är alignment-ankaret.
export const Modalitet = {
  UTBILDNING: 'Utbildning',
  FORELASNING: 'Föreläsning',
} as const;

export type ModalitetValue = (typeof Modalitet)[keyof typeof Modalitet];

// Bilagor.Dokumentklass (TASK-147.12, additivt fält — staging fldr2CwboZ3M4USCX,
// skapad via MCP `create_field` 2026-08-16 eftersom AIRTABLE_SCHEMA_TOKEN
// saknades i lokal .env.seed; scripts/create-bilagor-table.mjs CONFIG.fields
// speglar SAMMA spec för framtida idempotenta körningar). ORDLISTA.md:s tre
// dokumentklasser (grillad samsyn S93) — A/B/C-vokabuläret återges här som de
// FAKTISKA Airtable-optionsnamnen, inte en bokstavskod, så domänvärdet är
// direkt renderbart utan en översättningstabell. Prod bär INTE detta fält än
// (kortets prod-klicklista, task-147.12 Implementation Notes).
export const AttachmentClass = {
  UPPLADDAD: 'Uppladdad',
  EVENT_MALLAD: 'Event-mallad',
  PERSON_GENERERAD: 'Person-genererad',
} as const;

export type AttachmentClassValue = (typeof AttachmentClass)[keyof typeof AttachmentClass];

// Bilagor.Räckvidd (TASK-275.2, ADR-118 beslut 1+4, additivt fält — staging
// fldU6i9Ju5HRwSRBf, prod fldsEltfGx3y63hhF, task-275.1, data-model.md §
// "Staging- och prodbasens additiva tillskott 2026-08-17 (task-275.1...)").
// SPEGLAR `supabase/functions/_shared/attachments.ts`s ATTACHMENT_SCOPE_*
// (Deno↔Vite-dubblering, samma mönster som AttachmentClass ovan). Varje
// bilaga bär EXAKT en räckvidd (ORDLISTA.md § Räckvidd): Event (dagens
// koppling) · Kurstyp (Kursfamilj obligatorisk + Kursnivå valfri, tom =
// hela familjen) · Alla event.
export const AttachmentScope = {
  EVENT: 'Event',
  KURSTYP: 'Kurstyp',
  ALLA_EVENT: 'Alla event',
} as const;

export type AttachmentScopeValue = (typeof AttachmentScope)[keyof typeof AttachmentScope];

// Anmälningar.Eventmatchning (TASK-284.1, ADR-122 beslut 3 — formelfält,
// staging fldYz2NRZJjyX8VWB). Vaktens facit-jämförelse: anmälans EGNA
// formulärtext (Datum/Ort/Event (namn)) mot det länkade eventets facit
// (Ort (from Event)/Kurs (from Event)/Datum (from Event) — den sistnämnda
// ett nytt uppslagsfält av Eventplanering.'Datum (visas i länk)',
// fldLCfZfk7zESNbno), normaliserat mot de TRE MÄTTA formateringsklasserna
// (S110 Del 4 § B punkt 3): skiftläge, mellanslag runt tankstreck, upprepat
// årtal vid månadsskifte. Tomt jämförelsefält ger ALDRIG Avviker (ADR-122
// beslut 4 — trestegs-logiken, live-bevisad mot en fixtur med tomt
// Ort-fält). Live-bevisad mot fyra staging-fixturer 2026-08-21 (TASK-284.1):
// ZZ-TASK-284.1 Fixtur OK/Avviker/Backfill/Utan event.
export const Eventmatchning = {
  OK: 'OK',
  AVVIKER: 'Avviker',
  UTAN_EVENT: 'Utan event',
} as const;

export type EventmatchningValue = (typeof Eventmatchning)[keyof typeof Eventmatchning];
