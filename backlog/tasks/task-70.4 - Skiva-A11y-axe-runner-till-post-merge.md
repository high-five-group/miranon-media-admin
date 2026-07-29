---
id: TASK-70.4
title: 'Skiva: A11y (axe-runner) till post-merge'
status: To Do
assignee: []
created_date: '2026-07-28 16:33'
updated_date: '2026-07-29 01:00'
labels:
  - ready-for-agent
dependencies:
  - TASK-70.2
  - TASK-70.5
parent_task_id: TASK-70
ordinal: 147000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Samma rörelse som A7:5, mindre yta. A11y (axe-runner) bär 103 s mätt (run 30369011230) och kör i dag i den blockerande PR-grinden (ci-suite.yml rad 238-280).

KRÄVER A7:4 OCH A7:7 av samma skäl som A7:5: lagret måste finnas att flytta TILL, och vägen tillbaka måste vara skriven och övad.

### VAD SOM FAKTISKT VINNS — RÄKNA INTE 103 s PÅ VÄGGKLOCKAN

Åtgärdsplanen skriver minus 103 s. Det talet är JOBBETS EGEN TID, inte kritisk väg. A11y kör parallellt med Acceptance (hermetisk), som bär 404-452 s (ci-suite.yml rad 137-139). A11y ligger alltså inte i den kritiska vägen vare sig före eller efter A7:5, och flytten ger noll sekunder på väggklockan för en kod-PR.

Vinsten är runner-minuter och en smalare blockerande grind — inte snabbare svar. Redovisa den i den enheten. Ett kort som lovar 103 sparade sekunder och levererar noll ser ut att ha misslyckats trots att det gjort exakt rätt sak.

### ATT VETA OM JOBBET

A11y rör ALDRIG staging: egen alltid-färsk dev-server på dedikerad port (ADR-045 beslut 1+3), därför ingen mutex. Flytten tar alltså inte bort någon kö-tid — till skillnad från A7:5, där mutexen var hela poängen.

Jobbet har ett dependabot-skip på jobbnivå (ci-suite.yml rad 240) och läser secrets TEST_SUPABASE_URL och TEST_SUPABASE_ANON_KEY. Båda måste följa med till post-merge-ytan, annars faller jobbet tyst eller rött av fel skäl.

### ÄNDRAR BETEENDE

Tillgänglighetsregressioner fångas EFTER merge i stället för före. Repots kvalitetsribba säger att tillgänglighet alltid är 11 utan undantag — den ribban ändras INTE av denna skiva, bara tidpunkten då den mäts. Skillnaden är värd att hålla isär, särskilt om någon senare läser kortet och tror att ribban sänkts.

VID FÖRSTA SKARPA LANDNINGEN EFTERÅT, OBSERVERA:

- att a11y-jobbet faktiskt KÖRDES i post-merge och inte tyst föll bort på en saknad secret,
- att ett rött a11y post-merge öppnar ärende på samma väg som övriga post-merge-fel,
- att nattnätet fortfarande kör a11y.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A11y (axe-runner) förekommer INTE i jobblistan för en kod-PR:s ci.yml-körning — gh run view --json jobs, run-ID redovisat
- [x] #2 A11y körs i post-merge-lagret OCH i nightly.yml — ett grönt run-ID per yta redovisat
- [x] #3 Secrets och dependabot-villkoret följde med: post-merge-körningen visar a11y-STEGET kört, inte skippat och inte rött på saknad secret
- [x] #4 Kod-PR:ens kritiska väg mätt före och efter — förväntat OFÖRÄNDRAD eftersom Acceptance dominerar. Avvikelse från det förklaras i stället för att bokföras som vinst
- [x] #5 Vinsten redovisad i rätt enhet: sparade runner-minuter per kod-PR, inte sparad väggklocka
- [x] #6 CI Passed or Skipped är fortfarande enda required check i ruleset 19627609, och gate-proof.yml körd grön efter ci.yml-ändringen
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

Samma form som A7:5 men lägre insats: jobbet håller ingen mutex, blockerar inget annat jobb och rör inte staging. Verifieringen är jobblistor och run-ID, alltså mekanisk rakt igenom.

Den enda punkt som kunde motivera human-etikett är att tillgänglighet är repots enda kvalitetsaxel utan undantag — men det gäller RIBBAN, inte MÄTPUNKTEN. Ribban ändras inte här. Att flytta mätpunkten är samma beslut Marcus redan godkänt i åtgärdsplanen, och utförandet kräver inget omdöme utöver det.
<!-- SECTION:PLAN:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-29 01:00
---
MÄTNINGAR — allt i CI, inget lokalt projicerat. Kod + följdändringar: commit 339520d, PR #409, gren ci/task-70.4-a11y-ur-pr-grinden.

AC#1 — run 30412311407 (PR #409; kod-klass eftersom diffen rör .github/workflows/**, som är exkluderad ur D0, D1 och acceptance_local). A11y-jobbet: conclusion=skipped, runner_id=null, runner_name=null, steps=0, started_at == completed_at (00:50:18Z) — signaturen för ett jobb som aldrig dispatchades till en runner. `gh pr checks 409` visar det som "skipping 0", samma rad som de två staging-jobben. KONTRAST på trädet FÖRE ändringen (run 30408622828, PR #395, samma kod-klass): runner_name "GitHub Actions 1000002739", steps=11, 23:39:15Z->23:40:59Z = 104 s.
AVVIKELSE MOT AC:NS BOKSTAV, ej tyst — IDENTISK med TASK-70.3:s AC#1: jobbet FÖREKOMMER i jobblistan, som skippad placeholder. Literal frånvaro hade krävt radering ur ci-suite.yml, precis den form kortets egen beskrivning förbjuder (nattnätet och post-merge anropar samma källa utan input). Kriteriets AVSIKT — att a11y inte ska KÖRA i den blockerande grinden — är uppfylld i mätbar substans: noll runner, noll steg, noll sekunder. Bedömningen om bokstav vs rationale tillhör orkestreraren.

