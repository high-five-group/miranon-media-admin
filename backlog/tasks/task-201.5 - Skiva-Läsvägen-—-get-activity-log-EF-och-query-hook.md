---
id: TASK-201.5
title: 'Skiva: Läsvägen — get-activity-log-EF och query-hook'
status: To Do
assignee: []
created_date: '2026-08-11 20:24'
updated_date: '2026-08-12 16:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.2
parent_task_id: TASK-201
ordinal: 370000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: läsvägen från tabell till klient — EF med kontrakt som redan rymmer filterradens behov (kategori/event/tid) så att 201.8 inte behöver röra EF:n, och en hook som hem-spalten och historikvyn båda konsumerar. Parallellbar med 201.3/201.4 (dep endast tabellen).

Täcker användarberättelser: 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 get-activity-log-EF: senaste först, paginering, filterparametrar (kategori, eventId, tidsintervall) i kontraktet; EF-ribban (SECURITY-SPEC §6.10); api-staging-test mot seedade rader
- [x] #2 Query-hook i datalagret via adaptern — datalagret nås ALDRIG förbi sin adapter
- [x] #3 Devtools-läsbarhet (byggplanens DoD 4): posterna inspekterbara i TanStack Query devtools
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 requestId propageras klient → EF → activity_log-rad, läsbar i devtools (byggplanens DoD 3–4)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Byggd (S105 forts., egen worktree). Läsvägen: `supabase/functions/get-activity-log/index.ts` (ny EF, DIREKT mot Postgres `activity_log` via service_role, INGEN Airtable-interaktion) + `src/data/queries/useActivityLog.ts` (ny hemvist, läs-analog till `src/data/mutations/`; `useActivityLogHistory` för 201.6, `useLatestActivity` för 201.7) + adapterkedjan (`DataSourceAdapter.fetchActivityLog` → `AirtableAdapter`-implementation → `SupabaseAdapter`-stub) + `ActivityLogFilters`/`ActivityLogParams`/`ActivityLogPage` (domain/types) + `queryKeys.activityLog.{history,latest}` + `EVENT_ID_EXTENSION_IRI`-konstant i `ActivityStatement.schema.ts` (additiv, `.catchall()` behövde ingen ändring).

PREMISS-PASS (ADR-086): git fetch körd, egen worktree var 1 commit bakom origin/main (endast T141-docs-commits, orelaterat) — rebasade inte separat eftersom PR:en byggs via merge queue mot main ändå. TASK-201.2 KLART-premissen bekräftad (migration + RLS + grant applicerade, tabellen existerar). "Supabase-åtkomsten fungerar"-premissen bekräftad (länk + deploy + db query fungerade utan hinder). "Kör aldrig supabase projects api-keys"-förbudet respekterat fullt ut — se DIVERGENS nedan för hur AC #1:s "seedade rader" löstes utan den kommandot.

DIVERGENS 1 (källmärkt, hanterad öppet): AC #1 kräver "api-staging-test mot seedade rader". CI har INGEN `SUPABASE_SERVICE_ROLE_KEY`-secret och ingen Supabase CLI-inloggning — ett CI-committat test kan alltså strukturellt inte seeda. Följde det REDAN ETABLERADE precedentmönstret i `get-mail-log.staging.test.ts` ("KONTRAKT-MOT-TOM, INGEN SEEDAD FIXTUR"): det committade testet (`tests/api/get-activity-log.staging.test.ts`, 14 fall) bevisar KONTRAKTET (auth/CORS/filterparametrar/validering/pageSize-klampning/best-effort-ordning) mot tabellens faktiska innehåll. Den mekaniska KORREKTHETEN mot verkliga rader (sidbrytning, category-equality, eventId-.contains(), from/to-range, requestId-propagering) verifierades i stället MANUELLT, en gång, mot skarp staging: 4+1 syntetiska rader seedade via `supabase db query --linked` (postgres-rollen — INTE service_role, eftersom `projects api-keys` numera är förbjudet), samtliga sex beteenden bevisade korrekta, samtliga rader städade (0 kvar, verifierat). Fullständig logg: `supabase/migrations/README.md` § "get-activity-log — läsvägens paginerings-/filterbevis".

