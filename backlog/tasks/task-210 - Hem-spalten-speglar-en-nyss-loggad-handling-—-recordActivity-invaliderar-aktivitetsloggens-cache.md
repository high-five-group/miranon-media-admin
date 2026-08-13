---
id: TASK-210
title: >-
  Hem-spalten speglar en nyss loggad handling — recordActivity invaliderar
  aktivitetsloggens cache
status: To Do
assignee: []
created_date: '2026-08-13 19:30'
updated_date: '2026-08-13 19:32'
labels: []
dependencies: []
ordinal: 384000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hem-spalten 'Senaste aktivitet' visade inte en nyss skriven anteckning medan historikvyn gjorde det. useLatestActivity ärver appens globala staleTime (5 min, src/router.ts:13) och refetchOnWindowFocus hjälper inte — den hämtar bara om när datan redan är STALE. Marcus-order 2026-08-13: 'Lös det!'. Fixen: recordActivity invaliderar queryKeys.activityLog.all efter en lyckad loggning. Global staleTime MEDVETET orörd.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hem-spalten 'Senaste aktivitet' visar en nyss loggad handling utan omladdning och utan att vänta ut den globala staleTime
- [ ] #2 Invalideringen bor i recordActivity (en plats, alla anropare) och utlöses ENDAST när servern faktiskt tagit emot statementet
- [ ] #3 Fire-and-forget-kontraktet är intakt: recordActivity kastar aldrig, blockerar aldrig, och en trasig cache-yta kan inte nå mutationen
- [ ] #4 Ingen överinvalidering: en resa till Hem och tillbaka UTAN mutation utlöser noll nya hämtningar; global staleTime är orörd
- [ ] #5 Tvasidigt testbevis pa bada nivaerna (enhet + acceptance), och grinden bevisat fallande nar invalideringen tas bort
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
