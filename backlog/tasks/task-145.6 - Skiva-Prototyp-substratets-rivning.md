---
id: TASK-145.6
title: 'Skiva: Prototyp-substratets rivning'
status: To Do
assignee: []
created_date: '2026-08-07 09:02'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.1
  - TASK-145.2
  - TASK-145.3
  - TASK-145.4
  - TASK-145.5
parent_task_id: TASK-145
ordinal: 238000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototypen har gjort sitt — den skarpa eventsidan ÄR nu den form Marcus låste. Substratet rivs sist, när formen står, aldrig före. Samma ordning som familje-rivningen i task-18.13.

Täcker användarberättelser: 22, 23
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga variant-grenar för hållplats-prototypen är rivna ur produktionskoden (utgångsläge: 104 förekomster över sex filer)
- [ ] #2 Fixtur-grenarna och proto-datalägets kodvägar är rivna; gruppdynamikens och anteckningarnas proto-grenar likaså
- [ ] #3 Prototyp-växlarens post för hållplatsen är borttagen; växlaren själv är ORÖRD (stående komponent, ADR-074)
- [ ] #4 En stale variant-URL degraderar till den skarpa vyn utan krasch och utan halvbyggd yta
- [ ] #5 Vestigiala grenar som blivit strukturellt onåbara av rivningen är antingen borttagna eller öppet bokförda som kvarleva med skäl
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
