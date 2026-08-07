---
id: TASK-146.3
title: 'Skiva: Privat bucket, path-form per event och signerad åtkomst'
status: To Do
assignee: []
created_date: '2026-08-07 09:05'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-146
ordinal: 242000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bilagornas bytes får en privat hemvist där en fil bara är åtkomlig för den som ska se den, via en tidsbegränsad länk. Kursdeltagares kvitton ska aldrig ligga öppet.

VALT MEDVETET: signerade URL:er, inte publik bucket. Intern precedent finns för publik bucket i ett systerprojekt — vi väljer den smalare vägen.

Täcker användarberättelser: 12, 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Privat bucket provisionerad av ett INCHECKAT, idempotent skript; bucketen är privat, inte publik
- [ ] #2 Path-formen prefixar per event så filer grupperas där de hör hemma
- [ ] #3 En giltig signerad länk ger filen; en utgången nekas — båda prövade som ÅTKOMST, inte som konfiguration
- [ ] #4 Storleksgränserna prövade VID gränsen: strax under går igenom, strax över avvisas med begripligt fel innan uppladdningen påbörjas
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
