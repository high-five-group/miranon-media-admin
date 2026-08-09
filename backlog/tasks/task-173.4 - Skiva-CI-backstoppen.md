---
id: TASK-173.4
title: 'Skiva: CI-backstoppen'
status: To Do
assignee: []
created_date: '2026-08-09 13:14'
labels:
  - ready-for-agent
dependencies:
  - TASK-173.3
parent_task_id: TASK-173
ordinal: 327000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: ett deterministiskt CI-jobb verifierar att varje kod-klassad PR bär ett giltigt granskningsutlåtande (Riskbedömnings-sektionen) och fäller PR:en annars — grinden blir mekaniskt otvingbar i stället för konvention (ADR-105 beslut 2–3; ADR-036-linjen). Täcker användarberättelser: 14 samt den mekaniska delen av 3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En PR i kod-klass utan giltig Riskbedömnings-sektion fälls av backstopp-jobbet (negativ self-test, rött-först-form)
- [ ] #2 En PR med giltig sektion passerar backstoppen (positivt bevis med run-ID)
- [ ] #3 D0-klassade PR:er undantas via CI:s befintliga diff-klassning — backstoppen bär ingen egen klassningslogik
- [ ] #4 Backstoppen är deterministisk — ingen LLM i CI
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
