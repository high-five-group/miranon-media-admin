---
id: TASK-299.6
title: 'Skiva: Facit-amendering av berörda ytor + sidram-sektion i DESIGN-SYSTEM-SPEC'
status: Done
assignee: []
created_date: '2026-08-22 19:26'
updated_date: '2026-08-23 19:20'
labels:
  - ready-for-human
dependencies:
  - TASK-299.2
  - TASK-299.5
parent_task_id: TASK-299
ordinal: 546000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
De stämplade ytor som byter sidram i den omfattning Marcus valde får sina manifest amenderade — öppet, med hans citat, i egen commit skild från formändringen. Samtidigt får designsystem-specen den sidram-sektion den saknar helt i dag: det var frånvaron av en sådan sektion som lät två dialekter divergera obemärkt, så utan den upprepas felet. Sektionen ska beskriva den valda formen och dess gräns mot andra ytklasser. Täcker användarberättelser: 11, 12, 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje stämplat manifest vars yta bytt sidram är amenderat med daterad post och Marcus citat, i EGEN commit
- [x] #2 Ingen yta utanför den omfattning Marcus valde i skiva 2 är rörd
- [x] #3 DESIGN-SYSTEM-SPEC bär en sidram-sektion som beskriver den valda formen och dess familjegräns mot andra ytklasser
- [x] #4 check-facit grön; inga ytor lämnas med manifest som beskriver en form de inte längre bär
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [x] #6 Facit-amendering av berörda stämplade manifest sker i EGEN commit med Marcus citat daterat (ADR-102/103) — aldrig i samma commit som formändringen
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGD 2026-08-23 (S111 resume 2, Opus-agent). Gren feat/task-299-6-sidram-facit-spec-adr126, bas origin/main e022ed54.

PREMISS-PASS — fyra premisser provade, TRE divergenser funna.

1. ADR-NUMRET. Uppdraget sade ADR-126; disk-verifierat mot origin/main (git ls-tree docs/decisions/ | grep -oE 'ADR-[0-9]+' | sort -u | tail -1 -> ADR-125). Uppdraget hade RATT. Men KORTREGISTRET har fel: PRD TASK-299 § ADR-koppling och TASK-299:s Implementation Notes sager bada "ADR-124 (delade presentationsformer) mintas i TASK-299.6", och SidRam.tsx:s docblock + src/routes/dev/primitives.tsx bar samma nummer i koden. ADR-124 ar sedan S108 "Forhandsgranskningens leveransvag — transient utkast i Storage". Sessionsdokets rad 686-687 bar redan rattelsen. De TVA kod-referenserna ar rattade till ADR-126 i denna landning; PRD:ns och kortnotesens star kvar som historik, och ADR-126 § Kontext bokfor hela numrerings-historiken oppet.

2. VariantD KONSUMERAR INTE SidRam. Uppdraget: "Segment-prototypens src/components/segment/prototyp/VariantD.tsx konsumerar ocksa SidRam — ror den INTE". FALSKT i sak: filen importerar ALDRIG primitiven (grep 'primitives/SidRam' -> noll traffar) utan definierar en EGEN lokal function SidRam (rad 1127) ovanpa en egen TILLBAKA_KLASS-konstant (rad 991-992) som ar samma klass-strang plus hover-tillagg. Instruktionen foljdes anda (filen ororda), och fyndet ar i stallet bokfort i ADR-126 § Konsekvenser som den varsta varianten av kopiering: en grep efter "SidRam" ger en falsk traff som ser ut som en konsument.

3. KORTETS DEPENDENCIES. TASK-299.6 har Dependencies: TASK-299.2, TASK-299.5. 299.5 (promovering av anmalningssidan) ar INTE landad — den ligger pa wip/s111-marcus-iteration / draft-PR #1864. Uppdraget beordrade bygget anda och det utfordes; spec § 23 hanterar det genom att lista anmalningssidan som "tillkommer nar TASK-299.5 landar" i stallet for som barande yta. Kortet bar ocksa labeln ready-for-human, som inte andrats.

INGEN divergens pa: 5fd71a82/#1871 (verifierad merge-commit), 299.2-matningens innehall (last pa kortet, matchar uppdraget exakt), promoveringsgrindarnas testantal (8 + 26 = 34, uppdragets tal stamde), att bada ytorna bar ?sidram=ny (verifierat i kallkoden fore rivning).

