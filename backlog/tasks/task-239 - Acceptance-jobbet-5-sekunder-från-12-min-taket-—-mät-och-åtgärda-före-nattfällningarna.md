---
id: TASK-239
title: >-
  Acceptance-jobbet 5 sekunder från 12-min-taket — mät och åtgärda före
  nattfällningarna
status: Done
assignee: []
created_date: '2026-08-16 07:07'
updated_date: '2026-09-02 12:56'
labels:
  - ready-for-agent
dependencies: []
ordinal: 439000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-16 (R5, nyupptäckt obokförd rot): acceptance-väggklockan växer monotont 8m47s (08-12) → 8m17s → 9m39s → 10m43s → 11m55s (08-16) = 5 SEKUNDERS marginal till timeout-minutes: 12. Första fällningen redan skedd: job 95091539477 (#1372, 2026-08-16 00:31) cancelled 12m03s mitt i hermetik-självtestet, EFTER 'BEVISET HÅLLER … 231 tester · 231 fällda'. Hypotes: warmup-gaten fires även i fixturvärlden (varje acceptance-test startar med tom localStorage; 218.3:s egen kodkommentar bokför 30/36 fällningar i hem.acceptance under bygget) — men tillväxten började FÖRE 218.3 (08-13→08-14: +82 s), så mät innan åtgärd. Prognos: nattliga cancelled inom 1–2 landningar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tillväxtens orsak identifierad med mätning (Acceptance-steget på 817979a8^1 vs 817979a8, eller metrics:ci-serien) — inte antagen
- [x] #2 Åtgärd som återtar marginalen (>2 min till taket) utan reflexmässig takhöjning
- [ ] #3 Acceptance grön i nattnätet tre nätter i rad efter åtgärd (belägg: run-ID:n)
- [x] #4 Webblasarbeteende-jobbets artefaktsteg (ci-suite.yml ~rad 433) får samma failure() || cancelled()-villkor — fynd ur task-237 2026-08-16: identiskt mönster, timeout-minutes: 8, samma blindhet vid takfällning
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
MÄTNING (AC #1) — Acceptance-jobbets nattliga steg-tider, disk/API-verifierade via gh api repos/.../actions/jobs/<id> mot Nightly-workflowets fem körningar (31560003797…31921753720, Acceptance (hermetisk)-jobbet).

Natt/Testantal/Acceptance-steg/Självtest-steg/Total väggklocka:
08-12: 196 / 230s / 272s / 527s (8m47s)
08-13: 217 / 219s / 248s / 497s (8m17s)
08-14: 224 / 262s / 291s / 579s (9m39s)
08-15: 229 / 286s / 325s / 643s (10m43s)
08-16: 231 / 361s / 318s / 715s (11m55s)

Två SÄRSKILDA komponenter, inte en:
1) ORGANISK TESTANTAL-TILLVÄXT (196→231, +35/+17.9%, hela fönstret) — väntad, pågående, INTE fixbar via engångsåtgärd. Förklarar 08-13→08-14-hoppet (+82s, FÖRE 218.3 — bekräftar kortets egen flagg att tillväxten inte är enbart warmup-gaten) och en del av 08-14→08-15.
2) WARMUP-GATEN (TASK-218.3/ADR-112, commit 817979a8, landad 2026-08-15 12:17 UTC). 08-15-nattkörningen (02:15 UTC) startade FÖRE landningen; 08-16-körningen (02:22 UTC) är FÖRSTA nattkörningen med gaten. Delta 08-15→08-16 (nästan konstant testantal, 229→231): +72s total väggklocka, varav +75s ISOLERAT i Acceptance tests (hermetiska)-steget medan självtest-steget MINSKADE (-7s) — konsekvent med att självtestets EF-mock-vakt fäller warmup-anropen omedelbart (fail-fast) medan huvudkörningens MSW-svar tar verklig tid per test.

