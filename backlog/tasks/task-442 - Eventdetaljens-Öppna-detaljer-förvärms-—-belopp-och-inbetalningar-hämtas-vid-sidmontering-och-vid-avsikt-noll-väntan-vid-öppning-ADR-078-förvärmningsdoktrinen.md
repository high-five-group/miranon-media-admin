---
id: TASK-442
title: >-
  Eventdetaljens Öppna detaljer förvärms — belopp och inbetalningar hämtas vid
  sidmontering och vid avsikt, noll väntan vid öppning (ADR-078,
  förvärmningsdoktrinen)
status: To Do
assignee: []
created_date: '2026-09-08 18:00'
updated_date: '2026-09-08 19:18'
labels:
  - ready-for-agent
dependencies:
  - TASK-438
ordinal: 769000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-09-08 (S124 resume 1), efter ögonmätning av steg 2: "inbetalningsraderna kommer förvärmas när man går in på eventdetalj-sidan eller något sådant eller? Så man inte behöver vänta på att de laddas när man öppnar detaljerna?" — och på rekommendationen: "Kör på din rek, gör det branschledarmässigt och ordentligt!!"

LÄGET I DAG (mätt i kod): `src/components/events/detail/Deltagare.tsx` rad ~1793–1801 monterar `<DetaljRad>` + `<BetalningsDetaljer event registreringar={aktiva} aktiv={betalningOppen}>` i en `hidden`-div; `BetalningsDetaljer` (`src/components/events/detail/Betalningar.tsx`) kallar `useOppnaBetalningar(aktiv)` och `useInbetalningarForEvent(event.id, sorteradeIds, aktiv)` (`src/data/betalningar/useBetalningar.ts`), båda gatade med `enabled: aktiv` (+ icke-tom id-lista), `refetchOnMount: 'always'`, `retry: husetsRetryPolicy`. Följd: NOLL anrop vid sidladdning (TASK-436 AC/TASK-438 AC #1, medvetet) och TVÅ anrop + skelett per person när Lotta klickar "Öppna detaljer". Marcus vill ha motsatsen: detaljerna klara när hon klickar.

DOKTRINEN (läs innan design, citera i PR-kroppen): `docs/research/forvarma-allt-branschmonster-2026-09-06.md` § 5(b) och § Dom — förvärm det Lotta med hög sannolikhet är på väg till, för DET event hon redan står på, billigt; punkt 2 (mount-hämtning på eventsidan för just det eventet) och punkt 3 (hover/fokus-prefetch vid ingångarna, ADR-078 beslut 3, mätt 1315 → 278 ms i PR #163); punkt 4: `prefetchQuery`, ALDRIG `ensureQueryData` i en loader (blockerar). TanStack Query v5: `queryClient.prefetchQuery` dedupliceras mot in-flight-frågor med samma nyckel och är no-op när cachad data är färsk (global `staleTime` 5 min, `src/router.ts`); när `enabled` sedan slår om till true hämtar observern BARA om datan är stale (`shouldFetchOptionally`), så en färsk förvärmning ger cache-träff utan omhämtning — verifiera påståendet mot installerad `@tanstack/query-core` (källäs `QueryObserver.setOptions`/`shouldFetchOptionally`) och bokför versionen.

BESLUT (orkestreraren på Marcus GO): BÅDA formerna.
A. VID SIDMONTERING: när eventsidans deltagarlista finns (aktiva anmälningar kända) förvärms BÅDA frågorna för DET eventet — `queryKeys.betalningar.oppna` via `dataSource.fetchOppnaBetalningar()` och `queryKeys.betalningar.perEvent(eventId, ids)` via `dataSource.fetchInbetalningarBatch({ anmalanRecordIds })` — med EXAKT samma nycklar och queryFn som hookarna (annars två cache-poster). Formen är husets: en `useForbered…`-hook i `src/data/betalningar/useBetalningar.ts` (spegla `useForberedAtgardsBilagor` i `src/data/queries/useEventAttachments.ts`: `useCallback` + `queryClient.prefetchQuery`), anropad EN gång per event när id-listan är känd (effekt med id-listan som beroende; sorterad, samma som hooken). Respektera samma gating som renderingen: förvärm aldrig när betalningsfunktionen är avstängd (`VITE_FEATURE_BETALNINGAR`/den flagga som styr att `DetaljRad`/`BetalningsDetaljer` alls visas — läs `Deltagare.tsx` § ArbetsKo), aldrig när id-listan är tom, aldrig för avbokade (samma `aktiva`-lista som `BetalningsDetaljer` får). Kostnad: ett Postgres-batchanrop per eventsida + det delade inkorgsanropet (ofta redan cachat) — bokför i docblocken varför det är förenligt med doktrinens § Dom (ett event, inte alla).
B. VID AVSIKT: `DetaljRad`s `<button>` får `onMouseEnter` + `onFocus` (TabBar-formen för nativa knappar; `onHoverStart`/`onFocus` är RAC-formen) som anropar samma förvärmning — gratis komplement, idempotent (no-op när A redan hämtat), och det som täcker fallet där A ännu inte hunnit (sidan öppnad → klick inom ~1 s).
C. `aktiv`-gatingen i `BetalningsDetaljer` STÅR KVAR (observern läser cachen när disclosuren öppnas; ingen hook-ändring i läsvägen). `refetchOnMount: 'always'` på hookarna STÅR KVAR (den gäller observerns montering, som sker vid sidladdning i disabled-läge) — verifiera att öppningen INTE ger en omhämtning när förvärmningen är färsk, med nätverksräknare i e2e; ger den det ändå är det ett fynd att lösa (t.ex. `staleTime` på prefetchen eller observern), inte att dölja.
D. DOCBLOCKAR SKRIVS OM ÄRLIGT (ADR-083): `Betalningar.tsx` § "Beloppet kommer ur useOppnaBetalningar … sidladdningen kostar ingenting" och § TASK-438 "noll anrop vid sidladdning, bevisat i e2e" beskriver den GAMLA regeln — skriv om till den nya (förvärmd vid sidmontering + avsikt, noll väntan vid öppning) med Marcus beslut 2026-09-08 källmärkt, historiken bevarad; `Deltagare.tsx`-kommentaren vid `BetalningsDetaljer`-monteringen likaså. TASK-438-kortet får en `--append-notes`-rad om att dess AC #1-formulering ("noll anrop vid sidladdning") är superseded av detta kort (kortet är landat; skriv inte om dess AC).
E. TESTER (rött-först i PR-kroppen): `tests/e2e/mark-paid.staging.test.ts` bär redan räknare för `hamta-oppna-betalningar` (`raknare`) och batch-vägen (`batch.anrop`/`batch.ids`) — skriv om kontraktstesterna: (1) efter sidladdning, INNAN klick, är båda räknarna 1 och batchens id:n = alla aktiva anmälningar (aldrig den avbokade); (2) klick på "Öppna detaljer" ger 0 nya anrop och INGET skelett (`role="status"` "Laddar belopp"/"Laddar händelser" syns aldrig — mocka svaren med liten fördröjning så testet inte är trivialt grönt); (3) stäng/öppna igen → fortfarande 0 nya; (4) flikbyte → 0 nya; (5) avsikt: hover/fokus på knappen INNAN monteringsförvärmningen hunnit (mocka `get-registrations` med fördröjning så id-listan kommer sent, eller stubba monteringsvägen) ger exakt ett batch-anrop och ett oppna-anrop, och klicket därefter 0 — testet ska bevisa att B fungerar oberoende av A; (6) betalningsfunktionen av (samma mock-form som befintliga flagg-tester om de finns) → 0 anrop vid sidladdning. Befintliga tester "beloppen hämtas först när detaljerna öppnas — noll anrop vid sidladdning" och "noll anrop vid sidladdning, ETT batch-anrop … när detaljerna öppnas" INVERTERAS (de beskriver den gamla regeln) — döp om dem så namnen säger det nya kontraktet. Skarp mätning i PR-kroppen: tid från klick till renderat belopp/logg mot staging, före och efter (Playwright, `performance.now()` runt klick → `expect(...).toBeVisible()`), fem körningar vardera, median.
F. Vad som INTE görs: ingen route-loader, ingen `ensureQueryData`, ingen förvärmning av ANDRA event än det öppnade (doktrinens § Dom), ingen ändring av EF:er.
KÄLLOR: `Betalningar.tsx` (BetalningsDetaljer ~rad 320–380, DetaljRad ~196–232, docblock § TASK-436/438), `Deltagare.tsx` ~1387/1793–1801 + § ArbetsKo, `useBetalningar.ts` (`useOppnaBetalningar`, `useInbetalningarForEvent`, `husetsRetryPolicy`), `src/queries/keys.ts` (`betalningar.oppna`, `perEvent` sorterar id:n), `src/data/queries/useEventAttachments.ts` (`useForberedAtgardsBilagor`), `src/router.ts` (`staleTime` 5 min, `defaultPreload`), `src/components/AppShell/TabBar.tsx` (`varmPersonregister`), research-doket § 5(b)/§ Dom, ADR-078, ADR-112, TASK-416.16 (bilagor: prefetch vid sidmount + avsikt).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Vid sidmontering av eventdetaljen förvärms betalningar.oppna och betalningar.perEvent för det öppnade eventet via en useForbered-hook med exakt hookarnas nycklar och queryFn; aldrig när funktionen är avstängd, id-listan tom eller för avbokade; e2e: båda räknarna 1 före klick, batchens id:n = de aktiva
- [x] #2 Öppna detaljer ger 0 nya anrop och inget skelett när förvärmningen är färsk; stäng/öppna och flikbyte ger 0 nya; bevisat med fördröjda mockar (rött mot main före fixen)
- [x] #3 Avsikts-förvärmning på knappen (onMouseEnter + onFocus) bevisad oberoende av monteringsvägen: hover före monteringsförvärmningen ger exakt ett anrop per fråga och klicket 0
- [x] #4 Docblockarna i Betalningar.tsx och Deltagare.tsx säger den nya regeln med Marcus beslut källmärkt och historiken bevarad; TASK-438 får en superseded-not om sitt AC #1; PR-kroppen citerar doktrinen och den källästa TanStack-mekaniken (enabled-flip hämtar bara stale) med version
- [x] #5 Skarp mätning i PR-kroppen: klick till renderat belopp/logg mot staging före/efter, fem körningar, median; axe 0; mark-paid + event-deltagare + anmalan-detalj gröna; DoD-kommandona och check-langa-streck gröna med faktiska exitkoder
- [ ] #6 Ögonmätt av Marcus mot dev-server/staging före Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-08 (bygg-agent, Opus 5): AC #1-5 avbockade, AC #6 (Marcus ögonmätning) lämnad. Gren task-442-forvarm-oppna-detaljer.

FÖRVÄRMNINGEN: `useForberedEventBetalningar` i `src/data/betalningar/useBetalningar.ts` — EN callback, `useCallback` + två `queryClient.prefetchQuery` med EXAKT hookarnas nycklar (`queryKeys.betalningar.oppna`, `queryKeys.betalningar.perEvent`) och queryFn. Två anropsplatser i `Deltagare.tsx`s `ArbetsKo`: mount-effekt på `[forbered, event.id, aktivaIds]` och `DetaljRad`s nya `onAvsikt` (`onMouseEnter` + `onFocus`).

TVÅ DESIGNVAL UTÖVER KORTETS TEXT, båda motiverade i docblocken:
1. INGEN egen `staleTime` på prefetchen (husets avsikts-prefetchar sätter 30 s). Skälet är symmetri: observern bedömer stale mot routerns globala 5 min när `aktiv` flippar, så en kortare tröskel på prefetchen hade betalat ett extra anrop i just klick-ögonblicket. Samma val som `EventDetail.tsx`s `varmNarvaro` (TASK-416.16).
2. `retry: husetsRetryPolicy` PÅ prefetchen. Utan den ärver `prefetchQuery` routerns naiva globala `retry: 3` och ett 4xx blir fyra anrop mot det delade taket.

PREMISS-DIVERGENS (kortets § A): kortet antar att en flagga styr att `DetaljRad`/`BetalningsDetaljer` alls visas. Det gör den INTE — `Deltagare.tsx` rad ~1793 monterar dem ovillkorligt bakom enbart `aktiva.length > 0` (TASK-145.4 AC #2 gjorde dem ovillkorliga). AC #1:s REGEL (aldrig när funktionen är avstängd) följdes: gatingen `betalningarPa()` ligger i callbacken. Asymmetrin mot renderingen är öppet bokförd i docblocken; att flagg-gata renderingen vore en scope-utvidgning kortets § F förbjuder.

KORTETS § E PUNKT 6 (e2e-bevis för funktionen av → 0 anrop) ÄR INTE BYGGD: `VITE_FEATURE_BETALNINGAR` är en BYGGTIDS-flagga (`src/lib/funktionsflaggor.ts` § MILJÖ, INTE ANVÄNDARE) och det finns ingen runtime-väg att sätta den per test i chromium-authenticated-projektet — samma begränsning `anmalan-avbokning-betallage-heading.staging.test.ts` filhuvud redan bokför. Gatingen är i stället bevisad av kodläsning plus att HELA acceptance-/visual-/webblasarbeteende-klassen kör med flaggan av (`playwright.config.ts`) och inte ser ett enda förvärmningsanrop.

RÖTT-FÖRST, MÄTT: de fem nya/inverterade testerna kördes mot `origin/main`s src (samma testfiler, main-kod utcheckad) — 5 failed, samtliga på `page.waitForResponse`-timeout, dvs. förvärmningens anrop uteblev helt. Med denna PR:s kod: 22/22 gröna.

SKARP MÄTNING mot staging (event rec62qCKvBFihIvl4, 10 öppna betalningar), byggd staging-bundle servad av `vite preview` på 4173, färskt browser-context per körning (query-cachen persistas i localStorage), 5 körningar per arm, median:
  · klick 2 s efter att knappen syns (Lottas verkliga väg): FÖRE 1902 ms → EFTER 100 ms
  · klick 0 ms efter att knappen syns (värsta fall): FÖRE 1923 ms → EFTER 1901 ms
Värsta fallet är oförändrat med avsikt: förvärmningen startar i samma ögonblick som knappen renderas, så den hinner inte. Det är den ärliga undre gränsen för vad mount-förvärmning kan ge.

MÄTNINGEN GJORDES PÅ 4173, INTE 5173: staging-EF:ernas CORS_ALLOWED_ORIGINS släpper bara 5173/4173 (mätt: en worktree-deriverad port ger HTTP 403 på preflight), och 5173 bar orkestrerarens dev-server. e2e-sviterna kördes mot en egen dev-server på 7173 via PLAYWRIGHT_NO_WEB_SERVER=1 + PLAYWRIGHT_TEST_BASE_URL — de är helmockade och behöver ingen CORS-tillåten origin.

SIDOEFFEKT SOM KRÄVDE EN DELAD STUB: mount-förvärmningen gör att varje e2e-svit som besöker /event/$eventId med aktiva anmälningar nu träffar två EF-begäranden den inte bad om. `tests/e2e/helpers/tomma-betalningar.ts` (samma klass som `tom-narvaro.ts`/`tomma-anteckningar.ts`) wirad i event-detail, event-bekraftelse, event-bor-over (båda stubbarna) och event-deltagare, betalningar-inkorg-markera-lage (enbart batchen — de har egen belopps-mock). event-narvaro-register behövde ingen: den svarar registrations: [].

GRINDAR (faktiska exitkoder): typecheck 0 · biome check . 0 · build 0 · check-langa-streck 0 · tsc -p tsconfig.tests.json 0 · api-pure 0 (1786) · mark-paid 0 (22) · event-deltagare+event-detail+event-bekraftelse+event-bor-over+betalningar-inkorg-markera-lage 0 (107) · anmalan-detalj acceptance 0 (7, axe 0).

2026-09-08 FIX-RUNDA (r1 gav exit 10: 1 warning + 2 info, plus ett orkestrerar-fynd). Fyra rättelser:

1. WARNING — tre omockade förvärmningsvägar mot skarp staging. `mockTommaBetalningar(page)` tillagd i `event-detail.staging.test.ts`s `mockaPersonkort` och `mockaGruppdynamik` (båda serverar aktiva anmälningar men saknade stubben — bara `mockEvent` hade den), och `event-deltagare.staging.test.ts`s kringgåendeblock bytte `mockTommaInbetalningar` mot `mockTommaBetalningar` (det blocket kringgår `mocka()` och bar därför ingen egen belopps-mock). Helper-docblockets lista räknar nu ANROPSPLATSER, inte filer — en fil var fel granularitet, den lät `event-detail` se täckt ut fastän två av dess tre uppsättnings-funktioner saknade stubben. VERIFIERAT MEKANISKT med PLAYWRIGHT_HERMETIK_RAPPORT=1 över alla sex berörda sviter (128 tester): 982 restanrop totalt, varav BETALNINGS-EF-LÄCKAGE = 0.

2. INFO — § E punkt 6-substitutet var en slutsats, inte en observation. Ett avvisat `prefetchQuery` är per konstruktion osynligt för ett testresultat, så en grön acceptance-klass kan inte bära "inte ett enda förvärmningsanrop". Formuleringen är smalnad till vad kodläsningen faktiskt bär: gatingen är EN entydig rad (`if (!betalningarPa() || anmalanRecordIds.length === 0) return;`) som BÅDA anropsplatserna delar, och `betalningarPa()` är en byggtidskonstant som `playwright.config.ts:384` sätter till av för fixturklassernas webServer. Rättat i helper-docblocken, PR-kroppen och här.

3. INFO — AC #5 bokförde `npm run test:api:pure`, DoD-listan säger `npm run test:api`. Hela `test:api` kördes nu (staging-preflight exit 0 först): exit 1 — 2313 passed, 2 failed i api-staging (`generate-event-attachment` "utkastet saknas" och `send-registration-confirmation` "icke-test-adress"). BÅDA PASSERAR ISOLERAT (omkörning: 3 passed, exit 0), alltså transienta under parallell last mot delad staging-data. Diffen kan strukturellt inte nå dem: den rör NOLL filer under tests/api/, supabase/ eller scripts/ (verifierat mot origin/main), och api-staging kör utan browser och utan klientbundle rakt mot EF:erna över HTTP.

4. ORKESTRERARENS FYND (ADR-083, falsk premiss) — docblocken påstod att flaggan är "Av i prod" och att ett anrop "hade fått 404". FALSKT i dag, och jag prövade källorna innan jag ändrade: `tasks/todo.md` bär ordagrant "flaggan `VITE_FEATURE_BETALNINGAR` är PÅ i prod via Vercel" (S124) och "Mätt: prod = `29a3c16d`, bundeln bär `VITE_FEATURE_BETALNINGAR: pa`" (S123); 57/57 EF omdeployade 2026-09-08 04:28-04:32Z; `TASK-367`:s migration i prod 2026-09-06. Punkt 1 är omskriven: flaggan är PÅ i prod via Vercel-env (osynlig i `.env.production`, vilket är exakt varför granskaren drog fel slutsats ur den filen), gatingen kvarstår för fixturklasserna och som vakt om flaggan stängs, ADR-129-hänvisningen står kvar enbart som historik. Asymmetrin mot renderingen (ovillkorlig montering, TASK-145.4 AC #2) står kvar med korrekta fakta.

UTVIDGNING UTÖVER FYNDEN, öppet bokförd: samma falska påstående stod ÄVEN i filens PREEXISTERANDE docblock (§ `aktiv` TRÅDAS IN, rad 68 på f5524d85 — "i prod finns varken migrationerna eller de deployade funktionerna ännu … så ett anrop hade fått 404"). Den raden är inte min diff, men den är bevisligen falsk och står i samma fil vars docblockar denna skiva skrev om för just den ärligheten. Rättad med markeringen att det är en rättelse av en preexisterande rad; formen är fortfarande riktig av sitt FÖRSTA skäl (hooks-reglerna förbjuder villkorade hook-anrop).

REGISTRERAT, EJ ÅTGÄRDAT (ADR-053, blockerar ej, utanför scope): hermetik-rapporten visar 29 omockade `get-attendance`-anrop — TASK-416.16:s `mockTomNarvaro` saknas i samma två uppsättnings-funktioner (`mockaPersonkort`/`mockaGruppdynamik`) som saknade betalnings-stubben. Samma felklass, äldre orsak, egen skiva. Övrig restrafik i rapporten är startvärmningens sju datamängder (get-waitlist 213, get-leads 211, hamta-jobbstatus 208, get-persons 28 m.fl.) plus Google Fonts — förväntad, ej relaterad.

R2-GRINDAR: typecheck 0 · biome check . 0 · build 0 · check-langa-streck 0 · tsc -p tsconfig.tests.json 0 · test:api 1 (2313/2315, de två transienta ovan) · hermetik-svep över sex sviter 127/128 (det ena fallet, `markera-lage` "navigation UTANFÖR betalningsfamiljen", passerar isolerat i BÅDA lägena — flakigt under full-svit-last, inte en regression).
<!-- SECTION:NOTES:END -->
