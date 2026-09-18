---
id: TASK-451.7
title: >-
  Skiva: Hem-skeleton reserverar plats för det som kommer, och Hem får en
  CLS-grind utan utanY-undantag
status: To Do
assignee: []
created_date: '2026-09-18 10:40'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: high
ordinal: 791000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus: "layouten rörde sig liksom när skeleton övergick till data". CLS-grinden (`tests/acceptance/laddning-cls.acceptance.test.ts`, TASK-416.14) täcker Check-in, Aktivitetshistorik och Anmälningar — inte Hem. Hem-laddläges-testet mäter första raden per block och stryper Y-axeln (`utanY()`) för Förfallna betalningar och Senaste aktivitet. Störst förflyttning: block som är HELT frånvarande under laddning (`Bevakningsrad` returnerar null, `KvittojobbBanderoll`, `BulkAtgardsknapp`) och texter som radbryter förbi `Skeleton`s `h-[1lh]` (eventtitel 3xl, aktivitetsrader utan truncate). Tabell per block: underlaget § 3.

Läs DESIGN-SYSTEM-SPEC § 15 (TASK-416.21) FÖRE design — regeln om reserverad plats finns redan. CLS-grindens filhuvud bokför att den är blind för listkroppar som unmountas: komplettera med sektionsnivå-boundingBox (hela section, inte första raden). Underlag § 3, § 5.4 (S3), § 6 punkt 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rött-först: CLS-mätning mot /hem (desktop 1280x720 + mobil 390x844) med fixtur som har minst en bevakningsrad, ett event utan maxPlatser och aktivitetsrader som radbryter — rött på main över tröskeln 0,05, grönt efter fix
- [ ] #2 Sektionsnivå-boundingBox för Hems block under laddning kontra efter datalandning, utan utanY-undantag; kvarvarande medvetna skillnader namngivna en och en med skäl
- [ ] #3 Skeleton reserverar plats för block som KAN komma, enligt § 15; tomlägen (en p-rad) får inte ge större hopp än tröskeln
- [ ] #4 Marcus ögonmäter Hem-laddningen i dev-server (strypt nät) innan Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
