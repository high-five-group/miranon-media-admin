---
id: TASK-32
title: >-
  Publiceringsflaggan har ingen LÄS-väg i appen — osynlig efter skapande, ej
  ändringsbar
status: To Do
assignee: []
created_date: '2026-07-23 02:06'
updated_date: '2026-08-28 05:06'
labels:
  - ready-for-human
dependencies: []
ordinal: 81000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur S75 batch 4 (task-19.4:s bygg-agent).

get-event/get-events exponerar INTE publiceringsflaggan, så efter att ett event skapats syns det ingenstans i UI:t om det är publicerat eller inte. Flaggan kan dessutom bara sättas vid create — inte ändras i efterhand.

FÖRVÄNTAT (om Lotta ska kunna av-/påpublicera): en läs-väg (get-event exponerar fältet) + en ändrings-väg (update-event allowlistar det) + UI på eventsidan.

KONTEXT: 19.4 levererade själva skriv-vertikalen vid create (additivt bas-fält + oarmerat=utelämnat). Läs/ändra-vägen är utanför 19.4:s scope. Sannolik T79-/eventsida-materia.

Oetiketterat per fynd-regeln — människan klassar.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC saknas medvetet: kortet är explicit 'Oetiketterat per fynd-regeln — människan klassar' och beslutet är villkorat ('om Lotta ska kunna av-/påpublicera'). Kräver Marcus-beslut om publiceringsflaggan ska vara läsbar/ändringsbar i UI, och i så fall var (sannolikt eventsidan/T79). Källa: kortets egen Description. Verifierat av registerhygien-passet 2026-08-28 (redan taggat ready-for-human).
<!-- SECTION:NOTES:END -->
