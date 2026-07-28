---
id: TASK-67
title: >-
  Skiva: Landnings-ordningen som regel — BEHIND förebyggs i stället för att
  lagas
status: To Do
assignee: []
created_date: '2026-07-28 13:06'
labels:
  - ready-for-agent
dependencies: []
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restlistans steg 4 (A2 punkt 5): landnings-ordningen är TILLÄMPAD men inte KODAD. Den lever som omdöme, och omdöme är den empiriskt svagaste mekanismen.

PROBLEMET (L328 [UNIVERSAL], S81): med 'require branches to be up to date' (strict) på required-checken måste en PR:s branch innehålla main-toppen vid merge. En PR vars svit tar ~10 min förlorar racet mot varje parallell docs-PR (~1 min CI): main flyttar sig under sviten -> BEHIND -> gh pr update-branch -> ny 10-min-svit -> main har flyttat sig igen. Tre varv i S81 innan den parallella strömmen sinade.

EMPIRIN SOM GÖR DEN AKUT: orkestreraren gick i fällan TVÅ gånger under en och samma resume 2026-07-28, trots att L328 varit nedskriven sedan S81. En nedskriven lärdom utan grind tillämpas inkonsekvent (jfr fragmentet lardom-utan-grind-tillampas-inkonsekvent.md).

OCH TRYCKET ÖKAR: worktree-isoleringen (#327) gör fler parallella agenter normalfall, alltså fler parallella PR:er, alltså mer BEHIND-tryck. Restlistan noterar uttryckligen att denna post INTE konvergerar med isoleringen — BEHIND är en annan felmekanism.

FORMEN SOM FUNGERADE NÄR DEN TILLÄMPADES (ur restlistan): låt den TYNGRE PR:en landa först, eller kör gh pr update-branch på nästa FÖRE armering i stället för att laga BEHIND efteråt.

BIKOSTNAD SOM MÅSTE MED I REGELN: en CI-vakt startad mot en SHA blir felaktig i samma stund grenen uppdateras — vakten ska stoppas och startas om mot den nya SHA:n. Utan den raden byter regeln en felklass mot en annan.

AVGRÄNSNING: detta är en REGEL-skiva, inte en automation. Den ska bo där den läses av den som sekvenserar PR-kön — CONTRIBUTING.md och/eller .claude/agents/-instruktionerna. Bygg ingen kö-automat; merge queue är en egen post (A4) och ska inte föregripas här.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Regeln är nedskriven med sin utlösare (parallella PR:er + heterogena CI-tider + strict), inte bara sitt recept
- [ ] #2 Båda de fungerande formerna står: tyngre PR först, ELLER update-branch före armering
- [ ] #3 CI-vaktens SHA-bikostnad är med — vakt mot gammal SHA stoppas och startas om
- [ ] #4 Hemvisten är den som faktiskt läses vid PR-sekvensering; valet är motiverat i skivan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
