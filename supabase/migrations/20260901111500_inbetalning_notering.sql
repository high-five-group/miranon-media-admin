-- Noteringen på SJÄLVA INBETALNINGEN — Lottas fria anteckning per bankrad.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- VARFÖR EN NY KOLUMN, OCH INTE ETT BEFINTLIGT FÄLT
-- ═══════════════════════════════════════════════════════════════════════════
-- Marcus dom 2026-09-01, ordagrant: *"det är HÄR lotta noterar något, inte på
-- pricka av-blocket"*. En mätning samma dag (commit `f9ccefd9`) prövade den
-- billigare vägen — att flytta panelens BEFINTLIGA noteringsfält hit — och
-- fällde den på tre punkter:
--
--   1. Panelens fält rör aldrig inbetalningsdomänen. Det bor i
--      `events/atgarder/AtgardsSida.tsx` § `SkrivRad` och skriver till
--      ANMÄLANS Airtable-fält `Notering anmälningsavgift` respektive
--      `Notering slutbetalning` (via `update-registration-payment-note`).
--   2. De två fälten är FACK-BUNDNA (avgift/slutbetalning) medan
--      registreringsformuläret bokför ett FRITT belopp utan fack. Vilket av
--      dem en notering skulle hamna i är inte en detalj utan ett öppet
--      designbeslut — och fel svar skriver över en anteckning Lotta gjort
--      någon annanstans.
--   3. Anteckningen hör till BOKFÖRINGSPOSTEN, inte till anmälan. Samma
--      verifikationskrav som ögonblicksbilden bär (ADR-128 beslut 1): posten
--      ska kunna läsas ensam, år efter att anmälan ändrats eller tagits bort.
--      En notering som bor på anmälan försvinner med den.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- INGEN RLS- ELLER GRANT-ÄNDRING BEHÖVS — MÄTT MOT 20260830195728, INTE ANTAGET
-- ═══════════════════════════════════════════════════════════════════════════
-- Basmigrationens fjärde avsnitt beviljar TABELLBRETT, inte kolumn-scopat:
--   `grant select on public.inbetalningar to authenticated;`
--   `grant select, insert, update, delete on public.inbetalningar to service_role;`
-- En ny kolumn ärver därför båda utan en rad här. RLS-policyn
-- `inbetalningar_las_authenticated` är `using (true)` och filtrerar RADER, inte
-- kolumner — den berörs inte heller.
--
-- (Kontrast, så gränsen syns: `kvitton` bär en KOLUMN-SCOPAD
-- `grant update (lagringsnyckel, skickad_nar, mottagare, status)`. Hade
-- noteringen bott där HADE en grant-rad krävts. Skillnaden är inte
-- kosmetisk — den är skälet till att detta avsnitt mäter i stället för att
-- resonera.)
--
-- REALTIME BERÖRS INTE: `alter publication supabase_realtime add table
-- public.inbetalningar` (samma migration) publicerar tabellen UTAN kolumnlista,
-- så nya kolumner följer med i publikationen automatiskt.

alter table public.inbetalningar
  add column notering text;

-- FORMEN SOM CHECK, INTE SOM KONVENTION. Tabellen bär redan nio
-- check-constraints av exakt detta slag (`inbetalningar_makulering_kraver_skal`
-- m.fl.), och skälet är detsamma här: en regel som bara lever i en Edge
-- Function gäller bara den vägen in. Backfill-skript, en framtida import och
-- varje manuell rättning i SQL går utanför den.
--
-- TVÅ VILLKOR I EN CONSTRAINT:
--   • Tom eller blank sträng är ALDRIG en notering. Utan detta hade `''` och
--     `'   '` blivit tredje och fjärde sättet att uttrycka "ingen notering",
--     vid sidan av NULL — och varje läsare hade fått hantera alla tre.
--     Edge Function-vägen normaliserar redan `''` → NULL; denna rad gör det
--     sant för ALLA vägar in.
--   • 500 tecken är samma tak som makulerings-skälet redan bär
--     (`hantera-inbetalning/index.ts` § `SKAL_MAX_LANGD`). Taket sätts på båda
--     ställena med avsikt: Edge Function-vägen avvisar först och ger Lotta ett
--     begripligt meddelande, databasen fäller det som ändå tar sig förbi.
alter table public.inbetalningar
  add constraint inbetalningar_notering_form
    check (
      notering is null
      or (btrim(notering) <> '' and char_length(notering) <= 500)
    );

comment on column public.inbetalningar.notering is
  'Lottas fria anteckning om DENNA inbetalning (Marcus 2026-09-01). Frivillig. '
  'Hör till bokföringsposten, inte till anmälan — ANMÄLANS två fack-bundna '
  'noteringar (Notering anmälningsavgift / Notering slutbetalning) bor kvar i '
  'Airtable och är en annan sak. NULL = ingen notering; tom sträng är '
  'strukturellt omöjlig (inbetalningar_notering_form).';

-- ═══════════════════════════════════════════════════════════════════════════
-- NEDÅT (dokumenterad, INTE en down-migration — Supabase CLI har ingen)
-- ═══════════════════════════════════════════════════════════════════════════
--   alter table public.inbetalningar drop constraint inbetalningar_notering_form;
--   alter table public.inbetalningar drop column notering;