LOKAL KONTROLLERAD A/B (kortets efterfrågade jämförelse, 817979a8^1 vs 817979a8, IDENTISK 231-testsvit — verifierat via --list på båda SHA:er, inga acceptance-testfiler ändrades i PR #1343): FÖRE 708.97s (230/231 passed), EFTER 1943.94s (229/231 passed) — 2,74x lokalt. Detta magnitud-tal är EJ CI-jämförbart (samma maskin drabbades av loadavg 300-800 under körningarna, mätt via uptime) men bekräftar MEKANISMEN otvetydigt: samma testsvit, samma maskin, enda skillnaden är gaten.

Mekanismen läst i källan: src/main.tsx:s InnerApp anropar starta(queryClient, { dataSource }) (StartvarmningBeroenden-seamen, startvarmningen.ts) på VARJE auth-löst sidladdning med tom query-cache — exakt fixturvärldens per-test-startvillkor (tom localStorage/tom cache per test). 7 warmup-items i ~4 sekventiella batchar.

ÅTGÄRD (AC #2) — STOPPAT, EJ BYGGT [VARV 1, 2026-08-16]. Mätningen pekar entydigt på att den STÖRSTA identifierade, fixbara komponenten (den enda som ensam förklarar 5-sekundersmarginalen mot 12-min-taket) är SAMMA StartvarmningBeroenden-seam task-236-agenten just nu åtgärdar för staging-e2e (samma fil, samma integrationspunkt, samma mekanism — bara olika testklass runt den). Per uppdragets koordineringsregel: byggde INTE en parallell fix mot samma seam (risk för merge-konflikt/dubblerat designval); byggde heller INTE en kringgående åtgärd (workers-höjning/sharding) eftersom (a) det hade maskerat grundorsaken task-236 redan löser, (b) CI-risken för en oprövad worker-/sharding-ändring inte går att stänga lokalt idag, (c) organisk testtillväxt fortsätter oavsett — margin-återtagningen behöver egentligen BÅDE seam-fixen OCH en strukturell buffert, och den senare är inte detta korts att gissa fram oprövat.

REKOMMENDATION till orkestreraren: låt task-236 landa, mät om Acceptance-jobbets marginal som BIEFFEKT (samma main.tsx-integrationspunkt bär båda testklasserna), och bedöm om en KOMPLETTERANDE strukturell åtgärd (testsvits-sharding, worker-konfig) fortfarande behövs som eget kort när färsk data finns.

AC #3 (tre gröna nätter) — bevakas av orkestreraren/nattnätet, ej görbart idag.

AC #4 byggd: ci-suite.yml rad ~433 (webblasarbeteende-jobbets artefaktsteg) fick if: failure() || cancelled(), identiskt mönster som PR #1380 gav acceptance/test-staging-jobben. actionlint + yamllint gröna. verify:ci-parity (fullt läge, egen CI-ändring) föll först rött (3 poster: test-ci-wait T1 + 13 acceptance-specs) — samtliga verifierade vara LOKALA LOADAVG-artefakter (uppmätt 300-800 under körningen pga mina egna sekventiella lokala A/B-körningar) och INTE orsakade av diffen: test-ci-wait 27/27 grönt vid isolerad ompröving efter att lasten sjunkit, samtliga 11 berörda acceptance-specfiler (96 tester) 0/96 fällda vid isolerad omkörning under normal last. Diffen rör uteslutande webblasarbeteende-jobbet, strukturellt oberoende av acceptance-jobbets testinnehåll.

═══════════════════════════════════════════════════════════════
VARV 2 (2026-08-17) — ÅTGÄRDEN BYGGD. Varv 1:s blockering upphävd: task-236 är Done (varv 2, merge 8214ef2f), så koordineringsrisken mot samma seam finns inte längre.
═══════════════════════════════════════════════════════════════

FÄRSK CI-MÄTNING (7 post-merge-körningar med Acceptance-jobbet, 2026-08-17, gh api .../actions/runs/<id>/jobs). Jobb-total / Install / Acceptance-steg / Självtest-steg, sekunder:
31996099499  696 / 12 / 352 / 313
31989715595  672 / 12 / 341 / 305
31987946806  689 / 14 / 348 / 306
31984913923  646 / 15 / 327 / 292
31992951436  582 / 10 / 297 / 255
31984652487  580 / 11 / 291 / 258
31987146435  505 / 11 / 261 / 218

VAR TIDEN GÅR — svaret på kortets fråga: de TVÅ teststegen är 94-96 % av jobbet, och de är JÄMNSTORA (261-352 s mot 218-313 s). All infrastruktur (checkout + npm ci + Playwright-cache/-install) är ~30 s. Jobbet kör alltså sviten TVÅ GÅNGER sekventiellt och mäter SUMMAN mot ett timeout-minutes: 12 avsett för EN av dem. Loggverifierat (job 95287922103): "Running 233 tests using 2 workers", skarp svit 5.8m, därefter "233 tester · 233 fällda" på 313 s.

FÄLLNINGARNA, jobbsteg-verifierade (INTE bara rollup-status):
· #1428, run 31958171806: Acceptance 16:17:39→16:29:56 = 12m17s (12,28 min), cancelled MITT I självtest-steget (skarp svit hann 375 s, självtestet 330 s).
· #1434, run 31962091899: Acceptance 17:36:22→17:48:27 = 12m05s (12,08 min), cancelled.

ROTEN, LÄST I KÄLLAN OCH BELAGD: task-236 varv 2:s seam (VITE_E2E_WARMUP_TIMEOUT_MS: '50') sätts ENDAST i playwright.config.ts:s e2e-webServer-gren (setup + chromium-authenticated). Acceptance kör mot en ANNAN webServer-gren — den som delas med visual/webblasarbeteende/manifest-screenshots — och fick därför ALDRIG fixen. Warmup-gaten har alltså kört oavkortat i fixturvärlden sedan 817979a8. Exakt vad varv 1 förutsåg ("SAMMA StartvarmningBeroenden-seam ... bara olika testklass runt den").

KOSTNADEN ÄR KONCENTRERAD, INTE UTSMETAD (nytt fynd detta varv). starta() resolvar på det FÖRSTA av (a) alla sju WARMUP_ITEMS klara i fyra sekventiella batchar, (b) timeoutMs. De flesta tester betalar (a) — några MSW-turer. Men tester som PARKERAR nätverket för att observera laddläget (hem-laddlage.acceptance.test.ts:s hallbarMock, FEM tester) parkerar get-registrations OCH get-events — BÅDA WARMUP_ITEMS — så batchen resolvar aldrig och gaten väntar ut HELA (b): 9000 ms per test, före router-mount.

ÅTGÄRD 1 — ROTEN (playwright.config.ts): acceptance-webServern får VITE_E2E_WARMUP_TIMEOUT_MS: '50', villkorat på isAcceptanceRun så visual/manifest-baselines och webblasarbeteende är ORÖRDA (gatens släpp-tidpunkt får inte flytta pixlar i en baseline).
MÄTT, interfolierad A/B på hem-laddlage-filen (A=9000 = beteendet FÖRE, B=50 = EFTER; enda skillnaden är literalen; workers=1, retries=0):
  A varv1: 60 s (loadavg 19,7) · B varv1: 14 s (8,9)
  A varv2: 60 s (loadavg 8,1)  · B varv2: 20 s (5,5)
  Samtliga fyra körningar 5/5 passed.
Alltså ~60 s → ~17 s på FEM tester = -43 s, dvs -8,6 s/test — vilket matchar den förutsagda 9000 ms-mekanismen exakt. (Lokalt tal, men gate-väntan är en ren timer och därmed maskinoberoende till sin natur.)

ÅTGÄRD 2 — STRUKTUREN (ci-suite.yml): hermetik-självtestet var ett STEG i acceptance-jobbet och är nu ett EGET, PARALLELLT jobb (acceptance-sjalvtest). Väggklockan blir max(A,B) i stället för A+B. Detta är den parallellisering acceptance-jobbets egen takkommentar pekar ut som "den varaktiga häven" — men UTAN det antagande den samtidigt kräver mätning för: ingen svit delas, ingen workers-siffra höjs, varje jobb behåller sin oförändrade 2-worker-uppsättning på egna kärnor. Aritmetik, inte skalningshypotes.
Det gamla designvalet ("steget körs EFTER den skarpa sviten med avsikt") är RIVET ÖPPET med motivering i YAML:en, inte tyst: det var ett signal-argument vars pris (en falsk röd på timeout, betald två gånger) växte medan dess värde (slippa ett andra rött besked om samma fil) stod still.
TAKET RÖRDES INTE. timeout-minutes: 12 ligger kvar på båda jobben.

RULESET-FYNDET som gjorde åtgärd 2 möjlig (verifierat, ej antaget): rulesetet main-skydd (id 19627609) kräver ENDAST kontexten "CI Passed or Skipped" — inga enskilda jobbnamn. Ett nytt jobb inuti ci-suite.yml bärs automatiskt av ci.yml:s suite-jobb och därmed av ci-passed. Ingen ruleset-ändring behövdes.

ÅTGÄRD 3 — PARITETSPOLICYN (.ci-parity-policy.json): nya jobbet registrerat i knownJobs.ciSuite + derivedJobs.ciSuite, och diffClassification-rationalens jobbuppräkning uppdaterad. TVÅSIDIGT BEVIS på att vakten fungerar: med posten BORTTAGEN föll npm run verify:ci-parity -- --list med exit 2 och texten 'jobbet "acceptance-sjalvtest" är NYTT — okänt för .ci-parity-policy.json'; med posten på plats exit 0 och båda jobben listade med rätt härledda steg. Paritetsytan är oförändrad i sak — samma två teststeg härleds och körs verbatim, bara ur två jobb i stället för ett.

HERMETIKEN ÄR OFÖRSVAGAD — den enda reella risken med åtgärd 1, och den är stängd med mätning: en snabbare gate kunde teoretiskt låta ett test avslutas INNAN det hunnit göra sitt omockade anrop, vilket hade gjort självtestet grönt på fel grund. Kört på 7 filer med seamen aktiv: "65 tester · 65 fällda · 65 med OmockadRequestError som orsak — BEVISET HÅLLER".

DIVERGENSER MOT UPPDRAGETS PREMISSER (ADR-086), samtliga prövade mot faktiskt tillstånd:
1) Uppdraget angav #1428 = 12,08 min och #1434 = 12,28 min. Jobbsteg-mätningen visar det OMVÄNDA: #1428 = 12,28 och #1434 = 12,08. Substansen (båda cancelled mot taket) håller; talen var parvis omkastade.
2) Uppdraget angav 9,66-11,70 min för "de tolv senaste" post-merge-körningarna. Endast 7 av de 16 senaste bär Acceptance-jobbet alls, och deras spann är 8,42-11,60 min. Undre gränsen är alltså lägre än angivet.
3) Uppdraget nämnde bara Acceptance för #1428. Den körningen hade ÄVEN "Staging (API + E2E)" som failure — inte enbart ett acceptance-ärende.
4) FÄRSKARE ÄN UPPDRAGET: TASK-249.5 (merge 2650b42c, landad medan detta arbete pågick) raderade döda acceptance-tester. Klassen är nu 217 tester i 36 filer, ner från 233 i 40 — verifierat med --list på 9dde7244. All mätning ovan gjordes på 233-svit; den nya siffran gör marginalen bättre, inte sämre, men talen ska läsas mot 233.

