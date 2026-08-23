---
id: TASK-299.11
title: >-
  Skiva: Promovering av sidram till aktivitetshistoriken och dokumentytan — de
  två avvikande dialekt-ytorna
status: To Do
assignee: []
created_date: '2026-08-22 22:46'
updated_date: '2026-08-23 19:23'
labels:
  - ready-for-agent
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 557000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Täckningslucka upptäckt 2026-08-22: skivorna under TASK-299 skars 19:26, FÖRE Marcus omfattningsbeslut, och täcker Mer-familjens fem sidor. PRD:n nämner de två ytor som i dag bär den ANDRA dialekten endast villkorat — 'BERÖRS endast om den bredaste omfattningen väljs'. Marcus valde full omfattning ('jag tycker vi ska köra full omfattning', 2026-08-22), så de är inne, men ingen skiva täckte dem.

YTORNA, namngivna i PRD:ns manifest-lista:
- Aktivitetshistorik-sidan — tasks/sessions/bilagor/s106-aktivitetslogg/facit.json, 2 bilder
- Dokumentytan /mer/anmalningar systeryta /mer/dokument — tasks/sessions/bilagor/s102-dokument-konvergens/facit.json, 5 bilder

BÅDA ÄR FACIT-STÄMPLADE. Det skiljer denna skiva från 299.7/8/9, vars ytor saknar stämpel: här krävs facit-amendering med Marcus citat i EGEN commit, skild från formändringen (ADR-102/103).

OMFATTNINGEN ÄR LÅST OCH SKA INTE TOLKAS OM: full omfattning på ytaxeln, bara SIDKROMET på ägandeskapsaxeln (chevron + kortyta). Rubriken lever kvar i varje sida. SidRam-primitivens rubrik-ägande gren byggs INTE in. Källa: TASK-299 § OMFATTNINGEN LÅST.

BÅDA YTORNA BÄR REDAN DEV-VÄXELN ?sidram=ny från TASK-299.1 (import.meta.env.DEV-grindad, ADR-074 amendering 7-formen). Promoveringen innebär att den valda formen blir permanent och att växeln rivs på just dessa ytor — ADR-103:s promoveringskontrakt: det som rivs efter godkännande är flaggor och växlar, aldrig formen.

MARCUS UNDANTAGSREGEL GÄLLER: 'Ser vi något som inte funkar sedan så är det ju bara att göra ett undantag på den sidan.' Fungerar sidkromet inte på en av dessa två ytor är rätt svar ett lokalt undantag med bokfört skäl — inte att riva den delade formen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Aktivitetshistorik-sidan bär den delade sidramen i sidkrom-omfattning; dess tidigare dialekt är borta
- [x] #2 Dokumentytan bär den delade sidramen i sidkrom-omfattning; dess tidigare dialekt är borta
- [x] #3 Dev-växeln ?sidram=ny är riven på BÅDA dessa ytor — formen står kvar utan flagga (ADR-103)
- [x] #4 Rubrikblocket ägs fortfarande av varje sida; SidRams rubrik-ägande gren är oanvänd
- [x] #5 Båda ytornas facit-manifest amenderade med daterad post och Marcus citat, i EGEN commit skild från formändringen
- [ ] #6 check-facit grön; ingen yta lämnas med ett manifest som beskriver en form den inte längre bär
- [x] #7 Inget lokalt undantag infört utan bokfört skäl i kortet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-23 — Form + verifiering klar. AC #1-4 och #7 avbockade (delad SidRam-primitiv i sidkrom-omfattning på båda ytorna, dev-växeln ?sidram=ny riven, rubrikblocket kvar per sida, inget lokalt undantag behövt). Mätt boundingBox() före/efter (1280px acceptance-vy): chevron/h1 låg redan vid x=372; filterrad/dagsgrupp-lista (aktivitetshistorik) och grupp-kort (dokumentytan) låg vid x=356 (16 px missalignment, TASK-299.2s fynd). Efter fix: samtliga block vid x=372 på båda ytorna — samma resultat som väntelistans redan promoverade form.

AC #5/#6 MEDVETET EJ AVBOCKADE. Facit-amendering skriven i EGEN commit (klass (c) — formen ändras faktiskt, prod-synligt, TASK-299.2-mätningen som stöd) för båda ytorna: tasks/sessions/bilagor/s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md och tasks/sessions/bilagor/s102-dokument-konvergens/AMENDERING-2026-08-23-sidram-promovering.md, båda med Marcus-citat (TASK-299.2 omfattningsvalet, TASK-299 beslut 3). godkand-fältet i BÅDA facit.json är ORÖRT (ADR-104-hooken fryser ett stämplat manifest i sin helhet) — omstämpling väntar Marcus egen --ersatt-kanal. check-facit.sh är grönt (exit 0, 12 manifest/27 ytor/0 ogodkända) eftersom grinden inte kräver omstämpling för att släppa igenom en sidofils-amendering — men "ingen yta lämnas med ett manifest som beskriver en form den inte längre bär" är bara delvis sant tills omstämplingen sker (facit-bilderna visar fortfarande gamla chevron-positionen; sidofilen bokför explicit att de är en generation bakom).

