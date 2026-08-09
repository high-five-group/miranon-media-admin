---
id: TASK-173.6
title: 'Skiva: Instrumenteringen'
status: To Do
assignee: []
created_date: '2026-08-09 13:16'
labels:
  - ready-for-agent
dependencies:
  - TASK-173.1
  - TASK-173.5
parent_task_id: TASK-173
ordinal: 329000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: grindens mätdata (findings-per-runda · risk-kalibrering · grind-missar) skrivs strukturerat vid varje körning och kan läsas ut för de framtida beslut ADR-105 uttryckligen villkorar mot data: rundtakets storlek, D0-undantaget och flytten av Marcus gransknings-ribba (C.4-2-sekvensen — kontraktets hårdaste regel). Täcker användarberättelser: 4, 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje granskningskörning skriver findings-per-runda till loggytan från första skarpa körningen
- [ ] #2 Risk-kalibrerings-poster kan bokföras (Marcus-fångst på LÅG-stämplad PR = grind-miss) och läsas ut som underlag för omprövning av rundtak och D0-undantag
- [ ] #3 Loggytan är läsbar/summerbar utan specialverktyg — en framtida session kan re-derivera fångstraten ur den
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
