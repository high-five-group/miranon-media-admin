---
id: TASK-214.3
title: 'Skiva: Referenserna — hermetiska fixturer + ariaSnapshot ur variant-läget'
status: To Do
assignee: []
created_date: '2026-08-14 19:16'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.2
parent_task_id: TASK-214
ordinal: 404000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
B4-parets FÖRE-halva byggs i den hermetiska fixturvärlden: fixturer för dörrlistans samtliga lägen och ariaSnapshot-referenser ur variant-läget, tagna EFTER mutations-kopplingen så referenserna speglar den färdiga ytan — personlistans enkelriktade kedja. Styrande: PRD task-214, ADR-103 B4, facit-manifestet. Täcker användarberättelser: 11
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hermetiska fixturer finns för dörrlistans lägen: flera sessioner, en session (utan sessionsval), sök med och utan träff, klargrupp med poster, tomläge
- [ ] #2 ariaSnapshot-referenser tagna ur variant-läget (FÖRE-halvan av B4-paret) för dessa lägen och gröna mot den körande ytan
- [ ] #3 Referenserna speglar facit tasks/sessions/bilagor/s103-checkin-konvergens/facit.json ytan 'check-in (dörrlistan, variant D)' — divergens mot facit-bilderna rapporteras som fynd, aldrig normaliseras tyst
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
