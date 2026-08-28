---
id: TASK-28
title: >-
  Fynd: persist-hydrerings-klassen i flerscenario-e2e — route-mock-byte + samma
  query-nyckel + reload serverar scenario 1-data
status: To Do
assignee: []
created_date: '2026-07-22 07:50'
updated_date: '2026-08-28 05:05'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 75000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75, diagnos-runda 2 för 18.8-studsen (trippelbevisad mekanism: ADR-072-persistens trailing 1s-throttle + global staleTime 5 min → scenario 2 hydreras med scenario 1-data och refetchar aldrig; CI alltid över tempofönstret, lokalt lyckoträff).

Symptom: varje flerscenario-e2e som byter route-mock och re-navigerar med SAMMA query-nyckel är exponerad. 18.8:s två instanser (deadline-testet + tomläges-grannen) åtgärdas i studs-rundan med distinkta eventId per scenario.

Förväntat: svep över tests/e2e/** efter mönstret (unrouteAll + ny mock + goto med samma id) + konventionsregel i test-koden (distinkta id per scenario som standard). Ingen produktbugg — ADR-072:s avsedda varmstart.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grep-svep över tests/e2e/** identifierar varje flerscenario-test som byter route-mock och re-navigerar med SAMMA query-nyckel/eventId (unrouteAll + ny mock + goto-mönstret)
- [ ] #2 Varje identifierad instans åtgärdas med distinkta eventId per scenario, i linje med 18.8:s redan etablerade fix-mönster
- [ ] #3 En konventionsregel (distinkta id per scenario som standard) dokumenteras i testkoden (t.ex. helper-kommentar eller README för tests/e2e/)
- [ ] #4 Full e2e-svit körs grön efter ändringen utan ADR-072-relaterad hydrerings-krock
<!-- AC:END -->
