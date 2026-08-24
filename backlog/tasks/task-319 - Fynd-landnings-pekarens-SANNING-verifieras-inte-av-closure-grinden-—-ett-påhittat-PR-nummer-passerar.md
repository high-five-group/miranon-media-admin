---
id: TASK-319
title: >-
  Fynd: landnings-pekarens SANNING verifieras inte av closure-grinden — ett
  påhittat PR-nummer passerar
status: To Do
assignee: []
created_date: '2026-08-24 15:07'
labels:
  - fynd
dependencies: []
ordinal: 582000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Öppen gräns ur TASK-281-bygget (S112, PR #1930, 2026-08-24), utskriven i grindens eget huvud: check-backlog-closure verifierar landnings-pekarens NÄRVARO och FORM (Landning: PR #N i Final Summary) men inte att PR:en existerar, är mergad, eller rör kortet. Ett påhittat nummer ger grön härledning av 'CI grön per jobb'. Stängning kräver git-historik i nattjobbet: nightly.yml:s closure-jobb checkar ut med fetch-depth: 1, vilket utesluter ancestry-verifiering (mätt i TASK-281-passet — det var därför pekarformen valdes). Åtgärdsrymd: fetch-depth: 0 i det jobbet + merge-commit-verifiering (git log --grep 'Merge pull request #N' origin/main), ELLER gh-API-uppslag med fail-closed offline-hantering. Kostnaden (checkout-tid för full historik i natten) mäts före val.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Verifieringsform vald mot mätning (fetch-depth-kostnad vs gh-API-robusthet) och bokförd
- [ ] #2 Grinden fäller en pekare vars PR inte finns mergad mot main — tvåsidigt bevisad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
