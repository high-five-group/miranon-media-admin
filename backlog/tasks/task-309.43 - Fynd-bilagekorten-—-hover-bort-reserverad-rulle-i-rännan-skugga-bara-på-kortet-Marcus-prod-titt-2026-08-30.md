---
id: TASK-309.43
title: >-
  Fynd: bilagekorten — hover bort, reserverad rulle i rännan, skugga bara på
  kortet (Marcus prod-titt 2026-08-30)
status: In Progress
assignee: []
created_date: '2026-08-30 06:26'
updated_date: '2026-08-30 06:39'
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
- [ ] #1 Kortet bär ingen hover-ton: --mm-bilagekort-bg-hover riven ur components.css och ur kortets klass (inkl. motion-safe:transition-colors som saknar föremål); mätt bg rgb(255,255,255) även vid hover; docblock-styckena om hovern (DokumentYta § HOVERN LIGGER PÅ KORTET, pillens hover-not vid TACKNING_KLASS, rad ~822, components.css § bilagekort) omskrivna — inte kvarlämnade som beskrivning av något som inte finns
- [ ] #2 <ul> bär scrollbar-inline: mätt offsetWidth − clientWidth = 11 px vid 1280 i både overflow auto (>4 kort) och hidden (≤4 kort); kortbredd identisk i båda lägena (507 px vid 1280); tummen är --mm-border-strong på transparent spår (husets ljusgrå, samma som NyaAnmalningar/Deltagare) och ligger till höger om korten på behållarens grå yta
- [ ] #3 Rullningsskuggan (lista-uttoning) slutar vid kortets högerkant: right = mätt rännbredd, satt från <ul>:s offsetWidth − clientWidth (useLayoutEffect, ingen hårdkodad px); mätt skugga.right === kort.right (±1 px) vid 1280 och 390; vid 0 ränna (overlay-scrollbar/Firefox) full bredd som förut
- [ ] #4 Höjdlåset orört: useLastaListhojd-kroppen byte-identisk med origin/main (bara docblock får ändras); li 124 px uniform; fjärde kortets bottom ≤ ul bottom, femte top ≥ ul bottom; höjdlås-, tidpunkt- och räckviddsval-acceptance gröna
- [ ] #5 DokumentYta § LISTANS RAM:s docblock rättat mot mätningen (scrollbar-stycket vänt: reserverad ränna är nu beslutet, med Marcus-citatet och mätdatan; skugg-stycket bär rännexklusionen); typecheck 0 · biome 0 · build grön; landat via review-grinden (ADR-105) och prod-verifierat read-only
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
