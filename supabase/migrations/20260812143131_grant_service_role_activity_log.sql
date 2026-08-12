-- TASK-201.2 — RLS-bevisets fynd: service_role saknade GRANT på activity_log.
--
-- ROTORSAK, mätt mot live staging (2026-08-12): `alter table ... enable row
-- level security` (201.1:s migration) gör att RLS-POLICIES evalueras, men
-- `service_role` bypassar policy-evalueringen redan via sitt roll-attribut
-- `rolbypassrls = true` (bekräftat: `select rolname, rolbypassrls from
-- pg_roles` — service_role/postgres = true, anon/authenticated = false).
-- BYPASSRLS är HELT SEPARAT från vanliga SQL-GRANT-rättigheter — Postgres
-- kräver ändå SELECT/INSERT/UPDATE/DELETE-grant för att en roll ska få röra
-- en tabell, oavsett RLS. `information_schema.table_privileges` visade
-- service_role hade REFERENCES/TRIGGER/TRUNCATE (ärvt via projektets
-- schema-default-privileges) men INTE SELECT/INSERT/UPDATE/DELETE — ett
-- PostgREST-anrop med service_role-nyckeln gav därför
-- `42501 permission denied for table activity_log`, samma felkod som
-- anon/authenticated men av en annan, oberoende orsak (grant, inte RLS).
--
-- FIX: explicit GRANT, medvetet BEGRÄNSAD till SELECT + INSERT — INTE
-- UPDATE/DELETE. `activity_log`s egen tabell-kommentar (201.1) säger redan
-- "Append-only — ingen UPDATE/DELETE-väg är avsedd" (PRD TASK-201: "ingen
-- radering"); att bara bevilja SELECT/INSERT gör det kravet strukturellt
-- sant på grant-nivå, inte bara en kod-konvention en framtida Edge Function
-- kan råka bryta. Samma försvar-i-djupled-anda som 201.1:s explicita
-- `revoke all ... from anon, authenticated` (kommentar där: gör
-- säkerhetsläget läsbart utan att behöva känna till RLS-mekaniken).
--
-- Konsekvens för verifiering/underhåll: UPDATE/DELETE mot tabellen (t.ex.
-- test-cleanup) kräver `postgres`-rollen — nås via
-- `supabase db query --linked` (Management API-proxy, inget DB-lösenord
-- krävs) eller dashboardens SQL-editor. service_role-nyckeln (som EF:erna
-- använder) kan därför ALDRIG radera eller ändra en emitterad statement-rad
-- — bara skapa nya och läsa.

grant select, insert on public.activity_log to service_role;

comment on table public.activity_log is
  'Aktivitetsloggen (xAPI-statements, ADR-110/ADR-111). Append-only — ingen '
  'UPDATE/DELETE-väg är avsedd (PRD TASK-201: "ingen radering"), strukturellt '
  'enforced sedan denna migration (service_role har enbart SELECT+INSERT-grant, '
  'se filhuvudet). Write ENDAST via service_role i en Edge Function '
  '(TASK-201.3); RLS nekar anon/authenticated helt (revoke all, 201.1).';
