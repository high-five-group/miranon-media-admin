---
id: TASK-309.45
title: >-
  Fynd: Bilagor-ytan efter 309.44 — fokusringens 2 px-radie gör runda knappar
  fyrkantiga, fokusring i ⋯-menyn, korten klipps fyrkantigt under
  rullningsskuggan (Marcus 5173-granskning 2026-08-30)
status: Done
assignee: []
created_date: '2026-08-30 08:47'
updated_date: '2026-09-04 08:15'
labels: []
dependencies: []
parent_task_id: TASK-309
ordinal: 634000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus granskade 309.44 på dev-servern 5173 (2026-08-30 ~08:50 UTC): 'Klar förbättring' — tre fel: (1) hover på ⋯-knappen är rund i utgångsläget men fyrkantig efter att man tryckt på den en gång; (2) den blå fokusringen kommer fram i ⋯-menyn — 'Inte okej. Något är fel där'; (3) skuggan längst ner ser konstig ut när man scrollar. Orkestrerarens reproduktion (Playwright mot 5173, scratchpad fel/): (1) efter klick + Escape bär triggern data-focus-visible och browserns :focus-visible; den globala regeln base.css *:focus-visible { border-radius: 2px } ändrar då knappens FORM (mätt: 9999px → 2px), så hover-plattan blir fyrkantig; en !important-radie återställer 9999px (mätt) men rotorsaken är att en olagrad global regel skriver över elementets egen radie — samma fel drabbar varje rounded-*-element i appen (namnknappen rounded-lg, Button rounded). (3) mitt i en scrollning klipps korten fyrkantigt av rullboxens kant (ul border-radius 0) 4 px under skuggans rundade underkant (bottom-1), och en vit remsa av det klippta kortet syns under skuggan; kandidater mätta i ×3-crops: ul rounded + skuggan bottom-0 ger ren klippning mitt i scroll men lägger gradientens mörkaste 4 px på rännans grå yta i vila (streck-risken Marcus fångade 2026-08-29). Rätt form: lägg hela rännan ÖVER kortet i li (pt-2 i stället för py-1, wrappern -mt-2 i stället för -my-1) så ul:s underkant = fjärde kortets underkant exakt, ul rounded-2xl så klippningen följer kortens radie, skuggan bottom-0 — då sammanfaller skuggans, klippningens och kortets kanter i både vila och scroll. Hookens kod orörd (li-höjden förblir 124 = 116 + 8). (2) reproduceras i samma pass — se notes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Den globala fokusring-regeln i base.css sätter inte längre border-radius på element som bär en egen radie: radie-deklarationen flyttad till @layer base (utilities vinner) eller motsvarande rot-fix, med docblock som förklarar kaskaden; mätt: ⋯-knappen bär border-radius 9999px OCH synlig ring under tangentbordsfokus, och hover-plattan är rund efter klick + Escape; namnknappen behåller rounded-lg under fokus; inga andra fokusringar tappar synlighet (outline orörd, olagrad)
- [x] #2 Ingen fokusring visas i ⋯-menyn vid MUS-öppning (varken på menybehållaren eller första posten), inte heller vid andra öppningen efter Escape-stängning; tangentbordsöppning (Enter/ArrowDown) markerar första posten som förut; mätt med data-focus-visible-inventering + skärmdump per steg
- [x] #3 Rännan bor helt ÖVER kortet: li pt-2 (inte py-1), wrappern -mt-2 (inte -my-1); ul bär rounded-2xl; skuggan bottom-0; mätt vid 1280 och 390: tray-luft 8 px runtom, 8 px mellan korten, fjärde kortets bottom === ul.bottom === skuggans bottom i vila, li 124 uniform, hookens kod byte-identisk; mitt i scroll (scrollTop 60) klipps kortet med kortets radie och skuggans hörn sammanfaller med klippningens (×3-crop granskad); rullens tumme klipps inte synligt i hörnen
- [x] #4 Docblocken som beskriver py-1/-my-1/bottom-1 (DokumentListRam, DokumentLista:s li-kommentar, GRUPPKORT_KLASS, § RULLNINGSSKUGGAN) omskrivna mot den nya formen; befintliga assertioner (fjärde kortets bottom ≤ ul bottom, skugga.right = kort.right) gröna; typecheck 0 · biome 0 · build grön · alla dokument-acceptance gröna
- [x] #5 Landat via review-grinden (ADR-105) och prod-verifierat read-only av orkestreraren: ⋯ rund efter klick+Escape+hover, ingen ring i menyn vid mus, skuggan sammanfaller med kortkanten i vila och scroll
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #3 AVBOCKAD IGEN, medvetet — inte for att nagot mattes fel utan for att EN delklausul inte gar att mata i denna rigg och jag inte overstiger belagget.

