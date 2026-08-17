---
id: TASK-273.1
title: 'Skiva: Förberedelseskärmens bar — 6 px + sage'
status: To Do
assignee: []
created_date: '2026-08-17 14:55'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-273
ordinal: 489000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta laddar appen och ser Förberedelseskärmens bar i samma diskreta tjocklek som nästa event-kortets bar men i sage — systemets laddningssignal skiljer sig från innehållets guld. Förberedelseskärmen bär inget facit-manifest (verifierat vid PRD-syntesen) — ändringen bokförs i skivans rapport. Täcker användarberättelser: 1, 2.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Förberedelseskärmens laddningsbar har samma höjd som nästa event-kortets kapacitetsbar (6 px-klassen) och fill ur sage-familjen via komponent-token — inga hårdkodade färger
- [ ] #2 Kontrasten fill-mot-spår uppfyller WCAG 1.4.11 (minst 3:1), verifierad med faktiska färgvärden i skivans rapport; contrast-more-varianten uppdaterad i samma andetag
- [ ] #3 Sidbytesindikatorn är oförändrad — diff-bevis att dess komponent inte rörts (Marcus svar 2, 2026-08-17)
- [ ] #4 Stall-läget (pulsanimationen) och reduced-motion-beteendet fungerar oförändrat efter ändringen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
