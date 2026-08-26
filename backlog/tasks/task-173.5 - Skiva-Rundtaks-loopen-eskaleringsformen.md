---
id: TASK-173.5
title: 'Skiva: Rundtaks-loopen + eskaleringsformen'
status: To Do
assignee: []
created_date: '2026-08-09 13:15'
updated_date: '2026-08-26 06:02'
labels:
  - ready-for-agent
dependencies:
  - TASK-173.1
parent_task_id: TASK-173
ordinal: 328000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: granskningsloopens flöde runda 1 → bygg-agent-fix → runda 2 (färsk kontext, error-tröskel) → vid tak en STOPPA-OCH-FRÅGA-eskalering med öppna fynd som markeringsbar lista; konvergensregeln är den direkta motåtgärden mot förlagans 27-rundors-incident (ADR-105 beslut 4). Täcker användarberättelser: 6, 9, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Runda 2 körs i färsk kontext och blockerar endast på error-klass; warnings/info bokförs i utlåtandet utan att stoppa
- [x] #2 Efter runda 2 sker aldrig en tredje automatisk runda — kvarvarande öppna fynd presenteras som markeringsbar STOPPA-OCH-FRÅGA-lista i chatten och armeringen väntar på Marcus beslut
- [x] #3 auto-fix-klassade fynd routas till bygg-agenten för rättning; ask-user-klassade eskaleras till Marcus oavsett runda
- [x] #4 Grinden självgodkänner aldrig vid tak — taket byter automatik mot eskalering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Tvåsidig skript-testsvit (ska-fälla + ska-passera) per nytt deterministiskt skript, grön lokalt
- [ ] #6 CI-backstoppens grind-verkan bevisad med rött-först-form: positivt bevis + negativ self-test
- [ ] #7 Instrumenteringsloggen bevisat skrivande från första skarpa körningen (findings-per-runda + risk-kalibrering + grind-missar)
- [ ] #8 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->
