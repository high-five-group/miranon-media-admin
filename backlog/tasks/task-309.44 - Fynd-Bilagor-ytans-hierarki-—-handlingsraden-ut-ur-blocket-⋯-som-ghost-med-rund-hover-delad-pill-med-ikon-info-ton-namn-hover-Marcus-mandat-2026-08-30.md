---
id: TASK-309.44
title: >-
  Fynd: Bilagor-ytans hierarki — handlingsraden ut ur blocket, ⋯ som ghost med
  rund hover, delad-pill med ikon + info-ton, namn-hover (Marcus mandat
  2026-08-30)
status: Done
assignee: []
created_date: '2026-08-30 06:37'
updated_date: '2026-08-30 09:03'
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
- [x] #1 Handlingsraden renderas UTANFÖR [data-testid=grupp-kort], mellan EventValjare och blocket, i båda lägena (event + delade); mätt vid 1280: 16 px från väljarens underkant till knapparnas överkant och 16 px från knapparnas underkant till blockets överkant; vänsterkanter lika (väljare = knappar = block); under sm staplade i full bredd; blocket innehåller bara listan; testid ladda-upp-ny-fil kvar och befintliga uppladdningstester gröna; sektionskommentaren om 'EventValjare direkt ovanför' och GRUPPKORT_KLASS/ListHandlingsRad-docblocken omskrivna
- [x] #2 ⋯-knappen: computed background-color transparent i vila och ikonfärg = --mm-text-secondary; synlig platta vid hover (page.hover) och när menyn är öppen (aria-expanded=true); border-radius 9999px; 44×44 px; fokusring vid tangentbord kvar, ingen ring efter musstängning (regeln från e99a5aee oförändrad); contrast-more ger synlig kant
- [x] #3 RackviddBadge: GEMENSAM-pillen bär aria-hidden Layers-ikon + bg-info-bg (mätt rgb(239,246,255)) + ikon i text-info; 'Detta event'-pillen oförändrad neutral; texten oförändrad (rackviddsBadgeText, title kvar); contrast-more ger info-kant; li-höjden 124 px orörd
- [x] #4 Namnknappen: text-decoration-line underline vid hover (data-hovered) med underline-offset, ingen platta, ingen understrykning i vila; fokusring oförändrad; cursor pointer
- [x] #5 Höjdlåset orört (useLastaListhojd byte-identisk med main; li 124 uniform; fjärde kortets bottom ≤ ul bottom); alla tests/acceptance/dokument-*-sviter gröna; typecheck 0 · biome 0 · build grön; orkestrerarens egen mätning + skärmdumpar 1280/390 godkända; landat via review-grinden (ADR-105) och prod-verifierat read-only
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GRANSKARFYND PR #2130 RUNDA 1 (warning/auto-fix, granskad SHA fc99f4b5) — ATGARDAT. Skivans EGNA fyra beslut saknade permanenta assertioner; de tre testerna fran forra rundan tackte bara det OVERTAGNA #2128-fyndet.

HEMVIST, bokford: A/B/D i dokument-lista-hojdlas (geometri + tillstand i listytan, samma fragedass filen redan ager, samma handler for bada lagena). C i dokument-rackviddsval hos den befintliga pill-vakten — bilagorHandler() ar den ENDA fixturen som ger BADA rackviddstyperna pa samma sida, vilket kravs for den tvasidiga provningen 'delad ser annorlunda ut an event-egen'. Hojdlas-svitens handler ger en pill-typ per lage.

FEM NYA TESTER, alla grona: A eventlage - A rackviddslage - B - D (hojdlas), C (rackviddsval).
Tonerna jamfors mot LEVANDE token-prober i samma dokument, inte hardkodade rgb-strangar: en hardkodad farg faller en medveten token-andring som om den vore en bugg, och faller INTE en klass som slutat peka pa tokenen sa lange nagon annan regel rakar ge samma farg. 16 px assertas exakt — det ar kolumnens gap-4, vart eget tal.
B:s oppna-lage provas med MUSEN BORTFLYTTAD (data-hovered borta, aria-expanded true) — annars hade hover-regeln ensam kunnat forklara fargen och det oppna laget aldrig provats.

