---
id: TASK-347
title: >-
  Fynd: generate-event-attachment.staging.test.ts:520 rött i full svit men grönt
  isolerat — ordnings-/samtidighetsberoende på main
status: To Do
assignee: []
created_date: '2026-08-31 00:14'
labels:
  - ready-for-agent
dependencies: []
ordinal: 651000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Funnet av TASK-346.4:s premiss-pass (S113 AFK-natten, 2026-08-31): uppdragstexten pekade ut TASK-343 som det kända röda test:api-fallet, men TASK-343:s test (attachment-upload-large.staging.test.ts, Kurstyp→Gemensam) är GRÖNT på main — det faktiskt röda är generate-event-attachment.staging.test.ts:520. Fyra mätningar (bokförda i PR #2150:s kropp): rött i full svit på agentens gren (2 av 2 körningar); grönt isolerat (23 passed) på både grenen och origin/main; rött i full svit på rent origin/main 16e273e2 — samma rad, 1 failed / 1495 passed. Grönt isolerat + rött i full svit ⇒ ordnings-/samtidighetsberoende, inte en regression i någon diff. Klass B-flake-kandidat (CLAUDE.md § metrics:flake: mät med riggen, bygg aldrig egen mätserie; läs alltid ut n innan ett noll-resultat tolkas). Åtgärdsriktning: diagnostisera vilket tidigare test/parallell körning som förorenar tillståndet (staging-delning under fleet är den dokumenterade flake-klassen), alternativt om testet läser tillstånd ett annat test muterar. TASK-343:s kort bör samtidigt prövas: om dess röda fall inte längre existerar ska kortet stängas eller omformuleras.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
