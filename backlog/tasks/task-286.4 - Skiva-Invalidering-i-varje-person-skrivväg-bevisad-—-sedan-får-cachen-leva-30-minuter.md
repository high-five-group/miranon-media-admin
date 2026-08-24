---
id: TASK-286.4
title: >-
  Skiva: Invalidering i varje person-skrivväg, bevisad — sedan får cachen leva
  30 minuter
status: Done
assignee: []
created_date: '2026-08-21 11:50'
updated_date: '2026-08-24 13:08'
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
- [x] #3 staleTime för registerfrågan är 30 minuter EFTER att invalideringen är grön — aldrig före (commit-ordningen synlig i PR:en)
- [x] #4 refetchOnWindowFocus och refetchOnReconnect är oförändrade för registerfrågan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Paritetstestet (EF-filter mot klientfilter, samma fixtur) grönt för varje skiva som rör sök eller filtrering
- [x] #6 Facit-referenserna för personlistan (tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan) gröna — formen är orörd
- [x] #7 Inga nätverksanrop vid skrivning efter första laddningen — mätt i testet, inte antaget
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DoD #6 är BLOCKERAD, inte uppfylld — och lämnas medvetet obockad.

Facit-referenserna för personlistan (tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json) är brutna sedan TASK-286.3 landade: npm run test:visual -- personer-promoverings-grind går 16 -> 10 passed. Avvikelsen är redan bokförd som klass (c) enligt ADR-102 § Updates 2026-08-22, med en amenderings-sidofil som väntar Marcus omstämpling i TASK-283.4.

Denna skiva har därför INTE rört s90-personlistan-konvergens/ och INTE regenererat referenserna. TASK-283.4 säger uttryckligen att bygget inte får regenerera sina egna referenser: laget skulle då återställas av samma arbete som bröt det, och grinden kunde per definition aldrig fånga den förändring den finns för.

Vad som i stället bevisats, mekaniskt: diffen rör inte personlistans rendering. git diff --name-only saknar src/components/persons/PersonsList.tsx. Ett nytt test (tests/api/personregister-farskhet.test.ts, 'PersonsList sätter INGEN egen staleTime på registerfrågan') låser dessutom att registerfrågan i den filen ärver färskheten från nyckeln i stället för att sätta en egen — så vägen till en framtida PersonsList-ändring för denna axel är stängd.

DoD #5 (paritetstestet EF-filter mot klientfilter) är EJ TILLÄMPLIGT för denna skiva: diffen rör varken sök eller filtrering. src/lib/person-sok.ts, PersonsLists filtrering och get-persons sök-/cursorgren är samtliga orörda; skivan ändrar enbart cache-invalidering och staleTime.

## Orkestrerar-stängning 2026-08-22

Merge-SHA `d4317a2e` (PR #1760). DoD #3 (CI grön per jobb) bockad — `gh pr checks 1760`: samtliga jobb pass/skipping, noll fail. DoD #7 (inga nätverksanrop vid skrivning efter första laddningen) bockad — mekaniskt bevisat i tests/api/personregister-invalidering.test.ts, testet 'en OMONTERAD registerfråga markeras stale UTAN nätverksanrop': räknande queryFn stannar på antal()===1 efter invalideringen, 250ms grace-period för en ev. felaktig refetch inräknad. DoD #5 och #6 lämnas ÖPPNA — redan motiverade ovan (EJ TILLÄMPLIGT respektive BLOCKERAD, klass (c), TASK-283.4). Status sätts Done.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): DoD#6 var BLOCKERAD (explicit, ej N/A) av samma personlistan-facit-brott som 286.3/283.3, väntande TASK-283.4. TASK-283.4 är nu Done (referenser regenererade PR #1802, facit omstämplat PR #1803). Nyverifierat denna session: promoverings-grinden 16/16 passed exit 0; facit-grinden exit 0. DoD#6 bockad mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
