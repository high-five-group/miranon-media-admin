---
id: TASK-451.8
title: >-
  QA: kallstarten — Marcus öppnar prod-appen kall och ser bar i rörelse, inget
  tomt insläpp, inget hopp
status: To Do
assignee: []
created_date: '2026-09-18 10:40'
labels:
  - ready-for-human
dependencies:
  - TASK-451.1
  - TASK-451.2
  - TASK-451.3
  - TASK-451.4
  - TASK-451.5
  - TASK-451.7
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: high
ordinal: 792000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Verifiering efter att skivorna landat och prod följt main. Kall start = appen stängd minst 24 h (persist-cachens maxAge) eller rensad webbplatsdata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Baren rör sig från första synliga ögonblicket
- [ ] #2 Hem visar data vid insläpp, eller — vid en äkta timeout — skeleton utan layouthopp
- [ ] #3 Sentry visar ingen ny timeout-partial för tillfället, eller en som stämmer med vad som syntes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
