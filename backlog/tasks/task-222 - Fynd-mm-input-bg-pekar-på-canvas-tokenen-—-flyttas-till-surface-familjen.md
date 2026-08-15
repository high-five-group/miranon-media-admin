---
id: TASK-222
title: 'Fynd: --mm-input-bg pekar på canvas-tokenen — flyttas till surface-familjen'
status: To Do
assignee: []
created_date: '2026-08-15 09:04'
labels:
  - ready-for-agent
dependencies: []
ordinal: 425000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 gul-experimentets fynd (2026-08-15, bokfört i Del 7): --mm-input-bg pekar på var(--mm-bg) i komponent-token-lagret — inputfälten ÄRVER SIDBAKGRUNDEN, vilket bara ser rätt ut så länge canvas och kontrollyta båda är vita. Latent brist oavsett färgval: varje framtida ändring av canvas-tonen målar om alla inputfält. Semantiskt hör input-ytan till surface-familjen (kontrollyta), inte canvas. Ändringen är visuellt neutral i dag (båda är neutral-0). Global-gul-idén i sig är SKROTAD (Marcus decline efter skarp visning, Del 7) — detta kort är strukturfixen som överlever skrotningen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 --mm-input-bg pekar på surface-familjen i stället för canvas-tokenen; visuellt neutral förändring (samma renderade värde i dag)
- [ ] #2 Svep efter samma kortslutningsklass i components.css: övriga komponent-tokens som pekar på --mm-bg klassas medvetet (canvas-avsikt eller kontrollyta) med grep-belagd lista i notes
- [ ] #3 Hermetiska visual-sviten grön (bevisar neutraliteten)
- [ ] #4 DoD-kvartetten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
