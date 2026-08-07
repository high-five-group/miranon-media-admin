---
id: TASK-146.5
title: 'Skiva: Klass B — event-mallad generering ur systemmall'
status: To Do
assignee: []
created_date: '2026-08-07 09:08'
labels:
  - ready-for-agent
dependencies:
  - TASK-146.1
  - TASK-146.4
parent_task_id: TASK-146
ordinal: 244000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Roger slipper skriva om deltagarinformations-brevet för varje kurs — det genereras per event ur en mall och blir en bilaga som vilken annan.

Klass C (kvittot) hör INTE hit — den byggs i TASK-147 tillsammans med kvittonummer-serien.

Täcker användarberättelser: 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett event-mallat brev genereras ur en systemmall och landar som en bilaga med samma metadata som en uppladdad
- [ ] #2 Mallen är INTE redigerbar i v1 — mall-editorn ligger uttryckligen senare
- [ ] #3 Svenska tecken korrekta i den genererade filen
- [ ] #4 De tre dokumentklasserna är oskiljbara i metadatat: klass A, B och C landar som samma sorts bilaga oavsett hur de uppstod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [ ] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [ ] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [ ] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
