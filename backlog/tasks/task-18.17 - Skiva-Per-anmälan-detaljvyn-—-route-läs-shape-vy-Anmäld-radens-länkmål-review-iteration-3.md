---
id: TASK-18.17
title: >-
  Skiva: Per-anmälan-detaljvyn — route + läs-shape + vy (Anmäld-radens länkmål)
  (review-iteration 3)
status: To Do
assignee: []
created_date: '2026-07-23 08:55'
labels: []
dependencies:
  - TASK-18.5
parent_task_id: TASK-18
ordinal: 85000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg 2 (2026-07-23), lyft vid 18.5-granskningen: Anmäld-raden på personkortet SKA vara en länk till anmälan (facit K62: understruken = länk, Marcus-ordern), men länkmålet — per-anmälan-detaljvyn — är öppet bokfört som EJ byggd i prototypen (PRD-luckan: route + get-registration-shape; no-op-grammatiken K26). Fix-vågen 2026-07-23 återinför den understrukna no-op-affordansen per facit; denna skiva föder MÅLET: route (form avgörs, t.ex. /event/$eventId/anmalan/$registrationId), läs-shape (egen get-registration eller återbruk av get-registrations-berikningen) och vy-designen — NY facit-yta saknas, designbeslut/grillning krävs före bygge (design-fork-normen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus designbeslut bokfört: vy-innehåll + route-form + shape-väg (grillning vid design-fork)
- [ ] #2 Vid bifall: route + shape + vy levererade; Anmäld-radens no-op byts till Link; e2e täcker navigering + shape; DoD-arvet per skiva
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
