---
id: TASK-6
title: >-
  Fynd: npx playwright test kör alla projekt parallellt — api-staging kolliderar
  systematiskt med e2e:s staging-writes
status: To Do
assignee: []
created_date: '2026-07-11 09:43'
labels: []
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
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
