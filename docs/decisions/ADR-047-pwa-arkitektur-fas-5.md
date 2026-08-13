# ADR-047: PWA-arkitektur Fas 5 — `vite-plugin-pwa` injectManifest + DoD 4-modernisering

- Status: Accepted
- Datum: 2026-06-12
- Fas: 5

> **Korrigering (Session 16 K-sista, 2026-06-12):** B3c-precisering per
> Marcus-kvitterat beslut vid fas-avslutet. (i) Accessibility + Best
> Practices håller trösklar mot Fas 0-baselinen — uppfyllt (100/100 mot
> 100/96). (ii) Performance-jämförelsen mot Fas 0 mäter ackumulerad, redan
> deferrad bundle-skuld (todo Fynd 7: Fas 2+3-kod, 324 → 865 kB raw), inte
> någon Fas 5-regression — Performance ärver därför Fynd 7-defern och mäts
> mot perf-budgeten i Fas 7; Fas 5-mätningen 81 dokumenteras som
> ingångsvärde. Trail: Session 16 K5 STOPPA-rapport + Marcus-kvittens.
> Beslutstexten nedan bevaras oförändrad (immutabilitet).

## Kontext

Fas 5 bygger ut Fas 0:s SW-skelett (`public/sw.js`, no-op fetch, kommentar
"Utökas med Workbox i Fas 5") till riktig PWA-grund. Web-research 2026-06-12
(Chat, förstapartskällor: `vite-pwa-org`, Chrome Developers, TanStack-docs,
Workbox-docs) ligger till grund.

Centralt research-fynd: Lighthouse tog bort PWA-kategorin i v12 (april 2024,
per Chromes uppdaterade installability-kriterier) — byggplanens DoD 4
"Lighthouse PWA-score ≥ 90" (skriven P3a 2026-05-05) refererar en mätare som
inte längre existerar.

## Beslut

**B1 — `vite-plugin-pwa` med strategin `injectManifest`.** Skäl: (a) befintligt
eget SW-skelett porteras i stället för att kasseras — `public/sw.js` →
`src/sw.ts`, pluginet kompilerar + injicerar precache-manifest; (b) egen
SW-fil krävs för offline-fallback-logik nu och Background Sync i Fas 8
(ADR-019); (c) `generateSW` täcker bara standard-caching utan custom logik
(officiell vägledning). Pluginets peer-range täcker Vite 3→8.

**B2 — Offline-fallback per Workbox officiella mönster:** precachad
`/offline.html`; `NavigationRoute` + `createHandlerBoundToURL('index.html')`
för SPA-navigationer; `setCatchHandler` som vid
`request.destination === 'document'` svarar `matchPrecache('/offline.html')`.
Normalfall offline = cachat skal renderas; offline.html = fallback vid
cache-miss. SW-registreringen flyttas från manuell kod i `main.tsx` till
pluginets registrerings-mekanism (eliminerar dubbelregistrerings-risk).

**B3 — DoD 4 ersätts (falsifierad av Lighthouse v12).** Ny lydelse:
(a) manifest uppfyller Chromes installability-kriterier — DevTools
Application-panel visar installerbar, 0 manifest-fel; (b) offline-beteende
verifieras maskinellt via Playwright (`context.setOffline(true)` → reload →
cachat skal eller offline.html); (c) kvarvarande Lighthouse-kategorier
(Performance/Accessibility/Best Practices) håller trösklar mot
Fas 0-baselinen.

**B4 — Manifest genereras/injiceras av pluginet:** `name`/`short_name`,
`start_url`, `display: standalone`, theme/background ur design-tokens;
ikoner 192+512 inkl. maskable genereras ur `public/miranon-logo.svg` via
`@vite-pwa/assets-generator`.

**B5 — TanStack offline-config:** explicit `networkMode: 'online'` som
dokumenterad default (pausar queries offline, visar cachad data) +
offline-indikator i app-skalet via `onlineManager`/`fetchStatus 'paused'`.
`persistQueryClient` DEFER till Fas 6/8 — community-dokumenterade fallgropar
(error-states vid offline-start, implicit `offlineFirst`) och ingen verklig
data att persista förrän vyerna finns.

## Alternativ som övervägdes

**`generateSW`.** Avvisat per B1c: täcker bara standard-caching utan custom
logik — offline-fallback nu och Background Sync i Fas 8 kräver egen SW-fil.

**Manuell workbox-build utan plugin.** Avvisat: återuppfinner
Vite-integration pluginet sköter.

**Behålla DoD 4 mot gammal Lighthouse-version.** Avvisat: pinna föråldrat
verktyg som proxy-mätare strider mot verifiera-mot-verklighet-disciplinen.

