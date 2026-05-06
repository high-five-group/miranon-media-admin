# CLAUDE.md — Miranon Media Admin (React)
*Senast uppdaterad: 2026-05-05 | v0.3 — Session 2 (React), Fas A + P0–P3a klara, P3b städning pågår*

---

## Vad är detta projekt?

Admin-app för **Miranon Media** (Roger & Lotta). Hanterar event, anmälningar, betalningar, personer, leads, närvaro och mail.

Detta är en **React-konvertering** av det Vue-byggda systemet i `~/Repon/miranon-media-os/`. Vue-projektet ligger kvar som referens under hela konverteringen — alla 4 komponenter på 11/11/11, 12 composables och hela arkitekturen porteras steg för steg enligt en styrande plan.

**Styrande dokument för byggandet:** `docs/byggplan.md` (i detta repo). Vue-repots `react-migration/`-mapp är historiskt referensmaterial — användes som källa under Fas 0 + Fas 1 men ersätts av byggplan.md från och med Fas 2.

Hela `docs/react-migration/`-mappen i Vue-repot var sanningskälla för Fas 0 + Fas 1 (historiskt). För Fas 2+ är `docs/byggplan.md` (i detta repo) sanningskällan.
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
- **Styrande dokument för byggandet:** `docs/byggplan.md`. Läs den innan varje fas. Avvik aldrig utan att uppdatera byggplanen först.
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

## Filstruktur

> Genererad 2026-04-14 (Session 1 (React), efter Fas 0 + Fas 1). Uppdateras vid sessionsavslut.
> Exkluderar: `node_modules`, `.git`, `dist`, `package-lock.json`.