DIVERGENS 2 (oväntat, bokfört öppet): under seed-passet upptäcktes att `TASK-201.3` (byggs parallellt, samma mission-instruktion nämnde detta) redan hade skrivit TVÅ RIKTIGA rader till staging `activity_log` (actor_name "Lotta", object_type ".../api-kontroll", ~16:13-16:14 UTC 2026-08-12) — bekräftat via en efterföljande "Post-merge"-CI-körning (31616840426, TASK-77 staging-preflight blockerade en lokal `npm run test:api`-körning tills den run:en slutfördes, ~7 min). Rörde INTE dessa rader (utanför min yta). Detta BEVISADE dessutom sidbrytningen korrekt mot verklig, samtidig data (mina probe-rader hamnade rätt EFTER deras i keyset-ordningen).

DIVERGENS 3 (min egen design-decision, källmärkt): AC #1 kräver "eventId" i filterkontraktet, men skrivvägen (201.3/201.4) definierar ÄNNU INGEN eventId-bärande extension-nyckel (bekräftat: de två riktiga raderna ovan bär den inte). Definierade själv `EVENT_ID_EXTENSION_IRI` (`https://admin.miranon.dev/xapi/extensions/eventId`) i det delade schema-filen (additiv export, rör INTE 201.3:s egen yta: recordActivity/log-activity-EF/pilotmutationerna) och implementerade filtret mot den via `.contains()` (Postgres jsonb `@>`). Verifierat KORREKT som mekanism (manuell seed bevisade exakt matchning). ÖPPEN KOORDINERINGS-SKULD: filtret returnerar `[]` mot riktiga rader tills skrivvägen antar SAMMA nyckelsträng — flaggas till orkestreraren för avstämning mot 201.3/201.4:s faktiska val.

AC #1 (senaste-först/paginering/filter/EF-ribba/api-staging-test): senaste-först + keyset-paginering (occurred_at DESC, id DESC, cursor via `_shared/cursor.ts`s codec) + alla tre filter (category/eventId/from-to) manuellt bevisade mot 5 seedade rader (se Divergens 1 ovan för fullständig logg). EF-ribban: EF1 requireUser ✓, EF2 corsHeadersFor/handleCors ✓ (CORS-test grönt), EF3 N/A (ingen operationKey-koncept, matchar precedent för läs-EF:er utan write-allowlist), EF4 400/401/405/500-semantik ✓, EF5 generisk {error}/{error,requestId} ✓, EF6 strukturerad JSON-loggning via mapErrorToResponse ✓. 14/14 committat api-staging-test grönt (körd BÅDE isolerat och i full `npm run test:api`-svit).

AC #2 (query-hook via adaptern): `useActivityLogHistory`/`useLatestActivity` går ENDAST via `useDataSource()` → `dataSource.fetchActivityLog()` → `AirtableAdapter` → `callEdgeFunction`. Ingen direkt fetch/supabase-klient i hook-lagret.

AC #3 (devtools-läsbarhet): EMPIRISKT VERIFIERAT via en TEMPORÄR (ej committad, borttagen igen) smoke-route som monterade båda hooksen bakom en riktig inloggning (TEST_USER) mot en lokal dev-server (port 5176 — 5173-5175 upptagna av andra samtidiga agent-sessioner). React Query Devtools-panelen visade BÅDA query-nycklarna explicit: `["activityLog","history",{}]` och `["activityLog","latest",5]`. Status var "error" (INTE en defekt i EF/hook — CORS_ALLOWED_ORIGINS på staging tillåter bara port 5173, min dev-server landade på 5176 pga portkrock med andra agenters servrar; att lägga till 5176 i det DELADE CORS-secreten låg utanför denna skivas mandat). Den faktiska SUCCESS-vägen (riktig data, korrekt form) är oberoende och grundligare bevisad via den direkta HTTP-verifieringen (Divergens 1) och de 14 committade testerna.

