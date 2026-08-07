---
id: TASK-161.8
title: 'Skiva: frys eller återuppliva — tre dok ut ur mellanläget'
status: To Do
assignee: []
created_date: '2026-08-07 19:12'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.4
parent_task_id: TASK-161
ordinal: 298000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: de tre mellanläges-doken är antingen ärligt frusna med banderoll eller levande med disk-synk — läsaren kan mekaniskt skilja karta från historik. Täcker användarberättelse: 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 airtable-interaction.md avgjord mot ägar-deklarationens facit: ANTINGEN frys-banderoll (ADR-100 §4:s tre element) + nytt tunt levande kontrakt-dok som pekar på kodens ägda ytor, ELLER fullständig återupplivning mot disk (28 EF, 13 operationer) — beslutet motiveras i PR-texten, aldrig mellanläge
- [ ] #2 hur-systemet-funkar.md-tvillingen: deklarerad synk-ägare med riktning (spoken källa, psionautics-kopian bär banderoll med pekare hit) ELLER kapad tvilling — beslut + motivering i PR-texten
- [ ] #3 BYGGPLAN-LÄTTLÄST-v3.md klassad mot sin egen text och fas-läget: frys-banderoll eller uppdaterings-plan; vid genuin tveksamhet STOPPA och bokför öppet i stället för att gissa
- [ ] #4 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
