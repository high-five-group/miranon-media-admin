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
