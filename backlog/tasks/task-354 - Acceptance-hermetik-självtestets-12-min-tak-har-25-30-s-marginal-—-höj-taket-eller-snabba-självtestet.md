---
id: TASK-354
title: >-
  Acceptance-hermetik-självtestets 12-min-tak har 25-30 s marginal — höj taket
  eller snabba självtestet
status: To Do
assignee: []
created_date: '2026-08-31 13:08'
labels:
  - ready-for-agent
dependencies: []
ordinal: 657000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt under S113 (#2164:s CI-rundor, 2026-08-31): hermetik-SJÄLVTESTET (461/461 stoppade anrop) tangerar sitt 12-minuters jobb-tak med 25-30 s marginal och fällde en körning på taket, inte på en regression (omkörning grön). En massfällning av taket ser ut som en regression och kostar en felklassning + omkörningscykel. Åtgärd: mät var tiden går, höj taket ELLER parallellisera/snabba självtestet — beslutet kräver mätdata, inte gissning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tidsprofilen för självtestet mätt och bokförd (var går de 12 minuterna)
- [ ] #2 Taket eller körtiden justerad så marginalen är minst 2 min vid normal last, med mätbevis
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