ALLT UTOM EN KLAUSUL AR MATT OCH GRONT (talen star i den foregaende noteringen): li pt-2 / wrapper -mt-2 / ul rounded-2xl / skuggan bottom-0, tray-luft 9/9/9 + 8 px mellan korten, kort4.bottom === ul.bottom === skugga.bottom vid BADA bredder, li 124 uniform, hooken byte-identisk, x3-crops mitt i scroll visar rund klippning utan vit remsa.

KLAUSULEN SOM INTE GAR ATT MATA HAR: 'rullens tumme klipps inte synligt i hornen'. Acceptance-projektets headless Chromium malar ingen scrollbar-tumme alls — rannan ar reserverad (11 px, matt) men en x6-uppskalad strimma over hela rannans yta visar enfargad gra. Jag kan alltsa varken bekrafta eller falsifiera klausulen.
Och min egen harledning pekar at FEL hall: rannan ar 11 px bred, ul:s nedre horn-radie 16 px, sa rannans nedersta ~16 px ligger innanfor hornkurvan — en malad tumme skulle formodligen fa sin nedre ande avrundad. Det ar inneboende i att runda en rullbox; enda alternativet ar att ta bort radien, vilket ger tillbaka det fyrkantiga hornet fixen finns for.
Att bocka en AC vars enda oprovade klausul min egen geometri talar EMOT vore att pasta mer an jag vet. Orkestrerarens matning mot 5173 i en riktig webblasare avgor — bocka #3 dar, eller ta ett beslut om radien om tummen ser trasig ut.

Nattgrind-stängning 2026-09-04: DoD bockad mot belägg — samtliga 5 AC redan bockade (mekanisk DoD#1); DoD#2 styrks av Final Summary (review-grinden r1 låg risk, backstopp exit 0, prod-verifierat, AC #3:s sista klausul mätt av orkestreraren på 5173); DoD#3 verifierat mot git show --stat fe3b2b9f (PR #2131): enbart DokumentYta.tsx, Meny.tsx, base.css och en acceptance-testfil ändrade.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat via review-grinden: PR #2131 (4a4a026a kod+tester, 6070b4c3 kort; rebasad på main e50ee1c3), runda 1 risk låg med ett info/auto-fix (ArrowDown-vägen inte explicit testad — RAC:s modalitet är interaktionsbaserad, bokfört), loop konvergerad, backstopp exit 0, merge-kö → main fe3b2b9f 2026-08-30 09:50 UTC; Vercel production READY 09:50. AC #3:s sista klausul (tummen i hörnen) mätt av orkestreraren på 5173 med synlig scrollbar (×3-crops topp/botten, vila/scroll/botten): tummens rundade ändar intakta, ingen synlig klippning — bockad på den mätningen, inte på antagande. Prod-verifierat read-only (smoke-kontot, event RIM 1 Rönninge + Delade bilagor): ⋯ efter klick+Escape+hover = radie full + ring solid + platta #edeee9; hovrad menypost vid mus-öppning outline none (första OCH andra öppningen), Enter-öppning outline solid med data-focus-visible; ul border-radius 16px, li 124, 8 px mellan korten, ränna 11; scroll-fallet (≥5 kort) finns inte i prod-datan — verifierat på 5173 (799/799/799, rundad klippning) och låst av acceptance-assertion. Tre rot-fixar, ingen lapp: radien till @layer base (outline kvar olagrad), släckaren utökad till [role=menuitem], rännan över kortet (pt-2/-mt-2/rounded-2xl/bottom-0).
<!-- SECTION:FINAL_SUMMARY:END -->
