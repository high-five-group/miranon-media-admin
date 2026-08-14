---
id: TASK-212
title: 'Mocka get-event-notes i övriga staging-e2e-filer — TASK-205:s exponeringsklass'
status: To Do
assignee: []
created_date: '2026-08-14 16:12'
labels:
  - tests
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 386000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppföljning ur TASK-205:s diagnos (2026-08-14, PR #1273): rotorsaken till layout-invariant-fällningen var att event-bekraftelse.staging.test.ts fetchade get-event-notes OMOCKAT mot skarp staging — äkta 404 på testets egen fixtur-ID, felboxens render +57 px deterministiskt, race mot mätsekvensen.

Diagnos-agenten fann (källa: TASK-205 implementation notes, samma pass) att ytterligare staging-e2e-filer under tests/e2e/ navigerar till /event/:id utan get-event-notes-mock — samma exponeringsklass, ingen bekräftad fällning ännu: atgarder-bekraftelsemail, atgarder-betalningar, atgarder-kvitto, atgarder-paminnelse-eventinfo-fritt, atgarder-testmail, event-bor-over, event-deltagare, mark-paid (verifiera listan mot disk vid plock — den är agentens fynd, inte ett facit).

Åtgärd: applicera samma mock-konvention som TASK-205:s fix (GET_EVENT_NOTES i respektive mocka()/motsvarighet; förlagor finns i event-bekraftelse.staging.test.ts och mockNotes() i event-detail.staging.test.ts). Latent flake elimineras innan den fäller, i stället för fil för fil när natten blir röd.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje staging-e2e-fil som navigerar till /event/:id bär en get-event-notes-mock enligt den etablerade konventionen (listan ovan disk-verifierad vid plock, inte antagen)
- [ ] #2 Berörda filers testsviter gröna lokalt efter ändringen (exitkod läst separat, ej pipe)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
