---
owner: marcus803
updated: 2026-09-18
review_by: 2026-12-18
status: draft
---

# P1 — Diagnoskarta: kallstarten i laddningsskärmen (S1/S2/S3)

**Pass:** READ-ONLY diagnos, `/Users/marcus/Repon/miranon-media-admin`, 2026-09-18.
**Modell:** Opus 5 (1M context), `claude-opus-5[1m]` — medveten tier-avvikelse uppåt
(hypotesrankning av en icke-reproducerad bugg).
**Inga filer i repot ändrade.** `git status --porcelain` tom före och efter passet.

---

## 0. Kort svar först

Tre symptom, tre **olika** rotorsaksfamiljer. De hänger ihop i tid men inte i mekanik.

| | Symptom | Klassning |
|---|---|---|
| **S1** | Laddningsskärmen 4–5 s, baren rörde sig aldrig | **Implementerat beteende, inte en bugg i koden — men en designmiss.** Baren är `width: 0%` under HELA auth-fasen och fram till första settlade hämtningen; stall-signalen vid 3 s är strukturellt osynlig för en seende användare. |
| **S2** | Släpptes in på Hem innan Hem-datan var klar | **Dokumenterad fallback, INTE ett kontraktsbrott** — men med en mätt blind fläck: gaten släpper även när startvärmningen "lyckats" utan att ha cachat en enda rad. |
| **S3** | Layouten rörde sig när skeleton blev data | **Känd, testsanktionerad lucka.** CLS-grinden täcker INTE Hem. Hem-laddläges-testet mäter bara två koordinater per block och stryper medvetet Y-axeln för två av fyra block. |

---

## 1. Mekanismkarta — var laddningsskärmen bor och vad som styr den

### 1.1 Det finns ingen splash i HTML:t

`index.html:38` är `<div id="root"></div>` — **tomt**. Ingen inline-markup, ingen
skelettram, ingen `preconnect`. Den byggda `dist/index.html:36–80` lägger till
entry-chunken (≈390 KiB) och **46 `modulepreload`**, men fortfarande noll
`preconnect` mot Supabase-origin.

**Följd:** från att fönstret öppnas tills React committat sin första render är
ytan vit/blank. Det Marcus såg som "laddningsskärmen" kan alltså vara *två*
skilda ytor efter varandra — plattformens egen PWA-splash (manifestets
`background_color: '#ffffff'`, `vite.config.ts:119–120`, **har ingen bar**) och
därefter Förberedelseskärmen. Ingen av dem är märkt, så de går inte att skilja
åt i efterhand från en ögonobservation.

### 1.2 Två gater, en komponent

| Gate | Fil | När |
|---|---|---|
| **Boot-gaten** (`InnerApp`) | `src/main.tsx:167–505` | Kall appstart med befintlig session — **Lottas/Marcus fall** |
| **App-yta-gaten** | `src/routes/_authenticated.tsx:124–190` | Aktiv inloggning på redan monterad router (TASK-227) |

Båda renderar `Forberedelseskarm` (`src/components/AppShell/Forberedelseskarm.tsx:302`).

**Boot-gatens tillståndsmaskin** (`src/main.tsx:75–78`):
`{typ:'vantar'} → {typ:'varmar', forlopp} → {typ:'redo'}`.

- `src/main.tsx:432–445` — render-gaten. Allt som inte är `'redo'` målar skärmen.
- `src/main.tsx:436–438` — **under 200 ms (`SPLASH_TROSKEL_MS`, rad 32) målas ingenting alls**
  (`data-testid="splash-under-troskel"`).
- `src/main.tsx:439` — i fasen `'vantar'` används `FORBEREDELSESKARM_VANTAR`
  = `{klara: 0, totalt: 1}` (`Forberedelseskarm.tsx:47`). **Baren står på 0 % per konstruktion.**

### 1.3 Exakt vad som avgör att skärmen försvinner

`src/main.tsx:305–388`, warmup-effekten:

1. `rad 306`: `if (auth.isLoading || isRestoring || varmtBeslutat.current) return;`
   → **så länge auth eller cache-restaureringen pågår står gaten kvar i `'vantar'`.**
2. `rad 346–352`: oinloggad ELLER på en auth-yta → gaten öppnar direkt, ingen värmning.
3. `rad 357–362`: `arCacheVarm(queryClient)` → varm ⇒ `'redo'` direkt, ingen skärm.
4. `rad 373–380`: kall ⇒ `starta(queryClient, {dataSource})`; gaten flippar till
   `'redo'` när **`slutlofte`** resolvar — oavsett utfall (`'klar' | 'timeout' | 'offline'`).
5. `rad 385–387`: förloppsprenumerationen matar `{klara, totalt}` in i `gate`.

### 1.4 Vad som driver förloppsindikatorn

`src/data/warmup/startvarmningen.ts`:

- `rad 242–316` — **sju** items: `events`, `registrations`, `waitlist`,
  `intresserade`, `maillog`, `segment`, `activityLog`.
- `rad 115` — `BATCH_SIZE = 2` ⇒ körs som **2 + 2 + 2 + 1**, med `await` mellan grupperna.
- `rad 409–421` — `korAlla()`. Räknaren:

```js
item.kor({ qc, ds }).finally(() => { klara += 1; emit(); })   // rad 414–417
```

**`klara` räknar SETTLADE, inte LYCKADE.** Ett item som kastar (401, 5xx, timeout
i adaptern) ökar räknaren precis som ett som cachade data.

- `rad 386–389` — `emit()` skickar `{klara, totalt}` till alla lyssnare.
  **Emit sker ENBART när ett item settlar.** Mellan starten och första settlade
  hämtningen finns noll signal.

**Konsekvens för S1:** i batch 1 ligger de två tyngsta hämtningarna
(`get-events` + `get-registrations`, `AirtableAdapter.ts:143–158`). Innan den
första av dem settlar är `klara = 0` ⇒ `percentage = 0` ⇒ fyllnads-diven har
`style={{width: '0%'}}` (`Forberedelseskarm.tsx:385`). **En nollbred div.**

### 1.5 Stall-signalen som ingen ser

