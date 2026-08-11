-- TASK-201.1 — Aktivitetsloggens grund: activity_log-tabellen.
--
-- Deklarativ hemvist (Supabase CLI-standard, `supabase migration new`) — detta
-- ÄR den första Postgres-tabellen i projektet (`supabase/migrations/` existerade
-- inte innan denna fil; verifierat noll .sql-filer i repot vid mint). Denna
-- migration är RENT DISK — den appliceras INTE mot någon miljö här (varken
-- staging eller prod). Applicering + RLS-bevis är TASK-201.2s jobb.
--
-- Lagringsval: ADR-110 (Supabase `activity_log`, inte Airtable — append-only-
-- volymen mot Airtables radtak, enklare skrivväg, migrationsmotivet).
-- Korrelations-ID: ADR-111 (`requestId` är enda korrelations-ID:t, buret i
-- context.extensions — inget `trace_id`).
--
-- KOLUMNFORM ↔ STATEMENT-SHAPE (AC #5) — varje kolumn nedan speglar exakt ETT
-- fält (eller en projektion av ett fält) i `ActivityStatementSchema`
-- (`src/domain/schemas/ActivityStatement.schema.ts`). Tabellen bär BÅDA:
--   (a) det HELA xAPI-statementet, oavkortat, i `statement` (jsonb) — LRS-
--       fidelity: en framtida Passionslyftet-konsument (PRD `TASK-201`
--       användarberättelse #15) måste kunna återskapa exakt det statement som
--       emitterades, inte en lossy approximation av det.
--   (b) DEKOMPONERADE, indexerade kolumner för de faktiskt scopade läs-/
--       filtervägarna (hem-spalten + aktivitetshistorikens tidsordnade lista,
--       PRD § Vy-form; korrelations-story #13) — utan dem kräver varenda läsning
--       en jsonb-path-scan över hela tabellen.
-- Ingen kolumn här representerar ett fält `ActivityStatementSchema` INTE bär
-- (t.ex. `result`/`stored`/`authority`/`attachments`, se schemats egen
-- kommentar för varför de är utanför scope).

create table public.activity_log (
  -- statement.id — statementets egna UUID (producenten genererar den alltid
  -- själv, se schemats kommentar för `id`-fältet). Samma värde som PK här OCH
  -- i `statement->>'id'` — aldrig avvikande, en och samma identitet.
  id uuid primary key,

  -- statement.actor.name — svenskt visningsnamn ("Lotta", "Roger", "Marcus").
  actor_name text not null,
  -- statement.actor.account.name — Supabase auth-användarens UUID
  -- (`session.user.id`). MEDVETET ingen FOREIGN KEY mot auth.users: statements
  -- är xAPI-immutabla historiska fakta (PRD: "ingen radering") och får aldrig
  -- tappa fidelity om en användares auth-rad senare ändras/tas bort.
  actor_account_name uuid not null,

  -- statement.verb.id (IRI) + statement.verb.display['sv-SE'] (den svenska
  -- displaytexten — enda språket vi emitterar, se schemats LanguageMap-kommentar).
  verb_id text not null,
  verb_display text not null,

  -- statement.object.id (IRI, den SPECIFIKA entiteten — t.ex. en viss anmälan)
  -- + statement.object.definition.type (IRI, entitetens KATEGORI — t.ex. "en
  -- anmälan" i allmänhet; filterradens kategori-axel, PRD § Vy-form, byggs i
  -- en senare skiva TASK-201.8) + statement.object.definition.name['sv-SE'].
  object_id text not null,
  object_type text not null,
  object_name text not null,

  -- statement.context.extensions[<REQUEST_ID_EXTENSION_IRI>] — Fas A M7:s
  -- requestId, korrelations-story #13 (Marcus). Egen kolumn (inte bara
  -- jsonb-inbäddad i `statement`) eftersom felsökning mot serverloggarna är
  -- en direkt, namngiven läsväg — inte en hypotetisk framtida en.
  request_id uuid not null,

  -- statement.timestamp — den LOGISKA händelsetiden (när åtgärden faktiskt
  -- skedde, satt av klienten/EF:en). Skiljer sig avsiktligt från `created_at`
  -- (server-insert-tid) — de två kan divergera vid nätverksretry/klockskew.
  occurred_at timestamptz not null,

  -- Hela xAPI-statementet, oavkortat — se filhuvudets (a)-motiv.
  statement jsonb not null,

  -- Server-insert-tid. INTE en projektion av något statement-fält — ren
  -- infrastruktur-metadata, satt av databasen, aldrig av klienten.
  created_at timestamptz not null default now()
);

comment on table public.activity_log is
  'Aktivitetsloggen (xAPI-statements, ADR-110/ADR-111). Append-only — ingen '
  'UPDATE/DELETE-väg är avsedd (PRD TASK-201: "ingen radering"). Write ENDAST '
  'via service_role i en Edge Function (TASK-201.3); RLS nedan nekar '
  'anon/authenticated helt.';

comment on column public.activity_log.statement is
  'Hela xAPI-statementet (ActivityStatementSchema), oavkortat — LRS-fidelity '
  'för framtida re-export/konsumtion (PRD användarberättelse #15).';
comment on column public.activity_log.request_id is
  'Fas A M7-korrelations-ID:t (ADR-111). Speglar statement.context.extensions '
  'under REQUEST_ID_EXTENSION_IRI — egen kolumn för direkt felsökningssökning.';

-- Läsvägens index: reverse-kronologisk lista är den PRIMÄRA läsvägen för både
-- hem-spaltens "Senaste aktivitet" och den fulla aktivitetshistoriken (PRD §
-- Vy-form — båda ännu obyggda skivor, TASK-201.5/201.6/201.7, men den
-- kolumnen och dess sorteringsriktning är redan låst av statement-shapen).
create index activity_log_occurred_at_idx on public.activity_log (occurred_at desc);

-- Korrelations-sökningen (Marcus användarberättelse #13: "en post mot
-- serverloggarna vid felsökning") är en direkt equality-lookup på requestId.
create index activity_log_request_id_idx on public.activity_log (request_id);

-- Kategori-/objekt-filtrering (PRD § Vy-form filterrad) är INTE byggd än
-- (TASK-201.8) — inget index för object_type/verb_id läggs till spekulativt
-- här. Lägg till när den skivan faktiskt behöver det, mot en mätt query-plan.

-- RLS: deny-all för anon/authenticated, write endast via service_role.
alter table public.activity_log enable row level security;

-- Explicit REVOKE som försvar-i-djupled utöver RLS (Supabase projekt beviljar
-- som standard bordsrättigheter till anon/authenticated för nya public-tabeller
-- via ALTER DEFAULT PRIVILEGES; RLS med noll policies blockerar redan all
-- åtkomst för dessa roller — se https://supabase.com/docs/guides/database/postgres/row-level-security,
-- "no data will be accessible via the API ... until you create policies" —
-- men ett explicit REVOKE gör säkerhetsläget läsbart utan att behöva känna
-- till den RLS-mekaniken, och nekar redan vid GRANT-lagret, före RLS ens
-- utvärderas.
revoke all on public.activity_log from anon, authenticated;

-- Ingen policy skapas för anon/authenticated (medvetet — deny-all).
-- service_role kringgår RLS helt (Supabase-plattformens garanti) och behöver
-- därför ingen egen policy för att skriva/läsa.
