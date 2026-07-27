---
id: TASK-59.4
title: 'Skiva: Personer-ytan till acceptance-klassen'
status: To Do
assignee: []
created_date: '2026-07-27 20:41'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.3
parent_task_id: TASK-59
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Personer-ytans tre filer — listan, detaljvyn och anteckningsredigeringen — flyttas till acceptance-klassen.

BETEENDET ÄNDE-TILL-ÄNDE: en ändring i personlistans rendering, sökning eller ladda-fler får sitt svar ur det mutexfria jobbet. Detaljvyn och anteckningsredigeringen likaså. Ytan bevisar fortfarande samma sak som före flytten — att APPEN beter sig rätt givet svar av rätt form — men säger det nu genom sin klass i stället för genom sin kropp.

VARFÖR PERSONER KOMMER FÖRE MER OCH EVENT: tre filer, sammanhängande yta, och personlistans resolvers i fixturvärlden är redan de mest utbyggda (sök, sidstorlek, markör). Ytan prövar alltså fixturens rikaste del tidigt, medan mekaniken fortfarande är färsk.

MÖNSTRET SOM SKIVAN LUTAR SIG MOT är dokumenterat i fixturmodulen: behöver ETT test ett annat svar än den delade handlern överskuggas den lokalt, per test. Den tysta fällan står där också och ska läsas före första filen — en överskuggning vars mönster inte matchar faller igenom till den delade handlern utan att något fälls, och testet ser då normalläget i stället för sitt specialfall.

Täcker användarberättelser: 1, 5, 8, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Personer-ytans tre filer kör i acceptance-klassen och är gröna
- [ ] #2 TVÅSIDIGT BEVIS per fil: grön hermetiskt OCH fälld när dess egna mockar tas bort
- [ ] #3 Filernas a11y-assertioner följer med och kör fortfarande
- [ ] #4 Klassningen av de tre filerna är HÄRLEDD ur mätdatan och räkningen redovisad i PR:en
- [ ] #5 Ingen fil som kräver skarp backend har flyttats med på köpet — de fjorton skarpa är oförändrade
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Klassningen av varje flyttad fil är HÄRLEDD ur hermetik-mätdatan och räkningen redovisad — ingen handplockning
- [ ] #6 Varje flyttad fil har tvåsidigt bevis: passerar hermetiskt OCH vakten fäller när dess mockar tas bort
- [ ] #7 Samma zod-scheman parsar fixtursvar som parsar skarpa svar — fogen verifierad, ej antagen
<!-- DOD:END -->
