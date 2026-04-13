# CLAUDE.md — Miranon Media Admin (React)
*Senast uppdaterad: 2026-04-13 | v0.1 — projektsetup, Fas 0*

---

## Vad är detta projekt?

Admin-app för **Miranon Media** (Roger & Lotta). Hanterar event, anmälningar, betalningar, personer, leads, närvaro och mail.

Detta är en **React-konvertering** av det Vue-byggda systemet i `~/Repon/miranon-media-os/`. Vue-projektet ligger kvar som referens under hela konverteringen — alla 4 komponenter på 11/11/11, 12 composables och hela arkitekturen porteras steg för steg enligt en styrande plan.

**Styrande dokument för konverteringen:** `~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md`

Hela `docs/react-migration/`-mappen i Vue-repot är sanningskälla:
- `conversion-plan.md` — fas-för-fas-plan, verifieringar, prompts
- `DESIGN-MANIFESTO.md`, `DESIGN-OPERATING-SYSTEM.md`, `DESIGN-SYSTEM-SPEC.md` — design
- `SECURITY-SPEC.md`, `PERFORMANCE-BUDGET.md`, `STATE-STRATEGY.md`, `URL-STATE-SPEC.md`, `ARIA-UPGRADE.md`, `FUTURE-COMPAT.md`, `SPA-ARCHITECTURE-DECISION.md` — [GA] gap-analys-spec
- `FILE-INVENTORY.md` — vilka filer som ska kopieras från Vue-repot
- `gap-analysis.md`, `react-stack-research.md`, `vue-project-analysis.md` — research

---

## Instruktioner — Alltid gäller

- Alla svar på svenska
- Efterfråga ALLTID faktiska kodvärden via grep/bash innan ändringar — gissa aldrig
- Ställ ALDRIG en fråga vars svar redan finns i konversationen eller dokumenten
- Föreslå alltid den proffsigaste vägen — det rätta verktyget för problemet, inte det enklaste
- Kör ALLTID `git pull` innan du gör ändringar i repot
- Kör ALLTID `ls` på arbetsmappen innan du söker med glob/grep — titta först, sök sedan
- Claude Code-prompts ska ALLTID ange fullständig sökväg
- **Styrande dokument för konverteringen:** `~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md`. Läs den innan varje fas. Avvik aldrig utan att uppdatera planen först.
- Research före implementation: kolla React Aria, TanStack, Radix, FK Designsystemet INNAN du designar en lösning. Branschledarnas mönster är golvet.
- Testa nytt bibliotek/approach med minimalt test (1 komponent, 1 hook) innan full implementation
- LÄS → RAPPORTERA → PLANERA → IMPLEMENTERA → VERIFIERA. Aldrig hoppa direkt till implementation.
- Verifiera per komponent: 11/11/11 (bibliotek) eller 11/10/10 (vyer). Bevisa att det fungerar — "det funkar" ≠ "det är rätt".
- Fånga lärdomar i `tasks/lessons.md` efter varje korrigering. Markera universella med `[UNIVERSAL]`.

---

## Stack

| Lager | Teknologi |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Routing | TanStack Router (file-based) |
| Data | TanStack Query |
| Tabeller | TanStack Table |
| Headless UI | React Aria (react-aria-components) |
| Styling | Tailwind v4 + 3-lagers CSS-tokens (primitiv → semantisk → komponent) |
| Animationer | Motion (Framer Motion) |
| Lint/format | Biome 2.0 (ersätter ESLint + Stylelint) |
| Auth | Supabase Auth |
| API-proxy | Supabase Edge Functions (Airtable-nyckel serverside) |
| Datakälla | Airtable (bas `app8uGPrVCVOm6LfD`) via DataSource-adapter |
| URL-state | nuqs |
| Validering | Zod |
| Env | @t3-oss/env-core |
| Observability | web-vitals + Sentry |
| Offline | Workbox (service worker) |
| Test | Playwright |

---

## Viktiga filer och sökvägar

```
~/Repon/miranon-media-admin/        ← detta repo (React)
├── CLAUDE.md
├── tasks/
│   ├── todo.md
│   └── lessons.md
└── (allt under src/ skapas i Fas 0)

~/Repon/miranon-media-os/           ← Vue-referensen
└── docs/react-migration/           ← STYRANDE DOKUMENT
    ├── conversion-plan.md          ← läs innan varje fas
    ├── FILE-INVENTORY.md           ← kopieringslistan
    ├── DESIGN-SYSTEM-SPEC.md       ← 3-lagers tokens
    ├── DESIGN-OPERATING-SYSTEM.md
    ├── DESIGN-MANIFESTO.md
    └── (7 [GA] spec-dokument)
```

