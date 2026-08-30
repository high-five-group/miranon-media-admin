-- TASK-346.3 — Betalningsdomänens hem i Postgres: inbetalningar + kvittoledger
-- + kvittoserien.
--
-- STYRANDE BESLUT: ADR-128 (inbetalningen som sanning, Postgres som
-- lagringsyta, basen som app-skriven spegel). Prejudikat för formen
-- (Postgres-tabell + RLS + skrivning via Edge Function med `service_role`):
-- ADR-110 / `20260811211759_create_activity_log.sql`.
--
-- DENNA MIGRATION ÄR REN DISK. Den appliceras INTE av den agent som skrev
-- den (uppdragets B5-ordning): `db push` mot staging körs av orkestreraren
-- före armering. Ingen tabell, extension, kö eller cron-post har skapats via
-- `db query` av denna skiva.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- NAMNKONVENTION — SVENSKA IDENTIFIERARE, ASCII-TRANSKRIBERADE (bokfört val)
-- ═══════════════════════════════════════════════════════════════════════════
-- `activity_log` (repots enda tidigare Postgres-tabell) är engelsk rakt
-- igenom. Betalningsdomänen är svensk: ADR-128 beslut 1 namnger fälten på
-- svenska, ORDLISTA.md § Inbetalning kanoniserar termen, och Roger läser
-- posterna som verifikationer. Uppdraget till denna skiva föreskriver
-- svenska tabell-/kolumnnamn.
--
-- Diakritiker (å/ä/ö) är MEDVETET transkriberade till ASCII
-- (`betalsatt`, `ogonblicksbild_namn`, `aterbetalning`). Postgres tillåter
-- icke-ASCII i identifierare, men varje konsument nedströms betalar för
-- det: PostgREST URL-kodar dem (`betals%C3%A4tt`), `supabase-js`-anrop och
-- felmeddelanden blir svårlästa, och unquoted-identifierarnas
-- gemenversättning är locale-beroende för icke-ASCII. Kortets egen AC-text
-- skriver redan `betalsatt`. Den korrekta svenska stavningen bärs i stället
-- av `comment on column` nedan, där den är läsbar utan att vara ett
-- API-kontrakt.
--
-- `activity_log` byter INTE namn — den är i drift och utanför denna skivas
-- yta.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- BELOPP ÄR `numeric(12,2)` I KRONOR — inte flyttal, inte ören-heltal
-- ═══════════════════════════════════════════════════════════════════════════
-- PostgreSQL-dokumentationen (§ 8.1.2 Arbitrary Precision Numbers) säger det
-- rakt ut: `numeric` "is especially recommended for storing monetary amounts
-- and other quantities where exactness is required". `money`-typen avråds av
-- samma dokumentation (locale-beroende). Ören-heltal (Stripe-modellen) finns
-- till för språk utan decimaltyp — här sker aggregeringen i Postgres, som HAR
-- en. Kronor är dessutom enheten hela domänen talar (`Summa inbetalt (kr)` i
-- spegeln, ADR-128 beslut 5).
--
-- KONSUMENT-VARNING: PostgREST/supabase-js levererar `numeric` som STRÄNG,
-- inte som JS-number. Läs den som sträng och räkna aldrig med `parseFloat`
-- på pengar i klienten — summan som skrivs till spegeln kommer ur Postgres.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS-FORMEN — DIVERGENS MOT ADR-128 BESLUT 3, ÖPPET BOKFÖRD
-- ═══════════════════════════════════════════════════════════════════════════
-- ADR-128 beslut 3 skriver "deny-all för `anon` och `authenticated`" — ärvt
-- ordagrant från ADR-110:s form för aktivitetsloggen. Den formen är
-- OFÖRENLIG med ADR-129 beslut 8 (samma dags ADR): Realtime Postgres Changes
-- levererar bara rader som prenumeranten får SELECT:a under RLS. Med deny-all
-- för `authenticated` hade klienten aldrig fått en enda push, och
-- användarberättelse 10 ("se per rad om kvittot är skickat, väntar eller
-- misslyckades") fallit tyst — felet hade sett ut som en trasig prenumeration
-- i webbläsaren, precis det ADR-129 beslut 8 varnar för.
--
-- Kortets AC #3 löser motsägelsen åt andra hållet och är denna skivas
-- kontrakt, verbatim: "RLS: autentiserad admin läser; skrivning endast via
-- service_role". Denna migration följer AC #3 + ADR-129 beslut 8.
--
-- Varför `using (true)` och inte en admin-lista i RLS: självregistrering är
-- STÄNGD (`supabase/config.toml` [auth] `enable_signup = false`, ADR-092) —
-- varje `authenticated`-identitet i projektet är en INBJUDEN användare.
-- En finare gate hade krävt admin-listan som DATA i databasen, vid sidan av
-- `ADMIN_EMAILS` i Edge Function-env, alltså en andra sanning om vem som är
-- admin. Den frågan lämnas öppen och bokförd i stället för att avgöras här.
--
-- SKRIVVÄGEN är oförändrad mot ADR-128 beslut 3: ingen roll utom
-- `service_role` har INSERT/UPDATE/DELETE. `anon` har ingenting alls.

-- ───────────────────────────────────────────────────────────────────────────
-- 1. inbetalningar — en post per bankrad (ADR-128 beslut 1)
-- ───────────────────────────────────────────────────────────────────────────

create table public.inbetalningar (
  id uuid primary key default gen_random_uuid(),

  -- Bryggan till basen (ADR-128 beslut 6). MEDVETET ingen FOREIGN KEY —
  -- anmälan bor i Airtable, inte här. Formatkontrollen är det enda skydd
  -- som är möjligt, och den fångar den vanligaste felklassen (ett fältvärde
  -- i stället för ett record-ID) vid skrivningen i stället för i en vy.
  anmalan_record_id text not null,

  -- Ögonblicksbilden (ADR-128 beslut 1) — VERIFIKATIONSKRAVET, inte
  -- redundans: en bokföringspost måste kunna läsas ensam, år efter att
  -- anmälan ändrats eller tagits bort. Konsistensvakten (ADR-128 beslut 6)
  -- larmar på poster vars anmälan försvunnit; den byggs i TASK-346.4.
  ogonblicksbild_namn text not null,
  ogonblicksbild_event text not null,
  ogonblicksbild_eventdatum date,

  -- Kronor, negativt för en återbetalning. Se filhuvudet för typvalet.
  belopp numeric(12, 2) not null,

  betalsatt text not null,
  betalningsdatum date,
  typ text not null,

  status text not null default 'aktiv',
  makulerad_skal text,
  makulerad_nar timestamptz,

  -- Dubblettnyckeln vid Swish-/giroimport (TASK-346.10). Unik NÄR SATT —
  -- se det partiella unika indexet nedan.
  bankreferens text,

  -- Denormaliserad genväg till kvittot. Den BÄRANDE riktningen är
  -- `kvitton.inbetalning_id` (unik — det är den som gör dubbelskick
  -- strukturellt omöjligt, ADR-128 beslut 4). Denna kolumn finns för att
  -- kortets AC #1 kräver den och för att radvyn ska slippa en join.
  -- Skrivvägen (TASK-346.4) sätter båda i SAMMA operation; unikheten nedan
  -- gör att ett kvitto aldrig kan pekas ut från två inbetalningar.
  kvitto_id uuid,

  skapad_av text not null,
  skapad_nar timestamptz not null default now(),

  constraint inbetalningar_anmalan_record_id_form
    check (anmalan_record_id ~ '^rec[A-Za-z0-9]{14}$'),
  constraint inbetalningar_betalsatt_varden
    check (betalsatt in ('Swish', 'Bankgiro', 'Plusgiro', 'Historik')),
  constraint inbetalningar_typ_varden
    check (typ in ('inbetalning', 'aterbetalning')),
  constraint inbetalningar_status_varden
    check (status in ('aktiv', 'makulerad')),
  -- Ett nollbelopp är aldrig en inbetalning.
  constraint inbetalningar_belopp_ej_noll
    check (belopp <> 0),
  -- Tecknet BÄR typen (ADR-128 beslut 1: "positivt, eller negativt för en
  -- återbetalning"). Utan denna check kan de två gå isär tyst, och en
  -- återbetalning med positivt belopp hade ökat summan i stället för att
  -- minska den.
  constraint inbetalningar_tecken_foljer_typ
    check (
      (typ = 'inbetalning' and belopp > 0)
      or (typ = 'aterbetalning' and belopp < 0)
    ),
  -- Makulering KRÄVER skäl (ADR-128 beslut 1, PRD berättelse 17: "makulera
  -- en inbetalning med skäl"). Och en aktiv post får aldrig bära
  -- makuleringsspår — annars ser en återställd post makulerad ut i en vy
  -- som läser skälet.
  constraint inbetalningar_makulering_kraver_skal
    check (
      (status = 'makulerad' and makulerad_skal is not null and makulerad_nar is not null)
      or (status = 'aktiv' and makulerad_skal is null and makulerad_nar is null)
    )
);

comment on table public.inbetalningar is
  'Inbetalningar (ADR-128) — EN post per bankrad, sanningen om vad som '
  'betalats. Skrivning ENDAST via service_role i en Edge Function '
  '(TASK-346.4). `authenticated` läser (RLS-policy nedan, krävs av Realtime '
  'Postgres Changes, ADR-129 beslut 8); `anon` har ingenting. Airtable-basen '
  'bär en APP-SKRIVEN SPEGEL av summan — spegeln är en projektion, aldrig '
  'sanningen (ADR-128 beslut 6).';

comment on column public.inbetalningar.anmalan_record_id is
  'Anmälans record-ID i Airtable-basen (bryggan, ADR-128 beslut 6). Ingen FK '
  'är möjlig — anmälan bor i en annan databas.';
comment on column public.inbetalningar.ogonblicksbild_namn is
  'Ögonblicksbild: deltagarens namn vid registreringstillfället. '
  'Verifikationskravet — posten ska kunna läsas ensam (ADR-128 beslut 1).';
comment on column public.inbetalningar.ogonblicksbild_event is
  'Ögonblicksbild: eventets namn vid registreringstillfället.';
comment on column public.inbetalningar.ogonblicksbild_eventdatum is
  'Ögonblicksbild: eventets startdatum vid registreringstillfället.';
comment on column public.inbetalningar.belopp is
  'Belopp i KRONOR (numeric — exakt decimal, aldrig flyttal). Negativt '
  'belopp = återbetalning. PostgREST levererar numeric som sträng.';
comment on column public.inbetalningar.betalsatt is
  'Betalsätt (korrekt svensk stavning: betalsätt) — Swish, Bankgiro, '
  'Plusgiro eller Historik (backfill, ADR-128 beslut 8).';
comment on column public.inbetalningar.typ is
  'inbetalning eller aterbetalning (korrekt svensk stavning: återbetalning).';
comment on column public.inbetalningar.bankreferens is
  'Bankens transaktionsreferens — dubblettnyckeln vid import (PRD '
  'berättelse 20). Unik NÄR SATT, se inbetalningar_bankreferens_unik_idx.';
comment on column public.inbetalningar.kvitto_id is
  'Denormaliserad genväg till kvittot. Den bärande riktningen är '
  'kvitton.inbetalning_id (unik). Skrivs i samma operation av TASK-346.4.';
comment on column public.inbetalningar.skapad_av is
  'Visningsnamnet på den som registrerade posten (samma källa som '
  'activity_log.actor_name). Backfill skriver Historik-postens ursprung.';

-- Läsvägen: alla inbetalningar för EN anmälan (Åtgärds-panelen, anmälans
-- detaljvy, personkortet — PRD beslut 10). Den primära joinen mot basen.
create index inbetalningar_anmalan_idx
  on public.inbetalningar (anmalan_record_id);

-- Inkorgens tidsordning ("lördagens åtta", PRD beslut 2).
create index inbetalningar_betalningsdatum_idx
  on public.inbetalningar (betalningsdatum desc nulls last);

-- "Unik NÄR SATT" (AC #1) uttrycks som ett PARTIELLT unikt index — en
-- vanlig unique-constraint hade tillåtit obegränsat många NULL men krävt
-- en kolumn utan mening för de manuellt registrerade posterna.
create unique index inbetalningar_bankreferens_unik_idx
  on public.inbetalningar (bankreferens)
  where bankreferens is not null;

-- Ett kvitto kan aldrig pekas ut från två inbetalningar. Tillsammans med
-- kvitton.inbetalning_id (unik) ger detta en äkta 1:1-relation.
create unique index inbetalningar_kvitto_unik_idx
  on public.inbetalningar (kvitto_id)
  where kvitto_id is not null;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. kvitton — kvittoledgern (ADR-128 beslut 4, ADR-109 beslut 1)
-- ───────────────────────────────────────────────────────────────────────────

create table public.kvitton (
  id uuid primary key default gen_random_uuid(),

  ar integer not null,
  lopnummer integer not null,

  -- FORMATET ÄR EN DATABASGARANTI, inte en kodkonvention. ADR-109 beslut 1
  -- låser `MM-<år>-<löpnummer>`; en STORED generated column gör att formatet
  -- inte KAN drifta ifrån serien, och att ingen skrivväg kan sätta ett
  -- nummer som inte hör ihop med sitt (ar, lopnummer)-par.
  kvittonummer text
    generated always as ('MM-' || ar::text || '-' || lopnummer::text) stored,

  -- ADR-128 beslut 4: "En unik nyckel per inbetalning i kvittoledgern gör
  -- dubbelskick strukturellt omöjligt". Detta ÄR den garanti ADR-109
  -- beslut 2 behövde bevisa hermetiskt med ett samtidighetstest.
  -- `on delete restrict`: en inbetalning med kvitto kan aldrig raderas —
  -- den makuleras (PRD: "Radera före kvitto; makulera efter").
  inbetalning_id uuid not null unique
    references public.inbetalningar (id) on delete restrict,

  lagringsnyckel text,
  skickad_nar timestamptz,
  mottagare text,

  typ text not null,
  original_kvitto_id uuid references public.kvitton (id) on delete restrict,

  status text not null default 'utfardat',
  skapad_nar timestamptz not null default now(),

  constraint kvitton_ar_intervall
    check (ar between 2026 and 2999),
  constraint kvitton_lopnummer_golv
    check (lopnummer >= 1001),
  constraint kvitton_typ_varden
    check (typ in ('kvitto', 'kreditkvitto')),
  constraint kvitton_status_varden
    check (status in ('utfardat', 'skickat', 'makulerat')),
  -- Ett kreditkvitto hänvisar ALLTID till sitt original (ADR-128 § Kvittot,
  -- PRD berättelse 33: "kreditkvittot hänvisar till originalet, så att
  -- verifikationskedjan håller"); ett vanligt kvitto gör det aldrig.
  constraint kvitton_kreditkvitto_har_original
    check (
      (typ = 'kreditkvitto' and original_kvitto_id is not null)
      or (typ = 'kvitto' and original_kvitto_id is null)
    ),
  -- Ett skickat kvitto måste bära sitt utfall. Utan denna check kan en rad
  -- säga "skickat" utan mottagare eller sparad PDF — ett halvt utfall som
  -- ser helt ut (PRD berättelse 10, ADR-129 beslut 2).
  constraint kvitton_skickat_har_utfall
    check (
      status <> 'skickat'
      or (skickad_nar is not null and mottagare is not null and lagringsnyckel is not null)
    )
);

comment on table public.kvitton is
  'Kvittoledgern (ADR-128 beslut 4, ADR-109 beslut 1). Ett kvitto per '
  'inbetalning — unikheten på inbetalning_id gör dubbelskick strukturellt '
  'omöjligt. APPEND-ONLY FÖR IDENTITETEN: service_role har INSERT + SELECT '
  'plus en KOLUMN-SCOPAD UPDATE på utfallskolumnerna (lagringsnyckel, '
  'skickad_nar, mottagare, status) och ALDRIG DELETE — numret, året, '
  'löpnumret, kopplingen och typen kan därför aldrig ändras efter '
  'utfärdandet. Se grant-blocket nedan.';

comment on column public.kvitton.kvittonummer is
  'MM-<år>-<löpnummer> (ADR-109 beslut 1) — GENERERAD kolumn, kan inte '
  'skrivas. Formatet är en databasgaranti, inte en kodkonvention.';
comment on column public.kvitton.lopnummer is
  'Löpnumret ur årets sekvens, allokerat av public.allokera_kvittonummer(). '
  'Hål i serien är en accepterad konsekvensklass (ADR-128 beslut 4, ADR-109 '
  '§ Öppna punkter): ett nummer som aldrig blev ett kvitto återanvänds '
  'aldrig.';
comment on column public.kvitton.lagringsnyckel is
  'Nyckeln till den sparade PDF:en i den privata bucketen (Miranon Medias '
  'egen verifikation, SFL 39 kap. 5 §). Byggs av TASK-346.5.';
comment on column public.kvitton.original_kvitto_id is
  'Kreditkvittots hänvisning till originalkvittot (verifikationskedjan).';

-- Seriens invariant OCH "högsta i år"-uppslaget i ett index.
create unique index kvitton_ar_lopnummer_unik_idx
  on public.kvitton (ar, lopnummer);

-- Uppslagsvägen "vad skickade vi till Bengt?" (PRD berättelse 12) går på
-- numret. Unik: kvittonummer är en injektiv funktion av (ar, lopnummer), så
-- indexet vaktar samma invariant från andra hållet.
create unique index kvitton_kvittonummer_unik_idx
  on public.kvitton (kvittonummer);

-- Den denormaliserade genvägen får sin FK först här — kvitton måste
-- existera innan inbetalningar kan referera den.
alter table public.inbetalningar
  add constraint inbetalningar_kvitto_fk
  foreign key (kvitto_id) references public.kvitton (id) on delete set null;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Kvittoserien — golv per miljö + atomär allokering per år
-- ───────────────────────────────────────────────────────────────────────────
--
-- ADR-128 beslut 4: "en sekvens per år i Postgres ... Sekvensen startar
-- efter det högsta befintliga numret i respektive miljö — prod bär 0 kvitton
-- ... staging bär max MM-2026-1002 ... så staging startar på 1003."
--
-- MIGRATIONEN KAN INTE VETA VILKEN MILJÖ DEN KÖR I, och den befintliga
-- ledgern ligger i AIRTABLE — Postgres kan inte läsa den. Startvärdet är
-- alltså DATA, inte schema. Golvtabellen nedan bär det per år, och
-- allokeraren är FAIL-CLOSED: saknas golvet för året kastar den i stället
-- för att gissa 1001. En glömd seed ger då ett tydligt fel vid första
-- kvittot — aldrig en tyst kollision med den gamla Airtable-serien.
--
-- Seedning: staging = ett `insert` av orkestreraren efter `db push`
-- (kommandot står i PR-kroppen); prod = ett namngivet steg i prod-runbooken
-- (TASK-346.11), där golvet är 1001 eftersom prod-ledgern är tom (mätt
-- read-only 2026-08-30, ADR-128 beslut 4).

create table public.kvittoserie_golv (
  ar integer primary key,
  forsta_lopnummer integer not null,
  motivering text not null,
  seedad_nar timestamptz not null default now(),

  constraint kvittoserie_golv_ar_intervall
    check (ar between 2026 and 2999),
  -- ADR-109 beslut 1: serien börjar på 1001 per år. Ett golv under det
  -- vore ett nummer utanför den låsta serien.
  constraint kvittoserie_golv_minst_start
    check (forsta_lopnummer >= 1001)
);

comment on table public.kvittoserie_golv is
  'Kvittoseriens STARTVÄRDE per år och miljö (ADR-128 beslut 4). Golvet är '
  'DATA, inte schema — den befintliga ledgern ligger i Airtable och kan '
  'inte läsas härifrån. public.allokera_kvittonummer() är fail-closed mot '
  'ett saknat golv: den kastar hellre än gissar 1001 och kolliderar med '
  'den gamla serien.';

comment on column public.kvittoserie_golv.forsta_lopnummer is
  'FÖRSTA löpnumret årets sekvens ska dela ut — alltså högsta befintliga + '
  '1 (staging: 1002 + 1 = 1003; prod: tom ledger ⇒ 1001).';
comment on column public.kvittoserie_golv.motivering is
  'Varför golvet är just detta, med mätningen bakom. Läses av den som '
  'undrar varför prod och staging skiljer sig.';

create or replace function public.allokera_kvittonummer(p_ar integer)
returns table (kvittonummer text, ar integer, lopnummer integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_golv integer;
  v_sekvensnamn text;
  v_lopnummer bigint;
begin
  if p_ar is null or p_ar < 2026 or p_ar > 2999 then
    raise exception 'kvittoserie: ogiltigt ar %', p_ar
      using errcode = '22023';
  end if;

  select g.forsta_lopnummer
    into v_golv
    from public.kvittoserie_golv g
   where g.ar = p_ar;

  -- FAIL-CLOSED. Se tabellkommentaren ovan: att gissa 1001 i en miljö vars
  -- gamla Airtable-serie redan nått 1002 hade gett två kvitton med samma
  -- nummer i Rogers bokföring.
  if v_golv is null then
    raise exception
      'kvittoserie: golv saknas for ar % — seeda public.kvittoserie_golv innan kvitton utfardas',
      p_ar
      using errcode = 'P0002';
  end if;

  v_sekvensnamn := 'kvittoserie_' || p_ar::text;

  -- Lazy skapelse: en sekvens PER ÅR utan att migrationen behöver gissa
  -- vilka år som kommer. `if not exists` gör satsen idempotent; att två
  -- allokeringar skulle nå hit samtidigt är designat bort av ADR-129
  -- beslut 9 (numren allokeras sekventiellt inom en jobbkörning).
  --
  -- Golvet läses BARA när sekvensen skapas. Ändras golvet efteråt får det
  -- ingen effekt — det är avsikten: golvet är en startpunkt, inte en
  -- löpande sanning som får flytta en serie som redan delats ut.
  -- SKAPANDET OCH REVOKEN KÖRS EN GÅNG PER ÅR, inte en gång per kvitto.
  --
  -- SEKVENSEN ÄRVER DEFAULT-GRANTARNA — samma mätning som funktions-revoken
  -- längre ned vilar på: `pg_default_acl` i `public` bär objtyp 'S' med
  -- {postgres=rwU, anon=rwU, authenticated=rwU, service_role=rwU} satt av
  -- `supabase_admin` (r = SELECT, w = UPDATE, U = USAGE). En sekvens som
  -- skapas här får alltså USAGE till anon/authenticated, och USAGE räcker
  -- för `nextval` — en klient hade kunnat bränna kvittonummer förbi
  -- allokeraren, trots att allokeraren själv är låst. Revoken måste därför
  -- ligga HÄR och inte i migrationens grant-block: sekvenserna skapas
  -- lazily, ett år i taget, långt efter att migrationen kört.
  --
  -- VARFÖR HELA PARET LIGGER I EN `to_regclass`-GREN: en `revoke` är en
  -- katalog-UPDATE på `pg_class.relacl`, och PostgreSQL tar bara
  -- AccessShareLock på målobjektet i `aclchk.c`. Kördes revoken ovillkorligt
  -- skulle VARJE kvitto skriva om katalograden, och två samtidiga
  -- allokeringar kunde falla på `tuple concurrently updated`. Grenen gör
  -- katalogskrivningen till en engångshändelse per år.
  --
  -- Att `to_regclass` är säker som villkor är STRUKTURELLT, inte statistiskt:
  -- sekvensen kan bara skapas av denna funktion, och create + revoke ligger
  -- i SAMMA transaktion. Rullar den tillbaka försvinner båda tillsammans —
  -- en skapad men o-revokad sekvens kan alltså aldrig persisteras och sedan
  -- hoppas över av en senare körning.
  --
  -- ACCEPTERAD RACE, en gång per år: två samtidiga FÖRSTA allokeringar för
  -- ett nytt år kan båda ta grenen. `if not exists` gör den enas create till
  -- en no-op, och de kan kollidera på revoken — transaktionen rullar då
  -- tillbaka rent FÖRE `nextval`, så inget nummer bränns och jobbmotorns
  -- svep plockar upp raden igen. Accepterad, inte designad bort: ADR-129
  -- beslut 9 allokerar ändå sekventiellt inom en jobbkörning.
  if to_regclass('public.' || quote_ident(v_sekvensnamn)) is null then
    execute format(
      'create sequence if not exists public.%I as bigint start with %s minvalue %s no cycle',
      v_sekvensnamn, v_golv, v_golv
    );
    execute format('revoke all on sequence public.%I from anon, authenticated', v_sekvensnamn);
  end if;

  execute format('select nextval(%L)', 'public.' || quote_ident(v_sekvensnamn))
     into v_lopnummer;

  return query
    select ('MM-' || p_ar::text || '-' || v_lopnummer::text)::text,
           p_ar,
           v_lopnummer::integer;
end;
$$;

comment on function public.allokera_kvittonummer(integer) is
  'Allokerar NÄSTA löpnummer ur årets sekvens och returnerar det färdiga '
  'kvittonumret (ADR-128 beslut 4). Atomär via nextval — ADR-109 beslut 2:s '
  'läs-verifiera-retry-protokoll behövs inte längre i Postgres. '
  'security definer: anroparen behöver inga rättigheter på sekvensobjekten. '
  'EXECUTE är revokad från PUBLIC och beviljad ENDAST service_role — '
  'allokeringen är server-side, uteslutande (ADR-109 beslut 4).';

-- ───────────────────────────────────────────────────────────────────────────
-- 4. RLS + GRANT — tillsammans, aldrig RLS ensamt
-- ───────────────────────────────────────────────────────────────────────────
--
-- RLS-lagret och GRANT-lagret är OBEROENDE (activity_log-prejudikatet,
-- 20260812143131:s filhuvud: `service_role` bär rolbypassrls = true men
-- behöver ändå ett explicit GRANT för att röra tabellen alls). Båda sätts
-- här, i den ordningen.

alter table public.inbetalningar enable row level security;
alter table public.kvitton enable row level security;
alter table public.kvittoserie_golv enable row level security;

-- Nollställ först. Supabase-projekt beviljar som standard bordsrättigheter
-- till anon/authenticated för nya public-tabeller via ALTER DEFAULT
-- PRIVILEGES; utan detta revoke hade `authenticated` fått INSERT/UPDATE/
-- DELETE gratis, och RLS-policyn nedan (som bara täcker SELECT) hade inte
-- hindrat det.
revoke all on public.inbetalningar from anon, authenticated;
revoke all on public.kvitton from anon, authenticated;
revoke all on public.kvittoserie_golv from anon, authenticated;

-- `anon` får INGENTING — inte ens läsning. Ingen policy skapas för den.

-- `authenticated` läser, aldrig skriver. Se filhuvudets RLS-avsnitt för
-- varför läsningen är öppen (Realtime-kravet) och varför `using (true)`
-- är rätt gate i ett projekt utan självregistrering.
grant select on public.inbetalningar to authenticated;
grant select on public.kvitton to authenticated;

create policy inbetalningar_las_authenticated
  on public.inbetalningar for select to authenticated
  using (true);

create policy kvitton_las_authenticated
  on public.kvitton for select to authenticated
  using (true);

-- kvittoserie_golv är INFRASTRUKTUR, inte domändata. Ingen klient har
-- ärende till den och ingen Realtime-konsument läser den — den får därför
-- ingen SELECT-policy alls (deny-all, activity_log-formen).

-- service_role — skrivvägen. Kringgår RLS via rolbypassrls, men behöver
-- GRANT för varje operation.
grant select, insert, update, delete on public.inbetalningar to service_role;

-- APPEND-ONLY FÖR IDENTITETEN (AC #3: "grant-form dokumenterad (append-only
-- för kvitton)"). Ett kvitto får aldrig raderas och dess IDENTITET aldrig
-- ändras — men dess UTFALL måste kunna skrivas: numret allokeras och
-- PDF:en genereras innan mailet går, och en makulerad inbetalnings kvitto
-- märks efteråt (ADR-128: "kvittot består, märkt makulerat").
--
-- Kolumn-scopad UPDATE gör exakt den gränsen strukturellt sann i stället
-- för en kod-konvention en framtida Edge Function kan råka bryta — samma
-- försvar-i-djupled-anda som activity_log:s SELECT+INSERT-begränsning.
-- Utanför listan (alltså OÄNDERBARA): id, ar, lopnummer, kvittonummer,
-- inbetalning_id, typ, original_kvitto_id, skapad_nar.
grant select, insert on public.kvitton to service_role;
grant update (lagringsnyckel, skickad_nar, mottagare, status)
  on public.kvitton to service_role;

-- Golvtabellen läses av allokeraren (security definer, kör som ägaren) och
-- seedas per miljö av en människa via postgres-rollen. service_role behöver
-- bara kunna LÄSA den för diagnos — aldrig skriva den.
grant select on public.kvittoserie_golv to service_role;

-- TVÅ REVOKES KRÄVS, INTE EN — mätt, inte antaget (2026-08-30, staging).
-- `pg_default_acl` i schemat `public` bär, satt av `supabase_admin`:
--   objtyp 'f' (funktioner): {postgres=X, anon=X, authenticated=X, service_role=X}
-- `X` är EXECUTE, och det är ett EXPLICIT ROLL-GRANT — inte PUBLIC. En
-- `revoke ... from public` rör det därför INTE: varje ny funktion i `public`
-- är anropbar av `anon` och `authenticated` via PostgREST-RPC tills de två
-- rollerna revokas VID NAMN.
--
-- Det är exakt samma tvålagersform som tabellerna ovan redan följer (deras
-- rad i samma katalog är objtyp 'r' med `arwdDxtm` till samma fyra roller,
-- vilket är varför `revoke all on ... from anon, authenticated` står där).
-- Utan raden nedan hade varje inloggad användare kunnat bränna kvittonummer
-- ur bokföringsserien — allokeringen är server-side, UTESLUTANDE (ADR-109
-- beslut 4).
revoke execute on function public.allokera_kvittonummer(integer) from public;
revoke execute on function public.allokera_kvittonummer(integer) from anon, authenticated;
grant execute on function public.allokera_kvittonummer(integer) to service_role;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Realtime-publikationen (ADR-129 beslut 8)
-- ───────────────────────────────────────────────────────────────────────────
--
-- `supabase_realtime` har puballtables = false (mätt 2026-08-30 i staging,
-- ADR-129 § Kontext, ommätt av denna skiva). Utan denna rad får klienten
-- ALDRIG en push, och felet ser ut som en trasig prenumeration i
-- webbläsaren. `kvitton` ingår MEDVETET inte — kortets AC #3 namnger
-- "jobb- och inbetalningstabeller", och kvittots synliga tillstånd bärs av
-- jobbraden (TASK-346.4:s vy läser kvittot när raden tickar).

alter publication supabase_realtime add table public.inbetalningar;

-- ═══════════════════════════════════════════════════════════════════════════
-- NEDÅT (dokumenterad, INTE en down-migration — Supabase CLI har ingen)
-- ═══════════════════════════════════════════════════════════════════════════
--   alter publication supabase_realtime drop table public.inbetalningar;
--   drop function if exists public.allokera_kvittonummer(integer);
--   drop table if exists public.kvitton cascade;      -- FK från inbetalningar
--   drop table if exists public.inbetalningar cascade;
--   drop table if exists public.kvittoserie_golv;
--   -- Sekvenserna skapas LAZILY av allokeraren och städas inte av ovan:
--   -- do $$ declare s record; begin
--   --   for s in select sequencename from pg_sequences
--   --     where schemaname = 'public' and sequencename like 'kvittoserie\_%'
--   --   loop execute format('drop sequence public.%I', s.sequencename); end loop;
--   -- end $$;
