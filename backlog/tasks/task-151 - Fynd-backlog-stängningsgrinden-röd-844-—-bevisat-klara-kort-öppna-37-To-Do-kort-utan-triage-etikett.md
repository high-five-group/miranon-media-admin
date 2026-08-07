---
id: TASK-151
title: >-
  Fynd: backlog-stängningsgrinden röd (#844) — bevisat klara kort öppna + 37 To
  Do-kort utan triage-etikett
status: To Do
assignee: []
created_date: '2026-08-07 10:50'
labels:
  - ready-for-agent
dependencies: []
ordinal: 263000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Symptom: nattgrinden Backlog-stängning fäller (#844, 2026-08-07): kort vars arbete är bevisat klart står öppna bortom karensen; separat mätt: 37 av 79 To Do-kort (47 %) saknar ready-for-*-etikett och är därmed strukturellt oplockbara för do-work-mekanismen — inklusive fyra HIGH-prioriterade produktionsbuggfynd från 2026-07-21/22. Förväntat: backlog där status speglar bevisläge och varje To Do-kort är plockbart eller medvetet HITL-märkt. Funnet i S99 uppdrag 3-svepet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: #844:s drift-lista hämtad ur nattkörningen; varje utpekat kort verifierat mot faktiskt bevisläge (commit/PR) före stängning
- [ ] #2 Bevisat klara kort stängda via backlog-CLI med final-summary + belägg; tveksamma fall listade i slutrapporten i stället för gissad stängning
- [ ] #3 Etikett-luckan stängd: alla To Do-kort utan ready-for-*-etikett triagerade och etiketterade (ready-for-agent när specen räcker, annars ready-for-human) — särskilt HIGH-buggarna TASK-24/25/27/28
- [ ] #4 #844 kommenterat med åtgärden; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
