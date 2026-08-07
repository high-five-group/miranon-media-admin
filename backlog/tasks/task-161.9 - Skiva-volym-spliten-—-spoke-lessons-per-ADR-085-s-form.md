---
id: TASK-161.9
title: 'Skiva: volym-spliten — spoke-lessons per ADR-085:s form'
status: To Do
assignee: []
created_date: '2026-08-07 19:13'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-161
ordinal: 299000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: spoke-lessons bär samma volymform som hubben beslutade i ADR-085 — monoliten på 794 000 tecken blir navigerbara volymer med tunn ingång, och filhuvudet talar sanning. Täcker användarberättelse: 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: ADR-085 (hubbens volym-split) läst i sin helhet + hubbens faktiska volymstruktur inspekterad som facit; tasks/lessons.md:s beroende-ytor inventerade (check-lesson-numbers.sh, lessons-hub-sync-skillen, CLAUDE.md-referenser) FÖRE flytt
- [ ] #2 tasks/lessons.md splittad per ADR-085:s form (precedent-tillämpning — inget nytt formbeslut): volymfiler + tunn indexerad ingång; de två stale-raderna i filhuvudet rättade (Senaste lyft + läses-varje-session-påståendet ersätts med sanning + pekare till session-start-skillens läsregel); INGEN lesson raderas, numrering obruten, git-flytt där form tillåter
- [ ] #3 check-lesson-numbers.sh grön mot nya strukturen (utökas vid behov, tvåsidigt testad); lessons-hub-sync-skillens spoke-antaganden verifierade mot nya formen — divergens bokförs öppet som hub-följdärende, skillen ändras INTE härifrån
- [ ] #4 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
