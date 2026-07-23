---
id: TASK-18.11
title: 'Skiva: Anteckningar (egen ADR + additiv tabell + strömmen)'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 03:37'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Eventets minne: tidsstämplad antecknings-ström med composer överst och nyast först, författare = inloggad användare, härledd Under/Efter-fas ur tidpunkten mot eventets dagar (Innan omärkt per tysta normen) och auto-grow-composer (innehållsstyrd höjd med tak och intern rull, fast treradig reserv där webbläsarstödet saknas). Backend per Marcus-kvitterat vägval 2026-07-21: ADDITIV Anteckningar-tabell i basen (staging först) med läs- och skriv-operation; beslutet mintas som EGEN ADR i skivan (över baren — tabell-form, attribuerings-avvägningen mot record comments) och refereras från PRD-kortet. Täcker användarberättelser: 28-30 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ADR:n mintad; tabellen additiv i staging; läs- och skriv-operationerna kontraktstestade med teardown
- [ ] #2 Strömmen, fas-etiketterna och auto-grow bevisade i e2e; renderat mot facit-anteckningarna
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
HALT vid steg 5 (PR-CI-vakten). PR #89, CI-run 29977396636 (pull_request). ROD CI: jobb 'Lint + Audit + TypeCheck' => FAILURE pa steget 'Biome check'; jobb 'Docs link check' => FAILURE pa steget 'Check markdown hygiene (markdownlint-cli2)'; 'Detect changed files' + 'Staging sentinel purge' grona, 'Test + Build' var in_progress vid HALT. Deterministisk rot-orsak aven verifierad fore PR: branchen adderar ADR-075 (75 ADR-filer i docs/decisions/) men rot-README.md star kvar pa '74 arkitekturbeslut' och orordes ej pa branchen => scripts/check-adr-count.sh (ci.yml ADR-039-grinden) faller. Ingen merge utford. Fixytor ligger delvis UTANFOR merge-agentens skrivbara yta (rot-README.md ej i claims v2). Branch task/18.11 + PR #89 lamnade STAENDE som atgardsyta.
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
