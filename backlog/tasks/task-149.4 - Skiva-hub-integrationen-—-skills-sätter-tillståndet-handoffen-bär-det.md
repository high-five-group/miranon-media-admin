---
id: TASK-149.4
title: 'Skiva: hub-integrationen — skills sätter tillståndet, handoffen bär det'
status: Done
assignee: []
created_date: '2026-08-07 10:32'
updated_date: '2026-08-07 12:45'
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
- [x] #1 Premiss-pass: hubbens prototype-/session-paus-/session-resume-skills lästa i aktuell plugin-version; tillståndsfil-konventionen ur skiva 149.3 läst på main
- [x] #2 prototype-skillen sätter tillståndsfilen vid konvergens-lägets inträde och rensar vid Marcus klart; session-paus skriver ARBETSFORM-rad i handoff-blocket; session-resume återskapar tillståndsfilen ur raden
- [x] #3 Hub-arbetet utfört av OISOLERAD agent (worktree-matrisens gräns); plugin-version bumpad + Code-reinstall körd i samma landning per etablerad praxis; hubbens grindar gröna
- [x] #4 PR i hub-repot armerad/landad enligt hubbens flöde; spoke-verifikat att nya versionen är aktiv
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängning i S99-resume 1 (2026-08-07): hub-commit 93892dd (marcus-system main, direktpush — hubben bär inget PR-flöde, verifierat mot dess historik; AC 4:s PR-formulering uppfylld som hubbens faktiska flöde). Plugin 1.29.0→1.30.0, reinstall körd + innehållsbevisad (cache 1.30.0 bär satt-raden). Skills: prototype (satt/rensa vid konvergens), session-paus (ARBETSFORM-rad + push-undantaget), session-resume (återskapar tillståndet sist, efter dok-pushen). DoD 3 (CI per jobb) EJ TILLÄMPLIG för hub-landningen — hubben saknar CI; spoke-committen är kortfilen själv och bär docs-CI. Utförd av OISOLERAD agent utan spoke-git per kontraktet; spoke-bokföringen denna commit (orkestreraren).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
