---
id: TASK-8.3
title: 'Skiva: Persist-lagret med skyddsräcken (ADR-072)'
status: To Do
assignee: []
created_date: '2026-07-11 22:55'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-8
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Query-cachen persistas på enheten så att appen öppnar med senast kända data direkt — kallstarten upphör i praktiken (Marcus-kravet 'det ska bara vara där'). Styrs av ADR-072; icke-UI-mekanism (ingen ny synlig yta — effekten är att laddläget FÖRSVINNER vid varm start). Beteende ände-till-ände: appstart med tidigare besök på enheten renderar Hem med senast kända data omedelbart, medan en tyst bakgrundshämtning uppdaterar per osynlighets-mekaniken (restaurerad data är stale per gällande staleTime — poll-lagrets kontrakt ADR-017 ändras INTE); utloggning tömmer den persistade cachen via queryClient.clear()-mönstret (ALDRIG manuell nyckel-radering — den racear mot throttle-synken ~1 s, maintainer-bekräftat); cache skriven av annan app-version kastas vid restore (buster = den build-injicerade versionen, samma källa som versionsraden); maxAge 24 h och gcTime ≥ maxAge för persistade queries (dokumenterad GC-fälla); offline-öppning visar restaurerad data (pwa-offline-svitens precedent). Befintliga e2e-sviter förblir gröna — persist får inte läcka tillstånd mellan tester eller ändra poll-beteendet. Täcker användarberättelser: 1, 4, 8, 9, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varm start (tidigare besök på enheten) renderar Hem med senast kända data direkt utan synligt laddläge, med nätverksnivå-bevisad tyst bakgrundshämtning (e2e)
- [ ] #2 Utloggning tömmer persistad cache — efter logout→login finns ingen tidigare data i lagringen (e2e via auth-flödes-ytan)
- [ ] #3 Skyddsräckena på plats: buster = build-injicerad app-version, maxAge 24 h, gcTime ≥ maxAge för persistade queries — och poll-lagrets befintliga e2e-svit grön (kontraktet orört)
- [ ] #4 Offline-öppning visar restaurerad data (pwa-offline-svitens mönster)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [ ] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->
