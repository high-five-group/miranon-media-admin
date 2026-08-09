---
id: TASK-148.1
title: 'Skiva: ADR-096 — väntekontraktet kodifieras'
status: Done
assignee: []
created_date: '2026-08-07 09:47'
updated_date: '2026-08-09 07:59'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-148
ordinal: 247000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en framtida läsare kan ur EN ADR förstå varför subagenter nekas async-väntan, vilka mekanismer som bär kontraktet och varför köhanterar-vägen avråddes. Underlag: sessionsdok S99 Del 2 + research-passet subagent-parkering-handoff-kontrakt-2026-08-05. Täcker användarberättelser: 2, 7, 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: ADR-nummer 096 ledigt (filcount == README-rader == sista+1) och stop-vaktens existens/registrering bekräftade mot kod FÖRE författning
- [x] #2 ADR-096 författad per repots ADR-form: kontraktet (subagent GÖR, orkestrerare VÄNTAR), mekaniseringen, instruktionskompletteringen, harness-mätningen; ADR-087 refererad som syskonmekanism; extern köhanterare avrådd med decline-rationale
- [x] #3 ADR-README-rad tillagd; docs-grindarna gröna lokalt
- [x] #4 PR skapad, armerad med gh pr merge --auto, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #854 (merge d433714c), CI grön per jobb (CI + Post-merge + Push on main). ADR-096 mintad, README-räkningen 95→96.

[TASK-169, backlog-städet, 2026-08-09] DoD #1-4 bockade mot belägg (natt-grind run 31291660374 flaggade kortet: status Done, 0 AC/4 DoD obockade — bokföringsfel vid stängning, inte saknat arbete). #1: AC redan [x] i filen. #2: PR #854 (merge d433714c, 2026-08-07T10:18:26Z) — Lint+TypeCheck+Docs-link SUCCESS på docs-klass, Test suite korrekt skippad. #3: PR #854 MERGED, samtliga jobb SUCCESS/SKIPPED. #4: diff scopad till README.md, kortfilen, docs/decisions/ADR-096-subagentens-vantekontrakt.md, docs/decisions/README.md — verifierat mot PR-diff.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
