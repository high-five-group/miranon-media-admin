---
id: TASK-145.2
title: 'Skiva: Steg-räknarna och filtreringen'
status: To Do
assignee: []
created_date: '2026-08-07 08:58'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.1
parent_task_id: TASK-145
ordinal: 234000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta ser fyra rader i toppen som räknar hur många som står i varje steg — det är hennes att-göra-lista för dagen. Hon klickar 'Anmälningsavgifter' och listan visar bara de som saknar avgift. Hon klickar Rensa och ALLA filter försvinner, inte bara det hon råkade slå på sist.

Täcker användarberättelser: 7, 8, 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fyra klickbara steg-räknare står i toppen och räknar personer per steg
- [ ] #2 Ett klick på en räknare filtrerar registret till det steget; den filtrerade vyn renderas platt utan sektionsrubriker
- [ ] #3 Rensa-filter nollar SAMTLIGA filtertillstånd, inte bara ett — den latenta buggen där tre av fyra tillstånd överlevde är stängd
- [ ] #4 Ett aktivt filter är synligt som aktivt, och räknarnas tal förblir koherenta med basens egna fält
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
