---
id: TASK-450.4
title: 'Skiva: N5 — rätta dedupens falsifierade motivering, bokför K1-beslutet'
status: Done
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-18 11:57'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: medium
ordinal: 778000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två ställen motiverar merge-dedupens sundhet med merge-grindens strict up-to-date-krav — ett krav som är avstängt sedan 2026-08-05. Mekanismen är fortfarande säker, men av ett annat skäl: steget är fail-closed på varje trädavvikelse. Efter skivan står rätt skäl på båda ställena, i den öppna korrigeringsform ADR-076 redan använder (premissen föll, och när), och ADR-077 bär ett Updates-block som också bokför Marcus K1-beslut 2026-09-18: väg (b), villkora beroendegranskningen mot beroendeträdet, först när N2 landat (byggs i egen skiva). Ingen körlogik ändras — i ci.yml rörs enbart en kommentar. Spec: planens § N5 + § K1.

Täcker användarberättelser: 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sökning på strict up-to-date-krav ger noll kvarvarande träffar som påstår att kravet gäller
- [x] #2 ADR-077 bär Updates-block med (a) rättelsen och när premissen föll, (b) K1-beslutet med Marcus ord och datum
- [x] #3 markdownlint och vale exit 0 på den rättade ADR-filen; workflow-lintarna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
N5 landad via #2520 (129675f1, 2026-09-18T11:01:33Z). Den falsifierade strict-motiveringen rättad öppet i ADR-077 § Beslut 2 + Relaterade dokument och i ci.yml-kommentaren (noll körlogik ändrad, verifierat av granskaren); ADR-077 § Updates 2026-09-18 bär rättelsen och Marcus K1-beslut (väg b, byggs i TASK-450.5, ej före N2). Review-loopen: risk medel, exit 20 på ett ask-user-fynd (samma motivering kvar i scripts/classify-post-merge.sh) — Marcus valde A (armera som den är); raden rättas i N3:s PR #2526. AC #1 klassad felställd av granskaren (repo-bred ordalydelse mot två-fils-scope) — uppfylls fullt när #2526 landat. Efterkontrollen på 129675f1 grön.
<!-- SECTION:FINAL_SUMMARY:END -->
