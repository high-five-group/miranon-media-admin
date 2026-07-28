---
id: TASK-70.2
title: 'Skiva: Post-merge-lagret på main — förkrav för att flytta något ur PR-grinden'
status: To Do
assignee: []
created_date: '2026-07-28 16:32'
updated_date: '2026-07-28 19:20'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-70
ordinal: 145000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FÖRKRAV FÖR A7:5 OCH A7:6. Utan detta lager finns inget skyddsnät att flytta kontroller TILL.

I dag finns i praktiken ingen verifiering efter merge. dedup_hit (ci.yml rad 519-523) gör att en main-push vars träd redan bevisats grönt i PR:en hoppar över hela svit-anropet — main-push kör alltså MINDRE än PR:en gjorde. Mellan merge och nattkörningen (nightly.yml, cron 0 3 varje natt) finns ingenting.

### OMFATTNING

Ny fil .github/workflows/post-merge.yml som triggar på push till main och kör det verifierande lagret. Skivan är ADDITIV: den tar inte bort något ur PR-grinden. Flyttarna är A7:5 och A7:6, och de har detta kort som dep.

Rött post-merge ska öppna ett tilldelat ärende med revert-förslag. Formen finns redan att kopiera: nightly.yml jobbet alarm (rad 322) och jobbet links-arende (rad 150).

### SKARV MOT BEFINTLIG MEKANIK — LÄS FÖRE DESIGN

1. ci.yml kör REDAN på push till main (rad 7-8). Post-merge-lagret får inte dubblera det ci.yml gör, och får inte heller förlita sig på det: dedupen släcker just de tunga jobben.
2. ci-suite.yml är EN KÄLLA, delad av ci.yml (presubmit) och nightly.yml (fullsvit). Anropas den härifrån ärvs den delningen. Läs kommentaren i ci-suite.yml rad 4-19 innan något ändras där.
3. Mutexen staging-tests (ci-suite.yml rad 300-302) är en global FIFO över allt som rör staging — PR, main-push och natt. Ett post-merge-jobb som kör staging köar i samma kö och konkurrerar med PR-körningar.
4. Får INTE bli required check. Rulesetet 19627609 har exakt en: CI Passed or Skipped. Hela poängen med lagret är att det inte blockerar.
5. fetch-depth-invarianten (scripts/check-fetch-depth-invariant.sh) räknar EXPECTED_CI_CARRIERS=3 och läser ENBART ci.yml — en ny fil ligger utanför den namngivna mängden och bryter alltså inte grinden. Behöver post-merge git-historik gäller ändå samma fetch-depth 0-krav som ci.yml:s bärare.

### VAD SOM MÅSTE MÄTAS OCH SKRIVAS NER

Tiden från merge till post-merge-svar. Det talet är exponeringsfönstret — hur länge ett fel kan ligga oupptäckt i main — och det är siffran A7:5 och A7:6 lutar sig mot när de tar bort blockerande kontroller. Utan den mätningen är de två skivorna obelagda.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 .github/workflows/post-merge.yml finns, triggar på push till main och kör grönt — run-ID redovisat
- [ ] #2 Jobbet är INTE listat i required_status_checks för ruleset 19627609 — verifierat mot gh api EFTER landning, utdata redovisat
- [ ] #3 PR-grinden är ORÖRD av denna skiva: en kod-PR:s jobblista är identisk före och efter, och CI Passed or Skipped har oförändrade needs
- [ ] #4 Tvåsidigt bevis: lagret är visat FÄLLA på en avsiktligt bruten commit — i gate-proof.yml:s form — inte bara visat grönt
- [ ] #5 Rött post-merge öppnar ett tilldelat ärende med revert-förslag, bevisat skarpt med ärendenummer redovisat
- [x] #6 nightly.yml är orörd: dess anrop av ci-suite.yml utan run_staging-input kör fortfarande full svit
- [ ] #7 Tiden från merge till post-merge-svar är mätt i CI och redovisad som tal — det är exponeringsfönstret A7:5 och A7:6 lutar sig mot
- [ ] #8 Antalet körningar som tar concurrency-gruppen staging-tests per landad kod-PR är mätt före och efter, och ökningen redovisad
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

Skivan är additiv och mekaniskt verifierbar rakt igenom: en ny workflow-fil, ett run-ID som visar grönt, ett gh api-svar som visar att jobbet inte hamnat bland required checks, ett självtest som visar att lagret fäller, och ett tidtal ur CI. Inget av det kräver omdöme om vad som SER rätt ut.

