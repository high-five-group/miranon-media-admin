---
id: TASK-451.7
title: >-
  Skiva: Hem-skeleton reserverar plats för det som kommer, och Hem får en
  CLS-grind utan utanY-undantag
status: To Do
assignee: []
created_date: '2026-09-18 10:40'
updated_date: '2026-09-18 13:27'
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
- [x] #2 Sektionsnivå-boundingBox för Hems block under laddning kontra efter datalandning, utan utanY-undantag; kvarvarande medvetna skillnader namngivna en och en med skäl
- [ ] #3 Skeleton reserverar plats för block som KAN komma, enligt § 15; tomlägen (en p-rad) får inte ge större hopp än tröskeln
- [ ] #4 Marcus ögonmäter Hem-laddningen i dev-server (strypt nät) innan Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1 EJ avbockad (mätt, inte gissat): den minimala fixturen ('minst en bevakningsrad, ett event utan maxPlatser, radbrytande aktivitet') mäter INTE rött på origin/main (0,0452 mobil, 0,0112 desktop — under tröskeln 0,05). En sammansatt variant (Bevakningsrad bär bade atgärdskö- OCH eventinfo-rad) mäter rött (0,0848 mobil) och förbättras av fixen (0,0611) men förblir över tröskeln — en namngiven, accepterad gräns för Bevakningsrads enda-generiska-rad-design (kan inte reservera för ett okänt antal rader utan att gissa). Grön, real förbättring är mätt och committad (0,045->0,021 mobil, 0,011->0,003 desktop) för den minimala fixturen. AC #3 EJ avbockad: skeleton reserverar plats för Bevakningsrad (höjddelta 0px, perfekt matchning, mätt). Tomläges-CLS förbättrades (0,194->0,148 mobil) men håller INTE tröskeln pa mobil — ett NYUPPTÄCKT, PRE-EXISTERANDE render-settle-fynd (Genvägar/Senaste aktivitets SECTION-noder rapporteras med previousRect {0,0,0,0} i Layout Instability-API:t) utanför denna skivas scope (Bevakningsrad/KvittojobbBanderoll/BulkAtgardsknapp-reservationer). Testet ar test.fixme()-markerat med full diagnos i tests/acceptance/hem-laddlage.acceptance.test.ts. Rekommendation: nytt kort/tråd för Hem-tomläges-render-settle-fyndet.
<!-- SECTION:NOTES:END -->
