---
id: TASK-149.7
title: 'QA: arbetsformens leveransväg ände-till-ände'
status: To Do
assignee: []
created_date: '2026-08-07 10:35'
labels:
  - ready-for-human
dependencies:
  - TASK-149.1
  - TASK-149.2
  - TASK-149.3
  - TASK-149.4
  - TASK-149.5
  - TASK-149.6
parent_task_id: TASK-149
ordinal: 261000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan: (1) ny session betalar skarpbevis-skulden; (2) kör hela rundturen paus→resume→neka→klart→släpp med Marcus som observatör; (3) läs dokumentkedjan och pröva varje pekare. Alltid ready-for-human.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skarpbevis-skulden från 149.3 betald i ny session: differentialmätning mot bevisat laddad hook; push nekas i simulerat iterationsläge, släpps efter läges-rensning
- [ ] #2 Rundturen verifierad: prototype-läge satt → paus med ARBETSFORM-rad → resume i färsk kontext → tillståndsfil återskapad → push nekad → klart-rensning → push släppt
- [ ] #3 Dokumentkedjan läst i följd: ADR-097 ↔ CONTRIBUTING ↔ CLAUDE.md ↔ T126 (MÄTT) ↔ bärarkartan — inga motsägelser eller föråldrade pekare
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
