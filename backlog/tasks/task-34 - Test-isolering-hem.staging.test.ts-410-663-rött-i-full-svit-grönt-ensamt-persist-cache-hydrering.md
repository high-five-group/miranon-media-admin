---
id: TASK-34
title: >-
  Test-isolering: hem.staging.test.ts:410 + :663 rött i full svit, grönt ensamt
  (persist-cache-hydrering)
status: To Do
assignee: []
created_date: '2026-07-23 02:06'
labels: []
dependencies: []
ordinal: 83000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur S75 batch 4 (task-18.5 + task-17.5:s bygg-agenter, oberoende observerat).

tests/e2e/hem.staging.test.ts:410 (task-4.3 'dagar-kvar-pillen: tre exakta former') OCH :663 (task-4.4 'anmälningslistan: namn 16/600 + relativ tid, fast klocka') FALLERAR i full parallell svit men PASSERAR ensamma (hem-filen 29/29).

ROTORSAK (410): testet loopar tre dagar-kvar-fall via reload, men DOM:en visar fortfarande fall 1:s data ('71 dagar kvar') när fall 2 ('1 dag kvar') förväntas — persist-cache-hydreringens klass. Samma familj som TASK-28-fyndet, som 18.4:s svit löste genom SKILDA event-ID:n i stället för reload.

BEVISAT PRE-EXISTERANDE: baseline på förgrenings-SHA med batch-ändringar stashade ger exakt samma röda — inget batch-kort införde det. (19.3:s post-CI-bokföring rapporterade dock grön main-CI på samma SHA, så CI-miljön kan vara mindre känslig; isolerings-svagheten i testerna är verklig oavsett.)

FÖRESLAGEN FIX: skilda query-nycklar per scenario i stället för reload (samma form som 18.4 använde för TASK-28).

Oetiketterat per fynd-regeln — människan klassar.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
