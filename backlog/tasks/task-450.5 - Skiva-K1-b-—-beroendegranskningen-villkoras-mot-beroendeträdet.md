---
id: TASK-450.5
title: 'Skiva: K1 (b) — beroendegranskningen villkoras mot beroendeträdet'
status: To Do
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-18 23:05'
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
- [ ] #6 Review-utlåtandets risknivå är visad för Marcus före armering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1 BEVISAT TVÅSIDIGT, skarpt via GitHub Actions 2026-09-18: (a) PR #2553 (denna PR, rör INTE package.json/package-lock.json/audit-ci.jsonc) — jobbet 'Audit dependencies (audit-ci)' conclusion=skipped (run 35403597247, https://github.com/high-five-group/miranon-media-admin/actions/runs/35403597247), CI Passed or Skipped=success. (b) Kastbar verifieringsgren byggd ovanpå samma commit + en kommentarrad i audit-ci.jsonc — jobbet KÖRDE, conclusion=success (run 35403631029, https://github.com/high-five-group/miranon-media-admin/actions/runs/35403631029), 27 s väggklocka. Verifieringsgrenen och dess PR (#2554) är stängda och raderade efter mätningen (aldrig mergade). AC #6 kvarstår obockad — orkestrerarens review-grinds-mandat.
<!-- SECTION:NOTES:END -->
