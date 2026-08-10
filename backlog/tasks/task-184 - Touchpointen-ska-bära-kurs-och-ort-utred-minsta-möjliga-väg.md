---
id: TASK-184
title: Touchpointen ska bära kurs och ort - utred minsta möjliga väg
status: To Do
assignee: []
created_date: '2026-08-10 09:16'
labels:
  - bas-maximering
  - utredning
dependencies: []
ordinal: 349000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Senaste interaktion-texten på Personer ska kunna säga 'Anmälde sig till RIM 1 i Trollhättan 7 maj 2026', men Touchpoints-tabellen har i dag ingen väg till kursen eller orten. Utred vad som FAKTISKT krävs - antagandet att det behövs backfill är oprövat (Marcus invändning 2026-08-10: ett länkat fält plus lookup kan räcka om länken går att härleda). Gäller BÅDA baserna. Föregås av S103:s formeländring som redan ger erbjudande- och deltagandegrenarna rätt text.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Utredningen redovisar minsta möjliga väg med belägg per steg,Backfill-behovet är avgjort mot faktisk data och inte antaget,Vägen är prövad i staging innan prod,Båda basernas paritet är verifierad och inte antagen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
