---
id: TASK-158.4
title: 'Skiva: drift-grinden i nattnätet — fönsterregeln bevakad'
status: To Do
assignee: []
created_date: '2026-08-07 12:30'
labels:
  - ready-for-agent
dependencies:
  - TASK-158.2
  - TASK-158.3
parent_task_id: TASK-158
ordinal: 275000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en natt där sessionsdok-roten vuxit förbi fönstret slutar i ett tilldelat larm-ärende med run-länk; en natt inom fönstret är tyst grön. Täcker användarberättelser: 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grinden läser fönsterregeln ur samma policy-konfig som skriptet — ingen duplicerad konstant
- [ ] #2 Rött-först-bevis mot fixtur som överskrider fönstret (self-test), grönt-bevis mot migrerad rot — båda bokförda med run-länkar
- [ ] #3 Rött utfall når larmkedjan som tilldelat ärende (nattnätets befintliga form) — aldrig tyst
- [ ] #4 PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
