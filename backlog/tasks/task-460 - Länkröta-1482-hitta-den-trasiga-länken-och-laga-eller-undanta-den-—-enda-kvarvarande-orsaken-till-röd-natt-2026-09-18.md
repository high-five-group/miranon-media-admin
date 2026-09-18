---
id: TASK-460
title: >-
  Länkröta #1482: hitta den trasiga länken och laga eller undanta den — enda
  kvarvarande orsaken till röd natt 2026-09-18
status: To Do
assignee: []
created_date: '2026-09-18 11:52'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 800000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt av orkestreraren 2026-09-18 (S126): natten 2026-09-18 hade ALLA åtta kontroller gröna och var röd enbart av 'Länkkontroll (utan cache)'. Det stående ärendet #1482 (etikett lankrota) är öppet sedan 2026-08-17 och får en kommentar per natt; ingen har lagat orsaken. S125 undantog chromium.googlesource.com (503 anti-bot mot GHA-runners, #2513, landad 2026-09-17 ~13:00Z) men natten efter var länkkontrollen fortfarande röd — något annat är alltså trasigt. Efter kortet är orsaken identifierad ur nattens lychee-logg (gh run view <senaste natt> --log, jobbet Länkkontroll), och varje trasig länk är antingen rättad i källfilen eller undantagen i .lycheeignore med mätt skäl (samma form som #2513: antal körningar, felkod, varför undantag är rätt). Undanta ALDRIG en länk som faktiskt är död — rätta den. Marcus GO 2026-09-18: 'ja till kortet för länkrötan'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje felande länk i den senaste nattens lychee-logg är listad i kortet med felkod och åtgärd (rättad / undantagen med mätt skäl)
- [ ] #2 En manuell körning av länkkontrollen (workflow_dispatch eller lokalt lychee utan cache med samma flaggor som nightly.yml) är grön
- [ ] #3 Efter första skarpa natten: #1482 stängt enligt stängningsregeln i CONTRIBUTING § Nattnätet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
