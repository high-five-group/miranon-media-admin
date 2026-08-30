---
id: TASK-309.46
title: >-
  Fynd: rullningslistens spår börjar 8 px ovanför första kortet — rännan blir en
  transparent border-bottom på raden så låset exkluderar fjärde radens ränna
  (Marcus prod-titt 2026-08-30)
status: In Progress
assignee: []
created_date: '2026-08-30 10:09'
updated_date: '2026-08-30 10:28'
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
- [ ] #1 li bär rännan som border-b-8 border-transparent (ingen pt-2), wrappern saknar -mt-2; mätt vid 1280 och 390: ul.top === kort1.top, ul.bottom === kort4.bottom === skuggans bottom (låst höjd 488), li 124 uniform, 8 px mellan korten, tray-luft 8 px runtom (+1 px kant); rullningslistens spår börjar vid första kortets överkant (×3-crop av övre högra hörnet med synlig scrollbar) och slutar vid fjärde kortets underkant
- [ ] #2 Låset är 488 i ALLA nivåer: 0 rader (NIVÅ 3, LISTA_FALLBACK_RADHOJD = 122 × 4), 1–3 rader (NIVÅ 2, radhöjd × 4 − separator), 4+ (NIVÅ 1, spann − fjärde radens separator) — mätt i fixturvärlden för 0, 1, 3, 4 och 6 rader, och för övergången rader → 0 rader (NIVÅ 2 lagrar separator-fritt: hookens enda kodändring, bokförd öppet med skälet ur dess eget docblock)
- [ ] #3 Mitt i rullning (scrollTop 60) klipps kortet med kortets radie och skuggans hörn sammanfaller; vid maximal rullning slutar sista kortet 8 px ovanför spårets slut (bokförd kant, inte fel) och skuggan är borta; skugga.right = kort.right kvar; rännan 11 px kvar i båda overflow-lägena
- [ ] #4 Docblocken (LISTA_FALLBACK_RADHOJD, useLastaListhojd § NIVÅ 2/3, DokumentListRam wrapper + skugga, DokumentLista:s li-kommentar, GRUPPKORT_KLASS § rännan, 309.45-styckena om pt-2/-mt-2) omskrivna mot border-formen; lessons-fragmentet rannan-bor-i-li-… får en not (rännan är fortfarande INUTI li, som border); befintliga assertioner uppdaterade där de kodade 496/pt-2 (aldrig mildrade); typecheck 0 · biome 0 · build grön · alla dokument-acceptance + a11y gröna
- [ ] #5 Landat via review-grinden (ADR-105) och prod-verifierat read-only av orkestreraren: spåret börjar vid kortet, låset 488, ⋯/meny-fixarna från 309.45 intakta
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
