---
id: TASK-464.6
title: >-
  Skiva: S3 — efterkontrollen kör bara det den ensam kan (staging,
  tillgänglighet, städning, klassning)
status: To Do
assignee: []
created_date: '2026-09-19 10:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-464.3
parent_task_id: TASK-464
priority: high
ordinal: 822000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge kör i dag hela den hermetiska sviten en FJÄRDE gång plus 'Staging (API + E2E)' mot den verkliga staging-basen (mätt: 57 fakturerade min på #2556, körning 35432195230). Bara staging-delen, a11y, sentinel-städningen, klassningen och exponeringsfönstret är unika. Ta bort den fjärde hermetiska körningen ur post-merge.yml; researchens härledda mål är ca 24 fakturerade min. Skyddsförlusten är liten men inte noll — efterkontrollen är enda ytan som kör på det faktiskt landade trädet efter en gruppmerge; N3 (TASK-450.2, landad e6308887) klassar redan hela det pushade spannet och är förutsättningen. RÖR INTE frågan per-landning-kontra-klocka: den väntar på research-passet docs/research/efterkontroll-pa-klocka-2026-09-19.md och Marcus beslut. Larmkedjan (ci-post-merge-ärenden, revert-förslag) ska fungera oförändrat. Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 1, 2, 3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Kontrastpar med run-ID: efterkontrollen på en kodlandning kör staging + a11y + städning men INGEN hermetisk acceptance-körning; fakturerade minuter före/efter redovisade per jobb
- [ ] #2 Post-merge-larmet (ärende + klassning av hela spannet) fungerar oförändrat — bevisat med workflowens självtest (simulate_failure) eller befintlig gatekeeper-svit
- [ ] #3 En dokumentlandning ger fortfarande en efterkontroll som hoppar sviten (som #2572: 2 fakturerade min)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 PR-kroppen bär sektionen 'Kostnad i två mått': VÄNTETID och FAKTURERADE MINUTER sida vid sida, mätta körningar med run-ID, enheter utskrivna, månadseffekt vid 1 279 landningar
- [ ] #5 Inget nytt JOBB där ett steg i ett befintligt jobb räcker (varje jobb avrundas upp till hel minut, gånger ytorna)
<!-- DOD:END -->
