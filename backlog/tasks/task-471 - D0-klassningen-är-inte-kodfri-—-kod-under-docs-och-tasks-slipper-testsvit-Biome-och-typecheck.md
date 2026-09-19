---
id: TASK-471
title: >-
  D0-klassningen är inte kodfri — kod under docs/** och tasks/** slipper
  testsvit, Biome och typecheck
status: Done
assignee: []
created_date: '2026-09-19 01:36'
updated_date: '2026-09-19 14:37'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 812000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Funnet av granskaren av #2558 (S5) och stickprovat av orkestreraren 2026-09-19: ci.yml:s D0-allowlist (blocket paritet:start klassning-d0) omfattar docs/** och tasks/**, men under de katalogerna ligger körbar kod — åtta JS-filer (docs/backfill/segment-export/*.mjs, docs/reference/automation-scripts/a1-eventmatchning-vakt.js, tasks/sessions/bilagor/**/*.mjs) och en HTML-fil med skript (docs/design/farg-atlas.html). En ändring som BARA rör sådan kod klassas som dokument och slipper hela testsviten — och efter S4 + SE2 (TASK-464.1) även Biome och typkontroll. För CodeQL-ytan stängs hålet av #2558:s vakt scripts/check-codeql-d0-kodfri.sh (analyserbar fil under ignorerad sökväg kräver deklarerat undantag med skäl). Samma premiss — 'D0 = kodfritt' — bär ci.yml:s klassning och är lika obevakad där. Ifrågasätt underifrån: hör körbar kod hemma under en dokumentkatalog alls? Alternativ: (a) återanvänd #2558:s vakt så att den också vaktar ci.yml:s D0-lista (en vakt, två konsumenter, samma undantagslista), (b) flytta koden ut ur dokumentkatalogerna, (c) smalna av D0-mönstren till ändelser. Marcus ledstjärna: värdera i BÅDA måtten väntetid och fakturerade Actions-minuter; inget nytt jobb.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En ny analyserbar fil (JS/TS-familjen, HTML med skript, action.yml) under en D0-klassad sökväg fäller en grind före landning — eller klassas som kod — bevisat tvåsidigt
- [x] #2 En vakt och en undantagslista delas mellan CodeQL-ytan och ci.yml:s klassning (ingen andra kopia); de nio kända filerna är deklarerade med skäl eller flyttade
- [x] #3 verify-ci-parity:s lokala klassning ger samma utfall som CI för samma diff
- [x] #4 PR-kroppens 'Kostnad i två mått' med mätta körningar; CLAUDE.md-prosan om D0 rättad där den blivit falsk
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ÅKER MED NÄSTA KODKLASSADE CI-PR (S126, 2026-09-19, Marcus-beslut A på #2564 runda 3): två info-fynd som INTE rättades i #2564 för att slippa en ny head + ny granskning (~190 fakturerade min för två textrader): (1) .github/workflows/ci.yml rad ~1061 — kommentaren på steget 'Validate CodeQL D0-undantaget är kodfritt' påstår att steget ligger i regionen docs-grindar-ci; det ligger i lint-jobbet (rad 1059–1104), regionen ligger i docs-jobbet (rad 2948–3123). Mekaniken är rätt, prosan falsk (ADR-083-klassen) — en agent som litar på kommentaren och flyttar steget återskapar fail-open-hålet rebasen undvek. (2) scripts/verify-ci-parity.mjs rad ~833 — jobLabel '(… + 9 av lint-jobbets steg)' ska vara 3 efter SE2. Källa: review-utlåtandet runda 3 i #2564:s PR-kropp.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad som PR #2591 → 0c6abac0 (2026-09-19 13:15Z), efterkontroll grön. En runda, konvergerad (risk medel, två info). Vald väg ur AC #1: en GRIND som fäller (inte omklassning) — scripts/check-codeql-d0-kodfri.sh parametriserad och körd även mot ci.yml:s egen klassning-d0-region, EN delad undantagslista (.codeql-d0-kodfri-policy.conf, 13 deklarerade filer — kortets 'nio' var stale). should_skip_tests OFÖRÄNDRAD (orkestrerarens uppdragspremiss om flyttad gräns falsifierad av bygg-agenten). Granskaren belade att grinden körs på felklassen: 464.1:s requires_lint_by_extension tvingar lint att köra på varje diff med icke-inert ändelse. Två info-fynd (radtolkaren hoppar !-negationer; markörsträngarna står två gånger i ci.yml) överförda som krav till TASK-464.4. Bifynd betalda: ci.yml-kommentaren om CodeQL-stegets region och jobLabel 9→3 i verify-ci-parity.mjs.
<!-- SECTION:FINAL_SUMMARY:END -->
