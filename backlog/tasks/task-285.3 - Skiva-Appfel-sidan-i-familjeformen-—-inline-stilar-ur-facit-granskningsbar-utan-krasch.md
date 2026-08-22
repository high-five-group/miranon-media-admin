---
id: TASK-285.3
title: >-
  Skiva: Appfel-sidan i familjeformen — inline-stilar ur facit, granskningsbar
  utan krasch
status: Done
assignee: []
created_date: '2026-08-21 11:00'
updated_date: '2026-08-22 08:23'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-285
ordinal: 518000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: när hela appen gått sönder och inget annat skyddslager fångat felet ser Lotta en sida som ser ut som Miranon Media Admin: ett centrerat kort utan kontur med röd vänsterkant, rubriken 'Appen kunde inte visas', en brödtext som säger vad som hände, att det sparade finns kvar och vad hon gör nu, samt en mörk knapp 'Ladda om' högerställd. Sidan måste rendera även om stylesheetet är dött — därför inline-stilar med primitivernas faktiska värden och ingen primitiv-import (designvillkoret, bokfört i komponentens doc-block).

FORMEN ÄR LÅST: facit tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json ytan appfel-sidan (bilden visar kortet inbäddat i prototyp-sidan; skarpt centreras det på vit botten med margin 12vh auto). Den körande prototypen är AppErrorPrototyp vid /dev/notis-prototyp?variant=1. Fallbacken bryts ut ur klass-boundaryn som en egen exporterad komponent (boundaryn renderar den) så att primitiv-sidan kan visa den och axe-sviten nå den utan att krascha appen. Prototyp-komponenten RIVS INTE här.

Täcker användarberättelser: 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Appfel-fallbacken är identisk med facit tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json ytan appfel-sidan (ingen kontur, röd vänsterkant, rubrik i rött, neutral brödtext, mörk knapp högerställd, skugga)
- [x] #2 Komponenten importerar inga primitiver och använder inga CSS-variabler — renderar korrekt med stylesheetet bortkopplat (verifierat med ett test som tar bort alla stylesheets före rendering)
- [x] #3 Fallbacken visas på primitiv-sidan och axe-sviten ger noll violations; role=alert behålls på den skarpa sidan
- [x] #4 ariaSnapshot-paret prototyp före == skarp efter är grönt
- [x] #5 Copyn: rubrik utan punkt, brödtext som bär vad som hände, vad som hände med det sparade, och vad användaren gör — inga långa streck
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [x] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [x] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [x] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGNINGSPASS (register-only, 2026-08-22): PR #1703 (merge-SHA 6c58be99), CI grön per jobb (verifierat gh pr checks 1703 — samtliga pass/förväntat skip, noll röda). DoD #2/#5/#6/#7/#8 bockade utifrån belägg i PR-beskrivningen: lokala grindar med exitkoder (typecheck/biome/build/test:api 924/924/check-facit.sh/test:a11y 99/99/test:webblasarbeteende 61-62/62), facit-sökvägar citerade ordagrant, ariaSnapshot-par 4/4 lokalt + tvåsidigt sabotage-bevis, sex testfiler i test-konsument-svepet uppräknade och fixade i samma skiva, inga nya tokens (inline hex, designvillkoret). DoD #4 verifierat mot gh pr diff --name-only (17 filer, samtliga komponent-/test-/kortfiler i scope).
<!-- SECTION:NOTES:END -->
