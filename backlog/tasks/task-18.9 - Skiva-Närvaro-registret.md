---
id: TASK-18.9
title: 'Skiva: Närvaro-registret'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Genomförda event visar närvaron som register: attendance-shapen utökas till person gånger session (Session-enumen ur basen — Deltaganden är en rad per Anmälan gånger Session) med närvaropoäng-mappning och Total närvaro i procent; rader gånger sessions-bockar i LMS-registerformen; kommande event visar lugnt läge. Ren LÄSNING — närvaro-write hör till check-in-sidan som byggs i eget framtida pass. Täcker användarberättelser: 24 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Attendance-shape-utökningen kontraktstestad (person gånger session + poäng-mappningen)
- [ ] #2 Registret renderar per facit för genomfört event och lugnt läge för kommande (renderad verifiering mot facit-tidigare-helsidan)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
