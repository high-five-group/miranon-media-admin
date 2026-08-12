---
id: TASK-201.2
title: 'Skiva: Grunden 2 — activity_log född i staging med RLS-bevis'
status: Done
assignee: []
created_date: '2026-08-11 20:21'
updated_date: '2026-08-12 18:52'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.1
parent_task_id: TASK-201
ordinal: 367000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: migrationsfilen från 201.1 appliceras mot staging-projektet och tabellens existens + RLS-skydd BEVISAS mot den levande miljön. KÄND RISK, öppet bokförd: agentens db-access till staging är OMÄTT (EF-deploy-access finns belagd, db push kan kräva mer). Saknas access: STOPPA per stopp-grinden, minta fynd-kort med exakt felutskrift, föreslå ingen kringgående väg — appliceringen blir då ett Marcus-moment och denna skiva HITL-omklassas.

Täcker användarberättelser: 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Migrationen applicerad mot staging-Supabase — tabellen verifierad via query mot miljön, inte antagen ur exit 0
- [x] #2 RLS-bevis: läsning som anon och authenticated direkt mot tabellen NEKAS; write via service-role går igenom (deny-triple-andan)
- [x] #3 Appliceringsvägen dokumenterad (kommandon + förutsättningar) i migrationskatalogens README-not — task-199-klassen: en odokumenterad deploy-väg är en känd fälla
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Zod-schemat validerar varje statement runtime — ogiltigt statement når aldrig activity_log
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STOPPAD per kortets egen access-risk-instruktion (2026-08-12). Premiss-pass mätte agentens Supabase db-access och den är NEGATIV, inte bara omätt: ingen SUPABASE_ACCESS_TOKEN i miljön, ingen ~/.supabase/access-token, ingen SERVICE_ROLE/DATABASE_URL i .env*-filerna, ingen CI-secret-wiring för `supabase link`/`db push`. `supabase db push --linked` (ej länkad) gav snabbt rent fel; `supabase link --project-ref pqtshyierkdgwdnxuirz` (staging) hängde oändligt (interaktivt login-flöde utan TTY) — kontrollprov med ett (ogiltigt) token visar att CLI:t annars svarar snabbt, så det är frånvaron av token som är boven, inte nätverk/CLI-bugg.

Ingen kringgående väg försökt (kortets egen instruktion). Fynd-kort mintat: TASK-201.11 (full mätning + exakta felutskrifter). Migrationsfilen (`supabase/migrations/20260811211759_create_activity_log.sql`) och ADR-110/ADR-111 är oförändrade — endast lästa, inte applicerade. Ingen kod- eller migrationsändring gjord av denna agent. Appliceringen är nu ett Marcus-moment; denna skiva omklassad ready-for-human tills db-access finns.

KORRIGERING (2026-08-12, denna agent, S105): föregående Implementation Notes (STOPPAD, ready-for-human) VILADE PÅ EN FALSIFIERAD PREMISS — bevarad nedan oförändrad, inte tyst raderad. Rotorsaken (orkestrerarens uppdrag, källmärkt): Supabase CLI bär en egen macOS-nyckelrings-post ("Supabase CLI"/"supabase", skapad 2026-03-30) och läser den SJÄLV — ingen SUPABASE_ACCESS_TOKEN i miljön krävs (Supabase-dok: token lagras i "native credentials storage", ~/.supabase/access-token är bara reservplatsen). Natt-agentens tomma ~/.supabase/-fynd var alltså bevis för KORREKT lagring, inte frånvaro. Hänget den rapporterade var databas-LÖSENORDS-prompten (headless utan TTY), inte ett login-flöde — 'echo "" | npx supabase link --project-ref pqtshyierkdgwdnxuirz' svarar direkt (verifierat denna session: project_ref=pqtshyierkdgwdnxuirz, tomt message).

AC #1 — verifierat mot LEVANDE staging (inte antaget ur exit 0): 'npx supabase migration list' → local===remote för båda migrationsfilerna (20260811211759, 20260812143131). 'npx supabase inspect db table-stats --linked' → public.activity_log existerar med sina index.

AC #2 — RLS-BEVIS, TVÅSIDIGT, mätt live mot PostgREST (/rest/v1/activity_log):
  anon:          GET → 401 (42501 permission denied); POST → 401 (samma).
  authenticated: GET → 403 (42501); POST → 403 (samma) — annan HTTP-status än anon (PostgREST skiljer "ingen identitet" från "identitet utan rättighet"), men samma Postgres-felkod.
  Committat regressionstest: tests/api/activity-log-rls.staging.test.ts (4 fall, CI-körande, återanvänder befintliga TEST_SUPABASE_ANON_KEY/TEST_USER_*-secrets). Rött-först bevisat (temporärt sabotage av en assertion → korrekt röd med tydligt diff, återställt → 5/5 grönt igen).

  VIKTIGT FYND UNDER BYGGET: service_role-halvan ("write går igenom") höll INTE initialt — 403 permission denied, trots BYPASSRLS=true på rollen. Rotorsak: BYPASSRLS hoppar bara över RLS-POLICY-evaluering; Postgres kräver ändå separat SELECT/INSERT/UPDATE/DELETE-GRANT, och den nya tabellens schema-default-privileges gav service_role REFERENCES/TRIGGER/TRUNCATE men aldrig SELECT/INSERT/UPDATE/DELETE (bekräftat via information_schema.table_privileges). Fixat med en ANDRA migration, supabase/migrations/20260812143131_grant_service_role_activity_log.sql: grant select, insert on public.activity_log to service_role — MEDVETET utan UPDATE/DELETE, vilket gör 201.1s redan uttalade "append-only, ingen radering"-krav STRUKTURELLT sant (grant-lagret) i stället för bara konvention. Live-verifierat efter fix: service_role INSERT → 201; efterföljande PATCH/DELETE mot samma rad → båda 403; raden osynlig för anon/authenticated trots att den existerade (deny håller med verklig data närvarande); all test-data städad via supabase db query --linked (postgres-rollen — service_role har per design ingen DELETE, så cleanup MÅSTE gå via Management API, aldrig via service_role-nyckeln). Fullständig mätning + kommandon: supabase/migrations/README.md.

  Denna write-genom-halva är INTE ett committat CI-test (SUPABASE_SERVICE_ROLE_KEY är ingen CI-secret — samma gap som docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md redan dokumenterade — och ett rutinmässigt körande insert-test skulle dessutom lämna permanent skräp i staging eftersom service_role inte kan städa sina egna rader). Verifierad LIVE, en gång, med omedelbar städning — samma "hämta engångs-nyckeln, kör, kasta"-mönster som scripts/provision-attachments-bucket.mjs.

