---
id: TASK-127.2
title: 'Skiva: Prototyp-passet — login + accept (tvåfas)'
status: Done
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-05 10:56'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-127
ordinal: 206000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tvåfas UI-prototyp (T66-formen) på de två skärmar som ÄR förstaintrycket: den omskrivna login-vyn och accept-sidan. Divergens: tre radikalt olika varianter växlingsbara på en route — Marcus väljer en. Konvergens: vinnaren itereras tills Marcus är helt nöjd. Facit matar byggskivorna; prototypkoden kastas eller absorberas enligt throwaway-kontraktet.

Täcker användarberättelser: 4, 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Divergensfasen visar tre radikalt olika varianter per skärm, växlingsbara på en route
- [x] #2 Marcus har valt EN vinnare per skärm
- [x] #3 Konvergensfasen avslutad: Marcus helt nöjd och facit dokumenterat som underlag för byggskivorna
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGD 2026-08-05 (S96, fjärde resumen) på Marcus kvittens: 'Varför skulle det låsta facit inte stänga kortet?'

GRUND: AC #3 ('Konvergensfasen avslutad: Marcus helt nöjd och facit dokumenterat som underlag för byggskivorna') uppfylldes av beslutsbordets punkt 2, 2026-08-04: FACIT LÅST för login + inbjudan, bilagor 72d169cc. Facit-bilderna bor i tasks/sessions/bilagor/s96-auth-prototyp-facit/.

DoD #2-#4: prototyp-PR:erna #652 (variant B) / #653 (variant A + skarven) / #655 (variant C) / #657 + #658 (inkoppling) landade med grön CI per jobb. Prototypkoden kastas per throwaway-kontraktet (prototype-skillen) - svaret, inte koden, är leverabeln. Kvarvarande base.css-landning är en EGEN post, inte denna skivas.

AVBLOCKERAR: TASK-127.3 och TASK-127.6 (deps [127.1 Done, 127.2 Done]) - och därmed 127.7/127.8 (dep 127.3) och 127.9 (dep 127.3+127.5+127.6).

ORKESTRERARENS NOT: kortet stod öppet i ett dygn efter att dess leverabel var levererad. Frågan ställdes till Marcus en gång för mycket - beslutet var redan taget i beslutsbordet.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
