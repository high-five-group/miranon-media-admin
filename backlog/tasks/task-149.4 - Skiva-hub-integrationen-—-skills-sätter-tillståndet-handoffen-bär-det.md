---
id: TASK-149.4
title: 'Skiva: hub-integrationen — skills sätter tillståndet, handoffen bär det'
status: To Do
assignee: []
created_date: '2026-08-07 10:32'
labels:
  - ready-for-agent
dependencies:
  - TASK-149.1
  - TASK-149.3
parent_task_id: TASK-149
ordinal: 258000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: iterationsläge överlever paus → resume utan att någon skill behöver laddas för att regeln ska nå utföraren — tillståndet följer arbetet, inte dörren. Täcker användarberättelser: 1, 2
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: hubbens prototype-/session-paus-/session-resume-skills lästa i aktuell plugin-version; tillståndsfil-konventionen ur skiva 149.3 läst på main
- [ ] #2 prototype-skillen sätter tillståndsfilen vid konvergens-lägets inträde och rensar vid Marcus klart; session-paus skriver ARBETSFORM-rad i handoff-blocket; session-resume återskapar tillståndsfilen ur raden
- [ ] #3 Hub-arbetet utfört av OISOLERAD agent (worktree-matrisens gräns); plugin-version bumpad + Code-reinstall körd i samma landning per etablerad praxis; hubbens grindar gröna
- [ ] #4 PR i hub-repot armerad/landad enligt hubbens flöde; spoke-verifikat att nya versionen är aktiv
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
