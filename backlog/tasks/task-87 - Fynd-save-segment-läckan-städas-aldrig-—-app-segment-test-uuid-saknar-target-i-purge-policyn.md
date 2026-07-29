---
id: TASK-87
title: >-
  Fynd: save-segment-läckan städas aldrig — app-segment-test+<uuid> saknar
  target i purge-policyn
status: To Do
assignee: []
created_date: '2026-07-29 17:35'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 167000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`save-segment`-testerna skapar poster med mönstret `app-segment-test+<uuid>`. `.purge-staging-policy.json` har ingen target som matchar dem, så de städas **aldrig** — de ackumulerar i staging.

Klassen är känd: ADR-060:s purge-wiring har nått tröskeln två gånger förut (S52 create-event, S69 create-registration), båda gångerna för att en ny sentinel-form saknade target. Detta är den tredje instansen.

**Avgränsning:** skivan lägger till en target och bevisar att den fångar. Den städar INTE upp historiken utan att först räkna hur många poster som finns — en massradering mot staging utan räkning är precis det `TASK-76` visade är farligt.

Källa: restlistans § Spår E.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Antalet befintliga app-segment-test-poster i staging RÄKNAT och redovisat före något raderas
- [ ] #2 Target tillagd i .purge-staging-policy.json, och dess mönster prövat mot ett verkligt post-namn
- [ ] #3 Tvåsidigt bevis: purge fångar en planterad post med mönstret, och rör INTE en post utanför det
- [ ] #4 Preflighten (TASK-77) respekterad — ingen lokal staging-körning som kan krocka med CI
- [ ] #5 De permanenta rollup-fixturerna orörda — verifierat, inte antaget
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