AC #2 EJ AVBOCKAD HÄRIFRÅN, med avsikt — samma precedent som task-236:s AC4: kriteriet kräver en MÄTT marginal (>2 min till taket), och den mätningen existerar först i post-merge efter landning. Åtgärden är byggd och verifierad; talet är CI:s att fastställa. Projektion att pröva mot: taket mäter nu ett jobb i taget — skarp svit svans 352 s minus gatens ~62 s ≈ 4,8 min, självtest svans 313 s ≈ 5,2 min, båda mot 12 min. Faller de ut som projicerat är marginalen ~7 min, och AC #2 kan bockas på det belägget.

#1476-BENET: bedömt att INTE tillhöra detta korts klass (annat jobb, annan testklass, annan mekanism) → eget kort TASK-256 mintat i stället för en post här.

GRINDAR (varv 2, lokalt, exitkoder fångade separat): actionlint -color -ignore 'unexpected key "queue"...' = 0 · yamllint -c .yamllint.yml ci-suite.yml = 0 · npm run typecheck = 0 · npx @biomejs/biome check . = 0 · npm run build = 0 · npm run test:api = 0 (862 passed, 2.2m) · npm run verify:ci-parity -- --list = 0 (och 2 i den riggade negativa kontrollen) · acceptance-delmängd 8 filer/66 tester = 0 · hermetik-självtest 7 filer/65 tester = 0.

