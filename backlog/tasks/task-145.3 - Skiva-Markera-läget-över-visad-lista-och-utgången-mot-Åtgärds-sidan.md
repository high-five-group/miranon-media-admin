---
id: TASK-145.3
title: 'Skiva: Markera-läget över visad lista och utgången mot Åtgärds-sidan'
status: To Do
assignee: []
created_date: '2026-08-07 08:58'
updated_date: '2026-08-07 11:39'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.1
  - TASK-145.2
parent_task_id: TASK-145
ordinal: 235000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta filtrerar fram de nio som saknar slutbetalning, slår på Markera, bockar sex av dem och trycker Åtgärder. Urvalet följer med vidare. Hon kan lika gärna markera utan att först filtrera. När hon slår på markera-läget hoppar inte sidan.

Täcker användarberättelser: 11, 12, 13, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Att slå på och av markera-läget förskjuter inte sidans innehåll vertikalt (mätt i renderad DOM)
- [ ] #2 Batch-barens primärknapp bär texten Åtgärder och tar urvalet vidare; bekräfta-flödet med kontrollfråga är RIVET ur eventsidan, inte dolt
- [ ] #3 Utgången är en ärlig interim-platshållare så länge Åtgärds-sidan inte finns — ingen chevron som lovar en navigation som saknas
- [ ] #4 Avprickningens E2E-täckning hanteras EXPLICIT när bekräfta-flödet rivs: filen tas inte bort tyst utan att TASK-147 bär skulden att återupprätta täckningen på Åtgärds-sidan
<!-- AC:END -->





## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [ ] #6 test:visual omtagen med granskade baslinjer — drift är väntad, inte accepterad osedd
- [ ] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [ ] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->
