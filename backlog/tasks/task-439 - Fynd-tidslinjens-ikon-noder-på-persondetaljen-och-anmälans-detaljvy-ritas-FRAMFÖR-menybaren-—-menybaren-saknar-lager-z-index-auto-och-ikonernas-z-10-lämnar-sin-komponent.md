---
id: TASK-439
title: >-
  Fynd: tidslinjens ikon-noder på persondetaljen och anmälans detaljvy ritas
  FRAMFÖR menybaren — menybaren saknar lager (z-index auto) och ikonernas z-10
  lämnar sin komponent
status: To Do
assignee: []
created_date: '2026-09-08 14:45'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 766000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-titt 2026-09-08 (S124 resume 1): "På persondetaljer så renderar ikonerna i interaktions-blocket (tidslinjen) FRAMFÖR menybaren."

REPRODUCERAT AV ORKESTRERAREN 2026-09-08 (Playwright mot dev-server, 390×844, `/personer/recp4cu5RSKLhefMX`, bild i sessionens scratchpad `skarm-repro/repro-tidslinje-over-tabbar.png`): `nav[aria-label="Huvudnavigation"]` har `position: fixed` och `z-index: auto`; tidslinjens ikon-nod (`span.z-10.rounded-full`, `position: static`, flex-item) har `z-index: 10`; med ikonen rullad in i navens rektangel träffar `document.elementFromPoint(ikonens mitt)` ikonens inre span, inte naven — ikonen ritas alltså ovanpå menybaren.

