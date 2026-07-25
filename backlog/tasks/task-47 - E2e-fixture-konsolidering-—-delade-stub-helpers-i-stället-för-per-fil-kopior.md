---
id: TASK-47
title: E2e-fixture-konsolidering — delade stub-helpers i stället för per-fil-kopior
status: To Do
assignee: []
created_date: '2026-07-25 06:51'
labels: []
dependencies: []
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur task-18.19:s review-pilot (utanför-scope, 2026-07-25): e2e-sviterna duplicerar stub-helpers per fil (mockNotes, eventDetail-fabriker, get-registrations-stubbar m.fl.) — samma shotgun surgery-klass som get-events-stubben uppvisade när eventväljaren landade i sidhuvudet (en komponent-tillägg krävde ändring i 8 filer). tests/e2e/helpers/valjar-lista.ts (18.19) är första lyftet; resterande stub-familjer bor kvar lokalt.

Förväntat: gemensam fixture-modul under tests/e2e/helpers/ (EF-stubbar + rad-fabriker) som sviterna konsumerar med egna rader vid behov — en grammatik, inte N kopior. Även noterat: stub-sviternas default-väljarlista innehåller inte sidornas egna event-ID:n (selectedKey pekar utanför kollektionen; ofarligt i dag — triggern renderar via valtEvent — men blir städat på köpet).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fött ur review-pilotens utanför-scope-sektion på task-18.19 (S86-nattbatchen). Oetiketterat — plockbarhet klassas av människa (ADR-071).
<!-- SECTION:NOTES:END -->
