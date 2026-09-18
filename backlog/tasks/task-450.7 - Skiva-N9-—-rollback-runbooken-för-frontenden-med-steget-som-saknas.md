---
id: TASK-450.7
title: 'Skiva: N9 — rollback-runbooken för frontenden, med steget som saknas'
status: To Do
assignee: []
created_date: '2026-09-18 09:54'
updated_date: '2026-09-18 10:12'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: medium
ordinal: 781000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Återställningsvägen för frontenden finns hos leverantören men har aldrig körts här och står inte i någon instruktion. Efter en tillbakarullning stänger plattformen av automatisk produktionstilldelning — huvudgrenen fortsätter se grön ut medan användarna står kvar på den gamla versionen. Efter skivan bär prod-driftsättnings-runbooken ett eget avsnitt med granskningens åttastegs-sekvens (KG2) plus två egna tillägg: ett uttryckligt sista steg som kontrollerar att automatisk tilldelning är PÅ igen, och en rad om att funktionsflaggan för betalningar bakas in vid bygget och därför följer med bakåt. Själva övningen mot produktion ingår INTE — Marcus beslutar när. Spec: planens § N9; leverantörens påståenden verifieras mot dess egen dokumentation i dag, inte avskrivna ur planen.

Täcker användarberättelser: 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Runbooken bär avsnittet med åtta steg + de två egna tilläggen, skrivet så att en person utan teknisk bakgrund kan följa det
- [x] #2 Varje leverantörspåstående bär källa (URL + hämtdatum) verifierad vid skrivandet
- [x] #3 TASK-199 pekar på avsnittet
- [x] #4 Avsnittet säger öppet att vägen är OÖVAD tills övningen körts, med plats för övningens utfall
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
