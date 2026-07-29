---
id: TASK-88
title: >-
  Fynd: ZZ-GRANSKNING-S91 lever kvar i staging — granskningsfixturen är inte
  självstädande
status: To Do
assignee: []
created_date: '2026-07-29 17:36'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 168000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfixturen `ZZ-GRANSKNING-S91` skapades för en Marcus-granskning och ligger kvar i staging. Den är **inte självstädande**, och `.purge-staging-policy.json` nämner den inte — verifierat 2026-07-27.

Städkommandot finns och är känt:

    npm run seed:review:clean -- --ort ZZ-GRANSKNING-S91

**Men skivan är större än ett kommando.** Frågan den ska svara på är varför fixturen inte städar sig själv, och om nästa granskningsfixtur kommer lämna samma spår. `CLAUDE.md` § Granskningsdata beskriver skriptets skydd — bland annat korsläsning mot purge-policyn så granskningsdata INTE städas bort mitt i en granskning. Det skyddet är avsiktligt; det är därför den ligger kvar.

**Avgörande:** kör inte städningen om en granskning pågår. Fråga Marcus om fixturen får tas bort innan den tas bort.

Källa: restlistans § Spår E.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus tillfrågad om ZZ-GRANSKNING-S91 får städas — svaret citerat i kortet, inte antaget
- [ ] #2 Städningen körd med preflighten respekterad, och utfallet verifierat mot basen
- [ ] #3 Frågan besvarad i skrift: lämnar nästa granskningsfixtur samma spår, och är det avsiktligt?
- [ ] #4 Om svaret är att det INTE är avsiktligt: eget kort mintat för mekaniseringen — denna skiva lappar inte
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
