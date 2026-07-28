---
id: TASK-60
title: >-
  Fynd: acceptance-klassens tvåsidiga bevis körs för hand och överlever inte
  körningen
status: In Progress
assignee: []
created_date: '2026-07-28 01:15'
updated_date: '2026-07-28 01:22'
labels:
  - ready-for-agent
dependencies: []
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hermetikens andra led — att fixturens svar faktiskt BÄR testerna — har bevisats för hand i tre skivor i rad (TASK-59.2, 59.3, 59.4): neutralisera testets egna network.use()-överskuggningar, töm normalläget, kör, läs utfallet, återställ ur en scratchpad-kopia.

BEVISET FINNS DÄRMED BARA I AGENTENS RAPPORTTEXT. Inget i repot kan köra om det. Klassen är densamma som flera fynd i S91: något som SER verifierat ut men inte kan verifieras om.

VARFÖR DET BRÅDSKAR MÅTTLIGT MEN VERKLIGT: TASK-59.5 sätter sex filer i spel och 59.6 sju till. Handpåläggning skalar sämst just där — sex manuella patcha-kör-återställ-cykler är sex tillfällen att återställa fel.

PRECEDENTEN FINNS I REPOT: tests/visual/hermetik-vakt.spec.ts gör den röda körningen till leveransen med test.fail(), så en avstängd vakt inte kan se grön ut. Och gate-proof.yml (TASK-36.1) bevisar merge-grindens FAIL-gren med en negativ kontroll som självtest — samma mönster, en nivå upp.

VAD SOM INTE RÄCKER: att bara töma normalläget. En fil som överskuggar allt den behöver (persons-list gör det avsiktligt, för att assertera exakta sidstorlekar) får fortsatt sina svar ur sina egna handlers. Båda leden krävs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 HERMETIK_SJALVTEST=1 tömmer normalläget OCH gör testens egna network.use() verkningslösa — båda leden i en regim, eftersom vartdera ensamt lämnar en klass av tester obevisade
- [x] #2 Grinden kräver att ALLA tester fälls OCH att OmockadRequestError är orsaken i vart och ett — utfallet ensamt räcker inte, då en trasig assertion också gör en svit röd
- [x] #3 En tom svit ger RÖTT (fail-closed) — noll körda tester uppfyller annars villkoret vakuöst
- [x] #4 Negativ kontroll finns och bevisar att grinden kan fälla: utan regimen ska bedömningen falla
- [x] #5 Steget kör i CI:s acceptance-jobb och kostnaden är MÄTT mot jobbets timeout-tak, inte antagen
- [x] #6 Handrutinen är uttryckligen avskriven i acceptance-sömmens dokumentation, så TASK-59.5/59.6 inte upprepar den
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
