---
id: TASK-283.1
title: 'Skiva: Personer-EF:en lär sig bokstavsfiltret och bokstavsfördelningen'
status: To Do
assignee: []
created_date: '2026-08-21 08:51'
updated_date: '2026-08-21 11:34'
labels:
  - ready-for-agent
  - wontfix
dependencies: []
parent_task_id: TASK-283
ordinal: 510000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Personer-EF:en lär sig ett bokstavsvillkor, och börjar svara med hur många personer varje bokstav rymmer.

ÄNDE TILL ÄNDE: ett anrop utan bokstav beter sig exakt som idag. Ett anrop med en bokstav svarar med enbart de personer vars namn börjar på den — diakritik-korrekt, så Å ger Å-namn och aldrig A-namn. Ett anrop med hinken för namnlösa svarar med enbart dem. Ett anrop med bokstaven E svarar med personer som faktiskt heter något på E, aldrig med de namnlösa. Bokstav och fritext kan kombineras och smalnar av tillsammans. Svaret bär dessutom en fördelning: hur många personer varje bokstav och hinken rymmer, räknat över hela registret och inte över den aktuella sökningen.

FÖRDELNINGEN HAR EN STOPP-GRIND, och den är verklig. Den ska komma ur den genomgång av samtliga namn som EF:en REDAN gör för att räkna totalen. Visar sig den genomgången inte bära fördelningen: landa filtret ensamt, STOPPA på fördelningen och eskalera. Lägg aldrig till en andra genomgång för att få talen — kostnaden var hela skälet till att formen valdes.

Ingen klientändring i denna skiva. Skivan avslutas med deploy till staging, så nästa skiva kan skicka parametern mot en EF som redan förstår den.

Täcker användarberättelser: 1, 8, 9, 18
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett anrop UTAN bokstav ger byte-identiskt svar mot dagens beteende
- [ ] #2 Ett anrop med bokstav ger enbart personer vars namn börjar på den — Å ger Å-namn, aldrig A-namn (fälla 51)
- [ ] #3 Bokstaven E ger INTE de namnlösa; sentinelen är explicit undantagen
- [ ] #4 Hinken för namnlösa ger enbart dem, via exakt likhet mot sentinel-strängen
- [ ] #5 Bokstav och fritext kombineras med AND och smalnar av tillsammans
- [ ] #6 Svaret bär fördelning per bokstav och hink, räknad över HELA registret — aldrig över aktuell sökning
- [ ] #7 Fördelningen härleds ur den namn-genomgång EF:en redan gör; en andra genomgång läggs ALDRIG till — går det inte, landa filtret ensamt och STOPPA
- [ ] #8 Testfall i EF:ens staging-fil täcker bokstav, sentinel-undantaget, hinken och kombinationen med fritext
- [ ] #9 EF:en deployad till staging och verifierad med direktanrop
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Sentinelen undantagen ur E-filtret — bevisat med testfall, aldrig antaget (fälla 51)
- [ ] #6 EF deployad till staging FÖRE den landning som börjar skicka bokstavs-parametern (deploy-ordningen)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-21 11:34
---
WONTFIX 2026-08-21 (S109, ADR-123): skivan byggde bokstavsfiltret och fördelningen i EF:en (väg A). Marcus valde väg B — registret laddas helt och filtreras i klienten — vilket gör EF-filtret onödigt och stopp-grinden om 'en andra genomgång' moot. Bygg-agenten stoppades mitt i (okommittad diff kvar i dess worktree agent-add265ceade8e9e7a, ingen gren, ingen PR); staging-EF:en get-persons hade hunnit deployas (v27) och återställdes till main (v28). Inga AC bockas. Ersätts av registerskivan i det nya PRD-kortet.
---
<!-- COMMENTS:END -->
