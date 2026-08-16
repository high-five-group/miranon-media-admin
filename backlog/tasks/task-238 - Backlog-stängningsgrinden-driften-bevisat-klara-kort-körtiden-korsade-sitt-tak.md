---
id: TASK-238
title: >-
  Backlog-stängningsgrinden: driften (bevisat-klara kort) + körtiden korsade
  sitt tak
status: To Do
assignee: []
created_date: '2026-08-16 07:07'
labels:
  - ready-for-agent
dependencies: []
ordinal: 438000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-16 (R3): fyra nätter i rad Backlog-DRIFT (kort vars arbete är bevisat klart står öppna bortom karensen; 08-15-täckning: 53 prövade mot AC, 36 kort UTAN stängningssignal, 128 öppna totalt) OCH körtiden växer monotont 7m26s→8m54s→8m48s→9m34s→10m15s — natt 08-16 cancelled mot timeout-minutes: 10 ('Terminate orphan process… backlog'). Trolig körtidsrot: check_active_branches: true (TASK-93) kostar ~6,5 s per list/create (CLAUDE.md § Kortnummer); grinden gör list+view och allokerar aldrig ID:n — flaggan skyddar inget där. Larm #1190/#1243/#1268/#1309/#1373 stängda mot detta kort (backlog-benen). TVÅ separata åtgärder — blanda dem inte.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Driften: bevisat-klara kort stängda via CLI (aldrig handredigering av task-filer)
- [ ] #2 Körtiden: grinden åter under sitt tak — rekommenderad väg är check_active_branches AV i grindens CI-kontext (config-driven); takhöjning endast med öppen motivering
- [ ] #3 De 36 signal-lösa korten (noll AC, inga barn) listade för Marcus-beslut — stängs ALDRIG blint
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
