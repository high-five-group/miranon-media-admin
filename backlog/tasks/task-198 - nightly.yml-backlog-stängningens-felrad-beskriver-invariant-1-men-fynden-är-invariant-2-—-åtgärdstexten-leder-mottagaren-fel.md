---
id: TASK-198
title: >-
  nightly.yml: backlog-stängningens felrad beskriver invariant 1 men fynden är
  invariant 2 — åtgärdstexten leder mottagaren fel
status: To Do
assignee: []
created_date: '2026-08-11 18:30'
labels: []
dependencies: []
priority: low
ordinal: 363000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Belägg (rödklassningen 2026-08-11, run 31454392944 job 93665096973): grinden fann 14 inkonsistenta kort — SAMTLIGA invariant 2 ('Done + obockad DoD', check-backlog-closure.sh rad 167, medvetet utan karens; rätt åtgärd = bocka DoD mot belägg eller öppna ärligt). Men jobbets ##[error]-rad lyder 'kort vars arbete är bevisat klart står öppna bortom karensen. Åtgärd: stäng korten' — det är invariant 1:s text och MOTSATT åtgärd. Texten sitter i .github/workflows/nightly.yml (steget kring rad 428–445) och återges ordagrant i natt-issuen varje natt. Fix: låt felraden skilja invarianterna (eller återge skriptets egen per-invariant-summering). Kosmetisk men vilseledande — samma klass som task-180 (larmtext som pekar fel).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