`Forberedelseskarm.tsx:311–321` sätter `stallad = true` efter
`STALL_THRESHOLD_MS = 3000` (`startvarmningen.ts:146`) utan props-ändring.
Vad som då händer:

- `rad 382`: fyllnaden får `motion-safe:animate-pulse` — **på ett element som är 0 px brett.**
- `rad 405`: raden "Tar lite längre tid än vanligt…" monteras med `className="sr-only"`.
- `rad 410–412`: samma text i en `role="status"`-region, också `sr-only`.

**Samtliga tre kanaler är osynliga för en seende användare vid `klara = 0`.**
Marcus formulering "ingen loadingbar kördes" beskriver alltså implementationen
exakt — inte ett fel i den, men ett hål i designen: skärmen har inget synligt
liv förrän den första av sju hämtningar landat.

*(Historik: texten var synlig fram till `task-273.6`, då Marcus bad om att skärmen
skulle "rensas till enbart loadingbaren". Stall-signalen från `task-240` byggdes
FÖRE den rensningen och tappade i praktiken sin synliga kanal i och med den.)*

### 1.6 Alla tidsgränser, timeouts och fallbacks

| Mekanism | Värde | Fil:rad |
|---|---|---|
| Splash-tröskel (mål inget alls) | 200 ms | `main.tsx:32`, `220–226` |
| Stall-signal (osynlig, se ovan) | 3 000 ms | `startvarmningen.ts:146` |
| **Hård warmup-timeout** | **9 000 ms** | `startvarmningen.ts:112`, timer `rad 446` |
| E2E-override av timeouten | `sessionStorage['e2eVarmningTimeoutMs']` | `startvarmningen.ts:357–366` |
| E2E-default (ej satt i prod) | `VITE_E2E_WARMUP_TIMEOUT_MS`, optional | `src/env.ts:34`, `main.tsx:116–118` |
| Offline-gate (noll hämtningar) | `onlineManager.isOnline()` | `startvarmningen.ts:401–407` |
| Route-chunk-indikator | tyst < 1 000 ms, min 500 ms synlig | `router.ts:126–128` |
| Persist-cachens livslängd | **24 h** | `queries/persist.ts:33` |
| Persist-buster | `__APP_VERSION__` = `package.json.version` = **"0.1.0"** | `persist.ts:41`, `vite.config.ts:37` |
| SW-uppdateringskontroll (bara öppen app) | 60 min | `lib/app-uppdatering.ts:78` |

**`timeoutMs` i prod är alltid 9 000** — varken env-defaulten eller
sessionStorage-nyckeln sätts av `build:production`.

### 1.7 Retry-lagren — dubbel, utan någon fetch-timeout

Två oberoende retry-lager staplas på varje warmup-hämtning:

1. **Nätverkslagret** — `src/data/utils.ts:35–65`, `fetchWithRetry`,
   `maxRetries = 3` ⇒ **4 försök**, backoff 200/400/800 ms + jitter.
   Retryar nätverksfel och 5xx; 4xx propageras direkt.
2. **Query-lagret** — `src/router.ts:21–22`, global default `retry: 3`,
   `retryDelay: min(200·2^n, 2000)`. `ensureQueryData` i warmup-motorn ärver
   detta. Den globala defaulten gör **ingen 4xx-undantag** (det gör bara
   `useDashboardData.ts:17–18` och `queries/intresserade-retry-policy.ts`).

Värsta fall per warmup-item: **4 × 4 = 16 nätverksanrop**. Och: **ingen
`AbortController`, ingen fetch-timeout någonstans** — en hängande EF hänger tills
webbläsarens egen socket-timeout, och bara warmup-gatens 9 s räddar användaren.

Detta är precis den dubbelpolicy `TASK-420` (Done) namngav — men 420 rättade
endast `intresserade.all`s 4xx-beteende, inte staplingen som sådan.

### 1.8 Auth-återställningen vid start

`src/auth/AuthProvider.tsx:70–107`:

- `rad 74–89`: `supabase.auth.getSession()` vid mount → `setIsLoading(false)`.
- `rad 92–101`: `onAuthStateChange` → `setUser(...)`, `setIsLoading(false)` vid varje event.

Kommentaren `rad 37–39` säger *"`getSession()` läser från local storage utan
re-validation mot server"*. Det är sant för en **giltig** token. Efter en vecka är
access-token sedan länge utgången, och `supabase-js` v2 gör då en
`refresh_token`-grant mot Supabase Auth **innan** löftet resolvar. Den
nätverksrundan sker utan `preconnect` (§1.1) och är alltså DNS + TCP + TLS +
request, från kallt.

Varje EF-anrop går dessutom genom `getAuthHeader()`
(`src/data/config/supabase-client.ts`, `async function getAuthHeader`) som anropar
`supabase.auth.getSession()` **igen** per anrop.

### 1.9 Service workern vid start (mätt av delpass)

- `vite.config.ts:46–49` — `injectManifest`, `src/sw.ts` → `dist/sw.js`,
  `injectRegister: false`.
- `vite.config.ts:71` — `registerType: 'autoUpdate'`.
- `src/sw.ts:21–22` — `precacheAndRoute(self.__WB_MANIFEST)` + `cleanupOutdatedCaches()`.
- `src/sw.ts:26–28` — `install` ⇒ `skipWaiting()`.
- `src/sw.ts:30–32` — `activate` ⇒ `clients.claim()`.
- `src/sw.ts:36` — `new NavigationRoute(createHandlerBoundToURL('index.html'))`
  ⇒ **cache-först**: navigeringen serveras ur den GAMLA precachen.
- `src/lib/app-uppdatering.ts:169–180` — `registerSW({...})` **utan `immediate`**
  ⇒ `vite-plugin-pwa` defaultar `immediate = false`
  (`node_modules/vite-plugin-pwa/dist/client/build/register.js:8`), och
  `workbox-window` skjuter då registreringen till `window`-`load`
  (`node_modules/workbox-window/src/Workbox.ts:113–114`).
- `updateServiceWorker(true)` anropas **aldrig** i kodbasen; uppdateringen kräver
  ett manuellt klick (`AppUpdateBanner.tsx:212` → `window.location.reload()`).

