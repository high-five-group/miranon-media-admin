---
id: TASK-18.7
title: 'Skiva: Bor över (bas-fältet + kryss-läget)'
status: To Do
assignee: []
created_date: '2026-07-21 08:20'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.4
parent_task_id: TASK-18
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bor över-raden (säng-glyf + antal) som sista summeringsrad; radens klick öppnar kryss-läget: alla anmälda i EN kolumn, säng-kryss per person, ikryssade stabilt överst, live-räknare. Kryssfältet föds som ADDITIVT bas-fält per Anmälan (staging först) med egen write-operation; summeringen härleds alltid — aldrig ett lagrat räknefält. Täcker användarberättelser: 17 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Kryssfältet additivt i staging; write-operationen kontraktstestad med teardown
- [ ] #2 Kryss-läget bevisat i e2e: en kolumn, stabil sortering, live-räknare; renderat mot facit
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