```
~/Repon/miranon-media-admin/
├── CLAUDE.md                              ← denna fil
├── README.md                              ← projektintro + dokumentationstabell
├── biome.json                             ← [ADR-001] Biome 2.4
├── index.html
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts                         ← @tailwindcss/vite (TanStack Router återinförs Fas 2)
│
├── .claude/
│   └── settings.json                      ← pre-commit hook (biome check + tsc)
│
├── .env.local                             ← .gitignore-skyddad
├── .gitignore
│
├── docs/
│   ├── BUILD-LOG.md                       ← implementation journal per session
│   ├── README.md
│   ├── byggplan.md                        ← STYRANDE — fas-för-fas-plan (post-P3a)
│   ├── archive/conversion-plan-2026-04-14.md  ← arkiverad 2026-05-05 per ADR-012
│   ├── gap-analysis.md
│   ├── DESIGN-MANIFESTO.md
│   ├── DESIGN-OPERATING-SYSTEM.md
│   ├── DESIGN-SYSTEM-SPEC.md              ← 3-lagers tokens (ADR-002, ADR-003)
│   ├── SECURITY-SPEC.md
│   ├── PERFORMANCE-BUDGET.md
│   ├── STATE-STRATEGY.md
│   ├── URL-STATE-SPEC.md
│   ├── ARIA-UPGRADE.md
│   ├── FUTURE-COMPAT.md
│   ├── SPA-ARCHITECTURE-DECISION.md
│   ├── ACCESSIBILITY-CHECKLIST.md
│   ├── ACCESSIBILITY-AUDIT-MALL.md
│   ├── KVALITETSDEFINITIONER-11.md
│   ├── DOKUMENTATIONSSTANDARD.md
│   ├── BYGGPLAN-LÄTTLÄST.md
│   ├── BYGGPLAN-LÄTTLÄST-v2.md
│   ├── decisions/                         ← ADR:er (1 per beslut)
│   │   ├── README.md                      ← index-tabell för ADR:er
│   │   ├── ADR-001-biome-over-eslint-stylelint-prettier.md
│   │   ├── ADR-002-tailwind-v4-theme-css-first.md
│   │   ├── ADR-003-css-custom-property-naming.md
│   │   ├── ADR-004-typescript-baseurl-removal.md
│   │   ├── ADR-005-zod-parallell-definitions.md
│   │   ├── ADR-006-fetch-with-retry-infrastructure.md
│   │   ├── ADR-007-event-name-collision-deferred-aliasing.md
│   │   ├── ADR-008-file-inventory-selective-run.md
│   │   ├── ADR-009-supabase-client-env-consolidation.md
│   │   └── ADR-010-biome-exclude-deno-edge-functions.md
│   ├── features/
│   │   └── FEATURE-ACTIVITY-LOG.md
│   └── research/
│       ├── beyond-best-practices-2026.md
│       ├── react-headless-ui-research.md
│       ├── react-stack-research.md
│       └── vue-project-analysis.md
│
├── public/
│   ├── favicon/                           (7 filer)
│   ├── miranon-logo.svg
│   └── sw.js                              ← [GA] service worker-skelett
│
├── scripts/
│   └── verify-phase-1.ts                  ← runtime-verifiering (11 assertions)
│
├── src/
│   ├── main.tsx                           ← entry point
│   ├── env.ts                             ← [GA] @t3-oss/env-core env-validering
│   ├── vite-env.d.ts
│   ├── data/
│   │   ├── utils.ts                       ← [GA] fetchWithRetry (ADR-006)
│   │   ├── adapters/
│   │   │   ├── DataSourceAdapter.ts
│   │   │   ├── AirtableAdapter.ts
│   │   │   └── SupabaseAdapter.ts
│   │   └── config/
│   │       └── supabase-client.ts         ← modifierad (ADR-006, ADR-009)
│   ├── domain/
│   │   ├── __tests__/
│   │   │   └── schemas.assignable.ts      ← AssertEqual compile-time-test
│   │   ├── models/                        (8 filer)
│   │   ├── schemas/                       ← [GA] Zod (8 + index, ADR-005)
│   │   └── types/                         (Filters.ts, Status.ts)
│   ├── lib/
│   │   ├── cn.ts                          ← clsx + tailwind-merge
│   │   ├── alert-screen-reader.ts
│   │   ├── focus-utils.ts
│   │   └── report-web-vitals.ts           ← [GA] web-vitals
│   └── styles/
│       ├── base.css                       ← reset + Inter + fokusregel
│       ├── tailwind.css                   ← @theme (ADR-002)
│       └── tokens/
│           ├── primitives.css             ← lager 1 (ADR-003)
│           ├── semantic.css               ← lager 2
│           └── components.css             ← lager 3 (skelett)
│
├── supabase/
│   └── functions/                         ← [ADR-010] Deno-kod, ej lintad av Biome
│       ├── _shared/                       (airtable-client.ts, cors.ts)
│       ├── create-admin-user/
│       ├── get-events/
│       ├── get-persons/
│       ├── get-registrations/
│       └── update-record/
│
└── tasks/
    ├── todo.md                            ← aktiva uppgifter
    └── lessons.md                         ← organisatoriskt minne

~/Repon/miranon-media-os/                  ← Vue-referensen (original)
└── docs/react-migration/                  ← ursprungs-källa till React-repots docs/
    ├── conversion-plan.md
    ├── FILE-INVENTORY.md                  ← kopieringsscriptet (selektivt körd — ADR-008)
    └── ... (15 spec-dokument kopierade till React-repot)
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

**Fasordning (enligt `docs/byggplan.md` §4):**
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

Fullständiga checklistor: `~/Repon/miranon-media-os/docs/specs/KVALITETSDEFINITIONER-11.md`

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
3. Läs `docs/BUILD-LOG.md` — senaste fasens resultat, avvikelser och uppskjutna beslut
4. Läs aktuell fas i `docs/byggplan.md` (per ADR-012 — `conversion-plan.md` arkiverad till `docs/archive/conversion-plan-2026-04-14.md` i P3b)
5. Kör `git pull`
6. Sammanfatta: aktuell uppgift, relevanta lärdomar, uppskjutna beslut från BUILD-LOG, verifieringskrav

## Sessionsavslut

Se `marcus-system/WORKFLOW.md` sessionsavslut-sektion för transcript-disciplin. Transcripts sparas i `tasks/sessions/transcripts/`.

När Marcus säger "Nu avslutar vi denna session":
1. Gå igenom HELA sessionen — beslut, lärdomar, misstag, vad som inte fungerade
2. Uppdatera `docs/BUILD-LOG.md`:
   - Ny fas-sektion med datum, commit-range, planerat vs faktiskt
   - Avvikelser med ADR-referens
   - Verifieringsresultat (faktisk output, inte bara "passerade")
   - Kända uppskjutna beslut / teknisk skuld
   - Filstruktur-snapshot (`tree src/`)
   - Definition of Done uppfylld: Ja/Nej
3. Skapa ADR i `docs/decisions/` för varje nytt arkitekturbeslut (format: `ADR-NNN`)
4. Uppdatera `docs/decisions/README.md` med nya ADR:er
5. Uppdatera CLAUDE.md med status och beslut
6. Uppdatera `tasks/lessons.md` (markera `[UNIVERSAL]` där relevant)
7. Uppdatera `tasks/todo.md`
8. Uppdatera ## Filstruktur i CLAUDE.md
9. Committa och pusha

**Checklista:**
- [ ] Stämmer alla statusmarkeringar med verkligheten?
- [ ] Finns beslut som bara lever i chatten men inte i dokumenten?
- [ ] Har varje arkitekturbeslut en ADR?
- [ ] Är BUILD-LOG uppdaterad med faktisk output (inte bara "passerade")?
- [ ] Är "Definition of Done" explicit markerad i BUILD-LOG?
- [ ] Är "Status och nästa steg" uppdaterad?
- [ ] Uppdatera ## Filstruktur i CLAUDE.md
- [ ] Påminn Marcus: klicka "Update" i Claude Chat-projektet (claude.ai)

---

## Status

**Fas 0 + Fas 1 klara** — Session 1 (React), 2026-04-14. Se [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) för fullständig fashistorik.

**Aktuellt fokus:** Fas 2 — Routing + Auth (TanStack Router file-based, Supabase auth).

> **Sessionsnumrering:** React-projektet startar på Session 1.
> Session 1 (React) motsvarar Session 31 i den samlade projekthistoriken
> (Vue-bygget var session 1–30 i `~/Repon/miranon-media-os/`).
