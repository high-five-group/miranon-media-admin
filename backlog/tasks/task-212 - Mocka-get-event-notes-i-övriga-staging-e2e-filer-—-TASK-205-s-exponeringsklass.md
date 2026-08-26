---
id: TASK-212
title: 'Mocka get-event-notes i övriga staging-e2e-filer — TASK-205:s exponeringsklass'
status: Done
assignee: []
created_date: '2026-08-14 16:12'
updated_date: '2026-08-26 04:19'
labels:
  - tests
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 386000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppföljning ur TASK-205:s diagnos (2026-08-14, PR #1273): rotorsaken till layout-invariant-fällningen var att event-bekraftelse.staging.test.ts fetchade get-event-notes OMOCKAT mot skarp staging — äkta 404 på testets egen fixtur-ID, felboxens render +57 px deterministiskt, race mot mätsekvensen.

Diagnos-agenten fann (källa: TASK-205 implementation notes, samma pass) att ytterligare staging-e2e-filer under tests/e2e/ navigerar till /event/:id utan get-event-notes-mock — samma exponeringsklass, ingen bekräftad fällning ännu: atgarder-bekraftelsemail, atgarder-betalningar, atgarder-kvitto, atgarder-paminnelse-eventinfo-fritt, atgarder-testmail, event-bor-over, event-deltagare, mark-paid (verifiera listan mot disk vid plock — den är agentens fynd, inte ett facit).

Åtgärd: applicera samma mock-konvention som TASK-205:s fix (GET_EVENT_NOTES i respektive mocka()/motsvarighet; förlagor finns i event-bekraftelse.staging.test.ts och mockNotes() i event-detail.staging.test.ts). Latent flake elimineras innan den fäller, i stället för fil för fil när natten blir röd.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje staging-e2e-fil som navigerar till /event/:id bär en get-event-notes-mock enligt den etablerade konventionen (listan ovan disk-verifierad vid plock, inte antagen)
- [x] #2 Berörda filers testsviter gröna lokalt efter ändringen (exitkod läst separat, ej pipe)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FIXAT — disk-verifierad scope, SMALARE än kortets föreslagna lista (S112
fix-våg 4, bunt B1).

PREMISS-PASS (ADR-086), fullständig sweep av samtliga tests/e2e/*.staging.test.ts
mot faktisk routing (src/routes/_authenticated/event/) i stället för att
lita på kortets egen, uttryckligen preliminära lista ("agentens fynd, inte
ett facit"):

Endast `/event/:id` (indexroten, src/routes/_authenticated/event/$eventId/
index.tsx) monterar EventDetail.tsx, som är den ENDA komponenten som
fetchar get-event-notes (src/components/events/EventDetail.tsx:335,
grep-verifierat mot hela src/). Övriga underrutter (atgarder.tsx →
AtgardsSida.tsx, anmalda.tsx, narvaro.tsx, ny-anmalan.tsx) fetchar den
ALDRIG (grep i src/components/events/atgarder/ gav noll träffar).

Konsekvens — kortets föreslagna lista omklassad mot disk:
- FIXADE (navigerar till /event/:id, saknade mock, tillagd): event-bor-over.
  staging.test.ts, event-deltagare.staging.test.ts, mark-paid.staging.test.ts.
- FALSIFIERADE SOM EXPONERADE (navigerar bara till /event/:id/atgarder, som
  ALDRIG fetchar get-event-notes — ingen ändring gjord): atgarder-
  bekraftelsemail, atgarder-betalningar, atgarder-kvitto, atgarder-
  paminnelse-eventinfo-fritt, atgarder-testmail (samtliga .staging.test.ts).
- REDAN COMPLIANT (etablerad konvention sedan TASK-205, orörda):
  event-bekraftelse.staging.test.ts, event-detail.staging.test.ts.
- MEDVETET EXKLUDERAD, INTE en lucka: event-narvaro-register.staging.test.ts
  navigerar till /event/:id men dess EGEN docblock (rad 14-20) säger
  explicit att filen mäter "8 skarpa get-event-notes-anrop" mot verklig
  staging som en AVSIKTLIG designbeslut (skild från syskonfilens
  acceptance-klass-migrering) — att mocka här hade rivit den mätningen.
  Rört INTE. Flaggas som gränsfall mot AC #1:s bokstav ("Varje... bär en
  mock") — bedömningen är att den dokumenterade avsikten väger tyngre än
  en blind regel-tillämpning; Marcus/orkestreraren kan ompröva.
- Ingen ytterligare fil i tests/e2e/ navigerar till /event/:id (fullständig
  grep-sweep av alla `/event/`-förekomster i *.staging.test.ts, 12 filer
  totalt genomgångna).

FIX: page.route('**/functions/v1/get-event-notes*', ...) → 200 { notes: [] },
samma konvention som mockNotes() i event-detail.staging.test.ts. Placerad i
respektive fils DELADE setup-funktion (mocka()/mockSidan()) så ALLA tester i
filen täcks automatiskt — plus en enskild extra route i event-deltagare.
staging.test.ts:s "AC #3"-test, som medvetet kringgår den delade
setup-funktionen för sin egen per-event-ID-routing.

