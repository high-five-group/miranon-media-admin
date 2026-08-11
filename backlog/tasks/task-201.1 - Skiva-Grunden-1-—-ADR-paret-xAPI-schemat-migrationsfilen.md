---
id: TASK-201.1
title: 'Skiva: Grunden 1 — ADR-paret, xAPI-schemat, migrationsfilen'
status: In Progress
assignee: []
created_date: '2026-08-11 20:20'
updated_date: '2026-08-11 21:40'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-201
ordinal: 366000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: de två grillade besluten (S105 Del 2) blir ADR:er, byggplanen amenderas öppet, och statement-formen + tabellformen landar som kod på disk (typer, Zod, migrationsfil med RLS) med api-test som bevisar valideringen åt båda håll. Ren disk-skiva — ingen miljö-applicering här (den är nästa skiva, med egen access-risk). OBS: supabase/migrations/ existerar inte ännu — denna skiva etablerar migrations-mekanismen (första Postgres-tabellen i projektet); följ Supabase CLI-standarden, inte create-*-table.mjs-mönstret (det är Airtable-precedent, mätt S105).

Täcker användarberättelser: 13, 14, 15
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Lagringsvals-ADR:n mintad (Supabase activity_log — skäl, AT-Max-konsekvens, per S105 Del 2 beslut 3); ADR-nummer re-deriverat mot disk vid mint
- [x] #2 Korrelations-ADR:n mintad (requestId enda korrelations-ID, tvådelad omprövningstrigger, per S105 Del 2 beslut 4)
- [x] #3 Byggplanen amenderad ÖPPET i samma landning: § Fas 6.5-lagringsraden + AT-Max-blockets premiss
- [x] #4 xAPI-statement-shape som TS-typer + Zod-schema (actor/verb/object/context/timestamp, IRI-nycklade verb och extensions, requestId i context.extensions); api-test validerar giltiga exempel och AVVISAR ogiltiga (rött-först per ADR-071)
- [x] #5 Migrationsfil för activity_log incheckad som deklarativ hemvist — kolumnform speglar statement-shapen, RLS-policyn ingår i filen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Byggplanen amenderad öppet i denna arbetsenhet: § Fas 6.5-lagringsraden + AT-Max-premissen (Supabase-beslutet)
- [ ] #6 Zod-schemat validerar varje statement runtime — ogiltigt statement når aldrig activity_log
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Byggd (S105 forts.). ADR-110 (lagringsval Supabase) + ADR-111 (requestId-korrelation) mintade mot disk-verifierade nästa-lediga-nummer (110/111, docs/decisions/ senast ADR-109 vid mint). Zod-schema src/domain/schemas/ActivityStatement.schema.ts (xAPI 1.0.3-profil, fältform verifierad mot ADL-specen via WebFetch) + migrationsfil supabase/migrations/20260811211759_create_activity_log.sql (RENT DISK, ej applicerad — 201.2s jobb). api-test tests/api/activity-statement-schema.test.ts: 14 fall, båda riktningar bevisade inkl. rött-först-bevis (temporärt försvagat schemat, sågs 2 tester fela rött, återställt, 14 gröna igen). byggplan.md amenderad öppet (lagringsraden + AT-Max-premissen, 3 förekomster) + versionrad 1.15; README.md-ADR-räkning 109→111. Grindar: typecheck 0, biome 0 (endast pre-existing varningar utanför diffen), check:docs 14/14 gröna, test:api 655/656 (1 fel: attachment-upload-large.staging.test.ts, HELT ORELATERAD yta — noll attachment-filer i min diff — bekräftat transient via isolerad omkörning 15/15 grönt, reproducerat identiskt 3 ggr i full-svit-kontext; flaggas till orkestreraren, ej mitt att fixa).
<!-- SECTION:NOTES:END -->
