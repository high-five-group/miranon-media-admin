---
id: TASK-449
title: >-
  Fynd: fyra acceptance-tester bygger egna fixtursessioner med exp =
  FROZEN_NOW+24h (samma landmina som TASK-448) — ett hem för exp-marginalen i
  hermetic.ts
status: Done
assignee: []
created_date: '2026-09-17 10:57'
updated_date: '2026-09-17 11:40'
labels: []
dependencies: []
priority: medium
ordinal: 773000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Källa

PR #2491 r2 (granskaren, Riskbedömnings-sektionen i PR-kroppen, fynd 1) fann
att `tests/acceptance/login.acceptance.test.ts:39/354`,
`nytt-losenord.acceptance.test.ts:32`, `passkey.acceptance.test.ts:61` och
`valkommen.acceptance.test.ts:31` definierar egna session-byggare med
`exp = FROZEN_NOW + 24h` (2026-09-16T08:00Z), oberoende av
`tests/support/fixturvarld/hermetic.ts`s centrala `buildSession()` som
TASK-448 just fixade (exp -> FROZEN_NOW + 10 år). Dagens läge var ofarligt
(inga av de fyra rörde `page.clock.install()`), men samma landmina om någon
gör det i framtiden.

## Rotorsak

Formeln `Math.floor(FROZEN_NOW.getTime() / 1000) + 24 * 60 * 60` fanns i
FEM kopior (hermetic.ts + fyra acceptance-filer) innan TASK-448 fixade EN av
dem (hermetic.ts). De fyra andra ärvde aldrig fixen eftersom de aldrig
importerade den ursprungliga formeln från ETT hem.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Noll dupliceringar av exp-formeln (FROZEN_NOW + fast offset) i tests/ — grep-bevis
- [x] #2 De fyra sviterna (login, nytt-losenord, passkey, valkommen) gröna hermetiskt
- [x] #3 hermetic.ts-kontraktet (FIXTUR_SESSION_EXP_S) bär det enda hemmet och docblocken i alla fem filer säger det
- [x] #4 DoD gröna (typecheck, tsconfig.tests.json, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done av S125-orkestreraren 2026-09-17: landad via #2500 (main df81e630), review-grinden konvergerad, DoD mot PR-kroppens grind-tabell.
<!-- SECTION:NOTES:END -->
