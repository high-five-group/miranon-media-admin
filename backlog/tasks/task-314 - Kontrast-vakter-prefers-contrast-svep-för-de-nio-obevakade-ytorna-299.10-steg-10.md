---
id: TASK-314
title: >-
  Kontrast-vakter: prefers-contrast-svep för de nio obevakade ytorna (299.10
  steg 10)
status: To Do
assignee: []
created_date: '2026-08-24 13:43'
labels:
  - ready-for-agent
dependencies: []
ordinal: 575000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-beslut 2026-08-24 (S112, alternativ a): bygg automatiska prefers-contrast: more-svep för de nio ytor som saknar täckning, så att QA-kortet 299.10:s steg 10 blir mekaniskt belagt (samma väg som steg 9/mobil belades) och skyddet blir permanent. Ytorna (ur 299.10:s stängningsanalys 2026-08-23): /mer/anmalningar · väntelistan · intresserade · maillogg · installera-appen · aktivitetshistoriken · dokumentytan · persondetaljen · Hem/bevakningsraden. FÄRDIG FÖREBILD: tests/visual/dorrlista-promoverings-grind.spec.ts rad ~736–812 (kontrast + reduced-motion + print i samma fil) — följ dess form exakt, återuppfinn inte.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 prefers-contrast: more-svep finns för samtliga nio ytor enligt dörrlistans mönster
- [ ] #2 Negativ kontroll: minst ett svep bevisat kunna fälla (riktad mutation, reverterad efter bevis)
- [ ] #3 Notes-rad på 299.10 med referens: steg 10 nu mekaniskt belagt — bockning av 299.10 AC #1 görs i separat stängningspass
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
