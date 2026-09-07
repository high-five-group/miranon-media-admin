---
id: TASK-425
title: >-
  Fynd: backlog-stängning (nightly) rött — nio Done-kort ur S121 (374.5, 381,
  402.1, 402.3, 402.4, 402.8, 410, 411, 412) med obockad DoD; bocka mot belägg
  eller öppna ärligt, enbart via CLI
status: To Do
assignee: []
created_date: '2026-09-07 15:30'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 755000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Nightly-körning 34088565869 (2026-09-07 05:54 UTC), jobbet 'Backlog-stängning (natt-grind)' rött: 'Backlog-DRIFT (exit 1): grinden fann inkonsistenta kort', invariant 2 (stängt men obockat) med ❌-rader för TASK-412, 411, 410, 402.8, 402.4, 402.3, 402.1, 381, 374.5 — samtliga stängda av S121 (sessionsdok S121, lifecycle closed 2026-09-06). Loggen bär dessutom två äldre listor (invariant 1/3, 41 resp. 25 kort-ID:n, t.ex. TASK-118, 124, 18, 173.x, 283.x, 346.x) som INTE ingår i detta korts scope: inventera dem och bokför i notes vilken invariant och vilket antal, minta ett separat fynd-kort om de fäller grinden på egen hand. Åtgärd för de nio: per kort läs kortets notes/PR/commit-belägg (gh pr list --search TASK-<id>), bocka DoD-punkterna mot belägget med 'task edit --check-dod' (eller motsvarande CLI-form), eller — saknas belägg — återöppna kortet ärligt med skäl i notes. Kortfiler ändras ENBART via backlog-CLI:t (PreToolUse-hooken nekar direktredigering).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Var och en av de nio korten: DoD bockad med belägg (PR-nummer/SHA) i notes ELLER återöppnad med skäl — inget kort lämnat i mellanläge
- [ ] #2 Grinden körd lokalt med CI:s kommando ur nightly.yml (jobbet Backlog-stängning); exit 0, eller kvarvarande ❌-rader bevisat tillhörande de äldre listorna och bokförda i notes med kort-ID
- [ ] #3 De två äldre listorna inventerade i notes (invariant, antal, exempel) och ett separat fynd-kort mintat om de fäller grinden på egen hand
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
