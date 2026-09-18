---
id: TASK-468
title: >-
  test-static-files går inte att deploya (413, 5,3 MB-bundel) — laga
  deploy-vägen eller riv EF:en
status: To Do
assignee: []
created_date: '2026-09-18 23:24'
labels: []
dependencies: []
priority: medium
ordinal: 809000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt av bygg-agenten för TASK-461 (PR #2556, 2026-09-18): supabase functions deploy av test-static-files mot staging faller med 413 'request entity too large' från Management API:t, orsakat av funktionens egen static_files-bundel på 5,3 MB. Förbefintligt, orört av #2556. Följd: källkodsfixen för CodeQL-larm #3 kan inte bevisas med en staging-assertion (assertionen togs bort ur #2556 på orkestrerarbeslut), och EF:en har noll automatiserad täckning. EF:en ligger inte i .prod-functions-allowlist.conf och når aldrig prod. Frågan underifrån: behövs den alls? Är den en testrest från bilagearbetet bör den rivas (med sitt staging-test), inte lagas.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beslut med skäl: riv eller behåll — belagt med vem/vad som använder EF:en i dag (grep + deploy-historik)
- [ ] #2 Vid behåll: deploy-vägen fungerar (mindre bundel eller annan uppladdningsväg) och felvägens icke-läckande svar bevisas i ett staging-test
- [ ] #3 Vid riv: EF, test och ev. allowlist-/policyposter borta; CodeQL-larm #3 stängt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
