---
id: TASK-470
title: >-
  verify-ci-parity felklassar en ren dokument-diff som KOD när filnamn bär å/ä/ö
  (git quotepath)
status: To Do
assignee: []
created_date: '2026-09-18 23:25'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 811000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt av bygg-agenten för N8 (PR #2555, 2026-09-18): scripts/verify-ci-parity.mjs läser diffens filnamn utan -c core.quotepath=false, så backlog-kort med svenska tecken kommer ut oktal-escapade inom citattecken, matchar inte D0-globen och diffen klassas som kod — det lokala verktyget kör då full uppsättning i onödan (~15 min). CI:s egen klassning är INTE drabbad: på #2555 hoppades Test suite över korrekt (stickprovat av orkestreraren). Bevis och exakt rad står i PR #2555:s kropp.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rött-först: ett testfall med ett filnamn med å/ä/ö klassas som KOD före fixen och D0 efter
- [ ] #2 Filnamn läses NUL-separerat (-z) eller med quotepath av — även mellanslag och långa streck i filnamn täcks
- [ ] #3 CI:s egen klassning i ci.yml prövad mot samma filnamn och bekräftad opåverkad (eller lagad i samma PR)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
