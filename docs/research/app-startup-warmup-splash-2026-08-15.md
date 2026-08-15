---
owner: marcus803
updated: 2026-08-15
review_by: 2027-02-15
status: draft
---

# App-startup: splash med äkta progress + flerviss förvärmning — branschmönster mot TanStack Router + Query v5

> Research-pass, S102 (2026-08-15), kört oisolerat i
> `.claude/worktrees/s102-resume` (ägarlapp: huvudkatalogen ägs av en annan
> levande session). En fråga besvarad mot primärkällor; ingen kod ändrad.

## Vad jag hittade i repot FÖRE web-research (inventeringen)

Ingen befintlig fil under `docs/research/` täcker denna exakta fråga —
sökning på `warmup|splash|bootstrap|prefetch|ensureQueryData|loader|preload`
gav träffar men inget dedikerat pass. Sex ADR:er + två öppna trådar bar
redan halva svaret, och samtliga är styrande för rekommendationen nedan:

- **[ADR-037](../decisions/ADR-037-auth-resolution-render-gate.md)** — den
  render-gate som REDAN finns: `InnerApp` (`src/main.tsx`:33-72) monterar
  `<RouterProvider>` först när `auth.isLoading === false`, och visar under
  tiden `<div role="status" aria-live="polite">Laddar…</div>`. Detta ÄR
  exakt den mekaniska platsen en splash med progress skulle byggas ut ifrån
  — inte en ny plats.
- **[ADR-055](../decisions/ADR-055-datakalla-atkomst-router-context-di.md)**
  — `dataSource` injiceras i router-context, men `router.ts` (rad 5, 59)
  importerar den ändå som statisk modul-singleton EFTERSOM `router.ts` körs
  före `RouterProvider` finns. Samma resonemang gäller en warmup-modul: den
  körs i `main.tsx` innan router-context existerar, så den måste importera
  `dataSource`/`queryClient` statiskt — det är redan etablerad praxis, inte
  ett undantag.
- **[ADR-072](../decisions/ADR-072-klient-persist-av-query-cachen.md)** —
  Marcus egen tidigare, till synes MOTSATTA design-order: *"inget ska röra
  sig, helst inget synligt laddande alls — det ska bara vara där."*
  Nuvarande beslutad målbild (denna prompt) är en explicit, medveten
  omprövning av den linjen för just uppstartsögonblicket — se § Tension
  nedan, inte tyst överkörd.
- **[ADR-078](../decisions/ADR-078-instant-regeln.md)** (INSTANT-regeln) —
  förkastade uttryckligen "prefetcha allt vid listöppning" för
  registrerings-nivå-data (11 event × 2 anrop mot 5 req/s-taket), och
  lämnade frågan öppen i **T90** (paused). Samma rate-limit-vägg gäller en
  post-login-warmup, fast i mindre skala (globala listor, inte per-event).
- **[ADR-047](../decisions/ADR-047-pwa-arkitektur-fas-5.md)** § Amendering
  2026-08-13 — `AppUpdateBanner` monteras i `__root.tsx`, dvs. INUTI
  `<RouterProvider>`. Den kan därför strukturellt aldrig synas under en
  splash byggd i `InnerApp` (som ligger UTANFÖR `RouterProvider`) —
  interaktionen är redan noll-risk om ingreppspunkten hålls där.
- **T90** (paused) — öppen belastningsfråga om varm cache kontra
  Airtable-taket, precis den axel denna fråga också måste svara på.
- **T94** (paused) — routing-grammatiken (tre hemvister) är redan
  obesvarad; en eventuell införsel av router-loaders korsar det trådämnet
  och bör INTE avgöras som bieffekt av detta pass.

**Två hårda, redan gröna E2E-kontrakt sätter regressions-golvet:**
`tests/e2e/persist-cache.staging.test.ts` AC 1 asserterar
`expect(main.getByRole('status')).toHaveCount(0)` och
`expect(main.getByText(/^Laddar/)).toHaveCount(0)` **under aktiv
bakgrundshämtning** på en varm start, och AC 4 asserterar samma sak vid
offline-öppning. Varje ny splash-design måste vara skip-bar till noll
synlig UI på dessa två vägar, annars faller befintlig, redan grön CI.

