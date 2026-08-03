---
id: TASK-127.6
title: 'Skiva: Accept-sidan — lösenord enligt ASVS-golvet'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-03 11:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
  - TASK-127.2
parent_task_id: TASK-127
ordinal: 210000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den nya publika sidan där inbjudan landar: e-postadressen förifylld och oredigerbar, mottagaren sätter lösenord enligt ASVS-golvet med snäll svensk vägledning, engångstoken hanteras korrekt (utgången eller redan använd länk ger ett vänligt läge som pekar mot omskick). Formen följer prototyp-facit.

Täcker användarberättelser: 2, 3, 4, 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 E-postfältet är förifyllt och låst — kan inte ändras via UI eller manipulerad request
- [ ] #2 Lösenordsgolvet upprätthålls: minst 8 tecken med 15 rekommenderat, kontroll mot läckta lösenord, pedagogisk svensk vägledning
- [ ] #3 Utgången eller förbrukad länk ger vänligt felläge med väg framåt — aldrig rå felkod
- [ ] #4 Acceptance- och a11y-sviterna gröna på sidans alla tillstånd
- [ ] #5 Prototyp-facit följt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
