---
id: TASK-481
title: >-
  Fynd: betalningsinkorgens skeleton-kort är 24 px lägre än det laddade kortet
  sedan TASK-456 — efterkontrollen på main röd för varje kod-landning
status: To Do
assignee: []
created_date: '2026-09-19 11:14'
updated_date: '2026-09-19 11:55'
labels:
  - fynd
  - ready-for-agent
dependencies: []
references:
  - 'https://github.com/high-five-group/miranon-media-admin/pull/2541'
priority: high
type: bug
ordinal: 837000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Mätt 2026-09-19 (S127)

Post-merge på `main` är RÖD för varje kod-landning sedan `168dd403` (PR #2541, TASK-456): körningarna `35435779866` (`168dd403`), `35435793128` (`018dfeef`), `35435803515` (`c5fdc75c`), `35436771357` (`622803a3`). Docs-only-landningar är gröna eftersom de skippar staging-klassen.

Fallet, ordagrant ur jobbet `Staging (API + E2E)`: `tests/e2e/mer-betalningar-laddlage.staging.test.ts:275` — "AC #2 — MÄTNING: boundingBox på h1, FilterRad och första kortet är IDENTISK …" — `Error: första kortet.height (±1 px tolerans) · Expected: <= 1 · Received: 24`.

## Orsak

PR #2541 gav pill-raden i `RadInnehall` (`src/components/betalningar/BetalningsInkorg.tsx`) en reserverad höjd (`min-h-6` = 24 px) så att ett kort utan pillar blir lika högt som sina syskon. SKELETON-kortet fick ingen motsvarande reservation, så laddläget är nu exakt 24 px lägre än det laddade kortet. Det är en verklig layoutförskjutning i prod (skeleton → data), inte bara ett rött test.

## Varför det inte fångades

Staging-klassen körs inte på PR-ytan (`run_staging: false`, TASK-70.3) utan först i Post-merge. Bygg-agenten för #2541 körde bara sin EGEN nya e2e-svit (hermetiskt, `--no-deps`), aldrig ytans befintliga laddläges-svit; granskningen noterade att CI aldrig kört den nya filen men ingen körde den BEFINTLIGA sviten för den rörda ytan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rött-först är redan belagt på main (Post-merge-körningarna ovan); efter fix är mer-betalningar-laddlage.staging.test.ts grön, kört PÅ RIKTIGT mot staging via den normala vägen (setup-projektet, preflighten respekterad)
- [x] #2 Skeleton-kortet reserverar pill-radens höjd enligt samma husmönster som det laddade kortet (en källa för höjden, inte två tal som kan glida isär)
- [x] #3 Övriga laddläges-sviter för betalningsytan (bekraftelsesteget-laddlage m.fl.) körda och gröna eller belagt förbefintligt flakiga
- [ ] #4 Efterkontrollen (Post-merge) på main grön för fixens merge-commit
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Staging-bevis (S127, ny agent, 2026-09-19 13:53–13:56 CEST)

Port 5173 verifierad ledig (`lsof -nP -iTCP:5173 -sTCP:LISTEN` → tomt) innan körning — orkestreraren stoppade den syskonagent-processen som blockerade föregående agent. Staging-preflighten (`scripts/staging-semaphore.sh status` → LEDIGT) höll under hela körningen.

Kommando: `npm run test:e2e:staging -- tests/e2e/mer-betalningar-laddlage.staging.test.ts tests/e2e/bekraftelsesteget-laddlage.staging.test.ts tests/e2e/betalningar-inkorg-pillrad-hojd.staging.test.ts` (normal väg, setup-projektet + preflighten, ingen `--no-deps`, `MM_STAGING_PREFLIGHT` orörd).

Exitkod: 0. 19/19 passed, 0 failed, 0 flaky, 0 retries — grönt på FÖRSTA försöket, ingen omkörning behövdes.

Det kritiska fallet `tests/e2e/mer-betalningar-laddlage.staging.test.ts:275` ("AC #2 — MÄTNING: boundingBox … IDENTISK före och efter datalandning") är GRÖNT — samma fall som gav `Received: 24` i alla fyra röda Post-merge-körningar på main. `bekraftelsesteget-laddlage.staging.test.ts:225` (tidigare känt flakigt fall) grönt utan omkörning.

AC #1 och #3 bockade på detta underlag. AC #4 (Post-merge grönt för fixens merge-commit) kan bara bockas efter landning.
<!-- SECTION:NOTES:END -->
