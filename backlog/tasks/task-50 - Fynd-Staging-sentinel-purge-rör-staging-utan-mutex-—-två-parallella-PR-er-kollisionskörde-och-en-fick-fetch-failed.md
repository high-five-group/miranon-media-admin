---
id: TASK-50
title: >-
  Fynd: Staging sentinel purge rör staging utan mutex — två parallella PR:er
  kollisionskörde och en fick 'fetch failed'
status: To Do
assignee: []
created_date: '2026-07-25 18:57'
labels: []
dependencies: []
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (QA-36.8 punkt 3, 2026-07-25): två QA-PR:er (#208, #209) körde 'Staging sentinel purge' med EXAKT tidsöverlapp — båda 18:47:04-18:47:17Z. Den ena lyckades, den andra dog med 'Oväntat fel: TypeError: fetch failed' (exit 2), vilket fällde hela körningen via paraply-checken.

STRUKTUR (verifierad): concurrency-blocket 'group: staging-tests' i .github/workflows/ci-suite.yml sitter på rad 165, alltså INNE i jobbet test-staging (rad 153). Jobbet purge (rad 39) rör samma staging-bas men har INGEN concurrency-grupp. Två körningar kan därför purga staging samtidigt.

VAD SOM ÄR BEVISAT vs INTE: strukturen tillåter kollisionen — det är läst ur filen och säkert. Att just detta 'fetch failed' orsakades av kollisionen är SANNOLIKT men inte bevisat; nätverksfel kan vara transienta. Det som gör det värt ett kort är att strukturen tillåter kollisionen alls, inte den enskilda felutskriften.

VARFÖR DET INTE SETTS FÖRUT: normalflödet landar seriellt (L328 — merge-grinden gör parallella landningar långsammare, så vi undviker dem). QA-vandringen skapade tre PR:er samtidigt med avsikt, vilket är en form vi annars aldrig kör. Fyndet är alltså en konsekvens av att pröva systemet utanför sitt invanda mönster.

FÖRVÄNTAT BETEENDE: allt som muterar staging ska serialiseras av samma mutex. Kandidater: flytta concurrency-blocket till jobb-nivå för både purge och test-staging (samma grupp), eller låt purge bli ett steg inuti test-staging. Val bör väga in att purge är snabbt (~12 s) och att en gemensam mutex förlänger kön.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla jobb som muterar staging delar samma concurrency-grupp — verifierat genom att läsa ci-suite.yml, inte antaget
- [ ] #2 Rött-först: två samtidiga PR-körningar mot staging serialiseras bevisligen (tidsstämplar utan överlapp)
- [ ] #3 Mätning: kötidseffekten av den utökade mutexen läst ur ci-metrics före/efter
- [ ] #4 Om lösningen är att purge blir ett steg i test-staging: verifiera att purge fortfarande körs på D1-klassen där test-staging skippas, annars ändras skyddet i smyg
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
