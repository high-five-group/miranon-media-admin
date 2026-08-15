---
id: TASK-218.4
title: 'Skiva: E2E-kallstartsfallet — persist-sviten utökas'
status: To Do
assignee: []
created_date: '2026-08-15 08:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-218.3
parent_task_id: TASK-218
ordinal: 418000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den befintliga persist-cache-E2E-sviten utökas med kallstartsfallet — tom cache, inloggning, Förberedelseskärmen syns, baren fylls, släpp till färdigt Hem utan synliga skeletons — och bevisar samtidigt att varm-/offline-kontrakten är orörda. Täcker användarberättelser: 1, 2, 3, 4 i bevisform (PRD TASK-218).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nytt kallstartsfall i persist-cache-sviten: skärm → fylld bar → färdigt Hem utan skeleton, grönt mot staging
- [ ] #2 Befintliga varm-/offline-AC:n gröna oförändrade i samma körning
- [ ] #3 DoD-kvartetten grön + berörd e2e-svit grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
