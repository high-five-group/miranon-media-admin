---
id: TASK-17.4
title: 'Skiva: Kalendervyn till S72-facit'
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.2
  - TASK-17.3
parent_task_id: TASK-17
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Listan får facitets kalendervy: vy-ikon-toggel (lista förvald) med ?vy=kalender i URL:en, React Aria Calendar-motorn med FK-skinnet, solida dag-plattor i exakt legendens kulör, månadsnav som ersätter period-toggeln i kalenderläget, månadssummeringen med kursfärgs-streck, dag-tryck som visar dagens event som kort med retur till hela månaden; vald dag guld med mörk ring. Täcker användarberättelser: 10-12, 15-18 (TASK-17).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Kalendervyn matchar FACIT-kalendervyn renderat; dag-plattornas kulör == legendens exakt (computed-verifierat)
- [ ] #2 ?vy-kontraktet och dag-flödet bevisade i e2e; kalenderns dagar annonseras begripligt och vyn klarar axe-0
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
