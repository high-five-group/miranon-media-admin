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

> **Status:** Pre-Fas-2 (verifiering klar 2026-05-06). Fas 2 — Routing + Auth — startar mot [`docs/byggplan.md`](docs/byggplan.md) §4 Fas 2-prompt.

## Dokumentation

### Styrande dokument (läs först)

- [`CLAUDE.md`](CLAUDE.md) — projekt-konstitution
- [`docs/byggplan.md`](docs/byggplan.md) — styrande fas-plan (Fas 2 → Fas 8)
- [`docs/decisions/README.md`](docs/decisions/README.md) — ADR-katalog (24 arkitekturbeslut)
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
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `biome check .` |
| `npm run format` | `biome format --write .` |
| `npm run test:visual` | Playwright visuella regressionstester |

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

Fas 0 + Fas 1 klara (Session 1 (React), 2026-04-14). Se [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) för fullständig fashistorik och [`tasks/todo.md`](tasks/todo.md) för aktuellt fokus.

## Vision

1. **Miranon Media Admin** — produkten Lotta använder dagligen
2. **Mm Component Library** — komponentbibliotek för framtida produkter (Passionslyftet, Maxat Event, kommande SaaS)

Kvalitetsribba: **11/11/11** för bibliotek (tillgänglighet/teknik/återanvändbarhet), **11/10/10** för vyer. Tillgänglighet är alltid 11 — inga undantag.
