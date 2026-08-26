---
id: TASK-224
title: 'Fynd: stale vite.config-kommentar om login-porträttbild'
status: To Do
assignee: []
created_date: '2026-08-15 09:06'
updated_date: '2026-08-26 03:33'
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
- [x] #1 Forensik-utfallet i notes: webp-assets som faktiskt byggs listade; kommentaren rättad till sanningen ELLER webp struken ur globben med belägg
- [x] #2 npm run build grön; precache-manifestet oförändrat i innehåll om bara kommentaren rättas
- [x] #3 DoD-kvartetten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#1 FORENSIK-UTFALL: bilden BYTTE hemvist, kommentaren rättad till sanningen. git log -S"roger-och-lotta" visar: bilden skapades 2026-08-03 (S96, commit 3403467b) som login-vyns porträttbild, men login.tsx innehåller den inte längre (grep-verifierat, 0 träffar). Kommandot task-273.6 (commit 10cb2a20, 'bakgrundsbild i stället för logga och text') flyttade den till Forberedelseskarm.tsx som fönsterfyllande bakgrundsfoto (bg-[url('/roger-och-lotta.webp')]). EXAKT en webp-asset finns i public/ i dag (find public -iname '*.webp'): public/roger-och-lotta.webp. vite.config.ts:s kommentar rättad till att peka på Forberedelseskarmen i stället för login-vyn.

AC#2: npm run build grön (exit 0). Precache-manifestet oförändrat i INNEHÅLL (endast kommentartext ändrad, globPatterns-strängen orörd) — verifierat: dist/sw.js innehåller fortsatt exakt 'roger-och-lotta.webp' i precache-listan, build-loggen visar 137 entries (2407.65 KiB), samma mönster som förr eftersom globPatterns-VÄRDET inte rördes.
<!-- SECTION:NOTES:END -->
