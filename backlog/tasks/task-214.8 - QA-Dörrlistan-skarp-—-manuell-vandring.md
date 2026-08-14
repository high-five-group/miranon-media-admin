---
id: TASK-214.8
title: 'QA: Dörrlistan skarp — manuell vandring'
status: To Do
assignee: []
created_date: '2026-08-14 19:22'
labels:
  - ready-for-human
dependencies:
  - TASK-214.1
  - TASK-214.2
  - TASK-214.3
  - TASK-214.4
  - TASK-214.5
  - TASK-214.6
  - TASK-214.7
parent_task_id: TASK-214
ordinal: 409000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan mot staging-fixturens event, i browsern: (1) öppna närvaro-ytan utan parametrar — dörrlistan renderar direkt; (2) sessionsvalet syns (fixturen har två sessioner) och togglar arbetslistan; (3) checka in en person — raden kvitterar grönt med Incheckad-tid, flyttar till klargruppen efter 1,2 s, och Status i basen är Närvarande; (4) ångra inom fönstret — raden står kvar och basen är orörd; (5) bocka ur i klargruppen — Status åter Ej avstämt; (6) sök hittar person i arbetslistan; (7) ladda om sidan — incheckningarna står kvar; (8) Insiktskedjan: incheckad persons Närvaropoäng är 1 i basen; (9) felvägen: bruten nätverksväg ger synligt fel och raden åter i arbetslistan; (10) verifiera i loggen att ingen create-attendance-användning skett oväntat. Fynd blir nya kort — planen retuscheras aldrig.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hela testplanen genomförd utan oregistrerad avvikelse — varje fynd har fått eget kort med exakt symptom och förväntat beteende
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
