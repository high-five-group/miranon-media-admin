# supabase/migrations/

Deklarativ hemvist för Postgres-schemat (Supabase CLI-standard,
`supabase migration new`) — **inte** samma mekanism som Airtables
`create-*-table.mjs`-skript. Se `docs/decisions/ADR-110.md` för lagringsvalet
och den enskilda migrationsfilens huvud för varje tabells motiv.

## Applicera mot staging (TASK-199-klassen: dokumentera vägen, gissa den aldrig)

Två separata steg — **länka**, sedan **push**. Ingen av dem kräver
databas-LÖSENORDET (skiljt från Supabase CLI-INLOGGNINGEN, se nästa avsnitt).

```bash
echo "" | npx supabase link --project-ref pqtshyierkdgwdnxuirz
npx supabase db push
```

**Varför `echo "" |`:** körd interaktivt utan styrd stdin frågar `link` efter
databas-LÖSENORDET (en prompt, inte ett login-flöde) och HÄNGER i en headless
agent-miljö utan TTY. Ett tomt svar besvaras direkt — `link` behöver bara
projekt-referensen för att skriva `supabase/.temp/project-ref`; själva
schema-operationerna (`db push`, `migration list`,
`inspect db table-stats --linked`, `db query --linked`) går via Supabase
**Management API** (CLI:ts egen inloggning, se nästa stycke), inte en direkt
`postgres://`-anslutning — därför krävs aldrig ett databas-lösenord för någon
av kommandona i denna fil.

**Verifiera alltid vilket projekt du är länkad mot INNAN en skarp operation**
(`cat supabase/.temp/project-ref` eller läs `project_ref` i `link`-svaret).
Staging är `pqtshyierkdgwdnxuirz`. Prod (`lvjsfnphlauldxqlncpl`) skrivs ALDRIG
till av en agent.

### Förutsättning: Supabase CLI-inloggning

Kommandona ovan förutsätter att `npx supabase` redan har en giltig
Management API-inloggning. På en interaktiv utvecklarmaskin sker den EN gång
via `supabase login` och lagras i macOS-nyckelringen (posten "Supabase CLI",
konto "supabase") — CLI:t läser den själv, ingen `SUPABASE_ACCESS_TOKEN` i
miljön behövs. En körning UTAN denna inloggning (t.ex. en CI-runner eller en
färsk maskin) misslyckas snabbt och rent på `db push`:

```json
{"code":"LegacyProjectNotLinkedError","message":"Cannot find project ref. Have you run supabase link?"}
```

— vilket är en annan felklass än ett hängande `link` (se ovan): ETT rent fel
betyder "logga in eller länka", ETT häng utan utskrift betyder "stdin är
obesvarad, styr den".

### Verifiera appliceringen (mot den LEVANDE miljön, aldrig antaget ur exit 0)

```bash
npx supabase migration list                      # local === remote per fil
npx supabase inspect db table-stats --linked      # tabellen + dess index existerar
```

### Diagnostik/reparation vid behov (Management API, inget lösenord)

```bash
npx supabase db query --linked "<valfri SQL>"
```

Körs som `postgres`-rollen via Management API-proxyn — INTE `service_role`.
Detta är den enda vägen att t.ex. städa en test-rad ur `activity_log` (se
nästa avsnitt): `service_role` har medvetet ingen DELETE-rättighet.

## activity_log — RLS + GRANT tillsammans, inte RLS ensamt

`20260811211759_create_activity_log.sql` sätter `enable row level security`
+ ett explicit `revoke all ... from anon, authenticated`. Det räcker för att
neka anon/authenticated — men det räcker INTE ensamt för att `service_role`
ska kunna skriva. Mätt live mot staging (TASK-201.2, 2026-08-12): ett
PostgREST-anrop med en giltig `service_role`-nyckel gav
`403 permission denied for table activity_log` tills en andra migration,
`20260812143131_grant_service_role_activity_log.sql`, la till ett explicit
`grant select, insert on public.activity_log to service_role`.

