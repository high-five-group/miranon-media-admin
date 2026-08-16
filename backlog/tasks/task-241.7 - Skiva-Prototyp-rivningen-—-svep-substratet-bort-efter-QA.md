---
id: TASK-241.7
title: 'Skiva: Prototyp-rivningen — svep-substratet bort efter QA'
status: To Do
assignee: []
created_date: '2026-08-16 23:09'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.6
parent_task_id: TASK-241
ordinal: 461000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rivningen följer 243.4-till-243.5-prejudikatet: prototypen står kvar som körbar referens tills Marcus QA-vandring (241.6) är klar, sedan rivs flaggor och substrat — aldrig formen (ADR-103). Täcker användarberättelser: ingen (teknisk stängning per ADR-102 B3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dev-routen /dev/svep-prototyp och katalogen src/components/dev/svep-prototyp/ rivna; import-beroendena mot hem-prototypkatalogen (VariantRo, demoUniversum, InitialAvatar-bokföringen i 241.1-notes) därmed borta — 243.5 avblockeras från svep-hållet
- [ ] #2 B3-markören ([PROTOTYPE, TASK-241.1] Sändytans overlay — KONVERGENSVARV 2.) städad ur .facit-policy.conf i SAMMA landning som rivningen (TASK-192-regeln) med daterad removal-not
- [ ] #3 scripts/check-facit.sh grönt efter städningen; bygget bär noll referenser till svep-prototypkatalogen (grep-verifierat i dist)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
