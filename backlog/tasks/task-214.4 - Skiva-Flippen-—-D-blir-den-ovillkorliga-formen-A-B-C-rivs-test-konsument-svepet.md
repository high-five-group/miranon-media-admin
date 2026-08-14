---
id: TASK-214.4
title: >-
  Skiva: Flippen — D blir den ovillkorliga formen, A/B/C rivs,
  test-konsument-svepet
status: To Do
assignee: []
created_date: '2026-08-14 19:17'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.3
parent_task_id: TASK-214
ordinal: 405000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Formvillkoret flippas per ADR-103 B2 steg 1: D-formen blir den ovillkorliga på närvaro-routen, A/B/C rivs i samma landning (persondetalj-precedenten — stämpeln skyddar D, inte alternativen), och alla test-konsumenter av ytan sveps och uppdateras i samma skiva. Växlaren och railen står kvar till rivningsskivan (ADR-102 B3). Täcker användarberättelser: 1, 6, 7, 11, 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Utan variant-parameter renderar närvaro-routen dörrlistan (D-formen) — variant-villkoret för D är borta och läs-datavägarna är orörda (samma query-nycklar och DI)
- [ ] #2 Varianterna A/B/C är rivna ur prototypfilen — den stämplade D-formen är orörd; det som rivs är villkor och förkastade alternativ, aldrig form
- [ ] #3 ariaSnapshot EFTER flippen är identisk med referenserna FÖRE (B4-paret grönt)
- [ ] #4 Dörrlistan är identisk med facit tasks/sessions/bilagor/s103-checkin-konvergens/facit.json ytan 'check-in (dörrlistan, variant D)' efter flippen
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
