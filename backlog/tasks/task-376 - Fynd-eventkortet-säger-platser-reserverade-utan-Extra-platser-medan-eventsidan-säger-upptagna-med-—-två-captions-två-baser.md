---
id: TASK-376
title: >-
  Fynd: eventkortet säger 'platser reserverade' utan Extra platser medan
  eventsidan säger 'upptagna' med — två captions, två baser
status: To Do
assignee: []
created_date: '2026-09-03 09:46'
labels:
  - ready-for-human
dependencies: []
ordinal: 674000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Symptom
EventCard.tsx (~rad 245) visar '<Antal anmälda> av <max> platser reserverade' ur antalAnmalda UTAN Extra platser; eventsidans beläggningsmätare (Belaggning.tsx) visar 'upptagna' INKLUSIVE Extra platser. Talen sammanfaller bara när Extra platser = 0. Upptäckt i TASK-373 (PR #2245).

## Förväntat beteende
Ett beslut (Marcus, designfråga): antingen samma kvantitet och samma ord på båda ytorna, eller två medvetet olika mått med ord som skiljer dem. Därefter en skiva som gör listan och sidan konsekventa, med S72/S73-faciten prövade (ADR-102).

## Källa
S115 Del 5, review-utlåtande PR #2245 runda 1; TASK-373 § Avgränsning.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
