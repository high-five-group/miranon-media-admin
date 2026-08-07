---
id: TASK-148.4
title: 'Skiva: harness-mätprotokollet — var bryts väckningskedjan'
status: To Do
assignee: []
created_date: '2026-08-07 09:49'
updated_date: '2026-08-07 10:23'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-148
ordinal: 250000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en dedikerad mätsession kan exekvera protokollet cell för cell utan designbeslut i stunden, och facit kan läsas ur sessionens egen JSONL-transcript i efterhand. Besvarar T112 § Åtgärdsriktning (iv). Täcker användarberättelser: 5, 9 (förbereder)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Protokolldok i docs/research/ per research-konventionen: sex differentialceller (bakgrunds-Bash, Monitor-event, subagent-completion — vardera mot idle respektive nyss aktiv session); varje cell skiljer EN variabel
- [x] #2 Facitmetoden specificerad: vilka JSONL-fält och tidsstämplar som läses post-hoc, och hur notifikations-leverans separeras från agent-resume
- [x] #3 Varje cell körbar: konkreta steg och förväntat utfall per hypotes; ingen cell kräver tolkning i stunden
- [ ] #4 PR armerad, per-jobb-grön
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
