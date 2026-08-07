---
id: TASK-148.7
title: 'QA: väntekontraktet ände-till-ände'
status: To Do
assignee: []
created_date: '2026-08-07 09:53'
labels:
  - ready-for-human
dependencies:
  - TASK-148.1
  - TASK-148.2
  - TASK-148.3
  - TASK-148.4
  - TASK-148.5
  - TASK-148.6
parent_task_id: TASK-148
ordinal: 253000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan: (1) starta ny session, betala skarpbevis-skulden med differentialmätningen; (2) spawna en verklig bygg-agent mot ett kastbart uppdrag och provocera väntemekanismerna; (3) läs dokumentkedjan i följd och pröva varje pekare. Alltid ready-for-human.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skarpbevis-skulden från spärr-skivan betald i ny session: differentialmätning (ny hook fäller i subagent-spawn medan befintlig hook bevisat laddad fäller i harnesset) — skild från hooken-är-fel
- [ ] #2 Spärrens beteende verifierat i verklig agent-spawn: subagent nekas Monitor/run_in_background med läsbart skäl; huvudsessionens egna bakgrundsmönster opåverkade
- [ ] #3 Dokumentkedjan sammanhängande läst: ADR-096 ↔ CLAUDE.md-principraden ↔ bygg-agent-instruktionen ↔ T112 § (iv)-svaret — inga motsägelser eller föråldrade pekare
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
