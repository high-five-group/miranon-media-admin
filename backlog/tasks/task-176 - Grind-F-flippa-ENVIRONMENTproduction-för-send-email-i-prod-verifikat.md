---
id: TASK-176
title: 'Grind F: flippa ENVIRONMENT=production för send-email i prod + verifikat'
status: To Do
assignee: []
created_date: '2026-08-10 06:14'
labels:
  - ready-for-human
dependencies: []
priority: high
ordinal: 333000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fail-closed-spärren i send-email avvisar allt utom exakt 'production' (422) — noll skarpa mail kan skickas förrän flippen görs. Marcus sätter secreten själv (Code rör ALDRIG nyckeln/secreten, T55). Code verifierar efteråt icke-muterande per T55:s stegsekvens.

Källor: tasks/threads/T55-mail-go-live-grind-f.md (hela tråden) · tasks/threads/T46-go-live-karta.md rad 18 ('Återstående gate till live').

Go-live-blockerare på Lotta-kan-jobba-baren (Marcus-beslut 2026-08-10, sessionsdok S102).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ENVIRONMENT=production satt i prod för send-email — Marcus handgrepp, bokfört med tidsstämpel i kortets notes
- [ ] #2 Code-verifikat efter flipp: miljö-grinden avvisar inte längre (422-klassen borta) via icke-muterande verifikatform per T55
- [ ] #3 T55-tråden uppdaterad med utfallet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
