---
id: TASK-19.4
title: 'Skiva: Publiceringsflaggan'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-19.3
parent_task_id: TASK-19
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Publiceringsflaggan föds som ADDITIVT bas-fält (staging först), skapa-operationens allowlist utökas och handtaget armerar flaggan på riktigt; skapa utan publicering förblir default. Vad flaggan STYR på miranon.se (kalender-synlighet, anmälningsformulär, event-sida) är T79:s kontrakt — utanför detta kort. Täcker användarberättelser: 5, 6 (TASK-19).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fältet additivt i staging; allowlist-utökningen kontraktstestad: armerat ger flaggan satt, oarmerat lämnar den osatt
- [ ] #2 Handtags-armeringen bevisad ände-till-ände i e2e mot staging med teardown
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT-UTÖKNINGEN: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