FOURTEEN ISOLERADE NEGATIVA KONTROLLER, en bruten invariant per korning (drivrutin som aterstaller kallan mellan varje fall — 309.43:s maskeringsfalla kodad bort). ALLA FJORTON FALLDE:
  A-i   extra barn i grupp-kort            -> 'exakt EN handlingsrad pa sidan'
  A-ii  gap-4 -> gap-6                     -> 'valjare.bottom 226 -> knappar.top 250 ska vara 16 px'
  A-iii pl-2 pa raden                      -> 'knapparnas vansterkant === valjarens'
  A-iv  extra barn i delade lagets block   -> 'exakt EN handlingsrad pa sidan'
  A-v   pt-2 pa raden                      -> 'valjare.bottom 226 -> knappar.top 250 ska vara 16 px'
  B-i   vilo-ikonfargen borttagen          -> toHaveCSS color
  B-ii  hover-plattan borttagen            -> toHaveCSS background-color
  B-iii oppen-plattan borttagen            -> toHaveCSS background-color
  B-iv  rounded-full borttagen             -> 'plattan ska vara RUND'
  C-i   delad pill -> bg-bg-muted          -> toHaveCSS background-color
  C-ii  Layers borttagen                   -> toHaveCount
  C-iii event-egen pill FAR en ikon        -> toHaveCount
  C-iv  ikonstorlek 13 -> 40               -> 'ikonen far inte vaxa raden — hojdlaset ar 124 px'
  D-i   data-[hovered]:underline borttagen -> toHaveCSS text-decoration-line
  D-ii  cursor-pointer borttagen           -> toHaveCSS cursor

KONTROLLEN FANGADE EN VACUOS ASSERTION, vilket ar hela skalet att kora dem. A-iii var forst GRON: matningen last radens WRAPPER, och pl-2 ligger innanfor border-boxen sa wrapperns kanter star stilla medan knapparna flyttar sig. Samma hal fanns lodratt — och det var precis ett pt-1 pa wrappern som revs i denna skiva. mataHierarki laser nu radens EGNA knappar (min left, min top, max bottom); A-iii och nya A-v faller bada efter fixen.

EN ASSERTION UTAN ISOLERAD KONTROLL, oppet bokfort: B:s 'fokus atterlamnas till triggern efter Escape'. Beteendet levereras av react-arias MenuTrigger och gar inte att bryta med en lokal enradsmutation utan att skriva om Meny.tsx-primitiven; ingen realistisk regressionsmutation fanns att kora. Assertionen star kvar (den fangar en framtida handbyggd meny), men den ar INTE negativt kontrollerad — sag inte att den ar det.

GRINDAR efter tillaggen, matta exitkoder: typecheck 0 - biome 0 - build 0 - check-langa-streck 0 (267 filer) - npm run test:acceptance -- dokument: 103 passed (3.6m), exit 0. Talet var 98 fore denna runda, 95 fore skivan.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat via review-grinden: PR #2130 (fyra + tre commits, head ec62cc6e), runda 1 risk medel med ett warning/auto-fix (AC #1–#4 saknade permanenta assertioner) → fem nya tester + fjorton isolerade negativa kontroller (en vacuös wrapper-mätning fångad och rättad) → runda 2 inkrementell (--foregaende-sha fc99f4b5) 0 fynd risk låg, loop konvergerad, backstopp exit 0, merge-kö → main e50ee1c3 2026-08-30 09:01 UTC. Vercel production READY 09:01. Prod-verifierat read-only av orkestreraren (smoke-kontot, 1280 + 390, event + delade): handlingsraden utanför blocket (grupp-kort har exakt ett barn; vänsterkanter 372 = väljare = block; rytm 226→242→286→302 = 16/16), ⋯ transparent i vila med rund platta #edeee9 vid hover, delad pill #eff6ff med Layers-ikon mot neutral #f5f5f3 'Detta event', namnknapp cursor pointer + understrykning vid hover, li 124, ränna 11. Två avvikelser från uppdraget godkända: raden i sidkolumnen (syns även under laddning/fel) och Layers trots segment-ytans reservation (öppet bokförd). Marcus på 5173: 'Klar förbättring' + tre fynd → TASK-309.45 (fokusringens 2 px-radie, ring i menyn, skuggklipp).
<!-- SECTION:FINAL_SUMMARY:END -->
