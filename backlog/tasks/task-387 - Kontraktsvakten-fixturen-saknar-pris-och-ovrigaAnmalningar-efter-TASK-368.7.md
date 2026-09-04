---
id: TASK-387
title: 'Kontraktsvakten: fixturen saknar pris och ovrigaAnmalningar efter TASK-368.7'
status: Done
assignee: []
created_date: '2026-09-04 08:15'
updated_date: '2026-09-04 08:31'
labels:
  - ready-for-agent
dependencies: []
ordinal: 686000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Fynd

Nattgrinden "Kontraktsvakt (fixtur mot skarp staging)" föll 2026-09-04 (run
`33841484905`, exit 1, 2 failed / 8 passed):

- `get-events` — Staging levererar 1 nyckel som fixturen saknar ·
  `pris` skarp typ: `null | tal` (i 19/19 skarpa poster)
- `get-event` — Staging levererar 2 nycklar som fixturen saknar ·
  `ovrigaAnmalningar` skarp typ: `tal` (i 1/1 skarpa poster) ·
  `pris` skarp typ: `null` (i 1/1 skarpa poster)

## Orsak

Commit `8b6d44e3` (TASK-368.7, PR #2280, S115) lade till `pris` i
get-event/get-events/update-event och deployade till staging, men rörde
aldrig `tests/support/fixturvarld/fixture-data.ts`. `ovrigaAnmalningar`
kommer från ett tidigare kort, `4cfa2779` (TASK-373, beläggningsmätarens
korrigering) — samma driftmönster, en annan leverans.

`src/domain/schemas/Event.schema.ts` bar redan båda fälten
(`pris: z.number().nullable().optional()` rad 55,
`ovrigaAnmalningar: z.number().optional()` rad 82) — schemat var alltså inte
en del av felet, bara fixturen.

## Åtgärd

Fixturen (`tests/support/fixturvarld/fixture-data.ts`) uppdaterad:
`pris` tillagt på samtliga tre poster i `EVENTS_RESPONSE.events`
(1500 / null / 1200 — form-paritet med staging observerade `null | tal`),
plus `pris` (via spread) och `ovrigaAnmalningar: 1` på
`EVENT_DETAIL_RESPONSE.event`.

Verifierat mot staging: `npm run vakt:kontrakt` → 10 passed (15.4s), inklusive
de två tidigare fallande fallen (get-events, get-event).

Landad i samma PR som kortet, gren `fix/kontraktsvakt-fixtur-pris`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 vakt:kontrakt 10/10 grönt mot staging
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Runda 2: ovrigaAnmalningar 0 (invarianten i src/lib/belaggning.ts, granskningsfynd PR #2289 r1).
<!-- SECTION:NOTES:END -->
