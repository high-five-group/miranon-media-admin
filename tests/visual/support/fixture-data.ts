/**
 * Den frusna fixturvärlden för visuella regressionstester (task-36.7).
 *
 * EN sammanhängande värld som alla visual-specs läser ur (AC 4: mockad data,
 * noll staging-beroende, stabila pixlar) — svaren har exakt EF-respons-form
 * och parsas av samma zod-scheman som skarp data (EventSchema/
 * RegistrationSchema): ett schema-brott syns som parse-fel i vyn, aldrig som
 * tyst tom rendering.
 *
 * Datum-kontraktet (AC 5): "nu" är FROZEN_NOW och all fixtur-data är daterad
 * relativt den — kommande event ligger efter, genomförda före. Formel-härledda
 * strängar (tidKvarTillEvent) är frusna litteraler: appen räknar inte om dem,
 * så pixlarna kan aldrig driva med klockan.
 *
 * Persondata är FIKTIV (inga verkliga deltagare) men realistisk i form,
 * så baselines visar vyerna som de SKA se ut.
 */

/** Fruset "nu": tisdag 2026-09-15 kl 10:00 svensk sommartid (explicit offset —
 *  parsas identiskt på Mac och linux-CI, aldrig via plattformens lokala zon). */
export const FROZEN_NOW = new Date('2026-09-15T10:00:00+02:00');

// ── Fixtur-miljön (AC 4: noll staging-beroende) ──────────────────────────
// Visual-körningens dev-server startas med DESSA värden (playwright.config:s
// webServer-gren injicerar dem; Vite låter process-env vinna över .env-filer)
// så appen binder mot den fiktiva URL:en. Varje anrop mot den interceptas —
// att den aldrig faktiskt nås är hermetik-vaktens bevis. Konstanterna bor här
// (dependency-fritt) så BÅDE config-filen och test-ramen kan läsa dem.
export const VISUAL_SUPABASE_URL = 'https://visual-fixture.supabase.co';
export const VISUAL_SUPABASE_ANON_KEY = 'visual-fixture-anon-key';

const EVENT_SKOVDE = 'recVisualEvent0001';
const EVENT_GBG = 'recVisualEvent0002';
const EVENT_VARBERG = 'recVisualEvent0003';

/** `get-events`-svaret: kommande utbildning + kommande föreläsning + genomförd. */
export const EVENTS_RESPONSE = {
  events: [
    {
      id: EVENT_SKOVDE,
      eventlabel: 'Skövde 26–27 sep',
      eventNamn: 'Utbildning Skövde',
      typ: 'Utbildning - 2 dagar',
      ort: 'Skövde',
      startdatum: '2026-09-26',
      slutdatum: '2026-09-27',
      tidKvarTillEvent: '11 dagar',
      maxPlatser: 12,
      antalAnmalda: 8,
      platserKvar: 4,
      anmaldBelaggning: 0.67,
      bekraftadBelaggning: 0.5,
      antalNyaAnmalningar: 2,
      antalAnmalningsavgifter: 4,
      antalSlutbetalningar: 2,
      antalSlutbetalningFelande: 1,
      status: 'Planerat',
      eventKey: 'Event-41',
      borOverAntal: 3,
    },
    {
      id: EVENT_GBG,
      eventlabel: 'Göteborg 9 okt',
      eventNamn: 'Föreläsning Göteborg',
      typ: 'Föreläsning',
      ort: 'Göteborg',
      startdatum: '2026-10-09',
      slutdatum: '2026-10-09',
      tidKvarTillEvent: '24 dagar',
      maxPlatser: 40,
      antalAnmalda: 17,
      platserKvar: 23,
      anmaldBelaggning: 0.43,
      bekraftadBelaggning: 0.35,
      antalNyaAnmalningar: 0,
      antalAnmalningsavgifter: 0,
      antalSlutbetalningar: 0,
      antalSlutbetalningFelande: 0,
      status: 'Planerat',
      eventKey: 'Event-42',
      borOverAntal: 0,
    },
    {
      id: EVENT_VARBERG,
      eventlabel: 'Varberg 22–23 aug',
      eventNamn: 'Utbildning Varberg',
      typ: 'Utbildning - 2 dagar',
      ort: 'Varberg',
      startdatum: '2026-08-22',
      slutdatum: '2026-08-23',
      tidKvarTillEvent: null,
      maxPlatser: 12,
      antalAnmalda: 12,
      platserKvar: 0,
      anmaldBelaggning: 1,
      bekraftadBelaggning: 1,
      antalNyaAnmalningar: 0,
      antalAnmalningsavgifter: 12,
      antalSlutbetalningar: 12,
      antalSlutbetalningFelande: 0,
      status: 'Genomfört',
      eventKey: 'Event-38',
      borOverAntal: 5,
    },
  ],
} as const;

