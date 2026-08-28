---
id: TASK-45
title: >-
  Kommande-filtret + närmast-först-sorteringen finns i två grammatiker — lyft
  till delad modul (manadsgrupp-klassen)
status: To Do
assignee: []
created_date: '2026-07-25 05:18'
updated_date: '2026-08-28 05:07'
labels:
  - ready-for-agent
dependencies: []
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Review-pilotens utanför-scope-fynd i task-18.18 (S86-nattbatchen): EventsLists filterByPeriod ('upcoming'-grenen: dateValue >= idagStart + stigande sort) och EventValjarens grupper-memo gör SAMMA kommande-filter + närmast-först-sort oberoende av varandra (src/components/events/EventsList.tsx filterByPeriod · src/components/events/EventValjare.tsx grupper-useMemo). Exakt driftklassen facit-punkt 9 kodifierade för groupByMonth ('två grammatiker för samma sak är drift') — samma lyft-manöver som manadsgrupp.ts: delad funktion (t.ex. kommandeNarmastForst) som båda konsumerar. Förväntat beteende: EN källa för period-härledningen (ORDLISTA 'Period': ur startdatum, aldrig Status; odaterade kommande, sist) — oförändrad rendering i båda ytorna. Oetiketterad tills människan klassar (fynd-regeln, do-work).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En delad funktion (t.ex. kommandeNarmastForst) extraheras och används av BÅDE EventsList.tsx (filterByPeriod, 'upcoming'-grenen) och EventValjare.tsx (grupper-useMemo) — ingen duplicerad kommande-filter/närmast-först-sort-logik kvar i någon av filerna
- [ ] #2 Period-härledningen i den delade funktionen följer ORDLISTA.md:s definition (ur startdatum, aldrig Status; odaterade kommande, sist)
- [ ] #3 Renderingen i båda ytorna är oförändrad efter lyftet (0 visuell/funktionell regression), verifierat manuellt eller via befintlig testsvit
- [ ] #4 Enhetstest för den nya delade modulen tillagt, samt befintliga EventsList/EventValjare-tester gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
