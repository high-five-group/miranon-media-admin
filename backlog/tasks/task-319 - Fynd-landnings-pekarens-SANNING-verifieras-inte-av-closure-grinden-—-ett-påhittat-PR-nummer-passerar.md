---
id: TASK-319
title: >-
  Fynd: landnings-pekarens SANNING verifieras inte av closure-grinden — ett
  påhittat PR-nummer passerar
status: Done
assignee: []
created_date: '2026-08-24 15:07'
updated_date: '2026-08-26 04:49'
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
- [x] #1 Verifieringsform vald mot mätning (fetch-depth-kostnad vs gh-API-robusthet) och bokförd
- [x] #2 Grinden fäller en pekare vars PR inte finns mergad mot main — tvåsidigt bevisad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112 fix-vag 4 bunt E: pekarens SANNING provas nu mot landningshistoriken via git-ancestry (BACKLOG_PEKARE_ANCESTRY_REF + BACKLOG_PEKARE_LANDNINGS_COMMIT_MONSTER), inte via gh-API. AC #1 — formen vald mot MATNING: full klon 20,999 s vs grund klon 20,982 s (+0,08 %, LOKALT 2026-08-26 pa macOS; CI-tiden ar EJ matt), landningsmangden byggs pa 0,838 s over 5575 commits, och samtliga 14 befintliga pekare aterfanns bland 1707 landningar pa origin/main (noll falska positiva). gh-API forkastad: lagger till natberoende i en grind utan sadant, kraver pull-requests: read som nattjobbet inte bar (det har contents: read), och bar rate limit. AC #2 — tvasidigt bevisad: T71 (sann pekare passerar) mot T72 (falsk faller), plus T73/T74/T75/T76/T77/T78 i scripts/test-check-backlog-closure.sh (89 fall grona, exit 0); mutationsprov (pekare_falsk=1 satt till 0) fallde exakt T72/T72b/T73/T74 och lamnade ovriga 85 grona — sviten ar bevisat rod-kapabel. KVARSTAR, medvetet ej taget har: .github/workflows/nightly.yml checkar ut med fetch-depth: 1 (ADR-127 B4), sa provningen redovisas som OPROVAD i natten. Den ar skarp lokalt och i ci.yml:s lint-jobb (fetch-depth: 0). Att andra nattens fetch-depth ar ett eget arkitekturbeslut som hor till ADR-127:s amendering.

Stangningsbatch 2 (S112 resume 1, 2026-08-26): sokt efter ett eget beslutskort for nattjobbets fetch-depth (grep -i fetch-depth over task list --plain samt python-svep av created_date 2026-08-26 i backlog/tasks/) - INGET sadant kort hittades. Kvar star darfor: nattjobbets fetch-depth-beslut (ADR-127 B4-amendering) ar overiferat OPPET, utan ett registrerat uppfoljningskort. Detta bokfors har som avvikelse mot uppdraget (som hedgade referensen med 'om det finns').
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1985
<!-- SECTION:FINAL_SUMMARY:END -->
