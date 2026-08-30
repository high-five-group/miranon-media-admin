---
id: TASK-309.46
title: >-
  Fynd: rullningslistens spår börjar 8 px ovanför första kortet — rännan blir en
  transparent border-bottom på raden så låset exkluderar fjärde radens ränna
  (Marcus prod-titt 2026-08-30)
status: Done
assignee: []
created_date: '2026-08-30 10:09'
updated_date: '2026-08-30 11:26'
labels: []
dependencies: []
parent_task_id: TASK-309
ordinal: 635000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-titt 2026-08-30 ~10:20 UTC: 'scrollbaren … börjar för högt upp, den bör ju börja vid kortet precis'. Mätt av orkestreraren i prod (fe3b2b9f, Chromium + WebKit): ul.top 303, kort1.top 311 — spåret (ul:s padding-box) börjar 8 px ovanför första kortet eftersom rännan sedan 309.45 ligger som pt-2 INUTI varje li, alltså även ovanför första kortet, och wrapperns -mt-2 drar upp ul:et till behållarens innerkant. Ett spår som spänner exakt kort1.top → kort4.bottom kräver att INGEN ränna ligger inuti ul:ets padding-box vare sig ovanför första eller nedanför fjärde kortet — och hooken useLastaListhojd är REDAN byggd för exakt den geometrin: separatorBredd(rad) läser border-bottom-width, NIVÅ 1 låser spannet rad1.top → rad4.bottom MINUS fjärde radens border-bottom, NIVÅ 2 låser radhöjd × 4 − radens separator. Rännan flyttas därför från padding (pt-2) till en TRANSPARENT border-bottom på varje li (border-b-8 border-transparent, 8 px = samma ränna): li-höjden förblir 124 (116 + 8), låset blir 488 = kort1.top → kort4.bottom, ul:ets padding-box = spåret = exakt korten, wrapperns -mt-2 rivs (ingen ledande ränna att neutralisera), skuggan bottom-0 och rounded-2xl-klippningen står kvar oförändrade. Kvarvarande, bokförd kant: vid maximal rullning (≥5 kort) ligger sista radens transparenta ränna (8 px) inuti det rullbara innehållet, så sista kortet slutar 8 px ovanför spårets slut i det läget — normal 'bottom padding' i en rullningsvy, och skuggan är då borta. Hookens latenta separator-fel rättas i samma drag (1 rad): NIVÅ 2 lagrar i dag radhojd MED separator i senastUppmattRadhojd trots att docblocket säger 'separator-fri' (NIVÅ 1 lagrar spann/4 = 122) — med 1 px-separatorn syntes det aldrig, med 8 px ger det 496 i stället för 488 om listan går från rader till noll rader; lagra (radhojd × 4 − radensSeparator) / 4. LISTA_FALLBACK_RADHOJD blir 122 = (4 × 124 − 8) / 4 med docblock (separator-fri per-rad-höjd, samma tal NIVÅ 1 lagrar) så tomläget (NIVÅ 3) också ger 488.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 li bär rännan som border-b-8 border-transparent (ingen pt-2), wrappern saknar -mt-2; mätt vid 1280 och 390: ul.top === kort1.top, ul.bottom === kort4.bottom === skuggans bottom (låst höjd 488), li 124 uniform, 8 px mellan korten, tray-luft 8 px runtom (+1 px kant); rullningslistens spår börjar vid första kortets överkant (×3-crop av övre högra hörnet med synlig scrollbar) och slutar vid fjärde kortets underkant
- [x] #2 Låset är 488 i ALLA nivåer: 0 rader (NIVÅ 3, LISTA_FALLBACK_RADHOJD = 122 × 4), 1–3 rader (NIVÅ 2, radhöjd × 4 − separator), 4+ (NIVÅ 1, spann − fjärde radens separator) — mätt i fixturvärlden för 0, 1, 3, 4 och 6 rader, och för övergången rader → 0 rader (NIVÅ 2 lagrar separator-fritt: hookens enda kodändring, bokförd öppet med skälet ur dess eget docblock)
- [x] #3 Mitt i rullning (scrollTop 60) klipps kortet med kortets radie och skuggans hörn sammanfaller; vid maximal rullning slutar sista kortet 8 px ovanför spårets slut (bokförd kant, inte fel) och skuggan är borta; skugga.right = kort.right kvar; rännan 11 px kvar i båda overflow-lägena
- [x] #4 Docblocken (LISTA_FALLBACK_RADHOJD, useLastaListhojd § NIVÅ 2/3, DokumentListRam wrapper + skugga, DokumentLista:s li-kommentar, GRUPPKORT_KLASS § rännan, 309.45-styckena om pt-2/-mt-2) omskrivna mot border-formen; lessons-fragmentet rannan-bor-i-li-… får en not (rännan är fortfarande INUTI li, som border); befintliga assertioner uppdaterade där de kodade 496/pt-2 (aldrig mildrade); typecheck 0 · biome 0 · build grön · alla dokument-acceptance + a11y gröna
- [x] #5 Landat via review-grinden (ADR-105) och prod-verifierat read-only av orkestreraren: spåret börjar vid kortet, låset 488, ⋯/meny-fixarna från 309.45 intakta
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #4 KLAR. DOCBLOCK omskrivna mot border-formen — alla kvarvarande pt-2/-mt-2-omnamnanden ar HISTORIK ('Formen var...', 'Har stod...', flytt-historiken), verifierat med grep:
  LISTA_FALLBACK_RADHOJD  — 124 -> 122 med varningen mot att skriva tillbaka li-hojden
  useLastaListhojd NIVA 2/3 — det latenta separator-felet utskrivet: prosan beskrev ett kontrakt bara den ena av tva skribenter holl
  DokumentListRam wrapper — hela boxmodell-resonemanget, det avvisade last:border-b-0 med sin 464-rakning, den kanda kanten vid maxrullning, och flytt-historiken py-1 -> pt-2 -> border-b-8 med vad var steg loste och lamnade kvar
  DokumentListRam skuggan — bottom-0 refererar nu bordern, inte pt-2
  DokumentLista li-kommentar — border vs padding (pt-2/pb-2), och varfor ALLA rader bar sin ranna
  GemensamtLage li-kommentar — pekare
  GRUPPKORT_KLASS — rannan som border, ingen wrapper-kompensation
  hookens tva ovriga pt-2-omnamnanden