ROTORSAK (två lager, båda verkliga): (1) Menybaren `src/components/AppShell/TabBar.tsx` (rad ~77, `fixed inset-x-4 bottom-4 …`) bär INGET z-index. Ett fixed element med `z-index: auto` ritas i rot-staplingskontexten i DOM-ordning på nivå 0, så varje sidinnehåll med z-index > 0 hamnar ovanpå det. (2) Tidslinjens ikon-noder bär `z-10` för att ligga ovanpå den genomgående linjen — `src/components/registrations/Tidslinje.tsx` rad 57 (konsumenter: anmälans detaljvy `AnmalanDetail.tsx`, och eventdetaljens Händelselogg via PR #2457) och `src/components/persons/PersonDetail.tsx` rad 819 (persondetaljens egen tidslinje, linjen rad 867). Som flex-items skapar de staplingskontexter på nivå 10 i ROT-kontexten eftersom ingen förälder isolerar dem — ett lokalt dekorativt lager läcker ut och konkurrerar med sidkromet. Samma klass: `src/components/hem/BulkAtgardsknapp.tsx` rad 67 (tooltip `absolute z-10`) — täcks av (1), rörs inte.

LAGERSKALAN SOM FINNS I DAG (mätt): Modal `z-50` (`primitives/Modal.tsx:34`), Sidbytesindikator `z-50` (`AppShell/Sidbytesindikator.tsx:99`), SkipLink `focus:z-50` (`AppShell/SkipLink.tsx:16`), Notis `z-40` (`primitives/Notis.tsx:117`), sidinnehåll `z-10` lokalt (tidslinjerna, tooltipen), TabBar INGET. Repot bär inga z-tokens (grep `--mm-z` tom).

FIX (båda, inte antingen/eller):
A. TabBar får ett explicit chrome-lager: `z-30`. Docblocken i TabBar.tsx dokumenterar lagerskalan så nästa läsare ser den på ett ställe: sidinnehåll ≤ 10 och ISOLERAT i sin komponent · sidkrom 30 (TabBar) · notiser 40 (Notis) · överlägg 50 (Modal, Sidbytesindikator, SkipLink vid fokus). Inget annat element får ett nytt z-tal i denna skiva; skalan är Tailwinds egen (10/20/30/40/50), ingen token införs — dubbelriktad över-engineering-vakt: golvet är "krom ovanför innehåll", en token-skala utan andra konsument vore spekulation (bokför avvägningen i docblocken).
B. Tidslinje-posterna isolerar sin stapling: `isolate` (CSS `isolation: isolate`) på `<li>` i `Tidslinje.tsx` (rad 54, `relative flex items-start …`) och på `<li>` i `PersonDetail.tsx` (rad ~859, `relative flex flex-col`). Ikonens `z-10` konkurrerar då bara inom sin egen post; den genomgående linjen (absolut, `z-index: auto`, ritad före posterna i DOM-ordning) ligger fortsatt bakom ikonerna — verifiera i bild att linjen går bakom cirklarna som i dag, 390 och 1280 px. VARFÖR `<li>` OCH INTE `<ol>`: PR #2457 (under granskning, head `e32ab273`) ändrar `<ol>`-raden i Tidslinje.tsx (lägger `aria-label={etikett}`); en ändring på samma rad här ger merge-konflikt i kön. `<li>`-raden rörs inte av #2457. Skriv det skälet i en kort kodkommentar så ingen "förbättrar" det till `<ol>` utan att veta.
C. REGRESSIONSTEST, hermetiskt acceptance-test (samma rigg som `tests/acceptance/person-detail.acceptance.test.ts` och anmälans `anmalan-detalj.acceptance.test.ts`): rendera persondetaljen med tidslinje-poster i appskalet vid 390×844, rulla en ikon-nod in i menybarens rektangel, och kräv att `document.elementFromPoint(ikonens mittpunkt)` ligger INUTI `nav[aria-label="Huvudnavigation"]`. Samma prov för `Tidslinje` via anmälans detaljvy. RÖTT-FÖRST: båda proven ska vara röda mot `main` före fixen (bevisat i PR-kroppen med utdata) och gröna efter. Pröva dessutom att fix A ensam och fix B ensam vardera gör provet grönt (så testet verkligen mäter staplingen, inte en bieffekt) — bokför utfallet.
D. Grenen BASERAS PÅ `origin/main` (inte på huvudkatalogens utcheckade gren, som just nu är #2457:s för Marcus ögonmätning). Kortet ligger på `origin/docs/kort-<ID>` tills dess docs-PR landat — läs det därifrån med `git show` om det saknas på `main`.
KÄLLOR: TabBar.tsx rad 72–79 · Tidslinje.tsx rad 49–70 · PersonDetail.tsx rad 805–875 · Modal.tsx:34 · Notis.tsx:117 · Sidbytesindikator.tsx:99 · SkipLink.tsx:16 · BulkAtgardsknapp.tsx:67 · CSS `isolation` (CSS Compositing 1 §4.2) · Tailwind `isolate`/`z-*`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 TabBar bär z-30 med lagerskalan dokumenterad i sin docblock (innehåll ≤ 10 isolerat · krom 30 · notiser 40 · överlägg 50), verifierad mot Modal/Sidbytesindikator/SkipLink/Notis; inget annat element får ett nytt z-tal; ingen token införs, avvägningen bokförd
- [ ] #2 Tidslinje.tsx och PersonDetail.tsx: isolate på <li> (inte <ol>, skäl i kodkommentar: #2457 rör <ol>-raden); den genomgående linjen ligger bakom ikon-cirklarna som i dag, verifierat i bild vid 390 och 1280 px
- [ ] #3 Hermetiskt acceptance-test: på persondetaljen och på anmälans detaljvy träffar document.elementFromPoint i en ikon-nod som rullats in i menybarens rektangel ett element inuti nav[aria-label=Huvudnavigation]; rött mot main före fixen (utdata i PR-kroppen), grönt efter; fix A ensam och fix B ensam gör vardera provet grönt, bokfört
- [ ] #4 axe 0 på båda ytorna; prefers-contrast more och print oförändrade; DoD-kommandona (typecheck, biome, build), berörda acceptance-sviter och check-langa-streck gröna med faktiska exitkoder
- [ ] #5 Ögonmätt av Marcus mot dev-server/staging före Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
