---
id: TASK-148.3
title: >-
  Skiva: persistens före väntan + explicit timeout — instruktionskompletteringen
  och principraden
status: Done
assignee: []
created_date: '2026-08-07 09:49'
updated_date: '2026-08-09 07:59'
labels:
  - ready-for-agent
dependencies:
  - TASK-148.1
parent_task_id: TASK-148
ordinal: 249000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en bygg-agent som läser sin instruktion vet exakt i vilken ordning persistens och väntan får ske och varför, och en läsare av konstitutionen kan namnge kontraktet. Täcker användarberättelser: 2, 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: bygg-agentens befintliga asynkron-signal-sektion läst i sin helhet; kompletteringen adderar utan att duplicera eller motsäga befintliga rader
- [x] #2 bygg-agent-instruktionen kompletterad: (a) commit + push FÖRE varje anrop som kan konverteras till bakgrund, (b) explicit timeout på potentiellt långa kommandon — försvaret mot harnessens tysta bakgrunds-konvertering
- [x] #3 CLAUDE.md bär principraden med Temporal-mönstret namngivet (subagent = Activity som GÖR, orkestrerare = Workflow som VÄNTAR) och pekare till ADR-096
- [x] #4 Docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #857 (merge d0ed38ae), CI grön per jobb. bygg-agent.md kompletterad + CLAUDE.md-principraden live.

[TASK-169, backlog-städet, 2026-08-09] DoD #1-4 bockade mot belägg (natt-grind run 31291660374: status Done, 0 AC/4 DoD obockade — bokföringsfel, inte saknat arbete). #1: AC redan [x]. #2: PR #857 (merge d0ed38ae, 2026-08-07T10:37:45Z) — alla jobb gröna. #3: PR #857 MERGED, per-jobb-grön. #4: diff scopad till bygg-agent.md, CLAUDE.md, kortfilen — innehåll verifierat på main (bygg-agent.md rad 183 'Persistens före väntan…', CLAUDE.md rad 399-400 'subagent = Activity, orkestrerare = Workflow… Temporal-mönstret').
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
