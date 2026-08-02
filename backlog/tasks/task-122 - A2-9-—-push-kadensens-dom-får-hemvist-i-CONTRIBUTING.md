---
id: TASK-122
title: 'A2:9 — push-kadensens dom får hemvist i CONTRIBUTING'
status: To Do
assignee: []
created_date: '2026-08-02 08:08'
labels: []
dependencies: []
priority: medium
ordinal: 194000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restlistans § A2 Punkt 9 (plockad 2026-08-02, beslutsbordet S91 — kort mintas när posten plockas, per postens egen regel): push-kadens-passets dom bor bara i research-doket och kan därför varken försvaras när den ifrågasätts eller ärvas av en ny agent.

DOMEN (docs/research/push-kadens-agent-arbetstrad-2026-07-26.md): vår kadens är RÄTT — en commit per PR, 7–11 PR:er/dag; trunk-based sätter golvet vid en integration per dygn, DORA-elit vid högst tre aktiva brancher; branch→flera-commits→sen-push är semi-integration (Fowler). Kärnan som skrivs ned är SEPARATIONEN: commit-frekvens är gratis, push-frekvens kostar en full CI-körning plus en plats i staging-mutexen.

Buntas INTE med A7:7 (TASK-70.5) trots samma fil — postens egen regel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Domen inskriven i CONTRIBUTING.md under Pull Request-flödet, med separationen commit-frekvens/push-frekvens och källpekare till research-doket
- [ ] #2 Restlistans Punkt 9 bruten till pekare + loggrad i samma landning (status bor i EN yta)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
