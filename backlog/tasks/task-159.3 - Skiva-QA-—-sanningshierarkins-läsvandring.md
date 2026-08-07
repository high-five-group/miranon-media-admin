---
id: TASK-159.3
title: 'Skiva: QA — sanningshierarkins läsvandring'
status: To Do
assignee: []
created_date: '2026-08-07 13:48'
labels:
  - ready-for-human
dependencies:
  - TASK-159.1
  - TASK-159.2
parent_task_id: TASK-159
ordinal: 281000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan: (1) läs pekar-raden i CLAUDE.md → klicka till ADR:n → tabellen begriplig utan förkunskap (Gunilla-principen); (2) öppna hubbens SYSTEMET.md §0-post → ADR-numret infört; (3) stickprov två frys-banderoller → markör + datum + fungerande pekare till levande källa; (4) öppna frontmatter-grindskriptet → inga hårdkodade antal i kommentarerna; (5) kvittera att decline-rationalen ×3 står i ADR:n. Täcker användarberättelser: 1, 3, 4, 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Manuell vandring godkänd av Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → tillämpning är bindande: ADR-skivan landad före tillämpnings- och QA-skivorna exekveras
<!-- DOD:END -->
