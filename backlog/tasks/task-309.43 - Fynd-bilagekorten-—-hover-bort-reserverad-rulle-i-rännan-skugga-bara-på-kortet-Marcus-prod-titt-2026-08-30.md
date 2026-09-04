---
id: TASK-309.43
title: >-
  Fynd: bilagekorten — hover bort, reserverad rulle i rännan, skugga bara på
  kortet (Marcus prod-titt 2026-08-30)
status: Done
assignee: []
created_date: '2026-08-30 06:26'
updated_date: '2026-09-04 08:14'
labels: []
dependencies: []
parent_task_id: TASK-309
ordinal: 632000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-titt 2026-08-30 på Bilagor-ytan efter #2123 (S113 resume 3): (1) hover på korten bort; (2) plats för scrollbaren reserveras — det blir fler än fyra delade bilagor snart — med husets ljusgrå tunna rulle (scrollbar-inline), placerad utanför korten på den grå behållaren; (3) rullningsskuggan ska bara ligga på det vita kortet, aldrig över rännan (Marcus: 'sitter den inuti listytan så blir det fult med skuggningen längst ner'). MÄTT 2026-08-30 av orkestreraren på dev-servern (1280, scratchpad mat1/mat.out): scrollbar-inline reserverar 11 px i BÅDA overflow-lägena (ul 518→507 vid auto OCH hidden) — DokumentYta § LISTANS RAM:s 2026-08-29-påstående 'BARA när overflow-y är auto' är falsifierat och ska rättas öppet, inte tyst; handlingsraden är vänsterställd på desktop (knappkanter 540/703 mot listkant 899), så den befarade högerkants-felinriktningen mot knapparna finns inte där; under sm staplas knapparna i full bredd och korten blir 11 px smalare i desktop-Chromium vid smal viewport men inte på riktiga mobiler (overlay-scrollbars reserverar ingen ränna per CSS Overflow 3). Skuggans högerkant = MÄTT rännbredd (offsetWidth − clientWidth på <ul>), aldrig hårdkodad 11 — Firefox/overlay ger 0 och skuggan ska då vara full bredd som förut. Hookens kod (useLastaListhojd) orörd; ingenting renderas inuti <ul> (hooken räknar barn). Byggs oisolerat i huvudkatalogen på egen gren så dev-servern 5173 visar varje commit; orkestreraren verifierar med egna mätskript.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Kortet bär ingen hover-ton: --mm-bilagekort-bg-hover riven ur components.css och ur kortets klass (inkl. motion-safe:transition-colors som saknar föremål); mätt bg rgb(255,255,255) även vid hover; docblock-styckena om hovern (DokumentYta § HOVERN LIGGER PÅ KORTET, pillens hover-not vid TACKNING_KLASS, rad ~822, components.css § bilagekort) omskrivna — inte kvarlämnade som beskrivning av något som inte finns
- [x] #2 <ul> bär scrollbar-inline: mätt offsetWidth − clientWidth = 11 px vid 1280 i både overflow auto (>4 kort) och hidden (≤4 kort); kortbredd identisk i båda lägena (507 px vid 1280); tummen är --mm-border-strong på transparent spår (husets ljusgrå, samma som NyaAnmalningar/Deltagare) och ligger till höger om korten på behållarens grå yta
- [x] #3 Rullningsskuggan (lista-uttoning) slutar vid kortets högerkant: right = mätt rännbredd, satt från <ul>:s offsetWidth − clientWidth (useLayoutEffect, ingen hårdkodad px); mätt skugga.right === kort.right (±1 px) vid 1280 och 390; vid 0 ränna (overlay-scrollbar/Firefox) full bredd som förut
- [x] #4 Höjdlåset orört: useLastaListhojd-kroppen byte-identisk med origin/main (bara docblock får ändras); li 124 px uniform; fjärde kortets bottom ≤ ul bottom, femte top ≥ ul bottom; höjdlås-, tidpunkt- och räckviddsval-acceptance gröna
- [x] #5 DokumentYta § LISTANS RAM:s docblock rättat mot mätningen (scrollbar-stycket vänt: reserverad ränna är nu beslutet, med Marcus-citatet och mätdatan; skugg-stycket bär rännexklusionen); typecheck 0 · biome 0 · build grön; landat via review-grinden (ADR-105) och prod-verifierat read-only
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTT 2026-08-30 (acceptance-fixturvärlden, port 5399, headless Chromium med ignoreDefaultArgs:['--hide-scrollbars']). Agenten kunde INTE mäta mot dev-servern 5173/5180: EF:ernas CORS-allowlist (CORS_ALLOWED_ORIGINS, Supabase-secret utanför repot) saknar 5180, och 5173 servar huvudkatalogen utan grenens kod. Fixturvärlden gav i stället BÅDA overflow-lägena deterministiskt.

