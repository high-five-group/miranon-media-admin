---
id: TASK-219.3
title: 'Skiva: Fix-vågen — textraderna migreras till trappans steg'
status: To Do
assignee: []
created_date: '2026-08-15 08:50'
labels:
  - ready-for-agent
dependencies:
  - TASK-219.1
parent_task_id: TASK-219
ordinal: 422000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: samtliga produktionsytor som bär en synlig Laddar…-textrad som enda laddbesked migreras till Laddtrappans rätta steg (skeleton där geometrin är känd; sr-only-besked parat med synlig indikator), mekaniskt och beteendeneutralt — ingen datahämtning eller logik ändras. Vågens mängd är ~32 filer per research-mätningen 2026-08-15; den exakta listan grep-deriveras vid start och bokförs i notes. SCOPE-GRÄNS: appnivåns två textrader (appstarts-gaten + rot-Suspense-fallbacken) ägs av TASK-218.3 och rörs INTE här — är de redan borta räknas de av, är de kvar lämnas de kvar. Täcker användarberättelser: 1, 3, 4 (PRD TASK-219).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grep-belagd före/efter-lista i notes: inga synliga Laddar…-textrader som enda laddbesked kvar i produktionsytor, undantaget appnivåns två (TASK-218.3-ägda) om de ännu ej ersatts
- [ ] #2 Varje migrerad yta följer trappans rätta steg; sr-besked bevarade i polite-form
- [ ] #3 Beteendeneutralitet bevisad: befintliga acceptance-/e2e-sviter för berörda ytor gröna; visual-sviten grön
- [ ] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
