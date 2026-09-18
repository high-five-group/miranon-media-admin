---
id: TASK-465
title: >-
  Anmälnings-sentineler städas i samma körning som skapar dem — seed-eventet har
  blivit CI:s soptipp (#2544, #2549)
status: To Do
assignee: []
created_date: '2026-09-18 22:55'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 806000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efterkontrollen blev röd två gånger 2026-09-18 (larmärenden #2544 på a046d29c och #2549 på ab6b2127) med "apiRequestContext.get: Request context disposed" i send-registration-confirmation.staging.test.ts:192 och cancel-registration.staging.test.ts:232. Diagnosen (docs/research/flake-request-context-disposed-2026-09-19.md, S126 resume 2) visar att "disposed" är ett symptom: raden före säger "Test timeout of 30000ms exceeded" (stickprovat av orkestreraren: 3 träffar i körning 35343753042, 3 + 3 i 35346136785).

Rotorsak, direktmätt mot staging: seed-eventet reci2UQEPBMl3ebNl bär 188 anmälningar varav 185 är CI:s egna create-test+…@staging.test-sentinels, och get-registrations?eventId= är O(n) i eventets anmälningar (~0,17 s per anmälan: 4 poster 2,5 s · 10 poster 4,5 s · 17 poster 7,4 s · 188 poster 34,4 s) — alltså över testets 30 s-tak. Sentinelerna städas aldrig i tid: efter-körning-purgen når bara det som registrerats i ägar-manifestet (tests/support/kastbara-poster.ts), och anmälnings-sviterna registrerar sig inte där (0 träffar på 'kastbara-poster' i de två fallande testfilerna). Varje omförsök skapar dessutom en ny sentinel innan det går över tiden — felet matar sin egen orsak. #2543 frias: samma test föll 26 minuter före dess landning.

Åtgärd i två led: (a) ENGÅNGSSTÄDNING av de kvarliggande sentinelerna på seed-eventet, genom repots purge-maskineri (aldrig för hand), med torrkörning först; (b) sviterna som skapar anmälningar registrerar dem i ägar-manifestet så att efter-körning-purgen tar dem i SAMMA körning. Testtaket höjs INTE — 30 s är inte för lågt, datamängden blev för stor.

Skyddsräcken: endast staging-basen; endast poster vars e-post matchar sentinel-mönstret OCH som hänger på seed-eventet; de tre icke-sentinel-anmälningarna och de permanenta rollup-fixturerna rörs aldrig (.purge-staging-policy.json, CLAUDE.md § Granskningsdata); ZZ-GRANSKNING-* blir aldrig purge-bar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Engångsstädning: torrkörningens lista (antal + mönster) redovisad i PR-kroppen FÖRE radering; efter städningen bär seed-eventet endast icke-sentinel-anmälningar, och de permanenta fixturerna är orörda (mätt före/efter)
- [ ] #2 Varje staging-svit som skapar anmälningar (minst send-registration-confirmation, cancel-registration, create-registration — sök upp ALLA) registrerar sina poster i ägar-manifestet tests/support/kastbara-poster.ts, även när testet fallerar eller går över tiden
- [ ] #3 Efter-körning-purgen raderar dem i samma körning — bevisat i en CI-logg med antal skapade = antal raderade
- [ ] #4 readRegistration mot seed-eventet mätt under 3 sekunder efter städningen (tre mätningar, redovisade)
- [ ] #5 Testtaket 30 s är oförändrat; en vakt eller ett loggat mätvärde gör att seed-eventets anmälningsantal inte kan svälla obemärkt igen (billigaste formen som larmar FÖRE taket nås — inget nytt CI-jobb)
- [ ] #6 Larmärendena #2544 och #2549 stängs av orkestreraren med pekare hit när en grön efterkontroll bär fixen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