═══════════════════════════════════════════════════════════════
VARV 3 (2026-09-02) — ORGANISK TILLVÄXT ÅT UPP MARGINALEN IGEN, SHARDAT.

PREMISS-PASS (ADR-086): uppdragets run-ID:n och tider PRÖVADE mot gh api,
INTE antagna. #2209:s två merge_group-körningar bekräftade exakt:
33613134860 (Acceptance-jobbet 09:15:58→09:28:09 = 12m11s, cancelled) och
33614762259 (09:33:50→09:45:59 = 12m09s, cancelled) — mönstret matchade,
men de EXAKTA sekundtalen i uppdraget var en approximation ("12m9s" för
den andra) mot mätta 12m09s (nästan exakt). Ingen substantiell divergens.

NY MÄTNING (organisk tillväxt, INTE varv 2:s warmup-gate): acceptance-
klassen växte 233 → 461 tester (+98 %) mellan 2026-08-17 (varv 2:s
mätpunkt) och 2026-09-02 (npx playwright test --project=acceptance --list,
disk-verifierat). En RENODLAD (icke kö-belastad) PR-CI-körning för PR #2209
tog 461 s (7m41s) i den skarpa sviten ENSAM — redan mer än HELA varv 2:s
projicerade ~7 min marginal. Under samtidig kö-last (flera parallella fulla
sviter, se Del "PREMISS-PASS") blev det värre: cancelled på taket båda
gångerna.

