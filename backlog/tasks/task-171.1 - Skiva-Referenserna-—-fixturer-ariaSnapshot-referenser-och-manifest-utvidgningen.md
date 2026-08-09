---
id: TASK-171.1
title: >-
  Skiva: Referenserna — fixturer, ariaSnapshot-referenser och
  manifest-utvidgningen
status: To Do
assignee: []
created_date: '2026-08-09 08:21'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-171
ordinal: 316000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den hermetiska fixturvärlden får fixturer för åtgärds-/granskningsytan (tomt läge · mottagarurval · granskningsläge · de tre utfallslägena), ariaSnapshot-referenser tas i variant-läget för samtliga lägen, och facit-manifestet utvidgas så check-facit-invarianten (godkand null => markörer kvar) täcker ytan. FACIT ÄR LÅST: Marcus låste åtgärds- och granskningssidan (inkl. granskningens ytor/lägen) som v1-facit i klartext 2026-08-09 — verbatim-citat i sessionsdok S93 Del 15 + PRD-kortets notes; referenstagningen mäter alltså mot godkänt facit. Täcker användarberättelser: 9, 11.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Facit-låsningen refererad i notes (citatkälla: S93 Del 15 + task-171 notes) FÖRE referenstagningen
- [ ] #2 Fixturvärlden bär åtgärds-/granskningsytans lägen: tomt läge, mottagarurval, granskningsläge, tre utfallslägen
- [ ] #3 ariaSnapshot-referenser tagna i variant-läget för samtliga lägen och incheckade
- [ ] #4 Facit-manifestet utvidgat med ytan; check-facit.sh grön inkl. tvåsidigt invariant-bevis
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: inga datakälla-grenar flippade
- [ ] #8 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
<!-- DOD:END -->
