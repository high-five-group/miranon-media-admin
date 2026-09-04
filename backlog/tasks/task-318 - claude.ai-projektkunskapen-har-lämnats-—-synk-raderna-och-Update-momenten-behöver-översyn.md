---
id: TASK-318
title: >-
  claude.ai-projektkunskapen har lämnats — synk-raderna och Update-momenten
  behöver översyn
status: Done
assignee: []
created_date: '2026-08-24 14:30'
updated_date: '2026-09-04 13:44'
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
- [x] #1 CLAUDE.md § Synk-horisont uppdaterad mot det nya läget, diff visad Marcus
- [x] #2 ADR-048 § Updates-post med Marcus-citatet och datum
- [x] #3 Inga kvarvarande Update-klick-moment i styrande ytor (grep-verifierat)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1: diffen visad Marcus i chatten 2026-09-04 (S119) och godkänd på hans mandat via orkestreraren; landad
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S119 stangningsbatch 2a (2026-09-04): PR #1957 mergad i origin/main, merge-SHA f64878c2 (verifierat mot origin/main-loggen, sok pa 'Merge pull request #1957'). CI-checks pa PR: SUCCESS/SKIPPED per jobb (Detect changed files, Analyze actions/js-ts, Lint + Audit + TypeCheck, Docs link check, CI Passed or Skipped, CodeQL alla SUCCESS; Test suite + Review-backstopp SKIPPED, D0-klassad diff). Diff omfattade CLAUDE.md, docs/decisions/ADR-048-synk-horisont-arkiv-atkomst.md, backlog/tasks/task-318 -- inga orelaterade filer. AC #3 (grep) aterverifierad av denna agent 2026-09-04: inga kvarvarande 'klicka Update i claude.ai'-moment i styrande ytor (CLAUDE.md/docs/decisions/docs/reference/.claude); enda 'Update'-traffen i docs/reference/data-model.md ror Airtable prod-UI, inte claude.ai.
<!-- SECTION:FINAL_SUMMARY:END -->
