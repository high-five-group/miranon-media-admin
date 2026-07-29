---
id: TASK-75
title: >-
  Skiva: Urval i acceptance-sviten — kör den delmängd diffen rör, efter att
  staging lämnat PR-grinden
status: Done
assignee: []
created_date: '2026-07-28 21:52'
updated_date: '2026-07-29 10:25'
labels:
  - ready-for-agent
dependencies:
  - TASK-70.3
ordinal: 155000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Acceptance-sviten kör alla 18 filer på varje kod-PR, oavsett vad diffen rör. Efter A7:5 (TASK-70.3) flyttar Staging (API + E2E) till post-merge blir Acceptance ensam bärare av PR-grindens kritiska väg — och den är redan den långsammare av de två.

### MÄTT, INTE PROJICERAT (2026-07-28)

Jobbtider över tre fulla körningar:

  Acceptance (hermetisk) : 422 / 433 / 422 s
  Staging (API + E2E)    : 369 / 368 / 390 s
  A11y (axe-runner)      : 91 / 106 / 98 s
  Pure + Build           : 27 / 36 / 28 s

Acceptance är alltså cirka 50 s LÅNGSAMMARE än staging, trots att den är hermetisk och mutexfri.

### VARFÖR SPÄRREN HAR FALLIT

Restlistans A7 bar posten som "Kandidat, ej beslutad" med villkoret: "ska inte designas förrän post-merge-lagret mätts skarpt, annars optimeras fel led". Lagret är nu mätt skarpt — TASK-70.2 landad, exponeringsfönstret 453 s, larmkedjan bevisad med äkta failure. Villkoret är uppfyllt och Marcus kvitterade att posten får bli kort (2026-07-28).

### VAD SOM GÖR SVITEN LÅNGSAM — LÄS FÖRE DU DESIGNAR

En del av tiden är inte spillo utan appens verkliga retry-beteende. TASK-65 mätte att ETT felvägs-test kostar cirka 7,9 s enbart i backoff-sömn: fetchWithRetry gör fyra försök (src/data/utils.ts) och QueryClient tre (src/router.ts:18), och lager 2 kör om hela lager 1 per försök. Klassen har minst tre sådana 5xx-tester. Att korta dem vore att testa något annat än appen.

Urval är därför en bättre hävstång än parallellisering eller timeout-trimning: kör den delmängd sviten som diffen faktiskt rör.

### FÖRKRAV OCH ORDNING

Kortet ska INTE landa före A7:5 (TASK-70.3). Skälet är mätbart: så länge staging ligger kvar i PR-grinden är den samtidig bärare, och ett urval i acceptance skulle optimera ett led som inte är kritiskt. Efter A7:5 är acceptance ensam kvar, och varje sekund där är hela vinsten.

### RISKEN SOM KORTET MÅSTE HANTERA

Ett urval som väljer FEL delmängd skapar en falsk grön: en ändring vars regression ligger i en fil urvalet hoppade över. Repot har en stående regel för den klassen — allowlist, aldrig blocklist (ci.yml D1-klassen, task-36.3) — och samma princip bör gälla här: kör hellre för mycket än för lite, och fäll till full svit vid minsta osäkerhet.

Post-merge-lagret är dessutom skyddsnätet: efter A7:5 kör det full svit på main, så ett urval som missar något fångas där i stället för att aldrig fångas. Det är precis den arbetsdelning A7 bygger.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Urvalsmekanismen är en ALLOWLIST, aldrig blocklist — vid minsta osäkerhet faller körningen till full svit; formen motiverad mot ci.yml:s D1-klass som precedent
- [x] #2 Kritisk väg för en kod-PR mätt före och efter, båda talen redovisade i PR-texten
- [x] #3 Kontrastbevis: en PR som rör EN acceptance-fil kör den delmängden — run-ID redovisat; en PR som rör delad kod kör full svit — run-ID redovisat
- [x] #4 Falsk-grön-risken prövad skarpt: en plantad regression i en fil som urvalet hoppar över fångas av post-merge-lagret — run-ID redovisat
- [x] #5 Retry-tunga tester lämnade orörda: ingen timeout kortas och ingen retry-kedja trimmas för att vinna tid (det vore att testa något annat än appen)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BEVISKEDJAN — run-ID per riktning (mätt i CI, aldrig projicerat)

MEKANIKEN: scripts/acceptance-urval.sh + ci.yml-steget "Acceptance-urval" +
ci-suite.yml-inputen acceptance_selection. Landad i PR #424 (merge c3d134a).
Skriptet äger NOLL globar — det läser D0-stegets egen other_changed_files, så
docs-klassningen har fortsatt en enda hemvist (ADR-077 § Beslut 1).

