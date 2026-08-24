---
id: TASK-309.21
title: >-
  s102-dokument-konvergens stämplade facit avbildar inte längre den levande ytan
  — och ingen grind fäller
status: To Do
assignee: []
created_date: '2026-08-24 17:55'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 587000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Avtäckt av skiva 9-agenten 2026-08-24.

tasks/sessions/bilagor/s102-dokument-konvergens/facit.json är STÄMPLAT (godkand satt, sha cc1d7c53, 2026-08-16) och avbildar dokument-ytan som den såg ut då. Ytan har sedan dess ändrats av minst: TASK-273.4 (b881fe64), sidram-promoveringen (AMENDERING-2026-08-23, väntar omstämpling), och bilagespårets promovering (TASK-309.8, 24c39777).

INGEN GRIND FÄLLDE. Orsaken är mekanisk: check-facit.sh invariant (d) — innehållslåset mot sha256 — gäller bara ytor som deklarerar en referenser-nyckel. Den ytan gör inte det. Manifestet är alltså strukturellt giltigt medan dess bilder är tre generationer gamla.

Det är samma klass som repot städat två gånger: ett facit vars tystnad läses som täckning. Skillnaden här är att tystnaden är BYGGD IN — invarianten kan inte se en yta som inte bett om att bli sedd.

ÖPPNA AMENDERINGAR I SAMMA KATALOG som väntar Marcus omstämpling (inventerade 2026-08-24):
  tasks/sessions/bilagor/s102-dokument-konvergens/AMENDERING-2026-08-23-sidram-promovering.md
  tasks/sessions/bilagor/s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md
  tasks/sessions/bilagor/s111-anmalningssidan-konvergens/AMENDERING-2026-08-23-sidram.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Avgjort: stämplas s102-dokument-konvergens om mot den levande ytan, eller pensioneras manifestet till förmån för s108-generering/s108-dokumentytan?
- [ ] #2 De tre öppna AMENDERING-filerna avgjorda — omstämplade eller stängda med skäl
- [ ] #3 Klarlagt och bokfört hur många ytterligare stämplade ytor som saknar referenser-nyckel och därmed står utanför innehållslåset
- [ ] #4 Avgjort om avsaknad av referenser-nyckel ska fortsätta vara tillåtet, eller om check-facit bör larma på det (ADR-102-fråga, Marcus)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
