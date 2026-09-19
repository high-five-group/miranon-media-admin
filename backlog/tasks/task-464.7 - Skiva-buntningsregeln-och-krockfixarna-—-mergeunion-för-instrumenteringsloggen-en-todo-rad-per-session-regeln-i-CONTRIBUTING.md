---
id: TASK-464.7
title: >-
  Skiva: buntningsregeln och krockfixarna — merge=union för
  instrumenteringsloggen, en todo-rad per session, regeln i CONTRIBUTING
status: To Do
assignee: []
created_date: '2026-09-19 10:49'
labels:
  - ready-for-agent
dependencies:
  - TASK-464.3
parent_task_id: TASK-464
priority: medium
ordinal: 823000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två parallella sessioner (S126 + S127) krockade tre gånger 2026-09-19 på dokumentbuntar: två gånger i tasks/todo.md:s kadensrad (EN jätterad som båda skriver i) och en gång i docs/reference/review-instrumentering.jsonl (båda appendar rader). Laga felklassen: (1) .gitattributes: merge=union för instrumenteringsloggen, så git slår ihop appendade rader själv — bevisa med ett lokalt tvågrens-test att två appendar mergar utan konflikt och att varje rad förblir giltig JSON; (2) todo-filens 'Senast uppdaterad'-rad görs om till EN RAD PER SESSION (eller ett block per session) så två sessioner aldrig redigerar samma rad — pröva vilka grindar som läser raden (check-lifecycle, todo-kadens) och håll dem gröna; (3) CONTRIBUTING § Landnings-ordningen får regeln: ORKESTRERARENS egna dokument (sessionsdok, todo, kortstängningar, instrumenteringslogg) landar som EN bunt per pass; agenters dokument-PR:er är orörda; commit är fortsatt gratis och sker löpande (ADR-097). .gitattributes är inte D0 ⇒ PR:en blir kodklassad; det är känt. Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 1, 4.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Två grenar som båda appendar till instrumenteringsloggen mergar utan konflikt (bevisat i test eller dokumenterad körning); varje rad giltig JSON efteråt
- [ ] #2 Två sessioner kan uppdatera todo-filens kadens utan att röra samma rad; lifecycle- och övriga dokumentgrindar gröna (npm run check:docs)
- [ ] #3 CONTRIBUTING bär buntningsregeln med pekare till ADR-133 och ADR-097 § Updates
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
