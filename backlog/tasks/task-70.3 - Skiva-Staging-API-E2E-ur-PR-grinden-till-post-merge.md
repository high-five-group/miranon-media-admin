---
id: TASK-70.3
title: 'Skiva: Staging (API + E2E) ur PR-grinden till post-merge'
status: In Progress
assignee: []
created_date: '2026-07-28 16:33'
updated_date: '2026-07-28 23:36'
labels:
  - ready-for-agent
dependencies:
  - TASK-70.2
  - TASK-70.5
parent_task_id: TASK-70
ordinal: 146000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den enskilt största posten i spåret. Staging (API + E2E) bär 375 s mätt (run 30369011230) plus den globala mutexen staging-tests, och ligger i dag i den blockerande PR-grinden.

KRÄVER A7:4 OCH A7:7. Post-merge-lagret måste finnas att flytta kontrollen TILL, och revert-vägen måste vara skriven och övad innan en kontroll lämnar den blockerande grinden. Utan bådadera tas kontrollen bort i stället för väntan.

### VAD SOM FAKTISKT VINNS — OCH VAD SOM INTE GÖR DET

Var ärlig med talet. Kritisk väg i dag: 445 s, buren av purge 9 s följt av Staging 375 s. Tas de två jobben ur PR-vägen blir NY kritisk väg Acceptance (hermetisk), som är mätt till 404 s, 407 s och 452 s i tre körningar efter att alla 18 filer var ute (ci-suite.yml rad 137-139). Väggklockan för EN ensam kod-PR sjunker alltså knappt — den kan i värsta observation stå still eller stiga.

Den verkliga vinsten är MUTEXEN. staging-tests är en global FIFO över alla staging-rörande körningar (PR mot PR, PR mot main-push, PR mot natt). Ur PR-vägen försvinner därmed kö-tiden vid parallella PR:er, och det är den kostnad som faktiskt drabbar ett flöde med flera samtidiga agenter.

MÅLET UNDER 4 MIN UR ÅTGÄRDSPLANEN NÅS INTE AV DENNA SKIVA. Acceptance blir ny kritisk väg och ligger över det taket. Acceptance-urval är den fortsättning som krävs, och den är kandidat och EJ beslutad — den ska inte designas förrän post-merge-lagret mätts skarpt. Att kortets tak därför är satt till 480 s och inte 240 s är ett medvetet val mot uppmätt verklighet, inte en uppmjukning.

### FÄLLAN: ci-suite.yml ÄR EN KÄLLA, DELAD MED NATTEN

nightly.yml rad 61 anropar ci-suite.yml UTAN run_staging-input, vilket ger default true och full svit. Raderas test-staging-jobbet ur ci-suite.yml försvinner staging även ur nattnätet. Det är inte den flytt som beställts.

Rätt form är att VILLKORA, inte radera: en input eller ett github.event_name-villkor som släcker jobbet för presubmit-anroparen medan natten och post-merge behåller det.

### ÄNDRAR BETEENDE

En kod-PR kan efter denna skiva landa utan att staging någonsin körts mot dess innehåll. Det är avsikten — men det gör revert-vägen till den kontroll som bär risken, och det är därför A7:7 är dep och inte en rekommendation.

VID FÖRSTA SKARPA LANDNINGEN EFTERÅT, OBSERVERA:

- att post-merge-körningen faktiskt startade på main-push och faktiskt körde staging,
- att ett rött post-merge öppnade sitt ärende,
- att tiden från merge till post-merge-svar är känd och redovisad — det är hur länge ett fel nu kan ligga oupptäckt i main,
- att natten fortfarande kör staging.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Staging (API + E2E) och Staging sentinel purge förekommer INTE i jobblistan för en kod-PR:s ci.yml-körning — verifierat med gh run view --json jobs, run-ID redovisat
- [x] #2 Båda jobben körs FORTFARANDE i nightly.yml och i post-merge-lagret — ett grönt run-ID per yta redovisat
- [x] #3 Ingen PR-körning tar concurrency-gruppen staging-tests — bevisat genom två kod-PR:er körda samtidigt utan att någon köar
- [x] #4 Kod-PR:ens kritiska väg mätt i CI och redovisad som tal, tak 480 s. Talet jämförs mot baslinjen 445 s och avvikelsen förklaras — en oförändrad väggklocka är GODKÄNT utfall så länge mutexen är borta ur PR-vägen
- [x] #5 Mutex-vinsten mätt separat: väggklockan för två samtidiga kod-PR:er före och efter, båda talen redovisade
- [x] #6 CI Passed or Skipped är fortfarande enda required check i ruleset 19627609, och gate-proof.yml är körd grön efter ci.yml-ändringen — ci.yml rad 690 kräver det efter varje ändring
- [x] #7 Tiden från merge till post-merge-svar är skriven i CONTRIBUTING.md — det är exponeringsfönstret för ett fel som slipper igenom grinden
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

