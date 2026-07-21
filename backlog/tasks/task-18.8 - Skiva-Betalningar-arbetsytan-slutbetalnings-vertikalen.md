---
id: TASK-18.8
title: 'Skiva: Betalningar (arbetsytan + slutbetalnings-vertikalen)'
status: To Do
assignee: []
created_date: '2026-07-21 08:20'
updated_date: '2026-07-21 23:10'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Betalningskortet visar röda saknas-deltan (minustecknet bär) och Öppna detaljer öppnar inline-arbetsytan: flikar i kapselform, deadline som status-badge, EN linje per betalning med eget kryss, notering per betalning, Påminn-mailikon per obetald linje med betalningen i ämnesraden och tyst påminnelsehistorik under personen; kortets deltan och grupper härleds live ur kryssen. NY operation för slutbetalning (anmälningsavgiften har sin befintliga). Per-betalnings-notering och påminnelselogg löses I BASEN additivt — vägvalet additiva fält kontra maillogg-härledning låses i skivan efter bas-verifiering, öppet bokfört. DEADLINE-REGELN LÅST (Marcus 2026-07-21): slutbetalningen förfaller 14 dagar före eventets startdatum — härleds ur startdatum, inget nytt bas-fält. Täcker användarberättelser: 19-23 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Slutbetalnings- och noterings-operationerna kontraktstestade: deny-by-default, otillåtet fält fälls, teardown
- [ ] #2 Deadline-badgen visar start-minus-14-dagar-regeln; deltan och grupperna härleds live bevisat i e2e
- [ ] #3 Påminnelse-vägvalet (additiva fält kontra maillogg-härledning) bokfört öppet i skivan före implementation
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AFK-halt (S75 v2): PR-CI rött (run 29875779970, PR #76): (1) audit-ci — GHSA-f88m-g3jw-g9cj (sharp inherited vulnerabilities in libvips: CVE-2026-33327/33328/35590/35591) via vite-plugin-pwa>@vite-pwa/assets-generator>sharp, ej i allowlist — ny advisory, orelaterad till branchens diff; (2) E2E staging 3 failed i tests/e2e/mark-paid.staging.test.ts (deadline-badgen start-minus-14 AC #2 toHaveText; Saknar-återflytt toBeVisible element not found; delta-avgifter −3-mismatch), 200 passed. Kod-/config-fix utanför merge-agentens mandat — halt-first. Branch task/18.8 + PR #76 kvarstår för åtgärd.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
