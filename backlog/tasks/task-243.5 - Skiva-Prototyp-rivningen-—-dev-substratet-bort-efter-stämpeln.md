---
id: TASK-243.5
title: 'Skiva: Prototyp-rivningen — dev-substratet bort efter stämpeln'
status: Done
assignee: []
created_date: '2026-08-16 14:39'
updated_date: '2026-08-24 15:44'
labels:
  - ready-for-agent
dependencies:
  - TASK-243.4
  - TASK-241.7
parent_task_id: TASK-243
ordinal: 451000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototyp-substratet har gjort sitt jobb när stämpeln sitter: dev-routen med varianterna och switcher-railen rivs mekaniskt. Rivningen grindas HÅRT av Marcus stämpel — startas kortet utan godkand-stämpel i facit-manifestet är det fel läge och arbetet avbryts. OBS: svep-prototypen (task-241.1) kan vid rivningstillfället bo i EGEN katalog (src/components/dev/svep-prototyp/) — den rörs INTE av denna rivning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dev-routen /dev/hem-prototyp, varianterna (VariantRo/VariantKontroll/VariantBento), PrototypeSwitcher-railen och prototypkatalogen src/components/dev/hem-prototyp/ rivna — B3-spärren (ADR-102) är släppt av stämpeln i task-243.4, vilket verifieras FÖRE rivning (godkand != null i facit-manifestet)
- [x] #2 Det som rivs är flaggor, växlar och prototyp-substrat — ALDRIG formen (ADR-103); den promoverade skarpa ytan är orörd av rivningen
- [x] #3 task-226 (hem-prototypen) flippas Done via backlog-CLI:t i samma landning (relationen avgjord vid skivningen per PRD:ns not)
- [x] #4 Inga döda referenser: typecheck, lint och build gröna; inga kvarvarande imports mot den rivna katalogen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-243.5 — RIVNINGEN EJ UTFÖRD. BLOCKERAD AV EN LEVANDE IMPORT UR SVEP-PROTOTYPENS ROUTE (bygg-agent, Opus 5, 2026-08-17). Ingen kod ändrad i detta pass.

