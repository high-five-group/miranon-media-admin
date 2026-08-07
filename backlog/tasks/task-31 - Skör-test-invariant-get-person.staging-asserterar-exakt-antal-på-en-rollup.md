---
id: TASK-31
title: 'Skör test-invariant: get-person.staging asserterar exakt antal på en rollup'
status: To Do
assignee: []
created_date: '2026-07-22 19:02'
updated_date: '2026-08-07 11:19'
labels:
  - ready-for-agent
dependencies: []
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur S75 batch 3 (task-18.4:s bygg-agent, fångat live).

SYMPTOM: tests/api/get-person.staging.test.ts asserterar 'expect(person.ort).toHaveLength(2)' — en ABSOLUT räkning på ett ROLLUP-fält över Anmälningar. Vilken framtida skiva som helst som länkar en ny anmälan till ZZ-History-personen bryter testet, utan att något faktiskt är fel.

FÅNGAT LIVE: 18.4:s fixtur-seedning länkade först sin anmälan till 'ZZ-History Person 01'. Personer.Ort-rollupen växte då till tre element och hade fällt testet. Länken togs bort omedelbart, rollupen verifierades återställd till två, och en EGEN person (ZZ-Arbetsko Person 01) seedades i stället — men fällan står kvar för nästa kort.

FÖRVÄNTAT: en invariant formulerad som 'innehåller båda orterna' i stället för 'är exakt 2'. Robust mot additiv fixtur-tillväxt, bevarar testets faktiska avsikt.

BREDARE KLASS: värt att svepa efter fler absoluta räkningar på rollups/länkfält i api-sviten.

Oetiketterat per fynd-regeln — människan klassar.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