VERIFIERAT LIVE (npm run test:e2e:staging, chromium-authenticated):
isolerad körning av de tre ändrade filerna: 31 passed, 3 flakiga (axe-core-
timeout 30s + element-not-found under 3-worker-samtidighet — INTE i
notes-mockens kodyta). Samtliga TRE isolerat omkörda VAR för sig: 100%
gröna (4/4, 2/2). Andra fullkörning reproducerade SAMMA två axe-timeout-
tester (event-deltagare:632, mark-paid:496) plus en TREDJE, varierande
victim per körning — mönster konsistent med last-relaterad flakighet
(fleet-samtidighet på maskinen), inte en regression från denna diff.
Ingen av de tre observerade flaky-testerna rör get-event-notes-mocken.

AC #1: bedöms uppfylld med den disk-verifierade, korrigerade scopen ovan
(inkl. det ENA dokumenterade undantaget). AC #2: gröna vid isolerad
körning — se mätning ovan.

DoD-avstämning S112 resume 1 (2026-08-26). DoD #1 (AC avbockade): 2/2 AC bekräftat [x] — check. DoD #2 (grindar gröna): PR #1982-body — npm run typecheck 0 fel, biome 0 fel i berörda filer, build grönt, npm run test:api 1179/1179; test:e2e:staging på de tre ändrade filerna 31/34 vid full-fil-körning under fleet-parallellism, samtliga 3 flakiga tester (axe-core-timeout + element-not-found) bevisat orelaterade till diffen via isolerad omkörning (100% gröna) — check. DoD #4 (inga orelaterade filer): git diff a2f68b71..f3929e17 (#1982:s korrekta förälder->merge-diff) visar event-bor-over/event-deltagare/mark-paid.staging.test.ts + backlog-kortet, exakt TASK-212:s tre ändrade filer — check. DoD #3 (CI grön per jobb) lämnas obockad, härledd via landningspekaren. Gränsfallet event-narvaro-register.staging.test.ts (medvetet exkluderad, redan flaggat i Implementation Notes ovan) kvarstår som ett öppet omprövningsbeslut för Marcus/orkestreraren mot AC #1:s bokstav — noteras här igen för synlighet i stängningsbatchen.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1982. Done-flipp S112 resume 1, 2026-08-26, post-merge f3929e17e66e: in_progress vid flipptillfället (merge_group för pr-1982 var conclusion=success, den auktoritativa CI-gaten). Gränsfall flaggat: event-narvaro-register.staging.test.ts medvetet exkluderad mot AC #1:s bokstav — se Implementation Notes.
<!-- SECTION:FINAL_SUMMARY:END -->
