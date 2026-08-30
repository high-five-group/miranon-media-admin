-- TASK-346.3 — Jobbmotorn: kö (pgmq), jobbtabeller, konsumentväg och cron.
--
-- STYRANDE BESLUT: ADR-129 (jobbmotorn — kö i Postgres, cron som garanti,
-- kick för känslan). Varje mätning som bär besluten nedan gjordes i staging
-- 2026-08-30 och står i ADR-129 § Kontext; denna migration skriver ner
-- resultatet av dem, den gissar ingenting.
--
-- DENNA MIGRATION ÄR REN DISK — se den föregående migrationens filhuvud för
-- B5-ordningen (orkestreraren applicerar, aldrig bygg-agenten).
--
-- ═══════════════════════════════════════════════════════════════════════════
-- KÄND, ACCEPTERAD TRANSIENT VID FÖRSTA APPLICERINGEN
-- ═══════════════════════════════════════════════════════════════════════════
-- Cron-posten anropar konsumentfunktionen `jobb-konsument`, som byggs först
-- i TASK-346.4. Fram till dess svarar staging 404 på anropet. Det är en känd
-- och accepterad transient, inte ett fel — och den kostar ingenting, eftersom
-- `public.jobb_cron_tick()` bara ringer när det FAKTISKT finns rader i
-- `vantar` (se funktionen). Med en tom jobbtabell görs alltså noll anrop.
--
-- Utöver det görs inget anrop alls förrän Vault bär alla tre hemligheterna
-- (ADR-129 beslut 7). Migrationen kan därför appliceras före Vault-seeden
-- utan att fylla `cron.job_run_details` med fel.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- NAMNET `jobb-konsument` — ALDRIG `send-*`
-- ═══════════════════════════════════════════════════════════════════════════
-- ADR-129 beslut 6: mail-låset (`.mail-lock-policy.conf`,
-- `scripts/deny-resend-send.sh`) fäller Bash-kommandon som innehåller
-- `functions/v1/send-`. En konsumentfunktion med `send-`-prefix hade varit
-- oanropbar för varje agent i staging. Namnet är dessutom generiskt, som
-- motorn (ADR-129 beslut 11).

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Utökningarna (ADR-129 § Kontext — exakt de fyra satser som mättes)
-- ───────────────────────────────────────────────────────────────────────────
--
-- Mätt i staging 2026-08-30 under `postgres`-rollen UTAN superuser, samtliga
-- exit 0: pgmq 1.5.1 (schema `pgmq`), pg_cron 1.6.4 (schema `pg_catalog`,
-- objekten i schemat `cron`), pg_net 0.20.3 (schema `extensions`, objekten i
-- schemat `net`). `if not exists` gör satserna idempotenta.

create extension if not exists pgmq;

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create extension if not exists pg_net with schema extensions;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Kön (ADR-129 beslut 1)
-- ───────────────────────────────────────────────────────────────────────────
--
-- Kön är TRANSPORT; jobbtabellen är SANNING (beslut 2). Meddelandet bär
-- jobbtyp + rad-ID och ALDRIG nyttolasten — inte för storlekens skull utan
-- för sanningens: en kopia i meddelandet kan bli inaktuell mellan köandet
-- och konsumtionen.
--
-- `pgmq.create` är idempotent i pgmq 1.5 (den skapar kötabellerna om de
-- saknas), men vi vaktar ändå med en katalogkontroll så att en ommigrering
-- aldrig kan fälla på ett halvt skapat tillstånd.

do $$
begin
  if to_regclass('pgmq.q_jobbko') is null then
    perform pgmq.create('jobbko');
  end if;
end
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Jobbtabellerna (ADR-129 beslut 2)
-- ───────────────────────────────────────────────────────────────────────────
--
-- TVÅ tabeller, per kortets AC #1 ("jobb + jobb_rad"). ADR-129 beslut 2 talar
-- om "en tabell" i singular och beskriver där RADENS innehåll — de två
-- motsäger inte varandra: `jobb_rad` ÄR den tabell beslut 2 föreskriver, och
-- `jobb` lägger till den gruppering Lottas ETT klick behöver ("Skicka 8
-- kvitton" → ett jobb, åtta rader; Hem säger "8 kvitton skickade",
-- användarberättelse 8 och 11). Kömeddelandets `radId` pekar alltid på en
-- `jobb_rad`, aldrig på ett `jobb`.