Riskklassen som skulle motivera human-etikett saknas helt: skivan tar inte bort någon kontroll, ändrar ingen GitHub-inställning, rör inte rulesetet och kan per konstruktion inte blockera en landning — en icke-required workflow som failar stoppar ingenting.

Det enda som kräver noggrannhet är skarven mot dedup och mot den delade ci-suite.yml, och båda är lästa filer med radhänvisningar i beskrivningen.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGT 2026-07-28 (S91). EN ny fil: .github/workflows/post-merge.yml. Inga andra filer rörda — ci.yml, ci-suite.yml och nightly.yml har noll diff-rader mot origin/main.

FORM. push till main + workflow_dispatch. Fyra jobb:
  · suite — anropar ci-suite.yml (EN KÄLLA) UTAN run_staging-input ⇒ default true, samma form som nightly.yml. Bär permissions: contents: read (L326: ett anropat workflow kan inte eskalera anroparens permissions; tredje anroparen).
  · sjalvtest — normalt SKIPPAT. Instansieras bara av dispatch med simulate_failure=true och failar då genuint, så larmkedjan prövas mot ett ÄKTA failure-resultat i needs. Skarpare än nightly.yml:s simulate_failure, som går runt sitt needs-villkor via larmets if-uttryck och därför bara bevisar att ärendet KAN skapas — inte att en röd svit utlöser det.
  · exponeringsfonster — if: always(), permissions: {}, ingen checkout. Räknar merge-commitens tidsstämpel mot nu och skriver talet till step-summary VARJE körning.
  · larm — if: always() + contains(failure/cancelled). Tilldelat ärende (marcus803), etikett ci-post-merge, med revert-förslag.

ICKE-DUBBLERING (kortets skarv-punkt 1). ci.yml:s lint-jobb kör ovillkorat på varje main-push och docs-jobbet på docs-ändringar; post-merge rör inget av det och kör ENBART den tunga sviten — exakt det lager dedupen släcker. Den förlitar sig heller inte på ci.yml:s main-push-körning: sviten anropas oavsett vad dedupen beslutade.

FETCH-DEPTH-INVARIANTEN ORÖRD (kortets skarv-punkt 5). post-merge.yml har NOLL checkout-steg i egna jobb — larmet läser github-kontexten och API:t i stället för git-historik. scripts/check-fetch-depth-invariant.sh exit 0, "alla 5 levande bärare == 0".

MÄTT UTGÅNGSLÄGE FÖR AC#8 (före-talet), 2026-07-28:
  · Landad kod-PR #366, merge-commit 4543d186. PR-körningen 30389547241 tog staging-tests EN gång (Test suite / Staging (API + E2E), 18:55:07→19:01:16 = 369 s).
  · Main-push-körningen 30390109862 för samma merge-commit: Test suite = skipped (dedup-träff) ⇒ NOLL takers. Samma bild i 30387387718.
  · FÖRE = 1 körning per landad kod-PR. EFTER = 2 (PR + post-merge). Ökning +1, alltså 100 %.
  · Talet är ÖVERGÅNGSVIS: A7:5 (TASK-70.3) flyttar staging ur PR-grinden och återställer det till 1. Vill man sänka i förtid är levern ETT ord — with: {run_staging: false} på suite-jobbet — vilket behåller acceptance + a11y + pure/build på det mergade trädet men avstår staging. Levern står skriven i filens huvud i stället för att tyst utövas.

FLAKE-BETEENDET — UNDERLAG, INGET BESLUT FATTAT HÄR (uppdragets beställning).
Larmet är byggt som kortet föreskriver: rött ⇒ ärende direkt, ingen fördröjning. Med TASK-64 öppen betyder det att en flake i acceptance-sviten kan ge ett falskt ärende. Tre saker dämpar det utan att dölja äkta fel, och alla tre är byggda:
  1. Ärendet namnger de RÖDA JOBBEN. En ensam röd Acceptance (hermetisk) är omedelbart skiljbar från rött staging/bygg.
  2. Ärendet bär föregående post-merge-körnings utfall. Var den grön ⇒ denna landning är misstänkt. Var den röd ⇒ felet är äldre, och ärendet säger uttryckligen "revertera inte reflexmässigt".
  3. Ärendet bär en tolkningshjälp som pekar ut TASK-64 vid ensamt rött acceptance-jobb och rekommenderar omkörning före revert.
