---
id: TASK-179
title: >-
  E2E-synk: events-list.staging förväntar em-dash som TASK-172 rev — post-merge
  röd sedan #1055
status: To Do
assignee: []
created_date: '2026-08-10 06:17'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 336000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-172:s strecksvep (commit fe037701, PR #1055) bytte 'Event — ' till 'Event - ' i src/components/events/EventsList.tsx:443, men tests/e2e/events-list.staging.test.ts rad 1047 (kommentar) + 1062 (locator) förväntar fortfarande em-dash → expect(toBeVisible) timeout. Fäller post-merge + nattnätet sedan 2026-08-09: runs 31318903977, 31330124095, 31352038158 (issues #1057/#1066/#1068). PR #1064 som skulle synka testkonsumenterna missade denna fil. INTE revert — dash-ändringen är avsiktlig och Marcus-godkänd; fixen är test-strängen.

Källa: S102 triage-rapport 2026-08-10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Förväntad sträng i tests/e2e/events-list.staging.test.ts (rad ~1047 + ~1062) uppdaterad till kort streck i exakt den form EventsList.tsx renderar
- [ ] #2 Svep efter FLER em-dash-förväntningar i tests/e2e/ mot användarsynliga strängar som strecksvepet rev — synka alla träffar i samma commit
- [ ] #3 Post-merge-/staging-klassen bevisad grön på main efter landning (run-id i notes)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