/**
 * `get-registrations`-svaret (event-lösa grenen — Hem-aggregeringen läser den
 * utan params). Mixen är vald så dashboard-korten får innehåll: två Ny
 * anmälan-flaggade (NyaAnmalningarCard), obetalda avgifter/slutbetalningar
 * (ObetaldaCard) och en skickad betalningspåminnelse.
 */
export const REGISTRATIONS_RESPONSE = {
  registrations: [
    {
      id: 'recVisualReg000001',
      namn: 'Anna Andersson',
      fornamn: 'Anna',
      efternamn: 'Andersson',
      email: 'anna.andersson@example.se',
      telefon: '070-123 45 01',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Obekräftad',
      flagga: 'Ny anmälan',
      anmalningsavgift: 'Ej mottagen',
      slutbetalning: 'Ej mottagen',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-09-13',
      motivering: 'Vill utvecklas i mitt ledarskap.',
      tidigareErfarenhet: null,
      antalPlatser: 1,
      notering: null,
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00001',
    },
    {
      id: 'recVisualReg000002',
      namn: 'Björn Bergström',
      fornamn: 'Björn',
      efternamn: 'Bergström',
      email: 'bjorn.bergstrom@example.se',
      telefon: '070-123 45 02',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Obekräftad',
      flagga: 'Ny anmälan',
      anmalningsavgift: 'Ej mottagen',
      slutbetalning: 'Ej mottagen',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-09-14',
      motivering: null,
      tidigareErfarenhet: 'Gick föreläsningen i våras.',
      antalPlatser: 1,
      notering: null,
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00002',
    },
    {
      id: 'recVisualReg000003',
      namn: 'Cecilia Ceder',
      fornamn: 'Cecilia',
      efternamn: 'Ceder',
      email: 'cecilia.ceder@example.se',
      telefon: '070-123 45 03',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Bekräftad (mail skickat)',
      flagga: 'Mottagen',
      anmalningsavgift: 'Mottagen',
      slutbetalning: 'Ej mottagen',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-09-02',
      motivering: null,
      tidigareErfarenhet: null,
      antalPlatser: 1,
      notering: 'Vegetarisk kost.',
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00003',
    },
    {
      id: 'recVisualReg000004',
      namn: 'David Dahl',
      fornamn: 'David',
      efternamn: 'Dahl',
      email: 'david.dahl@example.se',
      telefon: '070-123 45 04',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Bekräftad (mail skickat)',
      flagga: 'Mottagen',
      anmalningsavgift: 'Mottagen',
      slutbetalning: 'Mottagen',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-08-28',
      motivering: null,
      tidigareErfarenhet: null,
      antalPlatser: 2,
      notering: null,
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00004',
    },
    {
      id: 'recVisualReg000005',
      namn: 'Emma Eklund',
      fornamn: 'Emma',
      efternamn: 'Eklund',
      email: 'emma.eklund@example.se',
      telefon: '070-123 45 05',
      eventNamn: 'Föreläsning Göteborg',
      ort: 'Göteborg',
      status: 'Bekräftad (mail skickat)',
      flagga: 'Mottagen',
      anmalningsavgift: 'Ej relevant (för föreläsningar)',
      slutbetalning: 'Ej relevant (för föreläsningar)',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-09-05',
      motivering: null,
      tidigareErfarenhet: null,
      antalPlatser: 1,
      notering: null,
      eventId: EVENT_GBG,
      personId: 'recVisualPers00005',
    },
    {
      id: 'recVisualReg000006',
      namn: 'Filip Forsberg',
      fornamn: 'Filip',
      efternamn: 'Forsberg',
      email: 'filip.forsberg@example.se',
      telefon: '070-123 45 06',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Betalningspåminnelse skickad',
      flagga: 'Mottagen',
      anmalningsavgift: 'Ej mottagen',
      slutbetalning: 'Ej mottagen',
      betalningspaminnelseSkickad: '2026-09-10',
      inskickad: '2026-08-25',
      motivering: null,
      tidigareErfarenhet: null,
      antalPlatser: 1,
      notering: null,
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00006',
    },
  ],
} as const;
