---
id: TASK-242
title: >-
  Förberedelseskärmens skärpningsvarv — komposition, guld mot neutralt spår,
  crossfade-övergången
status: Done
assignee: []
created_date: '2026-08-16 09:34'
updated_date: '2026-08-17 08:17'
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
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad via PR #1400 (merge 475ebcbf, 2026-08-16) genom merge-kön efter TVÅ CI-fångade varv: (1) min-h-dvh-staplingen, (2) den verkliga mekanismen — reveal-animationens translateY(8px) inflaterar dokumentets scrollhöjd på helsides-element (isolerat mätt 852 vs 844 px) → ny opacity-ren tona-in-animation för app-entrén, original-animationen orörd för sina fem konsumenter, TabBar-transform-risken eliminerad helt. AC1 komposition = login-blockets mått · AC2 guld-mot-neutralt-spår var redan korrekt (explicit verifierat, ingen ändring) · AC3 crossfade bevisad i båda motion-lägena · AC4 stegtext orörd utan procent. Residual: Marcus spot-check av övergången på skarp autentiserad yta (bokfört i paus-handoffen).
<!-- SECTION:FINAL_SUMMARY:END -->
