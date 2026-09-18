---
id: TASK-450.5
title: 'Skiva: K1 (b) — beroendegranskningen villkoras mot beroendeträdet'
status: To Do
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-18 22:47'
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
- [ ] #1 (i) Varje ändring som rör beroendeträdet granskas som i dag, på ändringsförslaget, med blockerande verkan — bevisat tvåsidigt
- [ ] #2 (ii) Hela trädet granskas varje natt med strängare tröskel än dagsviten, i egen kanal (N2 landad och verifierad)
- [ ] #3 (iii) Jobbet står kvar i paraplyets needs-lista; ett rött resultat blockerar fortfarande
- [ ] #4 (iv) ADR-028:s konventionsflöde för undantag är orört
- [ ] #5 Den medvetna diff-oberoende-kommentaren från TASK-395 är ersatt med det nya beslutet och dess skäl; paritetspolicyn och verify:ci-parity gröna
- [ ] #6 Review-utlåtandets risknivå är visad för Marcus före armering
- [ ] #7 Beroendekanalens (beroende-arende) egen 'vaktens vakt' i nightly-watchdog.yml (dead man's switch, samma mönster som produktkanalens — märker om beroendekanalen borde ha fyrat på en röd nightly-audit men inte gjorde det): tillagd i TASK-450.10 (3A) beslut 2026-09-19, byggs HÄR i stället för i 450.10 eftersom denna skiva gör kanalen lastbärande för hela beroendesäkerheten — en vakt byggd före det hade vaktat en icke-lastbärande kanal (se ADR-082 § Updates 2026-09-18 'Öppet, ej avgjort här')
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
