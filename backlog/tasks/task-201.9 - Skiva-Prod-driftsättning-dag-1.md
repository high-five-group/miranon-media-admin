---
id: TASK-201.9
title: 'Skiva: Prod-driftsättning dag 1'
status: To Do
assignee: []
created_date: '2026-08-11 20:27'
labels:
  - ready-for-human
dependencies:
  - TASK-201.4
  - TASK-201.6
  - TASK-201.7
parent_task_id: TASK-201
ordinal: 374000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dag 1-leveransen: hela aktivitetsloggen tas till prod. MEDVETET utan beroende på filterraden (201.8) — A-formen räcker för driftsättning (mellanstationen, S105 Del 2 beslut 1); landar 201.8 före driftsättningen följer den med. HITL: prod-access + verifiering är Marcus-moment (S103-precedentet: EF-prod-deploy som öppen skuld tills Marcus-GO).

Täcker: dag 1-leveransen av berättelserna 1–6, 9–12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 activity_log född i prod-Supabase (samma migration + RLS-bevis som staging, 201.2-formen)
- [ ] #2 log-activity + get-activity-log deployade i prod; smoke per EF-praxis (deny-triple-andan)
- [ ] #3 Front-deployen VERIFIERAD utrullad (task-199-fällan: prod-fronten kan stå stale — verifiera faktisk version, anta inte)
- [ ] #4 Rök-test i prod: en riktig åtgärd → posten syns i Lottas historik
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
