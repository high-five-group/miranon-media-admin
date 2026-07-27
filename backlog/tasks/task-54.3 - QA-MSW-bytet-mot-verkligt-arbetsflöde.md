---
id: TASK-54.3
title: 'QA: MSW-bytet mot verkligt arbetsflöde'
status: To Do
assignee: []
created_date: '2026-07-27 15:07'
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
- [ ] #1 Alla sex steg genomförda och utfallet nedtecknat
- [ ] #2 Eventuella fynd registrerade som egna kort, inte som noteringar här
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Baseline-dispatchen loggar 'Inga baseline-ändringar'
- [ ] #6 Negativt self-test bevisar att vakten fäller OCH namnger saknad request + listar mockade
- [ ] #7 Vaktens option verifierad skarpt satt
- [ ] #8 Ingen befintlig e2e-fil rörd
<!-- DOD:END -->
