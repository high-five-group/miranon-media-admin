---
id: TASK-17.1
title: 'Skiva: ToggleButtonGroup-primitiven (pill-toggeln)'
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-21 09:30'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AFK-drain (S75-batchen, run wf_dd115d9e-aca): kortet är BYGGT + GRANSKNINGSFÄRDIGT på origin/task/17.1 (2f0e666, förgrenat från 196c395, EN commit) — TDD rött-först 13 tester, alla lokala grindar gröna (biome 0 · typecheck 0 · api 296/296 · a11y 45/45 axe-0 · build), facit-avprickning computed-style + skärmdump mot S72-facit; AC 1–3 + DoD 1/2/4/6 bockade PÅ BRANCHEN. Merge-steget stoppades av batch-halten (18.1 claims-luckan, halt-first drain) — INTE av något fel i denna leverans. PLOCKA INTE OM: nästa steg är väg-beslut (merge av branchen via ordinarie merge-kedja), inte ombyggnad.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
