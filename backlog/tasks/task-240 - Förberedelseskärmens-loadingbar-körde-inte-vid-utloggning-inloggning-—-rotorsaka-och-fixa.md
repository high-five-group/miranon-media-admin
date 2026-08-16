---
id: TASK-240
title: >-
  Förberedelseskärmens loadingbar körde inte vid utloggning/inloggning —
  rotorsaka och fixa
status: To Do
assignee: []
created_date: '2026-08-16 09:00'
labels:
  - ready-for-agent
dependencies: []
ordinal: 442000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-observation 2026-08-16 (skarp yta, logga ut → logga in): Förberedelseskärmen visades men loadingbaren rörde sig INTE alls — sedan släpptes han in abrupt. Förväntat (TASK-218/219, ADR-112): trappan driver baren under startvärmningens 11 EF-anrop. Möjliga spår (HYPOTESER, verifiera mot kod + renderad yta): progress-events inte wirade på ut/inloggnings-vägen (cache tömd? gate-läge?) · varm-start-detektionen delvis fel (skärmen visas men progress-koppling saknas) · warmup klar innan första progress-event når baren. OBS QA-kortet 218.5 (naturlig kallstart m.m.) är fortfarande öppet — denna bugg är sannolikt exakt vad den QA:n skulle fångat. Reproducera FÖRST (logga ut/in mot staging), rotorsaka mot kod, fixa, bevisa på renderad yta i båda riktningar (bar rör sig vid kall start · tyst vid varm start per ADR-112-beslutet).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Buggen reproducerad och rotorsakad med fil:rad-belägg
- [ ] #2 Fix: baren driver mot faktisk warmup-progress på ut/inloggnings-vägen; varm-start förblir tyst (ADR-112)
- [ ] #3 Bevis på renderad yta i båda riktningar (kall start: bar rör sig steg för steg · varm start: ingen skärm)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
