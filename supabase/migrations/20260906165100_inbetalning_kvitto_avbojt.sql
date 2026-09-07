-- Kryssrutan "Skicka kvitto" PERSISTERAS — TASK-367 review runda 1, FYND 2,
-- Marcus beslut 2026-09-06 ("Definitivt A").
--
-- ═══════════════════════════════════════════════════════════════════════════
-- VARFÖR DENNA KOLUMN BEHÖVS
-- ═══════════════════════════════════════════════════════════════════════════
-- TASK-367s huvudfix härledde "kvitto att skicka" i Postgres: en aktiv
-- inbetalning utan `kvitto_id` och utan jobbrad i `vantar`/`pagar` ÄR ett
-- kvitto att skicka. Det höll ett hål öppet, bokfört som känd begränsning i
-- PR #2416: registreringsformulärets kryssruta "Skicka kvitto" persisterades
-- INGENSTANS, så en inbetalning registrerad MED kryssrutan urtagen var i
-- Postgres byte för byte identisk med en som väntade på att köas
-- (`status = 'aktiv'`, `kvitto_id is null`, ingen jobbrad) — den durabla
-- sektionen hade återupplivat betalningar Lotta MEDVETET registrerat utan
-- kvitto.
--
-- `kvitto_avbojt` stänger hålet: `true` betyder att Lotta bockade UR
-- kryssrutan vid registreringen, och härledningen (`hamta-oppna-
-- betalningar/index.ts`) utesluter sådana rader explicit — utöver den
-- redan befintliga `betalsatt <> 'Historik'`-uteslutningen för backfillen.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DEFAULT false, INTE true — OCH VARFÖR DET ÄR SÄKERT FÖR BEFINTLIGA RADER
-- ═══════════════════════════════════════════════════════════════════════════
-- Kryssrutan i `RegistreraForm.tsx` är FÖRBOCKAD som standard (`useState(...
-- ?? true)`), så "kvitto önskat" är det överväldigande vanliga fallet.
-- `default false` (alltså "kvitto INTE avböjt") är därför korrekt för VARJE
-- rad som redan finns i tabellen INKLUSIVE de som i verkligheten registrerades
-- med kryssrutan urtagen (en känd, mätt LÅG risk — se PR #2416 § Divergenser):
-- de raderna kommer, precis som innan denna migration, felaktigt visas som
-- "kvitto att skicka" tills någon aktivt rättar dem. Migrationen löser
-- FRAMÅT, inte bakåt — samma "syns i stället för tystas"-princip som resten
-- av betalningsdomänen (ADR-128 beslut 5, spegeln).
--
-- Backfillens rader (`betalsatt = 'Historik'`) berörs INTE av denna kolumn:
-- de utesluts redan på `betalsatt`, en helt oberoende, redan skarp vakt.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- INGEN RLS- ELLER GRANT-ÄNDRING BEHÖVS — SAMMA MOTIVERING SOM 20260901111500
-- ═══════════════════════════════════════════════════════════════════════════
-- Basmigrationens (`20260830195728`) tabellbreda grants
-- (`select` för `authenticated`, `select, insert, update, delete` för
-- `service_role`) täcker varje kolumn, nya som gamla. RLS-policyn
-- `inbetalningar_las_authenticated` filtrerar rader (`using (true)`), inte
-- kolumner. Realtime-publikationen (`alter publication supabase_realtime
-- add table public.inbetalningar`) saknar kolumnlista och tar automatiskt
-- med nya kolumner.

alter table public.inbetalningar
  add column kvitto_avbojt boolean not null default false;

comment on column public.inbetalningar.kvitto_avbojt is
  'Sant när Lotta bockade UR "Skicka kvitto"-kryssrutan vid registreringen '
  '(TASK-367 review runda 1, FYND 2, Marcus beslut 2026-09-06). Skrivs av '
  'registrera-inbetalning som `!medKvitto` och rörs aldrig efteråt. '
  'hamta-oppna-betalningar utesluter rader där denna är sann ur '
  '"kvitto att skicka"-härledningen — utan den skulle en avsiktligt kvitto-lös '
  'inbetalning se ut som en glömd sådan. default false: kryssrutan är '
  'förbockad som standard, så "inte avböjt" är det korrekta antagandet för '
  'varje rad som fanns FÖRE denna kolumn (se filhuvudets § default-resonemang '
  'för den kända, mätta gränsen bakåt i tiden).';

-- ═══════════════════════════════════════════════════════════════════════════
-- NEDÅT (dokumenterad, INTE en down-migration — Supabase CLI har ingen)
-- ═══════════════════════════════════════════════════════════════════════════
--   alter table public.inbetalningar drop column kvitto_avbojt;
