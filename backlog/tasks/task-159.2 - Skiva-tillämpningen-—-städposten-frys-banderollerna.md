---
id: TASK-159.2
title: 'Skiva: tillämpningen — städposten + frys-banderollerna'
status: To Do
assignee: []
created_date: '2026-08-07 13:46'
updated_date: '2026-08-07 16:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-159.1
parent_task_id: TASK-159
ordinal: 280000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den mätta kod-kommentars-driften är borta ur frontmatter-grinden, och varje fryst referens-dok deklarerar sin frysning enligt standarden så att karta och historik går att skilja mekaniskt vid läsning. Täcker användarberättelser: 2, 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Frontmatter-grindskriptets kommentarer bär inget hårdkodat doc-antal — pekare till policy-filen som äger listan; skriptets beteende oförändrat (ren kommentar-städning)
- [x] #2 Inventering FÖRE applicering: frusna/historiska dok i docs/reference identifierade mot sin egen text; varje sådant dok får banderoll-standarden (frusen-markör + frysdatum + pekare till levande källa)
- [x] #3 Levande dok får INGEN banderoll — fel-applicering är samma fel som frånvaro
- [x] #4 Docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Ordningen ADR → tillämpning är bindande: ADR-skivan landad före tillämpnings- och QA-skivorna exekveras
<!-- DOD:END -->
