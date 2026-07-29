---
id: TASK-75
title: >-
  Skiva: Urval i acceptance-sviten — kör den delmängd diffen rör, efter att
  staging lämnat PR-grinden
status: To Do
assignee: []
created_date: '2026-07-28 21:52'
updated_date: '2026-07-29 09:41'
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
- [ ] #4 Falsk-grön-risken prövad skarpt: en plantad regression i en fil som urvalet hoppar över fångas av post-merge-lagret — run-ID redovisat
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
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
