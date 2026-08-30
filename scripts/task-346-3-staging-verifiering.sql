-- TASK-346.3 — staging-verifieringen av de garantier som BOR I DATABASEN.
--
--   npx supabase db query --linked -f scripts/task-346-3-staging-verifiering.sql
--
-- KÖRS AV ORKESTRERAREN, EFTER `db push` och FÖRE armering (uppdragets
-- B5-ordning). Körs som `postgres`-rollen via Management API-proxyn — INTE
-- som `service_role`, som medvetet saknar de rättigheter städningen kräver
-- (append-only-grantet på kvitton). Samma "hämta engångs, kör, kasta"-mönster
-- som TASK-201.2:s och TASK-201.5:s live-prov, dokumenterat i
-- `supabase/migrations/README.md`.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- VARFÖR DETTA INTE ÄR ETT COMMITTAT TEST
-- ═══════════════════════════════════════════════════════════════════════════
-- Kontrollerna nedan KRÄVER skrivning. `SUPABASE_SERVICE_ROLE_KEY` är ingen
-- CI-secret (verifierat i `supabase/migrations/README.md` § RLS-beviset), och
-- ett rutinmässigt CI-committat insert-test mot en bokföringstabell vore
-- dessutom fel även om nyckeln fanns: varje körning hade lämnat rader i
-- staging. Deny-halvan och kolumnkontraktet ÄR committade, i
-- `tests/api/betalningsdomanen-rls.staging.test.ts`.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- INGA SPÅR EFTERÅT — och inga brända kvittonummer
-- ═══════════════════════════════════════════════════════════════════════════
-- Tätheten prövas mot TESTÅRET 2999, aldrig mot 2026, så produktionsserien
-- rörs inte. Kontroll B allokerar visserligen 2026:s FÖRSTA nummer (det är
-- hela poängen — "startande efter högsta" kan bara bevisas på det riktiga
-- året), men droppar sedan sekvensen `kvittoserie_2026` igen, så att den
-- återskapas på 1003 vid det första RIKTIGA kvittot. Netto: noll förbrukade
-- nummer.
--
-- Testraderna bär sentinel-formen `ZZ-TASK-346.3-…` och städas i steg H. Går
-- körningen sönder halvvägs är de ändå fångade av
-- `public.purga_testrader()` (migration 20260830200100) — säkerhetsventilen
-- är avsiktlig, inte en tillfällighet.
--
-- UTFALL: exit 0 + slutraden nedan betyder att SAMTLIGA kontroller passerade.
-- Varje misslyckad kontroll `raise`:ar med sitt eget bokstavsprefix, och då
-- körs slutraden aldrig.

do $$
declare
  v_kvittonummer text;
  v_lopnummer integer;
  v_serie integer[] := '{}';
  v_i integer;
  v_inbetalning uuid;
  v_inbetalning_b uuid;
  v_jobb uuid;
  v_msg_id bigint;
