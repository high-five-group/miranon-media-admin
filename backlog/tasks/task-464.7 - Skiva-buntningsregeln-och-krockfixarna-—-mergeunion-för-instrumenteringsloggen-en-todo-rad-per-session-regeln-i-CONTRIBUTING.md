---
id: TASK-464.7
title: >-
  Skiva: buntningsregeln och krockfixarna — merge=union för
  instrumenteringsloggen, en todo-rad per session, regeln i CONTRIBUTING
status: Done
assignee: []
created_date: '2026-09-19 10:49'
updated_date: '2026-09-19 15:07'
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
- [x] #1 Två grenar som båda appendar till instrumenteringsloggen mergar utan konflikt (bevisat i test eller dokumenterad körning); varje rad giltig JSON efteråt
- [x] #2 Två sessioner kan uppdatera todo-filens kadens utan att röra samma rad; lifecycle- och övriga dokumentgrindar gröna (npm run check:docs)
- [x] #3 CONTRIBUTING bär buntningsregeln med pekare till ADR-133 och ADR-097 § Updates
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad som PR #2596 → 811cece3 (2026-09-19 14:36:34Z), efterkontroll grön (35449264278). En runda (risk låg, fyra info). (1) .gitattributes: merge=union för docs/reference/review-instrumentering.jsonl — löser LOKALA merger/rebaser; GitHubs servermerge respekterar inte .gitattributes (community-diskussion #9288, citat verifierat av granskaren), utskrivet i filens huvud. Bevisat live två gånger samma dag (bygg-agentens merge mot main; orkestrerarens rebase ~14:37Z). (2) tasks/todo.md: kadensraden på 26 896 tecken ersatt av en STATISK rad på 566 tecken; varje session synkar sitt eget stycke; sex äldre sessioner (78–84) fick egna rubriker; granskaren belade programmatiskt att ingen text tappades. Sidoeffekt: session-startens läsning av todo-filen fungerar igen (lessons-fragmentet fick statusnot). (3) CONTRIBUTING § Landnings-ordningen: buntningsregeln för ORKESTRERARENS dokument, märkt ÅTAGANDE. Bifynd rättat: appendMetrikRad limmade ihop två JSON-rader utan avslutande radbrytning (test-review-loop 103 → 104). Granskarens ask-user-fynd gällde ADR-133 beslut 5:s besparingstal (härlett, inte mätt) — rättat av orkestreraren i ADR-133 § Updates.
<!-- SECTION:FINAL_SUMMARY:END -->
