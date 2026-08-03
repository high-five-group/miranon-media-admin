---
id: TASK-127.3
title: 'Skiva: Login-omskrivningen till designsystemet'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-03 11:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
  - TASK-127.2
parent_task_id: TASK-127
ordinal: 207000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Login-vyn — första skärmen Roger och Lotta ser — skrivs om till designsystemet enligt prototyp-facit: appens formprimitiver, enumeration-neutral felhantering och lugnt laddläge. Den gamla vyns ouppfyllda refaktor-löfte från Fas 3 infrias och tas bort. Koordination: ingen parallell session rör login-ytan under skivan (bokfört mot UI-spåret).

Täcker användarberättelse: 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Login-vyn använder designsystemets primitiver fullt ut — ingen rå Tailwind kvar
- [ ] #2 Felmeddelanden är enumeration-neutrala: samma svar oavsett om adressen finns
- [ ] #3 Befintlig autentiserad e2e och a11y-sviten gröna
- [ ] #4 Prototyp-facit följt; varje avvikelse öppet bokförd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
