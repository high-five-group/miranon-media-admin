---
id: TASK-17.3
title: 'Skiva: Kursfärgs-tokensen (ADR-064-mappningen)'
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-17
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prefaktorering: kursfärgerna (Fjärrskådning, RIM 1, RIM 2, RIM 3, Annat) etableras som semantiska tokens ur segment-taxonomin (ADR-064) i tokensystemets semantik-/komponentlager — skarp mappning kurs mot färg som ersätter prototypens namn-matchning. Konsumeras av kalendervyn (17.4) och Gruppdynamik (18.10). Möjliggörare — täcker inga egna användarberättelser.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tokensen bor i semantik-/komponentlagret; inga hårdkodade färger i komponenter och primitivlagret orört
- [ ] #2 Mappningen kurs mot token täcker taxonomins klasser + Annat som uppsamling och konsumeras via ett enda uppslag (ingen namn-matchning i vyer)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