---

## Design-system

**FK-inspirerat 3-lagers token-system** (DESIGN-SYSTEM-SPEC.md §1):

1. **Primitiv** (`src/styles/tokens/primitives.css`) — råa värden: `--mm-amber-500: #FFBA05`, `--mm-blue-900: #1B4965`, etc.
2. **Semantisk** (`src/styles/tokens/semantic.css`) — roller: `--mm-color-primary`, `--mm-color-focus-ring`, `--mm-color-text-default`.
3. **Komponent** (`src/styles/tokens/components.css`) — komponentspecifikt: `--mm-button-primary-bg`, `--mm-dialog-overlay-bg`.

**Regler:**
- Inga hårdkodade färger i komponenter — allt via CSS custom properties
- Inga komponentspecifika tokens utanför components.css
- Foundation: `~/Repon/marcus-system/design-system/DESIGN-FOUNDATION-v1.md` (4px spacing-bas, Inter, FK-inspirerat)
- Varje komponent ska klara prefers-contrast: more, prefers-reduced-motion, print

Fullständig spec: `~/Repon/miranon-media-os/docs/react-migration/DESIGN-SYSTEM-SPEC.md`

---

## Arbetsflöde

**Verktyg:**
| Verktyg | Används för |
|---|---|
| Claude Chat (projekt) | Planering, arkitektur, prompts, FK-research |
| Claude Code (terminal) | Kodning, git, filhantering, verifiering |
| Vite dev-server | Lokal utveckling med hot reload |
| Playwright | Visuell QA, screenshots, accessibility-tester |
| Airtable MCP | Verifiera fält, records, relationer live |

**Metod:** Marcus och Claude planerar i Chat → Claude Code bygger fas för fas → Marcus verifierar i browsern → feedback → nästa steg.

**Fasordning (enligt conversion-plan §D):**
1. Fas 0 — Projektsetup + tokens ← **NU**
2. Fas 1 — Domäntransplant (13 filer + Zod + fetchWithRetry)
3. Fas 2 — Routing + Auth (TanStack Router, Supabase, nuqs)
4. Fas 3 — UI-primitiver (React Aria + CVA + ARIA 1.3)
5. Fas 5 — App-shell + tab bar + service worker
6. Fas 6 — Hem + Event + Personer + Mer
7. Fas 6.5 — Aktivitetslogg (xAPI)
8. Fas 7 — Konsolidering (CSP, chaos testing, deploy)
9. Fas 8 (framtid) — Passkeys, push, offline

---

## Kvalitetsribba

| Typ | Tillgänglighet | Teknik | Återanvändbarhet |
|---|---|---|---|
| **Bibliotek** (komponenter, hooks) | **11** | **11** | **11** |
| **Vyer** (produktspecifika) | **11** | **10** | **10** |

Tillgänglighet är alltid 11 — inga undantag. Bibliotekskod ska bära flera produkter.

Fullständiga checklistor: `~/Repon/miranon-media-os/docs/KVALITETSDEFINITIONER-11.md`

---

## Vision: Dubbel output

1. **Miranon Media Admin** — produkten Lotta använder dagligen. Event, anmälningar, betalningar, personer, leads, närvaro, mail.
2. **Mm Component Library** — komponentbiblioteket som bär framtida produkter (Passionslyftet, Maxat Event, kommande SaaS). Hooks, primitiver och komponenter byggda för återanvändning utan ändringar.

Allt som byggs bedöms utifrån båda perspektiven:
- Löser det Lottas behov? (produkt)
- Kan det återanvändas i nästa produkt utan ändringar? (bibliotek)

---

## Sessionsstart

1. Läs denna fil
2. Läs `tasks/todo.md` + `tasks/lessons.md`
3. Läs aktuell fas i `~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md`
4. Kör `git pull`
5. Sammanfatta aktuell uppgift, relevanta lärdomar och verifieringskrav

## Sessionsavslut

När Marcus säger "Nu avslutar vi denna session":
1. Gå igenom HELA sessionen — beslut, lärdomar, misstag, vad som inte fungerade
2. Uppdatera CLAUDE.md med status och beslut
3. Uppdatera `tasks/lessons.md` (markera `[UNIVERSAL]` där relevant — synca till hubben)
4. Uppdatera `tasks/todo.md`
5. Uppdatera ## Filstruktur i CLAUDE.md
6. Committa och pusha

---

## Status

**Fas 0: Projektsetup + tokens** — pågående. Repo skapat 2026-04-13.
