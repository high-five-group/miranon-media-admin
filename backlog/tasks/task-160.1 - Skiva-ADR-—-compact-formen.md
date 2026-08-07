---
id: TASK-160.1
title: 'Skiva: ADR — compact-formen'
status: Done
assignee: []
created_date: '2026-08-07 16:52'
updated_date: '2026-08-07 17:44'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-160
ordinal: 283000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en framtida läsare som ser repot neka harnessets auto-compact hittar hela varför-kedjan i en ADR — nisch, zon, beslutsrätt, markörkontrakt och de förkastade alternativen. Grillad samsyn S99 Del 9 är substratet; PRD-kortet bär besluten. Täcker användarberättelser: 4, 8, 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ADR mintad: nischen (tre samtidiga villkor), zonen ~50 %, tudelad beslutsrätt HITL/AFK, markör-kontraktet inkl. commit-räcker-divergensen mot paus-formen, max-en-compact-regeln; decline-rationale för ersättning (A) och avvisning (C) bokförda
- [x] #2 ADR-nummer re-verifierat mot disk vid mintningen (parallella sessioner rör räknaren); README-räkningen synkad
- [x] #3 Docs-grindarna gröna lokalt före push; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 2 (2026-08-07): PR #941 mergad f23401f2, per-jobb-grön (9 pass + 1 skip). ADR-101 mintad (353 rader) med alla grillade element + decline-rationale A/C; README-räkningen 100→101 (CI-grindad, rot-README — kortets antagande om katalog-README var fel, agenten rättade båda). Skarpt bifynd: T111:s 'ingen PreCompact-hook finns' (2026-07-31) vederlagd av officiell dok — bokförd i ADR-101 § Källmärkning, T111-korrigering = triage-kandidat i Del 10-carry. Auto-compact-tröskelns ~85–90 % ej förstapartsbelagd — källmärkt som egen observation.
<!-- SECTION:FINAL_SUMMARY:END -->