begin
  -- ═══ A. NEGATIV KONTROLL: utan golv allokeras INGET nummer ═══
  -- Fail-closed-egenskapen är hela skyddet mot att en glömd seed ger 1001 i
  -- en miljö vars gamla Airtable-serie redan nått 1002. År 2100 seedas
  -- aldrig, så kontrollen är oberoende av 2026:s tillstånd.
  begin
    perform public.allokera_kvittonummer(2100);
    raise exception
      'KONTROLL A MISSLYCKADES: allokeraren gav ett nummer for ar 2100 trots att golv saknas — fail-closed ar bruten';
  exception
    when sqlstate 'P0002' then
      null; -- förväntat
  end;

  -- ═══ A2. NEGATIV KONTROLL: ogiltigt år avvisas ═══
  begin
    perform public.allokera_kvittonummer(2025);
    raise exception 'KONTROLL A2 MISSLYCKADES: ar 2025 accepterades av allokeraren';
  exception
    when sqlstate '22023' then
      null; -- förväntat
  end;

  -- ═══ B. "STARTANDE EFTER HÖGSTA": stagings första nummer är 1003 ═══
  -- Mätt underlag: Airtable staging (apphjj8Q7lkXCMsL4, tabell Kvitton) bär
  -- MM-2026-1001 och MM-2026-1002 — ommätt 2026-08-30 av denna skiva.
  insert into public.kvittoserie_golv (ar, forsta_lopnummer, motivering)
  values (2026, 1003,
          'Airtable-ledgern i staging bar hogst MM-2026-1002 (matt 2026-08-30) — serien fortsatter efter den.')
  on conflict (ar) do nothing;

  select k.kvittonummer, k.lopnummer
    into v_kvittonummer, v_lopnummer
    from public.allokera_kvittonummer(2026) k;

  if v_lopnummer <> 1003 then
    raise exception 'KONTROLL B MISSLYCKADES: forsta lopnumret blev % (vantade 1003)', v_lopnummer;
  end if;
  if v_kvittonummer <> 'MM-2026-1003' then
    raise exception 'KONTROLL B MISSLYCKADES: kvittonumret blev % (vantade MM-2026-1003)', v_kvittonummer;
  end if;

  -- Återställ 2026-serien: sekvensen återskapas på golvet vid första
  -- RIKTIGA kvittot, så verifieringen bränner inget nummer.
  drop sequence if exists public.kvittoserie_2026;

  -- ═══ C. TÄTHET: tre allokeringar i följd ger 1003, 1004, 1005 ═══
  insert into public.kvittoserie_golv (ar, forsta_lopnummer, motivering)
  values (2999, 1003, 'ZZ-TASK-346.3 tathetsprov — testar, stadas i steg H')
  on conflict (ar) do update set forsta_lopnummer = 1003;

  drop sequence if exists public.kvittoserie_2999;

  for v_i in 1..3 loop
    select k.lopnummer into v_lopnummer from public.allokera_kvittonummer(2999) k;
    v_serie := v_serie || v_lopnummer;
  end loop;

  if v_serie <> array[1003, 1004, 1005] then
    raise exception 'KONTROLL C MISSLYCKADES: serien blev % (vantade {1003,1004,1005})', v_serie;
  end if;

  -- ═══ SENTINEL-RECORD-ID:NA — EXAKT 14 TECKEN EFTER `rec` ═══
  --
  -- `inbetalningar_anmalan_record_id_form` kräver `^rec[A-Za-z0-9]{14}$`
  -- (Airtables egen record-ID-form). Här stod tidigare `recZZTASK3463AA` och
  -- tre syskon med TOLV tecken efter `rec`. Skarp körning efter `db push`
  -- (orkestreraren, 2026-08-30) fällde D-blocket på
  -- `23514 ... violates check constraint "inbetalningar_anmalan_record_id_form"`.
  --
  -- OCH DET VÄRRE, som den fällningen dolde: F1 och F2 fångar
  -- `check_violation`. Med ett ogiltigt record-ID hade BÅDA blivit gröna av
  -- FEL SKÄL — de hade fällts av formkontrollen i stället för av tecken-
  -- regeln respektive makuleringsregeln de finns för att bevisa. Ett grönt
  -- utfall från ett prov som aldrig nådde sin egen regel är värre än ett
  -- rött, eftersom ingen tittar igen.
  --
  -- Id:na är därför formgiltiga men uppenbart fejk. Sentinel-IGENKÄNNINGEN
  -- som `public.purga_testrader()` matchar sitter i `ogonblicksbild_namn`
  -- och `skapad_av` (`ZZ-TASK-346.3-…`), aldrig i record-ID:t — det behöver
  -- bara passera formen.
  --
  -- F3 nedan är UNDANTAGET: dess record-ID (`Anna Andersson`) ska förbli
  -- ogiltigt, för det är exakt vad den kontrollen bevisar. Rör den inte.

  -- ═══ D. UNIK NYCKEL PER INBETALNING: andra kvittot FÄLLER ═══
  insert into public.inbetalningar (
    anmalan_record_id, ogonblicksbild_namn, ogonblicksbild_event,
    belopp, betalsatt, typ, skapad_av
  ) values (
    'recZZTASK346300AA', 'ZZ-TASK-346.3-verifiering-A', 'ZZ-TASK-346.3 verifiering',
    2500.00, 'Swish', 'inbetalning', 'ZZ-TASK-346.3-verifiering'
  ) returning id into v_inbetalning;

  insert into public.kvitton (ar, lopnummer, inbetalning_id, typ)
  values (2999, 1003, v_inbetalning, 'kvitto');

  begin
    insert into public.kvitton (ar, lopnummer, inbetalning_id, typ)
    values (2999, 1004, v_inbetalning, 'kvitto');
    raise exception
      'KONTROLL D MISSLYCKADES: ETT ANDRA kvitto for samma inbetalning gick igenom — dubbelskick ar INTE strukturellt omojligt';
  exception
    when unique_violation then
      null; -- förväntat: ADR-128 beslut 4
  end;

  -- ═══ E. KVITTONUMRET ÄR GENERERAT, inte skrivet ═══
  select k.kvittonummer into v_kvittonummer
    from public.kvitton k where k.inbetalning_id = v_inbetalning;
  if v_kvittonummer <> 'MM-2999-1003' then
    raise exception 'KONTROLL E MISSLYCKADES: genererat kvittonummer blev % (vantade MM-2999-1003)', v_kvittonummer;
  end if;

  begin
    -- En generated column kan inte skrivas. Skulle den gå att sätta vore
    -- formatlåsningen (ADR-109 beslut 1) en konvention, inte en garanti.
    execute 'update public.kvitton set kvittonummer = ''MM-2999-9999'' where inbetalning_id = $1'
      using v_inbetalning;
    raise exception 'KONTROLL E MISSLYCKADES: kvittonummer gick att skriva over';
  exception
    when generated_always then
      null; -- förväntat
    when syntax_error_or_access_rule_violation then
      null; -- vissa PG-versioner klassar samma vägran hit
  end;

  -- ═══ F. CHECK-CONSTRAINTS på pengalogiken fäller ═══
  -- F1: tecknet måste följa typen.
  begin
    insert into public.inbetalningar (
      anmalan_record_id, ogonblicksbild_namn, ogonblicksbild_event,
      belopp, betalsatt, typ, skapad_av
    ) values (
      'recZZTASK346300BB', 'ZZ-TASK-346.3-verifiering-F1', 'ZZ-TASK-346.3 verifiering',
      -500.00, 'Swish', 'inbetalning', 'ZZ-TASK-346.3-verifiering'
    );
    raise exception 'KONTROLL F1 MISSLYCKADES: negativt belopp med typ inbetalning gick igenom';
  exception
    when check_violation then null;
  end;

  -- F2: makulering kräver skäl.
  begin
    insert into public.inbetalningar (
      anmalan_record_id, ogonblicksbild_namn, ogonblicksbild_event,
      belopp, betalsatt, typ, status, skapad_av
    ) values (
      'recZZTASK346300CC', 'ZZ-TASK-346.3-verifiering-F2', 'ZZ-TASK-346.3 verifiering',
      100.00, 'Swish', 'inbetalning', 'makulerad', 'ZZ-TASK-346.3-verifiering'
    );
    raise exception 'KONTROLL F2 MISSLYCKADES: makulerad post utan skal gick igenom';
  exception
    when check_violation then null;
  end;

  -- F3: ett record-ID som inte är ett record-ID.
  begin
    insert into public.inbetalningar (
      anmalan_record_id, ogonblicksbild_namn, ogonblicksbild_event,
      belopp, betalsatt, typ, skapad_av
    ) values (
      'Anna Andersson', 'ZZ-TASK-346.3-verifiering-F3', 'ZZ-TASK-346.3 verifiering',
      100.00, 'Swish', 'inbetalning', 'ZZ-TASK-346.3-verifiering'
    );
    raise exception 'KONTROLL F3 MISSLYCKADES: ett fritextvarde accepterades som anmalan_record_id';
  exception
    when check_violation then null;
  end;

  -- F4: en inbetalning MED kvitto kan inte raderas (on delete restrict) —
  -- "Radera före kvitto; makulera efter" är strukturellt sant.
  begin
    delete from public.inbetalningar where id = v_inbetalning;
    raise exception 'KONTROLL F4 MISSLYCKADES: en inbetalning med kvitto gick att radera';
  exception
    when foreign_key_violation then null;
  end;

  -- ═══ G. JOBBMOTORN: dubbelklick kan inte skapa två öppna rader ═══
  insert into public.inbetalningar (
    anmalan_record_id, ogonblicksbild_namn, ogonblicksbild_event,
    belopp, betalsatt, typ, skapad_av
  ) values (
    'recZZTASK346300DD', 'ZZ-TASK-346.3-verifiering-B', 'ZZ-TASK-346.3 verifiering',
    1000.00, 'Bankgiro', 'inbetalning', 'ZZ-TASK-346.3-verifiering'
  ) returning id into v_inbetalning_b;

  insert into public.jobb (jobbtyp, skapad_av)
  values ('kvitto', 'ZZ-TASK-346.3-verifiering') returning id into v_jobb;

  insert into public.jobb_rad (jobb_id, jobbtyp, objekt_id)
  values (v_jobb, 'kvitto', v_inbetalning_b);

  begin
    insert into public.jobb_rad (jobb_id, jobbtyp, objekt_id)
    values (v_jobb, 'kvitto', v_inbetalning_b);
    raise exception
      'KONTROLL G MISSLYCKADES: en ANDRA vantande jobbrad for samma objekt gick igenom — dubbelklick kan dubblera';
  exception
    when unique_violation then null;
  end;

  -- G2: ett fel utan skäl är ett halvt utfall som ser helt ut.
  begin
    update public.jobb_rad
       set status = 'fel', avslutad_nar = now()
     where jobb_id = v_jobb;
    raise exception 'KONTROLL G2 MISSLYCKADES: status fel utan skal gick igenom';
  exception
    when check_violation then null;
  end;

  -- G3: uppdaterad_nar sätts av triggern, inte av skrivvägen.
  --
  -- Det strikta `>` nedan är BEVISETS KÄRNA, och det fungerar bara därför att
  -- triggern använder `clock_timestamp()` medan insert-defaulten använder
  -- `now()`. En nyss insatt rad har `uppdaterad_nar` EXAKT lika med
  -- `skapad_nar` (samma transaktionsstämpel); avfyrar triggern flyttas den
  -- framåt till väggklockan. Alltså: `>` är sant om och endast om triggern
  -- körde.
  --
  -- Denna kontroll fällde skarpt 2026-08-30 när triggern använde `now()` —
  -- hela DO-blocket är EN transaktion, så stämplarna var identiska trots att
  -- triggern körde. Rotorsaken satt i triggern, inte här; se
  -- `public.satt_uppdaterad_nar()` i migration 20260830195900.
  update public.jobb_rad
     set status = 'pagar', paborjad_nar = now()
   where jobb_id = v_jobb;
  if not exists (
    select 1 from public.jobb_rad
     where jobb_id = v_jobb and uppdaterad_nar > skapad_nar
  ) then
    raise exception 'KONTROLL G3 MISSLYCKADES: triggern satte inte uppdaterad_nar vid UPDATE';
  end if;

  -- G4: kö-wrappern bygger den LÅSTA meddelandeformen (ADR-129 beslut 1).
  -- msg_id FÅNGAS här så att både denna kontroll och steg H träffar exakt
  -- VÅRT meddelande.
  select public.jobb_ko_skicka('kvitto', v_inbetalning_b) into v_msg_id;

  -- KONTROLLEN LÄSER KÖTABELLEN DIREKT PÅ msg_id, inte via `pgmq.read`.
  -- Här stod tidigare `pgmq.read('jobbko', 1, 1)`, vilket var fel på två sätt
  -- samtidigt:
  --   1. `pgmq.read` returnerar de ÄLDSTA meddelandena först (ORDER BY msg_id
  --      ASC LIMIT n). Med en parallell sessions jobb i kön prövade
  --      kontrollen alltså NÅGON ANNANS meddelande — och blev ändå grön,
  --      eftersom predikatet aldrig band `radId` till vår egen inbetalning.
  --      Den kunde med andra ord passera utan att `jobb_ko_skicka` ens hade
  --      fungerat.
  --   2. `pgmq.read` sätter en synlighets-timeout på det den läser. En
  --      verifiering ska inte göra en parallell sessions väntande jobb
  --      osynliga, ens i en sekund — samma "rör aldrig bredare än ditt eget"
  --      som steg H följer.
  -- Att läsa `pgmq.q_<kö>` direkt löser båda: exakt vårt meddelande, noll
  -- bieffekt på kön. Tabellnamnet är pgmq:s dokumenterade konvention och
  -- används redan av migrationens egen idempotens-vakt
  -- (`to_regclass('pgmq.q_jobbko')`), så formen är inte ny här.
  if not exists (
    select 1
      from pgmq.q_jobbko m
     where m.msg_id = v_msg_id
       and m.message ? 'jobbtyp'
       and m.message ? 'radId'
       and m.message ->> 'jobbtyp' = 'kvitto'
       and (m.message ->> 'radId') = v_inbetalning_b::text
  ) then
    raise exception
      'KONTROLL G4 MISSLYCKADES: meddelande % bar inte formen {"jobbtyp":"kvitto","radId":"%"}',
      v_msg_id, v_inbetalning_b;
  end if;

  -- G5: cron-ticket är ofarligt utan Vault-värden och utan konsument.
  if (public.jobb_cron_tick() ->> 'anrop')::boolean is not false then
    raise exception
      'KONTROLL G5 MISSLYCKADES: jobb_cron_tick ringde ut trots att Vault/konsument inte ar redo (eller trots tom kö)';
  end if;

  -- ═══ H. STÄDNING — inga spår, i FK-säker ordning ═══
  --
  -- BARA VÅRT EGET MEDDELANDE. Här stod tidigare `pgmq.purge_queue('jobbko')`,
  -- som tömmer HELA kön — i staging hade den raderat riktiga, väntande jobb
  -- som en parallell session köat, och det är precis den klass av
  -- "städverktyg som städar för mycket" som `.purge-staging-policy.json`s
  -- länk-guard finns för på Airtable-sidan. `v_msg_id` kommer från G4:s
  -- `jobb_ko_skicka` och är därmed bevisligen vårt eget; meddelandet är
  -- dessutom aldrig läst med `pgmq.read`, så det har varken synlighets-
  -- timeout eller read_ct när det tas bort.
  perform pgmq.delete('jobbko', v_msg_id);
  delete from public.jobb_rad where objekt_id in (v_inbetalning, v_inbetalning_b);
  delete from public.jobb where id = v_jobb;
  update public.inbetalningar set kvitto_id = null
   where id in (v_inbetalning, v_inbetalning_b);
  delete from public.kvitton where inbetalning_id in (v_inbetalning, v_inbetalning_b);
  delete from public.inbetalningar where id in (v_inbetalning, v_inbetalning_b);
  delete from public.kvittoserie_golv where ar = 2999;
  drop sequence if exists public.kvittoserie_2999;
  drop sequence if exists public.kvittoserie_2100;

  raise notice 'TASK-346.3: samtliga kontroller A–G passerade, allt stadat.';
