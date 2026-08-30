---
id: TASK-309.44
title: >-
  Fynd: Bilagor-ytans hierarki — handlingsraden ut ur blocket, ⋯ som ghost med
  rund hover, delad-pill med ikon + info-ton, namn-hover (Marcus mandat
  2026-08-30)
status: In Progress
assignee: []
created_date: '2026-08-30 06:37'
updated_date: '2026-08-30 07:21'
labels: []
dependencies: []
parent_task_id: TASK-309
ordinal: 633000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-08-30 efter prod-titt (S113 resume 3): knapparna 'Ladda upp bilaga'/'Skapa bilaga ▾' sitter inte perfekt i blocket och har annan rundning — MÄTT av orkestreraren på 5173 (scratchpad sida/, 1280 + 390): knappar border-radius 4 px, block (GRUPPKORT_KLASS) 16 px, kort 16 px; knapparna vänsterställda i blocket med tom grå yta till höger; primärknappen (sidans tyngsta element) ligger i listans bricka. Designbedömning: radie-nästling + roll-förväxling. Marcus: 'Om du är helt säker på dina rekommendationer så kör vi på dem. Du har mandat. Du verifierar också att det blir perfekt.' FYRA BESLUT UNDER MANDAT: (A) handlingsraden (ListHandlingsRad) flyttas ut ur blocket till sidflödet mellan EventValjare och blocket — h1 → väljare → handlingsrad → block med 16 px rytm; vänsterställd med naturliga bredder på desktop, staplad i full bredd under sm; blocket innehåller därefter bara listan. (B) ⋯-knappen (IKONKNAPP_KLASS, primary+subtle i dag) blir ghost i vila — bara ikonen i text-secondary, ingen platta — med platta vid hover/fokus/öppen meny, rounded-full så hover-formen aldrig krockar med kortets 16 px-radie; 44 px träffyta orörd. (C) RackviddBadge: delad räckvidd (GEMENSAM) får aria-hidden Layers-ikon + info-ton (bg-info-bg, ikon text-info, text i default-färg som StatusBadge, contrast-more: border-info); 'Detta event' förblir neutral; texten (rackviddsBadgeText) oförändrad — tre kanaler (ikon, ton, text), WCAG 1.4.1. (D) namnknappen får diskret hover-understrykning (data-hovered, underline-offset) som klickbarhets-affordans nu när kortets hover är borta (309.43) — ingen platta. Avvisat med skäl: sektionsrubriker Delade/Eventets egna (höjdlåsets hook räknar li), gruppering-före-datum-sortering (beteendeändring, egen dom). Byggs OVANPÅ fix/task-309-43-… (samma fil, stackad PR), oisolerat i huvudkatalogen så 5173 visar varje commit. Höjdlåset orört.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Handlingsraden renderas UTANFÖR [data-testid=grupp-kort], mellan EventValjare och blocket, i båda lägena (event + delade); mätt vid 1280: 16 px från väljarens underkant till knapparnas överkant och 16 px från knapparnas underkant till blockets överkant; vänsterkanter lika (väljare = knappar = block); under sm staplade i full bredd; blocket innehåller bara listan; testid ladda-upp-ny-fil kvar och befintliga uppladdningstester gröna; sektionskommentaren om 'EventValjare direkt ovanför' och GRUPPKORT_KLASS/ListHandlingsRad-docblocken omskrivna
- [ ] #2 ⋯-knappen: computed background-color transparent i vila och ikonfärg = --mm-text-secondary; synlig platta vid hover (page.hover) och när menyn är öppen (aria-expanded=true); border-radius 9999px; 44×44 px; fokusring vid tangentbord kvar, ingen ring efter musstängning (regeln från e99a5aee oförändrad); contrast-more ger synlig kant
- [ ] #3 RackviddBadge: GEMENSAM-pillen bär aria-hidden Layers-ikon + bg-info-bg (mätt rgb(239,246,255)) + ikon i text-info; 'Detta event'-pillen oförändrad neutral; texten oförändrad (rackviddsBadgeText, title kvar); contrast-more ger info-kant; li-höjden 124 px orörd
- [ ] #4 Namnknappen: text-decoration-line underline vid hover (data-hovered) med underline-offset, ingen platta, ingen understrykning i vila; fokusring oförändrad; cursor pointer
- [ ] #5 Höjdlåset orört (useLastaListhojd byte-identisk med main; li 124 uniform; fjärde kortets bottom ≤ ul bottom); alla tests/acceptance/dokument-*-sviter gröna; typecheck 0 · biome 0 · build grön; orkestrerarens egen mätning + skärmdumpar 1280/390 godkända; landat via review-grinden (ADR-105) och prod-verifierat read-only
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
