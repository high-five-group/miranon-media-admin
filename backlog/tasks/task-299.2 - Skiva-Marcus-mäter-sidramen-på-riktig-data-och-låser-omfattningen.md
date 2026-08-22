---
id: TASK-299.2
title: 'Skiva: Marcus mäter sidramen på riktig data och låser omfattningen'
status: To Do
assignee: []
created_date: '2026-08-22 19:14'
labels:
  - ready-for-human
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 542000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus öppnar persondetaljen, check-in, aktivitetshistoriken och dokumentytan i appen med riktig data, slår om dev-parametern och ser den nya sidramen under händerna. Han väljer sedan hur brett den delade vy-grunden ska dras: bara sidkromet, sidkrom plus rubrikblock, eller full omfattning inklusive de två ytor som i dag bär den andra dialekten. Beslutet är det som låser skiva 6:s arbete. Täcker användarberättelser: 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla fyra ytorna granskade med och utan dev-parametern, på både desktop och mobil
- [ ] #2 Marcus har valt omfattning i klartext; valet citeras daterat på detta kort
- [ ] #3 Valet skrivs in i TASK-299 som en daterad not, så efterföljande skivor läser EN källa
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
<!-- DOD:END -->
