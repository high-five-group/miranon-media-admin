---
id: TASK-396
title: >-
  Fynd: kvitto.css rubrikruta — samma CSS2.1 §10.3.3-bredd-mönster som
  forsattsblad-tabellen hade
status: To Do
assignee: []
created_date: '2026-09-04 12:57'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 690000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfynd (info, auto-fix) på PR #2295 runda 1+2, 2026-09-04 (`docs/mallar/bilagor/kvitto.css:264`).

Review-agentens fynd 1 (runda 1, oförändrat i runda 2): rubrikrutan `.kvitto-tabellhuvud` kan bära samma bredd-hypotes som Summa-rutan hade i försättsbladet innan TASK-388/PR #2295 (`width: calc(100% - 5mm)` på `.forsattsblad-tabell`) — rotorsaken där var CSS2.1 §10.3.3: en box med `width:100%` inuti en flex-item-wrapper med `margin-left`/`margin-right` blir överkonstruerad, och Prince ignorerar `margin-right` i stället för att krympa `width`. `.kvitto-box` (kvitto.css:257-262) bär samma `margin-left: 2.5mm; margin-right: 2.5mm`-mönster som `.forsattsblad-box` hade. Fyndet nedgraderades uttryckligen till info/auto-fix av orkestreraren i PR #2295 runda 2 med hänvisning till att det registreras som eget kort i stängningsbatchen — detta ÄR det kortet.

Källa: PR #2295 Riskbedömnings-sektion runda 1 + runda 2 fynd 1; `docs/mallar/bilagor/kvitto.css` rad 257-268 (verifierat på `origin/main`, oförändrat sedan innan PR #2295).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mät kvitto.css:s rubrikruta (.kvitto-tabellhuvud) och kvitto-box (.kvitto-box) med npm run mall:pdf -- kvitto samt pdftocairo -svg mot förlagan ~/Desktop/Miranon Media/exempelpdokument/2026-08-03 kvitto-forlaga.pdf — samma metod som avtäckte forsattsblad-buggen
- [ ] #2 Om samma CSS2.1 §10.3.3-avvikelse föreligger (uppmätt breddskillnad mellan rubrikrutan och en referensbredd i mallen): rätta med samma mönster som forsattsblad-fixen (width: calc(100% - <marginalsumma>))
- [ ] #3 Om ingen avvikelse mäts: kortet stängs med mätningen bokförd som negativt resultat, ingen kodändring
- [ ] #4 Spegla ändringen (om någon görs) i supabase/functions/_shared/mallar/kvitto.css.ts via npm run mall:synk, och bash scripts/check-mallparitet.sh grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
