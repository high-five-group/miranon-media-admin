---
id: TASK-149.6
title: 'Skiva: inventeringen — arbetsform-reglernas bärarkarta'
status: Done
assignee: []
created_date: '2026-08-07 10:34'
updated_date: '2026-08-09 08:11'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-149
ordinal: 260000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: systemägaren kan ur EN karta se vilka arbetsform-regler som når varje utförare mekaniskt och vilka som är beroende av att rätt dörr öppnades — och varje riskregel har ett plockbart kort. Grindklassens dubbla bärare är facit-modellen. Täcker användarberättelse: 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga arbetsform-regler i spoke (CLAUDE.md, CONTRIBUTING, agentfiler, skills-referenser) + hubbens disciplin-skills inventerade; varje regel klassad: mekanisk bärare / kort-buren / startdörrs-bunden — med källa (fil:avsnitt) och belägg per rad
- [x] #2 Kartan landad som research-dok; varje startdörrs-bunden regel med drift-risk har ett eget nytt kort skapat via backlog-CLI (fynd-kort, inte fixar i denna skiva)
- [x] #3 PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #870 (merge b929ce31), CI grön per jobb. Bärarkartan 132 regler; fynd-korten 154–156 födda.

[TASK-169, backlog-städet, 2026-08-09] DoD#1-4 bockade mot belägg. #1: AC redan [x]. #2: PR #870 — npm run check:docs 13/13 gröna (efter en Vale.Terms-fix). #3: PR #870 (merge b929ce31, 2026-08-07T11:28:39Z) — samtliga CI-jobb SUCCESS/SKIPPED, verifierat via gh pr view. #4: PR-filer (gh pr view 870 --json files) = task-149.6 + task-154/155/156 (fynd-korten AC#2 explicit kräver skapade) + docs/research/arbetsform-reglernas-bararkarta-2026-08-07.md — allt i scope.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
