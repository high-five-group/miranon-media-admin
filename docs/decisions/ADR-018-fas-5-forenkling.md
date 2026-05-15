# ADR-018: Fas 5 selektivt förenklad — fyra `[GA]`-tillägg flyttade till Fas 7

- **Status:** Accepted
- **Datum:** 2026-05-05 (skrivs i P3a, implementeras vid Fas 5-start)
- **Fas:** 5 (App-shell)

## Kontext

Conversion-plan §D Fas 5 listade en omfattande app-shell-leverans: header, tab bar, route announcer, error boundaries, Workbox SW, plus `[GA]`-tillägg för View Transitions, Speculation Rules, web-vitals, widget-error-boundary, och Workbox-utbyggnad. Estimat: 1-2 sessioner.

Per B3-beslutet (P1-sessionsdok Del 5): Fas 5 förenklas selektivt. Skälen:

1. **Fas A:s arkitekturmönster (operations-baserat API, Auth, INVARIANT, requestId) konsumerar mer av Fas 5:s scope-budget än conversion-plan kunde förutse.** Fas 5 ska etablera klient-side-mönster som matchar server-side-mönster — `[GA]`-tillägg som inte är beroende av detta är distraktion.

2. **`[GA]`-tilläggens primära värde realiseras post-deploy (Fas 7).** View Transitions kräver flera routes etablerade för att vara meningsfullt. web-vitals kräver production-mätning. Speculation Rules kräver multi-route-prefetching. Widget-error-boundary kräver widgets — Fas 5 har endast app + sektion.

3. **Estimat-press.** Konsoliderat 1-2 sessioner i Fas 5 + 4 [GA]-tillägg = överskattat budget. Förenkling till 1 session är realistiskt, [GA]-tillägg samlas i Fas 7 där deploy-pipeline ger dem rätt kontext.

P1-sessionsdok Del 5 listade fyra `[GA]`-tillägg som flyttas:

- View Transitions API
- Speculation Rules
- web-vitals-mätning
- Widget-error-boundary

Och fyra som *behålls* i Fas 5:

- Error boundaries (app-nivå + sektion-nivå)
- Workbox SW (cache-first/network-first/offline.html)
- TanStack offline-config
- `prefers-reduced-motion` + `prefers-contrast: more`

## Beslut

Fas 5 levererar **förenklad app-shell**:

### Behålls i Fas 5

- App-shell layout: minimal header + content-area (max-width 600px) + bottom tab bar
- Tab bar: 4 flikar, fixed bottom, ARIA-tabs-pattern
- Skip-to-content-länk + route announcer (skärmläsare-stöd)
- Responsivt: 375 / 768 / 1024 px breakpoints
- `prefers-reduced-motion` + `prefers-contrast: more` respekt
- Error boundaries: app-nivå + sektion-nivå (per route)
- Workbox SW: cache-first för statiska assets, network-first för API, offline.html-fallback
- TanStack Query offline-config (`networkMode: 'offlineFirst'` för läs, `'online'` för skriv)

### Flyttas till Fas 7

- View Transitions API
- Speculation Rules
- web-vitals-mätning (CLS, LCP, FID, INP, TTFB)
- Widget-error-boundary (mer granulär än sektion-nivå)

### Estimat

1 session (förenklat från 1-2 i conversion-plan).

## Alternativ som övervägdes

**Alt 1 — Behåll alla 8 `[GA]`-tillägg i Fas 5.** Avvisat: scope överskrider 1-session-budget. Fas 5 hade riskerat att bli 2-3 sessioner med risk för bristande kvalitet på allt.

**Alt 2 — Flytta alla 8 `[GA]`-tillägg till Fas 7.** Avvisat: Workbox SW + TanStack offline-config + error boundaries är *foundation* för Fas 6+. Utan SW + offline-config är offline-stöd brutet i Fas 6:s vyer. Utan error boundaries kraschar appen vid första 5xx-svar.

**Alt 3 — Flytta endast View Transitions + Speculation Rules (de "snyggaste" GA-tilläggen).** Avvisat: web-vitals och widget-error-boundary kräver också deploy-kontext. Att flytta hälften är inkonsekvent.

**Alt 4 — Bygga Fas 5 som "minimal MVP" med bara header + tab bar + skip-link.** Avvisat: utan offline-foundation och error-strategi är Fas 6-vyerna sårbara. Förenkling utan att tappa robusthet är rätt nivå.

## Konsekvenser

**Positiva:**

- Fas 5 levererar fokuserat (1 session) med kvalitet på behållet scope.
- Foundation för Fas 6+ är komplett (offline + error + a11y) — ingen vy i Fas 6 byggs ovanpå halv app-shell.
- Fas 7 har rätt kontext för flyttade `[GA]`-tillägg (production-mätning, multi-route-prefetching, widget-granularitet).
- Tydlig spårbarhet: byggplan.md Fas 5 listar "Inte scope (flyttat till Fas 7 per B3)" + denna ADR refereras.

**Negativa:**

- Fas 5 ger ingen visuell wow-effekt vid leverans (View Transitions är polish-feature). Lotta märker ingen skillnad mellan förenklat och fullt — det är OK, hen optimerar för operativ flöde.
- Fas 7-scope växer med 4 [GA]-tillägg. Mitigation: Fas 7-estimat är redan 3 sessioner, scope-tillägget är 0,5-1 session som ryms.
- Risk att Fas 7 glömmer att leverera flyttade `[GA]`. Mitigation: byggplan.md Fas 7 listar dem explicit som scope-bullets med ADR-referens.

**Verifiering (Fas 5 DoD):**

- 10 DoD-punkter avbockade per byggplan.md Fas 5 (PWA-score ≥ 90, skip-to-content, route announcer, offline-läge, sektions-error, app-error, prefers-reduced-motion, responsiv, axe 0 violations)
- `grep -r 'view-transition' src/` ger 0 träffar (View Transitions inte implementerat)
- `grep -r 'web-vitals' src/main.tsx` ger 0 träffar (mätning inte aktiv)
- ADR-pekare i `src/main.tsx`-kommentar: `// View Transitions, Speculation Rules, web-vitals: deferred to Fas 7 per ADR-018`
