---
id: TASK-171.7
title: 'Skiva: QA-vandringen — den rivna skarpa ytan'
status: Done
assignee: []
created_date: '2026-08-09 08:29'
updated_date: '2026-08-09 12:59'
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
- [x] #1 Marcus har vandrat samtliga lägen utan anmärkning, eller anmärkningarna är mintade som nya kort
- [x] #2 Inga prototyp-rester i den skarpa ytan (rail, variant-parametrar, stale URL:er)
- [x] #3 Regressionslåset kvitterat: referenser + omtagen baslinje gröna i CI
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Marcus QA-vandring genomförd och kvitterad i klartext 2026-08-09: 'Ser bra ut. Vi kör vidare' — utan anmärkning (AC #1). Prototyp-rester: railen riven i #1046, ?variant=a bidirektionellt bevisad no-op, utfalls-riggen medvetet kvar DEV-grindad (testberoende tills 147; byggbevisat borta ur prod) (AC #2). Regressionslåset: referenserna 40/40 gröna mot rivna ytan utan omtagning + baslinje-run 31311560867 success med noll drift ('Inga baseline-ändringar', verbatim) (AC #3). DoD: docs-/QA-kort utan egen kodyta — #2 utan tillämplig fil-klass, #3 belagd av kedjans kö-mergade landningar (#1037/#1039/#1041/#1044/#1046 samtliga gröna per jobb).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
