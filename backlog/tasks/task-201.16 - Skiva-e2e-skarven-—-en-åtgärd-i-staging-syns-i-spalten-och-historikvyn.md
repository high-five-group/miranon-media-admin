---
id: TASK-201.16
title: 'Skiva: e2e-skarven — en åtgärd i staging syns i spalten och historikvyn'
status: To Do
assignee: []
created_date: '2026-08-14 18:30'
updated_date: '2026-08-14 18:49'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.15
parent_task_id: TASK-201
ordinal: 400000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PRD TASK-201 § Testbeslut speccar e2e-skarven verbatim: 'en åtgärd utförs → posten syns i spalten och historikvyn med rätt aktör, språk och tid' (staging-testkonventionen). Byggplanen § Fas 6.5 (docs/byggplan.md:818) listar tests/e2e/activityLog.spec.ts — ALDRIG byggd (Explore-svepet S105 Del 9: tests/e2e/ har noll aktivitetsloggs-filer; dagens skydd är acceptance-nivå + staging-api). Marcus GO 2026-08-14: inga luckor.

Åtgärdstypen väljs MAIL-FRI (t.ex. betalningsmarkering eller anteckning). ABSOLUT MAILFÖRBUD — appen är i skarp drift; inga mail-vägar utlöses.

Beroendet på TASK-201.15 är mjukt: undvik samtidig redigering av samma testytor; e2e-filen är ny och kolliderar inte i kod, men skivan tas efter för ren sekvens.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ny e2e-fil per staging-testkonventionen: mutex, purge-medvetenhet, fixturdata via etablerade vägar — ALDRIG handbyggd granskningsdata (seed:review-regeln i CLAUDE.md)
- [x] #2 Flödet bevisat: en mail-fri åtgärd utförs → posten syns i hem-spalten utan omladdning (TASK-210-beteendet) OCH i historikvyn med rätt aktör, svensk sammanfattning och tid
- [x] #3 Anteckningsfallet: posten visar ATT en anteckning gjordes, ALDRIG innehållet — asserterat mot renderad text
- [x] #4 Fällningsbevis: assertionen faller bevisat när posten saknas (tvåsidigt, injicerat och återställt bit-identiskt)
- [x] #5 Ingen ny flake-yta: vänta-strategier per Playwright-praxis (web-first assertions, inga sleeps); sviten grön två körningar i rad lokalt mot staging
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGT: tests/e2e/aktivitetslogg-skarv.staging.test.ts (staging-e2e, chromium-authenticated-projektet).

Avvikelse mot uppdraget (öppet bokförd, ADR-086): byggplan.md:818 namnger filen
tests/e2e/activityLog.spec.ts — .spec.ts-ändelsen förekommer INGENSTANS i
sviten. Etablerad konvention är *.staging.test.ts (playwright.config.ts
chromium-authenticated testMatch); den formen byggdes, byggplan-ordalydelsen
viker (regeln i uppdraget slår talet i uppdraget).

Åtgärdstyp: EVENT-ANTECKNING (useCreateEventNote -> ANTECKNADE_VERB) — mail-fri
och den enda typ vars logg-post kontraktsmässigt aldrig får bära innehållet,
vilket täcker AC #3 utan en andra scenario-gren.

Mönster följt: mark-paid.staging.test.ts + atgarder-betalningar.staging.test.ts
(page.route-mock, samma split: server-kontraktet provas redan mot skarp
staging i tests/api/log-activity*/get-activity-log*; denna fil bevisar
klientens fulla kedja verklig composer -> log-activity -> cache-invalidering
-> BÅDA läsytorna, utan att mutera delad staging-data). mutex (staging-
preflight-semafor) och auth (storageState) är strukturella hos
.staging.test.ts-filklassen, ingen egen kod krävdes.

Körning mot verklig staging (npx playwright test --project=chromium-authenticated
tests/e2e/aktivitetslogg-skarv.staging.test.ts): 3 gröna körningar (n=3, ingen
fällning) - "ingen fällning" är ett mätt resultat på tre körningar, inte
antagen flakefrihet på fler.

Fällningsbevis (AC #4, tvåsidigt): temporär fault-injection i
get-activity-log-riggen (kommenterade bort statement-prependen) - körning 1
fällde spalt-assertionen (rätt fel: elementet med raden hittades inte),
körning 2 (spalt-assertionerna tillfälligt urkopplade) fällde HISTORIKVY-
assertionen isolerat med samma orsak. Filen återställd bit-identiskt
(sha256 3a45aed6...da006 identisk före/efter, diff tomt) och en tredje grön
körning bekräftade återställningen.

Grindar (exitkoder separat, aldrig pipe): biome check (filen) exit=0, biome
check . (hela repot) exit=0 (inga nya fynd i min fil), typecheck exit=0,
build exit=0, test:api exit=0 (729 passed). verify:ci-parity INTE körd (
diagnosverktyg, ingen ci.yml/ci-suite.yml-ändring gjord, CLAUDE.md-regeln).
<!-- SECTION:NOTES:END -->
