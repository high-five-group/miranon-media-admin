---
id: TASK-273.6
title: 'Skiva: Förberedelseskärmen — bakgrundsbild i stället för logga och text'
status: To Do
assignee: []
created_date: '2026-08-17 15:48'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-273
ordinal: 500000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus tillägg 2 (2026-08-17) till UI-fixpaketet: Förberedelseskärmen rensas till enbart loadingbaren, med Roger & Lotta-fotot (public/roger-och-lotta.webp — enda RL-bilden i repot, orginalnamn hos Marcus: RL cover/header 2) som dov, centrerad, fönsterfyllande bakgrund bakom baren. Förberedelseskärmen bär inget facit-manifest (verifierat vid PRD-syntesen) — ändringen bokförs i skivans rapport. Bygger ovanpå task-273.1 (landad, main 35f832f4). Täcker PRD task-273:s användarberättelser 1-2 i utvidgad form.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Loggan och texten Förbereder ditt administrationsverktyg är borta ur Förberedelseskärmens renderade yta; loadingbaren (6 px sage, task-273.1:s form) är kvar orörd
- [ ] #2 Bakgrundsbilden public/roger-och-lotta.webp renderas centrerad och täcker hela webbläsarfönstret vid renderingstillfället (cover-beteende), med ett kraftigt vitt överlager så bilden är dov och baren tydligt läsbar (Marcus form-beskrivning 2026-08-17)
- [ ] #3 Tillgängligheten bevarad: skärmens tillgängliga namn/statusannonsering för skärmläsare finns kvar trots att den synliga texten tas bort; kontrasten bar-mot-överlagrad-bakgrund uppfyller WCAG 1.4.11 (mätt); contrast-more ger fullgod kontrast (bilden får tonas ned ytterligare eller döljas där); reduced-motion och stall-läget oförändrade
- [ ] #4 Startupplevelsen inte märkbart försämrad av bildvikten — vald laddningsstrategi bokförd i rapporten (webp:en är förhållandevis stor och detta är appens FÖRSTA skärm)
- [ ] #5 Berörda tester (a11y-/acceptanssviter som asserterar den borttagna texten) uppdaterade i samma landning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
