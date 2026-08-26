---
id: TASK-173.3
title: 'Skiva: Risk-rendreraren + PR-sektionen'
status: Done
assignee: []
created_date: '2026-08-09 13:13'
updated_date: '2026-08-26 07:05'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies:
  - TASK-173.1
parent_task_id: TASK-173
ordinal: 326000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: review-agentens JSON-utlåtande omvandlas av ett deterministiskt skript till den fasta Riskbedömnings-sektionen och skrivs in i PR-kroppen; bevis-påståenden bär commit-pinning (run-ID/SHA) som lag (ADR-105 beslut 5–6). Täcker användarberättelser: 2, 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ett schema-giltigt utlåtande renderas till en deterministisk Riskbedömnings-sektion i PR-kroppen: nivå + enmenings-motivering + fynd-sammanfattning + bevisreferenser med kommando och run-ID/SHA
- [x] #2 Samma JSON-indata ger identisk sektionsutdata (determinism tvåsidigt bevisad)
- [x] #3 Malformat utlåtande fäller rendreraren med tydligt fel — aldrig en tyst tom eller partiell sektion
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Tvåsidig skript-testsvit (ska-fälla + ska-passera) per nytt deterministiskt skript, grön lokalt
- [ ] #6 CI-backstoppens grind-verkan bevisad med rött-först-form: positivt bevis + negativ self-test
- [ ] #7 Instrumenteringsloggen bevisat skrivande från första skarpa körningen (findings-per-runda + risk-kalibrering + grind-missar)
- [x] #8 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OBOCKAT MED AVSIKT: DoD #6 (CI-backstoppen) och #7 (instrumenteringsloggen) hör till skivorna 173.4/173.6 — inte byggda i denna skiva (samma avgränsning som 173.1). Källa: PR #1993 body § Notera + § Scope-disciplin.

Escaping-lärdomen (samma sårbarhetsklass, CodeQL js/incomplete-sanitization, i cell()/kodcell()-paret): bakstreck maste escapas FORE pipe-tecknet, annars kan cmark-gfm dela tabellrader felaktigt (github/cmark-gfm#24) — bade cell() (CodeQL alert #6) och kodcell() (fangad av review-granskningen) hade samma ordningsbugg, bagge fixade och rott-forst manuellt verifierade.

<`/`> (HTML-metatecken) ar MEDVETET oescapade i kodcell()/cell() (scripts/lib/review-risk-sektion.mjs rad 132-135) — GitHubs egen PR-kropps-sanering hanterar HTML-injektion i den ytan; funktionens ansvar ar GFM-tabellstrukturen, inte HTML-sakerhet i en yta GitHub redan saniterar.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1993 (merge-commit 020b9b22, mergad 2026-08-26T05:21:33Z; merge_group-körning pr-1993 = success). AC #1-#3 bockade. DoD #1,2,3,4,5,8 bockade; #6/#7 obockade med avsikt (hör till 173.4/173.6). Done-flipp S112 resume 1, 2026-08-26, post-merge 020b9b22 grönt.
<!-- SECTION:FINAL_SUMMARY:END -->
