---
id: TASK-148.4
title: 'Skiva: harness-mätprotokollet — var bryts väckningskedjan'
status: Done
assignee: []
created_date: '2026-08-07 09:49'
updated_date: '2026-08-09 07:59'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-148
ordinal: 250000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en dedikerad mätsession kan exekvera protokollet cell för cell utan designbeslut i stunden, och facit kan läsas ur sessionens egen JSONL-transcript i efterhand. Besvarar T112 § Åtgärdsriktning (iv). Täcker användarberättelser: 5, 9 (förbereder)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Protokolldok i docs/research/ per research-konventionen: sex differentialceller (bakgrunds-Bash, Monitor-event, subagent-completion — vardera mot idle respektive nyss aktiv session); varje cell skiljer EN variabel
- [x] #2 Facitmetoden specificerad: vilka JSONL-fält och tidsstämplar som läses post-hoc, och hur notifikations-leverans separeras från agent-resume
- [x] #3 Varje cell körbar: konkreta steg och förväntat utfall per hypotes; ingen cell kräver tolkning i stunden
- [x] #4 PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #856 (merge 66c0cc7b), CI grön per jobb. Protokolldok 508 rader; premiss-passet fällde 5 av 8 premisser (bl.a. BSD-date, Monitor utan attach). Känd kant: doket kallar ADR-096 'planerad' (grenat före #854) — fångas i QA 148.7.

[TASK-169, backlog-städet, 2026-08-09] DoD #1-4 bockade mot belägg (natt-grind run 31291660374: status Done, 0 AC/4 DoD obockade — bokföringsfel, inte saknat arbete). #1: AC redan [x]. #2: PR #856 (merge 66c0cc7b, 2026-08-07T10:28:49Z) — alla jobb gröna. #3: PR #856 MERGED, per-jobb-grön. #4: diff scopad till kortfilen + docs/research/harness-vackningskedjan-matprotokoll-2026-08-07.md — fil verifierad på main. 'Känd kant' i Implementation Notes är en dokumenterad begränsning, inte ett ouppfyllt krav.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
