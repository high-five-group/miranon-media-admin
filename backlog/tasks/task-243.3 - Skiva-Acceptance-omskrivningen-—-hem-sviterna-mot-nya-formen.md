---
id: TASK-243.3
title: 'Skiva: Acceptance-omskrivningen — hem-sviterna mot nya formen'
status: To Do
assignee: []
created_date: '2026-08-16 14:36'
labels:
  - ready-for-agent
dependencies:
  - TASK-243.1
  - TASK-243.2
parent_task_id: TASK-243
ordinal: 449000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hem-vyns acceptance-skydd skrivs om så nya Morgonkollen-formen bär samma testtäckning som gamla hemmet: en regression i blockordning, tomt läge, bevakningsradsvillkor eller copy fångas i CI utan mänsklig granskning. Testtäcker samtliga användarberättelser: 1–10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 De fyra hem-sviterna (tests/acceptance/hem.acceptance.test.ts, hem-laddlage, hem-senaste-aktivitet, hem-senaste-aktivitet-farskhet) omskrivna mot nya formen: blockordningen, tomma läget, bevakningsradens visas-bara-med-innehåll-villkor, copy-formerna
- [ ] #2 Tillgänglighet testad i acceptance-vanan (den nya formens rubrikstruktur, knappnamn, disablade bulk-knappars motivering); laddlägena mot ADR-078 + DESIGN-SYSTEM-SPEC §15
- [ ] #3 Externt beteende testas, aldrig implementationsdetaljer (PRD:ns testbeslut, skarv-kvittens Marcus 2026-08-16); samtliga sviter gröna lokalt och i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning: testernas förväntningar korsläses mot tasks/sessions/bilagor/s102-hem-konvergens/facit.json — testet får aldrig kräva något facit motsäger
<!-- DOD:END -->
