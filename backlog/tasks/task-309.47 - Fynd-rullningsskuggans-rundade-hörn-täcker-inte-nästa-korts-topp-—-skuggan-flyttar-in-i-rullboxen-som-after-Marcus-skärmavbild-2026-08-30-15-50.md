---
id: TASK-309.47
title: >-
  Fynd: rullningsskuggans rundade hörn täcker inte nästa korts topp — skuggan
  flyttar in i rullboxen som ::after (Marcus skärmavbild 2026-08-30 15:50)
status: In Progress
assignee: []
created_date: '2026-08-30 13:56'
updated_date: '2026-08-30 14:05'
labels: []
dependencies: []
parent_task_id: TASK-309
ordinal: 636000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-titt 2026-08-30 15:50 (skärmavbild): 'skuggningen nere i högra hörnet … rundningen på skuggningen i högre nedre hörn täcker inte helt nästa kort när det scrollas fram.' Reproducerat av orkestreraren i ×3 (scratchpad kil/, scrollTop 12 och 24): skuggan är ett SYSKON till ul (absolut span i wrappern, left-0, right = mätt rännbredd 11 px, rounded-b-2xl) — dess rundade hörn är centrerat vid kortkanten 888 medan ul:ets klippkurva (rounded-2xl) är centrerad vid 899; i glappet mellan de två kurvorna lyser nästa korts rundade övre högra hörn igenom oskuggat som en vit kil. Prototyp mätt: skuggan som ::after INUTI ul (position sticky, bottom 0, height 24, margin-top −24, gradient) klipps av ul:ets egen kurva och får automatiskt content-boxens bredd (507 = kortbredden, rännan 11 px exkluderad) — kilen borta vid 12/24/60. Pseudo-elementet ligger inte i ul.children, så hookens barn-räkning är opåverkad (verifiera att mat() läser ul.children). rannbredd-mätningen (useLayoutEffect + state) blir onödig och rivs. Testid lista-uttoning försvinner: assertioner läser getComputedStyle(ul, '::after') i stället.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skuggan renderas som ul::after (Tailwind after:-varianter: content-[''], sticky, bottom-0, block, h-6, -mt-6, pointer-events-none, bg-linear-to-t from-(--mm-state-hover) to-transparent), bara när kanRulla; vidBotten via data-attribut på ul (data-[vid-botten]:after:hidden); contrast-more-varianten bevarad (h-1, bg-border-strong, ingen gradient); syskon-spannet, rannbredd-state/useLayoutEffect och testid lista-uttoning rivna; hookens kod byte-identisk (mat() räknar ul.children — pseudo-element ingår inte, bevisat med diff + mätning av låset 488)
- [ ] #2 Mätt vid 1280 och 390 i ×3-crops av nedre högra hörnet vid scrollTop 0/12/24/60: ingen oskuggad kil — skuggan följer ul:ets klippkurva exakt; ::after computed width === ul.clientWidth === kortbredd (507/297), position sticky, height 24; vid maximal rullning är ::after dold; rännan 11 px kvar; li 124; ul.top === kort1.top; låset 488
- [ ] #3 prefers-contrast: more (emulerat) visar en 4 px border-strong-list utan gradient; prefers-reduced-motion oförändrat (ingen animation); ingen ny fokus-/tabb-påverkan (pointer-events none, aria-hidden är irrelevant för pseudo-element)
- [ ] #4 Alla assertioner som läste lista-uttoning (T176 visas/döljs, 309.43 skugga.right = kort.right, 309.45/46 skugga.bottom) omskrivna mot ::after (display/height/position via getComputedStyle(ul, '::after'); bredd via ul.clientWidth === kortbredd; underkant via ul.bottom) — aldrig mildrade, med isolerad negativ kontroll per ny assertion; docblocken (§ RULLNINGSSKUGGAN 'SKUGGAN LIGGER PÅ WRAPPERN, ALDRIG PÅ ul' → 'INUTI ul SOM ::after', rannbredd-styckena, 309.43/45/46-noterna) omskrivna; typecheck 0 · biome 0 · build grön · alla dokument-acceptance + a11y gröna
- [ ] #5 Landat via review-grinden (ADR-105) och prod-verifierat read-only av orkestreraren (×3-crop i prod vid scroll): kilen borta
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
