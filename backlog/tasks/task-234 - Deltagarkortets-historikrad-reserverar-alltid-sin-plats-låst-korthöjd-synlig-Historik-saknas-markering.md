---
id: TASK-234
title: >-
  Deltagarkortets historikrad reserverar alltid sin plats - låst korthöjd +
  synlig Historik saknas-markering
status: To Do
assignee: []
created_date: '2026-08-15 23:52'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 434000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 7-designbeslutet (Marcus kvittens 2026-08-16): deltagarkortet på eventdetaljen utelämnar idag historikraden helt när antalGenomfordaEvent är null (Deltagare.tsx rad ~910, villkorad rendering) - kortet blir kortare och höjderna spretar, och datafel blir OSYNLIGA (Helena-fallet låg obemärkt i sju veckor för att felet visade sig som frånvaron av en rad). BESLUT: historikradens plats reserveras ALLTID (samma fasta-slot-mönster som eventinfo-signalens min-h-8 i samma fil, rad ~302-306); vid null visas en diskret 'Historik saknas'-markering i slotten - layouten blir stabil per definition OCH framtida olänkade anmälningar blir synliga dag ett i stället for tysta. Gäller båda kortlägena (aktivt + vilande). BYGGORDNING: EFTER TASK-228 landat - samma fil (Deltagare.tsx), kollisionsrisk annars. A11y: markeringen ska vara läsbar för skärmläsare utan att bli brus (jfr signal-slottens mönster).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Historikradens plats alltid reserverad - kortets höjd identisk med och utan data
- [ ] #2 Null-fallet visar diskret Historik saknas-markering, skärmläsarvänlig
- [ ] #3 Befintliga acceptance-/a11y-fall gröna oförändrade + DoD-kvartetten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
