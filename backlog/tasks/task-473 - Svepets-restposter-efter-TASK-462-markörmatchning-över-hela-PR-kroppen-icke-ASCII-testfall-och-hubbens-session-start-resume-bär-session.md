---
id: TASK-473
title: >-
  Svepets restposter efter TASK-462: markörmatchning över hela PR-kroppen,
  icke-ASCII-testfall, och hubbens session-start/-resume bär --session
status: To Do
assignee: []
created_date: '2026-09-19 01:36'
labels: []
dependencies: []
priority: medium
ordinal: 814000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-462 landade som caaa4885 (#2545) efter sex granskningsrundor. Runda 6:s två info-fynd lades medvetet hit i stället för en sjunde runda: (1) pr_har_session_marker() gör substrängsmatchning över HELA PR-kroppen — ett annat sessions-ID som citeras som exempel längre ned i kroppen (kodruta, citat, Riskbedömnings-sektion) kan ge en falsk träff; ID-gränsen är korrekt skyddad av markörens avslutande ' -->', och exponeringen har funnits sedan runda 1. (2) tr-normaliseringen höll mot å/ä/ö och emoji i tre locale-lägen på macOS, men sviten saknar ett eget fall med icke-ASCII i PR-kroppen och GNU tr på CI:s Linux är inte verifierad separat. (3) AC #5:s hub-del: marcus-system-pluginets session-start- och session-resume-skills startar fortfarande svepet utan --session — exakt rad och värde står i PR #2545:s kropp; hub-ändringen görs i hubbens egen kanal som separat commit + plugin-bump.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Markören matchas bara utanför kodrutor/citat — eller begränsningen står utskriven som känd, med ett testfall som visar beteendet
- [ ] #2 Ett testfall med å/ä/ö + emoji i PR-kroppen, grönt både lokalt (BSD tr) och i CI (GNU tr)
- [ ] #3 Hubbens session-start och session-resume startar monitorn med --session S<N>; plugin-versionen bumpad; spokens CLAUDE.md § Landning pekar rätt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