Varje kriterium är en mätning mot CI eller ett gh api-svar: jobblistor ur gh run view, mutex-beteende ur två samtidiga körningar, tal mot ett tak. Inget kräver omdöme om vad som ser rätt ut.

Skivan tar visserligen bort en blockerande kontroll, vilket är den tyngsta rörelsen i hela spåret — men förutsättningen är mekaniserad i deps snarare än överlämnad till omdöme: A7:4 ger skyddsnätet och A7:7 ger vägen tillbaka, och båda är kodade som äkta beroenden. Frågan som SKULLE kräva mänskligt omdöme, nämligen OM kontrollen får flyttas, är redan avgjord genom Marcus godkännande av åtgärdsplanen. Kvar är utförandet, och det är mekaniskt.

Den enda fällan är delningen av ci-suite.yml med natten, och den är utskriven med radhänvisning i beskrivningen.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FORM: ci.yml suite-jobbet skickar `with: run_staging: false` VILLKORSLÖST. Jobben Staging (API + E2E) och Staging sentinel purge instansieras därmed aldrig av ci.yml — varken på pull_request eller push till main. ci-suite.yml och nightly.yml är ORÖRDA; post-merge.yml och nightly.yml utelämnar inputen och får default true. Fällan i kortets beskrivning (ci-suite.yml delas med natten) är därmed undviken per konstruktion: ingenting raderas, endast presubmit-anroparen släcker jobben via den input som redan fanns.

VARFÖR LITTERALT false OCH INTE ETT UTTRYCK: staging ska efter denna skiva inte finnas i PR-grinden att villkora. Ett uttryck hade dessutom behövt rivas igen när merge queue (TASK-70.1) lägger merge_group bredvid pull_request.

FÖLJD SOM BOKFÖRS ÖPPET — EJ ÅTGÄRDAD, EJ TYST: ui_low_risk (D1, task-36.3) och acceptance_local (task-59.7) hade run_staging som sin ENDA konsument. Båda beräknas fortfarande i changed-jobbet men styr efter denna skiva ingenting. Stegen står kvar medvetet: ADR-077 § Beslut 1 äger klassrymden och S91:s arbetsflödes-granskning listar riskklassningen under "ska behållas orört". Om de ska avvecklas, återanvändas av A7:6 eller bevaras som klassrymdens invariant är ett eget beslut — det fattas inte som sidoeffekt här. Markerat i ci.yml på tre ställen så det inte kan läsas som glömska.

