---
id: TASK-249.7
title: 'Skiva: ORDLISTA- och design-spec-skörden ur segment-passet'
status: To Do
assignee: []
created_date: '2026-08-17 00:36'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-249
ordinal: 469000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Domänspråket kristalliserades under granskningsvarven och Marcus kvitterade termerna i chatten — de skrivs nu, buntas inte. Täcker användarberättelser: 14 (språket), stödjer alla övriga. Oberoende av byggskivorna, kan gå parallellt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ORDLISTA bär de fyra Marcus-kvitterade posterna per sina snitt-regler: Grupp (ENDAST uppdelnings-betydelsen) · Uppsättning (generatorns resultat) · alternativ (verkstadens villkorsgrupper) · Urval av personer (ingressens definition av segment)
- [ ] #2 Den låsta korthöjden (tvåraders-reservation, mätt 14 kort à 168 px) är bokförd som APP-GLOBAL regel i design-specen med S104-belägget och Marcus-ordern som källa
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #6 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->
