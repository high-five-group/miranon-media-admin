---
id: TASK-357
title: >-
  Fynd: seed:review sätter inga prisfält — granskningsfixturens anmälningar
  saknar Saknas (kr)-underlag
status: To Do
assignee: []
created_date: '2026-09-01 13:25'
labels:
  - ready-for-agent
dependencies: []
ordinal: 660000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur S113 paus 7 (sessionsdok § Paushistorik paus 7, CARRY/steg 9): seed:review-skriptet (scripts/seed-review-fixture.mjs) skapar anmälningar utan prisfälten (Avtalat pris (kr)/eventpris), så Saknas (kr) blir BLANK i granskningsdatan — S113B-fixturen fick priserna satta FÖR HAND under designvandringen. Åtgärd att pröva: seed-skriptet sätter eventpris (och ev. avtalat pris på delmängd) så betalningsytorna får realistisk granskningsdata. Källa: sessionsdok S113 paus 7 steg 9-listan.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