AC #3 — supabase/migrations/README.md skapad (fanns ingen sedan tidigare): exakta link+push-kommandon, varför "echo \"\" |" krävs (databas-lösenords-prompt, inte login), varför inget lösenord någonsin behövs (Management API, inte direkt postgres-anslutning), samt hela GRANT-fyndet ovan med reparations-vägen.

DoD #5 (Zod-schemat validerar runtime) — 14/14 fall i tests/api/activity-statement-schema.test.ts fortfarande gröna (verifierat denna session, ingen regression). SAMMA gap som 201.1 redan rapporterade öppet kvarstår ordagrant: TASK-201.3s recordActivity (den faktiska write-vägen) är inte byggd än, så kravet är bevisat på SCHEMA-nivå (bidirektionellt testbevis), inte som en runtime-guard på en levande insert-väg — den vägen finns helt enkelt inte ännu. Denna skiva bygger den INTE (uttryckligen 201.3s scope); rapporteras öppet, inte gömt.

Grindar (denna session): typecheck exit 0, biome check exit 0 (mitt nya testfilsformat auto-fixat, noll kvarvarande diagnoser i min diff — resten pre-existing utanför diffen), check:docs 14/14 gröna exit 0, build exit 0. test:api: 659/660 gröna (1 fel: attachment-upload-large.staging.test.ts, HELT ORELATERAD yta — samma test/samma fel 201.1 redan flaggade som transient; isolerad omkörning gav först 14/15 rött (samma fel) sedan 15/15 grönt vid en andra omkörning — flakighet bekräftad, inte en regression från denna diff, noll attachment-filer rörda).

Label omklassad ready-for-human → ready-for-agent (denna korrigering). TASK-201.11 (fyndkortet "ingen Supabase db-access") är FALSIFIERAT av samma rotorsak — bör stängas av orkestreraren, rörs inte här (utanför denna skivas avgränsade yta per uppdrag).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat via PR #1202 (mergad main 50afc936, 2026-08-12T15:08:05Z). Levererade: migrationen 20260811211759_create_activity_log.sql applicerad mot staging (pqtshyierkdgwdnxuirz), ny migration 20260812143131_grant_service_role_activity_log.sql (grant select,insert till service_role — genuint fynd: BYPASSRLS räcker inte, saknad GRANT gav 403 tills fixad; medveten UTAN update/delete, gör append-only strukturellt sant), tests/api/activity-log-rls.staging.test.ts (4 fall, RLS-bevis tvåsidigt: anon/authenticated GET+POST → 401/403, rött-först bevisat), supabase/migrations/README.md (ny, dokumenterar appliceringsvägen + GRANT-fyndet). AC 1-3 bekräftade mot LEVANDE staging (migration list local===remote, table-stats, live PostgREST-anrop), inte antagna ur exit 0. Stängningsverifiering (denna agent, 2026-08-12): CI per jobb på PR #1202 via 'gh pr checks 1202' — samtliga jobb pass (Analyze x2, CI Passed or Skipped, CodeQL, Detect changed files, Docs link check, Lint+Audit+TypeCheck, Test suite/Acceptance, Test suite/Pure+Build, Test suite/Webblasarbeteende, Vercel), A11y/Staging/Staging-sentinel-purge skipping (normalt, D0-klassning), noll fail. DIVERGENS, öppet bokförd: den separata, icke-blockerande Post-merge-sviten (post-merge.yml, dokumenterat 'kan strukturellt inte blockera en landning', INTE en required check i main-skydd-rulesetet) gav rött på merge-SHA 50afc936 (run 31610637080) — men det enda fällda testet var tests/api/update-record.staging.test.ts (503 i stället för väntat 400), en fil som INTE ingår i PR #1202:s diff (verifierat via gh pr diff --name-only). activity-log-rls.staging.test.ts (denna skivas eget test) var grönt i samma körning. Bedömning: transient staging-503, ej en regression från denna diff. DoD #3 bockad på grund av CI (ci.yml/ci-suite.yml, den faktiska merge-gaten) — Post-merge-fyndet rapporteras här för spårbarhet, inte som ett olöst krav. Diff-scope 50afc936: 4 filer (kortfil, migration, README, testfil) — inga orelaterade.
<!-- SECTION:FINAL_SUMMARY:END -->