ÅTGÄRD: Playwrights INBYGGDA `--shard=I/N` (INTE en tredje strukturell
jobb-klyvning — den hävstången, som varv 2 använde för att separera
hermetik-självtestet, är förbrukad: det finns bara EN skarp svit kvar i
`acceptance`-jobbet). `strategy.matrix.shard` i ci-suite.yml, villkorad på
SAMMA `inputs.acceptance_selection` steget redan konsumerar: tom urval
(full klass, den enda ytan som sett cancellationerna) ⇒ 3 shards; satt
urval (PR-ytans delmängd) ⇒ 1 shard, oförändrat beteende.

KORREKTHET VERIFIERAD LOKALT (--list, ingen körning, disk-fakta):
  shard 1/3: 155 tester, 21 filer
  shard 2/3: 166 tester, 13 filer
  shard 3/3: 140 tester, 19 filer
  SUMMA: 461 tester, 53 filer — matchar full klass EXAKT, ingen
  fil delad mellan shards (Playwrights `createTestGroups` grupperar per
  fil, läst i den installerade 1.62.1:ans källkod:
  node_modules/playwright/lib/runner/index.js). `--shard=1/1` gav 461/53
  — bekräftar no-op-shard-egenskapen `.ci-parity-policy.json`s nya
  exprSubstitutions (matrix.shard→"1", strategy.job-total→"1") vilar på.
  Tom shard fäller ALDRIG "no tests found" (samma källa rad ~6178
  undantar uttryckligen `config.shard`-läget), så URVAL-grenen (alltid
  1 shard i denna design) är riskfri även om den någon gång skulle sköta.

REAL KÖRNING LOKALT (inte CI, labeled därefter): shard 1/3 (155 tester)
kördes skarpt — 155 passed (3.0m lokalt, 705 % CPU, flera workers). Bevisar
att `npm run test:acceptance -- --shard=I/N`-formen fungerar end-to-end
(dev-server, hermetik-vakt, warmup-gate). Lokal tid är INTE en CI-mätning
(CLAUDE.md § "En lokal mätning projicerad till CI är inte en mätning") —
den riktiga per-shard-väggklockan hämtas ur DENNA PR:s egen CI-körning,
se PR-kroppen.

TAKET RÖRDES INTE (12 min, oförändrat på båda jobben — AC #2:s krav
"utan reflexmässig takhöjning").

GRINDAR (varv 3, lokalt, exitkoder fångade separat):
  actionlint -color -ignore 'unexpected key "queue"...' = 0
  yamllint -c .yamllint.yml ci-suite.yml = 0
  npm run verify:ci-parity:fast = 0 (33 gröna, 3 skippade --fast, 814,2 s)
  npm run typecheck = 0
  npx @biomejs/biome check . = 0 (pre-existing 14 warnings/81 infos, inga
  nya, inga i rörda filer)
  npm run build = 0
  Direkt funktionsverifiering av exprSubstitutions (losStegEnv +
  hittaOhanteradeUttryck importerade från scripts/verify-ci-parity.mjs):
  ACCEPTANCE_SHARD_INDEX/TOTAL → "1"/"1", noll ohanterade uttryck.
  test:api EJ körd — diffen rör uteslutande .github/workflows/ci-suite.yml
  + .ci-parity-policy.json, inga src/-filer. check-langa-streck.mjs EJ
  körd av samma skäl (grinden gäller src/, orört).

