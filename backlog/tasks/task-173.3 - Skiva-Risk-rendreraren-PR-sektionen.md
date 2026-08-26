---
id: TASK-173.3
title: 'Skiva: Risk-rendreraren + PR-sektionen'
status: To Do
assignee: []
created_date: '2026-08-09 13:13'
updated_date: '2026-08-26 04:12'
labels:
  - ready-for-agent
dependencies:
  - TASK-173.1
parent_task_id: TASK-173
ordinal: 326000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: review-agentens JSON-utlåtande omvandlas av ett deterministiskt skript till den fasta Riskbedömnings-sektionen och skrivs in i PR-kroppen; bevis-påståenden bär commit-pinning (run-ID/SHA) som lag (ADR-105 beslut 5–6). Täcker användarberättelser: 2, 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ett schema-giltigt utlåtande renderas till en deterministisk Riskbedömnings-sektion i PR-kroppen: nivå + enmenings-motivering + fynd-sammanfattning + bevisreferenser med kommando och run-ID/SHA
- [x] #2 Samma JSON-indata ger identisk sektionsutdata (determinism tvåsidigt bevisad)
- [x] #3 Malformat utlåtande fäller rendreraren med tydligt fel — aldrig en tyst tom eller partiell sektion
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Tvåsidig skript-testsvit (ska-fälla + ska-passera) per nytt deterministiskt skript, grön lokalt
- [ ] #6 CI-backstoppens grind-verkan bevisad med rött-först-form: positivt bevis + negativ self-test
- [ ] #7 Instrumenteringsloggen bevisat skrivande från första skarpa körningen (findings-per-runda + risk-kalibrering + grind-missar)
- [ ] #8 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->
