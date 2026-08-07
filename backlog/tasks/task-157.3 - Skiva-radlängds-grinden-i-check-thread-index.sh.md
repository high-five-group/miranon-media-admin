---
id: TASK-157.3
title: 'Skiva: radlängds-grinden i check-thread-index.sh'
status: Done
assignee: []
created_date: '2026-08-07 11:34'
updated_date: '2026-08-07 16:37'
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
- [x] #1 Premiss-pass: migrerade registret läst på main (alla rader under taket); check-thread-index.sh:s struktur + befintliga sex invarianter lästa; taket hämtas ur policy-konfig, inte hårdkodas
- [x] #2 Invariant 7 byggd: rad över taket fäller med radnummer + uppmätt längd + anvisning (flytta narrativet till kortet); rött-först-bevis via self-test mot fixtur — aldrig mot live-registret
- [x] #3 Tvåsidig testsvit utökad (fäller fet fixtur-rad · släpper tunn · fail-closed); shellcheck-strict grön; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TRIAGE-INSPEL från 157.1-agenten (2026-08-07): check-thread-index.sh tar >2 min vid 100 % CPU för 132 trådar — trolig O(n²) i tid_exists/nästlade loopar. Radlängds-grinden byggs i samma familj: ärv INTE mönstret; håll grinden O(n) och överväg att flagga befintlig kostnad som eget fynd-kort om den består efter migrationen (157.2 krymper radlängd, inte trådantal).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 2 (2026-08-07): PR #923 mergad 3ac234e1, per-jobb-grön (12 pass + 3 klassnings-skip, 0 röda). Invariant 7 med rött-först-bevis (28/28), tak i policy-conf (THREAD_ROW_MAX_LEN=500), shellcheck 0 mot CI-pin. O(n²)-triaget FALSIFIERAT av mätning: 5,65 s mot live-registret efter 157.2-migrationen — inget fynd-kort behövs.
<!-- SECTION:FINAL_SUMMARY:END -->
