---
id: TASK-233
title: >-
  Fynd: Förberedelseskärmen mikro-blinkar vid sidbyten - rotens
  Suspense-fallback saknar delay
status: To Do
assignee: []
created_date: '2026-08-15 23:43'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 433000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 10 (Marcus 2026-08-16): 'laddnings-sidan dyker upp en mikro-sekund ibland vid sidbyten, skit störande'. ROTORSAK (kodläst): __root.tsx rad ~43-53 - Suspense-fallbacken för route-Outlet är HELA Forberedelseskarm (218.3/ADR-112 ersatte nakna Laddar-texten). Vid SPA-sidbyten som laddar en lazy route-chunk suspendar React kort och fullskärmen blinkar fram. Skärmen är designad för boot/warmup - som chunk-fallback är den fel vikt. FIX-KLASS (branschmönstret, agenten researchar/väljer): delayed fallback (tyst ~250-300 ms innan något visas - de flesta chunk-laddningar hinner klart) och/eller lättare fallback för route-byten; tyst-vid-varmt-regeln (ADR-112 beslut 2) ska respekteras. BYGGORDNING: EFTER TASK-227 landat - samma domän (gate/skärm-samspelet i main.tsx), kollisionsrisk annars.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sidbyten blinkar aldrig fullskärmen - chunk-laddningar under tröskeln är helt tysta
- [ ] #2 Boot-/kallstartsfallet (218.4-e2e) och 227-fallet opåverkade gröna
- [ ] #3 DoD-kvartetten gron
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
