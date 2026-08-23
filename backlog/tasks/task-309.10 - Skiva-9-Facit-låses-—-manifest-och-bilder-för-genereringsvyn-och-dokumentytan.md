---
id: TASK-309.10
title: 'Skiva 9: Facit låses — manifest och bilder för genereringsvyn och dokumentytan'
status: To Do
assignee: []
created_date: '2026-08-23 14:46'
labels:
  - ready-for-human
dependencies:
  - TASK-309.8
parent_task_id: TASK-309
ordinal: 571000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den godkända formen fryses som regressionsstöd (ADR-074/ADR-102) så framtida ändringar mäts mot den — aldrig före godkännandet. Täcker användarberättelser: 24.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 facit.json + facit-*-bilder i s108-generering (lista · generering × 2 mallar · block-dialog × 4 lägen · efter Skapa · INAKTUELL-rad) och s108-dokumentytan, tagna ur den promoverade ytan EFTER Marcus godkännande i skiva 7; check-facit grön
- [ ] #2 Facit-policyns prototyp-markörer uppdaterade; referens-scanningen grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->
