---
id: TASK-450.5
title: 'Skiva: K1 (b) — beroendegranskningen villkoras mot beroendeträdet'
status: Done
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-19 01:00'
labels:
  - ready-for-agent
dependencies:
  - TASK-450.1
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: medium
ordinal: 779000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus beslut 2026-09-18: väg (b). I dag kör beroendegranskningen på VARJE ändring, vilket lät två externa varningar frysa alla landningar i nio dagar. Efter skivan kör den på ändringsförslag bara när beroendeträdet ändrats (package.json, package-lock.json, låsningarna/undantagen); en ny extern varning mot ett oförändrat träd fångas av nattens bredare granskning inom ett dygn, i sin egen kanal (N2). FÅR INTE landa före N2. Detta ändrar en merge-grinds räckvidd — granskarens risknivå redovisas för Marcus före armering. Spec: planens § K1.

Täcker användarberättelser: 14, 15
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 (i) Varje ändring som rör beroendeträdet granskas som i dag, på ändringsförslaget, med blockerande verkan — bevisat tvåsidigt
- [x] #2 (ii) Hela trädet granskas varje natt med strängare tröskel än dagsviten, i egen kanal (N2 landad och verifierad)
- [x] #3 (iii) Jobbet står kvar i paraplyets needs-lista; ett rött resultat blockerar fortfarande
- [x] #4 (iv) ADR-028:s konventionsflöde för undantag är orört
- [x] #5 Den medvetna diff-oberoende-kommentaren från TASK-395 är ersatt med det nya beslutet och dess skäl; paritetspolicyn och verify:ci-parity gröna
- [x] #6 Review-utlåtandets risknivå är visad för Marcus före armering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1 BEVISAT TVÅSIDIGT, skarpt via GitHub Actions 2026-09-18: (a) PR #2553 (denna PR, rör INTE package.json/package-lock.json/audit-ci.jsonc) — jobbet 'Audit dependencies (audit-ci)' conclusion=skipped (run 35403597247, https://github.com/high-five-group/miranon-media-admin/actions/runs/35403597247), CI Passed or Skipped=success. (b) Kastbar verifieringsgren byggd ovanpå samma commit + en kommentarrad i audit-ci.jsonc — jobbet KÖRDE, conclusion=success (run 35403631029, https://github.com/high-five-group/miranon-media-admin/actions/runs/35403631029), 27 s väggklocka. Verifieringsgrenen och dess PR (#2554) är stängda och raderade efter mätningen (aldrig mergade). AC #6 kvarstår obockad — orkestrerarens review-grinds-mandat.

Review-grindens runda 1 (risk medel, granskad SHA 009516de) FIX-ORDER besvarad, ny head a9ba3d14: (1) changed-deps-steget (ci.yml) utökat till att även vakta scripts/audit-ci-med-degradering.sh, scripts/test-audit-degradering.sh, .github/workflows/ci.yml, .github/workflows/ci-suite.yml — tvåsidigt bevisat skarpt (run 35407259425: enbart skriptändring ⇒ audit kör; run 35406841339: denna PR rör nu ci.yml ⇒ audit kör). (2) .ci-parity-policy.json rad ~31 'stale 41'-talet ersatt med en pekare till svitens egen slutrad (TASK-106). (3) 'Kvarstående risk'-mening om beroendevarning-kanalens saknade watchdog tillagd i PR-kroppen. OBS: jag av misstag skrev över PR-kroppens Riskbedömnings-sektion med gh pr edit --body-file (helersättning) — återställd BYTE-FÖR-BYTE via GraphQL userContentEdits-historik (inget innehåll ändrat), men sektionen är nu STALE mot ny head (granskadSha 009516de, aktuell head a9ba3d14) och väntar på runda 2 från orkestreraren.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
K1 (b) landad via #2553 (5ca4cb54, 2026-09-19T00:16Z), två granskningsrundor (medel → låg, konvergerad). Beroendegranskningen (audit) är villkorad på JOBB-nivå mot sju filer: package.json, package-lock.json, audit-ci.jsonc samt — efter granskningens runda 1 — granskningsMEKANISMEN själv (scripts/audit-ci-med-degradering.sh, dess testsvit, ci.yml, ci-suite.yml), så att en försvagning av mekanismen inte kan landa utan en live-körning. Tvåsidigt bevisat skarpt: run 35407259425 (enbart skriptändring ⇒ audit kör), 35406841339 (PR:en rör ci.yml ⇒ audit kör), 35403597247 (ingen träff ⇒ 0 runner). Aggregatorn ci-passed oförändrat fail-closed (gate-proof 35404368632, check-aggregator-needs 6/6). Kostnad i två mått: väntetid oförändrad (audit låg aldrig på kritiska vägen); fakturerade minuter ≈ 3 837 → ≈ 228 per månad vid 1 279 landningar (≈ 5,9 % av augustis merges rör de sju filerna; självskyddet kostar ≈ 108 min). En ny extern varning mot ett oförändrat träd bärs av nattens strängare granskning (nightly.yml audit-ci --moderate, kanal beroendevarning) — accepterat fönster ≤ 1 dygn, Marcus beslut K1 (b). AC #6: risknivån (medel i runda 1, låg i runda 2) stod i PR-kroppens Riskbedömnings-sektion före armering; armerad av orkestreraren på Marcus mandat 2026-09-19 (låg risk, exit 0, backstopp 0). Efterkontrollen GRÖN: 35408777938. Kvarstående risk, eget kort: TASK-467 (beroendekanalen saknar dödmansvakt och är nu lastbärande). Medåkande: purge-efter-kommentaren i ci-suite.yml rättad; '41 assertions' i .ci-parity-policy.json ersatt med pekare till svitens slutrad (samma tal kvar i ADR-028:385 — bärs av TASK-464.1).
<!-- SECTION:FINAL_SUMMARY:END -->