AC #2 EJ AVBOCKAD HÄRIFRÅN, med samma precedent som varv 2 (och
task-236:s AC4): kriteriet kräver >2 min marginal MÄTT ur PR-CI:ns
`gh run view --json jobs`, och den mätningen finns först efter push. Följs
upp i en uppföljningscommit med de riktiga shard-tiderna om marginalen
håller.

AC #2 BOCKAD — MÄTT UR PR #2216:s EGEN CI-KÖRNING (run 33619073362,
pull_request-ytan, ingen samtidig kö-last), gh api .../actions/runs/
33619073362/jobs:

  Acceptance (hermetisk) (1) — 155 tester: 10:22:11→10:26:44 = 4m33s
    (273s) → marginal 7m27s (~7,45 min) mot 12-min-taket
  Acceptance (hermetisk) (2) — 166 tester: 10:22:10→10:26:24 = 4m14s
    (254s) → marginal 7m46s (~7,77 min)
  Acceptance (hermetisk) (3) — 140 tester: 10:22:10→10:26:19 = 4m9s
    (249s) → marginal 7m51s (~7,85 min)

Samtliga tre shards >7 min marginal — långt över AC #2:s krav (>2 min),
taket 12 min ORÖRT. CI grönt per jobb på PR:en: Lint+Audit+TypeCheck,
Pure+Build, Webblasarbeteende (2m8s), samtliga tre Acceptance-shards,
Acceptance-sjalvtest, CI Passed or Skipped.

OVÄNTAT FYND (ADR-053, registrerat — INTE åtgärdat i denna skiva,
uppdraget scopade explicit bort acceptance-sjalvtest-jobbet): SAMMA
CI-run visar acceptance-sjalvtest-jobbet (oshardat, kör hela 461-
testklassen) på 11m15s (675s) — bara 45 SEKUNDERS marginal mot sitt
EGNA, oförändrade 12-min-tak, i en RENODLAD pull_request-körning UTAN
kö-last (alltså ett golv, inte ett värsta-fall). Samma organiska
tillväxt-mekanism som orsakade acceptance-jobbets cancellation gäller
detta jobb lika mycket, och det har ingen shard-marginal alls kvar.
Rekommendation till orkestreraren: mint ett uppföljningskort som
applicerar samma (eller motsvarande) sharding-mönster på
acceptance-sjalvtest INNAN nästa organiska tillväxt-våg — annars är det
sannolikt nästa jobb som kö-sparkar en PR, samma mönster som denna
skiva just löste för acceptance-jobbet.

AC #3 (tre gröna nätter) kvarstår öppen — kan inte bockas idag, kräver
nattnätets tre körningar EFTER denna PR landat.

PR: #2216, branch ci/task-239-acceptance-marginal-shard, head
b8d97bcf (uppdaterad PR-kropp, ingen ny commit för denna anteckning).

═══════════════════════════════════════════════════════════════
MERGEBAR-GÖRNING (2026-09-02) — r1-fyndet betalt, PR #2216 uppdaterad.
═══════════════════════════════════════════════════════════════

