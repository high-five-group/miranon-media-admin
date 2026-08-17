---
id: TASK-258
title: 'Städ: död kod efter segment-rivningen + PrototypNots felaktiga kommentar'
status: To Do
assignee: []
created_date: '2026-08-17 09:08'
labels:
  - stad
dependencies: []
ordinal: 476000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
249.6-rivningen (PR #1501) lämnade medvetet död kod som INTE stod på rivningslistan (repot saknar dead-code-grind): SavedSegmentsList.tsx, SegmentMailCompose.tsx (tappade enda monteringsstället), src/lib/segment-export.ts (enda konsument: tests/api/segment-export.test.ts) och useSaveSegment (tappade produktionskonsumenterna). Dessutom: PrototypNot står kvar i VariantD med en kommentar som FELAKTIGT påstår att den 'försvinner vid flippen precis som riggen' — antingen rivs noten eller rättas kommentaren. Beslut om export-funktionens öde (SKOOL-exporten har ingen UI-yta längre, 249.9 divergens 3) ingår. Källa: 249.6- och 249.9-agenternas slutrapporter, S104 natt-orkestreringen 2026-08-17.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
