---
id: TASK-258
title: 'Städ: död kod efter segment-rivningen + PrototypNots felaktiga kommentar'
status: To Do
assignee: []
created_date: '2026-08-17 09:08'
updated_date: '2026-08-28 05:10'
labels:
  - stad
  - ready-for-human
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC saknas medvetet: kortet bundlar mekanisk dead-code-rivning (SavedSegmentsList.tsx, SegmentMailCompose.tsx, useSaveSegment) med en scope-öppen fråga: 'Beslut om export-funktionens öde (SKOOL-exporten har ingen UI-yta längre, 249.9 divergens 3) ingår.' Kräver Marcus-beslut om src/lib/segment-export.ts ska rivas, behållas som headless-funktion, eller få en ny UI-yta, innan full AC kan skrivas för hela kortet. Källa: kortets egen Description. Verifierat av registerhygien-passet 2026-08-28 — satte label ready-for-human (saknades, hade bara 'stad').
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: bygg-agent TASK-259
created: 2026-08-17 10:14
---
TASK-259 TAR PrototypNot-BITEN. Städkortets punkt om att PrototypNot står kvar i VariantD med en kommentar som felaktigt påstår att den 'försvinner vid flippen precis som riggen' är åtgärdad i TASK-259 (Marcus QA-fynd 2026-08-17): komponenten, samtliga SJU monteringsställen och den felaktiga kommentaren är rivna. Kvar för 258: SavedSegmentsList.tsx, SegmentMailCompose.tsx, src/lib/segment-export.ts, useSaveSegment + beslutet om export-funktionens öde. Verifierat under 259-bygget att SegmentMailCompose.tsx inte importeras av någon komponent (endast omnämnd i kommentarer) — dess laddtext 'Räknar mottagare…' lämnades därför ORÖRD av 259s shimmer-pass, eftersom den inte når någon yta i drift.
---
<!-- COMMENTS:END -->
