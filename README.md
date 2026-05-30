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

> **Status:** Fas 2 — Routing + Auth ✅ KLAR 2026-05-13 (Sessions 4+5+5b). Defense-in-depth tre-skikt-arkitektur levererad. **Nästa:** Fas 2.5 — Schema-kontrakt-sync (per [`docs/byggplan.md`](docs/byggplan.md) §4).

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

### Logs

- [`docs/logs/`](docs/logs/) — historiska arbetsmaterial (gap-analysis, byggplan-revision-inventory)
- [`docs/archive/`](docs/archive/) — superceded artefakter
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
| `npm run format` | `biome format --write .` |
| `npm run test:visual` | Playwright visuella regressionstester |
| `npm run typecheck:tests` | TypeScript-validering av tests/-mappen (separat config) |
| `npm run test:api` | API-tester (alla — pure + staging) |
| `npm run test:api:pure` | Pure unit-tester (ingen staging-env krävs) |
| `npm run test:api:staging` | Staging-integration-tester (kräver TEST_*-secrets) |
| `npm run test:e2e:staging` | Playwright e2e mot staging (auth-fixture) |

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

**Aktuellt fokus:** Fas 2.5 — Schema-kontrakt-sync (per `docs/byggplan.md` §4).

**Klara faser:**

- ✅ **Fas 0** — Projektsetup + tokens (Session 1, 2026-04-14)
- ✅ **Fas 1** — Domäntransplant (Session 1, 2026-04-14)
- ✅ **Fas A** — Säkerhetshardening M1-M8 (Session 2, 2026-05-04)
- ✅ **Pre-Fas-2** — Repo-strukturell polish + publika professionalitetssignaler (Session 3, 2026-05-06)
- ✅ **Fas 2** — Routing + Auth (Sessions 4+5+5b, 2026-05-11 → 2026-05-13)
  - Defense-in-depth tre-skikt-arkitektur (klient-guard + AuthError + server requireUser)
  - 8 DoD-rader stängda och empiriskt verifierade via 6-tests Playwright-regression-suite
  - 3 nya ADR:er (ADR-026, ADR-027, ADR-028)

**Arkitekturbeslut:** 42 arkitekturbeslut (ADR:er) totalt i `docs/decisions/` — levande räkning som CI-grindas vid varje push (se [ADR-039](docs/decisions/ADR-039-konsistens-grindar-kadens.md) + [`scripts/check-adr-count.sh`](scripts/check-adr-count.sh)).

**Statistik (post-Fas 2, historisk ögonblicksbild):**

- ~18 nya UNIVERSAL-lessons i Sessions 4+5+5b (K17-K38)
- CI grön första försöket genomgående (Kandidat 31 pre-commit-disciplin från K3.2)

Se [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) för fullständig fashistorik och retrospektiv. Sessions-trail i [`tasks/sessions/`](tasks/sessions/).

## Vision

1. **Miranon Media Admin** — produkten Lotta använder dagligen
2. **Mm Component Library** — komponentbibliotek för framtida produkter (Passionslyftet, Maxat Event, kommande SaaS)

Kvalitetsribba: **11/11/11** för bibliotek (tillgänglighet/teknik/återanvändbarhet), **11/10/10** för vyer. Tillgänglighet är alltid 11 — inga undantag.