STÄMPELN VERIFIERAD FÖRE ALLT ANNAT (AC #1:s förvillkor, ADR-102 B3/B4). tasks/sessions/bilagor/s102-hem-konvergens/facit.json bär "godkand": av marcus, datum 2026-08-17, sha 8044e5b655dad5b3a12a4eba7fe682f88705f8e4, citat "Hem-vyn ser bra ut, precis som prototypen." B3-spärren är alltså SLÄPPT för hem-manifestet — rivningen är tillåten ur ADR-102:s hänsyn, den stoppas av en teknisk beroendekedja. Filen låg på grenen docs/s102-hem-stampel (commit 1be7fe07, PR #1516 armerad av marcus803 2026-08-17T09:38:11Z, mergeStateStatus BLOCKED vid mätningen); origin/main stod på 8044e5b6. bash scripts/check-facit.sh exit 0: "10 manifest, 22 ytor deklarerade, 0 ogodkända (prototyp-substratet skyddat)" — dvs B3-spärren är för närvarande INAKTIV eftersom inget manifest längre har godkand: null.

BLOCKERINGEN ÄR MÄTT, INTE RESONERAD. src/routes/dev/svep-prototyp.tsx rad 6-7 importerar demoUniversum och VariantRo ur src/components/dev/hem-prototyp/. Probe körd (katalogen src/components/dev/hem-prototyp/ + src/routes/dev/hem-prototyp.tsx temporärt undanflyttade till scratchpad, npm run typecheck, därefter återställda; git status --short tom och npm run typecheck exit 0 efter återställningen):

  npm run typecheck -> exit 1
  src/routes/dev/svep-prototyp.tsx(6,31): error TS2307: Cannot find module '@/components/dev/hem-prototyp/demoData' or its corresponding type declarations.
  src/routes/dev/svep-prototyp.tsx(7,27): error TS2307: Cannot find module '@/components/dev/hem-prototyp/VariantRo' or its corresponding type declarations.

Exakt två fel, båda i svep-routen. AC #1 (hela prototypkatalogen riven) och AC #4 (typecheck/lint/build gröna, inga döda referenser) kan därför inte hållas samtidigt utan att svep-prototypen rörs — vilket kortets egen beskrivning uttryckligen förbjuder.

ORDNINGSBEROENDET ÄR REDAN BOKFÖRT I REPOT PÅ TRE STÄLLEN. Kortets not ("svep-prototypen ... bor i EGEN katalog ... den rörs INTE av denna rivning") beskriver KATALOGEN korrekt — src/components/dev/svep-prototyp/ har noll imports mot hem-prototyp — men missar ROUTEN src/routes/dev/svep-prototyp.tsx, som ligger utanför den katalogen.

  1. task-241.7 AC #1, verbatim: "Dev-routen /dev/svep-prototyp och katalogen src/components/dev/svep-prototyp/ rivna; import-beroendena mot hem-prototypkatalogen (VariantRo, demoUniversum, InitialAvatar-bokföringen i 241.1-notes) därmed borta — 243.5 avblockeras från svep-hållet".
  2. task-241.1 Implementation Notes, § RIVNINGSBEROENDE: "Nar katalogen rivs maste importen pekas om -- antingen mot den da-skarpa /hem-vyn eller mot en frusen egen kopia om svepytan fortfarande ar i prototypform."
  3. src/routes/dev/svep-prototyp.tsx rad 37-39 (docblock): "RIVNINGSBEROENDE, bokfört i kortets notes: när task-243.5 river components/dev/hem-prototyp/ måste denna import pekas om."

Den bokförda ordningen är alltså 241.7 FÖRE 243.5. Faktiskt läge: 241.7 är To Do med Dependencies TASK-241.6 (QA-vandringen, To Do). 243.5 bär idag endast Dependencies TASK-243.4.

TVÅ AV 241.1:s TRE BOKFÖRDA BEROENDEN ÄR REDAN BORTA. Adresslista.tsx importerar inte längre InitialAvatar ur hem-prototyp/ui.tsx — 241.1 konvergensvarv 2 rev den ("InitialAvatar borttagen ... ETT RIVNINGSBEROENDE FARRE infor task-243.5"). Grep över src/ och tests/ ger noll faktiska imports mot hem-prototyp/ui.tsx; de fem kvarvarande träffarna på strängen är docblock-källhänvisningar i promoverade skarpa filer. Kvar är exakt de två import-raderna ovan.

BEROENDEKARTA, GREP-VERIFIERAD. Rivbart utan att röra svep-prototypen: src/routes/dev/hem-prototyp.tsx, VariantKontroll.tsx, VariantBento.tsx (3 av 8 filer). Hålls vid liv av svep-routen via VariantRo: VariantRo.tsx -> data.ts, demoData.ts, types.ts, ui.tsx (5 av 8). En halv rivning bockar inte AC #1 och landades därför inte.

VARFÖR INGEN DELMÄNGD LANDADES. B2-defekten (badge/375px, byte-identisk mellan skarp yta och prototyp) är ett ÖPPET Marcus-beslut med två möjliga utfall — amendera facit eller kräv fix — och rivning som omöjliggör endera vägen är förbjuden. Att riva /dev/hem-prototyp-routen tar bort den körbara referens ADR-102 B1 gör auktoritativ ("prototypen ÄR facit") medan det beslutet står öppet. Samma princip som 241.7 formulerar för sin egen yta: "prototypen står kvar som körbar referens tills Marcus QA-vandring är klar".

VÄG-BESLUT SOM KRÄVS (orkestrerare/Marcus — ej agentens att fatta):
  (a) Kör 241.6 + 241.7 först. Beroendet försvinner av sig självt och 243.5 blir mekanisk. Kräver att 243.5 får Dependencies TASK-241.7.
  (b) Peka om svep-routens bakgrund nu, ur 241.1:s egen optionsrymd (skarpa /hem-vyn eller en frusen egen kopia). Ändrar en facit-låst, Marcus-godkänd prototyp (s102-svep-konvergens, godkand av marcus, sha 10dff531) vars byggskivor 241.2-241.6 fortfarande byggs mot facit-bilderna — en ADR-102 B1/B2-fråga, inte en agentfråga.
  (c) Riv delmängden (routen + VariantKontroll + VariantBento) nu, resten i 241.7. Kräver att AC #1 skrivs om OCH att B2-vägen bedöms tåla att den körbara prototypen försvinner. B3-markören "V1 Lugna morgonen (ro)" (enda hemvist i src/: src/routes/dev/hem-prototyp.tsx rad 49) måste då städas ur .facit-policy.conf FACIT_PROTO_MARKORER i SAMMA landning, per TASK-192-regeln — annars blir den en död, fällande markör så snart nästa ogodkända manifest dyker upp.

AC-STATUS VID PASSETS SLUT — inget kriterium bockat:
  #1 EJ UPPFYLLD — blockerad, mätt ovan (typecheck exit 1, två TS2307).
  #2 EJ TILLÄMPLIG — ingenting revs; den promoverade skarpa ytan är orörd per definition (noll filer ändrade).
  #3 EJ UTFÖRD — task-226 bär egen not "Kortet stängs av orkestreraren efter CI-verifikat — INTE av bygg-agenten"; 226 står In Progress med DoD #3 (CI grön per jobb) obockad. Kriteriets text ("flippas Done ... i samma landning") står i konflikt med 226:s egen not; konflikten lämnas åt orkestreraren.
  #4 EJ TILLÄMPLIG — ingen diff.

GRINDUTFALL I PASSET: bash scripts/check-facit.sh exit 0 (baseline, oförändrat träd). npm run typecheck exit 0 (oförändrat träd, efter probe-återställning). npm run typecheck exit 1 (probe, avsiktligt — beviset ovan). Övriga DoD-grindar ej körda: ingen fil ändrad, ingenting att verifiera.

PREMISS-PASS 2026-08-24 (S112 fix-våg 1, modell Sonnet 5). Uppdragets kärnpåstående — att svep-routens import mot hem-prototyp-katalogen är HÄVD via PR #1912 (TASK-241.7) — prövat mot faktiskt tillstånd och FALSIFIERAT som fakta-om-main, om än korrekt som fakta-om-en-öppen-PR. git fetch + grep bekräftar: src/routes/dev/svep-prototyp.tsx finns fortfarande i origin/main (6d62c0ce, fetchad 2026-08-24T14:0x UTC) och importerar fortsatt @/components/dev/hem-prototyp/demoData (rad 6) + .../VariantRo (rad 7) — inga docblock-kommentarer, äkta ES-imports. PR #1912 (feat(TASK-241.7): riv svep-prototypens substrat efter QA-godkännande, gren feat/task-241-7-svep-substrat-prototypriving) river faktiskt exakt dessa filer (diff-stat mot origin/main: 8 filer, -1081/+37, inklusive hela src/components/dev/svep-prototyp/ + src/routes/dev/svep-prototyp.tsx) men var vid mätningen OPEN, mergeStateStatus BLOCKED, mergedAt null — INTE landad i main. autoMergeRequest ÄR satt (enabledBy marcus803, 2026-08-24T14:05:46Z) — armerad, väntar på att Acceptance-jobben (IN_PROGRESS vid mätningen) blir gröna och kön processar den. TASK-241.7 (243.5:s eget Dependencies-fält) står fortsatt To Do. Blockeringen är alltså IDENTISK med 2026-08-17-passets fynd (samma två TS2307-rader), omprövad och bekräftad ännu kvarstående 2026-08-24. Ingen kod ändrad; inget vägval fattat — path (a) var redan vald och är under exekvering via PR #1912, path (b)/(c)/(d) därmed ej aktuella. Bifynd: task-226 är sedan 2026-08-20 redan Status Done (ej gjort av detta pass) — löser AC #3:s sakinnehåll, om än inte bokstavligen 'i samma landning' som kriterietexten kräver; ingen vidare åtgärd bedöms nödvändig där. REKOMMENDATION: re-dispatch detta kort så snart PR #1912 landat i main (gh pr view 1912 --json mergedAt) — rivningen blir då mekanisk enligt 241.7-mönstret, exakt som uppdraget förutsåg.

RIVNING UTFÖRD 2026-08-24 (S112 RE-DISPATCH, modell Sonnet 5). Premiss-pass FÖRE bygge: git fetch origin bekräftade PR #1912 (TASK-241.7) mergad (098dcd24, merge-commit i origin/main-loggen) — src/routes/dev/svep-prototyp.tsx + src/components/dev/svep-prototyp/ borta, den tidigare blockerande importen mot hem-prototyp-katalogen finns inte längre. grep -rn "hem-prototyp" src/ mot origin/main visade endast interna self-referenser (routen importerar sina egna VariantBento/Kontroll/Ro-syskon) plus docblock-citat i redan-promoverade filer — noll EXTERNA äkta imports. B3-spärren verifierad släppt FÖRE rivning: tasks/sessions/bilagor/s102-hem-konvergens/facit.json bär "godkand" (av marcus, 2026-08-17, sha 8044e5b655dad5b3a12a4eba7fe682f88705f8e4, citat "Hem-vyn ser bra ut, precis som prototypen.").

RIVET (git rm, 8 filer): src/routes/dev/hem-prototyp.tsx, src/components/dev/hem-prototyp/{VariantRo,VariantKontroll,VariantBento}.tsx, {data,demoData,types}.ts, ui.tsx. PrototypeSwitcher.tsx SJÄLV rörd EJ — den är delad ADR-074-stående infrastruktur som fortsatt konsumeras av tre andra prototyper (dev/prototyper.tsx, dev/auth-prototyp.tsx, _authenticated/mer/dokument.tsx); endast MONTERINGEN i hem-prototyp.tsx försvann med filen.

.facit-policy.conf: markören "V1 Lugna morgonen (ro)" avregistrerad ur FACIT_PROTO_MARKORER + daterad removal-not tillagd (TASK-243.5-mönster, mirror av TASK-241.7/TASK-299.5). check-facit.sh exit 0 både före och efter, rivna hem-konvergens-källor korrekt rapporterade under invariant (b):s rivnings-klausul.

GRINDAR (alla i förgrunden, exitkod läst separat från fil, ingen pipe): check-facit.sh exit 0 · typecheck (tsr generate && tsc -b) exit 0 · biome check exit 0 (9 warnings/61 infos, samtliga pre-existing i orörda filer) · check-langa-streck.mjs exit 0 (260 filer, 0 ofångade) · build exit 0, grep -rn hem-prototyp dist/ exit 1 (0 träffar) · test:api exit 0 (1164 passed).

AC #3 / task-226: redan Status Done sedan 2026-08-20 (ej gjort av detta pass, bekräftat via task 226 --plain) — bockas som uppfyllt i sak. Bifynd bokfört: task-243.5:s Dependencies-kort (TASK-243.4, TASK-241.7) står båda kvar "To Do" som backlog-status trots att deras respektive mekaniska gates (facit-manifestets "godkand", PR #1912 mergad) är uppfyllda — konsekvent med att Done-flippen ägs av orkestreraren efter CI, inte av bygg-agenten. Ingen åtgärd vidtagen på dessa kort.

Done-flipp S112: PR #1925 landad, post-merge grönt. Landning: PR #1925
<!-- SECTION:NOTES:END -->
