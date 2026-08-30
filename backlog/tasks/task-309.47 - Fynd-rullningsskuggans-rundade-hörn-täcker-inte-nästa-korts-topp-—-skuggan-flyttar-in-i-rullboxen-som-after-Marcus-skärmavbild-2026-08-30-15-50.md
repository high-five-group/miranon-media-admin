---
id: TASK-309.47
title: >-
  Fynd: rullningsskuggans rundade hörn täcker inte nästa korts topp — skuggan
  flyttar in i rullboxen som ::after (Marcus skärmavbild 2026-08-30 15:50)
status: Done
assignee: []
created_date: '2026-08-30 13:56'
updated_date: '2026-08-30 14:45'
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
- [x] #1 Skuggan renderas som ul::after (Tailwind after:-varianter: content-[''], sticky, bottom-0, block, h-6, -mt-6, pointer-events-none, bg-linear-to-t from-(--mm-state-hover) to-transparent), bara när kanRulla; vidBotten via data-attribut på ul (data-[vid-botten]:after:hidden); contrast-more-varianten bevarad (h-1, bg-border-strong, ingen gradient); syskon-spannet, rannbredd-state/useLayoutEffect och testid lista-uttoning rivna; hookens kod byte-identisk (mat() räknar ul.children — pseudo-element ingår inte, bevisat med diff + mätning av låset 488)
- [x] #2 Mätt vid 1280 och 390 i ×3-crops av nedre högra hörnet vid scrollTop 0/12/24/60: ingen oskuggad kil — skuggan följer ul:ets klippkurva exakt; ::after computed width === ul.clientWidth === kortbredd (507/297), position sticky, height 24; vid maximal rullning är ::after dold; rännan 11 px kvar; li 124; ul.top === kort1.top; låset 488
- [x] #3 prefers-contrast: more (emulerat) visar en 4 px border-strong-list utan gradient; prefers-reduced-motion oförändrat (ingen animation); ingen ny fokus-/tabb-påverkan (pointer-events none, aria-hidden är irrelevant för pseudo-element)
- [x] #4 Alla assertioner som läste lista-uttoning (T176 visas/döljs, 309.43 skugga.right = kort.right, 309.45/46 skugga.bottom) omskrivna mot ::after (display/height/position via getComputedStyle(ul, '::after'); bredd via ul.clientWidth === kortbredd; underkant via ul.bottom) — aldrig mildrade, med isolerad negativ kontroll per ny assertion; docblocken (§ RULLNINGSSKUGGAN 'SKUGGAN LIGGER PÅ WRAPPERN, ALDRIG PÅ ul' → 'INUTI ul SOM ::after', rannbredd-styckena, 309.43/45/46-noterna) omskrivna; typecheck 0 · biome 0 · build grön · alla dokument-acceptance + a11y gröna
- [x] #5 Landat via review-grinden (ADR-105) och prod-verifierat read-only av orkestreraren (×3-crop i prod vid scroll): kilen borta
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #4 KLART.
ASSERTIONER OMSKRIVNA mot ::after via en delad matSkugga-hjalpare som laser getComputedStyle(ul, '::after'):
  T176 'uttoningen syns nar listan rullar'  -> content satt, display block, position sticky, bottom 0px, pointer-events none; data-vid-botten frånvarande; sex li kvar i barnrakningen (pseudo-elementet far INTE dyka upp dar); efter scroll till botten: attributet satt och display none (via expect.poll)
  T176 'exakt fyra rader bar INGEN uttoning' -> content 'none' (klass-strangen uteblir helt nar kanRulla ar falskt) och display inte block
  309.43 'skuggan slutar vid KORTETS hogerkant' -> bredden i stallet for hogerkanten: ::after width === kortbredd === ul.clientWidth, och rannan > 0 sa jamforelsen inte ar trivial. Samma fraga (Marcus: 'Skuggningen ska ju bara synas pa vita kortet'), besvarad dar svaret nu bor.
  309.45/46 'underkanterna sammanfaller' -> position sticky + bottom 0px. Underkanten ÄR ul:ets definitionsmassigt nar skuggan sitter inuti boxen; det som aterstar att prova ar att sticky faktiskt star kvar (en static hade lagt skuggan vid INNEHALLETS underkant, utanfor synfaltet under rullning).
  NYTT: contrast-more-testet (AC #3).
Testid lista-uttoning ar rivet; de tva kvarvarande omnamnandena i sviten ar HISTORIK i docblock.

SJU ISOLERADE NEGATIVA KONTROLLER, en bruten invariant per korning, ALLA FALLER:
  N1 after:sticky bort            -> 'sticky ar det som binder skuggans underkant till scrollportens'
  N2 vid-botten-slackningen bort  -> 'skuggan ska slackas nar man rullat hela vagen ner'
  N3 after:-mr-3 (bredd utover content-boxen) -> 'skuggan ar 519 px bred, kortet 507 px'
  N4 after:block bort             -> 'skuggan ska synas nar listan rullar'
  N5 contrast-more-hojden bort    -> 'en 4 px list, inte ett 24 px skrim'
  N6 contrast-more:bg-none bort   -> 'ingen gradient under prefers-contrast: more'
  N7 after: satt aven utan rullning -> 'utan content finns pseudo-elementet inte alls'

EN KONTROLL VÄNDE EN SLUTSATS. N4 var forst definierad som 'ta bort after:content-[]' och blev GRON. Diagnosen blev en probe i riggen: Tailwind v4:s after:-variant injicerar SJALV content: var(--tw-content) med tom strang som default — ett element med bara after:block rapporterar redan content '""'; utan NAGON after:-klass rapporteras 'none'. Foljder, bada bokforda: (a) assertionerna prover nu content OCH display, eftersom ingen av dem racker ensam, och (b) after:content-[] ar redundant i kallan men star kvar MED AVSIKT, med matningen i kommentaren, sa ingen river den som dod kod. N4 omdefinierades till att ta bort after:block — en mutation med faktisk effekt — och faller nu korrekt.

DOCBLOCK omskrivna: § RULLNINGSSKUGGAN (hela avsnittet — de tva kurvorna, varfor en border-radie inte gar att halla i synk utifran, bredden som strukturell, och att hojdlasets skal ar UPPFYLLT och inte overgivet), rannbredd-styckena rivna med koden, 309.43/45/46-noterna om right: rannbredd och bottom-0 omskrivna till historik.

GRINDAR, matta exitkoder var for sig: typecheck 0 - biome 0 - build 0 - check-langa-streck 0 (267 filer) - a11y 117 passed 0 - dokument-acceptance 110 passed 0 (var 108 fore skivan, +2 nya).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat via review-grinden: PR #2136 (fd651f10, tre commits), runda 1 risk låg, två info (exakt breddjämförelse utan tolerans-not; självrapporterat +2 tester var +1), loop konvergerad, backstopp exit 0, merge-kö → main 055bc8a7 2026-08-30 14:42 UTC; Vercel production READY 14:43. Orkestrerarens 5173-mätning före granskningen: ::after content '' · display block · sticky · bottom 0 · height 24 · width 507 = ul.clientWidth = kortbredd; ×3-crops vid scrollTop 12/24: kilen borta (jämfört mot bas-crops med kilen). Prod-verifierat read-only (smoke-kontot, bundle index-C_X-ps1F.css): CSS bär data-vid-botten-selektorn och after:sticky; inget lista-uttoning-spann; eventet RIM 1 Rönninge hade vid kontrollen FEM bilagor så skuggan renderas skarpt i prod (overflow auto, ::after block, clientHeight 488, ul.top === kort1.top). Hooken byte-identisk (md5 eb5a28bb…). Tailwind-fynd bokfört i docblock: after:-varianten injicerar content själv.
<!-- SECTION:FINAL_SUMMARY:END -->
