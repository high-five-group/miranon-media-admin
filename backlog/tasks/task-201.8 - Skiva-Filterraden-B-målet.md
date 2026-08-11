---
id: TASK-201.8
title: 'Skiva: Filterraden (B-målet)'
status: To Do
assignee: []
created_date: '2026-08-11 20:27'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.6
parent_task_id: TASK-201
ordinal: 373000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Lotta hittar en specifik händelse med max ett klick — kategori, event eller tidsperiod. Återbruk av färdiga primitiver; EF-kontraktet från 201.5 bär redan parametrarna så ingen serverändring ingår. Detta fullbordar B-målet (S105 Del 2 beslut 1).

Täcker användarberättelser: 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Filterrad ovanför kärnvyns lista: kategori-dropdown + event-dropdown (Select-primitiven) + tidsperiod (ToggleButtonGroup: Idag / 7 dagar / 30 dagar / Allt); klientfiltrering över hämtad lista
- [ ] #2 Tomläge för "inga träffar med detta filter" — skilt från första-gången-tomläget
- [ ] #3 A11y: labels på alla kontroller, full tangentbordsväg, axe grönt
- [ ] #4 Filtervalens URL-state-hantering prövas mot URL-STATE-SPEC:s mönster vid bygget (mät mot specen, anta inte) och utfallet bokförs i notes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
