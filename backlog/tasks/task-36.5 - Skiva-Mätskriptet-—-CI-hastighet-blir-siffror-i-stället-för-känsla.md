---
id: TASK-36.5
title: 'Skiva: Mätskriptet — CI-hastighet blir siffror i stället för känsla'
status: In Progress
assignee: []
created_date: '2026-07-23 17:13'
updated_date: '2026-07-24 06:22'
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
- [x] #1 Ett fristående skript rapporterar: ledtid för PR (median och 95:e percentil), kötid från skapad körning till att staging-jobbet startar, röd-orsak per jobb, flaky-frekvens och dedupens träffkvot
- [ ] #2 Skriptet kan köras både manuellt och som steg i nattkörningen
- [x] #3 Skriptet har en parallell testfil enligt husets mönster och testas mot fixtur-data, aldrig mot levande API i testet
- [x] #4 Testerna asserterar härledda mått ur känd fixtur-input — externt beteende, inte interna hjälpfunktioner
- [x] #5 Läsreglerna är kodade: fullständig SHA vid commit-uppslag (L314) och rerun-medvetenhet vid tolkning av avbrutna körningar, som kan vara jobb-timeout snarare än användaravbrott (L319)
- [x] #6 En första mätning är körd och dess siffror citerade på kortet som utgångsvärde att jämföra mot
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Utgångsvärde (första mätningen 2026-07-24, fönster 50 runs, alla slutförda): PR-ledtid median 1 min · p95 13.3 min (n=24) · staging-kötid median 0.2 min · p95 7.7 min (n=37) · röda runs 2 (Docs link check ×2) · flaky 0.0 % (0 omkörnings-gröna/2 slutligt röda) · dedup-träffkvot 100.0 % (4 träff/0 miss; 20 okända = main-pushar äldre än 36.4, loggen saknar dedup-markör — ärligt redovisat, ej maskerat). AC#2:s natt-halva bockas efter merge via dispatchad nightly med citerat run-ID (Testbeslutets form).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
<!-- DOD:END -->
