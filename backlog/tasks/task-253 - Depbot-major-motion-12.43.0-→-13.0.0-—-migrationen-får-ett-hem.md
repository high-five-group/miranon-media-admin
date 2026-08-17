---
id: TASK-253
title: 'Depbot-major: motion 12.43.0 → 13.0.0 — migrationen får ett hem'
status: To Do
assignee: []
created_date: '2026-08-17 06:44'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 472000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #1490 (Dependabot 2026-08-17). Major-bump = ADR-031 Lager 4: manuell Marcus-review. Hygien-svepet 2026-08-17: inget kort bar migrationsjobbet. Motion-skillen + animationsytor (WOW-övergången 241.5, Sidbytesindikatorn 233) konsumerar biblioteket; v13:s breaking changes okarterade.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 v13:s changelog/breaking changes lästa och omfattningen i VÅR kodbas bokförd (vilka animationsytor, vilka API-brott)
- [ ] #2 Marcus-beslut: migrera nu eller parkera med motiv + omprövningsdatum
- [ ] #3 Vid migrering: DoD-fyran grön + animationsytor verifierade inkl. prefers-reduced-motion
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
