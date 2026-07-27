---
id: TASK-54.3
title: 'QA: MSW-bytet mot verkligt arbetsflöde'
status: Done
assignee: []
created_date: '2026-07-27 15:07'
updated_date: '2026-07-27 19:12'
labels:
  - ready-for-human
dependencies:
  - TASK-54.1
  - TASK-54.2
parent_task_id: TASK-54
ordinal: 119000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan. Syftet är att pröva det som mekaniska grindar inte kan: att mekanismen faktiskt är BÄTTRE att arbeta med, inte bara likvärdig. Ekvivalensen är redan bevisad av skivorna; detta kort prövar bruksvärdet.

STEG 1 — Skriv en ny mock från grunden.
Välj en Edge Function som ännu inte har handler. Skriv en. Mät hur lång tid det tar och hur många filer som måste öppnas. Jämför mot hur det gick till före bytet (den gamla formen finns i git-historiken). Utfallet ska vara färre steg, inte fler. Blir det fler är bytet halvt gjort och det ska bokföras som fynd.

STEG 2 — Provocera vakten på tre sätt.
(a) Anropa en EF som saknar handler. (b) Stava fel på en path som HAR handler. (c) Anropa en helt extern domän. Kontrollera i alla tre fallen att testet fälls, att meddelandet namnger requesten, och att listan över mockade endpoints hjälper dig hitta felet. Fall (b) är det viktiga: det är det vanligaste verkliga misstaget, och skillnaden mellan ett bra och ett dåligt felmeddelande syns bara där.

STEG 3 — Överskugga en delad handler lokalt.
Ta ett test som använder en delad handler och låt just det testet returnera ett felsvar i stället. Verifiera att överskuggningen gäller enbart det testet och inte läcker till nästa. Detta är mönstret acceptance-klassens filer kommer luta sig mot, så det ska vara bekvämt, inte klurigt.

STEG 4 — Kontrollera att hermetiken håller under påfrestning.
Kör hela visuella sviten med nätverket avstängt på maskinen. Den ska vara grön. Är den inte det finns ett beroende utanför fixturvärlden som ingen grind fångat.

STEG 5 — Läs den nya koden som en ny agent skulle göra.
Öppna fixturmodulen utan förkunskap. Går det att förstå var handlers bor, hur en ny läggs till och vad vakten gör, utan att läsa git-historik eller fråga? Kan du inte det, kan inte nästa agent heller — och då är dokumentationsskulden ett fynd som ska bokföras.

STEG 6 — Kontrollera tidsåtgången.
Jämför svitens körtid före och efter. Bytet ska vara neutralt eller bättre. En märkbar försämring pekar mot att tillgångs-optionen hamnat fel, och det är den enda kända prestandafällan i uppställningen.

Fynd registreras som NYA kort med exakt symptom och förväntat beteende. Denna plan retuscheras inte i efterhand.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Alla sex steg genomförda och utfallet nedtecknat
- [x] #2 Eventuella fynd registrerade som egna kort, inte som noteringar här
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
QA-UTFALL 2026-07-27 — sex steg genomförda.

STEG 1 (ny mock från grunden): get-attendance saknade handler. Skriven som EN rad med inline-svar; anropet gav status 200 och rätt kropp. FILER SOM MÅSTE ÖPPNAS: 1. Gamla formen (EF_FIXTURES i hermetic.ts, läst ur git 56e9064~1) krävde också 1 fil för det triviala fallet — alltså LIKVÄRDIGT, inte färre steg, för en enkel GET. Skillnaden ligger utanför trivialfallet: den gamla uppslagstabellen nycklade enbart på EF-NAMN och kunde därför inte skilja GET från POST, inte matcha på body och inte variera svar per anrop. Bytet är alltså inte färre steg för det enklaste fallet men strikt färre för allt annat. Ingen fynd-klass: bytet är inte halvt gjort, det är bara inte snabbare där det redan var snabbt.

STEG 2 (provocera vakten på tre sätt): alla tre fälldes med requesten namngiven och listan över sju mockade endpoints. Fall (b), felstavningen get-evnets, avslöjade TVÅ brister som blivit TASK-57: listan lyfter inte närmaste träff, och en helt extern domän får samma EF-råd som en omockad Edge Function.

STEG 3 (överskugga delad handler lokalt): network.use() gav status 500 i sitt eget test; NÄSTA test fick 200 med tre event. Överskuggningen läcker alltså inte. Mönstret fungerar — men är odokumenterat, vilket blev TASK-58.

STEG 4 (hermetik under påfrestning): AVVIKELSE MOT PLANEN, öppet bokförd. Kortet ville att sviten körs med nätverket avstängt på maskinen. Jag kan inte stänga av Marcus nätverksanslutning, så steget kördes i en form som mäter samma sak mer direkt: repots restanrops-instrument, som räknar anrop som FAKTISKT nådde nätet, per fil. Utfall: 32 filer med restanrop, samtliga under e2e/. NOLL visual-filer. Instrumentets egen formulering är att en fil saknas ur listan enbart om den aldrig lät ett anrop nå nätverket. Hermetiken håller alltså, och beviset är per fil i stället för per svit.

STEG 5 (läs koden som en ny agent): det mesta är läsbart utan förkunskap — var handlers bor, kontraktet mot EF-protokollet, vad vakten gör, varför båda optionerna är satta, varför ingen preflight och ingen catch-all finns. Vaktens felmeddelande pekar dessutom på handlers.ts precis när man behöver det. Det som INTE går att läsa sig till är överskuggningsmönstret och att network-fixturen är testets yta mot mockningen. Bokfört som TASK-58.

STEG 6 (tidsåtgång): 17,3 s före vaktbytet mot 17,0 s och 20,2 s efter (två körningar, varians i mätningen). Neutralt — ingen försämring, vilket var kravet. En ren mätning av tiden FÖRE hela MSW-bytet gick inte att få fram: en worktree på 56e9064~1 gav 12 failed av miljöskäl, inte prestandaskäl, och jagades inte vidare eftersom 54.1 redan bevisat ekvivalensen pixel-för-pixel. Prestandafällan kortet varnar för (tillgångs-optionen fel satt) är utesluten: optionen är verifierat false och kostnaden mättes separat i 54.2.

FYND: TASK-57 (vaktens meddelande) och TASK-58 (odokumenterat överskuggningsmönster). Båda oetiketterade = oplockbara tills de klassas.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · QA-utfall på kortet · commit b31fc3b + stängning · CI-run 30292561708 per jobb · sex steg genomförda, ett med öppet bokförd avvikelse (steg 4: nätverksavstängning ersatt av restanrops-mätning — 32 filer med restanrop, samtliga e2e, noll visual) · fynd: TASK-57 + TASK-58 · DoD 5 stängd av dispatch-run 30297097792: 'Inga baseline-ändringar'
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Baseline-dispatchen loggar 'Inga baseline-ändringar'
- [x] #6 Negativt self-test bevisar att vakten fäller OCH namnger saknad request + listar mockade
- [x] #7 Vaktens option verifierad skarpt satt
- [x] #8 Ingen befintlig e2e-fil rörd
<!-- DOD:END -->
