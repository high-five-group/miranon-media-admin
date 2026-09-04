---
id: TASK-398
title: >-
  Fynd: docs/mallar/bilagor/README.md:s mätmetod-instruktion nämner bara
  pdftotext -bbox, saknar pdftocairo -svg
status: To Do
assignee: []
created_date: '2026-09-04 12:58'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 692000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfynd (info, ask-user) på PR #2295 runda 1+2, 2026-09-04 (`docs/mallar/bilagor/README.md:21`, oförändrat mellan rundorna).

Toppnivå-instruktionen i README.md nämner bara `pdftotext -bbox` (textpositioner). Box-/ramkanter — t.ex. den bredd-avvikelse som TASK-388/PR #2295 avtäckte (Summa-rutans width mot sammanställningsrutans width, mätt i gråfyllnadens path-bbox) — kräver `pdftocairo -svg` i stället; `pdftotext -bbox` ser bara text, inte boxgeometri. CLAUDE.md § Bilagemallarnas FÖRLAGOR nämner redan båda verktygen (`pdftotext -bbox` + `pdffonts`) men saknar också `pdftocairo -svg` för just box-mätning.

Källa: PR #2295 Riskbedömnings-sektion runda 1 + runda 2 fynd 2; `docs/mallar/bilagor/README.md` rad ~21 (verifierat på `origin/main`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 README.md:s toppnivå-mätmetod-instruktion beskriver BÅDA verktygen: pdftotext -bbox för textpositioner, pdftocairo -svg för box-/ramkanter
- [ ] #2 Instruktionen anger NÄR vilket verktyg används (textinnehåll/positioner vs. geometri/bredd/kant)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
