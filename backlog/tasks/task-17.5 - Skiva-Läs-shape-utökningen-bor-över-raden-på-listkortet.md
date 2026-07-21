---
id: TASK-17.5
title: 'Skiva: Läs-shape-utökningen + bor över-raden på listkortet'
status: To Do
assignee: []
created_date: '2026-07-21 08:20'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.2
  - TASK-18.7
parent_task_id: TASK-17
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Listkortens bor över-rad (säng-glyf + antal) läser en HÄRLEDD summering av bor över-kryssen per Anmälan ur event-läsningen; eventKey följer med i läs-shapen. Read-only-utökning — inget nytt lagrat räknefält, ingen bas-ändring (fältet föds i TASK-18.7). Täcker användarberättelser: 9 (TASK-17).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Shape-utökningen kontraktstestad: summeringen motsvarar antalet ikryssade i staging-fixturen
- [ ] #2 Bor över-raden renderar per facit på korten; slot-modellen intakt med platshållare vid noll
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
