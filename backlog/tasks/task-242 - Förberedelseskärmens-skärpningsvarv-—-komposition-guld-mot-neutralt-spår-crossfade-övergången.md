---
id: TASK-242
title: >-
  Förberedelseskärmens skärpningsvarv — komposition, guld mot neutralt spår,
  crossfade-övergången
status: To Do
assignee: []
created_date: '2026-08-16 09:34'
updated_date: '2026-08-16 10:45'
labels:
  - ready-for-agent
dependencies: []
ordinal: 444000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-kvittens 2026-08-16 på research-passets fyra domar (docs/research/forberedelseskarm-splash-branschmonster-2026-08-16.md, § Rekommendationer): (1) logo + indikator + stegtext centrerade som login-blockets placering · (2) progressbar med guld-fyllnad mot NEUTRALT spår (Carbon/Polaris/HIG samstämmiga — helgrå bar vore under mönstret) · (3) mjuk crossfade splash→app med appens egen reveal-animation (--animate-mm-avsloj, 0,2 s — dagens hårda växling bryter mot Metas explicita fade-in-regel) med prefers-reduced-motion-respekt · (4) stegtexten kvar, ingen %-siffra. Koordineras med task-240 (loadingbar-buggen, samma yta).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Kompositionen centrerad som login-blocket (samma layoutankare, verifierat sida-vid-sida på renderad yta)
- [x] #2 Baren: guld-fyllnad mot neutralt spår via tokens — inga hårdkodade färger
- [x] #3 Crossfade splash→app med appens reveal-animation; reduced-motion ger direkt byte utan animation (båda lägena bevisade på renderad yta)
- [x] #4 Stegtexten kvar; ingen procent-siffra introducerad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
