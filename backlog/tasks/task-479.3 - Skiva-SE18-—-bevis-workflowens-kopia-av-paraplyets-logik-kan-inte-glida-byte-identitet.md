---
id: TASK-479.3
title: >-
  Skiva: SE18 — bevis-workflowens kopia av paraplyets logik kan inte glida
  (byte-identitet)
status: To Do
assignee: []
created_date: '2026-09-19 10:53'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-479
priority: medium
ordinal: 833000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
gate-proof-workflowen bär en handhållen replik av aggregatorn ci-passed:s logik. Glider repliken bevisar en gammal grön körning ingenting om dagens logik — och inget märker det. Gör avvikelse omöjlig: antingen härleds repliken ur ci.yml vid körning, eller så prövar en vakt byte-identitet mellan de två blocken (samma paritets-markörer som scripts/check-listparitet.sh redan använder: paritet:start/slut). Välj den minsta formen; ingen ny workflow, inget nytt jobb — ett steg i ett befintligt jobb (varje jobb faktureras som minst en hel minut). N4 (TASK-450.3, scripts/check-aggregator-needs.mjs) är närmaste förebild. Källa: tasks/sessions/2026-09-17-session-126.md Del 17 beslut 10 (Marcus kvittens 2026-09-19) och docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md (åtgärdens egen rad). Varje faktapåstående är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En avsiktlig ändring av ENA sidan fäller vakten med båda blockens namn; oförändrat läge passerar (tvåsidig svit, CI-wirad)
- [ ] #2 Värden (vilka block som paras) bor i policy-fil, inte i skriptet
- [ ] #3 Inget nytt jobb; PR-kroppen redovisar kostnaden i båda måtten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
