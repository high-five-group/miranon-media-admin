---
id: TASK-400
title: >-
  Fynd: KopplaTillEventDialog.tsx saknar konsumenter — riv den döda dialogen och
  rätta kommentarerna som pekar på den
status: To Do
assignee: []
created_date: '2026-09-05 10:54'
updated_date: '2026-09-05 17:10'
labels:
  - ready-for-agent
dependencies: []
ordinal: 694000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (S120 Del 2, premiss-fynd i TASK-394:s forensik 2026-09-04; re-verifierat av orkestreraren 2026-09-05 vid resume 1): src/components/registrations/KopplaTillEventDialog.tsx importeras ingenstans. Samtliga träffar på namnet utanför filen själv är kommentarer/prosa: AnmalningRadResolution.tsx rad ~26 (docblocket om 'två resolutions-komponenter i samma katalog' — syskonet med etikett-knapp som trigger), src/domain/models/Registration.ts rad ~142, tests/support/fixturvarld/fixture-data.ts rad ~216 och ~230 (radhänvisningar in i dialogen), docs/decisions/ADR-122-eventlankens-vakt-och-atgardskon.md rad ~318 (fillista i prosa). AnmalningRadResolution.tsx tog över rollen (helradsteknik, AC #4 i sitt kort) och dialogen med egen 'Koppla till event'-knapp blev kvar utan anropsplats. Över-engineering-vakten: en komponent utan användare rivs. OBS: rivs INTE i TASK-394 (#2319) — separat landning så eventväljar-PR:en håller sitt scope. Källor: S120 sessionsdok Del 2 + Paushistorik, TASK-394-kortet, grep i src/tests/docs 2026-09-05.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Filen src/components/registrations/KopplaTillEventDialog.tsx är borttagen; grep-bevis i PR-kroppen på att inget importerar den före rivningen (bara kommentarer) och att inget refererar den efter.
- [x] #2 Kommentarerna i AnmalningRadResolution.tsx (docblocket om syskonet), Registration.ts och tests/support/fixturvarld/fixture-data.ts är omskrivna så att de inte pekar på en fil som inte finns; historiken bevaras i en mening ('dialogen med egen knapp revs i TASK-<detta kort>'), inte raderad tyst.
- [x] #3 ADR-122 rad ~318: fillistan får en Updates-not (datum + kortnummer) om att dialogen rivits; ADR:ns beslut orört.
- [x] #4 typecheck 0, biome 0 nya fel, build grön, test:api grön; inga acceptance-/visual-tester refererade filen (verifierat med grep i tests/).
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