Inget av detta fanns samlat i en fil — det är passets grundarbete, inte en
duplicering av tidigare research.

## Kort svar

**Kombination — men asymmetrisk, inte jämnstor.** En dedikerad,
post-auth warmup-modul (byggd ovanpå TanStack Querys egna primitiv:
`ensureQueryData` + `Promise.allSettled`) är den ENDA mekanismen som kan
uppfylla "alla flikars kärndata varm när splashen släpper" — router-loaders
kan strukturellt inte göra det ensamma, eftersom en loader per definition
bara kör för den matchade (eller explicit preload:ade) rutten. Router-
loaders är TanStacks EGET dokumenterade mönster, men för en ANNAN uppgift:
garantera EN rutts data innan den ruttens komponent renderar (deep-links,
sidladdning) — inte att värma flera flikar samtidigt före första render.
De två mekanismerna delar helst SAMMA `queryOptions`-källa så de aldrig kan
divergera, men loaders är inte en förutsättning för warmup-fasen och bör
tas som ett separat, senare beslut (se § Öppna frågor).

**Ingreppspunkten:** `InnerApp` i `src/main.tsx` (samma plats som
ADR-037:s render-gate redan sitter), INTE en ny root-route-`beforeLoad` och
INTE `__root.tsx`. Warmup körs en gång per auth-resolution, inte per
navigation — exakt den scope-gräns ADR-037 redan drog för render-gaten av
skäl som gäller lika mycket här.

## 1. TanStack Router — vad förstapartsdokumentationen faktiskt rekommenderar

Källa: context7 `/tanstack/router` (TanStack Router-dokumentationens
källträd), hämtat 2026-08-15, mot vår pinnade version `1.170.21`
(`package.json`).

- **Loader + `ensureQueryData` är det kanoniska mönstret** — TanStacks
  egen exempel-kod: `loader: ({ context, params }) =>
  context.queryClient.ensureQueryData(postQueryOptions(params.postId))`.
  Detta är en RUTT-nivå-mekanism: den kör bara för ruttar som faktiskt
  matchas eller explicit preload:as.
- **`defaultPreload: 'intent'`** sätter GLOBAL hover/fokus-preload för alla
  `<Link>` — detta är redan implementerat hos oss (om än handbyggt via
  `useForberedEventDetalj`/`PersonsList`/`Deltagare.tsx`, inte via router-
  optionen). Ingen dokumenterad "preload alla ruttar direkt vid mount"-
  flagga finns — den närmaste byggstenen är `.preloadRoute(opts)`
  (`RouterType.md`), som måste anropas explicit per rutt.
- **`pendingComponent`** är rutt-lokal (visas medan EN rutts loader kör),
  inte en app-global splash-mekanism.
- Inget textstycke i dokumentationen beskriver ett "värm allt vid appstart
  bakom en splash"-recept. TanStack Router löser deep-link- och
  route-transition-readiness; app-bred bootstrap-uppvärmning är ett
  APPLIKATIONSMÖNSTER byggt ovanpå Query, inte en router-feature.

**Slutsats för delfråga 1:** loader+`ensureQueryData` är rätt verktyg för
"denna rutts data innan denna rutts komponent" — inte för "alla flikars
data innan splashen släpper". De två frågorna har olika svar.

## 2. TkDodo (TanStack Query-maintainern)

