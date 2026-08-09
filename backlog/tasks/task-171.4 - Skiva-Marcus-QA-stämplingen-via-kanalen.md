---
id: TASK-171.4
title: 'Skiva: Marcus QA + stämplingen via !-kanalen'
status: To Do
assignee: []
created_date: '2026-08-09 08:25'
labels:
  - ready-for-human
dependencies:
  - TASK-171.3
parent_task_id: TASK-171
ordinal: 319000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell plan: Marcus granskar den promoverade ytan på dev-servern mot facit-bilderna (regressionsstöd, inte spec) — lägen: tomt läge, mottagarurval, granskningsläge, de tre utfallslägena. Vid godkännande kör Marcus stämplingen SJÄLV via !-kanalen med stämplingskommandot per ADR-104 (orkestreraren serverar den exakta raden vid QA-avslut; agenter kan inte skriva godkand-fältet — hooken skarpbevisad i 167-leveransen). Täcker användarberättelser: 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus har granskat samtliga lägen mot facit-bilderna
- [ ] #2 godkand-fältet stämplat via !-kanalen (av/datum/citat/sha i manifestet)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
