---
id: TASK-6
title: >-
  Fynd: npx playwright test kör alla projekt parallellt — api-staging kolliderar
  systematiskt med e2e:s staging-writes
status: In Progress
assignee: []
created_date: '2026-07-11 09:43'
updated_date: '2026-07-12 18:10'
labels:
  - ready-for-agent
dependencies: []
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S61 batch 2, task-4.3-valideringen): plain 'npx playwright test' (alla projekt) gav SAMMA 6 api-staging-fall röda i två körningar i rad — create-registration 89/129/160, get-registrations väg D 86/132, update-record 92 — medan exakt samma tester är gröna i isolerade kanoniska körningar ('npm run test:api' 290/290 och CI:s sekventiella test:api:staging). Mekanik: api-staging-projektet och chromium-authenticated-projektet saknar inbördes dependency → Playwright kör dem samtidigt; e2e-flöden (mark-paid, event-add-registration m.fl.) skriver mot samma staging-fixturer/sentineller som api-testernas idempotens-/409-/ordnings-assertions läser → deterministisk kollision, inte slumpflake. CI drabbas ALDRIG (kör projekten som separata sekventiella steg per ci.yml Test+Build).

FÖRVÄNTAT BETEENDE: den blandade full-parallella körformen är antingen (a) korrekt genom projekt-dependencies/serialisering (t.ex. chromium-authenticated depends on api-staging, eller workers-partitionering per projekt), eller (b) explicit dokumenterad som icke-stödd körform (CONTRIBUTING/test-README: kör kanoniska kommandona separat) så framtida agenter inte felklassar de 6 fallen som regressioner. Not: fyndet kostade en extra full-svit-körning i batch 2 innan mönstret var belagt.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->



## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Vägvalet fattat och bokfört i kortets notes med motivering: (a) blandad full-parallell körning görs korrekt via projekt-dependencies/workers-partitionering ELLER (b) körformen deklareras explicit icke-stödd i dok-bäraren
- [x] #2 Vid (a): plain 'npx playwright test' grön utan de 6 api-staging-kollisionerna; vid (b): CONTRIBUTING/test-dok bär varningsrad + de kanoniska sekventiella kommandona
- [ ] #3 CI:s sekventiella Test+Build-form orörd och fortsatt grön
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
VÄGVAL: (b) — plain 'npx playwright test' deklareras explicit icke-stödd i CONTRIBUTING.md § Testkörning — kanoniska former (Playwright) + varningsblock i playwright.config.ts-headern. (a) prövades EMPIRISKT först och föll på fyra ben: (1) RÖD-BEVIS, dependency-mekaniken: temporär dependencies ['setup','api-staging'] på chromium-authenticated svällde '--project=chromium-authenticated --list' från 148 tester/24 filer (147 chromium + 1 setup = CI:s e2e-stegs exakta form) till 259/45 (+1 api-setup, +110 api-staging) — Playwright drar in dependencies transitivt vid --project, och ci.yml:s e2e-steg saknar TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD/TEST_REGISTRATION_RECORD_ID/STAGING_REQUIRED i env → api-setup:s admin-login hade failat → CI röd; att kompensera med --no-deps i test:e2e:staging ÄR att röra CI:s form → AC3-brott. Config-editen återställd byte-identiskt (git checkout, diff verifierad tom). (2) Workers-partitionering existerar (testProject.workers, node_modules/playwright/types/test.d.ts rad 744) men begränsar endast parallellism INOM ett projekt ('tests from this project') — kollisionen är MELLAN projekt; mekaniken löser fel problem. (3) ADR-073-prejudikat: beslut 3 löser TASK-5-/TASK-6-klassen utan att röra playwright.config.ts (staging-semafor över pipelines); beslut 4 serialiserar CI-runs (concurrency staging-tests, queue max) för samma kollisionsklass — arkitekturens riktning är contention-hantering UTANFÖR config-filen. (4) Portläget vid bevis-ögonblicket: (a):s AC2-bevis (full plain grön) kräver ledig 5173; porten bär Marcus levande dev-server (PID 10309, röres ej per batch-order) → task-5:s strictPort-vägran stoppar varje plain-körning — (b):s bevis är däremot komplett körbart idag. SKYDDET efter (b) är tvådelat: upptagen 5173 → task-5:s hårda vägran (ingen tyst korruption möjlig); ledig 5173 → dok-varningen i CONTRIBUTING + config-headern styr till de kanoniska sekventiella kommandona. TILL NÄSTA UTFÖRARE (L266): önskas (a) i framtiden krävs (i) --no-deps i test:e2e:staging-scriptet, (ii) komplett staging-env i CI:s e2e-steg, (iii) full plain-verifiering på ledig 5173 — dvs. en medveten CI-form-ändring; det är ett eget kort/beslut, inte detta.
<!-- SECTION:NOTES:END -->
