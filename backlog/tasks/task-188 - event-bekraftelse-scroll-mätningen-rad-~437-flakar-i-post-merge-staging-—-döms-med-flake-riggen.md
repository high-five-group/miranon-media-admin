---
id: TASK-188
title: >-
  event-bekraftelse scroll-mätningen (rad ~437) flakar i post-merge-staging —
  döms med flake-riggen
status: To Do
assignee: []
created_date: '2026-08-10 14:12'
labels: []
dependencies: []
ordinal: 354000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (mätt, 3 instanser 2026-08-10): toBeLessThanOrEqual-mätningen i tests/e2e/event-bekraftelse.staging.test.ts ~rad 436-438 (aktivt/vilande topp/dok/bar-positioner, tolerans 1px). Hard fail 3/3 retries i post-merge-runs 31384821726 (10430913) + b31e0046-runnen (#1123); retry-pass i 31387516343 (ecfc3596). Ärenden #1111/#1123 stängda mot detta kort. REGEL: flakighet döms med npm run metrics:flake (interfolierad A/B, loadavg, retries=0) — ALDRIG okulärt eller med egen mätserie; läs alltid ut n innan noll-resultat tolkas. FÖRVÄNTAT: mätserie som klassar testet, därefter fix av mätformen eller villkoren — inte en tyst retry-maskering.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