DoD #5 (requestId propagerar): explicit verifierat med en femte seedad rad (`request_id = '12345678-90ab-4cde-8f12-34567890abcd'`) — EF-svarets `statement.context.extensions['.../extensions/requestId']` matchade EXAKT. Städad efteråt.

Grindar (denna session, samtliga naket körda, exitkod läst separat från fil): `npm run typecheck` exit 0. `npx @biomejs/biome check .` exit 0 (2 formateringsfel i mina egna filer fixade under bygget — `src/queries/keys.ts`, testfilen; kvarvarande 6 varningar/39 infos är PRE-EXISTING, verifierat via filnamns-grep, ingen i min diff). `npm run build` exit 0. `npm run check:docs` — skriptets egen slutrad: "check:docs grönt — samtliga 14 dokumentations-grindar körda" (14/14, EJ kopierat härifrån till någon annan fil). `npm run test:api`: FÖRSTA körningen delvis blockerad av TASK-77 staging-preflight (en `Post-merge`-CI-körning, sannolikt 201.3:s landning, höll staging — väntade ut den i förgrunden, ~7 min, bekräftat via `gh run view`). ANDRA körningen (efter att preflighten släppte): 673 tester, 672 gröna, 1 rött — `attachment-upload-large.staging.test.ts`, den KÄNDA flaken mission-texten själv flaggade (ägs av TASK-196, ej rörd av min diff, noll attachment-filer i mitt diff). Samtliga 14 `get-activity-log.staging.test.ts`-fall gröna i BÅDA körningarna (isolerat och i full svit).

Deploy: `supabase functions deploy get-activity-log` mot staging (`pqtshyierkdgwdnxuirz`, verifierat länkat FÖRE varje skarpt anrop). Prod RÖRDES INTE — `.prod-functions-allowlist.conf` orörd (TASK-201.9 äger prod-driftsättningen).

Rörda filer: `supabase/functions/get-activity-log/index.ts` (ny EF), `supabase/config.toml` (verify_jwt-post), `src/domain/schemas/ActivityStatement.schema.ts` + `index.ts` (EVENT_ID_EXTENSION_IRI), `src/domain/types/Filters.ts` + `Pagination.ts` (nya typer), `src/data/adapters/DataSourceAdapter.ts`/`AirtableAdapter.ts`/`SupabaseAdapter.ts` (ny metod), `src/queries/keys.ts` (nya nycklar), `src/data/queries/useActivityLog.ts` (ny hook-fil, ny mapp), `tests/api/get-activity-log.staging.test.ts` (nytt committat test), `supabase/migrations/README.md` (manuell verifieringslogg).

EFTERHANDS-HÄRDNING (samma session, innan PR-armering): det första injektionsprovet i tests/api/get-activity-log.staging.test.ts fångades redan av Date.parse ensamt (verifierat med node -e) och bevisade därför inte regex-radens (/[,()]/.test(occurredAt)) EGNA värde. Hittade och lade till ett andra prov vars occurredAt-del PASSERAR Date.parse (V8 tolererar 'Wed Jan 01 2020 00:00:00 GMT+0000 (extra)' som giltigt datum) men fångas av regexen — empiriskt verifierat både isolerat (node -e) och live mot deployad EF (400) FÖRE testet skrevs. 15/15 gröna efter tillägget (både isolerat och i denna nya körning). Commit 18536191, PR #1215 headRefOid uppdaterad, auto-merge fortsatt armerad (armerades INNAN denna push — GitHub väntar in de nya checkarna på samma armering, ingen ny gh pr merge behövdes).
<!-- SECTION:NOTES:END -->