AC#2 — a11y körs FORTFARANDE på båda de andra ytorna, verifierat med ändringen på grenen:
  post-merge.yml  run 30412332377  conclusion=success  ·  a11y 00:50:46Z->00:52:41Z = 115 s success
  nightly.yml     run 30412630692  a11y 00:56:47Z->00:58:33Z = 106 s success
Båda är workflow_dispatch mot grenen, inte push/schedule — det är den enda formen som kan köra de två ytorna på ett OMERGAT träd, och den är samma form TASK-70.3 använde för sin AC#2. Den skarpa push-drivna post-merge-körningen kommer efter merge och är orkestrerarens verifikation.

AC#3 — post-merge-körningens a11y-jobb visar STEGET kört, inte skippat och inte rött på saknad secret: samtliga 11 steg gröna, inklusive steg 7 "A11y tests (axe-runner) => success". Loggen: "Running 74 tests using 2 workers" -> "74 passed (1.4m)" — samma testantal som lokalt (74 passed, exit 0), alltså full svit, ingen tom körning. Secrets följde med utan åtgärd just för att jobbet INTE flyttades: TEST_SUPABASE_URL/ANON_KEY når det via anroparnas `secrets: inherit` som förut.
ÄRLIG BEGRÄNSNING: dependabot-halvan av villkoret är verifierad genom INSPEKTION, inte genom en körning — uttrycket `github.actor != 'dependabot[bot]'` står kvar oförändrat och det nya villkoret lades BREDVID det, inte i stället för. Ingen dependabot-körning har passerat sedan ändringen.

AC#4 — kritiska vägen, mätt före och efter:
  FÖRE  run 30408622828: 23:38:32Z->23:46:26Z = 474 s. Bärare Acceptance (hermetisk) 23:39:10Z->23:46:14Z = 424 s. A11y parallellt 23:39:15Z->23:40:59Z = 104 s, KLAR 315 s före acceptance.
  EFTER run 30412311407: 00:50:09Z->00:57:14Z = 425 s. Bärare Acceptance (hermetisk) 410 s.
Bäraren är OFÖRÄNDRAD — Acceptance (hermetisk) i båda. 424 -> 410 s = -14 s (-3,3 %), inom jobbets egen dokumenterade spridning (404/407/452 s, ci-suite.yml). Väggklockans -49 s går alltså INTE på a11y-flyttens konto: a11y låg 315 s från kritiska vägen och kunde per konstruktion inte bidra med en sekund. Kortets förväntan — noll sekunders vinst på väggklockan — är bekräftad, inte tolkad.

AC#5 — vinsten i rätt enhet: RUNNER-MINUTER, inte väggklocka. 104 s mätt jobbtid per ci.yml-körning som annars instansierat jobbet = 1,73 min. En landad kod-PR ger minst TVÅ sådana körningar (pull_request + merge_group) => ca 3,5 min per landning, plus 1,73 min per extra push till grenen. Talet står skrivet i CONTRIBUTING.md § Post-merge-lagret, i ci.yml:s kommentar och i commit-meddelandet — i den enheten, aldrig som sparad väggklocka.
EJ MÄTT, deklarerat: merge_group-multiplikatorn. Kön aktiverades i kväll (TASK-70.1) och ingen kod-PR har ännu passerat den — samtliga kö-körningar hittills är docs, där hela sviten skippas ändå. Denna PR blir första mätpunkten; talet 2x är härlett ur ci.yml:s villkor, inte observerat.
NOT: main-pushen efter merge sparar ingenting, eftersom dedup_hit redan släckte hela svit-anropet där.

AC#6 — ruleset 19627609 (main-skydd) har fortfarande exakt EN required status check: "CI Passed or Skipped", strict=true. Verifierat med gh api EFTER ändringen. gate-proof.yml körd på grenen i BÅDA riktningar:
  30412319790 (positiv, simulate_skip=false) GRÖN — paraply-repliken körde (always()) OCH dess fail-closed-gren blev failure på ett rött jobb.
  30412384966 (negativ kontroll, simulate_skip=true) RÖD — repliken skippades och assert-jobbet fällde. Beviset är alltså inte vakuöst.

LOKALA GRINDAR, rörd fil-klass + kod-klassen som kontroll: actionlint med CI:s exakta -ignore exit 0 · yamllint .github/ exit 0 · check:docs 9 gröna exit 0 · test-classify-post-merge.sh 17/17 · check-fetch-depth-invariant.sh exit 0 (5 bärare == 0) · typecheck exit 0 · biome exit 0 · build exit 0 · test:api:pure exit 0 · test:a11y lokalt 74 passed exit 0. ci-wait.sh --commit 339520d exit 0, GRÖN per jobb.

FYND UTANFÖR SCOPET — redan bokfört, ej nytt: purge-racet (TASK-76) fällde TASK-70.3:s post-merge-dispatch (run 30406325230, Airtable DELETE 404) och öppnade ärende #398, som fortfarande är öppet. Denna skivas två dispatchar kördes därför SEKVENTIELLT, med noll överlappande purge — båda gröna. Racet är oförändrat av denna skiva.
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
