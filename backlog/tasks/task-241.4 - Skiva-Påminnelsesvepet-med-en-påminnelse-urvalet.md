---
id: TASK-241.4
title: 'Skiva: Påminnelsesvepet med en-påminnelse-urvalet'
status: Done
assignee: []
created_date: '2026-08-16 23:04'
updated_date: '2026-08-20 07:10'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.3
parent_task_id: TASK-241
ordinal: 458000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Påminnelsesvepet återanvänder sändmaskineriet ur 241.3; det nya är urvalslogiken (läge 1-filtret) och påminnelseformens mallar/copy. Täcker användarberättelser: 6, 7, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Urvalet omfattar ENDAST rader i läge 1 Att påminna (en-påminnelse-modellens tre radlägen, S102 Del 10) — mekaniskt spamsäkert: ingen deltagare kan få dubbel påminnelse
- [x] #2 Hela triaden + sändning + resultatläge för påminnelseformen — identisk med facit tasks/sessions/bilagor/s102-svep-konvergens/facit.json påminnelse-lägena (granska, resultat, delresultat)
- [x] #3 Påminnelse-markörer på hemmet + aktivitetslogg-spår, samma former som bekräftelsesvepets
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning mot tasks/sessions/bilagor/s102-svep-konvergens/facit.json (18 bilder) — renderad yta jämförd läge för läge
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Påminnelsesvepet återanvänder 241.3s sändmaskineri; nytt är läge-1-urvalsfiltret (mekaniskt spamsäkert) och påminnelseformens mallar — PR #1484 (beb612aa), CI grön per jobb.
<!-- SECTION:FINAL_SUMMARY:END -->
