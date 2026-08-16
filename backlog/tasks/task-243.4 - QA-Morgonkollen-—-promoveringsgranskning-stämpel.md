---
id: TASK-243.4
title: 'QA: Morgonkollen — promoveringsgranskning + stämpel'
status: To Do
assignee: []
created_date: '2026-08-16 14:38'
labels:
  - ready-for-human
dependencies:
  - TASK-243.1
  - TASK-243.2
  - TASK-243.3
parent_task_id: TASK-243
ordinal: 450000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan för Marcus: (1) Öppna skarpa hem-vyn på dev-servern, jämför mot facit-bilderna facit-hem-v1-verklig-desktop.png + -mobil.png sida vid sida. (2) Framkalla tomma läget (tom datamängd via dev eller staging-filter) och jämför mot facit-hem-v1-tom-*.png — grön bock + 'läget är under kontroll', bevakningsraden dold. (3) Verifiera de disablade bulk-knapparnas tillgängliga motivering (skärmläsartext). (4) Kontrollera relativ tid, räknar-pill, hover-mönstren, inline-rullningen med 'Visa alla N'. (5) Vid godkännande: sätt stämpeln via !-kanalen — den släpper B3-spärren och avblockar rivningsskivan. Demo-lägets facit-bilder gäller prototypens granskningsläge och promoveras inte (dataläge-växeln hör till prototyp-substratet).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus har granskat skarpa hem-vyn sida-vid-sida mot facit-bilderna (verklig + tom, desktop + mobil) och satt godkand-stämpeln via utropstecken-kanalen (ADR-104) i tasks/sessions/bilagor/s102-hem-konvergens/facit.json
- [ ] #2 Blockordningen, tomma läget, bevakningsradens villkor och de disablade bulk-knapparnas motivering verifierade i verklig miljö (dev-server eller staging)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s102-hem-konvergens/facit.json (båda lägena, båda vyportarna)
<!-- DOD:END -->
