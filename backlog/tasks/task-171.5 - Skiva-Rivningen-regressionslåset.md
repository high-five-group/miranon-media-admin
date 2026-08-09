---
id: TASK-171.5
title: 'Skiva: Rivningen + regressionslåset'
status: To Do
assignee: []
created_date: '2026-08-09 08:26'
labels:
  - ready-for-agent
dependencies:
  - TASK-171.4
parent_task_id: TASK-171
ordinal: 320000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: variant-koden och railen för åtgärds-/granskningsytan rivs mekaniskt — det som rivs är villkor och växlar, aldrig formen (ADR-103 B2 steg 4; 145.6-mönstret). check-facit-invarianten vaktar: rivning kräver satt godkand-fält. Efter rivningen: stale-URL-bevis, ariaSnapshot-referenserna gröna mot den rivna ytan (regressionslås), och visual-baslinjen omtas via CI-artefakt. Täcker användarberättelser: 15.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Variant-koden/railen riven; formen orörd (diff visar endast villkor/växlar)
- [ ] #2 check-facit grön med godkand satt; stale-URL-bevis bilagt
- [ ] #3 ariaSnapshot-referenserna gröna mot rivna ytan utan omtagning
- [ ] #4 Visual-baslinjen omtagen via CI-artefakt EFTER rivningen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Datavägs-invarianten verifierad: inga datakälla-grenar flippade
- [ ] #6 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
<!-- DOD:END -->
