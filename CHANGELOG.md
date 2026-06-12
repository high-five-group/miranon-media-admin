# Changelog

Alla noterbara ändringar i detta projekt dokumenteras i denna fil.

Format följer [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
och projektet följer [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-06-12

### Added — Fas 5: App-shell (Session 16)

- PWA-grund per ADR-047: `vite-plugin-pwa` med `injectManifest` — Fas 0-SW-skelettet porterat till `src/sw.ts` (Workbox precache + `NavigationRoute` + offline-fallback), `public/offline.html` (fristående, prefers-color-scheme), manifest med namn/standalone/`lang: sv` + ikoner 192/512/maskable, registrering via `virtual:pwa-register`
- App-skal på `_authenticated`-layouten: `AppShell` (header + `main#main` + botten-fäst tab bar med 4 flikar, 44 px touch-targets, `aria-current`), `SkipLink` (programmatisk fokus till `#main`), `RouteAnnouncer` (globalt i `__root`; `staticData.title`-konvention + `document.title`-synk), `OfflineIndicator` (TanStack `onlineManager`, alltid-monterad live-region)
- Placeholder-routes `/event`, `/personer`, `/mer` + DEV-guardad feltrigger `/dev-fel`
- Error boundaries i två lager: `SectionError` (MessageBox-baserad `defaultErrorComponent`; reset + invalidate) + `AppErrorBoundary` (beroende-snål klasskomponent i `main.tsx`, täcker provider-fel)
- TanStack offline-config: explicit `networkMode: 'online'` på queries + mutations (ADR-047 B5; persistQueryClient defer till Fas 6/8)
- Varaktiga DoD-tester: `tests/e2e/shell.staging.test.ts` (skal, skip-länk, announcer, sektions-fel, offline-banner, reduced-motion, responsivt, axe) + `tests/e2e/pwa-offline.staging.test.ts` (SW-precache → cachat skal offline; manifest-check) — miljö-självguardande dev/preview
- Ikon-pipeline: `pwa-assets.config.ts` (lossless-PNG — generatorns quality-60-kvantisering bortvald; maskable padding 0.45 per hörn-radie-geometri) + `scripts/generate-favicons.mjs` (rund favicon med vit platta ur `public/favicon/favicon.svg`, dependency-fri PNG-ICO)
- ADR-047 (PWA-arkitektur + DoD 4-modernisering — Lighthouse v12 tog bort PWA-kategorin) med K-sista-korrigeringsnot (Performance ärver Fynd 7-defern; Fas 5-ingångsvärde 81)
- Lessons L96–L102 i `tasks/lessons.md`

### Changed

- Fel-hanterings-arkitekturen konsoliderad (Session 16 K4, stänger Session 7-todo-tråden): `Sentry.ErrorBoundary` riven ur `__root.tsx`, `RouteErrorFallback` ersatt av `SectionError` — boundaries renderar, createRoot-hooks rapporterar (ADR-038-korrigeringsnot)
- `src/main.tsx`: manuell SW-registrering ersatt av plugin-mekanismen; devtools-knapparna till topp-positioner (tab baren äger botten-ytan)
- `docs/byggplan.md`: Fas 5 ✅ KLAR (§2 + §4 Slutförd-paragraf, versionshistorik 1.8–1.10); API-runtime-caching defer till Fas 6 (K3-beslutsspår)
- Browser-favicon: rund vit platta (`favicon.svg` cirkel + omgenererat ICO/PNG/apple-touch-set) wirad explicit i `index.html`
- `tsconfig.tests.json`: DOM-lib (page.evaluate-callbacks typecheckas i tests-projektet)

### Removed

- `public/sw.js` (Fas 0-skelettet — porterat till `src/sw.ts`), `RouteErrorFallback.tsx`, K2:s rot-`favicon.ico` + `pwa-64x64.png` + full-bleed `apple-touch-icon-180x180.png`, Fas 0-favicon-resterna `site.webmanifest` + `web-app-manifest-192/512.png`

### Fixed

- Maskable-ikonen höll sig inte inom maskens safe-cirkel (kantmått ≠ hörn-radie) — padding 0.45, uppmätt kvot 0,868 (K5c)
- PWA-ikonernas palett-kvantisering (13 distinkta färger i 192:an → 432 efter lossless-fix, K5b)
- Latenta docs-fillänkar brutna av K2-/K4-raderingar (`public/sw.js`, `RouteErrorFallback.tsx`) — exponerade av changed-files-skippade länk-jobb, lagade med code-spans + ADR-038-korrigeringsnot

## [0.5.0] - 2026-06-11

### Added — Fas 3: UI-primitiver + Fas 3.5: A11y-baseline (Sessions 14–15)

- 6 UI-primitiver i `src/components/primitives/` — Button, Input, Select, MessageBox, Modal, Dialog — på react-aria-components + CVA-varianter (size sm/md/lg, intent primary/secondary/danger/ghost) med JSDoc-usage-exempel (ADR-044)
- Demo-route `/dev/primitives` (DEV-guardad, root-monterad utanför auth-trädet) för visuell + interaktiv verifiering
- Komponent-tokens `--mm-button-*`, `--mm-input-*`, `--mm-select-*` i `components.css` + ny semantisk roll `--mm-border-field` (WCAG 1.4.11-kontrastfix)
- A11y-runner: `axe-core` + `@axe-core/playwright`, Playwright-projekt `a11y`, fixtures med 0-violations-tolerans (ADR-045), 12 tester (7 primitiv + 5 mönster), `test:a11y`-script, CI-steg i Test+Build-jobbet — gate-proof-bevisad (medvetet brytande branch → rött run exakt på a11y-steget)
- Port-härdad a11y-server: dedikerad port + `--strictPort` + `reuseExistingServer: false` (alltid-färsk; eliminerar tyst-återanvänd-främmande-server- och stale-server-klasserna)
- Referens-route `/dev/patterns` (DEV-guardad) med 5 React Aria-mönster: Overlay, Listbox, Disclosure, MenuTrigger, ComboBox
- `docs/aria-patterns/` — 5 mönster-filer med kodexempel + test-mall + a11y-acceptance-criteria (Fas 6-konsumtionsunderlag)
- ADR-044 (react-aria-components som primitiv-bas + demo-route), ADR-045 (a11y-runner-arkitektur), ADR-046 (felmeddelande-wiring via describedby)
- Lessons L88–L94 (`[UNIVERSAL]`) i `tasks/lessons.md`

### Changed

- `--mm-text-muted`: `--p-neutral-400` → `--p-neutral-500` — Select-placeholdern mätte 3,49:1 mot WCAG 1.4.3-kravet 4,5:1 (axe-fynd, semantisk rotorsaks-fix som även botar den axe-osynliga Input-placeholdern)
- Explicit `aria-errormessage`-wiring riven ur Input/Select — React Arias FieldError/`aria-describedby` är enda felmeddelande-associationen (ADR-046; ARIA-UPGRADE §1-erratum)
- `cn.ts`: `extendTailwindMerge` registrerar custom font-size-skalan — tailwind-merge åt annars färgklasser tyst (L88)
- `docs/byggplan.md` §4: Fas 3-scope i components-termer per ADR-044 + Fas 3.5-mönsterlistan dito; §2 fas-tabell Fas 3 + 3.5 ✅ KLARA, estimat-summa 13,5 → 10,5 sessioner (versionshistorik 1.5–1.7)
- `ACCESSIBILITY-CHECKLIST.md` §5: 0 violations kanonisk fail-regel (ADR-045) + ci.yml-referens + additiv-not; §5/§6 stämplade "✅ levererad i Fas 3.5"
- Biome `$schema` 2.4.11 → 2.4.15 (lockfile-re-resolve + `biome migrate`)

### Fixed

- ComboBox-pattern-specen öppnar förslagslistan med riktiga tangenttryck (`pressSequentially`) — `fill()`-events öppnade inte React Arias listbox i CI (L93)
- Kanonisk ADR-räkning i rot-README höll inte jämna steg med katalogen (ADR-039-grinden fångade; L91)

## [0.4.0] - 2026-06-10

### Added — Fas 2.5: Schema-kontrakt-sync (Session 13)

- `RegistrationStatus` utökad 4 → 6 värden (`Flytta till väntelista`, `Inställt`) verbatim mot `docs/reference/data-model.md`, MCP-verifierade mot live-basen
- Ny `EventStatus`-enum (4 värden, Eventplanering.Status) + `Event`-modell/schema smalnade
- A1–A12 Synk-gate 1-inventering (`docs/research/datamodell-research/09-a1-a12-synk-gate-1-inventering.md`) — MCP-verifierad mot live-basen, gate stängd med Marcus-kvittens + schema-frys under fas-fönstret
- Adapter-debt-klassning: alla 9 TODO-stubs JSDoc-klassade per A5-tabellen (`@deferTo` + konsekvent `Not deployed yet`-throw; ADR-014/ADR-015 refererade)
- Lessons L83–L87 (`[UNIVERSAL]`) i `tasks/lessons.md`

### Changed

- Zod-scheman: status-/select-fält i `Registration`/`Attendance`/`Event` → `z.enum` härledda ur Status.ts-konstanterna (single source) — live-läsvägarnas `.parse()` (ADR-026) validerar nu värden, inte bara shape; modeller smalnade i parallell (ADR-005-assignability)
- Spekulativa EF-anrop borttagna ur throw-klassade stub-kroppar (skisser kvar i git-historik)
- `docs/byggplan.md` §2/§4: Fas 2.5 ✅ KLAR, estimat-summa 14,5 → 13,5 sessioner (versionshistorik 1.3 + 1.4)

### Fixed

- `docs/byggplan.md` Fas B-synk-gates återställda till beslutat A4-innehåll — "Gate B1 (innan Fas 6c)"/"Gate B2 (innan Fas E)" var transkriptions-drift utan beslutsspår (Session 13-forensik); Synk-gate 1 (hard, före Fas 2.5) + Synk-gate 2 (handshake per Fas 5.5/6-operation) + ny Beroenden-rad i §4.5
- Schema-path-typo i byggplan §4.5: `src/data/schemas/*.ts` → `src/domain/schemas/*.ts`

## [0.3.0] - 2026-05-13

### Added — Fas 2: Routing + Auth (Sessions 4+5+5b)

- Defense-in-depth tre-skikt-arkitektur: klient-side guard (TanStack Router `_authenticated` beforeLoad), AuthError throw-contract, server-side `requireUser` (oförändrad, Fas A M2)
- TanStack Router file-based routing med pathless `_authenticated`-layout
- AuthProvider med Supabase-integration (InnerApp-pattern)
- nuqs URL-state-setup + dev-only test-route
- Playwright `authenticatedPage`-fixture + 6-tests arkitektur-regression-suite (K4.3)
- `src/auth/AuthError.ts` — typed error class
- audit-ci-disciplin (allowlist för GHSA-rmmr-r34h-pfm5)
- ADR-026 — Runtime-validering vid datagräns med Zod `.parse()`
- ADR-027 — KVALITETSDEFINITIONER stack-skifte (Vue → React)
- ADR-028 — Supply chain incident-respons-protokoll

### Changed

- `src/data/config/supabase-client.ts` — `getAuthHeader()` throws AuthError istället för anon-key-fallback (Fas A §A3-fynd stängt)
- 18 nya UNIVERSAL-lessons (K17-K38) i `tasks/lessons.md`
- 7 hub-lyft till `~/Repon/marcus-system/tasks/lessons.md`

### Security

- Supply chain malware-respons (GHSA-rmmr-r34h-pfm5): pin exakt `@tanstack/react-router` + `@tanstack/router-plugin`, `overrides` för `@tanstack/history`. Integrity-MATCH pre/post-install.
- Anon-key-fallback i klient borttagen (defense-in-depth skikt 2).

### Fixed

- InnerApp useEffect race-condition (K3.5) — `[isAuthenticated, isLoading]` deps för korrekt guard re-eval.

## [0.2.0] - 2026-05-06

### Added — Pre-Fas-2 (Session 3)

- Pre-Fas-2 publik professionalisering: LICENSE, package.json metadata, .editorconfig, .nvmrc, .vscode/extensions.json, `.github/`-paketet (CI + Dependabot + CODEOWNERS + templates), CHANGELOG, SECURITY, CONTRIBUTING (ADR-024)
- docs/-omstrukturering: docs/specs/, docs/analysis/, docs/reference/, docs/logs/ (ADR-021)
- analys/ flyttad till docs/research/datamodell-research/ (ADR-022)
- tasks/sessions/-arkivering till archive/2026-04/, archive/2026-05/, archive/datamodell-research-2026-04-30/ (ADR-023)

### Changed

- BYGGPLAN-LÄTTLÄST v2 → v3 efter byggplan-revisionen (ADR-025). v2 arkiverad till docs/archive/. Speglar docs/byggplan.md v1.1 (13 fas-prompter inkl. nya Fas A/2.5/3.5/5.5/6a-e/8/B/E).

## [0.1.0] - 2026-05-05

### Added

- `docs/byggplan.md` v1.1 (832 rader, 13 fas-prompter) som styrande plan för Fas 2+ (P3a)
- 10 ADR:er ADR-011..ADR-020 (P3a)
- `docs/BUILD-LOG.md` retrospektivt komplett — Fas A M1–M8 + P0/P1/P2/P3a/P3b (P3b)
- 7 UNIVERSAL-poster lyfta till `marcus-system/tasks/lessons.md` (P3b)
- Fas A — security hardening: klient-DSN, två-stegs auth-check, test-prefix-konvention, operations-baserad API, INVARIANT-mönster, structured JSON-loggning, M1–M8 (14 commits)
- Fas 1 — domäntransplant från Vue-referensen (10 domain-filer + 4 data-filer + utilities)
- Fas 0 — projektinitiering: Vite + React 19 + TanStack Router/Query/Table + Tailwind v4 + Biome 2.0 + Supabase
- 10 ADR:er ADR-001..ADR-010 (Fas 0+1)
- 113 tester (72 körda lokalt + 41 staging-only-skipped)
- Lighthouse-baseline: 86 / 100 / 96 / 82 (production)

### Changed

- `conversion-plan.md` ersatt av `byggplan.md` (ADR-012)

### Archived

- `docs/conversion-plan.md` → `docs/archive/conversion-plan-2026-04-14.md` (ADR-012)

[Unreleased]: https://github.com/marcus803/miranon-media-admin/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/marcus803/miranon-media-admin/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/marcus803/miranon-media-admin/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/marcus803/miranon-media-admin/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/marcus803/miranon-media-admin/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/marcus803/miranon-media-admin/releases/tag/v0.1.0
