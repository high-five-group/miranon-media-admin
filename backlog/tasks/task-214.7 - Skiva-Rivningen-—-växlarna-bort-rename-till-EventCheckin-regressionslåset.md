---
id: TASK-214.7
title: 'Skiva: Rivningen — växlarna bort, rename till EventCheckin, regressionslåset'
status: To Do
assignee: []
created_date: '2026-08-14 19:20'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.6
parent_task_id: TASK-214
ordinal: 408000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
B2 steg 4, efter Marcus godkännande: den mekaniska rivningen av villkor och växlar, filnamnsbytet till EventCheckin per S103 Del 15 F4 (persondetalj-precedenten, med TASK-194-lärdomen: kallor i samma commit), rivning av den ersatta läsvyn EventAttendance, och regressionslåset via omtagen baslinje. Täcker användarberättelser: 11, 12 (fullbordan)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Variant-växlaren (railens check-in-post), variant-parameterns läsning och variantregistret är rivna — villkor och växlar, aldrig form
- [ ] #2 Komponenten omdöpt till EventCheckin (git-rename); gamla läsvyn EventAttendance riven i samma landning
- [ ] #3 Facit-manifestets kallor uppdaterade i samma commit
- [ ] #4 Visual-baslinjen omtagen EFTER godkännandet via CI-artefakt — regressionslåset armerat
- [ ] #5 Markörer städade i samma landning som rivningen som gör dem döda
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
