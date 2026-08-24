---
id: TASK-183
title: >-
  finalize-attachment-upload saknar idempotensnyckel — retry kan ge
  dubblett-metadatarad
status: Done
assignee: []
created_date: '2026-08-10 08:58'
updated_date: '2026-08-24 14:39'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 350000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur S102-batchen (kort ②, 146.4-agenten, öppet bokfört i dess notes): EF:en finalize-attachment-upload skapar metadataraden i Bilagor-tabellen utan idempotensnyckel — ett klient-retry efter timeout kan skapa två rader för samma fil i bucketen. Samma felklass som create-registration-idempotensen (ADR-014) redan löst: följ det mönstret. OBS: 147.5 (bilageväljaren) och 147.10 bygger ovanpå ytan — gapet bör stängas före tung konsumtion, och deras agenter ska känna till det tills dess.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Deterministisk idempotensnyckel per uppladdning; retry-test bevisar EN rad (tvåsidigt: utan nyckel två rader, med nyckel en)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done-flipp S112: PR #1908 landad, post-merge 0a93e95f grön; rött-först-bevis + staging v21 i leveransrapporten (verifierad 2026-08-24).
<!-- SECTION:NOTES:END -->
