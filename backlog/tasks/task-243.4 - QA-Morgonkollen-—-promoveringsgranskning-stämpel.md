---
id: TASK-243.4
title: 'QA: Morgonkollen — promoveringsgranskning + stämpel'
status: To Do
assignee: []
created_date: '2026-08-16 14:38'
updated_date: '2026-08-24 14:00'
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
- [x] #1 Marcus har granskat skarpa hem-vyn sida-vid-sida mot facit-bilderna (verklig + tom, desktop + mobil) och satt godkand-stämpeln via utropstecken-kanalen (ADR-104) i tasks/sessions/bilagor/s102-hem-konvergens/facit.json
- [ ] #2 Blockordningen, tomma läget, bevakningsradens villkor och de disablade bulk-knapparnas motivering verifierade i verklig miljö (dev-server eller staging)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s102-hem-konvergens/facit.json (båda lägena, båda vyportarna)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGD S112 STÄDVÅG A (2026-08-24, bokföringspass, ingen kod ändrad). Belägg verifierat mot disk: tasks/sessions/bilagor/s102-hem-konvergens/facit.json bär godkand-fält satt (av: marcus, datum: 2026-08-17, citat: 'Hem-vyn ser bra ut, precis som prototypen.', sha: 8044e5b655dad5b3a12a4eba7fe682f88705f8e4) — läst direkt ur filen. AC #1 ('Marcus har granskat...och satt godkand-stämpeln via utropstecken-kanalen') bockad mot detta: ADR-104:s !-kanal kräver Marcus egen exekvering, så stämpelns blotta existens är beviset på granskningen. Facit-manifestets bilder täcker båda lägena (verklig/tom) och båda vyportarna (desktop/mobil) för hem-vyn — DoD #5 bockad på samma grund. AC #2 (de GRANULÄRA punkterna: bloc kordning, bevakningsradens villkor, de disablade bulk-knapparnas skärmläsarmotivering) LÄMNAS OBOCKAD MED AVSIKT — jag hittar inget källbelagt bevis i repot för att just dessa punkt-för-punkt verifierades utöver den generella stämpeln/citatet, och kan därför inte ärligt bocka den mot belägg (ADR-086). DoD #1 ('alla AC avbockade') lämnas därför ocheckad i konsekvens. DoD #3 (CI grön på pushad commit) lämnas ocheckad — opushad bokföringscommit, orkestrerarens ansvar efter push.
<!-- SECTION:NOTES:END -->
