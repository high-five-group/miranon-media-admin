---
id: TASK-286.4
title: >-
  Skiva: Invalidering i varje person-skrivväg, bevisad — sedan får cachen leva
  30 minuter
status: To Do
assignee: []
created_date: '2026-08-21 11:50'
updated_date: '2026-08-22 10:17'
labels:
  - ready-for-agent
dependencies:
  - TASK-286.2
parent_task_id: TASK-286
ordinal: 519000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: Lotta anmäler en ny person (eller lägger till en manuell anmälan, eller ändrar något om en person som syns i listan) och går till Personer — personen finns där direkt, utan omladdning och utan att vänta fem minuter. Först när det är bevisat får registret leva längre i cachen: 30 minuter i stället för 5, med refetch vid fönsterfokus och återanslutning kvar.

HUR (ADR-123 beslut 6, ordningen är tvingande): grep-svep över src/data/mutations och övriga skrivvägar som skapar eller ändrar en person eller ett fält listan visar (ny anmälan skapar person; manuell anmälan; personredigering; flaggor/markeringar om de renderas i listan). Varje sådan mutation invaliderar registernyckeln i onSuccess. Bevis: test per skrivväg att registerfrågan markeras stale och refetchas. FÖRST DÄREFTER, i samma skiva men som sista commit-steg, höjs staleTime för registerfrågan till 30 min (refetchOnWindowFocus och refetchOnReconnect oförändrade). Invalideringen av persons.search/all som aldrig fanns (mätt, research § Arkitektur-facit) är därmed stängd för den nya nyckeln.

Täcker användarberättelser: 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grep-svepets träffyta (alla person-skapande/-ändrande skrivvägar) är bilagd i PR:en och varje träff invaliderar registernyckeln
- [x] #2 Test per skrivväg visar att registerfrågan invalideras och refetchas efter mutationen
- [ ] #3 staleTime för registerfrågan är 30 minuter EFTER att invalideringen är grön — aldrig före (commit-ordningen synlig i PR:en)
- [ ] #4 refetchOnWindowFocus och refetchOnReconnect är oförändrade för registerfrågan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Paritetstestet (EF-filter mot klientfilter, samma fixtur) grönt för varje skiva som rör sök eller filtrering
- [ ] #6 Facit-referenserna för personlistan (tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan) gröna — formen är orörd
- [ ] #7 Inga nätverksanrop vid skrivning efter första laddningen — mätt i testet, inte antaget
<!-- DOD:END -->
