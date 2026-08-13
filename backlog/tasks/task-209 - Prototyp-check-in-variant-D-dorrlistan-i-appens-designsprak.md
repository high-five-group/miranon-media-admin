---
id: TASK-209
title: 'Prototyp: check-in variant D - dorrlistan i appens designsprak'
status: To Do
assignee: []
created_date: '2026-08-13 18:40'
labels: []
dependencies: []
ordinal: 383000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S105-omtag av check-in-prototypen efter att Marcus underkant A/B/C rakt av. Variant D bygger dorren i appens EGNA stamplade designsprak (personlistans tonala kortyta, Hem-facitets primar-tintade kort, riktiga knappar) och driver listan ur ANMALNINGARNA med deltagandet som statuslager. DEV-grindad, read-only, kastbar per throwaway-kontraktet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Variant D nabar pa /event/$eventId/narvaro?variant=d och ar DEV-grindad
- [ ] #2 A/B/C fungerar oforandrade
- [ ] #3 Listan ar sessions-scopad: 32 deltaganden for 16 personer ger 16 rader, och incheckning pa Dag 1 lacker inte till Dag 2
- [ ] #4 Sessionens harledning visas alltid explicit och ar overstyrbar
- [ ] #5 Ingen mutation kopplas in - inga operationKey mot Deltaganden
- [ ] #6 Grindarna grona: typecheck, biome, test:api, build
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