Nya visuella baslinje-specar (föds i CI, inte lokalt): tests/visual/aktivitetshistorik-visual.spec.ts + tests/visual/dokument-visual.spec.ts.

STÄNGNINGSPASS 2026-08-23 (S111). KORTET LÄMNAS ÖPPET — AC #6 kan inte bockas ärligt. Uppdraget till detta pass sade 'DoD + Done' för denna skiva; det är en DIVERGENS mot faktiskt kortläge och bokförs här i stället för att byggas vidare på.

AC #5 BOCKAD — kriteriet är uppfyllt och var buntat med #6 av byggpasset. Verifierat på disk i detta pass mot main (e1470eb0): båda sidofilerna finns —
  tasks/sessions/bilagor/s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md
  tasks/sessions/bilagor/s102-dokument-konvergens/AMENDERING-2026-08-23-sidram-promovering.md
båda daterade 2026-08-23, båda bärande Marcus citat (omfattningsvalet 'jag tycker vi ska köra full omfattning' + ägandeskapsaxelns 'Jag står vid dina rekommendationer på alla punkter'), och båda i EGEN commit (6d14fe52) skild från formändringen. Kriteriets ordalydelse är därmed uppfylld i alla sina led.

AC #6 EJ BOCKAD — halva kriteriet håller, halva gör det inte:
  · 'check-facit grön' HÅLLER: `bash scripts/check-facit.sh` exit 0 i detta pass — 13 manifest, 28 ytor, 0 ogodkända.
  · 'ingen yta lämnas med ett manifest som beskriver en form den inte längre bär' HÅLLER INTE. Mätt: s106-aktivitetslogg/facit.json bär godkand datum 2026-08-15 (citat 'Godkänd mot facit 2026-08-15', sha 871ae4f4) och s102-dokument-konvergens/facit.json bär godkand datum 2026-08-16 (citat 'godkänner', sha cc1d7c53) — båda alltså stämplade FÖRE denna skivas formändring, och ingen omstämpling har skett. Sidofilen för s106 skriver själv ut varför: facit-bilderna 'visar fortfarande den GAMLA chevron-positionen ... och den gamla, ojämna vänstermarginalen. De blir därmed EN GENERATION BAKOM den promoverade formen'. Amenderingen är klass (c) — formen ändras faktiskt, prod-synligt (16 px marginalflytt för filterrad, dagsgruppskort, tomlägen och Ladda fler).
  · KONTRASTEN MOT TASK-299.6, som är saklig och inte en inkonsekvens: 299.6:s ytor (persondetalj, check-in) var klass (b) — de var REDAN kant-i-kant, formen ändrades inte, och 34/34 promoveringsgrindar gröna mot ORÖRDA ariaSnapshot-referenser bevisar det. Deras manifest beskriver alltså fortfarande den form ytan bär. Denna skivas två ytor gör det inte.
  · VAD SOM ÅTERSTÅR: Marcus omstämpling via sin egen kanal (npm run facit:godkann --ersatt, ADR-104) på omtagna bilder — samma väg s111-anmalningssidan-manifestet gick 2026-08-23 (commit 33645735, omstämplat till citat 'Ser bra ut', sha cb7ad681). Det är en HITL-handling som ingen agent kan utföra: ADR-104-hooken (scripts/deny-facit-godkand-skrivning.sh) fryser ett stämplat manifest för varje agent-skrivning.

DoD #1 EJ BOCKAD som följd — 'Alla acceptanskriterier avbockade' är falskt så länge AC #6 står öppen. Kortet står därför kvar To Do.
DoD #2 BOCKAD — byggpassets grindar gröna; check-facit exit 0 ommätt i detta pass.
DoD #3 BOCKAD — CI GRÖN PER JOBB: PR #1871, merge-commit 5fd71a82 på main. `gh pr checks 1871` mätt 2026-08-23: 15 rollup-poster, NOLL fail (Lint + Audit + TypeCheck pass 2m16s, Acceptance hermetisk pass 7m46s, Acceptance tvåsidigt bevis pass 8m17s, Pure + Build pass, Webblasarbeteende pass, Docs link check pass, CodeQL/Analyze pass, Vercel pass; A11y/Staging skipping per CI:s diff-gating).
DoD #4 BOCKAD — path-scopad add rapporterad av byggpasset; formändringen och facit-amenderingen ligger i skilda commits (kravet i AC #5/DoD-familjen).
<!-- SECTION:NOTES:END -->
