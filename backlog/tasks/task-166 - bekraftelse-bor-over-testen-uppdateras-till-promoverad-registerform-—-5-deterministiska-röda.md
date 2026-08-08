---
id: TASK-166
title: >-
  bekraftelse-/bor-over-testen uppdateras till promoverad registerform — 5
  deterministiska röda
status: To Do
assignee: []
created_date: '2026-08-08 18:04'
updated_date: '2026-08-08 18:22'
labels:
  - ready-for-agent
dependencies: []
ordinal: 309000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge-körningarna 31269265089 och 31270539778 fäller SAMMA 5 test i två raka körningar — deterministiskt, inte flake (T139-radens tidigare 'varierar mellan körningar' var ett träd-versions-artefakt: testen gick gröna på #991-trädet FÖRE registrets promovering och faller konsekvent från #992). Klass, bevisad på tre stickprov ur run 31270539778: testen skrevs mot den O-PROMOVERADE registerformen. (1) event-bekraftelse.staging.test.ts:569 söker knappen 'Rensa filtret' — promoverade filterpanelen heter 'Rensa filter' med räknebadge (TASK-162.3 AC #1). (2) event-bor-over.staging.test.ts:227 förväntar 'Eva Sten' count 0 — promoverade registrets bas INKLUDERAR avbokade, grå-märkta sist (162.3 AC #2), så avbokade personer hittas nu. (3) event-bor-over.staging.test.ts:255 förväntar attribut på Bor över-knappen som ändrats med kryssläges-formen (162.3 AC #3). Ursprung: TASK-162.3:s leverans uppdaterade bara event-deltagare-filen — bekraftelse-/bor-over-filerna konsumerar samma yta men sveptes aldrig. Detta är tredje+fjärde missen ur samma leverans (efter #999/#1000). LESSON-KANDIDAT (bokförs här, skördas vid sessionsslut): promovering av en yta kräver svep över ALLA tester som konsumerar ytan, inte bara den fil skivan själv rör — och kommande åtgärdsside-PRD ska bära ett test-konsument-svep-AC. Fixen: uppdatera testen till promoverad form (produktkoden är facit-låst per ADR-103 tills 162.5 — src rörs INTE). Staging-e2e körs inte lokalt (5173-förbudet); post-merge-nätet är grinden.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga 5 fallande test uppdaterade till promoverad registerform; inga src-ändringar
- [x] #2 Övriga assertioner i de två filerna genomsökta mot promoverad form (samma svep-miss får inte upprepas inom filerna)
- [ ] #3 Testen bevisade gröna i post-merge-körning på main
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