**Precachen:** 184 poster, `dist/assets` 2,4 MB okomprimerat (lokal `dist/` från
8 sep — se §8 om osäkerheten). Precache-strategin återanvänder oförändrade
poster (`workbox-precaching/src/PrecacheStrategy.ts:94–105`), men vid ett hopp
över **en veckas deploys i ETT byte-diff-steg** är det rimligt att större delen av
grafen är ny (Vite omhashar delade chunkar).

**Mätt prod-deploy-kadens** (Vercel API, read-only, projekt
`prj_AG7wuwo9GllCPLkPrKgv0FQfqVDh`): produktionsdeploys 2026-09-17 13:02Z,
13:36Z, 13:51Z, 14:00Z, 14:25Z och **2026-09-18 09:58Z**. Prod följer `main`,
och `main` tog 594 commits på 14 dagar. En veckogammal installerad app möter
alltså med säkerhet en ny SW vid öppning.

### 1.10 Vad Hem faktiskt behöver, och vad warmup faktiskt seedar

`src/components/hem/Hem.tsx:181–182` → `useDashboardEvents()` /
`useDashboardRegistrations()` (`useDashboardData.ts:56–75`), nycklarna
`dashboard.events` / `dashboard.registrations`.

Warmup hämtar mot **list**-nyckeln och **seedar** dashboard-nyckeln:
`startvarmningen.ts:246–252` och `258–263` (`qc.setQueryData(...)`).
`SenasteAktivitetKompakt` (`rad 38`) läser
`activityLog.latest(HEM_SENASTE_AKTIVITET_ANTAL)` = `['activityLog','latest',4]`,
vilket warmup seedar (`startvarmningen.ts:310`) — **nyckelpariteten håller.**

**Men seedningen sker bara om `ensureQueryData` RESOLVAR.** Kastar den, hoppas
`setQueryData` över — medan `klara` ändå ökar (§1.4).

**Två Hem-ytor ligger helt utanför warmup-setet:**

- `KvittojobbBanderoll` → `useJobbstatus(undefined, betalningarPa())`
  (`KvittojobbBanderoll.tsx:51`), med `refetchOnMount: 'always'`
  (`useJobbstatus.ts:70`). Flaggan `VITE_FEATURE_BETALNINGAR` är **på i prod**.
- `JobbLyssnare` (`_authenticated.tsx:206`) — Realtime-prenumeration + läsning vid appöppning.

Båda renderar `null` tills de har svar (ingen skeleton), men de **lägger två
extra anrop precis i den sekund Hem monteras** och kan poppa in en banderoll
efteråt (→ S3).

---

## 2. S2 — finns ett uttalat kontrakt att skärmen ska hålla kvar tills Hem-datan är klar?

**Nej. Det som hände är en dokumenterad fallback — men dokumentationen täcker
inte hela det fall som inträffade.**

### 2.1 Kontraktet, verbatim

`docs/decisions/ADR-112-forberedelseskarmen-blockerande-startvarmning.md:29–34`,
beslut 1:

> *"Blockerande startvärmning. Efter auth-resolution vid kall/stale cache körs en
> warmup-fas som förvärmer samtliga flikars kärn-queries; under tiden visas
> Förberedelseskärmen med äkta determinate bar (X av N hämtningar klara) och den
> Marcus-låsta texten."*

`ADR-112:38–42`, beslut 3:

> *"Skyddsräcken. Offline vid start ⇒ ingen Förberedelseskärm … Hård timeout
> ~8–10 s ⇒ TYST släpp in i appen med det som hann bli varmt; resterande ytor
> bär sina vanliga laddlägen."*

`ADR-112:51–52`, beslut 6:

> *"Router-loaders ingår INTE. Djuplänks-gapet (kall cache + direktlänk till
> detaljyta) är ett separat spår i tråd T90."*

`ORDLISTA.md:503–511`:

> *"den blockerande startskärm som visas vid kall appstart (ADR-112): en äkta
> determinate bar (X av N hämtningar klara) … Visas ALDRIG vid varm start (tyst
> väg), aldrig offline; timeout ~8–10 s släpper tyst."*

### 2.2 Tolkning

- Kontraktet gäller **samtliga flikars kärndata**, inte Hem specifikt. Hem är
  täckt i egenskap av att `events`/`registrations`/`activityLog` ingår.