DÄREMOT: risken är sannolikt mindre än den ser ut. playwright.config.ts sätter retries: 2 i CI, så ett test som faller och lyckas på omkörning rapporteras som flaky, inte failed, och jobbet blir GRÖNT. TASK-64:s fyra datapunkter är alla från --retries=0-körningar. En falsk röd post-merge kräver alltså att samma test faller TRE gånger i rad — ej observerat i repot.
DEN ALTERNATIVA FORMEN, för Marcus/orkestrerarens beslut: larma först vid "rött TVÅ körningar i rad" (nattnätets links-arende-mönster). Kostnaden är konkret och bör vägas: två på varandra följande post-merge-körningar ligger på OLIKA commits, så (a) ett äkta fel upptäcks först en landning senare — vilket direkt vidgar exponeringsfönstret som AC#7 mäter och som A7:5/A7:6 lutar sig mot — och (b) revert-förslaget skulle peka på fel commit när två olika fel råkar följa på varandra. Rekommendationen är därför att BEHÅLLA direktlarmet och låta TASK-64 laga grundorsaken; ett falsklarm här kostar en omkörning, ett fördröjt larm kostar exponeringstid.

ÖPPET BOKFÖRD BEGRÄNSNING. Larm-jobbet bor inne i den körning det bevakar och kan därför inte larma vid startup_failure (noll jobb instansieras) — samma defekt nightly-watchdog.yml byggdes för på nattsidan. Motsvarande vakt för post-merge finns INTE och är medvetet inte byggd här; den hör till en egen avvägning. Bokförd, inte antagen bort.

LOKALA GRINDAR, MÄTTA EXITKODER 2026-07-28:
  actionlint -color -ignore 'unexpected key "queue" for "concurrency" section' = 0 (verbose bekräftar att post-merge.yml lintades)
  yamllint .github/ = 0 · npx @biomejs/biome check . = 0 · npm run typecheck = 0 · npm run build = 0 · npm run test:api = 0 (419 passed)
  bash scripts/check-fetch-depth-invariant.sh = 0
TVÅSIDIGT BEVIS PÅ DEN EGNA LINTNINGEN: en injicerad shellcheck-defekt (oquoterad variabel) i larm-steget gav actionlint exit 1 med SC2086 — grinden fäller alltså när den ska, den är inte grön av frånvaro.
LARM-LOGIKEN PRÖVAD LOKALT mot mockat gh i fyra scenarier: (A) föregående grön + merge-commit + inget befintligt ärende ⇒ nytt ärende, revert-förslag "git revert -m 1"; (B) föregående röd + enkel commit + befintligt ärende för samma träd ⇒ kommentar i stället för nytt ärende, "git revert" utan -m 1, SIMULERAT-noten närvarande; (C) gh run list OCH gh api failar ⇒ historiken rapporteras OKÄND och revert-formen hedgas, ärendet skapas ändå (frånvaro blir aldrig ett faktapåstående); (D) gh issue list failar ⇒ steget exit 1, fäller högljutt i stället för att fortsätta tyst.
EJ PRÖVBART LOKALT: GNU dates `-d`-parsning av ISO8601-tidsstämpeln (macOS har BSD date; ingen gdate, ingen docker). Grenlogiken är prövad via shim; själva parsningen verifieras först i CI, och ett fel där ger ett RÖTT exponeringsfonster-jobb som larmet fångar — inte en tyst felaktig siffra.

REPO-TILLSTÅND ÄNDRAT UTANFÖR DIFFEN: etiketten ci-post-merge skapad (gh label create, exit 0). Utan den failar gh issue create --label i larm-jobbet. Additiv och reversibel.

KAN INTE VERIFIERAS FÖRE LANDNING — workflow_dispatch kräver att workflowen finns på default-grenen, så AC #1/#4/#5/#7 och efter-halvan av #2/#8 kan först prövas när filen ligger i main. Ordning efter merge:
  1. AC#1 — gh run list --workflow post-merge.yml --branch main --event push --limit 1 (grön + run-ID).
  2. AC#7 — läs "Exponeringsfönster (merge → svar)" ur samma körnings step-summary.
  3. AC#8 efter-talet — räkna körningar som instansierar Staging (API + E2E) för den landningen (förväntat 2).
  4. AC#4+#5 — gh workflow run post-merge.yml -f simulate_failure=true; körningen ska bli RÖD, larmet fyra på ett äkta failure-resultat och ett tilldelat ci-post-merge-ärende skapas. Redovisa ärendenumret och städa det med motivering.
  5. AC#2 — gh api repos/high-five-group/miranon-media-admin/rulesets/19627609; required_status_checks ska fortfarande innehålla exakt "CI Passed or Skipped".
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
