---
id: TASK-17.3
title: 'Skiva: Kursfärgs-tokensen (ADR-064-mappningen)'
status: Done
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-23 11:57'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-17
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prefaktorering: kursfärgerna (Fjärrskådning, RIM 1, RIM 2, RIM 3, Annat) etableras som semantiska tokens ur segment-taxonomin (ADR-064) i tokensystemets semantik-/komponentlager — skarp mappning kurs mot färg som ersätter prototypens namn-matchning. Konsumeras av kalendervyn (17.4) och Gruppdynamik (18.10). Möjliggörare — täcker inga egna användarberättelser.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tokensen bor i semantik-/komponentlagret; inga hårdkodade färger i komponenter och primitivlagret orört
- [x] #2 Mappningen kurs mot token täcker taxonomins klasser + Annat som uppsamling och konsumeras via ett enda uppslag (ingen namn-matchning i vyer)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
väntar design-review (S75-batchen v2). Levererat: 5 semantiska kursfärgs-tokens (--mm-kurs-*, semantic.css, primitivlagret orört — alla fem facit-kulörer fanns som primitiver) + uppslaget src/lib/kursfarg.ts (teckenexakta basvärden Fjärrskådning/Resor i medvetandet 1-3 → klass, Annat som uppsamling; KURSFARGER i legendordning) + spec §17. Renderad verifiering GRÖN: computed-style i Chromium 5/5 tokens + 5/5 bg-utilities == facit-kulörerna (#4a6b8a/#606b57/#a3491c/#a90000/#6b6b6b). Grindar: biome 0 · typecheck 0 · test:api 296/296 · build grön (bundelgrep: exakt 5 utilities) · markdownlint+vale 0. TDD-AVVIKELSE: rött-först ej möjligt — PRD:ns Testbeslut (ingen unit-skarv; api-skarven endast läs-shape) + claims-ytan utan testfiler; beteendet renderat-bevisat här och låses av 17.4 AC#1 + 18.10 AC#2.

Historik — AFK-halt (S75 v2): PR-CI-run 29861999049 röd på steget 'Audit dependencies (audit-ci with allowlist)' — 2 nya high-advisories i transitiva beroenden: fast-uri GHSA-4c8g-83qw-93j6 (host confusion, >=3.0.0 <3.1.3) + linkify-it GHSA-v245-v573-v5vm (ReDoS-klass DoS, <=5.0.1, via markdown-it). Orelaterat till skivans diff (semantic.css + src/lib/kursfarg.ts + spec + kort); dependency-bump utanför tillåten yta och ej merge-konflikt → KONFLIKT-MANDATET ej tillämpligt, halt-first. PR #69 lämnad öppen, branch task/17.3 kvar för återupptagning. [Upplöst i S75-batch v2 merge-kedjan: audit-läkningen 93eb969 inmergad, halten historisk.]

CI grönt per jobb: PR-run 29864167430 + main-run 29864624002 (S75-batch v2)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Kursfärgs-tokensen (ADR-064-mappningen) levererad i S75-batchen, CI grön per jobb. Legendens kulörer och kalenderplattornas färger delar samma semantiska token-källa (prefaktorering som kalendern + gruppdynamiken konsumerar). DESIGN-REVIEW GODKÄND av Marcus 2026-07-23 (S75 femte resumen, omgransknings-protokollet Yta 1 — kvittens 'Allt ok' över ytans sex kort; legend/platta-kulörerna jämförda i browsern). DoD #5 bockad; alla AC + DoD gröna.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
