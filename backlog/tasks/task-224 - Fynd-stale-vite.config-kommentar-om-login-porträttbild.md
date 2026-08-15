---
id: TASK-224
title: 'Fynd: stale vite.config-kommentar om login-porträttbild'
status: To Do
assignee: []
created_date: '2026-08-15 09:06'
labels:
  - ready-for-agent
dependencies: []
ordinal: 427000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Explore-svepets fynd (2026-08-15): kommentaren i vite.config.ts:s PWA-block motiverar webp i precache-globben med 'login-vyns porträttbild' — men login-vyn innehåller ingen bild längre (grep-verifierat). Kommentaren är en kvarleva. FÖRSTA STEGET är forensik: hitta var bilden faktiskt bor i dag (valkommen? borttagen?) och rätta kommentaren till sanningen — eller ta bort webp ur globben om ingen webp-asset längre precachas (mät faktisk asset-mängd före beslut).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Forensik-utfallet i notes: webp-assets som faktiskt byggs listade; kommentaren rättad till sanningen ELLER webp struken ur globben med belägg
- [ ] #2 npm run build grön; precache-manifestet oförändrat i innehåll om bara kommentaren rättas
- [ ] #3 DoD-kvartetten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