LESSONS-FRAGMENTET rannan-bor-i-li-nar-hojdlaset-mater-rader.md: not tillagd — rannan ar fortfarande INUTI li, som border, och regeln skarps ('avstandet ska ligga inuti det som MATS, men i den box som stammer med vad det ska AVGRANSA'). Plus foljdlardomen om prosa: en latent avvikelse mellan docblock och kod skalas upp av nasta andring.

TESTER uppdaterade dar de kodade den gamla formen, aldrig mildrade:
  FALLBACK_RADHOJD 124 -> 122 (bada hojdlas-sviterna, med docblock)
  ny RANNA = 8 (duplicerad medvetet i bada sviterna, med skalet)
  atta maxRadhojd x 4-assertioner far sitt rann-avdrag
  rackviddsvalets fyraRader-referens far samma avdrag (matt: 488 mot 496 utan)
  toleransen FALLBACK x 4 + 8 -> + TOLERANS (2) — skarpt PA en negativ kontroll, se nedan
  ny assertion ul.top === kort1.top + liPaddingTop 0px + liBorderBottom > 0
  nytt overgangstest 1 rad -> 0 rader via riktig radering
  fyra-raders-invarianten omformulerad (provaExaktFyraRader, se AC #3)

SEX ISOLERADE NEGATIVA KONTROLLER, en bruten invariant per korning:
  N1 border-b-8 -> pt-2        FALLDE  'sparet borjar vid 311 px, forsta kortet vid 319 px'
  N2 pt-2 OVANPA bordern       FALLDE  samma assertion
  N3 border-b-8 -> border-b-0  FALLDE  toBeGreaterThan (liBorderBottom)
  N4 hook-raden aterstalld     FALLDE  'laset andrades vid overgangen till tomt lage: 488 -> 496'
  N5 border-b-8 -> border-b-4  FALLDE  'overmattet ska vara EXAKT fjarde radens transparenta ranna — matt 480 - 476'
  N6 FALLBACK -> 124           GRON forst (!), FALLDE efter skarpningen
N6 FANGADE EN FOR VID TOLERANS — precis det kontrollerna finns for. Bandet 'FALLBACK x 4 + 8' svalde felsvaret 496, eftersom det narmaste felet ar exakt en ranna. TOLERANS = 2 utesluter det och racker for sub-pixel (ul saknar kant, hojden ar exakt 488 vid bada bredder).

GRINDAR, matta exitkoder: typecheck 0 - biome 0 - build 0 - check-langa-streck 0 (267 filer) - npm run test:a11y 117 passed exit 0 - npm run test:acceptance -- dokument 109 passed exit 0 (var 107 fore skivan, +2 nya).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat via review-grinden: PR #2134 (7a00e78c, tre commits), runda 1 risk låg 0 fynd (granskaren räknade om hookens tre nivåer rad för rad och körde långa-streck-grinden oberoende), loop konvergerad, backstopp exit 0, merge-kö → main 01c84076 2026-08-30 11:11 UTC; Vercel production READY 11:11:41. Prod-verifierat read-only (smoke-kontot, event + delade, bundle index-CPs34une.css): ul.top === kort1.top (311/311), clientHeight 488, li 124 med border-bottom 8, 8 px mellan korten, ränna 11, ul radius 16. Orkestrerarens 5173-mätning före granskningen: 311/311 · 279/279 · 331/331, ul.bottom === kort4.bottom === skugga.bottom, tray 9/9/9, tummen startar i nivå med kortets övre hörn (×3-crop). RATIFICERAT under Marcus mandat: 309.24 AC #5:s bokstav (scrollHeight === clientHeight vid exakt fyra rader) ersatt av tre starkare assertioner (overflow hidden, scrollHeight − clientHeight === rännan, kortkanterna) — Marcus informerad, öppet i Del 9. Bokförd kant: vid maxscroll slutar sista kortet 8 px ovanför spårets slut. Sidofynd under prod-kontrollen: en curl-loop mot sajten utlöste Vercels Security Checkpoint för IP:n (fragment skrivet).
<!-- SECTION:FINAL_SUMMARY:END -->
