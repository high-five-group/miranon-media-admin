---
id: TASK-30
title: >-
  Beläggningsuppdelningen tappar väntelista-anmälningar (Källa har fyra
  tillstånd, K16-modellen tre)
status: To Do
assignee: []
created_date: '2026-07-22 19:02'
labels: []
dependencies: []
ordinal: 79000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur S75 batch 3 (task-18.4:s bygg-agent). Anmälningar.Källa har FYRA tillstånd — TOM (via formulär), Manuell, +1, Väntelista — men beläggningsuppdelningens K16-modell (task-18.2) mappar bara tre: viaFormular, manuelltTillagda, medfoljande.

SYMPTOM: en anmälan med Källa='Väntelista' räknas varken som viaFormular, manuelltTillagda eller medfoljande. Beläggnings-summeringen kan därmed tappa en person i uppdelningen.

FÖRVÄNTAT: varje anmälan hamnar i exakt en kategori i uppdelningen, eller så deklareras väntelista-fallet explicit som undantaget med motiv.

KONTEXT: 18.4 löser det i SITT eget lager (egen pill 'Från väntelistan', ingen tyst hopslagning) men rör inte beläggnings-summeringen — den ägs av 18.2 som redan är mergad. Bör prövas mot 18.2 och Marcus.

Oetiketterat per fynd-regeln — människan klassar.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
