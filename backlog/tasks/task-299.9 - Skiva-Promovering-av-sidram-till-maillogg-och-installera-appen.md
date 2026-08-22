---
id: TASK-299.9
title: 'Skiva: Promovering av sidram till maillogg och installera-appen'
status: To Do
assignee: []
created_date: '2026-08-22 19:35'
labels:
  - ready-for-agent
dependencies:
  - TASK-299.5
parent_task_id: TASK-299
ordinal: 549000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
De två sista Mer-sidorna får husets sidram, så hela familjen har samma tillbaka-knapp och samma sidhuvud. INGEN initialcirkel: mailloggens rad är ett utskick med ett mottagarantal, inte en person, och installera-appen är ingen lista alls. Innehållet på båda sidorna rörs inte. Maillogg har en acceptance-skarv; installera-appen saknar helt skarv och får sin första. Täcker användarberättelser: 11, 12, 18, 21.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Maillogg och installera-appen bär den delade sidramen; gamla textlänken och dubblerade sidmarginalen borta på båda
- [ ] #2 Ingen initialcirkel på någon av de två sidorna
- [ ] #3 Innehållet på båda sidorna oförändrat
- [ ] #4 Båda sidorna har visuell spec med baslinje för desktop och mobil
- [ ] #5 Installera-appen har fått sin första acceptance-skarv; mailloggs befintliga är utvidgad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
<!-- DOD:END -->
