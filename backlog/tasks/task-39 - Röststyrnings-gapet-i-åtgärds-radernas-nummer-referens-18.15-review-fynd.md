---
id: TASK-39
title: Röststyrnings-gapet i åtgärds-radernas nummer-referens (18.15-review-fynd)
status: To Do
assignee: []
created_date: '2026-07-25 00:58'
labels: []
dependencies: []
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Review-pilot-fynd (task-18.15, utanför skivans scope; T86). SYMPTOM: åtgärds-radernas radnummer 1–6 är aria-hidden dekor (AT-pariteten Marcus-låst i 18.15) och ingår INTE i det tillgängliga namnet — en röststyrningsanvändare som följer en manual som säger 'gå till åtgärd 4' och säger 'klicka fyra' träffar ingenting; kortets eget motiv (referentbarhet i instruktioner/manualer, Gunilla-principen) är alltså inte uppfyllt för röststyrning. FÖRVÄNTAT BETEENDE: spänningen manual-referens ↔ accessible name avgörs medvetet INNAN manualerna skrivs — t.ex. nummer i accessible name (reviderar AT-paritetsbeslutet öppet), manualspråk som bär radNAMNET ('gå till åtgärd 4, Markera alla obetalda som betalda'), eller dokumenterat avslag. Ingen defekt i 18.15-leveransen — beslutspunkt före manual-arbetet.
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
Fött ur review-pilotens utanför-scope-sektion 2026-07-25 (granskat träd e9cff7d8). Oetiketterat tills Marcus klassar (ADR-053: aldrig tyst förkastande).
<!-- SECTION:NOTES:END -->
