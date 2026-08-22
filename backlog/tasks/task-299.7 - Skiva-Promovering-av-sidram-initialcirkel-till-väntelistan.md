---
id: TASK-299.7
title: 'Skiva: Promovering av sidram + initialcirkel till väntelistan'
status: To Do
assignee: []
created_date: '2026-08-22 19:29'
labels:
  - ready-for-agent
dependencies:
  - TASK-299.5
parent_task_id: TASK-299
ordinal: 547000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Väntelistan får husets sidram och initialcirkeln. Lotta möter samma tillbaka-knapp och samma sidhuvud som på anmälningssidan, och varje rad bär personens initialer till vänster om namnet. RADINNEHÅLLET RÖRS INTE (Marcus beslut 2026-08-22, alternativ B): fälten och deras ordning står kvar som de är — full radanatomi på en annan datatyp är en egen designfråga och inte detta pass. Sidan har i dag en acceptance-skarv men ingen visuell; den får en när den landar, så nästa ändring inte driver tyst. Täcker användarberättelser: 11, 12, 13, 18, 21.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Väntelistan bär den delade sidramen; den gamla textlänken och den dubblerade sidmarginalen är borta
- [ ] #2 Varje rad bär initialcirkeln ur den väntandes namn, med primitiv-komponenten — ingen ny inline-kopia
- [ ] #3 Radens fält och deras inbördes ordning är OFÖRÄNDRADE
- [ ] #4 Sidan har en visuell spec med baslinje för desktop och mobil
- [ ] #5 Befintliga acceptance-skarven utvidgad, inte omskriven
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
<!-- DOD:END -->
