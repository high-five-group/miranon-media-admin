# miranon-media-admin

React-admin för Miranon Media — eventhantering, anmälningar och rapportering ovanpå Airtable + Supabase.

[![CI](https://github.com/marcus803/miranon-media-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/marcus803/miranon-media-admin/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](.nvmrc)
[![Biome](https://img.shields.io/badge/lint-Biome%202.4-60a5fa)](biome.json)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](vite.config.ts)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![TanStack](https://img.shields.io/badge/TanStack-Router%20%2B%20Query%20%2B%20Table-FF4154)](package.json)

> **Status:** Fas 5 — App-shell ✅ KLAR 2026-06-12 (Session 16). PWA-grund via `vite-plugin-pwa` injectManifest (ADR-047): offline-fallback, manifest + ikoner, installerbar. App-skal med tab bar, skip-länk och route announcer på `_authenticated`-layouten; error boundaries i två lager; TanStack offline-config. Varaktiga DoD-tester (shell + pwa-offline). **Nästa:** Fas 5.5 — Vertikal write-slice (per [`docs/byggplan.md`](docs/byggplan.md) §4).

## Dokumentation

### Styrande dokument (läs först)

- [`CLAUDE.md`](CLAUDE.md) — projekt-konstitution
- [`docs/byggplan.md`](docs/byggplan.md) — styrande fas-plan (Fas 2 → Fas 8)
- [`docs/decisions/README.md`](docs/decisions/README.md) — ADR-katalog (samtliga arkitekturbeslut + statusindex)
- [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) — kronologisk sessions-journal

### Specs och referens

- [`docs/specs/`](docs/specs/) — säkerhet, design, prestanda, accessibility, state, URL, ARIA, kvalitet, framtidskompabilitet
- [`docs/reference/`](docs/reference/) — datamodell, hur-systemet-funkar
- [`docs/research/`](docs/research/) — Fas 0-research + datamodell-research-pipeline

### Process

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — sessions-disciplin, aktör-rollfördelning, DoD
- [`SECURITY.md`](SECURITY.md) — säkerhetspolicy
- [`CHANGELOG.md`](CHANGELOG.md) — versionshistorik

### Arkiv & historik

- [`docs/archive/`](docs/archive/) — superceded artefakter + historiska arbetsmaterial (gap-analysis, byggplan-revision-inventory)
- [`tasks/sessions/`](tasks/sessions/) — sessions-trail (aktiv + arkiv)

---

## Snabbstart

```bash
npm install
cp .env.local.example .env.local   # lägg in Supabase URL + anon key
npm run dev                        # Vite dev-server på http://localhost:5173
```

## Scripts

| Kommando | Beskrivning |
|---|---|
| `npm run dev` | Vite dev-server med HMR |
| `npm run build` | Produktionsbygge (`tsc -b && vite build`) |
| `npm run preview` | Preview av produktionsbygge |
| `npm run typecheck` | `tsr generate && tsc -b --noEmit` |
| `npm run lint` | `biome check .` |
| `npm run lint:prose` | Vale prosa-lint (`docs` + `tasks` + publika root-md-filer) |
| `npm run format` | `biome format --write .` |
| `npm run test:visual` | Playwright visuella regressionstester |
| `npm run typecheck:tests` | TypeScript-validering av tests/-mappen (separat config) |
| `npm run test:api` | API-tester (alla — pure + staging) |
| `npm run test:api:pure` | Pure unit-tester (ingen staging-env krävs) |
| `npm run test:api:staging` | Staging-integration-tester (kräver TEST_*-secrets) |
| `npm run test:e2e:staging` | Playwright e2e mot staging (auth-fixture) |
| `npm run test:a11y` | Axe-runner mot `/dev/primitives` + `/dev/patterns` (alltid-färsk dev-server, ADR-045) |

## Stack

| Lager | Teknologi |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Routing | TanStack Router (file-based) |
| Data | TanStack Query + Table |
| Headless UI | React Aria (react-aria-components) |
| Styling | Tailwind v4 CSS-first `@theme` + 3-lagers CSS-tokens |
| Animationer | Motion (Framer Motion) |
| Lint/format | Biome 2.4 (ersätter ESLint + Stylelint + Prettier) |
| Validering | Zod |
| Env | @t3-oss/env-core |
| Auth | Supabase Auth |
| API-proxy | Supabase Edge Functions (Deno) |
| Observability | web-vitals + Sentry |
| Offline | Workbox (service worker) |
| Test | Playwright |

## Projektstatus

**Aktuellt fokus:** Fas 5.5 — Vertikal write-slice: "markera anmälan som betald" (per `docs/byggplan.md` §4).

**Klara faser:**

- ✅ **Fas 0** — Projektsetup + tokens (Session 1, 2026-04-14)
- ✅ **Fas 1** — Domäntransplant (Session 1, 2026-04-14)
- ✅ **Fas A** — Säkerhetshardening M1-M8 (Session 2, 2026-05-04)
- ✅ **Pre-Fas-2** — Repo-strukturell polish + publika professionalitetssignaler (Session 3, 2026-05-06)
- ✅ **Fas 2** — Routing + Auth (Sessions 4+5+5b, 2026-05-11 → 2026-05-13)
  - Defense-in-depth tre-skikt-arkitektur (klient-guard + AuthError + server requireUser)
  - 8 DoD-rader stängda och empiriskt verifierade via 6-tests Playwright-regression-suite
  - 3 nya ADR:er (ADR-026, ADR-027, ADR-028)
- ✅ **Fas 2.5** — Schema-kontrakt-sync (Session 13, 2026-06-10)
  - Status.ts 4→6 RegistrationStatus-värden + EventStatus-enum, verbatim mot `data-model.md` och MCP-verifierade mot live-basen
  - z.enum-värdevalidering ur Status.ts-konstanterna på live-läsvägarna (ADR-026-mönstret), modeller smalnade i parallell (ADR-005)
  - 9 adapter-metoder debt-klassade per A5-tabellen (`@deferTo`-JSDoc + throw); 0 EF deployade by design
  - Synk-gate 1 stängd före fasstart — A1–A12-inventering MCP-verifierad mot live
- ✅ **Fas 3** — UI-primitiver (Sessions 14–15, 2026-06-11)
  - 6 primitiver (Button, Input, Select, MessageBox, Modal, Dialog) på react-aria-components + CVA-varianter (ADR-044), demo-route `/dev/primitives`
  - Felmeddelande-wiring via React Arias FieldError/`aria-describedby` (ADR-046, trippel-evidens: DOM-forensik + förstapartskälla + skärmläsarpass)
  - 11/11/11-stämplade mot Fas 3.5-infran: axe 0 violations, tangentbords- + skärmläsarpass
- ✅ **Fas 3.5** — A11y-baseline (Session 15, 2026-06-11)
  - Axe-runner (axe-core + @axe-core/playwright) med 0-violations-tolerans (ADR-045), 12 tester, port-härdad alltid-färsk dev-server
  - CI-grinden gate-proof-bevisad (medvetet brytande branch → rött run på a11y-steget)
  - 5 React Aria-mönster: referens-implementationer på `/dev/patterns` + test-mallar + `docs/aria-patterns/`
  - "A11y-baseline godkänd"-gate dokumenterad i BUILD-LOG före Fas 6
- ✅ **Fas 5** — App-shell (Session 16, 2026-06-12)
  - PWA-grund: `vite-plugin-pwa` injectManifest porterar Fas 0-SW-skelettet till Workbox (ADR-047) — precache, offline.html-fallback, manifest + ikoner (lossless-genererade via `pwa-assets.config.ts`), installerbar (Marcus DevTools-kvitterad)
  - App-skal på `_authenticated`: tab bar (4 flikar, 44px targets), skip-länk, route announcer (VoiceOver-kvitterad), offline-indikator; rund favicon ur `public/favicon/favicon.svg`
  - Error boundaries konsoliderade till två lager: `SectionError` (defaultErrorComponent) + `AppErrorBoundary` (main.tsx)
  - Varaktiga DoD-tester: `tests/e2e/shell.staging.test.ts` + `tests/e2e/pwa-offline.staging.test.ts` (miljö-självguardande dev/preview)

**Arkitekturbeslut:** 55 arkitekturbeslut (ADR:er) totalt i `docs/decisions/` — levande räkning som CI-grindas vid varje push (se [ADR-039](docs/decisions/ADR-039-konsistens-grindar-kadens.md) + [`scripts/check-adr-count.sh`](scripts/check-adr-count.sh)).

**Statistik (post-Fas 2, historisk ögonblicksbild):**

- ~18 nya UNIVERSAL-lessons i Sessions 4+5+5b (K17-K38)
- CI grön första försöket genomgående (Kandidat 31 pre-commit-disciplin från K3.2)

Se [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) för fullständig fashistorik och retrospektiv. Sessions-trail i [`tasks/sessions/`](tasks/sessions/).

## Vision

1. **Miranon Media Admin** — produkten Lotta använder dagligen
2. **Mm Component Library** — komponentbibliotek för framtida produkter (Passionslyftet, Maxat Event, kommande SaaS)

Kvalitetsribba: **11/11/11** för bibliotek (tillgänglighet/teknik/återanvändbarhet), **11/10/10** för vyer. Tillgänglighet är alltid 11 — inga undantag.