**`persistQueryClient` i Fas 5.** Avvisat per B5.

## Konsekvenser

**Positiva:**

- CI-bar offline-verifiering starkare än poäng-proxy.
- Fas 8 har SW-arkitekturen den behöver.

**Negativa:**

- Ikon-assets blir nytt arbete (K2).
- DoD-ändring i låst byggplan. Mitigation: detta ADR är beslutsspåret.

## Updates

### 2026-08-13 (S105) — appen får en uppdateringsväg; `skipWaiting()` behålls

Beslutet ovan är oförändrat. Denna post TILLFÖR den uppdateringsväg B1/B2
aldrig gav appen, och preciserar B2:s sista mening.

**Vad som var trasigt, mätt.** `TASK-199`s utredningspass
([`task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md`](../research/task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md)
§ 3) visade att en installerad app kunde köra **gammal kod obegränsat länge**.
Tre fakta grep in i varandra:

| Fil | Vad som stod där | Följd |
|---|---|---|
| `src/sw.ts` install-handler | `self.skipWaiting()` | workern passerar aldrig `waiting` |
| `vite.config.ts` | `registerType` ej satt, default `'prompt'` | prompt-grenens hela omladdningsväg hänger på `waiting` |
| `src/main.tsx` | `registerSW()` utan optioner | `onNeedRefresh` odefinierad, prompten en no-op |

Workbox-window schemalägger `waiting` med 200 ms fördröjning och **avbryter**
det när workern går till `activating`. Vår `skipWaiting()` hann alltid först,
så `waiting` fyrade aldrig, ingen `controlling`-lyssnare registrerades, och
ingen omladdning skedde. En SPA-ruttändring är dessutom `history.pushState`,
inte en navigation, och triggar därför ingen uppdateringskontroll alls.

**Beslut (Marcus, S105).** Research § 7 lade tre vägar på bordet. Vald:
**`autoUpdate` med egen `onNeedReload` PLUS periodisk `registration.update()`**.
Ren `autoUpdate` (rad 1) avvisades därför att en tvångsomladdning kan slänga
bort Lottas inmatning mitt i ett formulär; enbart periodisk `update()` (rad 3)
avvisades därför att den bara löser detektionen och inte ger någon väg fram
till ny kod. Kombinationen ger **bunden upptäcktstid** och ett
**omladdningsbeslut som ligger hos användaren**.

**`skipWaiting()` behålls, och det är inte en kompromiss.** Mätt i
`node_modules/vite-plugin-pwa/dist/client/build/register.js`: `autoUpdate`
byter klientgren från `waiting` till **`activated`** — händelsen vår
`skipWaiting()` garanterar. De två hör alltså ihop; `autoUpdate` utan
`skipWaiting()` hade inte fungerat. `skipWaiting()` går från att vara buggens
orsak till att vara mekanismens förutsättning, och `src/sw.ts` lämnas
**orörd**.

`registerType` rör heller inte vår handskrivna SW. Fältet används på exakt tre
ställen i `node_modules/vite-plugin-pwa/dist/index.js`: rad 800 (default), rad
169 (ersätter `__SW_AUTO_UPDATE__` i klientkoden, den enda som gäller oss) och
rad 874, som sätter `workbox.skipWaiting` men bara när `injectRegister` är
`'auto'`/`null` — vi har `false`, och `workbox.*` gäller ändå bara
`generateSW`-strategin, inte vår `injectManifest`.

