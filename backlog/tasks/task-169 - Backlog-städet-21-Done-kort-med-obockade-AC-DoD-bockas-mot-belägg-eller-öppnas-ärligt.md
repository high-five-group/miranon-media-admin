---
id: TASK-169
title: >-
  Backlog-städet: 21 Done-kort med obockade AC/DoD bockas mot belägg eller
  öppnas ärligt
status: To Do
assignee: []
created_date: '2026-08-09 07:18'
labels:
  - ready-for-agent
dependencies: []
ordinal: 312000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nattgrindens stående fynd (senast run 31291660374, 2026-08-09: 21 kort — 145.1, 145.2, 146.1–146.3, 148.1–148.4, 149.1 m.fl., fullständig lista i körningens logg). Klassen: kort som flippats Done i tidigare sessioner utan att AC-/DoD-rutorna bockades via CLI. Uppgiften per kort: läs kortets AC/DoD, pröva varje ruta mot faktiskt belägg (mergad PR, CI-körning, bokförd verifiering i sessionsdok/BUILD-LOG) — bocka de som ÄR betalda med beläggs-referens i notes; en ruta utan belägg lämnas obockad och kortet flippas ÄRLIGT tillbaka till To Do/In Progress med notering (aldrig bocka på antagande — grinden finns för att skydda Done-betydelsen). Relaterat men EJ samma: 145.3/145.5 står ej Done och väntar DoD #5-bedömning (design-review — Marcus 162.5-QA + baslinje-välsignelsen är trolig täckning, prövas) + DoD #6 (baslinjen NU omtagen: #1027) — ta dem i samma svep. Nattärendet #1028 stängt med detta kort som ägare; grinden går grön när svepet är klart.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga 21 kort genomgångna: varje ruta bockad MED beläggs-referens eller kortet ärligt återöppnat
- [ ] #2 145.3/145.5 prövade och stängda eller öppet bokförda
- [ ] #3 Backlog-stängnings-grinden grön i nästa nattkörning eller dispatch
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