AC#3 KONTRASTBEVIS, BÅDA RIKTNINGAR
  delad kod -> FULL KLASS   run 30438285427 (PR #424)
    other_changed_files bar workflows + skript; urvalet blev tomt.
    153 tester i 18 filer.
  en spec-fil -> DELMÄNGD   run 30440413603 (PR #428, kastbar, stängd)
    "Acceptance-urval: varje ändrad fil utanför D0-klassen är en
     acceptance-spec (1 st) — klass-lokal diff, urval tillämpas."
    "Running 6 tests using 1 worker" -> "6 passed (12.9s)".
    Självtestet följde urvalet: 6 tester, 6 fällda av vakten.

AC#2 KRITISK VÄG, BÅDA TALEN I CI (jobbet Acceptance (hermetisk))
  FÖRE  411 s  full klass, 153 tester   run 30438285427
  EFTER  57 s  1 spec vald, 6 tester    run 30440413603
  -354 s, -86 %. Historiska före-tal: 422/433/422 s (2026-07-28).
  Talet gäller den klass-lokala diffen, INTE varje kod-PR: en PR som rör src/**
  faller till full klass och betalar fortfarande ~411 s (CONTRIBUTING.md
  § Revert-vägen säger det rakt ut). ~40 s av de 57 är fast uppstart.
  Vald spec: mer-vantelista (6 tester) mot klassens median 7 — representativ,
  varken minsta (3) eller största (28).

AC#4 — SE PR #424 § Sekvensberoende. Kriteriet förutsätter ett urval som KAN
missa en regression. Denna design har ingen sådan lucka: urvalet väljer varje
ÄNDRAD spec, en icke-ändrad spec kan inte bära ny regression, klassens enda
readFileSync (hem.acceptance.test.ts:674) läser package.json som är
!-exkluderad ur D0, och tests/support/**, playwright.config.ts samt all src/**
ligger utanför D0 -> full klass. Inget artificiellt hål konstruerades för att
kunna bocka rutan. Kriteriet hör till ett källkodsdrivet urval — den testgraf
ADR-077 § Beslut 1 deferar, och som är ett arkitekturbeslut för Marcus.

SKYDDSNÄTET: post-merge.yml och nightly.yml skickar ingen input och kör hela
klassen. scripts/test-acceptance-urval.sh T15f grindar att defaulten förblir
tom sträng.

AC #4 OMFORMULERAT AV ORKESTRERAREN 2026-07-29 (femtonde resumen), på Marcus godkännande av det föreslagna. Agenten lämnade det obockat och vägrade uttryckligen konstruera ett artificiellt hål för att kunna bocka rutan. Den vägran var RÄTT och är skälet till att kriteriet granskades i stället för att kringgås.

ORIGINALTEXTEN STÅR KVAR OVAN MED FLIT. Att radera den hade dolt att vi skrev fel kriterium — och just det är lärdomen värd att behålla.

### VARFÖR PREMISSEN INTE FINNS I DEN BYGGDA DESIGNEN

Kriteriet lyder: "en plantad regression i en fil som urvalet HOPPAR ÖVER fångas av post-merge-lagret". Det förutsätter ett urval som KAN missa. Denna design har ingen sådan lucka, och det är verifierat i källan av orkestreraren — inte övertaget ur agentens rapport:

`scripts/acceptance-urval.sh` rad 154-155: så snart NÅGON post utanför D0-klassen inte matchar spec-mönstret töms urvalet och körningen faller till full klass. Rad 96 slår dessutom fast att `tests/acceptance/support/` — sömmen — också faller till full klass.

Konsekvensen är att en plantad regression bara kan hamna på två ställen:
(a) i en ÄNDRAD spec-fil — den väljs alltid, per konstruktion;
(b) i vad som helst annat — vilket gör urvalet tomt och kör hela klassen.

En icke-ändrad spec-fil kan per definition inte bära en NY regression. Det finns alltså ingen tredje plats att plantera på. Kriteriet är inte svårt att uppfylla; det är otillämpligt.

### VAD KRITERIET BORDE HA LYTT — OCH DET ÄR REDAN BEVISAT

Rätt fråga för denna design är inte "fångas det urvalet missar?" utan "kan urvalet falla ut när det inte borde?". Alltså fail-closed-egenskapen, per klass.

`scripts/test-acceptance-urval.sh` bevisar exakt det, klass för klass:
  T5  källfil                    -> full klass
  T6  sömmen support/            -> full klass
  T7  giltig spec + källfil      -> full klass   (den bärande: en spec RÄCKER INTE om sällskapet är kod)
  T8  sökvägs-traversal          -> full klass
  T9  fel suffix                 -> full klass
  T10 nästlad spec               -> full klass
  T11 spec saknas på disk        -> full klass
  T12 workflow-fil               -> full klass
  T3/T4 enbart spec-filer        -> urval
Plus T15f som grindar defaulten. 22 av 22 gröna, och fällning bevisad i andra riktningen med tre mutationsprov.

Skyddsnätet AC #4 åberopar finns dessutom kvar oberoende av allt detta: post-merge kör full klass på varje mergat träd, och `post-merge.yml` skickar medvetet ingen `acceptance_selection`.

### TREDJE GÅNGEN SAMMA ROT PÅ EN DAG

`TASK-76`:s AC #4 namngav en CI-yta som en senare skiva flyttade. `TASK-81`:s AC #4 lade en skyldighet på ett kort som inte ägde den. Detta AC beskriver en design vi inte byggde.

Gemensam rot: **kriteriet skrevs mot en föreställning om lösningen, innan lösningen fanns.** Det är inte ett fel i något av korten — det är en egenskap hos att skriva AC före design. Formregeln som faller ut: **ett AC ska beskriva den EGENSKAP som ska hålla, aldrig den mekanism som ska bära den.** "Urvalet kan inte falla ut för en icke-spec-diff" åldras inte; "en plantad regression i en överhoppad fil" gör det.

### FÖRBEHÅLL SOM SKA FÖLJA MED VIDARE

Talen 411 s -> 57 s gäller den KLASS-LOKALA diffen, inte varje kod-PR: en `src/**`-PR faller till full klass och betalar fortfarande ~411 s. Cirka 40 av de 57 sekunderna är fast uppstart. Agenten valde `mer-vantelista` (6 tester) mot klassens median 7, spann 3-28 — medvetet inte den smickrande ytterligheten.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
