---
id: TASK-59.3
title: 'Skiva: Klassen etablerad — mutexfritt jobb och Hem-ytan som pilot'
status: To Do
assignee: []
created_date: '2026-07-27 20:41'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.2
parent_task_id: TASK-59
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Acceptance-klassen får sitt eget projekt, sitt eget mutexfria CI-jobb och sin egen söm — och Hem-ytans två filer flyttas dit som pilot.

BETEENDET ÄNDE-TILL-ÄNDE: en utvecklare öppnar en PR som bara rör Hem-vyns rendering. Acceptance-jobbet startar utan att vänta på staging-mutexen, kör de två Hem-filerna mot fixturvärlden och svarar på under en minut. Ingen av dem rör nätet: gör en av dem det FÄLLER den, med adressen namngiven.

VARFÖR HEM ÄR PILOTEN: ytan är den minsta sammanhängande (två filer) men bär samtidigt den fil som har flest restanrop av alla arton. Den prövar alltså både den enkla vägen och den tyngsta lasten, utan att sätta sex filer i spel innan mekaniken är bevisad.

SÖMMEN KOMPONERAS, DEN KOPIERAS INTE. Playwrights egen mekanism för att kombinera fixturmoduler används; klassen ärver fixturvärlden från den delade hemvisten i stället för att bygga en andra. Två fixturvärldar vore emot både MSW:s och Playwrights uttalade designavsikt, och emot kravet att en fixtur och ett schema aldrig får divergera.

VAKTEN ÄR AVBRYTANDE HÄR, inte rapporterande. En fil som flyttats för tidigt ska bli röd, inte grön av fel skäl.

TVÅSIDIGT BEVIS PER FIL: att den passerar hermetiskt bevisar ingenting om vakten. Först när dess egna mockar tas bort och testet DÅ fälls är hermetiken bevisad i stället för förhoppad.

Täcker användarberättelser: 1, 2, 3, 11, 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Acceptance-klassen har eget projekt och eget CI-jobb som kör UTAN staging-mutex
- [ ] #2 Sömmen komponeras ur den delade fixturvärlden med Playwrights egen fixtur-kompositionsmekanism — ingen andra handler-uppsättning införs
- [ ] #3 Vakten är AVBRYTANDE i klassen och svarar med statuskod plus instruktionstext i klartext, inte ett anonymt avbrott
- [ ] #4 Hem-ytans två filer kör i klassen och är gröna
- [ ] #5 TVÅSIDIGT BEVIS för båda filerna: grön hermetiskt OCH fälld när dess egna mockar tas bort
- [ ] #6 Filernas a11y-assertioner följer med och kör fortfarande — inget bevis tappas i flytten
- [ ] #7 Klassningen av de två filerna är HÄRLEDD ur mätdatan och räkningen redovisad i PR:en
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
