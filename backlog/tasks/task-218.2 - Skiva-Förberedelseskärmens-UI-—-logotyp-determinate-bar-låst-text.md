---
id: TASK-218.2
title: 'Skiva: Förberedelseskärmens UI — logotyp, determinate bar, låst text'
status: To Do
assignee: []
created_date: '2026-08-15 08:47'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-218
ordinal: 416000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en props-driven helskärmsyta (klara/totalt) med Miranon-logotypen, en determinate förloppsbar som fylls med förloppet, och exakt texten "Förbereder ditt administrationsverktyg" under baren (Marcus-låst ordalydelse, ORDLISTA: Förberedelseskärmen). Byggs och granskas fristående i dev-primitiva ytan innan integration. Täcker användarberättelser: 1, 6, 7 (PRD TASK-218).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skärmen renderar logotyp, determinate bar och den exakta låsta texten; helt props-driven utan egen datahämtning
- [ ] #2 Förloppet annonseras med progressbar-semantik och polite-besked för skärmläsare; prefers-reduced-motion respekteras; prefers-contrast: more klarad
- [ ] #3 Ytan är granskningsbar i dev-primitives-routen i alla förloppslägen (0 %, delvis, full)
- [ ] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
