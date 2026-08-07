---
id: TASK-149.6
title: 'Skiva: inventeringen — arbetsform-reglernas bärarkarta'
status: To Do
assignee: []
created_date: '2026-08-07 10:34'
updated_date: '2026-08-07 11:14'
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
- [ ] #3 PR armerad, per-jobb-grön
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
