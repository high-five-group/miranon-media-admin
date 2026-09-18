---
id: TASK-366
title: >-
  acceptance-sjalvtest-jobbet 45 sekunder från 12-min-taket — samma organiska
  tillväxt som TASK-239, samma fällning väntar
status: To Do
assignee: []
created_date: '2026-09-02 10:50'
updated_date: '2026-09-18 10:38'
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
S126 resume 1 (2026-09-18), PR #2524. MÄTT i PR-körning 35334687514 (gh api .../jobs): självtest-skärvorna 299 s / 320 s / 271 s (10:26:33 -> 10:31:32 / 10:31:53 / 10:31:04). Max 320 s mot ett ORÖRT tak på 20 min = 14 min 40 s marginal (AC #1 krävde >2 min). Täckningsjobbet 11 s (10:31:55 -> 10:32:06), logg: 175+189+160 = summa 524 = listat 524. FÖRE: 12,8-13,7 min (leverabel 9). Kritisk väg för hela kedjan nu 333 s (5,55 min) inkl. summajobbet. TAKSÄNKNING ÖVERVÄGD OCH AVSTÅDD: en mätpunkt, och spridningen mellan de tre skärvorna i SAMMA körning är redan 271-320 s (18 %); körningen bar ingen kö-last, vilket är exakt det läge som gav fyra cancelled 2026-09-03. Sänkning kräver egen mätserie.
<!-- SECTION:NOTES:END -->