**Intervallet: en timme.** Förstapartsrekommendation i båda styrande källor:
web.dev *The service worker lifecycle* (*"you may want to call `update()` on
an interval (such as hourly)"*) och `vite-plugin-pwa` *Periodic SW updates*
(`const intervalMS = 60 * 60 * 1000`). Formen är förstapartens
**edge-case-variant** med tre guarder (`installing`, `navigator.onLine`,
`fetch(swUrl)` med statuskontroll). Den sista är extra viktig hos oss: vår
SPA-rewrite svarar `200 text/html` på allt som saknas, så en naken `update()`
mot ett trasigt origin är inte en no-op.

En guard mot `document.visibilityState === 'hidden'` **prövades och byggdes
inte** — ingen av förstapartskällorna nämner dolda flikar, och med ett
timintervall är webbläsarens egen bakgrundsthrottling utan praktisk betydelse.

**B2-precisering.** B2 sade att SW-registreringen *"flyttas från manuell kod i
`main.tsx` till pluginets registrerings-mekanism"*. Den ligger fortfarande i
`main.tsx`, men anropet går nu via `src/lib/app-uppdatering.ts`, som bär
optionerna. `injectRegister: false` är oförändrat: pluginet injicerar ingen
registrering, vi gör den explicit.

**Kvarstående risk, öppet bokförd.** Research § 3.4 mätte att en gammal
lazy-chunk svarar `200 text/html` (4410 B) i stället för `404`, vilket kan ge
ett MIME-fel (`Failed to fetch dynamically imported module`) om ett ruttbyte
sker efter att den nya workern tagit kontroll men innan användaren laddat om.
Detta beslut **krymper** det fönstret från obegränsat till "tills Lotta
klickar", men eliminerar det inte — priset för att låta beslutet ligga hos
användaren. Att stänga det helt kräver en annan mekanism (Vites
`vite:preloadError`, eller Vercel Skew Protection vars status är oavgjord,
research § 5 punkt 3) och är inte beslutat här.

**Tillhörande yta.** Mekanism: `src/lib/app-uppdatering.ts`. UI:
`src/components/AppShell/AppUpdateBanner.tsx`, monterad i
`src/routes/__root.tsx` (alla grenar, som `RouteAnnouncer`). Blockerande
bevis: `tests/webblasarbeteende/app-update-banner.test.ts` — klassvalet är
motiverat i testfilens huvud (noll databeteende ⇒ acceptance-klassens
hermetik-självtest hade fällt det, `TASK-131`-precedenten).

### 2026-08-13 (2) (S105) — kraschfönstret stängs mot användaren via `vite:preloadError`

Beslutet ovan är oförändrat. Denna post stänger den lucka posten ovan
bokförde öppet under **Kvarstående risk**, och avgör den options-rymd den
lämnade obeslutad (`vite:preloadError` kontra Vercel Skew Protection).
Marcus order 2026-08-13: *"Noll luckor!"*

**Vad som byggdes: `vite:preloadError`, utan `preventDefault()`.**

Vites egen händelse för en misslyckad dynamisk import. Mätt i vår
installerade Vite 8.2.0, `node_modules/vite/dist/node/chunks/node.js`
(preload-helpern som `buildImportAnalysisPlugin` injicerar runt varje dynamisk
import i bygget), verbatim:

```js
function handlePreloadError(err) {
  const e = new Event("vite:preloadError", { cancelable: true });
  e.payload = err;
  window.dispatchEvent(e);
  if (!e.defaultPrevented) throw err;
}
return promise.then((res) => {
  for (const item of res || []) {
    if (item.status !== "rejected") continue;
    handlePreloadError(item.reason);
  }
  return baseModule().catch(handlePreloadError);
});
```

**Vad den fångar:** den avvisade dynamiska importen (vilket ÄR MIME-felet i
§ 3.4) och en CSS-dep vars `<link>` fyrar `error`. **Vad den inte fångar:**
statiska importer i entry-chunken, egna `fetch()`, bilder, web workers, och
misslyckade `modulepreload`-länkar för JS-deps (helpern skapar bara en Promise
när `isCss` är sant). Den sista saknar praktisk betydelse: när dep:en saknas
avvisas `baseModule()` ändå. **Inte i dev:** helpern injiceras bara i bygget,
vilket pluginets egen källkommentar säger (`"Build only"`).

`preventDefault()` anropas INTE, och det är beslutets kärna. Vites
dokumentation ([Build Options, § Load Error
Handling](https://vite.dev/guide/build.html)) visar exemplet
`window.addEventListener('vite:preloadError', () => window.location.reload())`
och noterar att *"If you call `event.preventDefault()`, the error will not be
thrown."* Läst mot källan ovan betyder det mer än det låter: `handlePreloadError`
är `.catch()`-handlern för `baseModule()`, så ett svalt fel gör att
`__vitePreload` **resolvar med `undefined`** i stället för modulen. Anroparen
kraschar då en rad senare med ett meddelande som inte har med saken att göra.
Vites exempel är därför bara säkert i kombination med en OMEDELBAR omladdning
— exakt det posten ovan förbjöd, av hänsyn till Lottas osparade inmatning.

Felet får därför kastas vidare. Det landar i routerns `defaultErrorComponent`
(`SectionError`, `src/router.ts`), som renderar i Outlet-positionen med skalet
kvar — **ingen vit skärm** — och Sentry får rapporten via `createRoot`s
`onCaughtError`. Vad `SectionError` ensam inte kan är att förklara felet eller
läka det: dess "Försök igen" kör om samma import mot samma saknade chunk och
kan strukturellt aldrig lyckas. Den delen bär den nya bannern.

**Varför en synlig, assertiv uppmaning är rätt här.** Hos oss kan eventet bara
fyra vid en navigering Lotta själv har utlöst, aldrig spontant medan hon
skriver: `src/router.ts` sätter inte `defaultPreload`, och
`@tanstack/router-core` sätter ingen default för fältet (mätt: `dist/esm/router.js`
sätter `defaultPreloadDelay: 50` men aldrig `defaultPreload`), så varje
preload-gren i `link.js` jämför `undefined` mot `"intent"`/`"render"`/`"viewport"`
och är falsk. Ingen route hämtas på hover. Meddelandet får därför
`role="alert"` (WCAG 2.2 SC 3.3.1) medan den befintliga uppdaterings-bannern
behåller `role="status"` — samma mappning som `MessageBox` redan gör i hela
appen. Det brådskande läget ersätter det artiga; två samtidiga uppmaningar att
ladda om vore två frågor där det bara finns en.

**En mätt kurskorrigering under bygget.** Första utkastet monterade
alert-regionen ALLTID och tom, i analogi med `role="status"`. Analogin höll
inte: MDN (ARIA: alert role) är uttrycklig om att rollen annonseras *"when the
alert role is added to an element, or such an element becomes visible"*, och
den alltid monterade formen lade en andra alert-region i varje vy. Det fällde
tre orelaterade tester i `webblasarbeteende`-klassen med
`strict mode violation: getByRole('alert') resolved to 2 elements`. Regionen
monteras nu villkorat, som `MessageBox` alltid gjort, med en regressionsvakt i
testfilen.

**Vercel Skew Protection: avgjord som EJ tillgänglig utan arbete och ett
kontobeslut. Marcus äger frågan.**

Läst mot förstapartskällan ([Vercel, Skew
Protection](https://vercel.com/docs/skew-protection), hämtad 2026-08-13) håller
inte antagandet att den är en kryssruta för oss:

| Fråga | Vad källan säger | Vad det betyder för oss |
|---|---|---|
| Plan | *"available for all deployment environments for Pro and Enterprise teams"* | **Kan inte fastställas här** — ingen Vercel-åtkomst finns |
| Ramverk | Zero-config för Next.js, SvelteKit, Qwik, Astro, Nuxt | Vår `vercel.json` har `"framework": "vite"`. **Inte i listan** |
| Andra ramverk | *"Other frameworks can implement Skew Protection by checking if `VERCEL_SKEW_PROTECTION_ENABLED` has value `1` and then appending the value of `VERCEL_DEPLOYMENT_ID` to each request"* via `?dpl=`, `x-deployment-id` eller `__vdpl` | Egen implementation krävs: varje asset-URL i bygget måste bära `?dpl=`, vilket i Vite betyder `experimental.renderBuiltUrl` och en outredd interaktion med precache-manifestet |
| På som default | Projekt skapade efter 2024-11-19 **med ett stött ramverk** | Gäller inte oss |
| Kostnad | Källan anger ingen separat avgift, bara plankravet | Kostnaden är plan-nivån, inte en post per användning |
| Maxålder | Default ett dygn, konfigurerbar upp till projektets retention | En flik som stått öppen längre än så skyddas inte ändå |

Research § 5 punkt 3 noterade noll `dpl_`-spår i serverad `index.html` som en
indikation på att funktionen är av. Den indikationen är **svagare än den såg
ut**: för ett icke-stött ramverk hade spåren saknats även med funktionen
påslagen, eftersom det är ramverket som fäster deployment-ID:t.

**Vad Marcus ska avgöra (och det är inte brådskande efter denna post):** om
Vercel-planen är Pro eller Enterprise, och i så fall om det är värt att bygga
`?dpl=`-pinningen för en Vite-SPA. Vinsten vore att felet **sällan uppstår**;
denna post gör att det **aldrig blir obegripligt när det uppstår**. De två
utesluter inte varandra, men bara den ena kan byggas utan ett kontobeslut, och
den är byggd. Förutsättningen för att ens kunna svara är den Vercel-åtkomst
research § 5 redan rekommenderade före go-live.

**Är fönstret stängt?** Mot **användaren**, ja: det finns inte längre något
läge där Lotta möter en trasig sida utan förklaring och utan väg vidare. Mot
**nätverket**, nej: en chunk som inte finns kommer fortfarande inte att finnas,
och rutten hon klickade på visas först efter omladdningen. Det är den
skillnaden Skew Protection skulle stänga, och den ligger hos Marcus.

**Tillhörande yta.** Mekanism: `src/lib/chunk-laddningsfel.ts`. UI: samma
`src/components/AppShell/AppUpdateBanner.tsx` som posten ovan, nu med två
lägen. Blockerande bevis:
`tests/webblasarbeteende/app-chunk-laddningsfel.test.ts` (8 tester;
tvåsidigt bevisat: 8 fällde utan mekanismen, 8 passerade med den).
