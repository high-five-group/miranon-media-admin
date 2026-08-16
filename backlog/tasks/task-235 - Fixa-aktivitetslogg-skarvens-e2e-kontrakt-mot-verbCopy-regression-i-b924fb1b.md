---
id: TASK-235
title: Fixa aktivitetslogg-skarvens e2e-kontrakt mot verbCopy (regression i b924fb1b)
status: To Do
assignee: []
created_date: '2026-08-16 07:05'
labels:
  - ready-for-agent
dependencies: []
ordinal: 435000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-16 (S102, röd-kedjan): tests/e2e/aktivitetslogg-skarv.staging.test.ts:266 hårdkodar 'antecknade' medan src/components/hem/SenasteAktivitet.tsx sedan b924fb1b (PR #1335, TASK-225.3) renderar via verbCopy → 'skrev en anteckning'. Rött i post-merge sedan 2026-08-15 10:28 (runs 95000266261, 95004154351), 3/3 försök, ingen slumpaxel. Larm #1342/#1346 stängda mot detta kort. R1 i forensik-rapporten.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Testet bygger förväntan ur verbCopy (importera presentationslagret; frys aldrig presentationssträngen i testet igen)
- [ ] #2 verbCopy.ts:s doc-block ('kopplas på i PROMOVERINGS-skivan, inte här') städat — skivan var b924fb1b
- [ ] #3 Testet grönt mot staging (lokal körning eller nästa post-merge med belägg)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
