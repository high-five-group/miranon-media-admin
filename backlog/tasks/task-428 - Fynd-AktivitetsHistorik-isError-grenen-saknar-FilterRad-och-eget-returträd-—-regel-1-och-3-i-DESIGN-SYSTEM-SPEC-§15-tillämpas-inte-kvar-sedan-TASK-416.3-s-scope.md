---
id: TASK-428
title: >-
  Fynd: AktivitetsHistorik isError-grenen saknar FilterRad och eget returträd —
  regel 1 och 3 i DESIGN-SYSTEM-SPEC §15 tillämpas inte (kvar sedan TASK-416.3:s
  scope)
status: To Do
assignee: []
created_date: '2026-09-07 16:06'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 754000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: review-runda 1 på PR #2439 (TASK-416.21), fynd 2. TASK-416.3 (#2396) monterade FilterRad i isPending- och laddad-grenen men lämnade isError orörd med avsikt — PR-kroppen säger uttryckligen: "isError-grenen är oförändrad (utanför denna skivas explicita scope — kortets AC nämner endast isPending)." Verifierat mot src/components/aktivitetshistorik/AktivitetsHistorik.tsx (origin/main): kommentaren rad 484-491 ("enbart isError-grenen saknar den fortfarande, oförändrat scope") och komponenten har fortfarande TRE separata topp-nivå-return-grenar (isPending rad ~808, isError rad ~839, laddat rad ~861) — isError-grenen (rad ~839-850) renderar bara SidRam+h1+MessageBox, ingen FilterRad. Följden: varken DESIGN-SYSTEM-SPEC §15-regel 1 (krom/statiska element i alla query-tillstånd) eller regel 3 (ett returträd med fasta barnpositioner) är tillämpade på denna vy. Regel 1s citat av #2396 i §15 bär numera en explicit reservation för just detta.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 FilterRad monterad i isError-grenen, samtliga kontroller isDisabled (samma mönster som isPending-grenen i #2396)
- [ ] #2 Ett returträd med fasta barnpositioner ersätter de tre separata topp-nivå-return-grenarna (isPending/isError/laddat), så SidRam/h1/FilterRad aldrig byter DOM-nod mellan tillstånden
- [ ] #3 boundingBox-test tvåsidigt (h1/FilterRad/första listraden identiska isPending→isError och isError→laddat), samma mönster som TASK-416.8/TASK-416.19
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
