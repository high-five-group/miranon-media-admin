---
id: TASK-161.2
title: 'Skiva: A — all mätt drift rättas'
status: To Do
assignee: []
created_date: '2026-08-07 19:03'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-161
ordinal: 292000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: efter landningen motsäger ingen styrande prosa disk — de åtta mätta drift-instanserna plus bifynden är rättade eller eliminerade. Täcker användarberättelser: 1, 11
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga drift-instanser ur Explore-kartan (S99 Del 10-referensen) rättade mot disk-facit: airtable-interaction EF-antal + operationsregister + radreferenser; byggplanens döda auktoritets-pekare + ADR-räkningen; CLAUDE.md:s token-exempel (verifiera mot faktiska tokens i src/styles/tokens/) + D0-glob-kopian (mot ci.yml:s paritetsmarkörer) + grind-talens fria kopior; README-badges mot rätt org; ci.yml rad ~573-kommentaren (9→14); hur-systemet-funkar-datummotsägelsen
- [ ] #2 tasks/lessons.md RÖRS INTE (volym-split-skivan äger den filen inkl. stale-raderna); varje rättelse är eliminering ELLER disk-synk — ingen ny kopia föds
- [ ] #3 Kodfyndet bokförs som eget fynd-kort: AtgardsSida.tsx konsumerar var(--mm-color-primary) som aldrig definieras — kortet får exakt symptom + förväntat beteende, fixas INTE i denna skiva (docs-skiva rör inte src/)
- [ ] #4 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
