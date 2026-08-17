---
id: TASK-249.6
title: 'Skiva: Mekanisk rivning — varianter, gamla byggaren, riggarna'
status: To Do
assignee: []
created_date: '2026-08-17 00:35'
labels:
  - ready-for-agent
dependencies:
  - TASK-249.5
parent_task_id: TASK-249
ordinal: 468000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rivningen är mekanisk eftersom godkännandet redan är stämplat via kanalseparationen (ADR-104). Efter denna skiva finns EN segmentyta i repot. Täcker användarberättelser: kontraktsuppfyllnad, inga nya.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Variant a/b/c, den gamla segment-byggaren, PrototypRigg (utfallslägena), SkalprovsVaxel och variantväxelns segment-nyckel är rivna — flaggor och växlar, aldrig formen (ADR-103)
- [ ] #2 ariaSnapshot-referenserna är ORÖRDA genom rivningen och gröna efteråt — beviset att rivningen tog växlar, aldrig form
- [ ] #3 check-facit är grön: godkand-fältet är satt (stämpel sha a40f3543) så rivningsspärren släpper mekaniskt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s104-segment-divergens/facit.json — rivningen får inte röra någon deklarerad yta
- [ ] #6 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #7 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->
