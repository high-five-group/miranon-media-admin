---
id: TASK-273.6
title: 'Skiva: Förberedelseskärmen — bakgrundsbild i stället för logga och text'
status: Done
assignee: []
created_date: '2026-08-17 15:48'
updated_date: '2026-08-20 07:14'
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
- [x] #1 Loggan och texten Förbereder ditt administrationsverktyg är borta ur Förberedelseskärmens renderade yta; loadingbaren (6 px sage, task-273.1:s form) är kvar orörd
- [x] #2 Bakgrundsbilden public/roger-och-lotta.webp renderas centrerad och täcker hela webbläsarfönstret vid renderingstillfället (cover-beteende), med ett kraftigt vitt överlager så bilden är dov och baren tydligt läsbar (Marcus form-beskrivning 2026-08-17)
- [x] #3 Tillgängligheten bevarad: skärmens tillgängliga namn/statusannonsering för skärmläsare finns kvar trots att den synliga texten tas bort; kontrasten bar-mot-överlagrad-bakgrund uppfyller WCAG 1.4.11 (mätt); contrast-more ger fullgod kontrast (bilden får tonas ned ytterligare eller döljas där); reduced-motion och stall-läget oförändrade
- [x] #4 Startupplevelsen inte märkbart försämrad av bildvikten — vald laddningsstrategi bokförd i rapporten (webp:en är förhållandevis stor och detta är appens FÖRSTA skärm)
- [x] #5 Berörda tester (a11y-/acceptanssviter som asserterar den borttagna texten) uppdaterade i samma landning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Förberedelseskärmen rensad till enbart laddningsbaren, med Roger & Lotta-foto som dov fönsterfyllande bakgrund — PR #1580 (e1b27f2a), CI grön per jobb. Uppföljande QA-fynd (fel bild/rännsten/utloggning) spårade separat i TASK-276, ej mitt att röra.
<!-- SECTION:FINAL_SUMMARY:END -->
