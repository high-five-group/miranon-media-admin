---
id: TASK-177
title: 'T51: Marcus självtest av mail-vägen — Reply-To, leverans, loggrad'
status: To Do
assignee: []
created_date: '2026-08-10 06:15'
labels:
  - ready-for-human
dependencies:
  - TASK-176
priority: high
ordinal: 334000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Enda beviset att Reply-To-gold-standard, leverans och loggrad fungerar innan riktiga mottagare får mail. Marcus egen handling (Code initierar aldrig skarpa utskick).

Källor: tasks/threads/T51-reply-to-gold-standard-verifiering-mottaget-mail-visar.md · tasks/threads/T55-mail-go-live-grind-f.md § Stegsekvens.

Go-live-blockerare på Lotta-kan-jobba-baren (Marcus-beslut 2026-08-10, sessionsdok S102).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mottaget testmail hos Marcus visar korrekt avsändare + Reply-To per T51:s gold standard
- [ ] #2 Loggraden för utskicket skriven och verifierad
- [ ] #3 Marcus kvitterar utfallet i klartext; T51-tråden uppdaterad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