Källor, hämtade 2026-08-15:
[React Query meets React Router](https://tkdodo.eu/blog/react-query-meets-react-router)
(publicerad 2022-08-28, uppdaterad 2022-12-11) och
[Seeding the Query Cache](https://tkdodo.eu/blog/seeding-the-query-cache).

- **Loaders ska `await`:as (blockera), inte fire-and-forget**, för att ge
  en bra första-laddning: *"We want the loader to wait for our data to be
  ready and return it to get a good experience on the first loads."*
  `ensureQueryData` läser cachen först (`getQueryData`) innan den fetchar —
  detta är exakt vad som förhindrar dubbelhämtning mellan loader och
  komponentens `useQuery`.
- **TkDodo argumenterar INTE för ett app-brett bootstrap-fönster.** Hans
  modell är genomgående PER-RUTT: routern äger NÄR data hämtas (vid
  navigation/preload), Query äger cachning och färskhet. Ingen av de två
  artiklarna nämner en samlad "värm hela appen"-fas.
- **"Ju tidigare, desto bättre"** ("Seeding the Query Cache"): ett
  `prefetchQuery`-anrop körs så fort JS-bundlen evalueras — samma princip
  gäller en warmup-modul: den bör triggas i samma andetag som auth löser
  sig, inte efter att `RouterProvider` redan monterat och en första
  komponent renderat.

**Slutsats för delfråga 2:** maintainerns egen linje stödjer INTE ett
"warm everything"-recept som färdig TanStack-idiom — det bekräftar att en
sådan fas är ett medvetet, applikations-specifikt tillägg ovanpå
primitiven, exakt den ram Marcus mål beskriver.

## 3. Branschledarnas bootstrap-mönster — belagt, respektive obelagt

- **Linear** — MÄTT via tredjepartskälla (reverse-engineering + teknisk
  genomgång, inte Linears egen blogg): app-boot renderar en temat splash
  med pulserande logotyp DIREKT ur inline-CSS/JS + `localStorage` (inga
  nätverksanrop krävs för själva skalet), hydrerar sedan från IndexedDB
  till minne UTAN att invänta servern, och verifierar sessionen först vid
  FÖRSTA nätverksinteraktionen — INTE blockerande.
  Källa: [performance.dev — How's Linear so fast?](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown),
  hämtat 2026-08-15. Linears egen sync-bootstrap-endpoint (`/sync/bootstrap`,
  typ `full`/`partial`) delades i flera separata requests sent 2024 för
  cache-prestanda — bekräftar mönstret "bootstrap är en explicit,
  namngiven fas", men mönstret är INTE "blockera UI tills allt är varmt".
- **Figma** — MÄTT via förstapartsblogg
  ([Speeding up file load times, one page at a time](https://www.figma.com/blog/speeding-up-file-load-times-one-page-at-a-time/),
  publicerad 2024-05-22, hämtat 2026-08-15): laddar EN sida + dess
  beroenden fullt, låter användaren interagera DIREKT med den, och hämtar
  övriga sidor on-demand. Artikeln beskriver INTE den visuella
  laddskärmen (determinate/indeterminate) — det förblev obelagt trots
  sökning.
- **Notion** — MÄTT via förstapartsblogg
  ([How we made Notion available offline](https://www.notion.com/blog/how-we-made-notion-available-offline),
  hämtat 2026-08-15): för OFFLINE-sidor är principen att ALDRIG visa en
  sida med delvis saknad data ("worse user experience" än att neka
  åtkomst) — närmare vår "warm ALLT innan release"-linje än Linear/Figmas
  progressiva modell. Artikeln uttalar sig INTE om online-uppstartens
  laddskärm.
- **Explicit falsariskt sök-resultat, bokfört öppet:** en tidig
  sökträff citerade en namngiven "Senior Staff Engineer Arjun Mehta" och
  ett "2023 infrastructure deep-dive" på Notions blogg. Verifiering mot
  Notions faktiska blogg (samma URL, direktläst) visar att detta citat
  INTE finns i artikeln och personen går inte att spåra till Notion —
  klassat som en AI-sammanfattnings-hallucination, förkastat, ej använt
  någonstans i denna rekommendation.

**Slutsats för delfråga 3:** "bootstrap-fas med progress" är ETT belagt
mönster (Linear namnger sin egen `/sync/bootstrap`), men de tre
undersökta branschledarna lutar samstämmigt mot **progressiv/icke-
blockerande** uppstart (visa cachat/delvis genast, komplettera i
bakgrunden) snarare än "blockera tills allt är varmt". Notion är det enda
observerade undantaget, och bara för OFFLINE-sidvisning — inte för
online-appstart. Ett hårt blockerande "vänta tills allt är varmt"-fönster
är alltså INTE branschstandard rakt av; det är ett medvetet Marcus-val som
avviker från den dominerande branschriktningen, värt att säga rakt ut
snarare än att kalla det "vad alla gör".

## 4. Progress-barens ärlighet — NN/g

Källor, hämtade 2026-08-15:
[Progress Indicators Make a Slow System Less Insufferable](https://www.nngroup.com/articles/progress-indicators/)
(publicerad 2014-10-26) och
[Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
(1993, uppdaterad 2014).

- **Tre svarstidsgränser (Nielsen):** 0,1 s = upplevs instant, 1,0 s =
  tankeflödet störs inte, 10 s = gränsen för fokuserad uppmärksamhet.
- **Regel för indikatorval:** *"use a looped indicator for delays of 2–9
  seconds and a percent-done indicator for delays of 10 seconds or more."*
  Under ~1 s ska INGEN indikator visas (distraherande). Percent-done
  (determinate) UNDER 10 s är bara motiverat vid flera dokument/poster som
  bearbetas i följd — vilket är EXAKT vårt fall (N frikopplade queries).
- **Perceived-performance-effekt:** väntan MED feedback upplevs 11–15 %
  snabbare än väntan utan.

**Slutsats för delfråga 4:** vår situation (flera frikopplade
Edge-Function-anrop, mätt ~1,0–1,4 s styck per ADR-078, sammanlagt
sannolikt 2–4 s vid kall start om anropen respekterar rate-limit-taket,
se § 5) ligger i NN/g:s "2–9 s"-fönster där en LOOPAD indikator normalt
räcker — MEN NN/g:s eget undantag ("flera poster som bearbetas i följd")
gör en determinate "X av N"-bar fullt försvarbar även under 10 s. Marcus
beslut om synlig, äkta progress är alltså inte i konflikt med NN/g —
det ligger inom det källan tillåter, inte i zonen källan KRÄVER det.

## 5. Fallgropar — mätt/verifierat mot vår kod och v5-dokumentationen

**5.1 — Airtables 5 req/s-tak är delat och okö:at hos oss, mätt.**
`docs/reference/airtable-constraints.md` § P4: 5 anrop/sekund PER BAS,
delat mellan ALLA samtidiga klienter, HTTP 429 → 30 s lockout
(exponentiellt 30→60 s, jitter, tak 2 omförsök —
`supabase/functions/_shared/airtable-retry.ts`). Grep bekräftar: **ingen
klient-side kö/rate-limiter existerar** i `src/data/` eller
`supabase/functions/_shared/` (`grep -rln "p-queue\|concurrency" …` gav
noll träffar). Ett warmup-set på ~7 globala listor (se § 6) avfyrat med
ett naket `Promise.all` riskerar alltså att träffa taket redan vid EN
användares kallstart, med ett straff som är MYCKET dyrare (30–60 s) än
vinsten warmup ska ge. **Detta är inte hypotetiskt** — ADR-078 avvisade
just "prefetcha allt" av samma skäl, fast i en annan skala.

**5.2 — Query-nyckelfabriken har REDAN dubblerade globala nycklar för
identisk data.** `src/queries/keys.ts` rad 132–133
(`dashboard.registrations`, `dashboard.events`) och rad 13, 28
(`registrations.all`, `events.list`) pekar på SAMMA underliggande
`dataSource.fetchRegistrations()`/`fetchEvents()`-anrop
(`src/components/hem/useDashboardData.ts` rad 60, 71) men lagras som TVÅ
separata cache-poster — MEDVETET, för att Hem-pollingen (60 s,
`ADR-017`) ska kunna vara scopead utan att tvinga event-listan att polla.
**Konsekvens för warmup:** ett naivt warmup-set som inkluderar BÅDA
grenarna dubbelhämtar samma Airtable-data och bränner 2 av de knappa 5
req/s-slottarna i onödan. Detta MÅSTE lösas medvetet (välj EN gren per
underliggande dataset i warmup-setet, låt den andra mount:as kallt vid
första besök) — se § 6 och § Öppna frågor.

**5.3 — `networkMode: 'online'` (vår globala default, `src/router.ts` rad
24) gör att en `fetchQuery`/`ensureQueryData`/`prefetchQuery`-promise för
en query UTAN cachad data ALDRIG resolvar offline — den pausar
(`fetchStatus: 'paused'`) tills nätet återkommer.** Verifierat mot
TanStack Query-källkoden via context7 (`retryer.ts`:
`canStart()`→`pause().then(run)`) och bekräftat community-side
(`TanStack/query` issue #5054, GitHub Discussion #4753). **Konsekvens:**
`Promise.allSettled(warmupPromises)` hjälper INTE här — `allSettled`
väntar också ut varje enskild promise, och en pausad promise settlar
aldrig. Ett kallt, aldrig-tidigare-besökt-enhet-scenario UTAN persisterad
cache OCH offline vid appstart skulle få splashen att hänga för evigt om
inte varje warmup-anrop antingen (a) racear mot `onlineManager.isOnline()`
före start, eller (b) racear mot en timeout. Vår app har redan
`OfflineIndicator.tsx` som prenumererar på exakt samma `onlineManager` —
samma källa MÅSTE gate:a warmup-releasen.

**5.4 — Dubbelhämtning mot persist-restore är redan löst, återanvänd
mekaniken, bygg inte en ny.** `PersistQueryClientProvider` (main.tsx rad
99) gate:ar `useQuery`-mount internt via `useIsRestoring()` (context7-
bekräftat: *"internally utilized by useQuery and similar functions to
prevent race conditions between the restore process and mounting
queries"*). En warmup-modul som anropar `queryClient.ensureQueryData(...)`
FÖRE restore är klar riskerar att starta ett nätverksanrop för data som om
någon millisekund senare skulle hydreras in från `localStorage` — ren
kapplöpning, samma klass av bugg `useIsRestoring` finns för att förhindra.
**Warmup måste därför trigga EFTER `PersistQueryClientProvider`s
`onSuccess`-callback** (dokumenterad: *"invoked when the initial restore
finishes"*), inte enbart efter `auth.isLoading === false`.

**5.5 — Minsta-visningstid för splashen skulle bryta ett REDAN GRÖNT
E2E-kontrakt.** Ett vanligt UX-mönster ("visa splash minst 300 ms så den
inte flimrar") är HÄR fel — `tests/e2e/persist-cache.staging.test.ts` AC 1
asserterar noll synlig `role="status"`/`Laddar`-text under aktiv
bakgrundshämtning på varm start (rad ~213–219). En splash med
tvingad minimitid skulle rendera EXAKT den UI:n testet förbjuder. Skip-
logiken måste vara en RIKTIG skip (aldrig monterad), inte en snabbt
avfärdad splash.

**5.6 — PWA-uppdateringsbannern är strukturellt oberoende, INTE av tur.**
`AppUpdateBanner` monteras i `__root.tsx` (rad ~20 av det utdrag som lästs)
— INUTI `<RouterProvider>`. Så länge warmup-fasen hålls i `InnerApp`
(UTANFÖR `RouterProvider`, exakt som ADR-037:s befintliga render-gate),
kan bannern per konstruktion aldrig synas samtidigt som splashen. Flyttas
warmup-logiken någon gång IN i `__root.tsx` upphör den garantin och måste
omprövas.

## 6. Rekommendation mappad mot vår kod

**Ingreppspunkt:** `src/main.tsx`, `InnerApp` (rad 33–72). Bygg ut
render-gaten (ADR-037) med ett andra villkor: gaten släpper när
`!auth.isLoading && warmupSettled`, där `warmupSettled` sätts av en ny
hook/modul som körs EN gång, triggad av `PersistQueryClientProvider`s
`onSuccess` OCH `auth.isLoading === false` (vilket kommer sist avgör
ordningen — se § 5.4).

**Föreslaget warmup-set** (én gren per underliggande dataset, § 5.2 löst
genom att VÄLJA — se öppen fråga nedan för vilken gren):

| Nyckel (`src/queries/keys.ts`) | Rad | Underliggande EF |
|---|---|---|
| `events.list` ELLER `dashboard.events` (ej båda) | 28 / 133 | `get-events` |
| `registrations.all` ELLER `dashboard.registrations` (ej båda) | 13 / 132 | `get-registrations` |
| `waitlist.all` | 64 | `get-waitlist` |
| `intresserade.all` | 71 | `get-leads` |
| `maillog.all` | 77 | `get-mail-log` |
| `segment.saved` | 91 | `get-segments` |
| `activityLog.latest(limit)` | 122 | `get-activity-log` |

~7 distinkta EF-anrop — MEDVETET exkluderat: `persons.search`
(parametriserad på söktext, ingen naturlig "kärn"-fråga att förvärma) och
alla `detail`/`byEvent`-grenar (per-post, samma resonemang som ADR-078
avvisade för registrerings-detaljer).

**Skip-logik vid färsk cache:** anropa `queryClient.ensureQueryData({
...options, revalidateIfStale: true })` per nyckel, INTE `prefetchQuery`.
Motivering (context7-bekräftat): `ensureQueryData` returnerar cachad data
OMEDELBART om den finns (oavsett `staleTime`, om `revalidateIfStale` inte
tvingar omhämtning) — så en varm/persisterad cache (< 5 min gammal per
`router.ts` rad 13) gör hela warmup-settet klart på mikrosekunder utan ett
enda nätverksanrop, exakt Marcus krav "snabb-släpp när persist-cachen är
färsk". `revalidateIfStale: true` säkrar samtidigt att en PERSISTERAD men
`staleTime`-överskriden cache (t.ex. 20 min gammal, inom 24 h-fönstret)
ändå triggar en tyst bakgrundsuppdatering — ADR-072 beslut 5:s
osynlighets-mekanik, oförändrad.

**Rate-limit-respekterande sekvensering (§ 5.1):** fira INTE alla 7
anropen i ett naket `Promise.all`. Batcha i grupper om 2–3 (t.ex. via ett
enkelt `for`-med-`await`-par eller ett minimalt concurrency-tak), så
Airtable-taket 5 req/s aldrig träffas av en enda användares kallstart.
Ingen befintlig kö-primitiv finns att återanvända (§ 5.1) — detta är ny,
liten kod, inte en integrationspunkt mot befintligt maskineri.

**Progress-räkning:** `Promise.allSettled` över ett array av
`{ key, promise }`, var och en wrap:ad med `.finally(() => setSettled(n
=> n + 1))` — INTE `useIsFetching` (den räknar PÅGÅENDE fetchar, inte
SETTLADE, och nollställs så fort en enda fetch är klar — fel semantik för
en monotont stigande "X av N"-bar).

**Felväg (§ 5.3):** race:a varje `ensureQueryData`-anrop mot
`onlineManager.isOnline()` VID STARTEN (inte bara vid fel) — är enheten
offline vid warmup-start, hoppa hela warmup-fasen och släpp splashen
direkt (matchar AC 4:s befintliga "offline visar cachad data, inget
laddläge, inget felläge"-kontrakt, § 5.5). Blir enheten offline MITT I en
redan startad warmup, lägg en hård timeout (t.ex. 8–10 s, i linje med
NN/g:s 10 s-gräns och det uppmätta kalla EF-fönstret ~8 s i
`persist-cache.staging.test.ts` rad ~410) som släpper splashen med det som
hunnit bli klart — aldrig ett oändligt häng.

## Dom

**Kombination, inte antingen-eller — men den dedikerade warmup-modulen
är den bärande mekanismen, och router-loaders är ett separat, senare
beslut.** TanStack Router löser INTE "flera flikars data varm samtidigt";
det är strukturellt utanför vad en rutt-scopead loader kan göra. TanStack
Querys egna primitiv (`ensureQueryData`, `Promise.allSettled`,
`onlineManager`) är tillräckliga för att bygga hela mekanismen utan någon
ny beroende. Ingreppspunkten är den BEFINTLIGA render-gaten i
`InnerApp` (ADR-037), utbyggd — inte en ny yta.

## Vad jag inte kunde belägga

- **Figmas och Linears exakta val mellan determinate/indeterminate
  progress-UI under första sekunderna** — ingen av förstapartskällorna
  beskriver den visuella laddskärmens exakta form (bara att en finns, och
  att den inte blockerar interaktion längre än nödvändigt).
- **En namngiven, citerbar branschkälla för mönstret "N av M queries
  settled → determinate progress-bar" specifikt i TanStack Query-
  ekosystemet.** Mekaniken (§ 6, `Promise.allSettled` + räknare) är
  härledd ur TanStack Querys dokumenterade primitiv, inte kopierad ur ett
  namngivet recept — ingen sådan färdig, förstaparts- eller erkänd
  tredjepartsguide hittades trots sökning.
- **Exakt mätt kall-warmup-tid för VÅRT set på 7 anrop, sekvenserat under
  rate-limit-taket.** ADR-078:s siffror (1,0–1,4 s per EF) är mätta för
  ANDRA endpoints (`get-event`, `get-registrations` per event) — inget i
  detta pass körde en skarp mätning av de sju föreslagna kärn-EF:erna i
  följd. Ren extrapolering, inte mätning.
- **Om `AppUpdateBanner`s "alltid monterad, tom tills den har något att
  säga"-invariant håller om warmup-logiken någon gång flyttas in i
  `__root.tsx`.** Ej relevant för den rekommenderade ingreppspunkten
  (§ 5.6), men ovverifierat för ett scenario denna rekommendation
  avråder ifrån.
- **Notion-citatet från "Arjun Mehta"** — aktivt FÖRKASTAT som trolig
  hallucination (§ 3), inte "obelagt men kanske sant".

## Rekommendation (Code, ej beslut)

1. Bygg warmup-modulen som en utökning av `InnerApp`s befintliga
   render-gate (ADR-037), triggad efter BÅDA `auth.isLoading === false`
   OCH `PersistQueryClientProvider`s `onSuccess`.
2. Använd `ensureQueryData({ ...options, revalidateIfStale: true })` per
   nyckel i § 6-tabellen, batchat 2–3 åt gången mot Airtable-taket.
3. Lös § 5.2:s dubbla-nycklar-fråga EXPLICIT innan bygge — se öppen
   fråga nedan; välj inte tyst.
4. Progress via lokal `settled`-räknare (`Promise.allSettled` +
   `.finally`), inte `useIsFetching`.
5. Gate:a mot `onlineManager.isOnline()` vid start + hård timeout (8–10 s)
   mitt i — aldrig ett oändligt häng offline.
6. Skriv/utöka en E2E-regressionstest som låser AC 1/AC 4:s "noll synlig
   laddning på varm/offline-start" INNAN implementation, så
   skip-logiken har ett rött-först-bevis.
7. Ta INTE upp router-loaders i samma leverans — separat, senare beslut
   (öppnar/berör T94).

## Öppna frågor för grillning

1. **§ 5.2 — vilken gren vinner, `dashboard.*` eller `events.list`/
   `registrations.all`?** Om Hem-vyn öppnas EFTER en warmup som bara
   fyllt `events.list`, mountar `useDashboardEvents()` kallt trots att
   identisk data redan finns under en annan nyckel. Kräver antingen (a)
   ett medvetet val om vilken gren som "äger" warmup och en efterföljande
   refaktor av den andra till att LÄSA samma cache-post (bryter
   `ADR-017`s scope-isolerings-skäl för de separata nycklarna — måste
   omprövas öppet, inte tyst), eller (b) acceptera att EN av flikarna
   ändå gör ett första-mount-anrop trots warmup (delvis motsäger "alla
   flikar varma").
2. **Ska warmup köras VARJE inloggning (inkl. varm cache, per Marcus
   "rekommenderat även vid kall appstart med befintlig session")?** — om
   ja: splashen visas då även när den strukturellt inte behöver göra
   något (ensureQueryData resolvar på mikrosekunder) — är det värt att
   ändå visa "Förbereder ditt administrationsverktyg" i, säg, 200–400 ms
   för konsistens, eller ska varm-cache-vägen vara HELT tyst (då bryter
   den mot "alltid splash efter inloggning")? Detta är en direkt spänning
   mellan Marcus två krav i samma beställning.
3. **Ska § 6:s 8–10 s-timeout visa ett explicit fel/varning, eller tyst
   släppa in med vad som hunnit bli klart?** AC 4-precedentet
   ("inget felläge") pekar mot det senare, men det gäller uttryckligen
   OFFLINE — en seg men ONLINE kallstart (Airtable-tröghet, inte
   nätverksbortfall) kan vara en annan bedömning.
4. **Router-loaders — egen tråd eller del av denna leverans?**
   Rekommendationen ovan säger separat (punkt 7), men om Marcus vill
   lösa INSTANT-regelns återstående gap (T90:s öppna belastningsbeslut,
   direktladdning av en djuplänkad rutt utan varm cache) i samma svep
   är det värt att ta som en medveten, namngiven utökning av scope —
   inte en tyst bieffekt.

## Källförteckning

**Internt (repo, disk-verifierat 2026-08-15, gren `docs/s102-resume-lotta`,
commit `8d6b1880`):**

- [ADR-037 — Auth-resolution render-gate](../decisions/ADR-037-auth-resolution-render-gate.md)
- [ADR-055 — Datakälla-åtkomst via router-context-DI](../decisions/ADR-055-datakalla-atkomst-router-context-di.md)
- [ADR-072 — Klient-persist av query-cachen](../decisions/ADR-072-klient-persist-av-query-cachen.md)
- [ADR-078 — INSTANT-regeln](../decisions/ADR-078-instant-regeln.md)
- [ADR-047 — PWA-arkitektur Fas 5](../decisions/ADR-047-pwa-arkitektur-fas-5.md) § Amendering 2026-08-13
- [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md) § P4
- `src/main.tsx` (InnerApp render-gate), `src/router.ts`, `src/queries/persist.ts`,
  `src/queries/keys.ts`, `src/components/hem/useDashboardData.ts`,
  `src/components/events/EventCard.tsx` (`useForberedEventDetalj`),
  `src/components/AppShell/OfflineIndicator.tsx`, `src/routes/__root.tsx`,
  `tests/e2e/persist-cache.staging.test.ts` (AC 1, AC 4)
- `tasks/threads/T90-laddupplevelsen-pa-event-ytorna-marcus-beordrad-trad.md`
- `tasks/threads/T94-route-grammatiken-har-tre-hemvister-och-url-state-spec.md`
  (refererad, ej öppnad i sin helhet — ur registerraden)
- `tasks/threads/T95-riktig-app-professionell-inbjudan-for-roger-lotta.md`

**Externt (hämtat 2026-08-15):**

- context7 `/tanstack/router` — loaders, `ensureQueryData`, `defaultPreload`,
  `.preloadRoute`, `pendingComponent` (TanStack Router-dokumentationens
  källträd, mot pinnad version `1.170.21`)
- context7 `/tanstack/query` — `prefetchQuery`/`fetchQuery`/`ensureQueryData`
  API-referens, `useIsRestoring`, `persistQueryClient`/
  `PersistQueryClientProvider`, `useIsFetching`, retryer/`networkMode`-källkod
  (mot pinnad `^5.101.4`)
- [TkDodo — React Query meets React Router](https://tkdodo.eu/blog/react-query-meets-react-router)
  (2022-08-28, uppd. 2022-12-11)
- [TkDodo — Seeding the Query Cache](https://tkdodo.eu/blog/seeding-the-query-cache)
- [TanStack Query v5 — Prefetching guide](https://tanstack.com/query/v5/docs/framework/react/guides/prefetching)
- [performance.dev — How's Linear so fast? A technical breakdown](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown)
- [Figma Blog — Speeding up file load times, one page at a time](https://www.figma.com/blog/speeding-up-file-load-times-one-page-at-a-time/)
  (2024-05-22)
- [Notion — How we made Notion available offline](https://www.notion.com/blog/how-we-made-notion-available-offline)
- [NN/g — Progress Indicators Make a Slow System Less Insufferable](https://www.nngroup.com/articles/progress-indicators/)
  (2014-10-26)
- [NN/g — Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
  (1993, uppd. 2014)
- [TanStack/query GitHub issue #5054](https://github.com/TanStack/query/issues/5054) —
  paused-promise-beteende offline (community, ej förstapart — bekräftar
  context7-källkodsläsningen)
