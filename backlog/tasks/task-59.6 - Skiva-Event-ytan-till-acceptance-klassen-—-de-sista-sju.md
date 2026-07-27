---
id: TASK-59.6
title: 'Skiva: Event-ytan till acceptance-klassen — de sista sju'
status: To Do
assignee: []
created_date: '2026-07-27 20:42'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.5
parent_task_id: TASK-59
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Event-ytans sju filer — anmälningsdetaljen, lägg-till-anmälan, anmälda, anteckningar, närvaro, ny anmälan och kalendervyn — flyttas till acceptance-klassen. Efter denna skiva är samtliga arton ute.

BETEENDET ÄNDE-TILL-ÄNDE: hela event-ytans hermetiska del svarar ur det mutexfria jobbet. Ytan är den största och den mest sammansatta — anmälningsflöden, närvaro och kalender rör flera Edge Functions per vy.

VARFÖR SIST: ytan är störst, och när den flyttas är mönstret prövat på tre mindre ytor. Ett fel i mekaniken ska ha upptäckts på två filer, inte på sju.

GRÄNSDRAGNINGEN ÄR KÄNSLIG HÄR. Flera event-filer som INTE ingår i denna skiva ligger kvar som skarpa — bekräftelse, bor-över, deltagare, eventdetaljen, närvaroregistret och eventlistan. De har kvarvarande skarpa anrop och hör därför till den andra klassen. Att de heter nästan samma sak som filerna i denna skiva är precis varför klassningen måste läsas ur mätdatan och inte ur filnamnen.

Täcker användarberättelser: 1, 8, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Event-ytans sju filer kör i acceptance-klassen och är gröna
- [ ] #2 TVÅSIDIGT BEVIS per fil: grön hermetiskt OCH fälld när dess egna mockar tas bort
- [ ] #3 Filernas a11y-assertioner följer med och kör fortfarande
- [ ] #4 Klassningen av de sju filerna är HÄRLEDD ur mätdatan och räkningen redovisad i PR:en
- [ ] #5 De sex likartat namngivna event-filer som har kvarvarande skarpa anrop ligger KVAR i den skarpa klassen — verifierat mot mätdatan, ej mot filnamn
- [ ] #6 Samtliga arton är nu ute; räkningen stämmer mot 18/14 och redovisas
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
