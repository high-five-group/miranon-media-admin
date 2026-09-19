---
id: TASK-472
title: >-
  Gatekeeper-sviterna delar fasta /tmp-sökvägar — falskt rött när två agenter
  verifierar samtidigt
status: To Do
assignee: []
created_date: '2026-09-19 01:36'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 813000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt fyra gånger under S126 resume 2 (2026-09-18/19): npm run verify:ci-parity:fast blev röd hos K1 (b)-, S5- (två gånger) och S4-agenten på sviter de inte rört; samma sviter gröna isolerat. K1 (b)-agenten fångade orsaken med ps aux: en annan agents identiska körning mot samma icke-slumpade /tmp-sökvägar (bl.a. scripts/test-check-frontmatter.sh). Under flottdrift är det normalfallet, inte ett undantag — och varje falskt rött kostar en omkörning och urholkar förtroendet för verktyget. Åtgärd: varje testsvit under scripts/ skapar sin arbetskatalog med mktemp -d (eller motsvarande i .mjs) och städar den i en trap; inga fasta sökvägar, inga delade filnamn.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 grep över scripts/test-* efter fasta /tmp-sökvägar ger noll träffar; varje svit använder mktemp -d + trap
- [ ] #2 Två samtidiga verify:ci-parity:fast-körningar i samma maskin blir båda gröna — bevisat med en parallellkörning
- [ ] #3 En vakt (steg i befintligt lint-jobb, inget nytt jobb) fäller om en ny svit inför en fast /tmp-sökväg
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
