---
id: TASK-252
title: 'Depbot-major: @tanstack/react-table 8.21.3 → 9.1.2 — migrationen får ett hem'
status: To Do
assignee: []
created_date: '2026-08-17 06:42'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 471000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #1491 (Dependabot 2026-08-17, måndags-schemat). Major-bump = ADR-031 Lager 4: manuell Marcus-review, aldrig auto-merge. Hygien-svepet 2026-08-17 fann inget kort som bär migrationsjobbet — detta kort är hemmet. Tabellytor i appen konsumerar react-table; v9:s breaking changes okarterade.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 v9:s changelog/breaking changes lästa och migrationens faktiska omfattning i VÅR kodbas bokförd på kortet (vilka ytor, vilka API-brott)
- [ ] #2 Marcus-beslut: migrera nu eller parkera med motiv + omprövningsdatum
- [ ] #3 Vid migrering: DoD-fyran grön + tabellytorna verifierade i browsern
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
