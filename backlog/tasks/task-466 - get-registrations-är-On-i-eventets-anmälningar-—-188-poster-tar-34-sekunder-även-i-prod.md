---
id: TASK-466
title: >-
  get-registrations är O(n) i eventets anmälningar — 188 poster tar 34 sekunder,
  även i prod
status: To Do
assignee: []
created_date: '2026-09-18 22:55'
labels: []
dependencies: []
priority: medium
ordinal: 807000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sidofynd ur flake-diagnosen (docs/research/flake-request-context-disposed-2026-09-19.md § 4.1–4.2, S126 resume 2): get-registrations event-gren är O(n) i eventets anmälningar — fetchByRecordIds chunkar 10 ID per anrop och berikaPersonhistorik lägger sekventiella Airtable-anrop ovanpå, 40–60 anrop i rad för ett stort event. Direktmätt mot staging 2026-09-19: 4 poster 2,5 s · 10 poster 4,5 s · 17 poster 7,4 s · 188 poster 34,4 s (~0,17 s per anmälan). Det gäller även prod: ett verkligt event med 188 anmälningar tar över en halv minut att öppna i appen, och passerar klientens tidsgränser (jfr TASK-451.4, där klientens 20 s-gräns ställs mot serverns 429-backoff).

Syskon: TASK-458 (get-events chunk-parallellisering, PR #2550) har samma form och en öppen fråga om Airtables 5 anrop per sekund — mät 429 först. Lösningen här bör dela mönster med den, inte uppfinna ett eget. Inte ready-for-agent: designvalet (parallellisering inom takten, formelfilter i stället för ID-chunkar, eller en rollup i basen) avgörs efter att #2550 mätts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mätserie mot staging: svarstid som funktion av antal anmälningar, före och efter, med 429-utfall redovisat
- [ ] #2 Ett event med 200 anmälningar öppnas under klientens tidsgräns, utan att Airtables anropstakt överskrids
- [ ] #3 Samma mönster som TASK-458 landade i, eller ett skrivet skäl till avvikelsen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
