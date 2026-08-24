---
id: TASK-318
title: >-
  claude.ai-projektkunskapen har lämnats — synk-raderna och Update-momenten
  behöver översyn
status: To Do
assignee: []
created_date: '2026-08-24 14:30'
labels:
  - ready-for-agent
dependencies: []
ordinal: 581000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus i klartext 2026-08-24 (S112): 'Kör inte med Claude.ai längre.' Konsekvenser att hantera: (1) CLAUDE.md § Synk-horisont och arkiv-åtkomst beskriver claude.ai-projektkunskapens synk som aktiv yta (ADR-048) — raderna behöver omskrivas eller arkiveras mot det nya läget; (2) det stående handover-momentet 'klicka Update i claude.ai' utgår ur alla framtida session-handovers (redan struket från S112:s); (3) ADR-048 kan behöva en Updates-post. Scope-känsligt: rör konstitutionstext — utförs som eget litet pass med diff till Marcus, inte tyst.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CLAUDE.md § Synk-horisont uppdaterad mot det nya läget, diff visad Marcus
- [ ] #2 ADR-048 § Updates-post med Marcus-citatet och datum
- [ ] #3 Inga kvarvarande Update-klick-moment i styrande ytor (grep-verifierat)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
