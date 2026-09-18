---
id: TASK-366
title: >-
  acceptance-sjalvtest-jobbet 45 sekunder från 12-min-taket — samma organiska
  tillväxt som TASK-239, samma fällning väntar
status: To Do
assignee: []
created_date: '2026-09-02 10:50'
updated_date: '2026-09-18 11:29'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 664000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (TASK-239 varv 3, PR #2216, 2026-09-02): i en ren pull_request-körning UTAN kö-last mätte jobbet 'Test suite / Acceptance — tvåsidigt bevis (hermetik-självtest)' 11m9s–11m15s mot timeout-minutes: 12 (ci-suite.yml ~rad 438). Acceptance-klassen har vuxit organiskt 233 → 461 tester (+98 %) sedan varv 2; sharding räddade huvudjobbet (TASK-239) men självtestet kör hela klassen sekventiellt (A+B) i EN process. Under kö-last (tre parallella sviter) fälls det med samma failed_checks-utsparkning som drabbade PR #2209 09:15/09:46. Åtgärd att pröva: samma shard-matris som huvudjobbet ELLER låt självtestet köra en representativ delmängd (det bevisar hermetik-mekanismen, inte hela klassen) — med samma 'ingen reflexmässig takhöjning'-regel som TASK-239 AC #2 (ci-suite.yml ~rad 249, kostnaden av att höja). Belägg: PR #2216-körningarna 33619073362 / 33620286715 (jobbtider ur gh api …/jobs).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Självtest-jobbet har >2 min marginal till sitt tak i en pull_request-körning, mätt ur gh api jobs, utan takhöjning
- [x] #2 Självtestets tvåsidiga bevis (grönt + planterat fel fäller) består efter ändringen
- [x] #3 verify:ci-parity + paritetspolicyn gröna; workflow-lintarna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S126 resume 1 (2026-09-18), PR #2524, runda 2. HEAD 47dc5be6 (rebasad pa main efter #2520; #2528/N4 har sedan landat — merge-tree MATT mot nuvarande main: exit 0, ingen konflikt, BADA gatekeeper-raderna overlever, rad 1595 N4 + rad 1600 N6). MATNING runda 1 (run 35334687514): skarvorna 299/320/271 s, max 320 s mot ORORT tak 20 min = 14 min 40 s marginal; tackningsjobbet 11 s, logg 175+189+160 = summa 524 = listat 524. Runda 2 rattade: download-artifact SHA-pinnad (@3e5f45b2 = v8.0.1) — var forsta opinnade anropet pa en yta som kor vid varje PR, och hela tackningsdomen raknas ur just de filer den levererar. AVVISAT MED MATNING: granskarens krav att byta always() -> !cancelled(). Matt i eget repo (run 25845701660, 2026-05-14): Test+Build cancelled pa eget tak 10m15s medan ci-passed med if !cancelled() && !failure() KORDE och blev success. actions/runner CancelledFunction.cs laser JobContext.Status — STEG-niva ar jobb-scopad (TASK-237-monstret stammer), JOBB-niva ar server-sidig. !cancelled() skulle funka i dag men semantiken ar ODOKUMENTERAD och community-diskussion #174377 begar aktivt att den andras; ett skippat jobb ar GRONT hos oss = fail-OPEN (S77-klassen). success()||failure() diskvalificerad: failure() ar FALSKT nar uppstroms ar cancelled. SIDOFYND ej rattat: purge-efter-kommentarens mekanism-pastaende om !cancelled() ar obelagd hypotes (TASK-309.15 bar noll matning) och nu falsifierat — jobbets always() ar anda ratt av det andra skalet.
<!-- SECTION:NOTES:END -->
