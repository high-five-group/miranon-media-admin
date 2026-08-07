---
id: TASK-160.4
title: 'Skiva: post-compact-igenkänningen'
status: To Do
assignee: []
created_date: '2026-08-07 16:59'
labels:
  - ready-for-agent
dependencies:
  - TASK-160.3
parent_task_id: TASK-160
ordinal: 286000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en session som just kompakterats möts av en mekanisk omorientering mot disk i stället för att lita på sammanfattningen — kärnytorna re-läses, monitorn startas om, markören rensas. Täcker användarberättelse: 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SessionStart-igenkänning av compact-källan (source-fältet) injicerar omorienterings-instruktionen: re-läs kärnytor (todo-kadensrad, sessionsdokets senaste Del, git-status), starta om monitorn, rensa markörfilen
- [ ] #2 Tvåsidig testsvit: injicerar vid compact-källa, tyst vid övriga källor (startup/resume/clear), fail-closed-beteende definierat; shellcheck-strict grön
- [ ] #3 Skarpbevis-skulden ÖPPET bokförd med differentialrecept — hooken kan inte laddas i byggsessionen
- [ ] #4 PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
