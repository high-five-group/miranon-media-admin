---
id: TASK-200
title: >-
  Doc-drift ur bas-diffen: airtable-constraints P24 föråldrad + tre av fem
  PROD-varningar i field-allowlists.ts falska
status: To Do
assignee: []
created_date: '2026-08-11 19:16'
updated_date: '2026-08-26 03:33'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FIXAT + DIVERGENS UPPTÄCKT (viktigt, ADR-086). (1) P24 rättad i docs/reference/airtable-constraints.md: automationer/vyer/sidor ÄR läsbara via claude.ai-connectorn (mcp__claude_ai_Airtable__*), bara PAT-servern (mcp__airtable__*) är blind — matchar global CLAUDE.md § Verktygsfakta sedan S90. Caveaten (interaktiv auth, endast prod prövat, staging-paritet overifierad) bevarad. Fas E-kravet står kvar (läsbarhet ≠ git-versionering/CI-testbarhet).

(2) field-allowlists.ts: DIVERGENS mot kortets premiss. Kortet pekade ut TRE av fem '⚠️ PROD ... INTE skapad'-varningar som föråldrade (Bor över/Publicerad på miranon.se/Anteckningar, alla S75 2026-07-23). Vid svep mot data-model.md (auktoritativ, ADR-100) 2026-08-26 visade det sig att ALLA FEM nu är föråldrade: Bilagor-tabellen (prod-ID tblevR1B54wFjp7QC) och Kvitton-tabellen (prod-ID tblZC6jBQIHiuS24a) landade i prod 2026-08-11 kl 21:29 — samma dag som bas-diff-forskningspasset (docs/research/prodbas-synk-staging-till-prod-2026-08-11.md) skrevs, bara några timmar senare (S102 bas-apply, git-verifierat: git log -S'tblevR1B54wFjp7QC' -> commit 73aa42e9 samma dag). Forskningspasset klassade dessa två som 'KORREKT' (sant DÅ) men läget hann ändras innan kortet ens mintades. Samtliga fem varningar rättade i denna skiva, med prod-ID + källa per fält/tabell. Rör aldrig prod direkt (endast läst data-model.md, staging/prod-basen ej skriven).

Grindar: check:docs grönt (14/14), typecheck/biome/build gröna. Filer: docs/reference/airtable-constraints.md, supabase/functions/_shared/field-allowlists.ts.
<!-- SECTION:NOTES:END -->
