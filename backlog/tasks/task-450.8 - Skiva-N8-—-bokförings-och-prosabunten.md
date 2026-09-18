---
id: TASK-450.8
title: 'Skiva: N8 — bokförings- och prosabunten'
status: To Do
assignee: []
created_date: '2026-09-18 09:54'
labels:
  - ready-for-agent
dependencies:
  - TASK-450.1
  - TASK-450.2
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: medium
ordinal: 782000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fem små rättelser mot den felklass granskningen hittade flest gånger: text som var sann när den skrevs och blev falsk av en senare landning. (a) Fyra falska textställen rättas, och för de två talen ersätts talet med kommandot som räknar, så påståendet aldrig kan bli inaktuellt igen. (b) TASK-365:s rotorsaksbeskrivning ersätts med den mätta mekanismen (N3 landad) och pekas mot tråd T166. (c) TASK-239 AC #3 bockas med run-ID:n som belägg (31 gröna acceptance-nätter i följd). (d) Review-grindens kalibreringskanal tas i bruk: de produktionsfel ägaren själv hittat bokförs som grind-missar. Hubbens rad om popup-frågor (påstår PROSA trots att en hook nekar verktyget) rättas i hubbens egen kanal som separat commit. Kort ändras ENDAST via backlog-CLI:t. Spec: planens § N8. Landas sist så den kan bära resultatet av N2 och N3.

Täcker användarberättelser: 11, 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 grep på de fyra falska fraserna ger noll kvarvarande träffar; de två talen är ersatta av kommandot som räknar
- [ ] #2 npm run bl -- task 365 --plain visar den mätta mekanismen och pekaren mot T166
- [ ] #3 npm run bl -- task 239 --plain visar AC #3 bockad med run-ID:n
- [ ] #4 npm run review:metrics visar minst en kalibrering-rad, med belägg per post
- [ ] #5 Hubbens rad rättad i hub-repot som egen commit (eller öppet bokförd som överlämnad till Marcus)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