create table public.jobb (
  id uuid primary key default gen_random_uuid(),
  jobbtyp text not null,
  status text not null default 'oppet',
  skapad_av text not null,
  skapad_nar timestamptz not null default now(),
  avslutad_nar timestamptz,

  -- EN konsument i dag (ADR-129 beslut 11: "Det som byggs generiskt är
  -- transporten, tabellens form och svepet — inte en abstraktion för
  -- konsumenter som ännu inte finns"). En check med ett värde är
  -- fail-closed: en felstavad jobbtyp skapar aldrig en rad som ingen
  -- konsument plockar. Nästa konsument (utskicken, egen PRD) utvidgar
  -- listan med en additiv migration.
  constraint jobb_jobbtyp_varden
    check (jobbtyp in ('kvitto')),
  constraint jobb_status_varden
    check (status in ('oppet', 'avslutat')),
  constraint jobb_avslutat_har_tid
    check (status <> 'avslutat' or avslutad_nar is not null)
);

comment on table public.jobb is
  'Jobbet = EN batch, ett klick (ADR-129 beslut 2 + kortets AC #1). '
  '"Skicka 8 kvitton" skapar ETT jobb med åtta jobb_rad. Skrivning endast '
  'via service_role; authenticated läser (Realtime, beslut 8).';

create table public.jobb_rad (
  id uuid primary key default gen_random_uuid(),
  jobb_id uuid not null references public.jobb (id) on delete cascade,

  -- Denormaliserad från jobbet så att kömeddelandets konsument kan
  -- dispatcha på EN läsning av raden (beslut 1: meddelandet bär jobbtyp +
  -- radId, och raden är sanningen).
  jobbtyp text not null,

  -- Objektet raden arbetar på. För jobbtyp 'kvitto': inbetalningens id.
  -- MEDVETET ingen FOREIGN KEY — motorn är generisk och nästa jobbtyp pekar
  -- på en annan tabell (ADR-129 beslut 11). En raderad referent blir ett
  -- FEL med skäl, vilket är rätt utfall för ett jobb: synligt, inte tyst.
  objekt_id uuid not null,

  status text not null default 'vantar',
  skal text,
  forsok integer not null default 0,

  skapad_nar timestamptz not null default now(),
  paborjad_nar timestamptz,
  avslutad_nar timestamptz,
  uppdaterad_nar timestamptz not null default now(),

  constraint jobb_rad_jobbtyp_varden
    check (jobbtyp in ('kvitto')),
  constraint jobb_rad_status_varden
    check (status in ('vantar', 'pagar', 'skickat', 'fel')),
  constraint jobb_rad_forsok_ej_negativt
    check (forsok >= 0),
  -- Ett fel utan skäl är ett halvt utfall som ser helt ut. Användar-
  -- berättelse 10: "se per rad om kvittot är skickat, väntar eller
  -- misslyckades OCH VARFÖR".
  constraint jobb_rad_fel_kraver_skal
    check (status <> 'fel' or skal is not null),
  constraint jobb_rad_pagar_har_start
    check (status <> 'pagar' or paborjad_nar is not null),
  constraint jobb_rad_avslutad_har_tid
    check (status not in ('skickat', 'fel') or avslutad_nar is not null)
);

comment on table public.jobb_rad is
  'Jobbraden = EN enhet arbete och SANNINGEN om dess tillstånd (ADR-129 '
  'beslut 2). Kön är bara transport. vantar → pagar → skickat|fel, med '
  'försöksräknare, tidsstämplar och felskäl i klartext. Självläkning: '
  'public.jobb_cron_tick() återställer pagar-rader som stått för länge.';

comment on column public.jobb_rad.objekt_id is
  'Objektet raden arbetar på — för jobbtyp kvitto: inbetalningens id. Ingen '
  'FK: motorn är generisk (ADR-129 beslut 11).';
comment on column public.jobb_rad.skal is
  'Felskälet i KLARTEXT, läsbart av Lotta. Obligatoriskt när status = fel.';
comment on column public.jobb_rad.uppdaterad_nar is
  'Sätts av trigger vid varje UPDATE — Realtime-konsumenten och '
  'självläkningsdiagnostiken litar på den, så den får inte bero på att en '
  'skrivväg minns att sätta den.';

-- Konsumentens plockväg + Lottas listvy.
create index jobb_rad_status_idx
  on public.jobb_rad (status, skapad_nar);

-- "Vad hände med jobbet jag just startade?" (Hem-kortet, berättelse 11).
create index jobb_rad_jobb_idx
  on public.jobb_rad (jobb_id);

-- DUBBELKLICK KAN INTE SKAPA TVÅ JOBB FÖR SAMMA OBJEKT. Ett partiellt unikt
-- index över de ÖPPNA tillstånden: samma inbetalning kan aldrig ha två
-- väntande eller pågående kvittojobb samtidigt (användarberättelse 31:
-- "utan att något tappas ELLER DUBBLERAS"). Avslutade rader (skickat/fel)
-- ingår inte — en omkörning efter ett fel måste vara möjlig.
create unique index jobb_rad_oppen_per_objekt_idx
  on public.jobb_rad (jobbtyp, objekt_id)
  where status in ('vantar', 'pagar');

create or replace function public.satt_uppdaterad_nar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- `now()` bor i pg_catalog, som alltid är implicit i search_path — kroppen
  -- behöver därför ingen ytterligare kvalificering trots det tomma sökvägen.
  new.uppdaterad_nar := now();
  return new;
end;
$$;

comment on function public.satt_uppdaterad_nar() is
  'Håller jobb_rad.uppdaterad_nar sann utan att någon skrivväg behöver '
  'minnas den. INTE security definer — den rör bara NEW-raden i den '
  'anropandes egen transaktion. Den bär ändå en TOM search_path, därför att '
  'Supabases linter fäller function_search_path_mutable på varje funktion '
  'utan, oavsett om den är security definer eller inte.';

create trigger jobb_rad_satt_uppdaterad_nar
  before update on public.jobb_rad
  for each row
  execute function public.satt_uppdaterad_nar();

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Konsumentvägen — security definer-wrappers i `public` (ADR-129 beslut 5)
-- ───────────────────────────────────────────────────────────────────────────
--
-- MÄTT, INTE GISSAT: schemat `pgmq_public` skapas INTE av `create extension
-- pgmq` (ADR-129 § Kontext) — det skapas av Dashboard-toggeln "Expose Queues
-- via PostgREST", alltså ett manuellt steg per miljö som varken en migration
-- eller CI kan uttrycka. Wrappers i `public` gör staging och prod identiska
-- av konstruktion, och hela konsumentvägen granskningsbar i en fil.
--
-- Könamnet är HÅRDKODAT i varje wrapper, aldrig en parameter: en anropare
-- ska inte kunna nå någon annan kö genom den här ytan.

create or replace function public.jobb_ko_skicka(p_jobbtyp text, p_rad_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_msg_id bigint;
begin
  if p_jobbtyp is null or p_rad_id is null then
    raise exception 'jobbkon: jobbtyp och radId kravs'
      using errcode = '22023';
  end if;

  -- MEDDELANDEFORMEN LÅSES HÄR (ADR-129 beslut 1, mätt fungerande i
  -- minimaltestet): {"jobbtyp": ..., "radId": ...}. Att bygga den i
  -- wrappern i stället för hos varje anropare gör att formen inte kan
  -- drifta mellan producenter.
  select pgmq.send(
           'jobbko',
           jsonb_build_object('jobbtyp', p_jobbtyp, 'radId', p_rad_id::text)
         )
    into v_msg_id;

  return v_msg_id;
end;
$$;

create or replace function public.jobb_ko_las(
  p_antal integer default 10,
  p_synlighet_sekunder integer default 60
)
returns table (msg_id bigint, forsok integer, jobbtyp text, rad_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_antal is null or p_antal < 1 or p_antal > 100 then
    raise exception 'jobbkon: p_antal maste vara 1..100 (fick %)', p_antal
      using errcode = '22023';
  end if;
  if p_synlighet_sekunder is null or p_synlighet_sekunder < 1 then
    raise exception 'jobbkon: p_synlighet_sekunder maste vara >= 1'
      using errcode = '22023';
  end if;

  -- Kolumnerna plockas EXPLICIT ur pgmq.read i stället för att returnera
  -- `setof pgmq.message_record` — wrappern blir då oberoende av att pgmq
  -- lägger till eller byter fält i sin egen radtyp.
  return query
    select m.msg_id,
           m.read_ct::integer,
           m.message ->> 'jobbtyp',
           (m.message ->> 'radId')::uuid
      from pgmq.read('jobbko', p_synlighet_sekunder, p_antal) m;
end;
$$;

create or replace function public.jobb_ko_radera(p_msg_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ok boolean;
begin
  select pgmq.delete('jobbko', p_msg_id) into v_ok;
  return coalesce(v_ok, false);
end;
$$;

create or replace function public.jobb_ko_arkivera(p_msg_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ok boolean;
begin
  select pgmq.archive('jobbko', p_msg_id) into v_ok;
  return coalesce(v_ok, false);
end;
$$;

comment on function public.jobb_ko_skicka(text, uuid) is
  'Köar ETT jobb (ADR-129 beslut 1). Bygger meddelandeformen {"jobbtyp", '
  '"radId"} — formen bor här så att den inte kan drifta mellan producenter.';
comment on function public.jobb_ko_las(integer, integer) is
  'Läser upp till p_antal meddelanden med p_synlighet_sekunder osynlighet. '
  'Wrapper i public i stället för pgmq_public — det schemat kräver en '
  'Dashboard-toggle (mätt, ADR-129 beslut 5).';
comment on function public.jobb_ko_radera(bigint) is
  'Tar bort ett fullbordat meddelande ur kön.';
comment on function public.jobb_ko_arkivera(bigint) is
  'Flyttar ett meddelande till pgmq:s arkivtabell i stället för att radera '
  'det — för meddelanden vars historik är värd att behålla.';

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Cron-ticket: självläkning + kickens garanti (ADR-129 beslut 4 och 7)
-- ───────────────────────────────────────────────────────────────────────────

create or replace function public.jobb_cron_tick()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Hur länge en rad får stå i `pagar` innan den räknas som död. Namngiven
  -- konstant, inte en tillfällighet (ADR-129 beslut 4: "rader som stått i
  -- pågår längre än N minuter"). Måste vara komfortabelt längre än en
  -- konsumentkörning: ett kvitto = PDF-generering + ett mailanrop.
  v_pagar_tak constant interval := interval '5 minutes';

  v_lakta integer;
  v_vantar integer;
  v_url text;
  v_anon text;
  v_hemlighet text;
  v_request_id bigint;
begin
  -- (1) SJÄLVLÄKNINGEN — körs ALLTID, oberoende av Vault och av om
  -- konsumenten finns. Ett jobb som dog mitt i plockas upp igen; det är
  -- hela svaret på användarberättelse 31 och motsvarigheten till Pretix
  -- läkningssvep (ADR-129 beslut 4).
  --
  -- ═══ KONTRAKTET MELLAN KÖN OCH TABELLEN — LÄS DETTA FÖRE TASK-346.4 ═══
  -- Svepet nedan är korrekt ENDAST om konsumenten håller tre regler. De
  -- står här, vid koden som förutsätter dem, och inte bara i ADR-129:
  --
  --   1. TABELLEN ÄR SANNING, KÖN ÄR VÄCKNING (ADR-129 beslut 1–2). Ett
  --      kömeddelande bär bara {jobbtyp, radId} och får aldrig tolkas som
  --      arbetets tillstånd. Konsumenten läser ALLTID raden innan den
  --      arbetar — en rad som redan är `skickat` ska hoppas över även om
  --      meddelandet dyker upp igen (kön är at-least-once).
  --   2. KOMEDDELANDET RADERAS ALDRIG FÖRE RADENS SLUTSTATUS. Ordningen är:
  --      sätt raden till `skickat`/`fel` (med skäl) och FÖRST DÄREFTER
  --      `jobb_ko_radera`/`jobb_ko_arkivera`. Raderas meddelandet först och
  --      konsumenten dör innan raden skrivs, blir raden en `pagar` som
  --      ingen kö längre kan väcka — och då är svepet nedan det ENDA som
  --      räddar den. Det är därför svepet finns, inte en bonus.
  --   3. `pagar` SÄTTS MED `paborjad_nar`, ALLTID. Svepet mäter mot den
  --      kolumnen; en `pagar`-rad utan tidsstämpel är osynlig för
  --      självläkningen (och fälls dessutom av check-constrainten
  --      `jobb_rad_pagar_har_start`).
  --
  -- Följden av 1+2 tillsammans: dubbelarbete är möjligt (två körningar av
  -- samma rad), dubbel EFFEKT är det inte — kvittots unika nyckel per
  -- inbetalning (ADR-128 beslut 4) fäller den andra insättningen.
  update public.jobb_rad
     set status = 'vantar',
         paborjad_nar = null
   where status = 'pagar'
     and paborjad_nar < now() - v_pagar_tak;
  get diagnostics v_lakta = row_count;

  select count(*) into v_vantar
    from public.jobb_rad
   where status = 'vantar';

  -- (2) Inget att göra ⇒ inget anrop. Sparar ~8 640 anrop per dygn när
  -- kön är tom, och gör att en ännu odeployad konsument (TASK-346.4) inte
  -- fyller cron.job_run_details med 404:or.
  if v_vantar = 0 then
    return jsonb_build_object('lakta', v_lakta, 'vantar', 0, 'anrop', false,
                              'skal', 'inget-vantar');
  end if;

  -- (3) Per-miljö-värdena ur Vault (ADR-129 beslut 7) — ALDRIG hårdkodade
  -- nycklar i cron-satsen. Supabases egen quickstart skriver
  -- 'YOUR_PUBLISHABLE_KEY' rakt i schemat; det är en platshållare, inte ett
  -- mönster.
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'jobbmotor_funktions_url';
  select decrypted_secret into v_anon
    from vault.decrypted_secrets where name = 'jobbmotor_anon_nyckel';
  select decrypted_secret into v_hemlighet
    from vault.decrypted_secrets where name = 'jobbmotor_delad_hemlighet';

  -- Fail-quiet, med SKÄL i returvärdet: en oseeded miljö ska inte spamma
  -- felloggen var tionde sekund, men den ska heller inte se ut som om
  -- motorn arbetar. `cron.job_run_details` bär returvärdet.
  if v_url is null or v_anon is null or v_hemlighet is null then
    return jsonb_build_object('lakta', v_lakta, 'vantar', v_vantar,
                              'anrop', false, 'skal', 'vault-saknar-varden');
  end if;

  -- (4) Två lager auktorisation (ADR-129 beslut 6). Anon-nyckeln passerar
  -- gateway-grinden `verify_jwt = true` — MÄTT, inte antaget (405 ur vår
  -- egen get-events-kod, ADR-129 § Kontext) — och är därför INGEN
  -- auktorisation, bara ett första försvar. Den delade hemligheten i egen
  -- header är auktorisationen; konsumenten jämför den i konstanttid.
  select net.http_post(
           url := v_url,
           body := jsonb_build_object('kalla', 'cron', 'vantar', v_vantar),
           headers := jsonb_build_object(
             'Content-Type', 'application/json',
             'Authorization', 'Bearer ' || v_anon,
             'apikey', v_anon,
             'x-jobbmotor-hemlighet', v_hemlighet
           ),
           timeout_milliseconds := 8000
         )
    into v_request_id;

  return jsonb_build_object('lakta', v_lakta, 'vantar', v_vantar,
                            'anrop', true, 'request_id', v_request_id);
end;
$$;

comment on function public.jobb_cron_tick() is
  'Cron-ticket (ADR-129 beslut 4): sveper självläkande över pagar-rader som '
  'stått för länge, och ringer konsumentfunktionen när något väntar. '
  'Ringer ALDRIG när kön är tom eller Vault saknar sina tre värden — '
  'migrationen kan därför appliceras före Vault-seeden och före att '
  'jobb-konsument deployats. Returvärdet hamnar i cron.job_run_details och '
  'är avsiktligt läsbart som diagnos.';

-- Var tionde sekund. Mätt accepterat och stabilt i staging 2026-08-30:
-- 9 av 9 tick `succeeded`, 80 s över 8 intervall = exakt 10,0 s per tick
-- (ADR-129 § Kontext). Sekundintervall kräver PG >= 15.1.1.61; staging kör
-- 17.6. PRODS version är OMÄTT (prod-ref fälls för en agent) — faller
-- kontrollen där är fallbacket ett MINUTintervall plus kicken, inte en
-- trasig motor (ADR-129 § Obelagt). Det är ett namngivet steg i
-- prod-runbooken, TASK-346.11.
--
-- `cron.schedule` gör en upsert på jobbnamnet, så en ommigrering skapar
-- aldrig en andra post.
select cron.schedule('jobbmotor-tick', '10 seconds', $cron$select public.jobb_cron_tick();$cron$);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. RLS + GRANT (samma tvålagersform som betalningsdomänen)
-- ───────────────────────────────────────────────────────────────────────────

alter table public.jobb enable row level security;
alter table public.jobb_rad enable row level security;

revoke all on public.jobb from anon, authenticated;
revoke all on public.jobb_rad from anon, authenticated;

grant select on public.jobb to authenticated;
grant select on public.jobb_rad to authenticated;

create policy jobb_las_authenticated
  on public.jobb for select to authenticated
  using (true);

create policy jobb_rad_las_authenticated
  on public.jobb_rad for select to authenticated
  using (true);

grant select, insert, update, delete on public.jobb to service_role;
grant select, insert, update, delete on public.jobb_rad to service_role;

-- Kö-wrappers och cron-ticket är SERVER-SIDE, uteslutande.
--
-- TVÅ REVOKES KRÄVS, INTE EN — mätt 2026-08-30 mot staging. Postgres ger
-- EXECUTE till PUBLIC som default, MEN Supabase lägger dessutom ett
-- EXPLICIT roll-grant ovanpå: `pg_default_acl` i `public` bär objtyp 'f'
-- med {postgres=X, anon=X, authenticated=X, service_role=X}, satt av
-- `supabase_admin`. Ett `revoke ... from public` rör inte det explicita
-- grantet — rollerna måste revokas VID NAMN.
--
-- Utan andra raden i varje par hade varje inloggad klient kunnat köa jobb,
-- läsa och radera kömeddelanden, och trigga cron-ticket via PostgREST-RPC.
-- Samma tvålagersform som tabellerna nedan redan följer.
revoke execute on function public.jobb_ko_skicka(text, uuid) from public;
revoke execute on function public.jobb_ko_skicka(text, uuid) from anon, authenticated;
revoke execute on function public.jobb_ko_las(integer, integer) from public;
revoke execute on function public.jobb_ko_las(integer, integer) from anon, authenticated;
revoke execute on function public.jobb_ko_radera(bigint) from public;
revoke execute on function public.jobb_ko_radera(bigint) from anon, authenticated;
revoke execute on function public.jobb_ko_arkivera(bigint) from public;
revoke execute on function public.jobb_ko_arkivera(bigint) from anon, authenticated;
revoke execute on function public.jobb_cron_tick() from public;
revoke execute on function public.jobb_cron_tick() from anon, authenticated;

-- `satt_uppdaterad_nar()` står MEDVETET utanför listan: dess returtyp är
-- `trigger`, vilket gör den oanropbar via PostgREST-RPC, och den är inte
-- `security definer` — den kör med anroparens egna rättigheter inuti den
-- anropandes transaktion. Den bär ändå `set search_path = ''` (se dess
-- definition) eftersom Supabases egen linter fäller
-- `function_search_path_mutable` på varje funktion utan.

grant execute on function public.jobb_ko_skicka(text, uuid) to service_role;
grant execute on function public.jobb_ko_las(integer, integer) to service_role;
grant execute on function public.jobb_ko_radera(bigint) to service_role;
grant execute on function public.jobb_ko_arkivera(bigint) to service_role;
-- jobb_cron_tick anropas av cron-posten (som kör som `postgres`, funktionens
-- ägare) och behöver därför INGET grant till någon annan roll.

-- ───────────────────────────────────────────────────────────────────────────
-- 7. Realtime-publikationen (ADR-129 beslut 8, AC #3)
-- ───────────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.jobb;
alter publication supabase_realtime add table public.jobb_rad;

-- ═══════════════════════════════════════════════════════════════════════════
-- NEDÅT (dokumenterad, INTE en down-migration — Supabase CLI har ingen)
-- ═══════════════════════════════════════════════════════════════════════════
--   select cron.unschedule('jobbmotor-tick');
--   alter publication supabase_realtime drop table public.jobb_rad;
--   alter publication supabase_realtime drop table public.jobb;
--   drop function if exists public.jobb_cron_tick();
--   drop function if exists public.jobb_ko_arkivera(bigint);
--   drop function if exists public.jobb_ko_radera(bigint);
--   drop function if exists public.jobb_ko_las(integer, integer);
--   drop function if exists public.jobb_ko_skicka(text, uuid);
--   drop trigger if exists jobb_rad_satt_uppdaterad_nar on public.jobb_rad;
--   drop function if exists public.satt_uppdaterad_nar();
--   drop table if exists public.jobb_rad;
--   drop table if exists public.jobb;
--   select pgmq.drop_queue('jobbko');
--   drop extension if exists pg_net cascade;
--   drop extension if exists pg_cron cascade;
--   drop extension if exists pgmq cascade;
--   -- MÄTT KANT (ADR-129 § Kontext): `drop extension pgmq cascade` lämnar
--   -- schemat `pgmq` KVAR, tomt. En avinstallation som inte droppar det
--   -- explicit ser ren ut utan att vara det:
--   drop schema if exists pgmq;
