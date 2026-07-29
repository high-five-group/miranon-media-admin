---
id: TASK-56
title: >-
  Fynd: WebSocket-vägen går förbi hermetik-vakten — MSW connectToServer() när
  inga WS-handlers finns
status: Done
assignee: []
created_date: '2026-07-27 16:56'
updated_date: '2026-07-29 12:54'
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
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En WebSocket-uppkoppling som ingen handler täcker FÄLLER testet med adressen namngiven, i stället för att tyst nå route.connectToServer() — bindningens väg vid noll WS-handlers (@msw/playwright/src/fixture.ts rad 156-166, verifierad mot node_modules)
- [x] #2 Fällningen är bevisad TVÅSIDIGT: ett test som öppnar en WS-uppkoppling fäller med åtgärden inkopplad, och gick igenom utan den
- [x] #3 Localhost-undantaget gäller symmetriskt med HTTP-vakten — fixtur-serverns egen värd fäller inte
- [x] #4 De tolv baseline-bilderna är oförändrade: npm run test:visual grön utan baseline-diff
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
DONE 2026-07-29 (S91 femtonde resumen). PR #439 (`82c62d4`, merge `52037e1`). CI grön per jobb; `Acceptance (hermetisk)` 6m54s.

VAKTEN: en WebSocket-uppkoppling som ingen handler täcker fäller nu testet med adressen namngiven och egen felklass (`OmockadWebSocketError`), i stället för att tyst nå `route.connectToServer()`.

AGENTEN KORRIGERADE ORKESTRERAREN PÅ TRE PUNKTER, alla verifierade i efterhand:
1. Uppdraget sade att `TASK-57` var ett öppet kort att inte röra. Det är `Done` sedan 2026-07-27.
2. Uppdraget angav vakten i `tests/visual/support/`. Den bor i `tests/support/fixturvarld/`, flyttad i `task-59.1` — vilket betyder att ändringen påverkar BÅDA testklasserna, och agenten körde därför acceptance-sviten och självtestet utöver sin DoD.
3. `test:visual` körs INTE i PR-CI, bara i manuella `visual-baselines.yml`. AC #4 har alltså ingen CI-verifiering; agentens lokala bitidentitets-bevis är det enda som finns. Utskrivet i stället för att passera som grönt.

KORTET PEKADE PÅ EN FIL SOM INTE KÖRS: kortets citat gällde `@msw/playwright/src/fixture.ts` 156-166. `package.json` sätter `main` till `./build/index.mjs`. Agenten verifierade BÅDA — samma gren på `build/index.mjs` rad 68-71, identiskt beteende. Citatet var korrekt men ofullständigt som verifieringsgrund.

TVÅSIDIGT BEVIS I TVÅ OBEROENDE FORMER: (a) positiv läckagemätning — en egen lyssnare på IPv6-loopback fick `GET /realtime upgrade=websocket` MEDAN testet var grönt; med vakten `[]`. (b) `test.fail()`-formen — med vakt exit 0; vakt urkopplad ger `Expected to fail, but passed`, exit 1.

BASELINES 12/12 BITIDENTISKA (sha1), mätt genom att generera baselines ur `main` och köra ändringen mot dem.

FYNDET SOM STYRDE DESIGNEN: varje visuellt test öppnar REDAN en WebSocket — Vites HMR-socket. En naiv "fäll alla WS"-vakt hade fällt samtliga tolv baseline-tester. Localhost-grenen anropar därför `server.connect()` och bevarar dagens beteende exakt. Skördat som `[UNIVERSAL]`-fragment (PR #442); agenten identifierade lärdomen men skrev den INTE själv, eftersom `lessons.md` är delad yta med parallella agenter — den lyfte konflikten i stället för att ta den.

FLAKE-UTREDNING MED RIGGEN, OOMBEDD: `hem.acceptance.test.ts:437` föll en gång under arbetet. I stället för att gissa kördes `scripts/flake-matserie.mjs` — 5 varv, 1 530 resultat — och testet föll i BÅDA armarna (main 28 108 ms, denna PR 27 879 ms). Median-diff +69 ms, svit-median −13 ms, mot brusgolv ±2 500 ms. Slutsats: inte orsakad av ändringen, BELAGD i stället för antagen. Detta är riggens första bruk av ett kort utanför `TASK-79`/`80` — alltså precis det verkliga bruk `TASK-81`:s AC #4 efterfrågade, uppstått av sig självt.

PÅVERKAN PÅ TASK-57: orörd. Enda ingreppet i `hermetik-vakt.ts` var att exportera `LOKALA_VARDAR`; WS-vakten har eget meddelande och egen felklass och ärver inte EF-listans skalningsproblem.

STÄNGNINGEN DRÖJDE, OCH DET ÄR BOKFÖRT: orkestreraren väntade på en notifiering om att `#439` landat. PR-landningar notifierar inte — se `T108`.
<!-- SECTION:FINAL_SUMMARY:END -->
