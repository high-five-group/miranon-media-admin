---
id: TASK-147.2
title: 'Skiva: Bekräftelsemailet skarpt ände-till-ände'
status: To Do
assignee: []
created_date: '2026-08-10 06:59'
updated_date: '2026-08-10 12:01'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.1
parent_task_id: TASK-147
priority: high
ordinal: 339000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Första åtgärden görs verklig: 'Skicka bekräftelsemail' (ATGARDER nr 1) kopplas från den promoverade B′-formen till 147.1:s sändväg. Lotta markerar deltagare på eventdetaljen → Åtgärder → granskar med ifyllda platshållare → skickar → ser ärligt delutfall; fallna ligger kvar markerade. 'Skickad'-stämpeln i basen sätts av EF:n vid faktisk sändning — stämplingslögnen död för denna väg. READ-ONLY-docblocken i AtgardsSida.tsx uppdateras (koordinera mot task-174 som rör samma docblock).

Täcker användarberättelser: 1, 2, 3, 9, 11, 12, 14, 26.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Åtgärd 1 sänder verkligt server-utskick via 147.1-vägen mot staging; mottagare avmarkeringsbara in i det sista
- [x] #2 Granskningsytan och utfallslägena är identiska med facit tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json ytan atgarder-granskning (aria-referenserna atgarder-granskning-*.aria.yml + atgarder-utfall-*.aria.yml)
- [x] #3 Fallna mottagare kvar markerade efter delutfall; omkörning träffar bara dem
- [x] #4 Skärmläsare: körningens förlopp och resultat annonseras
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning mot tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json utförd (ADR-102 R3)
- [x] #6 Delutfallet prövat som delutfall (PRD DoD 7-arv)
<!-- DOD:END -->
