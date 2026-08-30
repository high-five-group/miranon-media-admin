-- TASK-346.3 — Purge-vägen för Postgres-testrader (kortets AC #5).
--
-- VARFÖR EN DATABASFUNKTION OCH INTE EN RAK DELETE FRÅN PURGE-SKRIPTET:
-- `scripts/purge-staging-sentinels.mjs` har ingen `service_role`-nyckel —
-- den är INTE en CI-secret (verifierat i `supabase/migrations/README.md` §
-- RLS-beviset och i `tests/api/activity-log-rls.staging.test.ts` filhuvud),
-- och `authenticated` har medvetet varken DELETE eller UPDATE på någon av
-- betalningsdomänens tabeller. Storage-purgen (TASK-302.3) löste samma
-- problem med en test-Edge Function som får `service_role` auto-injicerad;
-- här räcker en `security definer`-funktion, alltså ingen ny deploy-yta och
-- ingen ny dataväg.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- SÄKERHETSFORMEN — VAD SOM ÄR HÅRDKODAT, OCH VARFÖR
-- ═══════════════════════════════════════════════════════════════════════════
-- Funktionen är anropbar av `authenticated` (purge-skriptet loggar redan in
-- som test-admin, samma väg storage-purgen använder). Den ytan är avgränsad
-- av tre saker som INTE kan parametriseras:
--
--   1. SENTINEL-MÖNSTRET är en konstant i funktionskroppen. En anropare kan
--      inte be den radera något annat än rader vars sentinel-kolumn matchar
--      `ZZ-TASK-346…`. Ett ofiltrerat eller anroparstyrt mönster hade gjort
--      purge-vägen till den värsta tänkbara regressionen — samma resonemang
--      som `activity-log-rls.staging.test.ts` skriver ut för sitt filtrerade
--      DELETE-prov.
--   2. ÅLDERS-GOLVET är 10 minuter, hårt. Skickas ett lägre värde höjs det
--      till golvet. Det är samma skydd för in-flight-körningar som
--      `.purge-staging-policy.json` `minAgeMinutes` ger Airtable-sidan
--      (purge-skriptets skyddsräcke 2).
--   3. TABELLERNA är uppräknade i kroppen, inte valbara.
--
-- Funktionen finns därmed också i PROD när migrationen körs där. Det är
-- medvetet och ofarligt: prod bär inga `ZZ-TASK-346…`-rader, och funktionen
-- kan inte fås att röra något annat. Att villkora en migration på miljö är
-- inte möjligt, och en tyst miljöskillnad vore värre än en avgränsad yta
-- som är läsbar i en fil.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- BARNEN ÄRVER SENTINEL-SKAPET — bara TVÅ kolumner bär markören
-- ═══════════════════════════════════════════════════════════════════════════
-- `inbetalningar.ogonblicksbild_namn` och `jobb.skapad_av`. `kvitton` städas
-- via sin (unika) `inbetalning_id`, `jobb_rad` via sitt `jobb_id`. Att låta
-- kvittots `mottagare` bära en egen markör hade krävt en sentinel-form som
-- också är en giltig e-postadress, och gett två mönster att hålla i synk.
--
-- MÖNSTRET FINNS PÅ TVÅ STÄLLEN — och det är korsläst, inte hoppat på:
-- konstanten nedan och `.purge-staging-policy.json` `postgresTargets[].
-- exactMatchPattern`. Skrivaren (SQL) och läsaren (Node) kan inte dela
-- modul. `scripts/test-purge-staging-sentinels.mjs` jämför därför de två
-- rad för rad vid varje CI-körning — samma lösning som redan vaktar
-- `KASTBARA_POSTER_FIL` i samma skript. Att de går isär TYST är precis den
-- felklass som gör ett städverktyg farligare än inget: purgen hade
-- rapporterat "inget att städa" utan att något såg fel ut.

create or replace function public.purga_testrader(p_min_alder_minuter integer default 60)
returns table (tabell text, raderade integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- HÅLL I SYNK med .purge-staging-policy.json → postgresTargets[0].
  -- exactMatchPattern (korsläses av scripts/test-purge-staging-sentinels.mjs).
  v_sentinel constant text := '^ZZ-TASK-346[.-][0-9A-Za-z._+-]{1,80}$';
  v_golv constant integer := 10;
  v_alder interval;
  v_brytpunkt timestamptz;
  v_inbetalningar uuid[];
  v_antal integer;
begin
  v_alder := (greatest(coalesce(p_min_alder_minuter, 60), v_golv) || ' minutes')::interval;
  v_brytpunkt := now() - v_alder;

  -- Sentinel-inbetalningarna plockas EN gång; alla fyra stegen nedan
  -- arbetar mot exakt den mängden, så en rad som skapas mitt i svepet
  -- aldrig kan halvraderas.
  select coalesce(array_agg(i.id), '{}'::uuid[])
    into v_inbetalningar
    from public.inbetalningar i
   where i.ogonblicksbild_namn ~ v_sentinel
     and i.skapad_nar < v_brytpunkt;

  -- (1) Jobbrader som arbetar på en sentinel-inbetalning, oavsett vem som
  -- äger jobbet. Utan detta steg blir de kvar och pekar på ett objekt som
  -- inte längre finns (ingen FK — ADR-129 beslut 11).
  delete from public.jobb_rad r
   where r.objekt_id = any (v_inbetalningar);
  get diagnostics v_antal = row_count;
  tabell := 'jobb_rad (via inbetalning)'; raderade := v_antal; return next;

  -- (2) Sentinel-jobben. `jobb_rad.jobb_id` har on delete cascade, så
  -- raderna följer med.
  delete from public.jobb j
   where j.skapad_av ~ v_sentinel
     and j.skapad_nar < v_brytpunkt;
  get diagnostics v_antal = row_count;
  tabell := 'jobb (+ kaskad jobb_rad)'; raderade := v_antal; return next;

  -- (3) Lossa den denormaliserade genvägen innan kvittot tas bort —
  -- inbetalningar.kvitto_id har on delete set null, men att nolla den
  -- explicit gör steg 4 oberoende av FK-ordningen.
  update public.inbetalningar i
     set kvitto_id = null
   where i.id = any (v_inbetalningar)
     and i.kvitto_id is not null;

  -- (4) Kvittona ärver sentinel-skapet via sin unika inbetalning_id.
  delete from public.kvitton k
   where k.inbetalning_id = any (v_inbetalningar);
  get diagnostics v_antal = row_count;
  tabell := 'kvitton (via inbetalning)'; raderade := v_antal; return next;

  -- (5) Sist inbetalningarna — kvitton har on delete restrict mot dem, så
  -- den här ordningen är den enda som fungerar.
  delete from public.inbetalningar i
   where i.id = any (v_inbetalningar);
  get diagnostics v_antal = row_count;
  tabell := 'inbetalningar'; raderade := v_antal; return next;

  return;
end;
$$;

comment on function public.purga_testrader(integer) is
  'Städar Postgres-testrader i sentinel-form ZZ-TASK-346… (kortets AC #5). '
  'Mönstret, ålders-golvet (10 min) och tabellistan är HÅRDKODADE och kan '
  'inte parametriseras — se funktionens filhuvud. Anropas av '
  'scripts/purge-staging-sentinels.mjs med test-admins JWT, samma väg '
  'storage-purgen redan går.';

-- GRANT-FORMEN SKILJER SIG FRÅN DE ÖVRIGA SERVER-SIDE-FUNKTIONERNA, med
-- avsikt. De sex andra (allokera_kvittonummer, jobb_ko_* och jobb_cron_tick)
-- revokas från BÅDE `anon` och `authenticated`, eftersom Supabases
-- default-privileges ger EXECUTE till båda som ett EXPLICIT roll-grant som
-- `revoke ... from public` inte rör (mätt 2026-08-30: `pg_default_acl`
-- objtyp 'f' i `public` = {postgres=X, anon=X, authenticated=X,
-- service_role=X}, satt av `supabase_admin`).
--
-- Här revokas ENDAST `anon`. `authenticated` BEHÅLLER sitt EXECUTE, och det
-- är hela poängen: `scripts/purge-staging-sentinels.mjs` når funktionen med
-- test-admins JWT, precis som storage-purgen når sin test-EF. Ett
-- committat test vaktar den riktningen (betalningsdomanen-rls.staging.
-- test.ts § "purga_testrader ÄR anropbar av authenticated"), så en framtida
-- revoke här skulle fälla en grind i stället för att gå obemärkt förbi.
--
-- Att den ytan är ofarlig vilar INTE på vem som får anropa den, utan på att
-- mönstret, ålders-golvet och tabellistan är hårdkodade i kroppen — se
-- filhuvudets § Säkerhetsformen.
revoke execute on function public.purga_testrader(integer) from public;
revoke execute on function public.purga_testrader(integer) from anon;
grant execute on function public.purga_testrader(integer) to authenticated;
grant execute on function public.purga_testrader(integer) to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- NEDÅT (dokumenterad, INTE en down-migration)
-- ═══════════════════════════════════════════════════════════════════════════
--   drop function if exists public.purga_testrader(integer);
