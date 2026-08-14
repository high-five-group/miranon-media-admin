---
id: TASK-214.2
title: 'Skiva: Mutations-kopplingen — dörrlistan skriver skarpt efter kvittensfönstret'
status: To Do
assignee: []
created_date: '2026-08-14 19:13'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.1
parent_task_id: TASK-214
ordinal: 403000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dörrlistan (variant D, DEV-grindad) byter lokal state mot skarp skrivning bakom oförändrad form: incheckning skriver till basen när kvittensfönstret löpt ut, ångra inom fönstret lämnar noll spår, klargruppens urbockning skriver tillbaka, saknad rad överbryggas av create-attendance (backup — rotorsaken läks via 213.12), och felvägen är synlig. Datalagret nås endast via sin adapter. Styrande: PRD task-214, S103 Del 15 (F2, F3), facit-manifestet. Täcker användarberättelser: 2, 3, 4, 5, 8, 9, 10, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En incheckning i dörrlistan (variant-läget) skriver Status Närvarande via set-attendance-status EXAKT när kvittensfönstret (1,2 s) löpt ut — nätverks-observationen bevisar att inget skrivanrop går före fönstrets utgång
- [ ] #2 Ångra inom kvittensfönstret ger noll skrivanrop; ångra efter fönstret (bocka ur i klargruppen) skriver Status Ej avstämt
- [ ] #3 Saknar personen Deltaganden-rad skapas den via create-attendance i skrivögonblicket — dörren säger aldrig nej; användningen syns i loggen
- [ ] #4 Misslyckad skrivning återför raden till arbetslistan med synligt fel — ingen incheckning försvinner tyst
- [ ] #5 Dörrlistans renderade form är identisk med facit tasks/sessions/bilagor/s103-checkin-konvergens/facit.json ytan 'check-in (dörrlistan, variant D)' — mutations-kopplingen ändrar ingen form
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: läsvägen oförändrad; skrivning sker ENDAST via de två speccade operationerna
- [ ] #8 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #9 Kvittensfönstrets kontrakt bevisat via nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop
- [ ] #10 Facit-granskningen utförd mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json (ytan 'check-in (dörrlistan, variant D)')
<!-- DOD:END -->