end
$$;

-- ═══ SLUTKONTROLLEN — HÄRLEDD, INTE PÅSTÅDD ═══
--
-- Här stod tidigare en literal slutrad ("ALLA KONTROLLER PASSERADE") bredvid
-- räknarna. Den var sann bara av en indirekt anledning (do-blocket ovan
-- kastar vid fel, så select:en nås inte då) och sade INGENTING om städningen:
-- en kvarlämnad testrad eller en oväntad sekvens hade rapporterats som ett
-- tal i en kolumn, med "PASSERADE" bredvid. Frånvaro presenterad som data —
-- repots egen återkommande felklass.
--
-- Nu FÄLLER städkontrollen. Blocket nedan kastar om något spår kvarstår
-- eller om 2026-golvet inte är det mätta 1003; först när det passerat
-- körs slutraden.
do $$
declare
  v_kvar_inbetalningar integer;
  v_kvar_jobb integer;
  v_kvar_jobbrader integer;
  v_kvar_testgolv integer;
  v_kvar_sekvenser integer;
  v_golv_2026 integer;
begin
  select count(*) into v_kvar_inbetalningar from public.inbetalningar
   where ogonblicksbild_namn like 'ZZ-TASK-346.3%';
  select count(*) into v_kvar_jobb from public.jobb
   where skapad_av like 'ZZ-TASK-346.3%';
  select count(*) into v_kvar_jobbrader from public.jobb_rad r
   where exists (select 1 from public.jobb j
                  where j.id = r.jobb_id and j.skapad_av like 'ZZ-TASK-346.3%');
  select count(*) into v_kvar_testgolv from public.kvittoserie_golv where ar = 2999;
  select count(*) into v_kvar_sekvenser from pg_sequences
   where schemaname = 'public'
     and sequencename in ('kvittoserie_2026', 'kvittoserie_2999', 'kvittoserie_2100');
  select forsta_lopnummer into v_golv_2026 from public.kvittoserie_golv where ar = 2026;

  if v_kvar_inbetalningar <> 0 or v_kvar_jobb <> 0 or v_kvar_jobbrader <> 0
     or v_kvar_testgolv <> 0 or v_kvar_sekvenser <> 0 then
    raise exception
      'STADNINGEN OFULLSTANDIG: inbetalningar=%, jobb=%, jobb_rad=%, testgolv=%, sekvenser=% (alla ska vara 0)',
      v_kvar_inbetalningar, v_kvar_jobb, v_kvar_jobbrader, v_kvar_testgolv, v_kvar_sekvenser;
  end if;

  -- 2026-serien ska vara ORÖRD: golvet seedat till 1003, och INGEN sekvens
  -- kvar (den skapas av det första RIKTIGA kvittot, inte av verifieringen).
  if v_golv_2026 is distinct from 1003 then
    raise exception
      'GOLVET FOR 2026 AR % (vantade 1003 — stagings Airtable-ledger bar hogst MM-2026-1002)',
      v_golv_2026;
  end if;
end
$$;

select 'TASK-346.3 staging-verifiering: ALLA KONTROLLER PASSERADE, inga spar kvar, 2026-serien orord'
  as resultat;
