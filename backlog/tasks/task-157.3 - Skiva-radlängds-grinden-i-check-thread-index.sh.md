---
id: TASK-157.3
title: 'Skiva: radlängds-grinden i check-thread-index.sh'
status: To Do
assignee: []
created_date: '2026-08-07 11:34'
labels:
  - ready-for-agent
dependencies:
  - TASK-157.2
parent_task_id: TASK-157
ordinal: 269000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: nästa försök att skriva narrativ i en indexrad stoppas i CI med en anvisning som pekar mot kortet — formen kan inte drifta tillbaka. Täcker användarberättelse: 3
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: migrerade registret läst på main (alla rader under taket); check-thread-index.sh:s struktur + befintliga sex invarianter lästa; taket hämtas ur policy-konfig, inte hårdkodas
- [ ] #2 Invariant 7 byggd: rad över taket fäller med radnummer + uppmätt längd + anvisning (flytta narrativet till kortet); rött-först-bevis via self-test mot fixtur — aldrig mot live-registret
- [ ] #3 Tvåsidig testsvit utökad (fäller fet fixtur-rad · släpper tunn · fail-closed); shellcheck-strict grön; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
