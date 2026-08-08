---
id: TASK-161.9
title: 'Skiva: volym-spliten — spoke-lessons per ADR-085:s form'
status: Done
assignee: []
created_date: '2026-08-07 19:13'
updated_date: '2026-08-08 06:44'
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
- [x] #1 Premiss-pass: ADR-085 (hubbens volym-split) läst i sin helhet + hubbens faktiska volymstruktur inspekterad som facit; tasks/lessons.md:s beroende-ytor inventerade (check-lesson-numbers.sh, lessons-hub-sync-skillen, CLAUDE.md-referenser) FÖRE flytt
- [x] #2 tasks/lessons.md splittad per ADR-085:s form (precedent-tillämpning — inget nytt formbeslut): volymfiler + tunn indexerad ingång; de två stale-raderna i filhuvudet rättade (Senaste lyft + läses-varje-session-påståendet ersätts med sanning + pekare till session-start-skillens läsregel); INGEN lesson raderas, numrering obruten, git-flytt där form tillåter
- [x] #3 check-lesson-numbers.sh grön mot nya strukturen (utökas vid behov, tvåsidigt testad); lessons-hub-sync-skillens spoke-antaganden verifierade mot nya formen — divergens bokförs öppet som hub-följdärende, skillen ändras INTE härifrån
- [x] #4 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 3 (2026-08-08): PR #964 mergad d8ee1c1f, per-jobb-grön (gh pr checks: 0 fail/pending). 462 lessons verbatim-splittade i sex volymer (byte-diff 0 per volym; referens-invariant 89 H2/550 H3/211 wiki-refs summerar exakt mot källan), tunt index med de två stale-raderna ersatta av källmärkt sanning + läsregel-pekare. check-lesson-numbers.sh multi-fil via LESSON_FILE_GLOB i .lesson-policy.conf, tvåsidigt testad 8/8 inkl. två NYA fall (T7 cross-fil-dubblett fäller, T8 unika släpper). Divergens mot ADR-085:s bokstav öppet löst: spoke-filen bytte konvention efter Session 59 (flat utan H2) — vol-04–06 delade vid L-nummergränser, bokfört i indexets not. Hubbens egen split använde INTE git mv (verifierat mot hub-commit f3ab954) — samma add+delete-form följd. Fullt DoD kört (ci.yml berörd av lychee-glob). HUB-FÖLJDÄRENDE ÖPPET: lessons-hub-sync-skillens monolit-greppar (SKILL.md rad 54/85/233-248 + stale exempel rad 59) ger tomt mot volymformen — bärs till 161.7-agentens kontext + hub-lyftet; skillen ej ändrad härifrån.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
