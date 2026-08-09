---
id: TASK-173.7
title: 'Skiva: QA-vandringen — review-grinden ände-till-ände'
status: To Do
assignee: []
created_date: '2026-08-09 13:17'
labels:
  - ready-for-human
dependencies:
  - TASK-173.1
  - TASK-173.2
  - TASK-173.3
  - TASK-173.4
  - TASK-173.5
  - TASK-173.6
parent_task_id: TASK-173
ordinal: 330000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Konkret manuell testplan (Marcus + orkestreraren): 1) Välj en verklig kod-skiva; låt bygg-agenten leverera och pusha. 2) Verifiera att orkestreraren spawnar review-agenten i färsk kontext med rätt input (kortets AC verbatim + diff + policy-regler ur main). 3) Läs utlåtandet: schema-giltigt, risknivå med motivering, fynd klassade. 4) Verifiera Riskbedömnings-sektionen i den skarpa PR:n med commit-pinnade bevisreferenser. 5) Provocera backstoppen: PR utan sektion fälls (negativ self-test), med sektion passerar — run-ID:n bokförs. 6) Kör en fix-runda; verifiera runda 2 i färsk kontext med error-tröskel; provocera rundtaket och verifiera STOPPA-OCH-FRÅGA-listan i chatten + att armeringen väntar. 7) Verifiera att instrumenteringsloggen skrivits (findings-per-runda) och att en risk-kalibrerings-post kan bokföras. 8) Betala bokförda skarpbevis-skulder; bokför samtliga utfall. Täcker användarberättelser: 1, 2, 3, 5, 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hela grind-kedjan bevisad ände-till-ände på en verklig PR med run-ID:n bokförda i sessionsdok
- [ ] #2 Alla skarpbevis-skulder från skivorna 1–6 betalda eller öppet bokförda med skäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->
