---
id: TASK-17.2
title: 'Skiva: Listvyn till S72-facit'
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.1
parent_task_id: TASK-17
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Event-listan renderar facitets listvy ände-till-ände: period-toggeln Kommande/Tidigare via primitiven, månadsgrupprubriker, likformiga slot-kort (rubrik, datumrad, beläggningsrad, status-slot endast vid avvikelse, dämpat Inställt med genomstruken rubrik, grön Fullbokat-kontur), strukturerat text-tomläge och Lugnt laddläge. URL-kontraktet ?period=upcoming|past ersätter ?status+?sort; URL-STATE-spec och berörda e2e-flöden skrivs om i samma skiva. Period härleds ur startdatum mot idag, aldrig ur Status-fältet (stänger T14 tekniskt). Täcker användarberättelser: 1-8, 13-18 (TASK-17).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Listvyn matchar FACIT-listvyn renderat (computed-verifiering + skärmdump mot bilagan)
- [ ] #2 ?period-kontraktet bevisat i e2e: växling, delbar URL, back-navigation; gamla ?status/?sort borta ur spec och kod
- [ ] #3 Månadsrubrikerna är riktiga rubriker i tillgänglighetsträdet; tomläge och avvikelse-markeringar renderas per facit
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
