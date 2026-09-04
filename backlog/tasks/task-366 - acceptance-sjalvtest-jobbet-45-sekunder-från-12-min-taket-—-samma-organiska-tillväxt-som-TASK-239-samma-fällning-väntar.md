---
id: TASK-366
title: >-
  acceptance-sjalvtest-jobbet 45 sekunder från 12-min-taket — samma organiska
  tillväxt som TASK-239, samma fällning väntar
status: To Do
assignee: []
created_date: '2026-09-02 10:50'
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
- [ ] #1 Självtest-jobbet har >2 min marginal till sitt tak i en pull_request-körning, mätt ur gh api jobs, utan takhöjning
- [ ] #2 Självtestets tvåsidiga bevis (grönt + planterat fel fäller) består efter ändringen
- [ ] #3 verify:ci-parity + paritetspolicyn gröna; workflow-lintarna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
