---
id: TASK-127.7
title: 'Skiva: Glömt lösenord + återställning'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-03 11:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.3
parent_task_id: TASK-127
ordinal: 211000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två nya publika sidor: begär återställning (enumeration-neutral — exakt samma bekräftelse oavsett om adressen finns i systemet) och sätt nytt lösenord (samma ASVS-golv som accept-sidan). Auth-lagret får återställningsmetoderna. Samma formmönster som den omskrivna login-vyn — därav beroendet. Den dag Lotta glömmer sitt lösenord löser hon det själv på en minut.

Täcker användarberättelser: 5, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Begär-flödet ger identiskt svar för känd och okänd adress — i innehåll och utan mätbar tidsskillnad som externt beteende
- [ ] #2 Återställningslänken är engångs; förbrukad eller utgången länk ger vänligt felläge
- [ ] #3 Sätt-nytt-lösenord-sidan bär samma ASVS-golv som accept-sidan
- [ ] #4 Acceptance- och a11y-sviterna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
