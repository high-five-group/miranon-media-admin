---
id: TASK-17.1
title: 'Skiva: ToggleButtonGroup-primitiven (pill-toggeln)'
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-17
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Biblioteket får en ny primitiv på React Aria ToggleButtonGroup i pill-formen: minimaltest först, därefter demo- och spec-sektion per NavCard-precedenten. Period- och vy-toggeln på listan samt eventsidans flik-kapslar blir konsumenterna. Tangentbordsnavigation, fokusindikation och axe-0 per 11/11/11-ribban. Täcker användarberättelser: 1, 2 (TASK-17).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Primitiven finns i biblioteket med demo- och spec-sektion och klarar axe-0 i a11y-mönster-specen
- [ ] #2 Tangentbord: pilnavigering + val fungerar; fokusindikationen följer globala ringen
- [ ] #3 Minimaltest bevisat före full implementation
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