RÄNNA + KORTBREDD (AC #2) — 11 px i BÅDA lägena, båda bredder:
  1280 / 9 kort: offsetWidth 518, clientWidth 507, ranna 11, overflow-y auto,  kortbredd 507, kort.right 888, ul.right 899
  1280 / 3 kort: offsetWidth 518, clientWidth 507, ranna 11, overflow-y hidden, kortbredd 507, kort.right 888, ul.right 899
   390 / 9 kort: offsetWidth 308, clientWidth 297, ranna 11, overflow-y auto,  kortbredd 297, kort.right 338, ul.right 349
   390 / 3 kort: offsetWidth 308, clientWidth 297, ranna 11, overflow-y hidden, kortbredd 297, kort.right 338, ul.right 349
Kortbredden är alltså IDENTISK mellan auto och hidden (507 vid 1280, 297 vid 390) — den stabilitet som var hela skälet.
<ul> borderLeft/borderRight = 0px (getComputedStyle) ⇒ offsetWidth − clientWidth ÄR rännan, ingen kant att dra bort.
Tumme: scrollbar-color rgb(196,196,194) på rgba(0,0,0,0); --mm-border-strong = #c4c4c2 = rgb(196,196,194) — identisk. scrollbar-width thin, scrollbar-gutter stable. Rullen ligger i rännan 888–899, alltså till HÖGER om korten på behållarens grå yta (visuellt bekräftat i skärmdump).

SKUGGAN (AC #3) — skugga.right === kort.right, exakt, ingen tolerans behövd:
  1280: skugga.right 888 === kort.right 888 (skugga.left 381), inline style right='11px'
   390: skugga.right 338 === kort.right 338 (skugga.left 41),  inline style right='11px'
Talet kommer ur useLayoutEffect (offsetWidth − clientWidth), aldrig hårdkodat. Vid ≤4 kort renderas ingen skugga alls (kanRulla=false) — väntat.
EJ MÄTT, öppet: 0-ränna-fallet (Firefox/overlay/riktig mobil) är en kodväg (right:0 ⇒ full bredd), inte en mätning — ingen sådan miljö fanns i riggen.

HOVERN (AC #1) — kortets bakgrund rgb(255,255,255) i vila OCH under page.hover() i alla fyra lägen. transition-duration 0s (transition-property 'all' är CSS:ens initialvärde utan effekt, ingen kvarvarande transition-colors). TVÅSIDIGT: skärmdump vila och hover är PIXELIDENTISKA — md5 611f1faac2159f66079d80691180ab7b (1280) resp. 87ca9a071b9191df50bba23547f24867 (390), alltså noll ändrade pixlar.

HÖJDLÅSET (AC #4) — useLastaListhojd-kroppen BYTE-IDENTISK med origin/main: md5 f32cec45283372c922981daa02123651 på båda, diff exit 0, 131 rader vardera. Ingenting renderas inuti <ul> (skuggan ligger kvar på wrappern). li-höjd 124 px uniform, clientHeight 496 = 4×124 i alla fyra lägen.

GRINDAR: typecheck exit 0 · biome exit 0 · build exit 0 · check-langa-streck exit 0 (267 filer, 0 ofångade) · npm run test:acceptance -- dokument: 95 passed (3.0m), tio dokument-sviter inkl. dokument-lista-hojdlas, dokument-lista-hojdlas-tidpunkt, dokument-rackviddsval.

AC #5 EJ BOCKAD: docblock-rättelsen och de tre grindarna är klara, men 'landat via review-grinden och prod-verifierat read-only' sker efter landning och ägs av orkestreraren.

Nattgrind-stängning 2026-09-04: DoD bockad mot belägg — samtliga 5 AC redan bockade (mekanisk DoD#1); DoD#2 styrks av notens grindtabell (typecheck/biome/build/check-langa-streck 0, 95 acceptance passed); DoD#3 verifierat mot git show --stat fd0a5dc4 (PR #2128): enbart DokumentYta.tsx + components.css ändrade.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat via review-grinden: PR #2128 (två commits e34035e7 + 07abe570), runda 1 risk låg med ett info/auto-fix (permanenta assertioner — taget i 309.44:s PR #2130), loop konvergerad, backstopp exit 0, merge-kö → main fd0a5dc4 2026-08-30 07:29 UTC. Vercel production READY 07:29. Prod-verifierat read-only av orkestreraren (smoke-kontot, 1280 + 390, event RIM 1 Rönninge + Delade bilagor): ränna 11 px även vid ≤4 kort (overflow hidden) — kortbredden hoppar inte när en femte bilaga kommer; kort.right 888/338 mot ul.right 899/349; kortets bg vit i vila och hover, transition 0s; tumme rgb(196,196,194) = --mm-border-strong; li 124; h1 Bilagor. Orkestrerarens egen mätning på 5173 (grenen utcheckad detached) bekräftade agentens tal exakt före granskningen. Docblockets 2026-08-29-påstående 'bara vid auto' rättat öppet (kanten som revs). Marcus efterföljande 5173-granskning gav tre nya fynd (fokusradie, menyring, skuggklipp) → TASK-309.45.
<!-- SECTION:FINAL_SUMMARY:END -->
