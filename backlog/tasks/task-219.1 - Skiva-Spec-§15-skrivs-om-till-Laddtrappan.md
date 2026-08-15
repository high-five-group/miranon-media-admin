---
id: TASK-219.1
title: 'Skiva: Spec §15 skrivs om till Laddtrappan'
status: To Do
assignee: []
created_date: '2026-08-15 08:49'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-219
ordinal: 420000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: designsystem-specens §15 ersätter det ovillkorade indikator-förbudet med Laddtrappans fyra steg per ADR-113 (skeleton för vyer/moduler med känd form · spinner ENDAST knapp-internt i arbetande knappar · determinate bar för längre kända förlopp · aldrig naken Laddar…-textrad som enda besked), med Lugnt laddläge kvar som överordnad princip och artighetsnivå-noten (laddbesked är polite status, aldrig alert — FK-avvikelsen bokförd). Kodkommentarer som citerar §15 med stale radreferens (off-by-14, bl.a. person-listans) rättas till sektionsreferens i stället för radnummer. Täcker användarberättelser: 5, 7 (PRD TASK-219).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spec §15 bär trappans fyra steg per ADR-113 med Lugnt laddläge som överordnad princip; ORDLISTA-termen Laddtrappan refereras
- [ ] #2 Artighetsnivå-noten (polite, ej alert) bokförd i spec-texten
- [ ] #3 Stale §15-radreferenser i kodkommentarer rättade till adresserbar sektionsform (grep-belagd lista i notes)
- [ ] #4 npm run check:docs grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
