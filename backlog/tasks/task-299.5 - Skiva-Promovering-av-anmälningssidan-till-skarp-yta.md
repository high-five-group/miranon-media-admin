---
id: TASK-299.5
title: 'Skiva: Promovering av anmälningssidan till skarp yta'
status: To Do
assignee: []
created_date: '2026-08-22 19:23'
updated_date: '2026-08-23 17:16'
labels:
  - ready-for-agent
dependencies:
  - TASK-299.4
parent_task_id: TASK-299
ordinal: 545000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den stämplade formen flyttas till den skarpa anmälningssidan. Lotta ser efter skivan en lista där varje rad bär anmälarens initialer, namnet, hur länge sedan anmälan kom in och vilket event den gäller, med statusen på samma plats i varje rad. En rad som behöver kopplas om tar henne direkt till resolutionen. Det filtrerade åtgärdskö-läget säger hur många rader som väntar och har en väg tillbaka till hela listan. Prototyp-substratet rivs enligt promoveringskontraktet — villkor och växlar, aldrig form. Ytan får en promoveringsgrind i EGEN fil enligt husets mönster, den befintliga acceptance-skarven utvidgas i stället för att skrivas om, och den visuella baslinjen om-baselinjeras med avsikt eftersom sidan ändras. Täcker användarberättelser: 1, 2, 7, 8, 9, 10, 13, 14, 15, 21.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Den skarpa /mer/anmalningar är identisk med facit tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json ytan 'anmälningssidan' i alla tre lägen
- [x] #2 Prototyp-substratet rivet enligt ADR-103 B2 steg 4: varianter, växlar och villkor borta, formen kvar; git bär filbytet som rename så historiken följer formen
- [x] #3 Promoveringsgrind i egen fil enligt husets mönster; aria-referensen fångad ur variant-läget FÖRE flippen och grön mot den promoverade ytan efter
- [x] #4 Befintliga acceptance-skarven utvidgad (inte omskriven) med radanatomin och att en åtgärdsrad leder till resolutionen
- [x] #5 Visuell baslinje om-baselinjerad med avsikt; ändringen bokförd i commit-meddelandet som legitim, aldrig tyst
- [x] #6 Det delade predikatet för 'behöver hanteras' återanvänds oförändrat — ingen egen tolkning i vyn
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [x] #6 Höjdlåset verifierat som beteende: rader med/utan status och med/utan åtgärdsbehov har samma höjd
- [ ] #7 Facit-granskning före stängning: anmälningssidan mot tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json, ytan 'anmälningssidan', i alla tre lägen
- [x] #8 Dev-växeln riven före arbetsenhetens stängning; formen kvar (ADR-103 B2 steg 4 — villkor och växlar, aldrig form)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-23 (TASK-299.10-fyndet, korrigerat i denna skiva): Marcus QA på förhandsgranskningsbygget fångade att promoveringen (denna skiva) behöll den gamla textlänken "← Tillbaka till Mer" i stället för husets delade SidRam-primitiv, trots att PRD TASK-299 beslutade full omfattning (alla Mer-sidor, inklusive anmälningssidan) 2026-08-22 — före denna skivas eget landningsdatum. Rättat: SidRam ersätter textlänken, innehållskolumnen (rubrik/filter/tomt-/felläge/skelett) fick ankarets egen px-4 så den linjerar med chevronens mx-4 (x=372 vid 1280 px, matchar väntelistan) — MED ett medvetet undantag för listkortet (behåller x=356 via -mx-4) för att inte återinföra den 32 px-regression som en gång sänkte namnkolumnen till 66,67 px (golvet är 80, mer-anmalningar-form.acceptance.test.ts § Radanatomin). Facit-bilderna (7 st) är omtagna med skarpa routen; AMENDERING-2026-08-23-sidram.md i s111-anmalningssidan-konvergens/ bokför klass (c) och väntar Marcus omstämpling. Promoverings-grindens ariaSnapshot-par regenererades INTE — sidkromet står utanför dess ankare i båda formerna, 18/18 gröna oförändrat.
<!-- SECTION:NOTES:END -->
