---
id: TASK-286.1
title: >-
  Skiva: Adaptern och EF:en lär sig hela registret — breddad fullwalk, båda
  implementationerna, laddtid mätt
status: To Do
assignee: []
created_date: '2026-08-21 11:44'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-286
ordinal: 516000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: ett anrop till datalagrets nya parameterlösa registerfråga returnerar samtliga personer som uppfyller basfiltret (minst en anmälan), med exakt de fält listan visar i dag, i ETT svar. Inget i appen konsumerar den ännu — skivan slutar med att EF:en är deployad till staging och verifierad med direktanrop, så nästa skiva kan byta källa mot en EF som redan svarar.

HUR (ADR-123 beslut 1): DataSourceAdapter får kontraktet; AirtableAdapter anropar get-persons i ett nytt parameterlöst läge där EF:ens BEFINTLIGA fullwalk (den som i dag räknar total med fields: ['Namn']) breddas till alla mapPerson-fält och returnerar posterna. Ingen ny mekanism, ingen ny EF. Dagens sök-/cursor-läge är oförändrat (byte-identiskt svar för befintliga anrop — AC). SupabaseAdapter bär stubben med samma signatur. Airtable-constraints P4/P5/P6 gäller: 100 poster per sida, 5 req/s delad — walken är sekventiell, som i dag.

MÄT, ANTA INTE: kall och varm svarstid för registerläget mot staging (som bara har ~60 poster) OCH extrapolerad mot prods 559 (sex sidor); bokför metod och tal i PR:en och i kortets notes. Påstå aldrig en prod-kostnad du inte mätt — skriv 'extrapolerat'.

Täcker användarberättelser: 14, 16
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 DataSourceAdapter bär en parameterlös registerfråga, implementerad i AirtableAdapter och som stub i SupabaseAdapter — komponentlagret ser bara kontraktet
- [ ] #2 get-persons i registerläget returnerar samtliga poster som uppfyller basfiltret med samma fält som listan visar, via den befintliga fullwalken breddad — ingen andra walk
- [ ] #3 Befintliga anrop (sök/cursor, utan registerparametern) ger byte-identiskt svar mot före skivan — bevisat med testfall
- [ ] #4 EF:ens staging-svit täcker registerläget (antal = basfiltrets träffmängd, fältmängd, att ZZ-fixturer kommer med)
- [ ] #5 Kall och varm svarstid mätt mot staging och extrapolerad till 559 poster, med metod, i PR:en och kortets notes
- [ ] #6 EF:en deployad till staging (projekt pqtshyierkdgwdnxuirz — aldrig prod) och verifierad med direktanrop; UPDATED_AT läst, inte VERSION
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
