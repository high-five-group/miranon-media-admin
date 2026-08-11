---
id: TASK-201.6
title: 'Skiva: Aktivitetshistoriken — kärnvyn (A-formen)'
status: To Do
assignee: []
created_date: '2026-08-11 20:25'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.3
  - TASK-201.5
parent_task_id: TASK-201
ordinal: 371000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Lotta öppnar aktivitetshistoriken (via Mer på mobil, via länk/route på desktop) och ser allt som hänt, tidsgrupperat, klickbart till person/event. Detta är A-formen — en HEL yta utan filterrad; filterraden är nästa skiva och dag 1 kan driftsättas utan den (S105 Del 2 beslut 1, mellanstationen).

Täcker användarberättelser: 3, 4, 5, 6, 8, 11, 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Route + vy: tidsgrupperad lista (Idag / Igår / datum), poster i spaltens postform (relativ tid respektive klockslag, aktör i medium, händelse i naturligt språk); post-klick navigerar till personen eller eventet
- [ ] #2 Mobil-/platta-ingången via Mer (S55 byggkrav B7): Mer-menyn får posten Aktivitetshistorik
- [ ] #3 Tomläge första gången — vänligt, på Lotta-språket (Gunilla-principen)
- [ ] #4 A11y-ribban 11: rubrikstruktur, landmark, fokusordning; axe-test grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
