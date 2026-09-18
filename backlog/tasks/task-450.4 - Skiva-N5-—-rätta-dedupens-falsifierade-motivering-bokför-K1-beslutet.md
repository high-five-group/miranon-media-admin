---
id: TASK-450.4
title: 'Skiva: N5 — rätta dedupens falsifierade motivering, bokför K1-beslutet'
status: To Do
assignee: []
created_date: '2026-09-18 09:53'
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
- [ ] #1 Sökning på strict up-to-date-krav ger noll kvarvarande träffar som påstår att kravet gäller
- [ ] #2 ADR-077 bär Updates-block med (a) rättelsen och när premissen föll, (b) K1-beslutet med Marcus ord och datum
- [ ] #3 markdownlint och vale exit 0 på den rättade ADR-filen; workflow-lintarna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
