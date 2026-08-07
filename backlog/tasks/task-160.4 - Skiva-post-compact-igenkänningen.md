---
id: TASK-160.4
title: 'Skiva: post-compact-igenkänningen'
status: In Progress
assignee: []
created_date: '2026-08-07 16:59'
updated_date: '2026-08-07 18:20'
labels:
  - ready-for-agent
dependencies:
  - TASK-160.3
modified_files:
  - scripts/post-compact-igenkanning.sh
  - scripts/test-post-compact-igenkanning.sh
  - .claude/settings.json
parent_task_id: TASK-160
ordinal: 286000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en session som just kompakterats möts av en mekanisk omorientering mot disk i stället för att lita på sammanfattningen — kärnytorna re-läses, monitorn startas om, markören rensas. Täcker användarberättelse: 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SessionStart-igenkänning av compact-källan (source-fältet) injicerar omorienterings-instruktionen: re-läs kärnytor (todo-kadensrad, sessionsdokets senaste Del, git-status), starta om monitorn, rensa markörfilen
- [x] #2 Tvåsidig testsvit: injicerar vid compact-källa, tyst vid övriga källor (startup/resume/clear), fail-closed-beteende definierat; shellcheck-strict grön
- [x] #3 Skarpbevis-skulden ÖPPET bokförd med differentialrecept — hooken kan inte laddas i byggsessionen
- [ ] #4 PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sekvensberoende öppet bokfört (premiss-pass, ADR-086): TASK-160.2 (PR #943) var OPEN/BLOCKED (armerad i kön, ej på main) och TASK-160.3 (pre-compact-skillen) var fortfarande To Do när denna skiva byggdes — mätt via 'gh pr view 943' och 'npx backlog task task-160.3 --plain' 2026-08-07. Skivan basera på origin/main (utan .precompact-policy.conf); scripts/post-compact-igenkanning.sh sourcar .precompact-policy.conf OM den finns, annars fallback till det ADR-101-dokumenterade default-filnamnet .claude/precompact-markor.json (verifierat mot origin/feat/task-160-2-precompact-grinden:.precompact-policy.conf). Markörens JSON-schema (fokus_instruktion/satt_vid/sattare) är fullt specificerat i ADR-101 § Beslut 4, så TASK-160.3:s frånvaro är ingen teknisk blockerare — skriptet läser bara markörens NÄRVARO, aldrig dess innehåll. Fail-open valt medvetet: SessionStart kan strukturellt inte blockera sessionsstart (hooks.md, Can block? Nej), så varje internt fel (jq saknas, trasig indata, otolkbar policy) ger TYST exit 0 utan additionalContext — samma hållning som scripts/katalogagarskap-markor.sh. Skarpbevis-skulden (hooken kan inte laddas i denna byggsession) är dokumenterad i skriptets eget header med differentialrecept: provocera en REDAN laddad SessionStart-hook (katalogagarskap-markor.sh) parallellt nästa session för att skilja 'fel logik' från 'ej laddad än'.

PR #946 skapad och armerad (gh pr merge --auto, ingen strategiflagga; enabledAt 2026-08-07T18:20:28Z, mergeMethod MERGE satt av kön). AC4 lämnas medvetet obockad — bundlar 'per-jobb-grön' som DoD #3 explicit lämnar öppet för orkestrerarens CI-verifiering; kortet sätts INTE Done av byggagenten.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
