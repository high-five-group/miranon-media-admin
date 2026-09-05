---
id: TASK-384
title: >-
  Dubblett-person i prod-basen: två Personer-rader för samma e-post
  (task-260-klassen)
status: To Do
assignee: []
created_date: '2026-09-04 07:53'
labels:
  - ready-for-agent
dependencies: []
ordinal: 686000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två Personer-rader i prod-basen, record-ID:n recEVWVb7b9Iik2FN och recjcedZYo2wklLAS, bär samma e-postadress (funnet S114, se tasks/sessions/2026-08-31-session-114.md rad 670–672). E-postadressen skrivs INTE ut här — record-ID:n räcker (personuppgift i publikt repo, tråd T171). Klass-precedent: TASK-260 (QA-utredning leads och namnlösa i utskickspubliken) — samma basfråga-klass, resolution i basen per ADR-063.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Analys av båda raderna — vilka anmälningar, betalningar och länkar var och en bär, read-only via Airtable-MCP:n mot prod
- [ ] #2 Förslag på vilken rad som behålls och hur länkarna flyttas, bokfört i kortet
- [ ] #3 STOPPA före varje skrivning i prod-basen — sammanslagningen kräver Marcus GO i klartext (identifierande data)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
