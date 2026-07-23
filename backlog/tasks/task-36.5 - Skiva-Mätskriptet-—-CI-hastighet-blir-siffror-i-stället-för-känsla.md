---
id: TASK-36.5
title: 'Skiva: Mätskriptet — CI-hastighet blir siffror i stället för känsla'
status: To Do
assignee: []
created_date: '2026-07-23 17:13'
labels:
  - ready-for-agent
dependencies:
  - TASK-36.2
parent_task_id: TASK-36
ordinal: 94000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Att CI känns långsam är en upplevelse. Utan siffror går det inte att säga om riskklassningen och dedupen faktiskt hjälpte, hur mycket, eller om något av det senare regredierade — och en optimering man inte kan mäta är en optimering man inte kan försvara.

Efter denna skiva finns ett skript som svarar på frågorna med data ur körnings-API:t: hur lång tid tar en PR från push till grönt, hur mycket av den tiden är ren väntan på mutexen, vilka jobb står för rödheten, hur ofta är ett rött resultat i själva verket instabilitet, och hur ofta slår dedupen till. Måtten är valda i DORA-andan: hastighet och stabilitet lästa tillsammans, aldrig hastighet ensam.

Skriptet körs i nattkörningen så att kurvan byggs upp av sig själv, och manuellt när man vill veta läget här och nu. Den första körningen ger utgångsvärdet som resten av vågen jämförs mot.

Två läsfällor är kodade i skriptet i stället för att behöva kommas ihåg: uppslag mot en commit kräver fullständig SHA (förkortad ger tyst noll träffar), och en avbruten körning är inte nödvändigtvis en användare som avbröt — det kan vara ett jobb som slog i sin tidsgräns. Båda är dyrt lärda och hör hemma i verktyget, inte i huvudet.

Täcker användarberättelser: 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett fristående skript rapporterar: ledtid för PR (median och 95:e percentil), kötid från skapad körning till att staging-jobbet startar, röd-orsak per jobb, flaky-frekvens och dedupens träffkvot
- [ ] #2 Skriptet kan köras både manuellt och som steg i nattkörningen
- [ ] #3 Skriptet har en parallell testfil enligt husets mönster och testas mot fixtur-data, aldrig mot levande API i testet
- [ ] #4 Testerna asserterar härledda mått ur känd fixtur-input — externt beteende, inte interna hjälpfunktioner
- [ ] #5 Läsreglerna är kodade: fullständig SHA vid commit-uppslag (L314) och rerun-medvetenhet vid tolkning av avbrutna körningar, som kan vara jobb-timeout snarare än användaravbrott (L319)
- [ ] #6 En första mätning är körd och dess siffror citerade på kortet som utgångsvärde att jämföra mot
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
<!-- DOD:END -->