Granskningens runda 1-fynd (orelaterade rader i docs/reference/review-instrumentering.jsonl, DoD #4 felaktigt bockad) åtgärdat: mergade origin/main (701cfc9c) in i grenen och löste konflikten i den filen genom att ta main-versionen rakt av (git checkout origin/main -- <fil>) — diffen mot origin/main för filen var TOM direkt efter, verifierat. DoD #4 nu sann.

Full npm run verify:ci-parity kördes (info-fyndets krav: fullt läge, inte --fast, eftersom PR:en ändrar ci-suite.yml). Utfall: 34 gröna, 2 röda, 1711,8 s. Röda: Acceptance 459/461 (hem.acceptance.test.ts:313, mer-platser.acceptance.test.ts:68), Webblasarbeteende 108/109 (forberedelseskarm-hojdkedja.test.ts:166) — samtliga tre filer ligger UTANFÖR denna PR:s diff. Isolerad omkörning via fil:rad gav ERR_CONNECTION_REFUSED (dev-servern på port 18399 startas inte tillförlitligt av en delmängdskörning — samma klass av lokal-loadavg-artefakt som varv 1 redan bokförde ovan för test-ci-wait/acceptance-specs). CI på PR-ytans egen körning (0ddcc3f0) är grön: tre gröna Acceptance-shards + Webblasarbeteende pass. Klassat av orkestreraren som last-/timing-flake under den 28-minuters lokala helkörningen, inte en regression av denna PR:s diff.

PR-kroppens grindtabell uppdaterad: :fast-raden ersatt med den fulla körningens faktiska utfall (se ovan).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 680173e1 · PR #2216 (MERGED 2026-09-02T12:22:02Z, senast granskad SHA 284f82ae r2) · Post-merge-workflow för 680173e1 (run 33629519948) COMPLETED SUCCESS, 11m53s. Granskningsloop konvergerad: r1 LÅG (2 fynd: orelaterade instrumenteringsrader i docs/reference/review-instrumentering.jsonl + full paritet ej körd), r2 LÅG (2 info, båda r1-fynd verifierat stängda — merge-commiten tog origin/main:s version av jsonl-filen rakt av, tvåparents-diff tom).

AC-status: AC1 håller — tillväxtens orsak (organisk testantal-tillväxt 233→461, +98 %) identifierad med mätning, inte antagen (kortets Implementation Notes VARV 3). AC2 håller — åtgärden (Playwrights inbyggda --shard=I/N, 3 shards vid tomt urval / 1 shard oförändrat vid PR-scopat urval) återtar marginalen utan att röra 12-min-taket: MÄTT ur PR #2216:s egen CI-körning (run 33619073362), samtliga tre shards >7 min marginal (shard 1 4m33s→7m27s marginal, shard 2 4m14s→7m46s, shard 3 4m9s→7m51s). AC4 håller — ci-suite.yml:s webblasarbeteende-artefaktsteg fick samma failure()||cancelled()-villkor (kortets Implementation Notes VARV 1, oförändrat sedan dess). AC3 (Acceptance grön i nattnätet TRE nätter i rad efter åtgärd) är EJ BOCKNINGSBAR i denna stängning — kräver nattnätets tre körningar EFTER landning (680173e1, 2026-09-02T12:22Z); ingen nightly har hunnit köra tre gånger. Lämnad OBOCKAD med avsikt, samma precedent som kortets egen AC2-hantering i varv 2/3. DoD #1 (alla AC avbockade) lämnas därför också obockad — den är sann först när AC3 är det. DoD #3 (CI grön per jobb på pushad commit) BOCKAD: PR #2216:s statusCheckRollup är grön per jobb (Lint+Audit+TypeCheck, Pure+Build, tre Acceptance-shards, hermetik-självtest, Webblasarbeteende, Docs link check, CodeQL, CI Passed or Skipped; Staging/A11y SKIPPED per D0-klassning).

MERGEBAR-GÖRNING (samma dag, dokumenterad i kortet): full npm run verify:ci-parity kördes (fullt läge, eftersom PR:en ändrar ci-suite.yml) — 34 gröna, 2 röda, 1711,8 s under loadavg ~21. De två röda låg i tre testfiler HELT UTANFÖR denna PR:s diff (hem.acceptance.test.ts, mer-platser.acceptance.test.ts, forberedelseskarm-hojdkedja.test.ts) — klassat som last-/timing-flake under den 28-minuters lokala helkörningen, inte en regression av diffen; PR-ytans egen CI (0ddcc3f0) var grön med tre Acceptance-shards + Webblasarbeteende.

Oväntat fynd, registrerat i kortet men EJ åtgärdat i denna skiva (uppdraget scopade explicit bort det): samma CI-run visar acceptance-sjalvtest-jobbet (oshardat, kör hela 461-testklassen) på 11m15s — bara 45 sekunders marginal mot sitt eget oförändrade 12-min-tak, i en renodlad pull_request-körning utan kö-last. Samma organiska tillväxt-mekanism riskerar att kö-sparka detta jobb näst. Rekommendation (redan i kortet): mint ett uppföljningskort för sharding av acceptance-sjalvtest.

Landning: PR #2216. Avvikelse: AC3 kvarstår öppen och obockad — dokumenterat ovan, inte en tyst brist.
<!-- SECTION:FINAL_SUMMARY:END -->
