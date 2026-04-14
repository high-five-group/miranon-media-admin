# Miranon Media Admin

Admin-app för **Miranon Media** (Roger & Lotta) — hanterar event, anmälningar, betalningar, personer, leads, närvaro och mail.

React-konvertering av Vue-projektet i [`~/Repon/miranon-media-os/`](../miranon-media-os/) som fortsätter vara referens under konverteringen.

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

## Dokumentation

| Fil | Syfte |
|-----|-------|
| [`CLAUDE.md`](CLAUDE.md) | Projektkonstitution — regler, stack, arbetsflöde, filstruktur |
| [`docs/conversion-plan.md`](docs/conversion-plan.md) | Konverteringsplan Vue → React (enda sanningskällan för faser) |
| [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) | Implementation journal — plan vs. verklighet per fas |
| [`docs/decisions/`](docs/decisions/) | Architecture Decision Records (ADR) — ett beslut per fil |
| [`tasks/todo.md`](tasks/todo.md) | Aktiva uppgifter |
| [`tasks/lessons.md`](tasks/lessons.md) | Organisatoriskt minne — lärdomar från alla sessioner |

## Designsystem

FK-inspirerat 3-lagers token-system:

1. **Primitiv** (`src/styles/tokens/primitives.css`) — råa värden: `--p-gold-500: #D4960A`, `--p-neutral-900: #242424`, etc.
2. **Semantisk** (`src/styles/tokens/semantic.css`) — roller: `--mm-primary`, `--mm-text`, `--mm-focus-ring`.
3. **Komponent** (`src/styles/tokens/components.css`) — komponentspecifikt, fylls på vid Fas 3+.

Fullständig spec: [`docs/DESIGN-SYSTEM-SPEC.md`](docs/DESIGN-SYSTEM-SPEC.md). Token-arkitektur motiverad i [`docs/decisions/ADR-002-tailwind-v4-theme-css-first.md`](docs/decisions/ADR-002-tailwind-v4-theme-css-first.md) och [`ADR-003`](docs/decisions/ADR-003-css-custom-property-naming.md).

## Projektstatus

Fas 0 + Fas 1 klara (Session 1 (React), 2026-04-14). Se [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) för fullständig fashistorik och [`tasks/todo.md`](tasks/todo.md) för aktuellt fokus.

## Vision

1. **Miranon Media Admin** — produkten Lotta använder dagligen
2. **Mm Component Library** — komponentbibliotek för framtida produkter (Passionslyftet, Maxat Event, kommande SaaS)

Kvalitetsribba: **11/11/11** för bibliotek (tillgänglighet/teknik/återanvändbarhet), **11/10/10** för vyer. Tillgänglighet är alltid 11 — inga undantag.
