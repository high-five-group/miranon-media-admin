---
id: TASK-171.7
title: 'Skiva: QA-vandringen — den rivna skarpa ytan'
status: To Do
assignee: []
created_date: '2026-08-09 08:29'
labels:
  - ready-for-human
dependencies:
  - TASK-171.1
  - TASK-171.2
  - TASK-171.3
  - TASK-171.4
  - TASK-171.5
parent_task_id: TASK-171
ordinal: 322000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Konkret manuell testplan (avslutande QA-kortet; dep:ar medvetet INTE den villkorade hopkopplings-skivan — slutet-QA får inte blockeras på obestämd tid av 147): (1) Vandra den rivna skarpa åtgärds-/granskningssidan i SAMTLIGA lägen — tomt läge, mottagarurval från eventsidan, granskningsläget med bitande urvalsfilter och ifyllda platshållare, de tre utfallslägena. (2) Pröva att inga prototyp-rester syns: ingen rail, inga variant-parametrar i URL:en, stale-URL-beviset håller. (3) Kvittera regressionslåset: ariaSnapshot-referenserna + omtagna visual-baslinjen gröna i CI. Anmärkningar blir NYA kort med exakt symptom — gamla planer retuscheras aldrig.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus har vandrat samtliga lägen utan anmärkning, eller anmärkningarna är mintade som nya kort
- [ ] #2 Inga prototyp-rester i den skarpa ytan (rail, variant-parametrar, stale URL:er)
- [ ] #3 Regressionslåset kvitterat: referenser + omtagen baslinje gröna i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
