---
id: TASK-348
title: 'Mer-flikens etikett: Bygg segment → Segment'
status: To Do
assignee: []
created_date: '2026-08-31 08:50'
updated_date: '2026-08-31 09:24'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 652000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus S114-scope punkt 1 (kvitterad 2026-08-31, sessionsdok S114 Del 1). Mer-menyns segment-post bär etiketten 'Bygg segment' (src/routes/_authenticated/mer/index.tsx:116, NavCard, ikon Filter) — döps till 'Segment'. Sträng-förekomster i tester/ariaSnapshot-referenser som bär etiketten uppdateras i samma PR; rörs en facit-stämplad referens klassas ändringen per ADR-102 § amenderings-mekaniken (klassning utskriven, sidofil — aldrig tyst).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mer-fliken visar etiketten Segment; route /mer/segment oförändrad
- [x] #2 Inga kvarvarande 'Bygg segment'-förekomster i src/ eller tests/ (historiska dok undantagna)
- [x] #3 Ev. berörda facit-referenser amenderade per ADR-102 med utskriven klassning
- [ ] #4 DoD-grindarna gröna (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
