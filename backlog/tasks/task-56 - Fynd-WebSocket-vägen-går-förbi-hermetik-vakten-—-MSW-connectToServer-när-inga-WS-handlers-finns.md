---
id: TASK-56
title: >-
  Fynd: WebSocket-vägen går förbi hermetik-vakten — MSW connectToServer() när
  inga WS-handlers finns
status: To Do
assignee: []
created_date: '2026-07-27 16:56'
updated_date: '2026-07-27 19:47'
labels:
  - ready-for-agent
dependencies: []
ordinal: 121000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM: I den hermetiska fixturvärlden (tests/visual/) vaktas allt HTTP-nätverk av hermetik-vakten sedan task-54.2, men WebSocket-trafik gör det inte. Bindningen @msw/playwright registrerar context.routeWebSocket med ett match-all-mönster, och när inga WebSocket-handlers är registrerade anropar den route.connectToServer() — alltså en verklig uppkoppling mot den riktiga adressen (fixture.ts rad 156-166, verifierad i node_modules 2026-07-27).

FÖRVÄNTAT BETEENDE: en WebSocket-uppkoppling som ingen handler täcker ska fälla testet på samma sätt som ett omockat HTTP-anrop gör — med adressen namngiven — i stället för att tyst gå ut på nätet.

INGEN REGRESSION I DAG, OCH DET ÄR POÄNGEN: den gamla sid-vakten skyddade aldrig WS heller (page.route fångar inte WebSocket), så luckan är lika gammal som fixturvärlden. Appen saknar realtime-funktioner, så ingen kod öppnar i dag en WebSocket. Fyndet är därför latent: det blir skarpt först den dag appen får realtime, och då är det den enda kvarvarande vägen ut ur den hermetiska världen.

VARFÖR INTE ÅTGÄRDAT I 54.2: åtgärden kräver antingen en WS-handler att matcha mot eller ett explicit avvisande av alla WS-uppkopplingar, och ingendera bar kortets scope (AC 1-5 gäller onUnhandledRequest-vägen). Bokfört i tasks/s91-restlistan.md under A3.

Upptäckt vid källkodsläsning av bindningen under task-54.2, 2026-07-27.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En WebSocket-uppkoppling som ingen handler täcker FÄLLER testet med adressen namngiven, i stället för att tyst nå route.connectToServer() — bindningens väg vid noll WS-handlers (@msw/playwright/src/fixture.ts rad 156-166, verifierad mot node_modules)
- [ ] #2 Fällningen är bevisad TVÅSIDIGT: ett test som öppnar en WS-uppkoppling fäller med åtgärden inkopplad, och gick igenom utan den
- [ ] #3 Localhost-undantaget gäller symmetriskt med HTTP-vakten — fixtur-serverns egen värd fäller inte
- [ ] #4 De tolv baseline-bilderna är oförändrade: npm run test:visual grön utan baseline-diff
<!-- AC:END -->
