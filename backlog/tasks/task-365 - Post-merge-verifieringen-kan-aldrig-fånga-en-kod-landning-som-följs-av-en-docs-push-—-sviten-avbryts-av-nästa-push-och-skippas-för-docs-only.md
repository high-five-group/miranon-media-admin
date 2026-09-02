---
id: TASK-365
title: >-
  Post-merge-verifieringen kan aldrig fånga en kod-landning som följs av en
  docs-push — sviten avbryts av nästa push och skippas för docs-only
status: To Do
assignee: []
created_date: '2026-09-02 10:49'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 663000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (S113 resume 8, 2026-09-02): tests/e2e/persondetalj-betalningar-fellage.staging.test.ts var RÖTT från födseln (PR #2175, 2026-08-31, strict-mode: h2 'Betalningar' + h3 'Senaste inbetalningar' matchar samma getByRole utan exact) och kördes aldrig grönt post-merge förrän 2026-09-02 08:00 (run på e99ed65b) — sedan ytterligare två röda (fc91f0be 09:03 avbruten på 12-min-taket, 56ae3c46 09:25). Rotorsak i PROCESSEN, inte i testet (testet fixas i TASK-364): (1) PR-grinden kör inte staging-E2E (medvetet, TASK-70.3); (2) Post-merge-workflowets 'Verifierande svit på det mergade trädet' körs per push men AVBRYTS av nästa push (concurrency) — kod-landningen #2193 (9dca0e56 13:15) fick sin körning cancelled av docs-pushen 2d3647f2 13:43, som själv SKIPPADE sviten (docs-only-klassning). Följd: en kod-landning som följs av en docs-landning inom ~15 min får ALDRIG en post-merge-verifiering. (3) Nattnätet fångade felet 2026-09-01 06:10 (run 33476475878) men ingen läste det — ingen larmväg till orkestreraren utöver ci-natt-ärendet. Belägg: gh run list --workflow Post-merge --limit 40; Post-merge-körningar 2026-09-01 13:09/13:15/14:27 'cancelled'. FORM ATT PRÖVA: (a) post-merge-sviten ska inte avbrytas av en docs-only-push (concurrency-grupp per klassning, eller cancel-in-progress: false för sviten och dedup i stället); (b) en docs-only-push ärver/förlänger den senaste kod-landningens verifiering i stället för att skippa; (c) nattnätets rött ska nå heartbeat-svepet (RÖTT-rad för senaste nightly). Kopplat: TASK-239 (acceptance-tak), TASK-364 (testfixen), ADR-077 (klassning/dedup).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Post-merge-körningen för en kod-landning avbryts inte av en efterföljande docs-only-push (mätt: två pushar inom 2 min, den första kod, sviten fullföljs)
- [ ] #2 En docs-only-push efter en overifierad kod-landning kör (eller ärver) verifieringen i stället för att skippa — bevisat med ett kontrastpar
- [ ] #3 Heartbeat-svepet rapporterar senaste nightly-körningens rött som RÖTT-rad
- [ ] #4 Paritetspolicyn och verify:ci-parity gröna efter ändringen; workflow-lintarna gröna med repots ignore-form
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
