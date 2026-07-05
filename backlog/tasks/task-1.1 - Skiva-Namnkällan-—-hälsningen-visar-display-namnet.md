---
id: TASK-1.1
title: 'Skiva: Namnkällan — hälsningen visar display-namnet'
status: To Do
assignee: []
created_date: '2026-07-05 21:08'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-1
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Inloggad administratör möts av 'Hej {namn}!' på Hem, där namnet kommer ur inloggningskontots metadata (display-namn i Supabase user_metadata). Saknas namn visas dagens neutrala hälsning — e-postadressen visas ALDRIG (Gunilla-principen; PRD implementationsbeslut 5). AuthUser/sessionToUser utökas med namnfältet och befintliga Greeting konsumerar det — demonstrerbar ensam, före FK-omskrivningen (skiva 3 konsumerar namnkällan). Staging-kontonas display-namn sätts som del av skivan; prod-kontots metadata är ett go-live-moment och bokförs på T46 go-live-kartan (tasks/threads/T46-go-live-karta.md), inte här.
Täcker användarberättelser: 1
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Inloggad med konto vars metadata bär display-namn visar Hem 'Hej {namn}!'
- [ ] #2 Konto utan display-namn ger neutral hälsning — e-postadressen visas aldrig
- [ ] #3 Hem-e2e:n asserterar hälsningen med namn och Hems axe-baseline är fortsatt 0
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd
<!-- DOD:END -->
