---
id: TASK-4.2
title: 'Skiva: Hem-strukturen till facit'
status: Done
assignee: []
created_date: '2026-07-07 08:55'
updated_date: '2026-07-07 11:44'
labels:
  - ready-for-agent
dependencies:
  - TASK-4.1
parent_task_id: TASK-4
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hem renderar som facitets skal. Desktop: INGEN topp-header på Hem (skalet får per-vy-avstängning; övriga vyer behåller sin header), EN skärm-centrerad innehållskolumn på 600 px med innehållet nedflyttat, versionsraden "Miranon Media Admin v{version}" fast nere till vänster (endast desktop) med versionen build-injicerad ur paketmanifestet (B-NYTT2 — aldrig hårdkodad). Mobil: dagens form med samma kolumn. Botten-tabbaren ORÖRD på alla breakpoints. Hälsningskortet: h1 "Hej {namn}" UTAN utropstecken vid första renderingen per session, därefter bara "{namn}" (sessions-state, B2); "Mina sidor"-knapp (secondary, visuell platshållare — ytan är klass D) ersätter uppdatera-knappen (B5: poll-lagret bär färskheten; borttagningen bokförs öppet mot ADR-017-erratumets §2-not). Befintliga kort och CTA:n renderar oförändrade i den nya kolumnen — facit-innehållet i korten kommer i nästa skivor (tracer: strukturen först).

Täcker användarberättelser: 1, 2, 3, 17 (18–20 löpande).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hem saknar topp-header medan övriga vyer behåller sin (e2e)
- [x] #2 Innehållskolumnen mäter 600 px och är skärm-centrerad på desktop (renderad mätning); mobil behåller dagens form
- [x] #3 Hälsningen: 'Hej {namn}' utan utropstecken första gången per session, bara '{namn}' vid återbesök i sessionen (e2e)
- [x] #4 'Mina sidor'-knapp (secondary) på plats; uppdatera-knappen borta; borttagningen bokförd mot ADR-017 §2-noten
- [x] #5 Versionsraden nere till vänster endast desktop och matchar paketmanifestets version (asserterad mot manifestet, ej hårdkodat värde)
- [x] #6 Botten-tabbaren oförändrad; CTA:n kvar; axe-0 på Hem
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TDD: 5 beteenden rött→grönt i EN cykel (uppdaterade/nya e2e körd mot oförändrad kod: 5 failade exakt på nya assertions [header-count, utropstecknet, Mina sidor, kolumn/header, versionsraden], 19 övriga gröna → implementation → 24/24 gröna). AC1: shell-DoD1 (hem header 0, /event header 1) + hem-struktur-test. AC2: e2e-mätning main 600 px centrerad (x=340±1 @1280) + geometri-probe: pt-total 56 px desktop (=facit pt-14), 24 px mobil (=pt-6), inset 16 px (facitets p-4, inte A-skelettets 32). AC3: B2-testet (Hej {namn} → reload → bara namnet; sessionStorage). AC4: Mina sidor (Button secondary sm, K10-exakt; T54-noten för platshållar-a11y-formen) + Uppdatera count 0 + ADR-017 Updates-noten skriven (B5). AC5: versionsraden asserterad MOT paketmanifestet (readFileSync, ej hårdkodat); build-injektion via vite define __APP_VERSION__. AC6: tabbar-testet (4 flikar, FK-mönstret) + CTA-assertion + hem-axe 0. DoD6: facit-avprickning rad-för-rad utförd renderat (geometri-proben [DEBUG-task-4.2] + computed h1 'Hej Lotta'). ÅTERSTÅR: DoD3 (CI efter push) + DoD5 DESIGN-REVIEW (Marcus-grinden — kortet stängs EFTER granskning mot facit-bilagorna; task-1.3-precedenten). Lokala sviter: hem+shell 24/24; fulla e2e 126/2 by-design-skip; a11y 13/13; ENDA felet = event-narvaro loading-state = TASK-3:s stash-belagda pre-existing flake (ytan orörd av skivan).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 9189cb5 · CI-run 28857988881 grön per jobb · CI-grön-första-pass: ja · defekter under körning: 0 i kort-scope (lokala observationer öppet bokförda: TASK-3:s stash-belagda pre-existing narvaro-flake [orörd yta] + transient kall-transform-cache efter dev-server-omstart) · TDD: 1 cykel, 5 beteenden (nya assertions röda mot oförändrad kod → 24/24 gröna) · Design-review: Marcus-godkänd 2026-07-07, FÖRSTA varvet (skal-scopet; kort-innehållet granskas i 4.3/4.4)
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT K10-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-/byggkravspunkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
