---
id: TASK-142
title: >-
  Fynd: verify-ci-parity.mjs kör alltid hela grinduppsättningen — ingen
  diff-klassning
status: To Do
assignee: []
created_date: '2026-08-05 07:02'
labels: []
dependencies: []
ordinal: 227000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-08-05 (S98): en commit som lade till EN markdown-fil drog en full verify:ci-parity-körning på 641,0 s (28 gröna grindar, 153 acceptance-tester, 11 Playwright-tester). CI självt hoppar allt det på en docs-only-diff (ci.yml:s changed-jobb, should_skip_tests). Skriptet konsumerar ingen av changed-jobbets klassnings-outputs — grep -niE 'docs-only|D0|D1|changed|klassning' scripts/verify-ci-parity.mjs gav 3 träffar, samtliga i prosa. Fixen härleder en docs-only-klassning ur ci.yml:s changed-jobb (D0-glob på changed-files-steget) i stället för att duplicera glob-listan, och skippar test-fast/acceptance/webblasarbeteende när diffen (mot origin/main, inkl. otrackade filer) är en ren docs-diff. Fail-closed till fullt läge vid all osäkerhet. --full tvingar fullt läge.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skriptet läser D0-glob strukturellt ur ci.yml:s changed-jobb (changed-files-steget), aldrig en handkopierad lista i policyn
- [ ] #2 En ren docs-diff skippar test-fast/acceptance/webblasarbeteende (tvåsidigt bevisat, sandlåda)
- [ ] #3 En src/-diff kör allt (tvåsidigt bevisat, sandlåda)
- [ ] #4 En blandad diff (docs+kod) kör allt — allowlist, aldrig blocklist (sandlåda)
- [ ] #5 Oläsbar/okänd D0-struktur eller trasig git-diff-beräkning faller tillbaka till fullt läge (sandlåda)
- [ ] #6 Strukturell koppling (suite-jobbets if mot should_skip_tests) vaktas i paritets-preflighten — drift ger EXIT_PARITY_BROKEN
- [ ] #7 --full tvingar fullt läge oavsett diff; --fast oförändrad
- [ ] #8 Faktisk väggklocka mätt före/efter för en docs-only-diff
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
