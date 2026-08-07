---
id: TASK-158.2
title: 'Skiva: arkiverings-skriptet — fönsterregeln + atomisk länk-omskrivning'
status: To Do
assignee: []
created_date: '2026-08-07 12:26'
labels:
  - ready-for-agent
dependencies:
  - TASK-158.1
parent_task_id: TASK-158
ordinal: 273000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en körning av skriptet mot en rot som överskrider fönstret flyttar exakt de äldsta stängda doken till arkivets månadsmapp, skriver om varje inkommande länk i samma körning, och lämnar en rot som matchar fönsterregeln — körd mot en rot inom fönstret gör den ingenting. Täcker användarberättelser: 3, 4, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass mot live: rotens faktiska bestånd per lifecycle, arkivets månadsmappsform och de inkommande länkarnas form (77 filer länkar in) verifierade FÖRE implementation
- [ ] #2 Skript i scripts/ med universell logik; fönstertalet + undantag i egen policy-konfig; idempotent; torrkörnings-läge som default-säkring (gren-städarens mönster)
- [ ] #3 Flytt + omskrivning av ALLA inkommande länkar sker atomiskt i samma körning — ingen transient bruten länk i något commit-bart mellanläge
- [ ] #4 paused/active-dok flyttas ALDRIG oavsett ålder; fail-closed på oparsbart lifecycle-fält
- [ ] #5 Tvåsidig testsvit i test-familjens form: fäller/släpper/fail-closed; shellcheck-strict grön
- [ ] #6 PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
