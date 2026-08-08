---
id: TASK-161.1
title: >-
  Skiva: ADR-100-amenderingen — review-bumpens innebörd + ägar-deklarationens
  form
status: To Do
assignee: []
created_date: '2026-08-07 19:02'
updated_date: '2026-08-08 05:53'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-161
ordinal: 291000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den som bumpar review_by eller läser ett styrande dok möter en definierad granskningsplikt och en explicit ägar-deklaration — återfalls-skyddets styrande text. Grillad samsyn S99 Del 10; rotorsaks-paketet kvitterat. Täcker användarberättelser: 4, 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ADR-100 amenderad ÖPPET (additiv Updates-sektion, daterad): review_by-bump KRÄVER mini-audit (drift-koll mot ägd yta + pekar-integritet + ägar-deklarationens giltighet) — kadensgrinden finns redan (check-frontmatter Check 3), amenderingen ger den innebörd
- [x] #2 Ägar-deklarationens form definierad i samma amendering: varje styrande dok bär raden Äger X · Kartlägger Y · vid konflikt vinner Z (husets mönster: segment-arkitektur rad 9, README rad 14)
- [ ] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
