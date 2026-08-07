---
id: TASK-145.5
title: 'Skiva: Ren översyn — skrivvägarnas frånvaro bevisad'
status: To Do
assignee: []
created_date: '2026-08-07 09:01'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.3
  - TASK-145.4
parent_task_id: TASK-145
ordinal: 237000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ingen kan av misstag ändra data från eventsidan — sidan är en ren översyn. Roger kan visa den för någon utan risk. Att detta gäller bevisas av maskinen, inte av en genomläsning.

Täcker användarberättelser: 24
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Eventsidan bär noll skrivkontroller: inga muterande kryssrutor, inget redigerbart noteringsfält, ingen påminn-avfyrning, inga mailto-vägar
- [ ] #2 Frånvaron är MEKANISKT fälld av en grind eller ett test, inte kontrollerad med ögat
- [ ] #3 Auto-kryssen är rivna ur eventinfo-radens signal-slot; slotten visar bara Dags-att-skicka-badgen när den är tänd, annars tomt med bevarad höjd
- [ ] #4 Åtgärds-radernas grå löften är hanterade: varje rivning eller ändring öppet bokförd, och numreringens referentbarhet uttryckligen adresserad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [ ] #6 test:visual omtagen med granskade baslinjer — drift är väntad, inte accepterad osedd
- [ ] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [ ] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->
