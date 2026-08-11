---
id: TASK-200
title: >-
  Doc-drift ur bas-diffen: airtable-constraints P24 föråldrad + tre av fem
  PROD-varningar i field-allowlists.ts falska
status: To Do
assignee: []
created_date: '2026-08-11 19:16'
labels: []
dependencies: []
priority: medium
ordinal: 364000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Belägg (bas-diffen 2026-08-11, Opus-passet, docs/research/prodbas-synk-staging-till-prod-2026-08-11.md): (1) airtable-constraints.md P24 påstår att automationer är osynliga för MCP/API och kräver HAR-export — falsifierat: passet läste prods 11 automationer med fullständiga watchFields via claude.ai-connectorn; globala CLAUDE.md bokför korrigeringen sedan S90 men väggkatalogen har inte följt med, och P24 bär ett Fas E-krav. (2) Tre av fem '⚠️ PROD ... INTE skapad'-varningar i supabase/functions/_shared/field-allowlists.ts är föråldrade (Bor över, Publicerad på miranon.se, Anteckningar-tabellen finns i prod sedan S75) — falska varningar urholkar de två sanna. Åtgärd: rätta P24 mot uppmätt verklighet + svep varningarna mot live-schema.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
