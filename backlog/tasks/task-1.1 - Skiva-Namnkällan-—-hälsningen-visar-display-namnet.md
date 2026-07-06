---
id: TASK-1.1
title: 'Skiva: Namnkällan — hälsningen visar display-namnet'
status: Done
assignee: []
created_date: '2026-07-05 21:08'
updated_date: '2026-07-06 06:49'
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
- [x] #1 Inloggad med konto vars metadata bär display-namn visar Hem 'Hej {namn}!'
- [x] #2 Konto utan display-namn ger neutral hälsning — e-postadressen visas aldrig
- [x] #3 Hem-e2e:n asserterar hälsningen med namn och Hems axe-baseline är fortsatt 0
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Staging-TEST_USER: user_metadata.display_name='Lotta' satt via kontots EGEN session (auth.updateUser med anon-key + login — ingen service-role; prod-guard mot lvjsfnph…-ref höll, staging-ref pqtshyie…). TEST_ADMIN lämnad UTAN display-namn MEDVETET: levande fallback-exemplar i staging. E2e-hermetik: hälsningstesterna patchar den lagrade sessionens user_metadata via addInitScript (T26-klassen) — oberoende av staging-värdet; patch-värdet 'Lotta' speglar staging så en token-refresh inte kan flippa texten. TDD: test A RÖTT bevisat före implementation (1 failed/9 passed) → GRÖNT 10/10; fallback-testet trivialt grönt pre-impl (dåvarande beteende var neutral hälsning).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 6ef4ea8 · CI-run 28755566920 grön per jobb (rerun efter staging-städning) · CI-grön-första-pass: nej — Test+Build föll först på ackumulerade ZZ-sentinel-event, orelaterat kort-diffen (incident → TASK-2 + ADR-060 Updates-not; Marcus-beslut väg A) · defekter under körning: 0 i kort-scope (1 miljö-incident, dokumenterad) · TDD: 1 cykel (namn-beteendet RÖTT bevisat före implementation → GRÖNT 10/10; fallback-beteendet trivialt grönt pre-impl — bevarat beteende saknar röd-fas) · Design-review: Marcus-kvittens 'jag ser att det funkar' (skiva-scope = namnraden; A-skelettets utseende grindat som AC #6 på task-1.3)
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review: Marcus-granskning i webbläsaren godkänd
<!-- DOD:END -->
