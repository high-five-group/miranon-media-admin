---
id: TASK-249.5
title: 'Skiva: Flippen — variant d promoveras till skarp segment-yta'
status: To Do
assignee: []
created_date: '2026-08-17 00:33'
labels:
  - ready-for-agent
dependencies:
  - TASK-249.1
  - TASK-249.2
  - TASK-249.3
  - TASK-249.4
parent_task_id: TASK-249
ordinal: 467000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Promoveringskontraktets kärnmoment (ADR-102/103): den godkända formen blir den skarpa ytan, identisk, med servern som enda sanningskälla för medlemskap. Täcker användarberättelser: 1-14, 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skarpa segment-routen renderar den promoverade formen UTAN variantparameter; samtliga sju ytor är identiska med facit tasks/sessions/bilagor/s104-segment-divergens/facit.json (respektive yta-rad; bilder: [] betyder identisk med den körande prototypen i variant d-läge — aldrig en delförändringsbeskrivning)
- [ ] #2 Formen konsumerar server-kontraktet: klientens frågeplans-snitt är ERSATT av EF:ernas AND-stöd — ingen medlemsberäkning eller regelexpansion sker i klienten
- [ ] #3 Dimensionerna läses ur basens fält via läsvägen — prototypens hårdkodade kurskarta är borta ur den skarpa vägen
- [ ] #4 ariaSnapshot-referenserna från grind-skivan är ORÖRDA och gröna efter flippen
- [ ] #5 acceptance- och axe-klasserna gröna för skarpa ytan; tillgänglighetsribban 11 utan undantag
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s104-segment-divergens/facit.json — varje yta i ytor[] prövad mot den promoverade formen
- [ ] #6 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #7 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->
