---
id: TASK-18.12
title: 'Skiva: Manuell anmälan-sidan skarp'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 04:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.3
parent_task_id: TASK-18
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lägg till manuell anmälan-raden leder till en skarp sida i FK-formklassen som skapar Anmälan via befintlig operation med Källa Manuell och server-satt event-koppling; validering och bekräftelseläge per facit; prototypens sida ersätts av den skarpa routen. Täcker användarberättelser: 11 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Flödet ände-till-ände mot staging med teardown: anmälan får Källa Manuell och event-länk server-side
- [ ] #2 Formen renderar per facit; skarpa routen ersätter prototyp-grenen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MERGE-HALT (steg 5, PR-CI-vakten) — S75-batch: PR #90 skapad, PR-CI run 29980247435 nådde INGET terminalt tillstånd inom merge-agentens fönster (forcerad output-terminering). Jobb-utfall vid avbrott: Detect changed files=success · Lint+Audit+TypeCheck=success · Docs link check=success · Staging sentinel purge=success · Test + Build=IN_PROGRESS (ej terminal) · CI Passed or Skipped=pending. Alla slutförda jobb GRÖNA (4/6) — detta är INTE ett pipeline-fel utan ett ofullständigt-CI-avbrott. Ingen merge utförd; main orörd. Steg 1–4 passerade: färsk main=fork-SHA (branch redan à jour, audit-arv ancestor), merge-tree exit 0 (ren), claims-kvitto 10/10 filer inom yta. Branch task/18.12 + PR #90 KVAR som åtgärdsyta för ren re-pick (CI körs då färskt om). Stale-vakt-fil (run 29977396636) fångad och kasserad före felaktig HALT.
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