**Rotorsak:** `service_role` bär `rolbypassrls = true` (bekräftat via
`select rolname, rolbypassrls from pg_roles`) — den hoppar över
RLS-POLICY-evaluering helt. Men BYPASSRLS är ett annat lager än vanliga
SQL-GRANT-rättigheter: Postgres kräver ändå SELECT/INSERT/UPDATE/DELETE-grant
för att en roll ska få röra en tabell, RLS eller ej. Ett nytt projekts
schema-default-privileges gav `service_role` REFERENCES/TRIGGER/TRUNCATE på
den nyskapade tabellen, men aldrig SELECT/INSERT/UPDATE/DELETE — samma
felkod (`42501`) som RLS-nekandet, men en helt annan orsak. Läs
grant-migrationens filhuvud för den fulla utredningen.

**Designval, medvetet:** grantet är begränsat till SELECT + INSERT — ALDRIG
UPDATE/DELETE. `activity_log`s tabell-kommentar säger redan "append-only,
ingen radering" (PRD `TASK-201`); att hålla UPDATE/DELETE utanför
`service_role`s grant gör det kravet strukturellt sant (verifierat live: en
`PATCH`/`DELETE` mot en rad skriven av `service_role` gav båda `403`), inte
bara en kod-konvention en framtida Edge Function kan råka bryta.

**Konsekvens för test/underhåll:** en `service_role`-skriven rad kan ALDRIG
tas bort via `service_role`-nyckeln (det är avsikten). Cleanup av en
tillfällig test-/probe-rad sker via `npx supabase db query --linked "delete
from public.activity_log where id = '<uuid>'"` (postgres-rollen, se ovan) —
aldrig via ett committat, rutinmässigt körande test som skriver via
`service_role`, eftersom ett sådant test inte kan städa efter sig och skulle
lämna permanenta skräprader i staging vid varje CI-körning.

### RLS-beviset — vad som är committat kontra manuellt verifierat

`tests/api/activity-log-rls.staging.test.ts` är CI-committat och täcker
anon+authenticated-halvan (läsning OCH skrivning, båda nekade) med de
befintliga `TEST_SUPABASE_ANON_KEY`/`TEST_USER_*`-secrets som redan finns i
CI. `service_role`-halvan ("skrivning går igenom", "UPDATE/DELETE nekas") är
INTE ett committat test — `SUPABASE_SERVICE_ROLE_KEY` är ingen CI-secret
(samma gap som
`docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md`
redan dokumenterade för `invite-user`), och som ovan förklarat skulle ett
rutinmässigt körande insert-test dessutom lämna permanent skräp i staging.
Den halvan är i stället verifierad LIVE, en gång, mot skarp staging
(TASK-201.2, 2026-08-12) med omedelbar städning — samma
"hämta-engångs-nyckeln-kör-kasta"-mönster som
`scripts/provision-attachments-bucket.mjs`s filhuvud beskriver:

```bash
SUPABASE_URL="https://pqtshyierkdgwdnxuirz.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="$(npx supabase projects api-keys \
  --project-ref pqtshyierkdgwdnxuirz -o json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      const k=JSON.parse(s).find(k=>k.name==="service_role"||k.id==="service_role");
      process.stdout.write(k.api_key);
    })')" \
  # ... POST/PATCH/DELETE mot $SUPABASE_URL/rest/v1/activity_log med
  # apikey/Authorization satta till $SUPABASE_SERVICE_ROLE_KEY
```

Utfall (fullständig mätning i backlog-kortets Implementation Notes):
INSERT → `201`; en efterföljande PATCH/DELETE mot samma rad → båda `403`;
raden lästes tillbaka via `service_role` (bekräftar synlighet), var
osynlig för anon/authenticated trots att den existerade, och städades sist
via `db query --linked` (postgres-rollen, inte `service_role`).