DEL A — RIVNINGEN (commit bec93209). PersonDetail.tsx + EventCheckin.tsx: useQueryState('sidram')/sidramNy-ternaren och den inline byggda Link-chevronen rivna; SidRam enda formen. Oanvanda importer stadade (ChevronLeft ur bada, Link ur EventCheckin, nuqs ur bada). Docblocks skrivna pa 299.11:s form. Acceptance: persondetaljens "TASK-299.1 dev-vaxel"-describe riven, chevron-assertionen flyttad in i det befintliga axe-0-testet (299.11:s monster). Dorrlistans block KONVERTERAT i stallet for rivet — flaggan bort ur URL:en, formen kvar — darfor att det ar filens ENDA axe-svep over dorrlistans grundvy; motsatt val mot 299.11, motiverat i testets egen docblock.

BEVIS PA IDENTITET (underlaget for klass (b)): tests/visual/persondetalj-promoverings-grind.spec.ts (8) + tests/visual/dorrlista-promoverings-grind.spec.ts (26) = 34/34 passed, exit 0, UTAN om-baselinjering. ariaSnapshot-referenserna ororda sedan 2026-08-12 resp. TASK-214.3.

DEL A2 — FACIT (commit 8e2edaa6, EGEN commit per AC #1/DoD #6). Tva sidofiler pa ADR-102 § A3:s kanoniska form:
  tasks/sessions/bilagor/s103-persondetalj-konvergens/AMENDERING-2026-08-23-sidram-promovering.md
  tasks/sessions/bilagor/s103-checkin-konvergens/AMENDERING-2026-08-23-sidram-promovering.md
Klass (b), inte (c) som i TASK-299.11 — och skillnaden ar saklig: dessa tva ytor var REDAN kant-i-kant fore TASK-299.1, sa det fanns inget 16 px-missalignment att fixa. Matningen som A2 kraver ar skriven i bada filerna i tva oberoende former (299.2-agentens MD5/boundingBox + denna landnings promoveringsgrindar). Dorrlistans post bokfor oppet den enda observation som talade at andra hallet (skarmdumpar som skilde sig pa enstaka bytes) och varfor den inte hojer klassningen. godkand-faltet ORORT i bada manifesten. Ingen av ytorna deklarerar referenser-nyckeln, sa invariant (d):s hash-las berors inte.

DEL B — DESIGN-SYSTEM-SPEC § 23 "Sidramen — Mer-familjens delade sidkrom". Geometrin MATT ur koden, inte atergiven: main mx-auto w-full max-w-[600px] px-4 py-4 pb-24 (AppShell.tsx:44); chevron mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted; ChevronLeft size 26 aria-hidden; 44 px = WCAG 2.5.5-golvet exakt; tillbakaEtikett obligatorisk. Atta barande ytor uppraknade (grep-verifierade), anmalningssidan noterad som vantande pa 299.5. Familjegrans-tabell med fem ytklasser och skal, plus testet "lamnar anvandaren sidan genom att ga TILLBAKA till en kand foraldrayta?". Tre oppna poster bokforda, daribland en NY MATNING: text-3xl pa persondetalj/check-in/aktivitetshistorik/dokument/intresserade mot text-2xl pa vantelista/maillogg/installera-appen — en divergens ingen fattat beslut om. Andringsloggen uppdaterad.

DEL C — ADR-126 "Delade presentationsformer". Fem beslut B1-B5 (troskeln TVA ytor, kopiering aldrig tyst, lyft karnan inte formen, lyftet ar en FLYTT som bevisas mekaniskt, familjegransen skrivs samtidigt). Fyra externa precedent sokta och citerade (Carbon UI Shell, Polaris Page/backAction, GOV.UK Useful/Unique/Consistent, EightShapes rule-of-three) — rymden var INTE tunn. B1 avviker medvetet fran EightShapes troskel (tva i stallet for tre) med motiveringen matt i detta hus: sidramen nadde sex kopior och cirkeln sju innan nagon lyfte. Vad precedenten INTE svarar pa (en form som redan ar STAMPLAD nar lyftet sker) ar utskrivet i stallet for dolt. Sex kvarvarande inline-kopior uppraknade i klartext, matta pa denna commit. Ingen mekanisk grind infors och prosan pastar ingen (ADR-083). Registrerad i docs/decisions/README.md; README.md:s ADR-rakning 124 -> 125 (check-adr-count.sh kravde det).

GRINDAR, exitkod last direkt (aldrig via pipe):
  npm run typecheck ................................. exit 0
  npx @biomejs/biome check . ........................ exit 0
  npm run build ..................................... exit 0
  npm run test:api .................................. exit 0
  node scripts/check-langa-streck.mjs ............... exit 0 (265 filer, 0 ofangade)
  bash scripts/check-facit.sh ....................... exit 0 (12 manifest, 27 ytor, 0 ogodkanda)
  npm run check:docs ................................ exit 0 (14/14 grona)
  bash scripts/check-adr-count.sh ................... exit 0 (125 == 125)
  visual: persondetalj+dorrlista promoveringsgrindar  exit 0, 34/34
  acceptance: person-detail + event-checkin-dorrlistan exit 0, 14/14

check:docs fallde FORST (exit 1) pa lychee: ADR-126 pekade pa gissade filnamn for ADR-102/103. Rattat mot disk (ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md, ADR-103-promoveringsformen-prototypen-promoveras-skarpa-bygget-avskaffas.md); grinden ar den som fangade det.

DoD #3 EJ BOCKAD — CI per jobb ags av orkestreraren, inte av agenten.
DoD #5 EJ BOCKAD, MEDVETET. axe 0 ar matt pa bada ytorna (persondetaljens renderade vy + GLES/tomlages-vy; dorrlistans sex svep i promoveringsgrinden: Dag 1, listlage, sok med traff, sok utan traff, klargrupp expanderad, tomlage — plus acceptance-svepet). Men persondetaljens FEL-tillstand (404 och generiskt fel via role=alert) har testtackning UTAN axe-svep, och kriteriet sager uttryckligen "alla tillstand ... fel". Att bocka det hade gjort registret osant. Andringen ar dessutom bevisat formneutral (34/34 mot ororda ariaSnapshot-referenser), sa axe-utfallet kan inte ha forandrats av denna diff — men det ar ett argument for att luckan ar ofarlig, inte for att den ar tackt.

STÄNGNING 2026-08-23 (S111 kort-stängningspass). Båda de kvarvarande DoD-posterna bockade — #5 först EFTER att luckan faktiskt täppts, inte på argumentet att den var ofarlig.

DoD #3 — CI GRÖN PER JOBB: arbetet (bec93209 rivningen, 8e2edaa6 facit-amenderingen, b903c402 ADR-126 + spec § 23) landade i PR #1873, merge-commit 19719ab7 på main. `gh pr checks 1873` mätt 2026-08-23: 15 rollup-poster, NOLL fail — Lint + Audit + TypeCheck pass (2m16s), Acceptance (hermetisk) pass (6m43s), Acceptance tvåsidigt bevis pass (7m45s), Pure + Build pass (47s), Webblasarbeteende pass (1m57s), Docs link check pass (56s), CodeQL/Analyze pass, Vercel pass. A11y/Staging skipping per CI:s diff-gating.

DoD #5 — AXE-LUCKAN ÄR TÄPPT, INTE BORTFÖRKLARAD. Byggpasset lämnade denna post öppen med rätt skäl: kriteriet säger 'alla tillstånd ... fel', och persondetaljens två fel-grenar (404 + generiskt 4xx via role=alert) hade testtäckning UTAN axe-svep. Byggpasset noterade själv att formneutraliteten (34/34 mot orörda ariaSnapshot-referenser) var 'ett argument för att luckan är ofarlig, inte för att den är täckt'. Detta pass täckte den:
  · tests/acceptance/person-detail.acceptance.test.ts — axe-svep tillagt i BÅDA de befintliga felläges-testerna (404-grenen och den generiska 4xx-grenen), inte i nya parallella test. Husets mönster följt: samma AxeBuilder-taggar (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) som filens två befintliga axe-test.
  · De två fel-grenarna sveps SEPARAT med avsikt: de är olika renderade tillstånd (annan copy, samma role=alert-väg), så 404-svepet bevisar inte den generiska grenen.
  · MÄTT: `npm run test:acceptance -- tests/acceptance/person-detail.acceptance.test.ts` exit 0, 8/8 passed (24,9 s). Fel-testerna: NOT-FOUND 2,3 s, övrigt fel 2,3 s — båda gröna MED svepet.
  · TVÅVÄGSBEVIS, kortets egen disciplin: en tillfällig alt-lös bild injicerades i fel-vyns DOM före svepet → körningen FÄLLDE, exit 1, med axe-regeln 'image-alt' i violations-diffen. Injektionen togs bort igen och filen återställdes (grep efter markören ger 0 träffar i den committade formen). Svepet kan alltså fälla — det är inte ett grönt test som mäter ingenting.
  · Dörrlistans sida av DoD #5 var redan mätt av byggpasset (sex svep i promoveringsgrinden + acceptance-svepet).

GRINDAR I DETTA PASS, exitkod läst direkt (aldrig via pipe): npx @biomejs/biome check . exit 0 · npm run typecheck:tests exit 0 · node scripts/check-langa-streck.mjs exit 0 (271 filer, 0 ofångade) · npm run check:docs exit 0 (14/14) · bash scripts/check-facit.sh exit 0.
<!-- SECTION:NOTES:END -->
