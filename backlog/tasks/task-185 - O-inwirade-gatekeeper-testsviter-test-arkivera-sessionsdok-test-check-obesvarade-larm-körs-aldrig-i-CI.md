---
id: TASK-185
title: >-
  O-inwirade gatekeeper-testsviter: test-arkivera-sessionsdok +
  test-check-obesvarade-larm körs aldrig i CI
status: To Do
assignee: []
created_date: '2026-08-10 11:43'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 351000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur S102-batchen (kort ⑧ + ⑨, oberoende av varandra): två testsviter finns på disk och passerar lokalt men är ALDRIG inwirade i ci.yml:s 'Test gatekeeper script suites'-block — (1) scripts/test-arkivera-sessionsdok.sh (byggd i TASK-158.2), (2) scripts/test-check-obesvarade-larm.sh (systersvit till nattvakts-familjen). Samma felklass som TASK-90:s facit-policy-fynd: en grind vars tester inte körs kan drifta tyst. Inwira båda + höj shellcheck-scope-räkningen om nya conf-filer berörs; verifiera mot blockets aktuella form (17 sviter efter #1100/#1106).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Båda sviterna inwirade i gatekeeper-blocket och gröna i CI-körning
- [ ] #2 Svep: inga YTTERLIGARE test-*.sh i scripts/ som saknar inwirning (lista utfallet)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