FÖLJDÄNDRINGAR (påståenden som skivan gör FALSKA, rättade i samma landning):
- post-merge.yml filhuvud: § VARFÖR FILEN FINNS punkt 2, § FÖRKRAV→§ MÅLET, § MUTEX-KOSTNADEN (nu betald), § FORMEN BÄR ÖVER A7:5, samt suite-jobbets "INGEN with:"-not.
- scripts/classify-post-merge.sh § VAD SOM MEDVETET INTE ÄRVS.
- CONTRIBUTING.md § Landnings-ordningen villkor 2, § Revert-vägen (två stycken), samt NY § Post-merge-lagret med det mätta exponeringsfönstret (AC#7).
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-28 21:52
---
MÄTNING 2026-07-28 SOM STÄRKER KORTETS VÄRDE — mutexen serialiserar, och kostnaden växer med antalet parallella PR:er.

Två fulla körningar med identiskt svit-innehåll, mätt ur GitHubs jobb-API:

  run 30400021534: Acceptance 21:17:47->21:24:49 · Staging 21:18:06->21:24:15  => total 7,8 min
  run 30400640305: Acceptance 21:26:40->21:33:46 · Staging 21:39:22->21:46:09  => total 20,3 min

I den första startade jobben 19 s isär och kördes parallellt. I den andra startade staging 5 min 36 s EFTER att acceptance var klar — den stod i concurrency-gruppen staging-tests bakom en annan körning. Samma svit, 20,3 mot 7,8 minuter; hela skillnaden är kö.

KONSEKVENS FÖR KORTETS MOTIVERING: vinsten av A7:5 är inte bara de 369-390 s staging-jobbet självt tar, utan att den kritiska vägen slutar VÄXA med antalet parallella PR:er. Det är den egenskap ett flöde med flera samtidiga agenter behöver mest, och den syns inte alls i en mätning av jobbtider — bara i en mätning av kötid.

Observationen gjordes av Marcus på PR #386 (total duration 14 min 16 s) och verifierades av orkestreraren mot API:t. Orkestrerarens tidigare analys byggde på jobbtider och missade köväntan.

FÖRBEHÅLLET I KORTET STÅR KVAR OFÖRÄNDRAT: Acceptance (422-433 s) blir ensam bärare efter flytten, så taket landar kring 7 min även efteråt. Urvalet som sänker det är TASK-75, som har dep på detta kort.
---

created: 2026-07-28 23:36
---
MÄTNINGAR — allt i CI, inget lokalt projicerat. Kod + följdändringar: commit 5137eca, PR #395.

AC#1 — run 30406001773 (PR #395; kod-klass eftersom diffen rör .github/workflows/**, som är exkluderad ur D0, D1 och acceptance_local). Båda staging-jobben: conclusion=skipped, runner_id=null, runner_name=null, steps=0, och completed_at 22:50:40Z alltså 1 s FÖRE started_at 22:50:41Z — signaturen för ett jobb som aldrig dispatchades till en runner. `gh pr checks 395` visar dem som "skipping 0". KONTRAST på gamla ci.yml (run 30405315514): samma jobb har runner_name "GitHub Actions 1000002638", steps=12, och körde 367 s.
AVVIKELSE MOT AC:NS BOKSTAV, ej tyst: jobben FÖREKOMMER i jobblistan, som skippade placeholder-poster. Att göra dem literalt frånvarande kräver att de raderas ur ci-suite.yml — precis den form kortets egen beskrivning förbjuder, eftersom natten då tappar dem. Mätt substans: noll runner, noll steg, noll sekunder, noll mutex.

AC#2 — båda jobben körs FORTFARANDE på de två andra ytorna, verifierat med ändringen på grenen:
  nightly.yml    run 30406342080  conclusion=success · purge 22:56:30->22:56:39 success · staging 23:08:53->23:15:46 success (413 s) · larm skippat
  post-merge.yml run 30407056357  conclusion=success · purge 23:09:28->23:09:38 success · staging 23:15:47->23:21:15 success (328 s)

AC#3 — PR #396 (öppnad 22:52:48Z) och #397 (22:52:54Z), 6 s isär, båda grenade ur ändringen. Runs 30406142071 och 30406148159: purge OCH staging skipped i BÅDA, noll pending-jobb i någon av dem, ingen kö. Ingen av körningarna tog concurrency-gruppen staging-tests.

AC#4 — run 30406001773: 22:50:28Z -> 22:57:58Z = 450 s mot tak 480 s (marginal 30 s / 6,3 %). Kritisk väg: Acceptance (hermetisk) 429 s plus aggregator 3 s. Mot baslinjen 445 s: +5 s (+1,1 %). Väggklockan står alltså still — det GODKÄNDA utfallet enligt AC:ns egen formulering, eftersom vinsten ligger i kön. Förklaringen till att talet inte rörde sig: acceptance (429 s) och staging+purge (384 s) är nästan lika långa, så bäraren byttes utan att längden ändrades.

AC#5 — mutex-vinsten, mätt separat, två kod-PR:er samtidigt FÖRE och EFTER:
  FÖRE (gamla ci.yml, kontrollerad last — enda staging-konsumenterna i fönstret):
    #390 run 30405309408 attempt 3: 23:22:07Z -> 23:29:34Z = 447 s · staging 23:22:47->23:28:42 (355 s), ingen kö
    #391 run 30405315514 attempt 3: 23:23:27Z -> 23:34:57Z = 690 s · staging pending 23:24:01 -> start 23:28:44 = 283 s KÖ, sedan 367 s
    Max väggklocka för paret: 690 s.
  EFTER (nya ci.yml):
    #396 run 30406142071 = 440 s · #397 run 30406148159 = 426 s · kötid 0 s i båda
    Max väggklocka för paret: 440 s.
  Skillnad i max väggklocka: 250 s (36 % lägre). Viktigare än talet: FÖRE-siffran VÄXER med varje ytterligare samtidig kod-PR (~360 s per PR, seriellt), EFTER-siffran är konstant.
  DEKLARERAD KONTROLL, ingen tyst asterisk: FÖRE-paret startades med 75 s stagger. Skälet är purge-racet (TASK-76) — med 0 s stagger kolliderar purge-jobben och den ena körningen dör, vilket ger noll mutex-mätning. Fyra observationer stödjer det. Staggern påverkar inte kontentionen: staging-jobbet är ~360 s mot 75 s stagger, så överlappet är totalt.
  KORROBORERANDE NATURLIGT EXPERIMENT (samma dygn, oplanerat): run 30405879269 höll mutexen 22:48:53->22:54:45 medan run 30405315514 stod pending 22:49:25->22:54:48 = 323 s kö. Två oberoende mätningar av samma storhet: 283 s och 323 s.

AC#6 — ruleset 19627609 har fortfarande exakt EN required status check: "CI Passed or Skipped" (gh api, verifierat efter ändringen). gate-proof.yml körd på grenen i BÅDA riktningar: 30406160816 (positiv) GRÖN — paraply-repliken körde och dess fail-closed-gren blev failure på ett rött jobb; 30406181311 (negativ kontroll, simulate_skip=true) RÖD — assert-jobbet fällde när repliken skippades, alltså är beviset självt ärligt. Dessutom ett skarpt LEVANDE bevis utan avsiktligt rött i den delade kön (CONTRIBUTING § Rött-först förbjuder det): run 30405309408 attempt 2 fick ett rött purge-jobb och dess "CI Passed or Skipped" blev failure 22:55:56->22:55:58.

AC#7 — CONTRIBUTING.md § Post-merge-lagret med underrubriken § Exponeringsfönstret. Mätt ur skarpa main-körningar: kod 452 s (30400572865) / 455 s (30402009647) / 463 s (30402869073); docs 23 s (30403050623) / 29 s (30403151544) / 24 s (30403478649). Att talen är mätta FÖRE flytten står utskrivet i texten, tillsammans med varför de bara kan krympa av den.

LOKALA GRINDAR — hela ytan, inte bara rörd fil-klass: actionlint (CI:s exakta -ignore) 0 · yamllint 0 · shellcheck 0 · check:docs 9 gröna 0 · biome 0 · typecheck 0 · build 0 · test:api:pure 246 passed · test:api:staging 173 passed · test:e2e:staging 178 passed/3 skipped · test:a11y 74 passed · test:preview:staging 1 passed · vakt:kontrakt 10 passed · samtliga grind-självtester gröna (classify-post-merge 17/17, frontmatter 14/14, lifecycle 16/16, ci-wait 27, fetch-depth 7/7, adr-count 4/4, lesson-numbers 6/6, public-checklists 5/5, spawn-log 10/10, prod-deploy 4/4, pre-commit-hook 9/9, vale-regression 3/3, purge-guards gröna).
EN AVVIKELSE, ÄRLIGT: test:acceptance gav lokalt 152 passed / 1 failed (person-detail.acceptance.test.ts:140). Filen körd ensam direkt efteråt: 8/8 grönt, exit 0. Alltså TASK-64:s kända last-flake, inte en regression — och CI:s acceptance på samma träd var grön (7 min 9 s). Diffen rör noll TypeScript.

FYND UTANFÖR SCOPET, EJ ÅTGÄRDAT — mintat som TASK-76 av orkestreraren: Staging sentinel purge racear med sig själv. Fem observationer, fyra fällningar och ett kontrastbevis. I varje överlappande par faller exakt EN — den som DELETE:ar sist får Airtable 404. Purge-jobbet kör medvetet utan staging-tests-mutex (ci-suite.yml rad 64-65); ålders-guarden skyddar in-flight TESTER, inte en parallell PURGE. Denna skiva tar bort exponeringen ur PR-vägen men inte ur post-merge/natt — och ESKALERAR konsekvensen: efter flytten ger ett purge-race en röd POST-MERGE, vilket automatiskt öppnar ett tilldelat ärende med revert-förslag på ett träd som redan ligger i main. Det fallet har redan inträffat (run 30406325230).
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
