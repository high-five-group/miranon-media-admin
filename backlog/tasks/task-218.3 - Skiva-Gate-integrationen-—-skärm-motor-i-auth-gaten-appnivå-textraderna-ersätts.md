---
id: TASK-218.3
title: >-
  Skiva: Gate-integrationen — skärm + motor i auth-gaten, appnivå-textraderna
  ersätts
status: To Do
assignee: []
created_date: '2026-08-15 08:47'
labels:
  - ready-for-agent
dependencies:
  - TASK-218.1
  - TASK-218.2
parent_task_id: TASK-218
ordinal: 417000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: auth-gatens renderväg (ADR-037) utökas — kall/stale start visar Förberedelseskärmen driven av Startvärmningsmotorn tills släpp; varm start är HELT tyst (persist-kontraktet orört); offline-start går direkt in på sparad data; timeout släpper tyst. Appnivåns två nakna Laddar…-textrader (appstarts-gaten + rot-Suspense-fallbacken) ersätts av skärmen. Täcker användarberättelser: 2, 3, 4, 5 (PRD TASK-218).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Kall/stale start: Förberedelseskärmen visas tills warmup släpper; därefter färdigt Hem utan skeleton och omedelbara flikbyten
- [ ] #2 Varm start helt tyst och offline-start direkt in — befintliga persist-E2E-AC:n gröna oförändrade
- [ ] #3 Appnivåns två nakna Laddar…-textrader borta (grep-bevis); ingen ny textrad införd
- [ ] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
