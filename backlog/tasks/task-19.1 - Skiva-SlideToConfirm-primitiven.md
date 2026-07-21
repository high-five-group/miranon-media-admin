---
id: TASK-19.1
title: 'Skiva: SlideToConfirm-primitiven'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-19
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Biblioteket får dra-till-bekräfta-primitiven: drag-vakter, grepp-krav och offset ur konvergensen, drag-tillstånd i ref (L300), tangentbords- och icke-drag-väg som KRAV för 11-ribban (draget är förstärkning, aldrig enda vägen), armerat läge med bock och monotext utan fyllnad, diskret pling med preferens-respekt; minimaltest först, därefter demo- och spec-sektion samt a11y-mönster-spec per primitiv-standarden. Täcker användarberättelser: 5, 9-11 (TASK-19).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Armering fungerar med mus-drag OCH tangentbord; tillståndet oarmerat/armerat annonseras begripligt (axe-0 i mönster-specen)
- [ ] #2 Plinget respekterar användarens preferenser; armerat läge renderar bock + monotext utan fyllnad mot facit-handtaget
- [ ] #3 Minimaltest bevisat före full implementation
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
