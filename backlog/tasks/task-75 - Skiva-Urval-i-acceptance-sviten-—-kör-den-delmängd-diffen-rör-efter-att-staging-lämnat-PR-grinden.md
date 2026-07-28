---
id: TASK-75
title: >-
  Skiva: Urval i acceptance-sviten — kör den delmängd diffen rör, efter att
  staging lämnat PR-grinden
status: To Do
assignee: []
created_date: '2026-07-28 21:52'
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
- [ ] #1 Urvalsmekanismen är en ALLOWLIST, aldrig blocklist — vid minsta osäkerhet faller körningen till full svit; formen motiverad mot ci.yml:s D1-klass som precedent
- [ ] #2 Kritisk väg för en kod-PR mätt före och efter, båda talen redovisade i PR-texten
- [ ] #3 Kontrastbevis: en PR som rör EN acceptance-fil kör den delmängden — run-ID redovisat; en PR som rör delad kod kör full svit — run-ID redovisat
- [ ] #4 Falsk-grön-risken prövad skarpt: en plantad regression i en fil som urvalet hoppar över fångas av post-merge-lagret — run-ID redovisat
- [ ] #5 Retry-tunga tester lämnade orörda: ingen timeout kortas och ingen retry-kedja trimmas för att vinna tid (det vore att testa något annat än appen)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
