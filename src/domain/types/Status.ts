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
