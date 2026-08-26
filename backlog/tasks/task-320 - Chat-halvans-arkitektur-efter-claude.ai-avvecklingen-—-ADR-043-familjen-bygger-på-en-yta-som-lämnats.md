---
id: TASK-320
title: >-
  Chat-halvans arkitektur efter claude.ai-avvecklingen — ADR-043-familjen bygger
  på en yta som lämnats
status: To Do
assignee: []
created_date: '2026-08-24 17:36'
labels:
  - fynd
dependencies: []
ordinal: 584000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur TASK-318-passet (S112, 2026-08-24, full träfflista i PR #1957): Marcus har lämnat claude.ai ('Kör inte med Claude.ai längre', 2026-08-24), men session-lifecycle-arkitekturen bär en Chat-halva som förutsätter den ytan: ADR-043 (hela dokumentet), ADR-069, ADR-034 beslut #9, ADR-041 rad ~101, ADR-085/ADR-099-rationale, CONTRIBUTING.md rad ~25 ('claude.ai (läsyta)'), samt hubbens claude-app-skills/session-{start,end,resume} (ej undersökta — hub-uppföljning). Detta är en ARKITEKTURFRÅGA (grillningsklass): rivs Chat-halvan öppet, arkiveras den som vilande, eller ersätts den av annan yta? Beslutet är Marcus; under-baren-hantering vore fel klass — flera Accepted-ADR:er berörs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus vägval taget (grillning vid behov): riv öppet / vilande / ersätt
- [ ] #2 Berörda ADR:er får Updates-poster enligt vägvalet; hub-skillsen inventerade
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
