---
id: TASK-309.45
title: >-
  Fynd: Bilagor-ytan efter 309.44 — fokusringens 2 px-radie gör runda knappar
  fyrkantiga, fokusring i ⋯-menyn, korten klipps fyrkantigt under
  rullningsskuggan (Marcus 5173-granskning 2026-08-30)
status: In Progress
assignee: []
created_date: '2026-08-30 08:47'
updated_date: '2026-08-30 09:01'
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
- [ ] #1 Den globala fokusring-regeln i base.css sätter inte längre border-radius på element som bär en egen radie: radie-deklarationen flyttad till @layer base (utilities vinner) eller motsvarande rot-fix, med docblock som förklarar kaskaden; mätt: ⋯-knappen bär border-radius 9999px OCH synlig ring under tangentbordsfokus, och hover-plattan är rund efter klick + Escape; namnknappen behåller rounded-lg under fokus; inga andra fokusringar tappar synlighet (outline orörd, olagrad)
- [ ] #2 Ingen fokusring visas i ⋯-menyn vid MUS-öppning (varken på menybehållaren eller första posten), inte heller vid andra öppningen efter Escape-stängning; tangentbordsöppning (Enter/ArrowDown) markerar första posten som förut; mätt med data-focus-visible-inventering + skärmdump per steg
- [ ] #3 Rännan bor helt ÖVER kortet: li pt-2 (inte py-1), wrappern -mt-2 (inte -my-1); ul bär rounded-2xl; skuggan bottom-0; mätt vid 1280 och 390: tray-luft 8 px runtom, 8 px mellan korten, fjärde kortets bottom === ul.bottom === skuggans bottom i vila, li 124 uniform, hookens kod byte-identisk; mitt i scroll (scrollTop 60) klipps kortet med kortets radie och skuggans hörn sammanfaller med klippningens (×3-crop granskad); rullens tumme klipps inte synligt i hörnen
- [ ] #4 Docblocken som beskriver py-1/-my-1/bottom-1 (DokumentListRam, DokumentLista:s li-kommentar, GRUPPKORT_KLASS, § RULLNINGSSKUGGAN) omskrivna mot den nya formen; befintliga assertioner (fjärde kortets bottom ≤ ul bottom, skugga.right = kort.right) gröna; typecheck 0 · biome 0 · build grön · alla dokument-acceptance gröna
- [ ] #5 Landat via review-grinden (ADR-105) och prod-verifierat read-only av orkestreraren: ⋯ rund efter klick+Escape+hover, ingen ring i menyn vid mus, skuggan sammanfaller med kortkanten i vila och scroll
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