- **Det TYSTA släppet vid timeout är uttryckligt** ("resterande ytor bär sina
  vanliga laddlägen"). Att se skeleton på Hem efter ett timeout-släpp är alltså
  designat beteende.
- **Ingen mening någonstans lovar att Hem-datan ska vara klar.**

### 2.3 Den blinda fläcken — och det är den intressanta delen

Kontraktet resonerar genomgående som om `klara = totalt` ⇒ data finns.
Implementationen gör inte den kopplingen:

- `startvarmningen.ts:414–417` — `klara` ökar i `.finally()`, alltså även på fel.
- `startvarmningen.ts:448–456` — `korAlla()` resolvar ⇒ `avgorMed('klar')`,
  oavsett hur många av de sju som faktiskt cachade något.
- `startvarmningen.ts:436–442` — **Sentry-rapporten fyrar ENBART vid
  `utfall === 'timeout' && klara < totalt`.**

**Följd:** en startvärmning där alla sju hämtningar FALLERAR går igenom som
`utfall: 'klar'`, `klara: 7 av 7`, baren når 100 %, gaten släpper — **och
lämnar noll observability-spår.** Hem monteras då med tom cache och går in i
sitt normala kalla laddläge. Ur användarens stol är det exakt det Marcus
beskriver; ur systemets stol såg allt perfekt ut.

Det är inte ett kontraktsbrott mot ADR-112:s bokstav. Det är ett gap mellan vad
ADR:n *antar* att räknaren betyder och vad den *mäter*.

---

## 3. S3 — Hem-skeletonens geometri mot den laddade vyn

`Skeleton`-primitiven (`src/components/primitives/Skeleton.tsx:24`):
`text` = `block h-[1lh] w-full rounded` — **exakt en radhöjd**. Varje laddad text
som radbryts till två rader växer alltså förbi sin platshållare.

Blockordningen på Hem: `Hem.tsx:344–434`.

| # | Block | Skeleton | Laddat | Höjddelta |
|---|---|---|---|---|
| 2 | **NastaEvent** (`NastaEvent.tsx:43–55`) | 4 rader: 3xl + body + body + (caption + 6 px bar) | `nasta == null` ⇒ **EN `<p>`** (`rad 62–63`); annars titel (3xl, **kan radbryta**), dagar-kvar, en `flex-wrap`-rad (ort + datum, **kan radbryta**), och belägggningsbaren **bara om `maxPlatser != null`** (`rad 98–110`) | Stor. Kan både växa och krympa. |
| — | **Bevakningsrad** (`Bevakningsrad.tsx:112`) | **Renderar `null`** under laddning (`rader = []`) | Ett helt block + sektionens `gap-12` | **Ren insättning.** Klassisk CLS. |
| 3 | **NyaAnmalningar** (`NyaAnmalningar.tsx:141–150`) | h2 `Skeleton w-2/3` + **2 rader** (avatar 36 px + `py-3`) | tomläge = **en `<p>`** (`151–155`); annars `<ul>` upp till `max-h-96`; **`BulkAtgardsknapp` monteras bara när `total > 0`** (`231–235`) | Stor, båda riktningarna. |
| 4 | **ForfallnaBetalningar** (`ForfallnaBetalningar.tsx:158–167`) | h2-skeleton + **2 rader** | tomläge = en `<p>` (`168–172`); annars **upp till tre grupper** med egna `h3` + räknare (`174+`) | Stor. |
| 4b | **KvittojobbBanderoll** (`KvittojobbBanderoll.tsx`, `if (!utfall) return null`) | `null` | `MessageBox` när ett jobb arbetar | Ren insättning. |
| 6 | **SenasteAktivitetKompakt** (`SenasteAktivitetKompakt.tsx:46–55`) | **fast 4 rader**, varje rad = caption + **en** body-rad | `data.statements.length` rader (0 ⇒ en `<p>`), och body-raden `{namn} {verb} · {objekt}` har **ingen `truncate`** ⇒ radbryter ofta | Varje bruten rad ≈ +1 radhöjd. |

De två listblocken (3 och 4) använder `truncate` på de riktiga raderna, så just
DE raderna håller en rad. Övriga fyra ställen gör det inte.

### 3.1 Täcker CLS-grinden Hem? Nej

`tests/acceptance/laddning-cls.acceptance.test.ts` (`TASK-416.14`, Done):

- Täcker **Check-in, Aktivitetshistorik, Anmälningar** — desktop 1280×720 och
  mobil 390×844, 6 test. **Hem ingår inte.** Betalningsinkorgen är medvetet
  deferrerad (`TASK-409`).
- Tröskel `CLS_TROSKEL = 0.05`, källmärkt mot web.dev/cls (good ≤ 0,1).
- Datatillstånd: hermetisk MSW-fixturvärld med "hallbarMock" — EF-svaren hålls
  obesvarade tills testet släpper dem. Alltså en seedad minimal fixtur, inte
  ett verkligt kallstartsläge.
- **Filens eget filhuvud bokför att grinden är strukturellt blind** för
  listkroppens skeleton-vs-laddad-geometri: listkroppen *unmountas* i stället för
  att resizas, och TabBar är `position: fixed`. En injicerad 2000 px
  `minHeight`-regression gav bit-identisk CLS. Grinden fångar bara
  **persisterande** sidkroms-element.

### 3.2 Vad säger hem-laddläges-testet?

`tests/acceptance/hem-laddlage.acceptance.test.ts`, rad 543–712
(`TASK-416.13`, ADR-083-fyndet: filhuvudet lovade i månader en boundingBox-mätning
som inte fanns i koden — rad 44–45 bokför det verbatim).

Mätningen som NU finns:

- Fyra viewports (375/390/768/1280).
- `boundingBox` `toEqual` under laddning vs efter datalandning för: NastaEvents
  h2 + kropp, NyaAnmalningars h2 + första rad, Förfallna betalningars h2 + första
  rad, Senaste aktivitets h2 + första rad.
- **`utanY()` stryper Y-koordinaten** för Förfallna betalningar och Senaste
  aktivitet — dokumenterat medvetet undantag, motiverat med "knappar/rubriker som
  bara existerar efter datalandning".

**Det testet kan alltså per konstruktion inte fånga det Marcus såg:**
det mäter *första raden* i varje block, inte blockets totala höjd; det tillåter
uttryckligen vertikal förskjutning nedanför NyaAnmalningar; och Bevakningsraden
(det renaste insättningsfallet) mäts inte alls, eftersom den inte existerar i
laddat läge.

---

## 4. Rankade hypoteser

Genomgående skillnad: **[KOD]** = koden tillåter/framtvingar detta, verifierat mot
fil:rad. **[HÄNDELSE]** = påstående om vad som faktiskt hände 2026-09-18 — ingen
av dessa är mätt.

### H-A (ny, HÖGST rankad för S1+S2) — startvärmningen "lyckades" utan att cacha något

**Påstående:** batch 1 (`get-events` + `get-registrations`) fallerade — 401 medan
token-refreshen ännu inte slagit igenom, eller 5xx från kalla Edge Functions —
och de fem följande gjorde detsamma. `slutlofte` resolvade `'klar'` efter ~4–5 s
(retry-staplingen, §1.7, kostar sekunder även när varje anrop misslyckas snabbt),
baren stod på 0 nästan hela tiden och nådde 100 % först i slutet. Hem monterades
med tom cache och gjorde om jobbet på egen hand (~3 s).

- **Belägg [KOD]:** `startvarmningen.ts:414–417` (`.finally()`),
  `448–456` (`'klar'` oavsett), `436–442` (Sentry tiger vid `'klar'`),
  `router.ts:21–22` + `utils.ts:35–65` (dubbel retry ⇒ sekunder även vid fel),
  `supabase-client.ts` `getAuthHeader` (varje EF-anrop väntar på en sessionsläsning).
- **Passar observationen:** förklarar 4–5 s (< timeoutens 9 s), stilla bar,
  släpp, OCH ~3 s skeleton — som ett enda sammanhängande förlopp.
- **BEKRÄFTAS av:** Supabase EF-loggar för `get-events`/`get-registrations` vid
  tidpunkten visar 4xx/5xx-svar, ELLER loggar visar en anrops-**dubblering**
  (warmup + Hems egna) inom samma minut.
- **FALSIFIERAS av:** EF-loggarna visar sju lyckade 200-svar inom fönstret och
  bara en omgång anrop ⇒ då cachades data och skeletonen måste ha en annan orsak.
- **Avgörande mätning:** Supabase Edge Function-loggar (status + tidsstämpel +
  antal anrop) för `get-events`, `get-registrations`, `get-activity-log`
  2026-09-18 vid inloggningsminuten.

### H-B (= H3, HÖG) — baren drivs av avklarade anrop och står still tills det första landar

**Detta är inte längre en hypotes utan verifierad mekanik** — det som återstår är
hur länge den stod still.

- **Belägg [KOD]:** `startvarmningen.ts:386–389` (`emit()` bara vid settle),
  `409–421` (batch 2+2+2+1), `main.tsx:439` (auth-fasen visar hårdkodat 0/1),
  `Forberedelseskarm.tsx:385` (`width: 0%`), `382` (puls på nollbred div),
  `405`/`410` (stall-texten `sr-only`).
- **[HÄNDELSE] kvarstår:** hur mycket av de 4–5 s som var auth-fasen (0/1) och hur
  mycket som var warmup-fasen (0/7). De ser **identiska** ut på skärmen.
- **Avgörande mätning:** repro enligt §5 med tidsstämplad DOM-sampling; i skarp
  drift krävs ett performance-märke som i dag inte finns.

### H-C (= H1, HÖG, men förklarar bara delar) — kall EF efter en veckas inaktivitet

- **Belägg [KOD/MÄTT]:** `tasks/todo.md` rad ~56–58 bokför 1,0–1,6 s varm /
  **10,3 s kall** mot staging. `startvarmningen.ts:409–421` kör batch 1 först;
  ingen fetch-timeout finns (§1.7).
- **Viktig konsekvens:** **en enda kall EF på 10,3 s spränger warmup-gatens 9 s.**
  Då hade släppet skett vid ~9 s, inte 4–5. Det är därför H-C ensam **inte**
  passar tidsuppskattningen — men den passar perfekt som *orsak till* H-A
  (Supabase svarar 5xx under boot i stället för att hänga).
- **BEKRÄFTAS av:** EF-loggarnas `execution_time` för första anropet.
- **FALSIFIERAS av:** svarstider i 1–2 s-klassen ⇒ EF:erna var inte kalla.

### H-D (= H2, MEDEL) — timeouten släppte in användaren

- **Belägg [KOD]:** `startvarmningen.ts:112` (9 000 ms), `446` (timern),
  `436–442` (Sentry-varning), `main.tsx:377–380` (gaten släpper på slutlöftet).
- **Mot:** Marcus uppskattade 4–5 s. Människor **överskattar** väntan snarare än
  underskattar den, vilket gör 9 s osannolikt men inte uteslutet.
- **BEKRÄFTAS/FALSIFIERAS ENTYDIGT av:** Sentry — meddelandet *"Startvärmningen
  nådde hård timeout innan alla datamängder klara"*, tagg `warmup: timeout-partial`,
  `extra: {klara, totalt, timeoutMs}`. **Finns raden för 2026-09-18 ⇒ H-D. Saknas
  den ⇒ H-D är falsifierad och H-A stärks kraftigt** (eftersom ett `'klar'`-släpp
  inte loggar någonting alls).
- **Detta är passets billigaste och mest diskriminerande mätning. Gör den först.**

### H-E (= H4, MEDEL — bidragande, inte ensam orsak) — SW-uppdateringen konkurrerar om bandbredden

- **Belägg [KOD/MÄTT]:** `sw.ts:36` (navigering ur GAMLA precachen),
  `sw.ts:26–32` (`skipWaiting` + `clients.claim`),
  `app-uppdatering.ts:169–180` (registrering skjuten till `window.load`),
  184 precache-poster / 2,4 MB, samt sex mätta prod-deploys 17–18 sep (§1.9).
- **Mekanism:** den nya SW:n installerar och hämtar hela precachen **parallellt
  med** token-refreshen och de sju EF-anropen, på samma uppkoppling, i exakt de
  sekunder Förberedelseskärmen visas.
- **BEKRÄFTAS av:** nätverksspår (DevTools, `Disable cache` AV, installerad app)
  som visar SW-initierade asset-hämtningar överlappande EF-anropen.
- **FALSIFIERAS av:** spår där SW-installationen är klar före första EF-anropet.
- **Kan inte ensam förklara S2** (den stoppar inte datacachningen) — men den
  förlänger allt annat.

### H-F (LÅG–MEDEL, ny) — auth-fasen ensam stod för större delen av väntan

**Påstående:** `getSession()`s refresh-runda tog flera sekunder (utgången token +
ingen `preconnect` + kall nätverksstack efter uppvaknande), och skärmen stod i
`'vantar'` med hårdkodat 0/1 hela tiden.

- **Belägg [KOD]:** `AuthProvider.tsx:74–89`, `main.tsx:306` + `439`,
  `index.html` (ingen `preconnect`).
- **BEKRÄFTAS av:** nätverksspår som visar `POST /auth/v1/token?grant_type=refresh_token`
  med flera sekunders varaktighet före första `functions/v1/`-anropet.
- **FALSIFIERAS av:** refresh-anropet klart under ~500 ms.

### H-G (LÅG, ny — men värd en kontroll) — gaten hoppade över värmningen helt

**Påstående:** `onAuthStateChange` fyrade ett tidigt event med `session = null`
⇒ `isLoading` false och `isAuthenticated` false samtidigt ⇒ bypass-grenen
(`main.tsx:346–352`) satte `varmtBeslutat = true` och `gate = 'redo'` **utan att
någon startvärmning startade**. Hem monterades sedan efter att sessionen kom
tillbaka, med tom cache.

- **Belägg [KOD]:** bypass-grenen finns och sätter `varmtBeslutat.current = true`
  (`rad 349`) — efter det kan boot-gaten aldrig värma något i den sidladdningen.
  `_authenticated.tsx:127–131` har en egen gate som *skulle* fånga fallet vid
  mount, men bara om `arCacheVarm` är falskt vid just den renderingen.
- **Emot:** en `isAuthenticated: false`-passage borde ha gett en redirect till
  `/login` (`_authenticated.tsx:23–28`), vilket Marcus inte såg.
- **FALSIFIERAS av:** repro där auth-eventens ordning loggas och ingen
  null-session passerar.
- **Avgörande mätning:** instrumenterad repro (§5) med `onAuthStateChange`-logg.

### H-H (SÄKERSTÄLLD som förutsättning, inte som orsak) — cachen var garanterat kall

Inte en konkurrerande hypotes utan en **verifierad premiss** för alla ovan:

- `persist.ts:33` — `maxAge` 24 h. Datorn var av i en vecka.
- Biblioteks-källa, `node_modules/@tanstack/query-persist-client-core/build/modern/persist.js:26–30`:
  `expired || busted ⇒ persister.removeClient()` — **ingenting hydreras**.
- ⇒ `arCacheVarm()` (`startvarmningen.ts:328–330`) var **falskt**.
- ⇒ den kalla vägen (splash + startvärmning) var **oundviklig**.

Notera bifynd: `buster = __APP_VERSION__ = "0.1.0"` (`vite.config.ts:37`,
`package.json:3`) — **buster-skyddsräcket (ADR-072 skyddsräcke 3) har varit
verkningslöst sedan versionsfältet slutade uppdateras.** Cache skriven av en
äldre app-version kastas inte; det är bara 24 h-gränsen som städar. Egen
fynd-kandidat, orelaterad till dessa tre symptom.

### H-I (avfärdad för S3) — hypotes H6 stämmer, men behöver skärpas

Orkestrerarens H6 ("Hem-skeletonens geometri skiljer sig beroende på data") är
**korrekt och verifierad** (§3) — men den underskattar saken: den största
förflyttningen kommer inte från kort som *skiljer sig*, utan från block som är
**helt frånvarande** under laddning (Bevakningsrad, KvittojobbBanderoll,
BulkAtgardsknapp) och från texter som **radbryter** förbi en `h-[1lh]`-platshållare.

---

## 5. Reproduktionsslinga — tätast möjliga röd-kapabla form

Huset har redan allt som behövs. Ingen ny infrastruktur.

### 5.1 Val av yta

**Hermetisk acceptance (MSW), inte staging.** Skäl: `tests/support/fixturvarld/handlers.ts`
dokumenterar överskuggnings-mönstret uttryckligen för *"felvy, tom lista,
**långsamt svar**"* via `network.use(...)`, och `laddning-cls.acceptance.test.ts`
har redan "hallbarMock"-formen (EF-svar hålls tills testet släpper dem).
Determinism slår realism här — kall EF går inte att beställa fram i staging.

### 5.2 Fixtur: tvinga fram produktionens riktiga gate

```ts
await page.addInitScript(() => {
  // Produktionens 9 s-timeout (e2e-webServern sätter annars nära noll)
  sessionStorage.setItem('e2eVarmningTimeoutMs', '9000');
  // 200 ms-tröskeln behålls — den är en del av det som mäts
  localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE'); // garantera kall cache
});
```

Nycklarna är källverifierade: `startvarmningen.ts:335`
(`E2E_TIMEOUT_OVERRIDE_NYCKEL = 'e2eVarmningTimeoutMs'`), `main.tsx:38`
(`E2E_SPLASH_TROSKEL_NYCKEL = 'e2eSplashTroskelMs'`), `persist.ts` (bibliotekets
default-nyckel `REACT_QUERY_OFFLINE_CACHE`).

### 5.3 Tre scenarier — ett per hypotesfamilj

| # | Scenario | Överskuggning | Vad det isolerar |
|---|---|---|---|
| **A** | Kall EF i batch 1 | `get-events` + `get-registrations` fördröjs 12 000 ms (`await delay(12000)`), övriga fem svarar normalt | H-C + H-D: gaten ska då släppa på **timeout** vid 9 s med `klara = 5` |
| **B** | Warmup "lyckas" men cachar inget | samtliga sju EF svarar **500** efter 150 ms | **H-A**: `slutlofte` ska resolva `'klar'`, `klara = 7`, baren nå 100 %, gaten släppa — och Hem ändå visa skeleton |
| **C** | Seg token-refresh | `POST **/auth/v1/token*` fördröjs 4 000 ms; EF:erna normala | H-F: skärmen ska stå på 0/1 hela tiden utan synlig förändring |

### 5.4 De röd-först-assertioner som fäller dagens beteende

**S1 — "ingen synlig förändring"** (fäller i A, B och C i dag):

```ts
// Sampla fyllnadens FAKTISKA bredd i px var 250:e ms i 5 s
// från att [data-testid="forberedelseskarm-block"] blir synlig.
// RÖD i dag: varje sampel är 0 px fram till första settle.
expect(forstaSynligaForandringMs).toBeLessThan(1500);
```

Kompletterande, billigare variant: assertera att när `stallad` slagit till
(> 3 000 ms utan framsteg) finns **minst en synlig** (ej `sr-only`, ej nollbred)
indikation i DOM:en. Röd i dag per `Forberedelseskarm.tsx:382/405/410`.

**S2 — "släpptes in innan datan fanns"** (fäller i A och B):

```ts
await expect(page.locator('main#main')).toBeVisible();          // gaten släppte
const skelett = page.locator('[role="status"][aria-busy="true"]');
expect(await skelett.count()).toBe(0);                          // RÖD i dag
```

Plus en sanningsassertion mot motorn, som är den egentliga poängen i scenario B:

```ts
// Röd i dag: klara === totalt trots att noll queries bär data
const cachade = await page.evaluate(() => /* qc.getQueryCache().getAll()
   .filter(q => q.state.data !== undefined).length */);
expect(cachade).toBeGreaterThan(0);
```

**S3 — layouten rör sig på Hem** (helt otäckt i dag):

Återanvänd `matCLSOverNavigering` (`tests/support/mat-cls.ts`) mot `/hem`,
desktop 1280×720 + mobil 390×844, med en fixtur som har **minst en
bevakningsrad**, **ett event utan `maxPlatser`** och **aktivitetsrader vars text
radbryter**. Tröskel 0,05 (samma som `laddning-cls.acceptance.test.ts`).
Komplettera med sektionsnivå-boundingBox (hela `<section>`, inte bara första
raden) för de sex blocken i §3 — och **utan** `utanY()`.

### 5.5 Skarp mätning som INTE kan göras hermetiskt

Kall Edge Function, SW-uppdateringscykel och verklig token-refresh finns inte i
fixturvärlden. För dessa: installerad PWA + DevTools-protokoll (`mcp__chrome-devtools__*`
finns i verktygsytan), `performance_start_trace` över öppningen, plus
`list_network_requests` för att se om SW-precachen överlappar EF-anropen (H-E).

---

## 6. Åtgärdsriktningar (INTE implementation)

Uppdelat i **GOLV** (branschstandard/tillgänglighet — skärs aldrig bort) och
**SPEKULATION** (bygg inte utan mätning som motiverar det).

### GOLV

1. **Ge skärmen ett synligt liv vid 0 %.** Dagens stall-signal är korrekt tänkt men
   landar på en nollbred div och i `sr-only`-text. Branschmönstret är entydigt:
   en determinate bar som inte kan röra sig ska degradera till **indeterminate**
   (Material Design 3 *Progress indicators*: indeterminate när "the wait time is
   unknown"; W3C APG *meter/progressbar*: en progressbar utan känt värde anges
   utan `aria-valuenow`). Det är exakt det fall vi har mellan 0 och första settle.
2. **Räkna det som faktiskt betyder något.** `klara` ska spegla **lyckade**
   hämtningar (eller rapportera båda talen). Utan det är `7 av 7` en lögn i det
   vanligaste felfallet, och observability tiger (§2.3). Kostnaden är en rad i
   `korAlla()`.
3. **Fyra fall, inte tre.** `avgorMed('klar')` ska skilja "klar med data" från
   "klar utan data" och rapportera det senare till Sentry på samma sätt som
   timeouten redan rapporteras (`startvarmningen.ts:436–442`). Annars är dagens
   blinda fläck permanent.
4. **`preconnect` mot Supabase-origin i `index.html`.** DNS + TCP + TLS mot
   `*.supabase.co` startar i dag först när det första anropet fyrar. Detta är
   web.devs standardrekommendation för tredjeparts-origins på kritisk väg och
   kostar en rad.
5. **En fetch-timeout i `fetchWithRetry`.** I dag finns ingen `AbortController`
   någonstans (`utils.ts:35–65`); warmup-gatens 9 s är enda skyddet, och Hems egna
   queries efter släppet har inget alls.
6. **Ta bort dubbelretryn på warmup-vägen.** 4 × 4 = 16 anrop mot en kall EF är
   inte resiliens, det är kö. `TASK-420` löste ett nyckel-specifikt symptom, inte
   staplingen.
7. **CLS-grind på Hem, och utan `utanY()`-undantagen.** `TASK-416.14` täcker tre
   vyer; Hem — appens startvy och den enda Lotta alltid ser — saknas. Skeleton
   ska dessutom reservera plats för block som *kan* komma
   (Bevakningsrad/KvittojobbBanderoll/BulkAtgardsknapp), vilket är precis den
   regel `DESIGN-SYSTEM-SPEC` §15 (TASK-416.21) redan bär.

### SPEKULATION — bygg inte utan mätning

- **Höj eller sänk 9 s-timeouten.** Utan mätning av hur ofta den faktiskt fyrar
  är varje nytt tal lika godtyckligt som det gamla. Mät först (Sentry-taggen finns).
- **"Förvärm allt".** Redan prövad och avvisad med räkning:
  `docs/research/forvarma-allt-branschmonster-2026-09-06.md` — 342 sekventiella
  Airtable-anrop ≈ 68,4 s mot en 9 s-budget, och varken TanStack Router,
  Next.js eller React Router exponerar en global "preload allt"-flagga.
- **Byt splash-strategi till "app-skal + skeleton direkt" (Gmail/Linear-mönstret)
  i stället för blockerande gate.** Attraktivt, men det river ADR-112:s beslut 1
  och kräver eget beslut — inte en sidoeffekt av en buggfix.
- **Egen PWA-splashanimation.** Plattformens splash går inte att styra på detta
  sätt; nedlagd tid utan mottagare.
- **`immediate: true` på `registerSW`.** Skulle flytta SW-uppdateringen TIDIGARE
  in i boot-fönstret — alltså sannolikt göra H-E värre, inte bättre.

---

## 7. Filer lästa i detta pass

Alla sökvägar relativa `/Users/marcus/Repon/miranon-media-admin/`.

**Kod (huvudpasset):**
`index.html` · `src/main.tsx` · `src/router.ts` · `src/auth/AuthProvider.tsx` ·
`src/routes/_authenticated.tsx` · `src/routes/_authenticated/hem.tsx` ·
`src/data/warmup/startvarmningen.ts` · `src/data/utils.ts` ·
`src/data/config/supabase-client.ts` · `src/data/adapters/AirtableAdapter.ts` (utdrag) ·
`src/data/betalningar/useJobbstatus.ts` (utdrag) · `src/data/queries/useActivityLog.ts` (utdrag) ·
`src/queries/persist.ts` · `src/queries/keys.ts` (utdrag) · `src/env.ts` (utdrag) ·
`src/observability/sentry.ts` · `src/lib/report-web-vitals.ts` · `src/lib/skriv-laddningssida.ts` ·
`src/components/AppShell/Forberedelseskarm.tsx` · `src/components/AppShell/AppShell.tsx` ·
`src/components/primitives/Skeleton.tsx` (utdrag) ·
`src/components/hem/Hem.tsx` · `useDashboardData.ts` · `NastaEvent.tsx` ·
`NyaAnmalningar.tsx` (utdrag) · `ForfallnaBetalningar.tsx` (utdrag) ·
`SenasteAktivitetKompakt.tsx` · `KvittojobbBanderoll.tsx` (utdrag) · `Bevakningsrad.tsx` (utdrag) ·
`vercel.json` · `ORDLISTA.md` (utdrag) · `tasks/todo.md` (utdrag) ·
`tests/support/fixturvarld/handlers.ts` (filhuvud) ·
`node_modules/@tanstack/query-persist-client-core/build/modern/persist.js` (utdrag)

**Via delpass 1 (SW/PWA):** `vite.config.ts` · `src/sw.ts` · `src/lib/app-uppdatering.ts` ·
`dist/index.html` · `dist/sw.js` · `public/` · `node_modules/vite-plugin-pwa/dist/client/build/register.js` ·
`node_modules/workbox-window/src/Workbox.ts` · `node_modules/workbox-precaching/src/PrecacheStrategy.ts` ·
`node_modules/workbox-precaching/src/PrecacheController.ts`

**Via delpass 2 (kort/tester/ADR):** `backlog/tasks/task-416*`, `task-420*`, `task-442*` (via CLI) ·
`tests/acceptance/hem-laddlage.acceptance.test.ts` · `tests/acceptance/laddning-cls.acceptance.test.ts` ·
`tests/support/mat-cls.ts` · `tests/a11y/Forberedelseskarm.spec.ts` ·
`tests/webblasarbeteende/forberedelseskarm-hojdkedja.test.ts` ·
`tests/e2e/persist-cache.staging.test.ts` · `tests/e2e/mer-betalningar-laddlage.staging.test.ts` ·
`docs/decisions/ADR-112-forberedelseskarmen-blockerande-startvarmning.md` ·
`docs/research/forvarma-allt-branschmonster-2026-09-06.md`

**Extern läsning:** Vercel Deployments API (read-only) för projektet.

---

## 8. Vad jag INTE kunde verifiera

1. **Vad som faktiskt hände 2026-09-18.** Inget i detta pass är en mätning av
   händelsen. Samtliga hypoteser i §4 är öppna tills Sentry/EF-loggarna lästs.
2. **Sentry-läget.** Att `VITE_SENTRY_DSN` är satt i Vercels prod-miljö är
   **inte** verifierat — jag har bara läst `sentry.ts:23–31` som visar att init
   hoppas över utan DSN. Är DSN osatt existerar inte den avgörande mätningen för
   H-D, och då måste EF-loggarna bära beviset ensamma.
3. **CLS i prod finns inte mätt.** `report-web-vitals.ts` skickar till
   `/api/web-vitals` — **det finns ingen `api/`-katalog i repot** och `vercel.json`
   rewritar `"/(.*)"` till `index.html`. Mätvärdena går alltså i en SPA-vägg.
   Kommentaren i filen säger "TODO Fas 7". Vi har därför ingen prod-CLS-serie
   att jämföra S3 mot.
4. **Exakt klockslag för Marcus öppning.** Prod deployades 2026-09-18 09:58Z;
   om öppningen skedde före eller efter avgör om SW mötte en helt ny precache
   just då. Inte fastställt.
5. **`dist/` på disk är byggd 8 sep** och motsvarar inte nödvändigtvis prod.
   Bundel- och precache-talen (390 KiB entry, 184 poster, 2,4 MB) är därför
   riktningsgivande, inte exakta för den build Marcus fick.
6. **`supabase-js`:s exakta refresh-semantik** vid `getSession()` med utgången token
   är beskriven ur bibliotekets dokumenterade beteende, **inte** källäst i detta
   pass. Behandla H-F:s mekanismbeskrivning som hypotes tills den är källäst eller
   mätt i nätverksspår.
7. **Ordningen mellan `onAuthStateChange`-eventen och `getSession()`-löftet**
   (bärande för H-G) är inte källäst.
8. **Om `TASK-416.15` (QA-vandringen) eller `TASK-442` rört sig** sedan korten
   lästes — delpasset läste kortens text, inte CI-/PR-läget.

---

## 9. Kvittens

**Detta pass har inte rört repot.** Inga filer skapade, ändrade eller raderade av
mig; inga commits; inga servrar startade. Enda skrivningen är denna fil, i
sessionens scratchpad utanför repot.

`git status --porcelain` mätt två gånger:

- **Vid passets start:** tom.
- **Vid passets slut:** EN rad — `?? docs/research/mallvaljare-och-mall-editor-resend-2026-09-18.md`
  (44 386 byte, mtime `Sep 18 12:09`, frontmatter `status: draft`).

**Den filen är inte min.** Den tillhör ett parallellt syskonpass (mallväljare +
mall-editor / Resend) som kördes samtidigt i samma checkout — ämnet är orelaterat
till detta diagnospass. Jag har inte rört den, och den ska bokföras hos sitt eget
pass, inte här. Redovisas öppet i stället för att rapporteras som "tomt träd",
eftersom påståendet annars hade varit falskt.

## 10. Tillägg av orkestreraren — mätt efter passet (S127, 2026-09-18)

- **H-D är BEKRÄFTAD av Marcus i Sentry:** meddelandet *"Startvärmningen nådde hård timeout innan alla datamängder klara"* finns. Det var alltså tidsgränsen på 9 s som släppte in honom; H-A (sju tysta misslyckanden) är därmed INTE förklaringen till just denna händelse. Blinda fläcken i § 2.3 är fortfarande sann som kod och åtgärdas ändå.
- **Varför ~3 s skeleton efter släppet, verifierat mot kod:** startvärmningen hämtar under `queryKeys.events.list` / `queryKeys.registrations.all` och seedar `queryKeys.dashboard.*` först EFTER att hämtningen resolvat (`startvarmningen.ts:246–263`). Hem läser `dashboard.*` (`useDashboardData.ts`). Efter ett timeout-släpp är Hems nycklar tomma, så Hem startar en ANDRA `fetchEvents()`/`fetchRegistrations()` medan den första fortfarande är i flykt — TanStack Query deduplicerar bara per nyckel. Skeleton-tiden är resten av en hämtning på ~12 s, vilket stämmer med den mätta kalla latensen 10,3 s (S123).
- **Sentry ÄR påslaget i prod:** en DSN ligger i en av prod-appens 43 förladdade kodfiler (`admin.miranon.dev`, entry `index-CYProzOC.js`). Prod-`index.html` bär 0 `preconnect`.
- Samtliga fil:rad-citat i § 1.3–1.6, § 2.3 och § 3.1 stickprovade av orkestreraren mot `origin/main` `7bc4c352` utan avvikelse.
