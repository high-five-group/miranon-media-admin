---
id: TASK-127.2
title: 'Skiva: Prototyp-passet — login + accept (tvåfas)'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-03 11:38'
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
- [ ] #1 Divergensfasen visar tre radikalt olika varianter per skärm, växlingsbara på en route
- [ ] #2 Marcus har valt EN vinnare per skärm
- [ ] #3 Konvergensfasen avslutad: Marcus helt nöjd och facit dokumenterat som underlag för byggskivorna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
