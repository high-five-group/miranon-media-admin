---
id: TASK-368.1
title: >-
  Skiva: Räknarfixen i basen — Är aktiv exkluderar Inställt, Antal anmälningar
  räknar bara aktiva (utför TASK-213.8 och 213.9)
status: To Do
assignee: []
created_date: '2026-09-03 07:56'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-368
ordinal: 667000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: när Lotta avbokar en person (i appen eller i basen) sjunker eventets Antal anmälningar med ett, Platser kvar stiger med ett och ett event som var Fullt blir öppet igen. Inställda anmälningar räknas heller inte. Ingenting i appen ändras i denna skiva; det är basen som rättas, i staging först och i prod efter Marcus GO (fälttypsbyte i en delad bas, ADR-063: resolution i basen, aldrig lappa i appen). HITL på grund av prod-bytet och inventeringen. Täcker användarberättelser: 11, 20.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Staging-basen: Är aktiv (1/0) ger 0 för både Avbokad/Ombokad och Inställt; Antal anmälningar på Eventplanering är en rollup över Är aktiv och räknar bara aktiva; Platser kvar, beläggning och fullbokat-triggern (A6) läser det nya värdet — verifierat med schemaläsning och en granskningsfixtur (seed:review) där en avbokning frigör en plats
- [ ] #2 Inventering FÖRE bytet: alla vyer, interfaces och automationer i prod-basen som läser Antal anmälningar/Är aktiv listade via claude.ai-Airtable-connectorn, med bedömning per post om bytet påverkar dem
- [ ] #3 Prod-basen bytt EFTER Marcus GO i klartext (STOPPA-OCH-FRÅGA med inventeringen som underlag), samma schemaläsning efteråt; TASK-213.8 och 213.9 stängs med hänvisning hit
- [ ] #4 docs/reference/data-model.md § Kända fällor post 27 och fälten uppdaterade; schema_reference.md-raden för Antal anmälningar markerad som ändrad med datum
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
