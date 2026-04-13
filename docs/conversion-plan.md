# Konverteringsplan — Miranon Media Admin (Vue 3 → React)

*Baserad på: react-stack-research.md, vue-project-analysis.md, DESIGN-MANIFESTO.md, DESIGN-OPERATING-SYSTEM.md, DESIGN-SYSTEM-SPEC.md*
*Skapad: 2026-04-05*

---

## A. Stack-beslut

| Lager | Val | Version | Motivering |
|-------|-----|---------|------------|
| Ramverk | React 19 | ^19.x | Hooks, Suspense, useId, useOptimistic |
| Bundler | Vite 8 | ^8.x | Samma som Vue-projektet — bevisat robust |
| UI-primitiver | React Aria | @react-aria/* | Se nedan |
| Routing | TanStack Router | ^1.x | Typ-säkra search params, Query-synergi |
| Data-fetching | TanStack Query | ^5.x | CRUD, mutations, offline, loader-integration |
| Tabeller | TanStack Table | ^8.x | Headless — ersätter MmDataTable |
| Formulär | React Aria Form | @react-aria/form | Inbyggt i React Aria — inget extra beroende |
| Styling | Tailwind CSS 4 | ^4.x | Token-integration via CSS custom properties |
| Animationer | Motion (Framer) | ^12.x | AnimatePresence, layout-animation |
| Variants | CVA | ^1.x | Typsäkra komponent-varianter |
| Utility | clsx + tailwind-merge | — | cn()-helper |
| Ikoner | Lucide React | lucide-react | 1:1-ersättning av lucide-vue-next |
| Auth | @supabase/supabase-js | ^2.x | Behålls oförändrad |
| Test (visuell) | Playwright | ^1.x | Screenshot-baselines |
| Lint/Format | Biome 2.0 | ^2.x | [GA] Ersätter ESLint+Stylelint+Prettier. 42-65x snabbare. En config, ett kommando |
| Validering | Zod | ^3.x | [GA] Runtime-validering vid systemgränser (Airtable API-svar) |
| Env-validering | @t3-oss/env-core | — | [GA] Type-safe miljövariabler — kraschar vid uppstart, inte runtime |
| URL-state | nuqs | ^2.x | [GA] Type-safe search params per vy (filter, sök, flikar) |
| Performance | web-vitals | ^4.x | [GA] RUM: CLS, LCP, INP-rapportering till produktion |
| Observability | @sentry/react | ^8.x | [GA] Error tracking, performance monitoring, trace-korrelering |
| Offline | Workbox | ^7.x | [GA] Service worker: cache-first (shell), network-first (API), offline fallback |

### Varför React Aria (inte Radix)

Baserat på research-rapporten:

1. **Underhållsrisk.** Radix-grundare har lämnat efter WorkOS-förvärvet. tldraw migrerar aktivt bort. Skaparen kallade Radix "a liability". Vi bygger ett bibliotek som ska bära framtida produkter — underhållets tillförlitlighet är icke-förhandlingsbar.

2. **Tillgänglighet.** React Aria har 50+ komponenter, 30+ språk, 13 kalendersystem. Adobe använder det i Spectrum 2. Det är branschens mest testade a11y-implementation. Vårt 11/11/11-krav matchar detta.

3. **Composable-mappning.** 9 av 12 Vue composables har direkta React Aria-ekvivalenter (FocusScope, useDismiss, usePreventScroll, useCollection, etc.). Migrationsvägen är konceptuellt ren.

4. **Hooks-baserat.** React Arias hooks-modell matchar vår filosofi: vi äger rendering, biblioteket äger beteende. Samma separation som våra Vue composables.

### Varför TanStack Router (inte React Router)

1. **Search params.** Zod-validerade search params med hierarkiskt arv. 80% av Lottas interaktioner (filter, sort, paginering) lever i URL:en. TanStack Router eliminerar en hel kategori boilerplate.

2. **Query-synergi.** Route loaders seedar TanStack Query-cachen via `ensureQueryData()`. Hover-prefetch via `preload="intent"`. Navigation känns instant.

3. **TypeScript end-to-end.** Automatisk typgenerering via `routeTree.gen.ts`. Felaktiga navigeringar, saknade params, feltyper fångas vid compile time.

### Ändring jämfört med research

**TanStack Form ersätts av React Aria Form.** React Aria har inbyggt formulärstöd (useTextField, useNumberField, useCheckbox, useSelect) med komplett a11y. Att lägga till TanStack Form ovanpå är overengineering — våra formulär är enkla (login, sökfält, filter). Om komplexiteten ökar kan TanStack Form adderas senare.

---

## B. Repo-struktur

```
miranon-media-admin/
├── .env.local                          ← VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── biome.json                          ← [GA] Biome 2.0 — lint + format (ersätter ESLint+Stylelint+Prettier)
├── index.html
├── package.json
├── playwright.config.ts                ← Visuella tester (DESIGN-SYSTEM-SPEC §6)
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
│
├── .claude/
│   ├── settings.json                   ← [FI] Pre-commit hook (biome check + tsc)
│   └── settings.local.json             ← [FI] Lokala settings
│
├── docs/
│   ├── DESIGN-MANIFESTO.md             ← Kopieras från Vue-repo
│   ├── DESIGN-OPERATING-SYSTEM.md      ← Kopieras från Vue-repo
│   ├── DESIGN-SYSTEM-SPEC.md           ← Kopieras från Vue-repo
│   ├── audits/                         ← Design-audit-rapporter per vy
│   └── phases/                         ← Leverabler per fas (beteendespec, eliminationslista, friction log)
│
├── public/
│   ├── favicon.svg
│   └── sw.js                           ← [GA] Tom service worker-skelett (utökas med Workbox i Fas 5)
│
├── supabase/
│   └── functions/                      ← Kopieras rakt av från Vue-repo (Deno, framework-agnostisk)
│       ├── _shared/
│       │   ├── airtable-client.ts
│       │   └── cors.ts
│       ├── get-events/index.ts
│       ├── get-registrations/index.ts
│       ├── get-persons/index.ts
│       ├── create-admin-user/index.ts
│       └── update-record/index.ts
│
├── tests/
│   └── visual/                         ← Playwright screenshot-tester
│       ├── dashboard.spec.ts
│       └── __screenshots__/
│
└── src/
    ├── main.tsx                        ← React.createRoot + Providers
    ├── app.tsx                         ← QueryClient, Router, AuthProvider
    │
    ├── styles/
    │   ├── tokens/
    │   │   ├── primitives.css          ← Lager 1: råa värden (DESIGN-SYSTEM-SPEC §1)
    │   │   ├── semantic.css            ← Lager 2: semantiska tokens
    │   │   └── components.css          ← Lager 3: komponent-tokens
    │   ├── base.css                    ← Reset, fokusregel, typografi-defaults
    │   └── tailwind.css                ← @import "tailwindcss" + @theme-block (DESIGN-SYSTEM-SPEC §8)
    │
    ├── domain/                         ← 🟢 RAKT AV — kopieras utan ändring
    │   ├── models/
    │   │   ├── Attendance.ts
    │   │   ├── Engagement.ts
    │   │   ├── Event.ts
    │   │   ├── Lead.ts
    │   │   ├── MailPayload.ts
    │   │   ├── Person.ts
    │   │   ├── Registration.ts
    │   │   └── WaitlistEntry.ts
    │   └── types/
    │       ├── Filters.ts
    │       └── Status.ts
    │
    ├── data/                           ← 🟢 RAKT AV (utom supabase-client)
    │   ├── adapters/
    │   │   ├── DataSourceAdapter.ts
    │   │   ├── AirtableAdapter.ts
    │   │   └── SupabaseAdapter.ts
    │   └── config/
    │       └── supabase-client.ts      ← 🟡 import.meta.env behålls (Vite)
    │
    ├── env.ts                          ← [GA] @t3-oss/env-core (validerar env vid uppstart)
    │
    ├── lib/                            ← Delade utilities
    │   ├── cn.ts                       ← clsx + tailwind-merge helper
    │   ├── alert-screen-reader.ts      ← 🟢 RAKT AV
    │   ├── focus-utils.ts              ← 🟢 RAKT AV
    │   └── report-web-vitals.ts        ← [GA] web-vitals → Sentry/sendBeacon
    │
    ├── hooks/                          ← App-specifika React hooks
    │   ├── use-auth.ts                 ← 🟡 PORTAS (singleton → Context)
    │   ├── use-data-source.ts          ← 🟡 PORTAS (provide/inject → Context)
    │   ├── use-dashboard-data.ts       ← 🟡 PORTAS (computed → useMemo)
    │   └── use-user-display-name.ts    ← 🟡 PORTAS (computed → useMemo)
    │
    ├── providers/
    │   ├── auth-provider.tsx           ← Supabase auth state → React Context
    │   ├── data-source-provider.tsx    ← DataSourceAdapter → React Context
    │   └── query-provider.tsx          ← QueryClient + QueryClientProvider
    │
    ├── routes/                         ← TanStack Router file-based routes
    │   ├── __root.tsx                  ← Root layout (providers, global layout)
    │   ├── _authenticated.tsx          ← Auth guard + app-shell med tab bar
    │   ├── _authenticated/
    │   │   ├── hem.tsx                 ← Hem-fliken (S1: Morgonöverblick)
    │   │   ├── event/
    │   │   │   ├── index.tsx           ← Event-fliken (S2+S3)
    │   │   │   └── $eventId.tsx        ← Event-detalj
    │   │   ├── personer/
    │   │   │   ├── index.tsx           ← Personer-fliken (S4)
    │   │   │   └── $personId.tsx       ← Person-detalj
    │   │   └── mer.tsx                 ← Mer-fliken (S5-S8)
    │   ├── login.tsx
    │   └── index.tsx                   ← Redirect → /hem
    │
    ├── components/
    │   ├── ui/                         ← Designsystem-komponenter
    │   │   ├── button.tsx
    │   │   ├── dialog.tsx              ← React Aria Dialog
    │   │   ├── message-box.tsx
    │   │   ├── status-badge.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── list-item.tsx           ← FK-stil listrad med chevron
    │   │   ├── tab-group.tsx           ← Flikväxlare (FK-stil)
    │   │   └── card.tsx                ← Informationskort (FK-stil)
    │   │
    │   ├── shell/                      ← App-shell (minimal, FK-inspirerad)
    │   │   ├── app-shell.tsx           ← children + tab bar
    │   │   ├── tab-bar.tsx             ← Bottom navigation, 4 flikar
    │   │   ├── page-header.tsx         ← Enkel h1 + valfri back-knapp
    │   │   ├── empty-state.tsx         ← Centrerat meddelande
    │   │   └── skip-link.tsx
    │   │
    │   └── home/                       ← Hem-flikens feature-komponenter
    │       ├── greeting.tsx            ← "Hej Lotta" + statusmeddelande
    │       ├── new-registrations.tsx   ← Lista med list-items
    │       ├── info-cards.tsx          ← Nästa event, obetalda
    │       └── primary-action.tsx      ← Stor CTA-knapp (FK-stil)
    │
    └── queries/                        ← TanStack Query definitions
        ├── events.ts                   ← queryOptions, prefetch-helpers
        ├── registrations.ts
        ├── persons.ts
        └── keys.ts                     ← Centraliserade query key-factory
```

---

## C. Transplant-inventering

### 🟢 KOPIERAS RAKT AV (23 filer, 2 176 rader)

Dessa filer har noll Vue-beroenden. Kopieras utan en enda ändring.

| Fil (Vue-repo) | Mål (React-repo) | Rader | Varför |
|----------------|-------------------|-------|--------|
| domain/models/Attendance.ts | domain/models/Attendance.ts | 10 | Ren TypeScript interface |
| domain/models/Engagement.ts | domain/models/Engagement.ts | 10 | Ren TypeScript interface |
| domain/models/Event.ts | domain/models/Event.ts | 20 | Ren TypeScript interface ¹ |
| domain/models/Lead.ts | domain/models/Lead.ts | 13 | Ren TypeScript interface |
| domain/models/MailPayload.ts | domain/models/MailPayload.ts | 31 | Ren TypeScript, 3 interfaces |
| domain/models/Person.ts | domain/models/Person.ts | 24 | Ren TypeScript interface |
| domain/models/Registration.ts | domain/models/Registration.ts | 22 | Ren TypeScript interface |
| domain/models/WaitlistEntry.ts | domain/models/WaitlistEntry.ts | 14 | Ren TypeScript interface |
| domain/types/Filters.ts | domain/types/Filters.ts | 34 | Ren TypeScript, 6 interfaces |
| domain/types/Status.ts | domain/types/Status.ts | 49 | `as const` + derived types |
| data/adapters/DataSourceAdapter.ts | data/adapters/DataSourceAdapter.ts | 71 | Ren TypeScript interface, 15 metoder |
| data/adapters/AirtableAdapter.ts | data/adapters/AirtableAdapter.ts | 198 | Klass med `fetch()`, noll Vue |
| data/adapters/SupabaseAdapter.ts | data/adapters/SupabaseAdapter.ts | 100 | Stubs, noll Vue |
| composables/alertScreenReader.ts | lib/alert-screen-reader.ts | 172 | Ren DOM-manipulation |
| composables/focusUtils.ts | lib/focus-utils.ts | 90 | Ren DOM-utility |
| presentation/tokens/design-tokens.ts | — ² | 127 | Ren TypeScript `as const` |
| components/library/MmDialog/types.ts | — ³ | 75 | Ren TypeScript interfaces |
| components/library/MmDialog/mm-dialog.css | — ³ | 279 | Ren CSS med data-attribut |
| components/library/MmDataTable/mm-data-table.css | — ³ | 343 | Ren CSS med data-attribut |
| ~~components/core/AppMenu.css~~ | — | 806 | ⚪ Eliminerad (ingen sidebar-meny i FK-designen) |
| components/features/dashboard/card-section.css | — ⁵ | 55 | Ren CSS |
| assets/miranon-logo.svg | public/miranon-logo.svg | 16 | SVG |
| styles/main.scss | — ⁶ | 119 | Token-definitioner som referens |

¹ `Event` krockar med DOM:ens globala `Event`. I TSX krävs explicit import eller alias.
² Ersätts av DESIGN-SYSTEM-SPEC:s tre-lagers-tokens men behålls som referens.
³ CSS-filerna kopieras som referens; komponenterna byggs om med Tailwind + React Aria.
⁴ AppMenu.css kopieras och anpassas — BEM-klasserna fungerar globalt.
⁵ Ersätts av Tailwind-klasser direkt.
⁶ Token-värden migreras till `styles/tokens/`. SCSS → ren CSS.

### 🟡 PORTAS (34 filer, 7 122 rader)

Logiken behålls. Syntax ändras Vue → React.

| Vue-fil | React-fil | Vue → React-ändringar | ~Rader |
|---------|-----------|----------------------|--------|
| **Composables → Hooks** | | | |
| useFocusStack.ts (202) | — ⁷ | onUnmounted → useEffect cleanup | ~180 |
| ~~useResizable.ts (161)~~ | — | ⚪ Eliminerad (ingen sidebar i FK-designen) | — |
| ~~useAnimatedCounter.ts (73)~~ | — | ⚪ Eliminerad (inga animerade siffror i FK-designen) | — |
| useAuth.ts (82) | hooks/use-auth.ts + providers/auth-provider.tsx | Module-level singleton → Context Provider | ~120 |
| useDashboardData.ts (75) | hooks/use-dashboard-data.ts | computed→useMemo | ~60 |
| useDataSource.ts (19) | hooks/use-data-source.ts + providers/data-source-provider.tsx | provide/inject→createContext+useContext | ~40 |
| useUserDisplayName.ts (28) | hooks/use-user-display-name.ts | computed→useMemo | ~25 |
| index.ts (53) | (barrel exports anpassas) | .vue → .tsx i imports | ~30 |
| **Library-komponenter** | | | |
| MmDialog/context.ts (45) | — ⁸ | provide/inject → createContext | — |
| MmDialog/MmDialog.vue (268) | components/ui/dialog.tsx | Template→JSX, Teleport→createPortal, 8 composables→hooks | ~200 |
| MmDialog/MmDialogTitle.vue (24) | (inline i dialog.tsx) | inject→useContext | — |
| MmDialog/MmDialogDescription.vue (27) | (inline i dialog.tsx) | inject→useContext | — |
| MmDialog/MmDialogClose.vue (41) | (inline i dialog.tsx) | inject→useContext | — |
| MmDialog/index.ts (10) | (barrel export) | — | — |
| MmDataTable/types.ts (137) | components/ui/data-table.tsx (types inline) | VNode→ReactNode (1 ändring) | ~130 |
| MmDataTable/context.ts (45) | (inline) | provide/inject→Context | — |
| MmDataTable/MmDataTable.vue (296) | components/ui/data-table.tsx | Template→JSX, v-for→map, generic→TypeScript generics | ~250 |
| MmDataTable/MmTableColumn.vue (109) | — ⁹ | Kolumn-definition via hook, inte child-komponent | — |
| MmDataTable/useTableFeatures.ts (337) | (integrerat i data-table.tsx) | 3× useControllable→useState, watch→useEffect | ~280 |
| MmDataTable/index.ts (11) | (barrel export) | — | — |
| **Core-komponenter** | | | |
| AdminShell.vue (750) | components/shell/admin-shell.tsx | Template→JSX, scoped→Tailwind | ~500 |
| AppMenu.vue (811) | components/shell/app-menu.tsx | Template→JSX, 7 composables→hooks | ~600 |
| MmButton.vue (60) | components/ui/button.tsx | Template→JSX, scoped→Tailwind+CVA | ~50 |
| MmMessageBox.vue (59) | components/ui/message-box.tsx | Template→JSX, scoped→Tailwind | ~50 |
| StatusBadge.vue (78) | components/ui/status-badge.tsx | Template→JSX, scoped→Tailwind | ~60 |
| **Feature-komponenter** | | | |
| EventCard.vue (268) | components/dashboard/event-card.tsx | Template→JSX, scoped→Tailwind | ~200 |
| NewRegistrationsList.vue (158) | components/dashboard/new-registrations-list.tsx | Template→JSX | ~130 |
| UnpaidSummary.vue (214) | components/dashboard/unpaid-summary.tsx | Template→JSX | ~170 |
| StatCard.vue (131) | components/dashboard/stat-card.tsx | Template→JSX, useAnimatedCounter→hook | ~100 |
| DashboardSkeleton.vue (105) | components/dashboard/dashboard-skeleton.tsx | Template→JSX, Tailwind animate-pulse | ~80 |
| **Vyer** | | | |
| DashboardView.vue (286) | routes/_authenticated/hem.tsx | onMounted+useAsyncData→TanStack Query loader | ~200 |
| MinaSidorView.vue (358) | — | ⚪ Eliminerad (vy slås ihop med Hem-fliken) | — |
| LoginView.vue (129) | routes/login.tsx | Template→JSX, watch→useEffect, Tailwind | ~100 |
| App.vue (54) | app.tsx | SFC→TSX, provide→Context, router-view→RouterOutlet | ~40 |

⁷ useFocusStack portas om vi bygger egen Dialog. Med React Aria Dialog är den inbyggd.
⁸ React Aria Dialog har inbyggd context — vi behöver inte egen.
⁹ TanStack Table använder column definitions som data, inte child-komponenter. `columnHelper.accessor()` ersätter MmTableColumn.

### 🔴 ERSÄTTS av React-ekosystemet (12 filer, 2 200 rader)

| Vue composable/fil | Rader | Ersätts av | Vad som vinns | Vad som förloras |
|--------------------|-------|-----------|---------------|------------------|
| useId.ts | 60 | `React.useId()` | SSR-stabil, zero-config | Prefix-stöd (trivial wrapper) |
| useScrollLock.ts | 149 | `react-remove-scroll` (Radix-standard) | Produktionstestad, iOS-fixar | Exakt samma API |
| useControllable.ts | 216 | `prop !== undefined ? controlled : uncontrolled` | Problemet existerar inte i React | 216 rader komplex logik |
| usePresence.ts | 209 | `motion.AnimatePresence` | Layout-animation, gesture-stöd | Manuell kontroll (sällan behövd) |
| useFocusScope.ts | 319 | `@react-aria/focus FocusScope` | 30+ språk, WAI-ARIA-testad | Exakt kontroll (kan wrappas) |
| useDismissable.ts | 228 | `@react-aria/overlays useOverlayTrigger` | Testad lager-stack | Exakt samma API |
| useCollection.ts | 185 | `@react-stately/collections` | React-optimerad, Selection | DOM-ordning via provide |
| useRovingFocus.ts | 283 | `@react-aria/focus useFocusManager` | Grid/tree/tab-stöd | Exakt samma tangenter |
| useTypeAhead.ts | 271 | Inbyggd i React Aria `useSelect`, `useComboBox` | 30+ språk, produktionstestad | Fristående användning |
| useAsyncData.ts | 21 | TanStack Query `useQuery` | Cache, prefetch, mutations, DevTools | Enkelhet (21 rader → ~5) |
| main.ts | 8 | `main.tsx` (React.createRoot) | — | — |
| router/index.ts | 122 | TanStack Router file-based routes | Type-safe, loaders, prefetch | Konfigurationsformat |

**Totalt eliminerat: 2 071 rader composable-kod → ersätts av ~500 rader hook-integrationer + produktionstestade bibliotek.**

### ⚪ ELIMINERAS (16 filer, 3 203 rader)

| Fil | Rader | Varför elimineras |
|-----|-------|-------------------|
| AppMenuLegacy.vue | 698 | Backup — inte i produktion |
| AppMenuLegacy.css | 679 | Backup — inte i produktion |
| AdminShell.README.md | 323 | Vue-specifik dokumentation |
| AppMenu.README.md | 337 | Vue-specifik dokumentation |
| MmDialog/README.md | 249 | Vue-specifik dokumentation |
| MmDataTable/README.md | 278 | Vue-specifik dokumentation |
| EventsView.vue | 19 | Identisk placeholder |
| AttendanceView.vue | 19 | Identisk placeholder |
| LeadsView.vue | 19 | Identisk placeholder |
| MailView.vue | 19 | Identisk placeholder |
| PaymentsView.vue | 19 | Identisk placeholder |
| PersonsView.vue | 19 | Identisk placeholder |
| RegistrationsView.vue | 19 | Identisk placeholder |
| WaitlistView.vue | 19 | Identisk placeholder |
| PlaceholderView.vue | 33 | Ersätts av generisk placeholder i React |
| assets/.gitkeep | 0 | Behövs inte |
| features/.gitkeep | 0 | Behövs inte |

---

## C2. [FI] Dokumentation och styrfiler — migreringsinventering

> Baserat på FILE-INVENTORY.md (2026-04-07). Sektion C inventerade src/-filer.
> Denna sektion täcker ALLT ANNAT: docs, tasks, CLAUDE.md, .claude, supabase, assets.

### [FI] 🟢 KOPIERA TILL REACT (42 filer totalt, 9 263 rader)

Inkluderar C:s src-filer + nedanstående docs/styrfiler.

#### Docs — React-migration (styrande)

| Källa (Vue-repo) | Destination (React-repo) | Rader |
|-------------------|--------------------------|-------|
| docs/react-migration/conversion-plan.md | docs/conversion-plan.md | 1 795 |
| docs/react-migration/DESIGN-MANIFESTO.md | docs/DESIGN-MANIFESTO.md | 187 |
| docs/react-migration/DESIGN-OPERATING-SYSTEM.md | docs/DESIGN-OPERATING-SYSTEM.md | 402 |
| docs/react-migration/DESIGN-SYSTEM-SPEC.md | docs/DESIGN-SYSTEM-SPEC.md | 915 |
| docs/react-migration/SECURITY-SPEC.md | docs/SECURITY-SPEC.md | 817 |
| docs/react-migration/PERFORMANCE-BUDGET.md | docs/PERFORMANCE-BUDGET.md | 304 |
| docs/react-migration/STATE-STRATEGY.md | docs/STATE-STRATEGY.md | 322 |
| docs/react-migration/URL-STATE-SPEC.md | docs/URL-STATE-SPEC.md | 182 |
| docs/react-migration/ARIA-UPGRADE.md | docs/ARIA-UPGRADE.md | 241 |
| docs/react-migration/FUTURE-COMPAT.md | docs/FUTURE-COMPAT.md | 299 |
| docs/react-migration/SPA-ARCHITECTURE-DECISION.md | docs/SPA-ARCHITECTURE-DECISION.md | 234 |
| docs/react-migration/gap-analysis.md | docs/gap-analysis.md | 491 |
| docs/react-migration/react-stack-research.md | docs/research/react-stack-research.md | 459 |
| docs/react-migration/vue-project-analysis.md | docs/research/vue-project-analysis.md | 868 |
| docs/react-migration/README.md | docs/README.md | 28 |

#### Docs — Research

| Källa | Destination | Rader |
|-------|-------------|-------|
| docs/research/beyond-best-practices-2026.md | docs/research/beyond-best-practices-2026.md | 1 088 |
| docs/research/2026-04-05-react-headless-ui-research.md | docs/research/react-headless-ui-research.md | 297 |

#### Docs — Tillgänglighet & kvalitet

| Källa | Destination | Rader |
|-------|-------------|-------|
| docs/ACCESSIBILITY-CHECKLIST.md | docs/ACCESSIBILITY-CHECKLIST.md | 150 |
| docs/ACCESSIBILITY-AUDIT-MALL.md | docs/ACCESSIBILITY-AUDIT-MALL.md | 219 |
| docs/KVALITETSDEFINITIONER-11.md | docs/KVALITETSDEFINITIONER-11.md | 293 |
| docs/DOKUMENTATIONSSTANDARD.md | docs/DOKUMENTATIONSSTANDARD.md | 39 |
| docs/features/FEATURE-ACTIVITY-LOG.md | docs/features/FEATURE-ACTIVITY-LOG.md | 254 |

#### Supabase Edge Functions (framework-agnostiska, Deno)

| Källa | Destination | Rader |
|-------|-------------|-------|
| supabase/functions/_shared/airtable-client.ts | supabase/functions/_shared/airtable-client.ts | 120 |
| supabase/functions/_shared/cors.ts | supabase/functions/_shared/cors.ts | 13 |
| supabase/functions/create-admin-user/index.ts | supabase/functions/create-admin-user/index.ts | 47 |
| supabase/functions/get-events/index.ts | supabase/functions/get-events/index.ts | 61 |
| supabase/functions/get-persons/index.ts | supabase/functions/get-persons/index.ts | 83 |
| supabase/functions/get-registrations/index.ts | supabase/functions/get-registrations/index.ts | 86 |
| supabase/functions/update-record/index.ts | supabase/functions/update-record/index.ts | 82 |

#### Tasks & Settings

| Källa | Destination | Rader | Anmärkning |
|-------|-------------|-------|------------|
| tasks/lessons.md | tasks/lessons.md | 344 | Alla lärdomar relevanta |
| tasks/todo.md | tasks/todo.md | 278 | ⚠️ Behöver rensas från Vue-uppgifter |
| .claude/settings.json | .claude/settings.json | 10 | Pre-commit hook config |
| .claude/settings.local.json | .claude/settings.local.json | 8 | |

### [FI] 🔵 REFERENS (stannar i Vue-repot)

Dessa filer stannar i `~/Repon/miranon-media-os/` och refereras via fullständig sökväg under konverteringen.

| Kategori | Filer | Rader | Typexempel |
|----------|-------|-------|------------|
| Vue-komponenter | 28 | 5 651 | AdminShell.vue, AppMenu.vue, MmDialog/ |
| Vue composables | 18 | 2 634 | useControllable, useFocusScope (ersätts av React-ekosystemet) |
| Vue-vyer | 12 | 978 | DashboardView.vue, LoginView.vue |
| Vue-infrastruktur | 5 | 462 | main.ts, router/index.ts, design-tokens.ts |
| Docs — Vue-specifika | 18 | 24 412 | schema_reference.md, vue-byggplan-v2.md |
| Docs — Audits | 17 + 76 screenshots | 4 400 | 2026-04-03-infrastruktur-granskning.md |
| Docs — Arkiv | 6 | 2 917 | MiranonHub.jsx, lovable-prompt-serie-v2 |
| README-filer | 4 | 1 187 | AdminShell.README.md, AppMenu.README.md |

### [FI] ⚠️ Flaggade filer (kräver manuellt beslut)

| Fil | Problem | Åtgärd |
|-----|---------|--------|
| CLAUDE.md (572 rader) | Vue-specifik. React-repot behöver helt ny version. | Skriv ny CLAUDE.md för React. Behåll principer, migrationsstrategi, kvalitetsdefinitioner. |
| tasks/todo.md (278 rader) | Innehåller Vue-uppgifter. | Rensa: behåll bara Fas 0+. |
| src/domain/models/Event.ts | `Event` krockar med DOM Event i TSX. | Alias `MmEvent` eller explicit import. |
| public/favicon/* (7 filer) | Binära filer. | Kopiera manuellt. |
| src/assets/miranon-logo.svg | Logotyp. | Kopiera till public/miranon-logo.svg. |

### [FI] Kopieringsscript (dry-run)

Komplett bash-script: `docs/react-migration/FILE-INVENTORY.md` (sektion "Kopieringslista").

Kör med: `bash docs/react-migration/FILE-INVENTORY-copy.sh` (dry-run som standard).
Kör på riktigt: `DRY_RUN=0 bash docs/react-migration/FILE-INVENTORY-copy.sh`

---

## D. Fas-för-fas-plan

### Fas 0: Projektsetup + tokens

**Mål:** Fungerande React-projekt med alla verktyg installerade, tokens konfigurerade, lint som passerar.

**Filer som skapas:**
- `package.json` (alla dependencies)
- `vite.config.ts` (React-plugin + `@tailwindcss/vite` + [GA] security headers-plugin med CSP-nonce)
- `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json`
- [GA] `biome.json` (ersätter `.eslintrc.cjs` + `.stylelintrc.cjs` — Biome 2.0 med Tailwind-plugin)
- `index.html`
- `src/main.tsx` (minimal — renderar "Hello" + [GA] registrerar service worker)
- `src/styles/tokens/primitives.css` (från DESIGN-SYSTEM-SPEC §1)
- `src/styles/tokens/semantic.css` (från DESIGN-SYSTEM-SPEC §1)
- `src/styles/tokens/components.css` (skelett)
- `src/styles/base.css` (reset, fokusregel, typografi)
- `src/styles/tailwind.css` (`@import "tailwindcss"` + `@theme`-block från DESIGN-SYSTEM-SPEC §8 — ersätter `tailwind.config.ts`)
- `src/lib/cn.ts` (clsx + tailwind-merge)
- [GA] `src/lib/report-web-vitals.ts` (web-vitals → Sentry/sendBeacon)
- [GA] `src/env.ts` (@t3-oss/env-core — validerar VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY vid uppstart)
- `playwright.config.ts` (från DESIGN-SYSTEM-SPEC §6)
- `.env.local` (Supabase URL + anon key)
- [GA] `public/sw.js` (tom service worker-skelett — registreras i main.tsx, utökas med Workbox i Fas 5)

**Beroenden:** Inga.

**Verifiering:**
1. `npm run dev` startar utan fel
2. `npm run build` producerar output utan varningar
3. `npx tsc --noEmit` — noll TypeScript-fel
4. [GA] `npx @biomejs/biome check .` — noll fel (ersätter ESLint)
5. Token-CSS laddas: inspektera `:root` i DevTools, verifiera att `--mm-primary` resolvar till `#D4960A`
6. Tailwind genererar utilities: `text-primary`, `bg-accent`, `text-small` fungerar
7. [GA] Service worker registrerad: `navigator.serviceWorker.controller` !== null i DevTools
8. [GA] web-vitals hook importerbar utan fel
9. [GA] Saknad env-variabel → uppstartsfel (testa genom att ta bort VITE_SUPABASE_URL)
10. [GA] `npm audit --audit-level=high` — 0 high/critical

**Uppskattad tid:** 1 session.

**Risker:** Tailwind v4 `@theme` (CSS-first) — verifiera att alla utility-klasser genereras korrekt vid dev-start (se ändringsspec 2026-04-13 för migreringen från `tailwind.config.ts`). [GA] Biome 2.0 Tailwind-plugin: verifiera att `classnames-order` och `no-arbitrary-value` fungerar.

---

### Fas 1: Domäntransplant

**Mål:** Alla domain- och data-filer kopierade och verifierade. Supabase-klient fungerande.

**Filer som skapas/kopieras:**
- `src/domain/models/*.ts` (8 filer — rakt av)
- `src/domain/types/*.ts` (2 filer — rakt av)
- [GA] `src/domain/schemas/*.schema.ts` (8 filer — Zod-scheman för alla domäntyper, validerar Airtable API-svar vid systemgräns)
- `src/data/adapters/*.ts` (3 filer — rakt av)
- [GA] `src/data/adapters/utils.ts` (`fetchWithRetry()`: 3 retries, exponential backoff 200ms→400ms→800ms, jitter. Används i alla adapter-metoder)
- `src/data/config/supabase-client.ts` (kopieras, `VITE_*` behålls)
- `src/lib/alert-screen-reader.ts` (kopieras)
- `src/lib/focus-utils.ts` (kopieras)

**Beroenden:** Fas 0 (projektsetup).

**Verifiering:**
1. `npx tsc --noEmit` — noll fel (alla typer resolvar)
2. `import { Event } from './domain/models/Event'` fungerar i en testfil
3. `new AirtableAdapter()` instantieras utan runtime-fel
4. `alertScreenReader('test')` skapar aria-live-element i DOM
5. [GA] `EventSchema.parse({})` kastar ZodError — validering fungerar
6. [GA] `fetchWithRetry()` retry-beteende: mocka nätverksfel → verifierar 3 retries med backoff
7. [GA] Saknad env-variabel → meningsfullt felmeddelande (inte `undefined` crash)

**Uppskattad tid:** 0.5 session (mestadels copy-paste + verifiering).

**Risker:** `Event`-namnkollision med DOM. Om det blir problem: byt till `MiranonEvent` i domain/models/. [GA] Zod-scheman måste matcha Airtable:s faktiska API-svar exakt — verifiera mot MCP live-data.

---

### Fas 2: Routing + Auth

**Mål:** TanStack Router med alla routes, auth guard, Supabase login/logout fungerande.

**Filer som skapas:**
- `src/app.tsx` (QueryClient, RouterProvider)
- `src/providers/auth-provider.tsx` (Supabase auth → Context)
- `src/providers/data-source-provider.tsx` (AirtableAdapter → Context)
- `src/providers/query-provider.tsx` (QueryClientProvider)
- `src/hooks/use-auth.ts` (useContext-wrapper)
- `src/hooks/use-data-source.ts` (useContext-wrapper)
- `src/routes/__root.tsx` (providers, global layout)
- `src/routes/_authenticated.tsx` (auth guard + app-shell med tab bar)
- `src/routes/_authenticated/hem.tsx` (placeholder: Hem-fliken)
- `src/routes/_authenticated/event/index.tsx` (placeholder: Event-fliken)
- `src/routes/_authenticated/event/$eventId.tsx` (placeholder: Event-detalj)
- `src/routes/_authenticated/personer/index.tsx` (placeholder: Personer-fliken)
- `src/routes/_authenticated/personer/$personId.tsx` (placeholder: Person-detalj)
- `src/routes/_authenticated/mer.tsx` (placeholder: Mer-fliken)
- `src/routes/login.tsx` (portad från LoginView.vue)
- `src/routes/index.tsx` (redirect → /hem)
- `src/main.tsx` (uppdaterad med RouterProvider)

**Beroenden:** Fas 0 + Fas 1.

**Verifiering:**
1. `/login` visar loginformulär
2. Inloggning → redirect till `/hem`
3. `/hem`, `/event`, `/personer`, `/mer` — alla renderar placeholder
4. `/event/[id]` och `/personer/[id]` — dynamiska routes fungerar
5. Utloggning → redirect till `/login`
6. Tab bar visar 4 flikar, aktiv markerad
7. Ej inloggad + direktnavigering → `/login`

**[GA] Tillägg (gap-analys):**
- Installera `nuqs`. Konfigurera type-safe URL-state per vy (se `URL-STATE-SPEC.md`). Implementeras fullt i Fas 6 men infrastrukturen sätts upp här
- Konfigurera `preload="intent"` på alla `<Link>` i tab bar och vanliga navigeringslänkar
- Auth-state caching med 1h TTL i localStorage — vid offline: visa senast cachade auth utan server-roundtrip
- Designa LoginView med utrymme för framtida "Logga in med passkey"-knapp (implementeras Fas 8)
- Dokumentera SPA-arkitekturbeslutet: se `SPA-ARCHITECTURE-DECISION.md`

**Uppskattad tid:** 1 session.

**Risker:** TanStack Router file-based routes kräver `@tanstack/router-plugin` i Vite. Verifiera att `routeTree.gen.ts` genereras korrekt. [GA] nuqs-integration med TanStack Router: verifiera att search params synkar korrekt.

---

### Fas 3: UI-primitiver

**Mål:** Alla bas-UI-komponenter byggda med React Aria + Tailwind + CVA. Lint passerar.

**Arbetsordning:** Varje komponent körs genom 21st Component Pipeline (sektion K). Komponenter med FK-motsvarighet (Button, Dialog, MessageBox) börjar med FK-research i Vue-projektet. Alla komponenter får 5 designvarianter via 21st.dev innan implementation.

**Filer som skapas:**
- `src/components/ui/button.tsx` — React Aria useButton + CVA (primary/secondary/cta)
- `src/components/ui/dialog.tsx` — React Aria useDialog + useOverlayTrigger + Motion AnimatePresence
- `src/components/ui/message-box.tsx` — 4 varianter (info/warning/error/success)
- `src/components/ui/status-badge.tsx` — CVA-varianter per status
- `src/components/ui/skeleton.tsx` — Tailwind `animate-pulse`
- `src/components/ui/list-item.tsx` — FK-stil listrad med chevron
- `src/components/ui/tab-group.tsx` — Flikväxlare (FK "Kommande / Tidigare")
- `src/components/ui/card.tsx` — Informationskort (FK-stil)
- Komponent-tokens i `src/styles/tokens/components.css`

**Beroenden:** Fas 0.

**Verifiering per komponent (Operating System §IV):**
1. Tillgänglighet: axe-core 0 violations, tangentbordsnavigering, skärmläsartext
2. Teknisk kvalitet: inga hårdkodade värden, alla tokens från systemet
3. Återanvändbarhet: alla texter via props med svenska defaults
4. Craft: alla states (hover, focus, active, disabled, loading)
5. Playwright baseline-screenshot skapad

**[GA] Tillägg (gap-analys):**
- Planera View Transitions: identifiera vilka navigeringar som ska ha shared element transitions (event-lista → event-detalj via `view-transition-name`). Implementeras i Fas 5
- Implementera ARIA 1.3-attribut per komponent (se `ARIA-UPGRADE.md`): `aria-errormessage` på formulärfält, `aria-description` på kontextuella knappar, `aria-keyshortcuts` där tillämpbart
- Kognitiv tillgänglighet (WCAG 2.2): tidsjusterbara timeouts, drag-alternativ, målstorlek-verifiering (24x24px minimum), fokus-inte-dolt (scroll-margin-top), pausa/stoppa-kontroller
- Komponent-dokumentationsstandard: JSDoc på alla exported props + `@example` i varje komponent-fil
- EAA-medvetenhet: European Accessibility Act (i kraft sedan juni 2025). Böter upp till 100k EUR. Checklista i `ARIA-UPGRADE.md` integreras i audit-processen

**Uppskattad tid:** 2 sessioner.

**Risker:** React Aria useDialog har annat API än vår MmDialog (mer explicit, mindre "magisk"). Tid behövs för att förstå React Arias composability-modell. [GA] ARIA 1.3-attribut har varierande webbläsarstöd — verifiera med VoiceOver.

---

### ~~Fas 4: DataTable~~ → Flyttad till Fas 7

DataTable skjuts till efter Hem och Event-vyer är byggda. I FK-designen visas data primärt som listor (list-item), inte som tabeller. DataTable kan behövas för event-detaljsidan (alla anmälningar till ett specifikt event) på desktop/iPad — men det avgörs när vi ser hur listorna fungerar i praktiken. Om listor räcker, elimineras DataTable helt.

---

### Fas 5: App-shell + Tab bar

**Mål:** Minimal app-shell med bottom tab bar. Skip-to-content. Route announcer. Responsivt: mobil, iPad, desktop.

**Filer som skapas:**
- `src/components/shell/app-shell.tsx`
- `src/components/shell/tab-bar.tsx`
- `src/components/shell/page-header.tsx`
- `src/components/shell/empty-state.tsx`
- `src/components/shell/skip-link.tsx`
- Uppdatera `src/routes/_authenticated.tsx` (integrera app-shell)

**Designkontext:**
FK:s iOS-app som rättesnöre. Se sektion L.

App-shell är medvetet minimal:
- Inget header-nav. Ingen sidebar. Ingen breadcrumb.
- Tab bar fixed bottom. 4 flikar: Hem, Event, Personer, Mer.
- Content-area: centrerad kolumn, max-width 600px, padding 16px.
- Page-header: enkel h1 per sida (som FK: "Ärenden", "Mer").

ORSAKSKEDJA (Operating System steg 1):
Lotta har idag papper och block → mängden växer → rädsla att tappa bort → digital lösning presenteras → rädsla att inte förstå → om menyn har 12 val och en komplex sidebar har vi bekräftat rädslan → om det är 4 flikar och "Hej Lotta" har vi motbevisat den.

**Beroenden:** Fas 0.

**Verifiering:**
1. Skip-to-content: Tab → synlig länk → Enter → fokus på main
2. Tab bar: 4 flikar synliga, aktiv markerad med pill
3. Keyboard: Tab till tab bar → Arrow Left/Right navigerar flikar
4. Route announcer: klicka flik → alertScreenReader("Navigerade till X")
5. Content centrerad, max 600px bredd
6. iPad (1024px): content centrerad med luft på sidorna
7. Mobil (375px): content fyller bredden, tab bar fixerad
8. Print: tab bar gömd
9. prefers-reduced-motion: inga transitions
10. prefers-contrast:more: starkare borders/text
11. axe-core: 0 violations
12. Playwright baselines (mobil + iPad + desktop)

**[GA] Tillägg (gap-analys):**
- Error boundary-hierarki: App-nivå (sista utväg med "Ladda om"), sektion-nivå (degradera sektion med retry-knapp: "Den här delen kunde inte laddas just nu. Försök igen."), widget-nivå (tyst degradering). Alla med Lotta-anpassade felmeddelanden
- Service worker med Workbox: Cache-first (bilder, fonts, app-shell), Network-first (API med `networkTimeoutSeconds: 3`), Offline fallback (`/offline.html`). Utöka skelett-SW från Fas 0
- `web-vitals` rapportering aktiverad: CLS, LCP, INP till Sentry/analytics via `sendBeacon` vid varje sidvisning
- TanStack Query offline-config: `staleTime: 5 * 60 * 1000`, `gcTime: 30 * 60 * 1000`. Vid offline: visa cachad data med timestamp-indikator ("Senast uppdaterat: 08:14")
- View Transitions implementation: `@view-transition { navigation: auto; }` i base.css. `startViewTransition()` vid tab-byte. `view-transition-name` på event-kort (lista → detalj). Se DESIGN-SYSTEM-SPEC.md §View Transitions
- Speculation Rules: prerender av `/hem` vid login. Prefetch vid hover på alla tab bar-länkar. Eagerness: `moderate` som default

**Uppskattad tid:** 1.5 sessioner. [GA] Utökad från 1 → 1.5 pga service worker + error boundaries.

**Risker:** safe-area-inset-bottom kräver viewport meta viewport-fit=cover. Bottom tab bar på desktop är ovanligt men konsekvent med iPad-först-design. [GA] Service worker caching kan orsaka stale content — TTL-strategi krävs.

---

### Fas 6: Hem + Event + Personer + Mer

**Mål:** Alla 4 flikar fungerande med live-data från Airtable via TanStack Query.

**Filer som skapas:**

Hem-fliken (Scenario 1: Morgonöverblick):
- `src/components/home/greeting.tsx` ("Hej Lotta" + statusmeddelande)
- `src/components/home/new-registrations.tsx` (lista med list-items)
- `src/components/home/info-cards.tsx` (1-2 kort: nästa event, obetalda)
- `src/components/home/primary-action.tsx` (stor CTA-knapp, som FK:s gröna)
- `src/routes/_authenticated/hem.tsx`

Event-fliken (Scenario 2+3: Betalning + Närvaro):
- `src/routes/_authenticated/event/index.tsx` (lista med event)
- `src/routes/_authenticated/event/$eventId.tsx` (detalj: anmälda, betalstatus, närvarohantering)

Personer-fliken (Scenario 4: "Vem var det som...?"):
- `src/routes/_authenticated/personer/index.tsx` (söklista)
- `src/routes/_authenticated/personer/$personId.tsx` (personkort + historik)

Mer-fliken:
- `src/routes/_authenticated/mer.tsx` (lista: Leads, Planera event, Mail, Inställningar, Logga ut)

TanStack Query:
- `src/queries/keys.ts` (query key factory)
- `src/queries/events.ts`
- `src/queries/registrations.ts`
- `src/queries/persons.ts`
- `src/hooks/use-dashboard-data.ts` (förenklad — deriverar status)

**Designkontext per vy:**

HEM: "Hej Lotta" (ren text, ingen animation). Under det: statustext ("3 nya anmälningar sedan igår" eller "Inga nya anmälningar — allt är lugnt"). 1–2 info-kort (nästa event med datum+beläggning, antal obetalda). En stor CTA-knapp (som FK:s gröna) — kontextuell: "Följ upp obetalda" om det finns obetalda, annars "Se alla event". Tom-state: "Inga nya anmälningar" — ren text, ingen illustration behövs.

EVENT: Rubrik "Event". Lista med event som list-items (namn, datum, beläggning-text). Klicka → event-detalj. Detalj-sidan: event-info topp + lista med anmälda (list-items med namn, betalstatus, datum). Tab-group "Anmälda / Betalning / Närvaro" om det behövs.

PERSONER: Rubrik "Personer". Sökfält (input-fält, inte SearchField-komponenten — bara ett `<input>` med `type="search"`). Lista med matchande personer. Klicka → personkort med all historik.

MER: Rubrik "Mer". Lista med list-items: Leads, Planera event, Mail, Inställningar. Längst ner: "Logga ut"-knapp (som FK bild 4).

**Beroenden:** Fas 5 (app-shell), Fas 3 (Button, MessageBox, StatusBadge, Skeleton, ListItem, TabGroup, Card, EmptyState).

**Verifiering:**
1. /hem: "Hej Lotta" + status + kort + CTA synligt
2. /hem: data hämtas via TanStack Query (inspektera DevTools)
3. /hem: loading → skeleton, error → message-box, empty → lugn text
4. /event: lista med event, klick → /event/[id]
5. /event/[id]: event-info + anmälda lista
6. /personer: sökfält + resultatlista, klick → /personer/[id]
7. /personer/[id]: personkort med historik
8. /mer: lista med 4-5 länkar + logga ut
9. Alla vyer: max-width 600px, centrerad
10. Alla vyer: fungerar på 375px, 768px, 1024px
11. axe-core: 0 violations per vy
12. Playwright baselines per vy

**[GA] Tillägg (gap-analys):**
- Optimistisk UI med `useMutation`: markera betalning, markera närvaro, skicka påminnelse. `onMutate` → optimistisk cache-uppdatering → `onError` → rollback + felmeddelande. Se `STATE-STRATEGY.md`
- Supabase Realtime-subscription i Hem-fliken: `supabase.channel('registrations').on('postgres_changes', { event: 'INSERT' }, () => queryClient.invalidateQueries({ queryKey: ['registrations'] }))`
- `nuqs` för URL-state: Event (`?status=upcoming&sort=date`), Personer (`?q=sökterm&page=2`), Event-detalj (`?tab=payments`). Se `URL-STATE-SPEC.md`
- `useDeferredValue` för person-sökning — visa "Söker..." skeleton under övergång. Förhindrar INP-problem vid 500+ personer
- Systemhälso-indikator i Hem-vyn: "Senast synkroniserat: 08:14" + "234 anmälningar sedan start. 0 tappade." (manifestets transparens-princip, gap-analysens "förtroendeackumulering")
- Stale-while-error felmeddelanden: "Vi kunde inte hämta anmälningarna just nu. Senaste versionen (från kl 07:52) visas nedan. Vi försöker igen automatiskt." (inte bara "Något gick fel")

**Uppskattad tid:** 3.5 sessioner. [GA] Utökad från 3 → 3.5 pga optimistic UI + realtime.

**Risker:** Adapter-metoderna fetchEvents/fetchRegistrations/fetchPersons fungerar. Övriga 9 är TODO. Hem-vyn använder bara de 3 fungerande. [GA] Supabase Realtime kräver att Airtable-ändringar propageras till Supabase — i nuvarande arkitektur med Airtable som primär DB fungerar Realtime bara om Edge Functions triggar Supabase-events.

---

### Fas 6.5: Aktivitetslogg

**Styrande dokument:** `docs/features/FEATURE-ACTIVITY-LOG.md`

**Beroenden:** Fas 6 (mutations i adaptern), Airtable-tabell "Aktivitetslogg"

**Estimat:** 2 sessioner

Automatisk loggning av alla relevanta användarhandlingar. Ger Lotta en historisk vy över allt hon gjort — betalningar, anmälningar, mail, närvaro.

**[GA] Tillägg (gap-analys):**
- Designa aktivitetslogg med xAPI-inspirerat schema: `{ actor_id, verb, object_id, object_type, result, timestamp, context, trace_id }`. Kompatibelt med framtida LRS-migrering för Passionslyftet. Se `FUTURE-COMPAT.md`
- `trace_id` i varje loggpost — genereras i frontend (`crypto.randomUUID()`), skickas med till Edge Function. Möjliggör end-to-end-felsökning via Sentry
- GDPR retention policy: 12 månaders data, sedan anonymisering. Dokumenteras explicit i feature-specen
- Aktivitetsloggen som berättelse (Apple-mönster): "Denna vecka har systemet hanterat 12 anmälningar, skickat 3 påminnelser. 0 fel." — inte bara en lista med händelser

---

### Fas 7: Konsolidering + kvalitetssäkring (+ DataTable om behövs)

**Mål:** Friction logs, design audits, dokumentation. Eventuellt DataTable.

Om event-detaljsidan behöver en tabell (alla anmälningar med sort + filter) istället för listor — bygg DataTable här. Annars elimineras den helt. Beslut tas baserat på hur listorna fungerar i Fas 6.

**Filer som skapas/uppdateras:**
- Eventuellt `src/components/ui/data-table.tsx` (TanStack Table + React Aria, se Fas 4 i v1)
- `docs/phases/fas-0-through-6-leverabler.md`
- `docs/audits/YYYY-MM-DD-hem-design-audit.md`
- `docs/audits/YYYY-MM-DD-event-design-audit.md`
- `docs/audits/YYYY-MM-DD-app-shell-design-audit.md`
- Friction logs per vy
- Eliminationslistor per fas
- Beteendespecifikationer per vy

**Beroenden:** Alla tidigare faser.

**Verifiering:**
1. Alla 18 routes fungerar (navigeringsbar)
2. Auth guard: alla skyddade routes kräver inloggning
3. TanStack Query DevTools: inga orphan-queries
4. [GA] Biome: noll fel (`npx @biomejs/biome check .`)
5. TypeScript: noll fel
6. Lighthouse Accessibility ≥ 95 på alla fungerande vyer
7. axe-core: 0 critical, 0 serious
8. Playwright baselines: alla vyer, desktop + mobil
9. Design audit (skill) på: DashboardView, MinaSidorView, AdminShell
10. Friction log: varje vy genomgången (Operating System §III)

**[GA] Tillägg (gap-analys):**
- CSP Level 3 implementation: `script-src 'nonce-{RANDOM}' 'strict-dynamic'; object-src 'none'; base-uri 'none'`. Nonce via Vite plugin (dev) eller Vercel `_headers`/Edge Middleware (prod). Se `SECURITY-SPEC.md`
- Trusted Types: DOMPurify-policy för alla innerHTML-tilldelningar. Default policy som fångar tredjepartsbibliotek. Start i report-only-läge
- Säkerhetsheaders i deploy-config: COOP, COEP, Permissions-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS. Se `SECURITY-SPEC.md §3`
- `@axe-core/playwright` automatiserad a11y-testning i varje Playwright-test: `expect(await new AxeBuilder({ page }).analyze()).toHaveNoViolations()`
- Manuell skärmläsartest: VoiceOver (macOS) genomgång av alla 4 flikar + login. Dokumentera resultat i `docs/audits/`. Se `ARIA-UPGRADE.md §4`
- Chaos testing i Playwright: `page.route('**/api/**', route => route.abort())` → verifiera att Lotta-anpassade felmeddelanden visas (inte blank skärm)
- Deploy-pipeline: Vercel + preview-deployment per PR + `npm audit` + `biome check` + `tsc --noEmit` + Playwright
- "Golden Master"-testdag: testa på 320px, offline, VoiceOver, `prefers-contrast:more`, tom data, överfull data, expired auth. Varje avvikelse dokumenteras. Se `DESIGN-OPERATING-SYSTEM.md §8`
- Background Sync för offline-närvaro: markera närvaro lokalt → synka automatiskt vid uppkoppling. Se `STATE-STRATEGY.md §6`
- Supply chain audit: lockfile-verifiering, beroendeminimerering, `npm audit` i CI. Se `SECURITY-SPEC.md §4`
- Granska React 19 mot kända sårbarheter (React2Shell CVE-2025-55182 — SPA utan Server Actions, men explicit verifiering krävs). Se `SECURITY-SPEC.md §6`

**Uppskattad tid:** 3 sessioner. [GA] Utökad från 2 → 3 pga säkerhet + chaos testing + deploy.

---

### [GA] Fas 8: Framtida förbättringar

**Mål:** Features som identifierats som värdefulla men som inte ingår i initial release.

1. **Passkeys/WebAuthn:** Supabase passkey-stöd (experimentellt). FaceID/TouchID → eliminera lösenord helt. SimpleWebAuthn-implementation. Migrationsväg från password till passkey.
2. **Push-notifieringar:** `web-push` + Supabase Database Webhooks + Service Worker. "3 nya anmälningar till Rönninge-eventet." Max 3-5 push/vecka, event-baserade > broadcast. Se `FUTURE-COMPAT.md §8`
3. **Avancerad offline:** Background Sync för ALLA mutationer (inte bara närvaro). Offline-kö med IndexedDB. Full offline-förmåga för event-dag-scenariot. Conflict resolution: last-write-wins med timestamp
4. **Aktivitetslogg som LRS:** Migrera xAPI-inspirerat schema till dedikerad Supabase-tabell. Analytics-dashboard. Kompetenskartor för framtida Passionslyftet-integration

**Beroenden:** Alla tidigare faser.

**Prioritering:** Passkeys (P1 — löser Lottas inloggningsrädsla), Push (P2), Offline (P3), LRS (P4).

---

## E. Composable → Hook-mappning

### Beteendeprimitiver (🔴 ERSÄTTS)

| Vue composable | Vad den gör | React-ersättning | Specialbehandling |
|----------------|-------------|-------------------|-------------------|
| **useId** (60r) | Globalt id med prefix | `React.useId()` | React.useId() ger `":r0:"` format. Om prefix behövs: `const id = useId(); return `${prefix}-${id}`;` |
| **useScrollLock** (149r) | Referensräknad body scroll-lås | `react-remove-scroll` paket | Drop-in: `<RemoveScroll>` wrapper. Hanterar iOS-edge-cases som vår version saknar. |
| **useControllable** (216r) | Controlled/uncontrolled dual-mode med Vue 3 boolean-casting-fix | `const [value, setValue] = useState(defaultValue); const isControlled = externalValue !== undefined;` | **Hela problemet försvinner.** React har inte boolean casting. 216 rader → ~15 rader. getCurrentInstance() behövs aldrig. |
| **usePresence** (209r) | Animerad exit med transitionend-detektering | Motion `AnimatePresence` | AnimatePresence hanterar exit-animation automatiskt. `prefers-reduced-motion` hanteras via Motion `reducedMotion="user"`. |
| **useFocusScope** (319r) | Fokus-fälla med inert, Tab-cycling, sentinel-baserad | React Aria `FocusScope` | `<FocusScope contain restoreFocus autoFocus>`. Inert hanteras automatiskt. 319 rader → 1 komponent. |
| **useDismissable** (228r) | Lager-stack, Escape, click-outside | React Aria `useOverlayTrigger` + `DismissButton` | Lager-stacken hanteras av React Arias overlay-system. `<DismissButton>` för skärmläsare. |
| **useCollection** (185r) | DOM-ordnad item-registrering via provide/inject | `@react-stately/collections` | React Stately hanterar collection-mönstret. Kolumner registreras via JS-objekt, inte DOM. |
| **useRovingFocus** (283r) | Arrow-navigering, wrapping, disabled-skip | React Aria `useFocusManager` | `focusManager.focusNext({ wrap: true })`. Hanterar disabled, orientation, Home/End. |
| **useTypeAhead** (271r) | Buffrad tangenttryckning, cykling, unicode (sv-SE) | Inbyggd i React Aria `useSelect`, `useListBox`, `useComboBox` | React Aria stöder 30+ språk nativt. Vår sv-SE `toLocaleLowerCase`-logik är redan inbyggd. |
| **useAsyncData** (21r) | Loading/error-wrapper kring fetcher | TanStack Query `useQuery` | `const { data, isLoading, error } = useQuery(queryOptions)`. Plus: cache, prefetch, background refetch gratis. |

### App-specifika (🟡 PORTAS)

| Vue composable | Vad den gör | React hook | Specialbehandling |
|----------------|-------------|-----------|-------------------|
| **useAuth** (82r) | Supabase auth med module-level singleton | `AuthProvider` + `useAuth()` hook | Module-level refs → `useState` i Provider. `onAuthStateChange` → `useEffect` med cleanup. `waitForInit()` → `isLoading` state. |
| **useDashboardData** (75r) | Deriverar kommande events, nya anmälningar, obetalda | `useDashboardData()` med `useMemo` | `computed` → `useMemo`. Alternativt: TanStack Query `select` option per query. |
| **useDataSource** (19r) | Provide/inject för DataSourceAdapter | `DataSourceProvider` + `useDataSource()` | `provide/inject` → `React.createContext` + `useContext`. |
| **useUserDisplayName** (28r) | Mappar email → namn | `useUserDisplayName()` med `useMemo` | `computed` → `useMemo`. |
| **useResizable** (161r) | PointerEvent-baserad resize med localStorage | — | **Eliminerad.** Ingen sidebar i FK-designen. |

Eliminerade: useAnimatedCounter (inga animationer i FK-designen), useResizable (ingen sidebar).

### Utilities (🟢 RAKT AV)

| Fil | Vad den gör | Migration |
|-----|-------------|-----------|
| **alertScreenReader** (172r) | Skapar aria-live-region, skriver meddelande, rensar efter 1s | Kopieras rakt av. Noll Vue-beroenden. |
| **focusUtils** (90r) | Hittar tabbable elements i en container | Kopieras rakt av. Noll Vue-beroenden. |

### Buggfixar/workarounds att beakta

| Vue-workaround | Fil:rad | Finns i React? |
|----------------|---------|----------------|
| `getCurrentInstance().vnode.props` för boolean-casting | useControllable:116 | **Nej** — problemet existerar inte |
| `void el.offsetHeight` för tvingad reflow | AppMenu:450 | **Ja** — samma trick behövs |
| `nextTick` för DOM-synk (12 st) | Diverse | **useEffect** hanterar detta |
| `splice istället för pop` i dismiss-stack | useDismissable:151 | React Arias overlay-system hanterar |
| `transitionend bubblar` — target-check | usePresence:120 | Motion AnimatePresence hanterar |
| `pointerdown istället för click` | useDismissable:185 | React Arias useDismiss gör detta |

---

## F. Token-migration

### 1. Tre prefix → ett prefix

| Vue-prefix | Antal | Nytt prefix | Lager |
|------------|-------|-------------|-------|
| `--miranon-*` | 19 | `--p-*` (primitiv) | Primitives.css |
| `--fkds-*` | 21 | `--mm-*` (semantisk) | Semantic.css |
| `--f-*` | 9 | Integrerade i `--p-*` | Primitives.css |

### 2. Mappning: main.scss → DESIGN-SYSTEM-SPEC tokens

| Vue (main.scss) | React (primitives.css / semantic.css) |
|-----------------|---------------------------------------|
| `--miranon-primary: #D4960A` | `--p-gold-500: #D4960A` → `--mm-primary: var(--p-gold-500)` |
| `--miranon-primary-tint: #FBF3E0` | `--p-gold-100: #FBF3E0` → `--mm-primary-tint: var(--p-gold-100)` |
| `--miranon-primary-dark: #8E5F07` | `--p-gold-700: #96680A` ¹⁰ |
| `--miranon-copper: #A3491C` | `--p-copper-500: #A3491C` → `--mm-accent: var(--p-copper-500)` |
| `--miranon-ink: #242424` | `--p-neutral-900: #242424` → `--mm-text: var(--p-neutral-900)` |
| `--miranon-focus-ring: #1B4965` | `--mm-focus-ring: var(--p-gold-500)` ¹¹ |
| `--fkds-color-text-primary` | `--mm-text` |
| `--fkds-color-text-secondary: #636363` | `--mm-text-secondary: var(--p-neutral-600)` |
| `--fkds-color-border-default: #d4d4d4` | `--mm-border: var(--p-neutral-200)` |

¹⁰ **BESLUT (2026-04-13):** `--p-gold-700: #96680A` enligt DESIGN-SYSTEM-SPEC. Vues `--miranon-primary-dark: #8E5F07` övergivs.

¹¹ **BESLUT (2026-04-13):** Fokusring är mörkblå `#1B4965` via `--p-blue-700`. DESIGN-SYSTEM-SPEC uppdaterad — `--mm-focus-ring: var(--p-blue-700)`. Motivering: fokusring-färg ska vara exklusiv och inte användas till något annat (Vue-projektets lessons.md).

### 3. Tailwind-generering

`@theme`-blocket (DESIGN-SYSTEM-SPEC §8) i `src/styles/tailwind.css` refererar
semantiska tokens via `var()`:

```css
@import "tailwindcss";

@theme {
  --color-primary: var(--mm-primary);   /* → bg-primary, text-primary */
  --color-accent: var(--mm-accent);     /* → bg-accent, text-accent */
  /* ... */
}
```

En komponent skriver: `className="text-primary bg-surface"` — aldrig `text-[#D4960A]`.

### 4. Lint-regler mot hårdkodade värden

Från DESIGN-SYSTEM-SPEC §4:

| Regel | Vad den fångar | Prio |
|-------|---------------|------|
| [GA] Biome `tailwindcss/classnames-order` | Inkonsekvent Tailwind-klassordning | Hög |
| [GA] Biome `noArbitraryValue` (custom) | `text-[19px]`, `bg-[#D4960A]` | Hög |
| [GA] Biome CSS lint (custom) | Hex-värden i CSS-filer | Hög — Fas 7 |
| `mm/no-hardcoded-colors` (custom) | Hex i className eller style | Hög — Fas 7 |

### 5. Token-lager i Tailwind v4

```
primitives.css    →  Råvärden: --p-gold-500, --p-neutral-900, --p-space-4
                     Aldrig refererade i @theme eller komponenter direkt.

semantic.css      →  Mening: --mm-primary: var(--p-gold-500)
                     Refererade i @theme-blocket i tailwind.css:
                       --color-primary: var(--mm-primary)
                     Genererar utilities: bg-primary, text-primary, border-primary

components.css    →  Komponentspecifik: --mm-stat-card-bg: var(--mm-surface)
                     Refererade i komponentens CSS eller Tailwind-klasser.

base.css          →  Global reset, fokusregel, typografi-defaults.
                     Importerar tokens: `@import './tokens/primitives.css'` etc.

tailwind.css      →  `@import "tailwindcss"` + `@theme { ... }`-block.
                     Ersätter tidigare tailwind.config.ts (beslut 2026-04-13).
```

---

## G. Kvalitetssäkring

### 1. Kvalitetsbedömning per fas (Operating System §IV)

Varje fas som producerar UI avslutas med bedömning i 4 dimensioner:

| Dimension | Fas 3 (UI) | Fas 5 (Shell) | Fas 6 (Vyer) |
|-----------|-----------|--------------|--------------|
| Tillgänglighet | Per komponent | Tab bar, skip-link | Alla 4 flikar |
| Teknisk kvalitet | Tokens, inga hårdkodade | Route announcer, responsive | Query-integration |
| Återanvändbarhet | Props + i18n | Children-baserad | Query options |
| Craft | Alla states | Tab-markering, empty-state | Loading→data flow |

**Minimum-poäng (Operating System §V):** 4/5 per dimension. Allt under 4 blockerar fasen.

### 2. De sju arbetsstegen i fasplanen

Stegen (Operating System §I) integreras så:

| Steg | När | Leverabel | Sparas i |
|------|-----|-----------|----------|
| 1. Orsakskedja | Fas 5 + Fas 6 | Klartext: varför → verkan → beteende | `docs/phases/fasN-orsakskedja.md` |
| 2. Scenario | Fas 5 + Fas 6 | Lottas ögonblick (scenariodriven) | `docs/phases/fasN-scenario.md` |
| 3. Eliminering | Varje fas | Vad vi medvetet INTE bygger | `docs/phases/fasN-elimination.md` |
| 4. Beteendeprinciper | Fas 5 + Fas 6 | 3–5 testbara regler | `docs/phases/fasN-beteende.md` |
| 5. Struktur + subtraktion | Varje fas | Minimal fungerande struktur | Koden själv |
| 6. Sensorisk kalibrering | Fas 5 + Fas 6 | Temperatur, rytm, volym, textur | Design-audit-rapporten |
| 7. Stresstest | Fas 5 + Fas 6 + Fas 7 | Verifierat under sämre förhållanden | Friction log |

**Fas 0–2 (infrastruktur)** kör bara steg 3 (eliminering) — ingen UI att granska.
**Fas 3–4 (komponenter)** kör steg 3 + 5 — subtraktion vid komponentdesign.
**Fas 5–6 (shell + dashboard)** kör alla 7 steg — fullständig arbetsordning.

### 3. Playwright screenshot-baselines

Från DESIGN-SYSTEM-SPEC §6. Skapas vid fas-avslut:

| Fas | Baselines |
|-----|-----------|
| Fas 3 | button.png (alla varianter), dialog.png (open/closed), message-box.png (4 typer), list-item.png, tab-group.png, card.png |
| Fas 5 | app-shell-desktop.png, app-shell-mobile.png, tab-bar.png, empty-state.png |
| Fas 6 | hem-loading.png, hem-data.png, event-list.png, event-detail.png, personer.png, mer.png |

Config: `maxDiffPixelRatio: 0.01`, `threshold: 0.2`, `animations: disabled`.

### 4. Design-audit skill

Från DESIGN-SYSTEM-SPEC §5. Körs vid fas 5 + 6 + 7 avslut:

```
/design-audit route=/hem
```

Producerar rapport i `docs/audits/YYYY-MM-DD-{vy}-design-audit.md` med:
- 11/11/11/11-bedömning (tillgänglighet, teknik, återanvändbarhet, craft)
- Typografi-tabell (förväntat vs uppmätt)
- Spacing-tabell
- Färg-tabell
- Manifestcheck (9 principer)
- Åtgärdspunkter

### 5. Eliminationslistor

Obligatoriskt dokument per fas (Operating System §II). Format:

```markdown
## Fas N: Eliminationslista

### Medvetet inte byggt
- [funktion] — [varför]

### Medvetet förenklat
- [funktion] — [hur förenklat] — [varför räcker det]

### Framtida prövning
- [funktion] — [när det ev. behövs]
```

### 6. Friction logs

Protokoll (Operating System §III): öppna som Lotta, gå igenom scenario, markera varje tvekan.

| Fas | Friction log | Scenario |
|-----|-------------|----------|
| Fas 5 | `docs/phases/fas5-friction-log.md` | Öppna appen → navigera flikar → byt vy → stäng |
| Fas 6 | `docs/phases/fas6-friction-log.md` | Morgonöverblick: öppna → scanna status → identifiera obetalda → klicka |
| Fas 7 | `docs/phases/fas7-friction-log.md` | Hela flödet: login → mina sidor → dashboard → navigation |

Kategorier: Utility, Usability, Craft, Beauty.

### 7. Beslutsregler (Operating System §VI)

Vid designbeslut under implementation, i ordning:
1. Minskar kognitiv belastning?
2. Gör nästa steg tydligare?
3. Kräver minst förklaring?
4. Fungerar under sämre förhållanden?
5. Stärker systemet?
6. Mindre yta vid likvärdiga alternativ.

### 8. Definition av "klart" per fas (Operating System §VIII)

En fas är INTE klar när den fungerar. Den är klar när:
- [ ] Eliminationslistan finns
- [ ] Beteendeprinciperna är skrivna (fas 5+6)
- [ ] Strukturen har subtraherats (varje element har ett jobb)
- [ ] Stresstest är gjort (tangentbord, skärmläsare, mobil, tom data, reducerad rörelse)
- [ ] Friction log är genomförd (fas 5+6+7)
- [ ] Playwright baselines skapade
- [ ] Design audit genomförd (fas 5+6+7)
- [ ] Kvarvarande skuld är känd och dokumenterad
- [ ] `npx tsc --noEmit` — noll fel
- [ ] `npm run lint` — noll fel
- [ ] axe-core — 0 critical, 0 serious

---

## H. Edge cases och kända problem

### Vue-workarounds → React

| # | Vue-workaround | Fil | React-situation |
|---|----------------|-----|-----------------|
| 1 | `getCurrentInstance().vnode.props` (boolean casting) | useControllable:116 | **Löst.** React har inte boolean casting. `undefined`-check räcker. |
| 2 | `void el.offsetHeight` (tvingad reflow) | — | **Troligen ej aktuell.** Ingen sidebar med collapse-animation. Om CSS-transition-trigger behövs för annan komponent: samma trick fungerar i React. |
| 3 | `nextTick()` ×12 (DOM-synk) | Diverse | **Löst.** `useEffect` kör efter render → DOM finns. `flushSync` för synkron DOM-uppdatering om absolut nödvändigt. |
| 4 | `transitionend` bubblar | usePresence:120 | **Löst.** Motion AnimatePresence hanterar exit-animation utan manuella event-listeners. |
| 5 | `pointerdown` istället för `click` | useDismissable:185 | **Löst.** React Aria `useOverlayTrigger` använder `pointerdown` internt. |
| 6 | Module-level singleton (useAuth) | useAuth:9-15 | **Portas.** React Context Provider. Alternativ: Zustand store (om global state behövs utanför komponentträd). |
| 7 | `setTimeout` ×13 | Diverse | **Alla behöver cleanup.** Varje `setTimeout` i en `useEffect` måste ha `clearTimeout` i cleanup-funktionen. |
| 8 | `provide/inject` bevaras genom Teleport | MmDialog:233 | **Ändras.** `createPortal` bevarar INTE React Context. Men React Arias Dialog renderar via portal + bevarar context — inget problem om React Aria Dialog används. |

### React-specifika gotchas

| # | Gotcha | Risk | Mitigation |
|---|--------|------|------------|
| 1 | **useEffect dependency array** | Glömd dependency → stale closure | Biome `useExhaustiveDependencies` (obligatorisk, ersätter ESLint react-hooks/exhaustive-deps) |
| 2 | **Stale closures i setTimeout** | Timer refererar gammal state | `useRef` för mutable values, eller Motion-alternativ |
| 3 | **Double mount i StrictMode** | useEffect kör 2× i dev | Designa alla effects idempotent. Auth-subscription hanteras med cleanup. |
| 4 | **Re-renders vid Context-ändring** | Hela trädet re-renderar | Splitta providers: AuthProvider, DataSourceProvider, QueryProvider separat. useMemo på context-värde. |
| 5 | **TanStack Router + Query hydration** | Route-transition blockerar om ensureQueryData är långsam | Använd `prefetchQuery` (non-blocking) för sekundär data. `ensureQueryData` bara för kritisk data. |
| 6 | **createPortal vs Context** | Portal-renderade element tappar Context | Använd React Aria Dialog som hanterar detta internt. Om manuell portal behövs: wrappa i Provider. |
| 7 | **Event.ts namnkollision** | `Event` interface vs DOM `Event` | Explicit import: `import type { Event as MiranonEvent } from './domain/models/Event'` |

---

## I. Prompts till Claude Code

### Fas 0: Projektsetup + tokens

```
Effort: max

Du ska sätta upp ett nytt React-projekt i ~/Repon/miranon-media-admin.

LÄS FÖRST (från Vue-repot):
- ~/Repon/miranon-media-os/docs/react-migration/DESIGN-SYSTEM-SPEC.md (token-arkitektur, @theme-block, lint-config, Playwright-config)
- ~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md (sektion B: Repo-struktur)

GÖR:
1. Skapa repot: `mkdir ~/Repon/miranon-media-admin && cd ~/Repon/miranon-media-admin && git init`
2. Kör: `npm create vite@latest . -- --template react-ts`
3. Installera dependencies:
   npm install react@^19 react-dom@^19 @tanstack/react-router @tanstack/router-plugin @tanstack/react-query @tanstack/react-query-devtools @tanstack/react-table react-aria-components @react-aria/focus @react-aria/overlays @react-aria/utils @react-stately/collections @supabase/supabase-js lucide-react motion class-variance-authority clsx tailwind-merge react-remove-scroll zod @t3-oss/env-core web-vitals @sentry/react
   npm install -D tailwindcss@^4 @tailwindcss/vite @biomejs/biome @playwright/test typescript @types/react @types/react-dom
   OBS: ingen `postcss`, `autoprefixer` eller `tailwind.config.ts`. Tailwind v4 via `@tailwindcss/vite` + `@theme`-block i CSS. Lightning CSS (inbyggt) hanterar vendor prefixing.
4. Skapa EXAKT denna mappstruktur (se conversion-plan.md sektion B) — OBS: ingen use-resizable.ts eller use-animated-counter.ts
5. Skapa token-filer — kopiera EXAKT från DESIGN-SYSTEM-SPEC.md:
   - src/styles/tokens/primitives.css (sektion 1, "Primitiva tokens")
   - src/styles/tokens/semantic.css (sektion 1, "Semantiska tokens")
   - src/styles/tokens/components.css (sektion 1, "Komponent-tokens")
6. Skapa src/styles/base.css:
   - Importera alla token-filer
   - Google Fonts Inter (variabel font opsz 14-32, wght 300-700)
   - Global fokusregel (kopieras från Vue: *:focus:not(:focus-visible) { outline: none } + *:focus-visible)
   - HTML/body reset, box-sizing
   - Heading font-variation-settings: "opsz" 32
7. Skapa src/styles/tailwind.css — kopiera EXAKT från DESIGN-SYSTEM-SPEC.md sektion 8 (`@import "tailwindcss"` + `@theme`-block). Ingen tailwind.config.ts.
8. Skapa biome.json — [GA] Biome 2.0 med Tailwind classnames-order. Kör: `npx @biomejs/biome init`
   Aktivera: recommended rules, Tailwind-plugin (classnames-order), format (indent: tab → space 2), organizeImports
9. Skapa playwright.config.ts — kopiera från DESIGN-SYSTEM-SPEC.md sektion 6
10. Skapa src/lib/cn.ts:
    ```ts
    import { clsx, type ClassValue } from 'clsx';
    import { twMerge } from 'tailwind-merge';
    export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
    ```
11. [GA] Skapa src/lib/report-web-vitals.ts:
    - Importera { onCLS, onLCP, onINP } från 'web-vitals'
    - Rapportera till Sentry via `navigator.sendBeacon()` (fallback: fetch)
    - Aktiveras via `reportWebVitals()` anrop i main.tsx
12. [GA] Skapa src/env.ts:
    - Importera { createEnv } från '@t3-oss/env-core'
    - Validera VITE_SUPABASE_URL (z.string().url()) och VITE_SUPABASE_ANON_KEY (z.string().min(1))
    - Kraschar vid uppstart om variabel saknas (inte runtime)
13. [GA] Skapa public/sw.js:
    - Tom service worker-skelett: `self.addEventListener('install', () => self.skipWaiting())`
    - Utökas med Workbox i Fas 5
14. Skapa src/main.tsx:
    - Minimal — renderar "Miranon Media Admin" med text-primary
    - [GA] Registrerar service worker: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`
    - [GA] Anropar reportWebVitals()
15. Skapa .env.local:
    VITE_SUPABASE_URL=https://lvjsfnphlauldxqlncpl.supabase.co
    VITE_SUPABASE_ANON_KEY=(kopiera från ~/Repon/miranon-media-os/.env.local)
16. Skapa vite.config.ts med @vitejs/plugin-react + @tailwindcss/vite + @tanstack/router-plugin/vite (+ [GA] security headers-plugin med CSP-nonce)
17. Skapa .claude/settings.json — kopiera från ~/Repon/miranon-media-os/.claude/settings.json

VERIFIERA:
- npm run dev → startar utan fel (bekräftar @tailwindcss/vite fungerar utan postcss)
- npm run build → bygger utan varningar
- npx tsc --noEmit → 0 fel
- [GA] npx @biomejs/biome check . → 0 fel
- Inspektera genererad CSS: utility-klasserna `text-primary`, `bg-surface`, `text-caption`, `text-text-secondary`, `font-sans` existerar
- Inspektera :root i DevTools: --mm-primary resolvar till #D4960A och @theme-vars (t.ex. --color-primary) exponeras som CSS-vars
- text-primary i className → korrekt guld-färg; text-body → 1rem/line-height 1.5; font-sans → Inter
- [GA] navigator.serviceWorker.controller !== null i DevTools (efter reload)
- [GA] web-vitals: `import { reportWebVitals }` kompilerar utan fel
- [GA] Ta bort VITE_SUPABASE_URL → uppstartsfel (env-validering fungerar)
- [GA] npm audit --audit-level=high → 0 high/critical
- git init && git add -A && git commit -m "fas 0: projektsetup + tokens"
```

### Fas 1: Domäntransplant

```
Effort: high

Du ska kopiera domän- och data-lager + styrfiler från Vue-repot till React-repot.

LÄS FÖRST:
- ~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md (sektion C + C2: Transplant-inventering)
- ~/Repon/miranon-media-os/docs/react-migration/FILE-INVENTORY.md (kopieringsscript)

GÖR:

0. [FI] Kopiera docs, tasks och settings (kopieringsscriptet från FILE-INVENTORY.md):
   Kör bash-scriptet i sektion "Kopieringslista" i FILE-INVENTORY.md med DRY_RUN=0:
   DRY_RUN=0 bash ~/Repon/miranon-media-os/docs/react-migration/FILE-INVENTORY.md
   (Alternativt: extrahera scriptet till en .sh-fil och kör den)
   OBS: Scriptet kopierar docs, tasks, settings, supabase — MEN INTE src-filer (de kopieras nedan)

1. Kopiera domain/ (10 filer, kopieras utan ändring):
   cp -r ~/Repon/miranon-media-os/src/domain/ ~/Repon/miranon-media-admin/src/domain/

2. Kopiera data/ (4 filer):
   cp -r ~/Repon/miranon-media-os/src/data/ ~/Repon/miranon-media-admin/src/data/

3. Kopiera utilities (2 filer):
   cp ~/Repon/miranon-media-os/src/composables/alertScreenReader.ts ~/Repon/miranon-media-admin/src/lib/alert-screen-reader.ts
   cp ~/Repon/miranon-media-os/src/composables/focusUtils.ts ~/Repon/miranon-media-admin/src/lib/focus-utils.ts

4. Kopiera favicon och logotyp manuellt:
   cp -r ~/Repon/miranon-media-os/public/favicon/ ~/Repon/miranon-media-admin/public/favicon/
   cp ~/Repon/miranon-media-os/src/assets/miranon-logo.svg ~/Repon/miranon-media-admin/public/miranon-logo.svg

5. Uppdatera import-sökvägar i data/-filer (de refererar ../domain/ som nu är src/domain/)

VERIFIERA:
- npx tsc --noEmit → 0 fel
- Alla typer resolvar: skapa en testfil som importerar Event, Registration, Person
- AirtableAdapter instantieras utan runtime-fel
- alertScreenReader('test') skapar aria-live-element i DOM (testa i browser console)
- git add -A && git commit -m "fas 1: domäntransplant"
```

### Fas 2: Routing + Auth

```
Effort: max

Du ska bygga routing med TanStack Router och auth med Supabase.

LÄS FÖRST:
- ~/Repon/miranon-media-os/src/router/index.ts (alla routes, auth guard, redirects)
- ~/Repon/miranon-media-os/src/composables/useAuth.ts (auth-logik)
- ~/Repon/miranon-media-os/src/composables/useDataSource.ts (provide/inject)
- ~/Repon/miranon-media-os/src/App.vue (provider-uppsättning)
- ~/Repon/miranon-media-os/src/views/LoginView.vue (login-formulär)
- ~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md (sektion D: Fas 2, sektion E: useAuth/useDataSource)

GÖR:
1. Skapa src/providers/auth-provider.tsx:
   - React Context med { user, isLoading, error, isAuthenticated, login, logout }
   - Supabase onAuthStateChange i useEffect med cleanup
   - signInWithPassword + signOut
   - Exponera useAuth() hook

2. Skapa src/providers/data-source-provider.tsx:
   - React Context med DataSourceAdapter
   - Instansierar AirtableAdapter
   - Exponera useDataSource() hook

3. Skapa src/providers/query-provider.tsx:
   - QueryClient med defaultOptions
   - QueryClientProvider + ReactQueryDevtools

4. Skapa src/app.tsx:
   - Mountar alla providers: QueryProvider > AuthProvider > DataSourceProvider > RouterProvider

5. Skapa route-filer (TanStack Router file-based):
   - src/routes/__root.tsx (global layout, providers i context)
   - src/routes/_authenticated.tsx (auth guard + app-shell med tab bar)
   - src/routes/login.tsx (portat från LoginView.vue: formulär, felmeddelande, redirect vid lyckat login)
   - src/routes/index.tsx (redirect → /hem)
   - src/routes/_authenticated/hem.tsx (placeholder: h1 + "Hem")
   - src/routes/_authenticated/event/index.tsx (placeholder: h1 + "Event")
   - src/routes/_authenticated/event/$eventId.tsx (placeholder: h1 + "Event-detalj")
   - src/routes/_authenticated/personer/index.tsx (placeholder: h1 + "Personer")
   - src/routes/_authenticated/personer/$personId.tsx (placeholder: h1 + "Person-detalj")
   - src/routes/_authenticated/mer.tsx (placeholder: h1 + "Mer")

6. Alla routes ska ha route.meta med title
7. Auth guard i _authenticated.tsx: beforeLoad → om ej autentiserad, redirect till /login
8. Login-route: om redan inloggad, redirect till /hem

VERIFIERA:
- /login visar formulär med email + lösenord
- Inloggning → redirect till /hem
- /hem, /event, /personer, /mer — alla renderar placeholder
- /event/[id] och /personer/[id] — dynamiska routes fungerar
- Logga ut → redirect till /login
- Ej inloggad + direktnavigering → /login
- Tab bar visar 4 flikar, aktiv markerad
- document.title ändras per route
- TanStack Router DevTools visar alla routes
- npx tsc --noEmit → 0 fel
- git add -A && git commit -m "fas 2: routing + auth"
```

### Fas 3: UI-primitiver

```
Effort: max

Du ska bygga bas-UI-komponenterna med React Aria + Tailwind + CVA.

LÄS FÖRST (från Vue-repot — studera mönstren, bygg sedan eget med React idiom):
- ~/Repon/miranon-media-os/src/components/core/MmButton.vue (props, variants)
- ~/Repon/miranon-media-os/src/components/core/MmMessageBox.vue (4 typer, role="alert")
- ~/Repon/miranon-media-os/src/components/core/StatusBadge.vue (configMap-mönster)
- ~/Repon/miranon-media-os/src/components/features/dashboard/DashboardSkeleton.vue (aria-busy, animate)
- ~/Repon/miranon-media-os/src/components/library/MmDialog/MmDialog.vue (composable-orkestrering)
- ~/Repon/miranon-media-os/src/components/library/MmDialog/types.ts (props, emits)
- ~/Repon/miranon-media-os/src/components/library/MmDialog/mm-dialog.css (17 CSS custom properties)
- ~/Repon/miranon-media-os/docs/react-migration/DESIGN-SYSTEM-SPEC.md (komponent-tokens)
- ~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md (sektion E: composable→hook-mappning)

GÖR (en komponent åt gången, verifiera efter varje):

DESIGNKONTEXT (läs innan du bygger):
Varje komponent byggs för Lotta — en icke-teknisk person vars största rädsla
är att inte förstå. Varje komponent ska vara omedelbart begriplig.

- MmButton: Lottas viktigaste interaktionspunkt. Tydlig, stor nog för touch,
  omedelbar visuell feedback vid klick. Hover-state ska inbjuda, inte skrämma.
- MmDialog: Lotta stänger aldrig en dialog med Escape. Hon letar efter X-knappen.
  Den ska vara stor och tydlig. Dialogen ska aldrig visa mer än en handling åt gången.
- MmMessageBox: Lottas trygghetssignal. Grön = allt är bra (hon andas ut).
  Orange = något behöver uppmärksamhet (inte panik). Röd = något gick fel
  (tydlig förklaring + vad hon ska göra).
- StatusBadge: Lotta tänker inte i "pending/confirmed/cancelled". Hon tänker i
  "har betalat / har inte betalat / har avbokat". Synliga, svenska ord.

21ST COMPONENT PIPELINE (kör för VARJE komponent):

Innan du bygger varje komponent nedan, kör dessa steg:

STEG 1 — FK-RESEARCH (bara för Button, Dialog, MessageBox):
- Läs FK-motsvarigheten i Vue-projektet (~/Repon/miranon-media-os/)
- Analysera: props, beteende, a11y-mönster, CSS-struktur
- Dokumentera: vad vi tar med oss, vad vi skippar

STEG 2 — REACT-KOMPONENTPLAN:
- Skriv en plan: props/API, beteendekrav, tokens, Lotta-kontext, a11y
- Referera: DESIGN-MANIFESTO.md, DESIGN-OPERATING-SYSTEM.md, DESIGN-SYSTEM-SPEC.md
- Planen ska vara tillräckligt detaljerad för att bli en 21st-prompt

STEG 3 — 21ST-PROMPT:
- Använd 21st.dev Magic MCP (component_inspiration eller component_builder)
- Inkludera i prompten: komponentens syfte, Lottas kontext, tokens (#D4960A primär, #A3491C copper, Inter-font, rundade hörn), props, beteende, a11y
- Begär 5 visuellt distinkta varianter
- Alla varianter ska använda projektets exakta tokens

STEG 4 — VAL + MIX:
- Presentera varianterna för Marcus (eller välj bästa om Marcus inte är tillgänglig)
- Motivera valet utifrån Lotta-perspektivet

STEG 5 — INTEGRATION:
- Bygg komponenten baserat på vald variant
- Anpassa till projektets token-system (inga hårdkodade värden)
- Kör verifieringen nedan

Kör sedan komponentbygget:

1. src/components/ui/button.tsx:
   - React Aria useButton + useRef
   - CVA: primary (neutral-800 bg), secondary (transparent + border), cta (copper-500 bg)
   - Props: variant, disabled, type, className, children
   - Min-height 44px (touch target)
   - Fokusring via Tailwind: focus-visible:ring-2 focus-visible:ring-primary

2. src/components/ui/message-box.tsx:
   - role="alert" + aria-live="assertive" (error/warning) eller aria-live="polite" (info/success)
   - CVA: info, warning, error, success (border-left 4px, ikoner från Lucide)
   - Tokens: bg från --mm-{type}-bg, border från --mm-{type}

3. src/components/ui/status-badge.tsx:
   - Props: status (string), configMap (Record<string, StatusConfig>)
   - CVA-varianter per färg: primary, accent, info, warning, error, muted
   - Fallback till muted om status ej hittas

4. src/components/ui/skeleton.tsx:
   - Tailwind animate-pulse
   - Props: className (för höjd/bredd)
   - aria-busy="true", aria-label="Laddar..."
   - prefers-reduced-motion: ingen animation

5. src/components/ui/dialog.tsx:
   - React Aria: useOverlayTriggerState, useDialog, useOverlayTrigger, useModal
   - Motion AnimatePresence för entry/exit-animation
   - react-remove-scroll för body scroll-lås
   - createPortal till body
   - Props: samma som Vue (open, defaultOpen, closeOnEscape, closeOnBackdrop, modal)
   - Subkomponenter: Dialog.Title, Dialog.Description, Dialog.Close
   - 17 CSS custom properties (kopieras från Vue mm-dialog.css → tokens/components.css)
   - Bottom-sheet på mobil (<640px) via CSS media query
   - alertScreenReader vid öppning

6. src/components/ui/list-item.tsx:
   - FK-stil listrad. Används överallt (anmälningar, event, personer).
   - Props: title, subtitle, meta (datum), onPress, trailing (chevron default)
   - React Aria: usePress för touch/click/keyboard
   - Min-height 44px touch target. Hover-state subtil (bakgrundsfärg).
   - border-bottom 1px. Rundade hörn per grupp (först/sist).
   - a11y: role="button" eller <a> beroende på navigation.

7. src/components/ui/tab-group.tsx:
   - Flikväxlare (som FK "Kommande / Tidigare").
   - Props: tabs[], activeTab, onChange
   - React Aria: useTabList, useTab, useTabPanel
   - Visuell: pill-form på aktiv flik (som FK).
   - Keyboard: Arrow Left/Right, Home/End.

8. src/components/ui/card.tsx:
   - Informationskort (som FK "Nästa utbetalning", "Föräldrasidan").
   - Props: label, children, onPress (valfri)
   - Enkel: rundade hörn, neutral bakgrund, ingen skugga.

VERIFIERA per komponent:
- axe-core: 0 violations
- Tangentbord: Tab → fokusring synlig → Enter/Space aktiverar
- aria-attribut korrekta (inspektera med devtools)
- Alla tokens från systemet (inga hårdkodade hex)
- npx tsc --noEmit → 0 fel
- git commit per komponent (8 commits)
```

### ~~Fas 4: DataTable~~ → Flyttad till Fas 7

Se Fas 7 i sektion D. Full DataTable-prompt finns i arkivet: `conversion-plan-v1-sidebar.md`.

### Fas 5: App-shell + Tab bar

```
Effort: max

Du ska bygga en minimal app-shell med bottom tab bar — FK:s iOS-app som rättesnöre.

LÄS FÖRST:
- ~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md (sektion D: Fas 5, sektion L: FK-designriktning)
- ~/Repon/miranon-media-os/docs/react-migration/DESIGN-MANIFESTO.md (principer)
- ~/Repon/miranon-media-os/docs/react-migration/DESIGN-OPERATING-SYSTEM.md (arbetsordning)

DESIGNKONTEXT:
FK:s iOS-app som rättesnöre. Se sektion L i konverteringsplanen.

App-shell är medvetet minimal:
- Inget header-nav. Ingen sidebar. Ingen breadcrumb.
- Tab bar fixed bottom. 4 flikar: Hem, Event, Personer, Mer.
- Content-area: centrerad kolumn, max-width 600px, padding 16px.
- Page-header: enkel h1 per sida (som FK: "Ärenden", "Mer").

ORSAKSKEDJA (Operating System steg 1):
Lotta har idag papper och block → mängden växer → rädsla att tappa bort →
digital lösning presenteras → rädsla att inte förstå → om menyn har 12 val
och en komplex sidebar har vi bekräftat rädslan → om det är 4 flikar och
"Hej Lotta" har vi motbevisat den.

21ST COMPONENT PIPELINE (kör för TabBar):

STEG 1 — SKIPPAD (ingen FK-motsvarighet — vi designar från FK-appens screenshots istället)

STEG 2 — REACT-KOMPONENTPLAN:
- TabBar: 4 flikar, ikon + label per flik, pill-markering på aktiv
- React Aria useTabList på nav-elementet
- role="tablist", aria-label="Huvudnavigation"
- Varje flik: role="tab", aria-selected, aria-controls
- Keyboard: Arrow Left/Right + Home/End
- Touch target min 44px per flik
- Visuell: fixed bottom, safe-area-inset-bottom för notch-telefoner
- prefers-reduced-motion: inga transitions
- prefers-contrast:more: starkare borders
- Print: göm tab bar

STEG 3 — 21ST-PROMPT (via 21st.dev Magic MCP)

STEG 4 — VAL + MIX

STEG 5 — INTEGRATION

GÖR sedan:

1. src/components/shell/skip-link.tsx:
   - Gömd tills fokuserad (Tab)
   - "Hoppa till innehåll" → fokus på main
   - prefers-reduced-motion: ingen transition

2. src/components/shell/tab-bar.tsx:
   - nav med role="tablist"
   - 4 flikar: Hem (Home-ikon), Event (Calendar-ikon), Personer (Users-ikon), Mer (MoreHorizontal-ikon)
   - Aktiv flik: pill-bakgrund (som FK), ikon + text markerade
   - Inaktiv: dämpad text/ikon
   - Fixed bottom, bakgrund med subtle border-top
   - safe-area-inset-bottom (CSS env())
   - React Aria: useTabList
   - Lucide-ikoner, strokeWidth 1.75

3. src/components/shell/page-header.tsx:
   - Props: title, backHref (valfri)
   - h1 med stor text (som FK: "Ärenden", "Mer")
   - Valfri back-knapp (ChevronLeft) till vänster
   - Enkel, ingen bakgrundsfärg, ingen border

4. src/components/shell/empty-state.tsx:
   - Props: message, illustration (valfri)
   - Centrerat vertikalt+horisontellt
   - Lugn text, neutral färg (som FK bild 3)

5. src/components/shell/app-shell.tsx:
   - Props: children
   - Layout: skip-link + main (centrerad, max-w-[600px], padding) + tab-bar (fixed bottom)
   - main har padding-bottom för tab-bar-höjd
   - Route announcer: alertScreenReader vid navigering

6. Uppdatera src/routes/_authenticated.tsx:
   - Integrera app-shell runt RouterOutlet

VERIFIERA:
- Skip-to-content: Tab → synlig länk → Enter → fokus på main
- Tab bar: 4 flikar synliga, aktiv markerad med pill
- Keyboard: Tab till tab bar → Arrow Left/Right navigerar flikar
- Route announcer: klicka flik → alertScreenReader("Navigerade till X")
- Content centrerad, max 600px bredd
- iPad (1024px): content centrerad med luft på sidorna
- Mobil (375px): content fyller bredden, tab bar fixerad
- Print: tab bar gömd
- prefers-reduced-motion: inga transitions
- prefers-contrast:more: starkare borders/text
- axe-core: 0 violations
- Playwright baselines (mobil + iPad + desktop)
- git commit
```

### Fas 6: Hem + Event + Personer + Mer

```
Effort: max

Du ska bygga alla 4 flikar med live-data från Airtable via TanStack Query.

LÄS FÖRST:
- ~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md (sektion D: Fas 6, sektion L: FK-designriktning, sektion J: Designfilosofi)
- ~/Repon/miranon-media-os/docs/react-migration/DESIGN-OPERATING-SYSTEM.md (alla 7 steg)
- ~/Repon/miranon-media-os/docs/react-migration/DESIGN-MANIFESTO.md (principer)
- ~/Repon/miranon-media-os/src/composables/useDashboardData.ts (75 rader — referens)
- ~/Repon/miranon-media-os/src/composables/useUserDisplayName.ts (28 rader — referens)

GÖR:

DESIGNKONTEXT (läs innan du bygger):
Hem-fliken är det VIKTIGASTE vi bygger. Det är Lottas första intryck varje dag.
Det är här förtroende byggs eller bryts. Se scenariopoesi i sektion J.

NOLL ANIMATION. Noll effekter. Ingen typewriter, inga animerade siffror.
Varje pixel tjänar ett syfte.

ORSAKSKEDJA (Operating System steg 1):
Lotta öppnar appen → behöver veta om något brinner → idag: bläddrar i papper
→ tar 10 min + oro att hon missat något → digital lösning: 4 sekunder till svar.

BETEENDEPRINCIPER (Operating System steg 4):
1. Lottas tillstånd ska gå från "vet inte" → "har kontroll" inom 4 sekunder.
2. Om inget kräver åtgärd ska det framgå omedelbart — grön signal.
3. Handlingsförslag ("Vad vill du göra nu?") — max 3 alternativ.
4. Systemets trovärdighet synlig.

Bygg sedan:

1. TanStack Query setup:
   - src/queries/keys.ts: query key factory
   - src/queries/events.ts: queryOptions
   - src/queries/registrations.ts: queryOptions
   - src/queries/persons.ts: queryOptions

2. Hooks:
   - src/hooks/use-dashboard-data.ts (portas: computed→useMemo, förenklad)
   - src/hooks/use-user-display-name.ts (portas: computed→useMemo)

3. Hem-fliken (Scenario 1: Morgonöverblick):
   - src/components/home/greeting.tsx: "Hej Lotta" (ren text, ingen animation)
     Under det: statustext ("3 nya anmälningar sedan igår" eller "Inga nya — allt är lugnt")
   - src/components/home/new-registrations.tsx: lista med ListItem-komponenter
   - src/components/home/info-cards.tsx: 1-2 Card-komponenter (nästa event, obetalda)
   - src/components/home/primary-action.tsx: stor CTA-knapp (kontextuell: "Följ upp obetalda" eller "Se alla event")
   - src/routes/_authenticated/hem.tsx: sammansatt vy med TanStack Query loader

4. Event-fliken (Scenario 2+3):
   - src/routes/_authenticated/event/index.tsx: rubrik "Event" + lista med ListItem (namn, datum, beläggning)
   - src/routes/_authenticated/event/$eventId.tsx: event-info + anmälda ListItems + ev. TabGroup "Anmälda / Betalning / Närvaro"

5. Personer-fliken (Scenario 4):
   - src/routes/_authenticated/personer/index.tsx: rubrik "Personer" + <input type="search"> + resultatlista med ListItems
   - src/routes/_authenticated/personer/$personId.tsx: personkort + historik

6. Mer-fliken:
   - src/routes/_authenticated/mer.tsx: rubrik "Mer" + ListItems (Leads, Planera event, Mail, Inställningar) + "Logga ut"

VERIFIERA:
- /hem: "Hej Lotta" + status + kort + CTA synligt
- /hem: data hämtas via TanStack Query (inspektera DevTools)
- /hem: loading → skeleton, error → message-box, empty → lugn text
- /event: lista med event, klick → /event/[id]
- /event/[id]: event-info + anmälda lista
- /personer: sökfält + resultatlista, klick → /personer/[id]
- /personer/[id]: personkort med historik
- /mer: lista med 4-5 länkar + logga ut
- Alla vyer: max-width 600px, centrerad
- Alla vyer: fungerar på 375px, 768px, 1024px
- axe-core: 0 violations per vy
- Playwright baselines per vy
- Friction log (alla 4 flikar)
- Design audit (Hem-vyn)
- git commit per flik
```

### Fas 6.5: Aktivitetslogg

**Styrande dokument:** `docs/features/FEATURE-ACTIVITY-LOG.md`

**Beroenden:** Fas 6 (mutations i adaptern), Airtable-tabell "Aktivitetslogg"

**Estimat:** 2 sessioner

Automatisk loggning av alla relevanta användarhandlingar. Ger Lotta en historisk vy över allt hon gjort — betalningar, anmälningar, mail, närvaro.

### Fas 7: Konsolidering

```
Effort: high

Du ska slutföra projektet: kvarvarande routes, kvalitetssäkring, dokumentation.

LÄS FÖRST:
- ~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md (sektion D: Fas 7, sektion G: Kvalitetssäkring)
- ~/Repon/miranon-media-os/docs/react-migration/DESIGN-OPERATING-SYSTEM.md (definition av klart, §VIII)
- ~/Repon/miranon-media-os/docs/react-migration/DESIGN-MANIFESTO.md (slutgiltiga testet, §VI)

GÖR:

1. DataTable (villkorligt):
   - Om event-detaljsidan (/event/[id]) behöver sort + filter på anmälningar — bygg DataTable med TanStack Table + React Aria (se Fas 4 i v1-planen: conversion-plan-v1-sidebar.md)
   - Om listor räcker — eliminera DataTable helt och dokumentera i eliminationslistan

2. Kvalitetssäkring:
   - npm run lint → 0 fel
   - npx tsc --noEmit → 0 fel
   - Lighthouse Accessibility ≥ 95 på /hem, /event, /personer, /mer, /login
   - axe-core: 0 critical, 0 serious på alla fungerande vyer
   - Tabba igenom varje vy: logisk ordning, fokusring synlig
   - 320px bredd: inget bryts
   - Zoom 200%: inget överlappar

3. Playwright baselines:
   - Alla vyer (desktop 1440x900 + mobil 375x812)
   - npx playwright test → alla gröna

4. Design audits:
   - /design-audit route=/hem → docs/audits/
   - /design-audit route=/event → docs/audits/
   - /design-audit app-shell → docs/audits/

5. Friction logs:
   - Login-flöde: öppna → logga in → navigera → logga ut
   - Morgonöverblick: öppna → scanna → identifiera problem → agera
   - Tab-navigering: navigera alla 4 flikar → drill-down → tillbaka

6. Leverabler per fas:
   - docs/phases/fas0-elimination.md
   - docs/phases/fas5-orsakskedja.md, fas5-scenario.md, fas5-beteende.md, fas5-elimination.md, fas5-friction-log.md
   - docs/phases/fas6-orsakskedja.md, fas6-scenario.md, fas6-beteende.md, fas6-elimination.md, fas6-friction-log.md
   - docs/phases/fas7-friction-log.md

7. README.md för repot:
   - Setup-instruktioner (npm install, env-variabler, npm run dev)
   - Stack-tabell
   - Token-arkitektur (kort)
   - Länk till designdokument

VERIFIERA (definition av klart):
- [ ] Eliminationslistor finns (varje fas)
- [ ] Beteendeprinciper skrivna (fas 5+6)
- [ ] Stresstest gjort (tangentbord, skärmläsare, mobil, tom data)
- [ ] Friction logs genomförda (3 st)
- [ ] Design audits genomförda (3 st)
- [ ] Playwright baselines: alla gröna
- [ ] 0 TypeScript-fel, 0 Biome-fel
- [ ] axe-core: 0 critical, 0 serious
- [ ] DataTable-beslut dokumenterat (byggt eller eliminerat)
- [ ] Kvarvarande skuld dokumenterad
- git add -A && git commit -m "fas 7: konsolidering + kvalitetssäkring"
```

---

## J. Designfilosofi — Lotta

### Vem är Lotta

Lotta driver Miranon Media tillsammans med Roger. Hon hanterar anmälningar,
betalningar, närvaro, mailutskick och personregister. Hon är icke-teknisk.
Hon har aldrig bett om en app — hon har bett om att slippa tappa bort papper.

### Lottas verklighet

Lotta hanterar idag allt med papper, block och manuella anteckningar.
Mängden lösa papper och block växer. Hon vet att det börjar bli ohållbart
men digitaliseringen är främmande. Det är inte entusiasm som driver henne
till appen — det är insikten att det inte går att fortsätta som det är.

### Lottas rädslor

Dessa är verkliga, inte antagna. De styr varje designbeslut:

1. **Att tappa bort information.** Papper kan försvinna. Block kan bli
   stulna. Men hon vet var de fysiskt ligger. Digital data känns osynlig
   — var finns den? Kan den försvinna?

2. **Att inte förstå.** "Krångligare" och "svårare" är hennes förväntning
   på digitala verktyg. Varje element som kräver tolkning bekräftar den
   rädslan. Varje element som är omedelbart begripligt motbevisar den.

3. **Att tappa kontrollen.** Papper ger en illusion av kontroll — du ser
   det, du rör det, du vet var det är. Att lämna över till ett system
   hon inte kan öppna och titta i på samma sätt kräver förtroende.
   Förtroende byggs genom att systemet bevisar sig, inte genom att
   vi förklarar att det fungerar.

4. **Att det ska bli "krångligare" än det redan är.** Hennes nuvarande
   system fungerar — det är bara ohållbart i skala. Om appen känns
   mer komplicerad än papperet har vi misslyckats, oavsett hur
   tekniskt korrekt den är.

### Designkonsekvenser

Dessa konsekvenser är inte preferenser. De är krav som härleds direkt
från Lottas rädslor:

**Trygghet före funktion.** Det första Lotta ser vid varje inloggning
ska vara ett bevis på att systemet har kontroll. Inte en dashboard med
siffror — utan ett besked: "Allt är under kontroll. Här är vad som hänt."

**Bekräftelse vid varje handling.** Varje knapp hon trycker på, varje
status hon ändrar, varje sökning hon gör — systemet svarar omedelbart
och tydligt. Inte subtila state-changes. Tydliga, synliga bekräftelser
som bygger förtroende en interaktion i taget.

**Motivering vid varje vy.** Varje siffra, varje lista, varje kort
ska svara på frågan "varför ser jag detta just nu?" Om svaret inte
är uppenbart ska elementet antingen förklaras inline eller elimineras.

**Handlingsförslag framför datapresentation.** Lotta behöver inte
se all data. Hon behöver veta: vad ska jag göra nu? Varje vy ska
ha en tydlig "nästa steg"-signal.

**Systemets trovärdighet synliggörs.** Lotta behöver se att systemet
arbetar — inte bara resultaten. "8 automatiska bekräftelsemail skickade
idag. 0 fel." "234 anmälningar registrerade sedan start. 0 tappade."
Det är trovärdighet i siffror.

### Scenariopoesi: Lottas första inloggning

> Lotta sätter sig vid köksbordet med kaffekoppen. Roger har sagt att
> "det nya systemet" är klart. Hon är skeptisk men nyfiken. Hon öppnar
> länken i telefonen. En inloggningssida. Enkel. Inte skrämmande.
> Hon skriver in sin mejladress och lösenordet Roger gav henne.
>
> Skärmen ändras. "Hej Lotta." Inte "Welcome to Miranon Media Admin
> Dashboard v2.0." Bara "Hej Lotta."
>
> Under det: "Det har kommit in 3 nya anmälningar sedan igår kväll.
> Alla är registrerade i systemet."
>
> Hon andas ut. Systemet har koll. Hon behövde inte göra något.
>
> Under det: "Ert nästa event är om 12 dagar, hemma hos er i Rönninge.
> 14 anmälda, 2 har inte betalat ännu."
>
> Hon vet direkt vad läget är. Utan att leta. Utan att räkna.
>
> Längst ner: "Vad vill du göra nu?" Tre alternativ. Inte tio.
> "Se nya anmälningar" — "Följ upp obetalda" — "Se alla event"
>
> Hon trycker på "Följ upp obetalda." Två namn dyker upp. Namn hon
> känner igen. Bredvid varje: en knapp "Skicka påminnelse."
>
> Det tog 40 sekunder. På 40 sekunder gick hon från skeptisk till
> trygg, och från trygg till handling. Papperet hade tagit 10 minuter
> och en halvtimmes oro efteråt om hon missat något.

### Scenariopoesi: Lottas morgonrutin (Scenario 1)

> 07:52. Barnen ska hämtas klockan tre. Möte om 23 minuter.
> Lotta öppnar appen. Inte för att hon vill — för att hon måste.
>
> "Hej Lotta. Inget kräver åtgärd just nu."
>
> Grön signal. Hon lägger ner telefonen. Häller kaffe.
> Det tog fyra sekunder.
>
> Alternativet: om något brinner.
> "Hej Lotta. 1 sak behöver din uppmärksamhet."
> En orange rad. Ett namn. En knapp.
> Hon trycker. Klart. 12 sekunder.

### Sensoriskt ramverk för Miranon

| Dimension | Riktning | Motivering |
|-----------|----------|-----------|
| **Temperatur** | Varm, trygg, hemma | Lotta ska känna att appen är hennes. Guld/amber förstärker detta — varmt, inte kliniskt. |
| **Rytm** | Lugn men effektiv | Inte stressad. Inte sömnig. Rytmen av en kompetent assistent som presenterar det viktiga först. |
| **Volym** | Det viktiga talar. Resten viskar. | Hälsning och status: högt. Siffror och kort: medium. Navigation och systeminfo: tyst. |
| **Textur** | Mjuk, inte teknisk | Rundade hörn. Mjuka skuggor. Inga skarpa kanter eller hög kontrast utom vid varningar. |

---

## K. 21st Component Pipeline

### Vad det är

En 5-stegs pipeline för att bygga varje UI-komponent i projektet. Pipelinen kombinerar FK-research (när tillämpligt), projektets designfilosofi och 21st.dev Magic MCP för att generera skräddarsydda designvarianter innan implementation.

Vue-projektet (~/Repon/miranon-media-os/) behålls som FK-experimentverkstad. FK-komponenter kan testas och utvärderas där innan mönster överförs till React.

### De 5 stegen

| Steg | Vad | Vem | Output |
|------|-----|-----|--------|
| 1. FK-research (valfritt) | Claude Code analyserar FK-motsvarigheten i Vue-projektet: beteende, props, a11y, CSS-mönster | Claude Code | FK-komponentanalys |
| 2. React-komponentplan | Claude Code skriver en plan för React-versionen med hänsyn till DESIGN-MANIFESTO.md, DESIGN-OPERATING-SYSTEM.md, DESIGN-SYSTEM-SPEC.md, tokens och Lotta-perspektiv | Claude Code | Komponentspec med props, beteende, tokens, a11y-krav |
| 3. 21st-prompt | Specen från steg 2 omvandlas till en 21st.dev-prompt. Inkluderar: komponentens syfte, Lottas kontext, visuell stil (tokens, färger, rundning), beteendekrav, tillgänglighetskrav | Claude Code → 21st MCP | 5 designvarianter |
| 4. Val + mix | Marcus och Claude Code väljer bästa varianten eller mixar element från flera | Marcus + Claude Code | Vald design |
| 5. Integration + audit | Varianten anpassas till projektets tokens, testas mot 11/11/11, Playwright-baseline skapas | Claude Code | Färdig komponent |

### När FK-research (steg 1) tillämpas

| Fas | Komponent | FK-motsvarighet | Steg 1? |
|-----|-----------|-----------------|---------|
| 3 | Button | FButton | Ja |
| 3 | Dialog | FModalDialog / FDialog | Ja |
| 3 | MessageBox | FMessageBox | Ja |
| 3 | StatusBadge | — | Nej |
| 3 | Skeleton | — | Nej |
| 3 | ListItem | — | Nej |
| 3 | TabGroup | — | Nej |
| 3 | Card | — | Nej |
| 5 | TabBar | — | Nej (FK-app som referens istället) |
| 5 | EmptyState | — | Nej |
| 7 | DataTable | FInteractiveTable + FTableColumn | Ja (om den byggs) |

### 21st-promptens struktur

Varje 21st-prompt ska innehålla:

1. **Komponentens syfte** — vad den gör, i en mening
2. **Användaren** — "Lotta, icke-teknisk verksamhetsledare. Hennes största rädsla är att inte förstå."
3. **Visuell stil** — tokens (primärfärg #D4960A, copper #A3491C, rundade hörn, Inter-font), Miranon-branding
4. **Props/API** — från komponentplanen
5. **Beteendekrav** — hover, focus, active, disabled states
6. **Tillgänglighetskrav** — ARIA-roller, tangentbord, skärmläsare
7. **Begränsning** — "Generera 5 visuellt distinkta varianter. Alla ska använda dessa exakta tokens."

### Varför Vue-projektet behålls

Vue-projektet är inte bara en referens — det är en aktiv experimentverkstad:

- **FK-experiment:** Testa FK-komponenter (FDialog, FInteractiveTable, FButton) i isolation, studera beteende och a11y-mönster, innan de informerar React-implementationen.
- **Mönsterverifiering:** Om en FK-lösning ser lovande ut kan den testas i Vue först (snabbare iteration) innan React-versionen byggs.
- **Ingen koppling:** React-repot har NOLL beroende av FK. Vue-projektet är enbart kunskapskälla.

---

## L. FK-designriktning

### Visuellt rättesnöre

FK:s iOS-app (april 2026) är det visuella rättesnöret för hela appen. 4 referensbilder dokumenterade:

| Bild | Vy | Beskrivning |
|------|----|-------------|
| 1 | Hem | Namn + notis-klocka, 2 info-kort (Nästa utbetalning, Föräldrasidan), 1 stor grön CTA-knapp. Ingen header, ingen sidebar, ingen logotyp. |
| 2 | Ärenden | Rubrik "Ärenden", ren lista med rader (VAB, Loui / Beslut / 16 februari + chevron). Ingen filter, inga ikoner, ingen färgkodning. |
| 3 | Utbetalningar | Rubrik, 2 flikar (Kommande/Tidigare), tom-state med vänlig illustration + "Du har inga kommande utbetalningar". |
| 4 | Mer | 2 listobjekt (Mina uppgifter, Förälder) med ikoner + chevron + "Logga ut" längst ner. |

Bottom tab bar: 4 flikar — Hem, Ärenden, Utbetalningar, Mer. Aktiv flik markerad med pill-form.

### Designprinciper

1. Noll animation, noll effekter. Ingen typewriter, inga animerade siffror, inga slide-in-menyer. Varje pixel tjänar ett syfte.
2. En kolumn, centrerad (max-width 600px). iPad-först, fungerar lika bra på mobil och desktop.
3. Bottom tab bar med 4 flikar: Hem, Event, Personer, Mer.
4. Tom-states med vänliga, lugna meddelanden.
5. Stora touch targets (min 44px).
6. Enkla listor med chevron — inte tabeller som primärt gränssnitt.
7. Tillgänglighet 11/11/11 på komponenter. Förenklad design ≠ förenklad kvalitet.

### 4 flikar

| Flik | Scenario | Vad Lotta ser |
|------|----------|---------------|
| Hem | S1: Morgonöverblick | "Hej Lotta" + nya anmälningar + status |
| Event | S2+S3: Betalning + Närvaro | Lista över event → drill-down |
| Personer | S4: "Vem var det som..." | Sök + personkort med historik |
| Mer | S5+S6+S7+S8 | Leads, Planera event, Mail, Inställningar, Logga ut |

### Vad som försvinner (jämfört med Vue-designen)

Sidebar/AppMenu, breadcrumb-bar, sökfält i header, actions-meny (⋯), brand-header "Miranon Media" i meny, resizable sidebar, typewriter-effekt, animerade siffror, scroll-track, sektionsfärger via color-mix, sektionslägen (A/B/C), StatCard med counter-animation, traditionell dashboard-layout.

### Vad som tillkommer

Bottom tab bar (pill-markering), page-header (enkel h1), empty-state-komponent, list-item-komponent, tab-group (flikar), informationskort (FK-stil), "Mer"-sida.

---

## Tidslinje

| Fas | Namn | Sessioner | Kumulativt |
|-----|------|-----------|------------|
| 0 | Projektsetup + tokens | 1 | 1 |
| 1 | Domäntransplant + [FI] filkopiering | 0.5 | 1.5 |
| 2 | Routing + Auth | 1 | 2.5 |
| 3 | UI-primitiver (+ 21st pipeline) | 2 | 4.5 |
| 5 | App-shell + Tab bar (+ 21st pipeline) | 1.5 | 6 |
| 6 | Hem + Event + Personer + Mer | 3.5 | 9.5 |
| 6.5 | Aktivitetslogg | 2 | 11.5 |
| 7 | Konsolidering (+ DataTable om behövs) | 3 | 14.5 |
| **Totalt** | | **~15 sessioner** | |

Notera: [GA]-tillägg (service worker, error boundaries, optimistic UI, chaos testing, deploy, CSP) lade till ~2 sessioner jämfört med pre-gap-analys-planen (13 → 15).

(Fas 4 existerar inte separat — DataTable ingår villkorligt i Fas 7.)

### De 3 största riskerna

1. **Responsiv tab bar.** Bottom tab bar på desktop (>1024px) är ovanligt men konsekvent med iPad-först-designen. Risk att det känns "mobiligt" på stor skärm. **Mitigation:** max-width 600px på content ger luft. Om det ändå känns fel — lägg till top-nav på desktop som alternativ i Fas 7.

2. **TanStack Router inlärningskurva (Fas 2).** File-based routes, Zod search params, loader-integration — nya koncept. Färre tutorials än React Router. **Mitigation:** Börja med enklaste möjliga setup (inga loaders), addera komplexitet i Fas 6 när grunderna sitter.

3. **React Aria API-skillnader (Fas 3–4).** React Aria är mer explicit (hooks-baserat, kräver manuell ARIA-koppling) jämfört med vår composable-modell. Inlärningskurvan är brant första veckan. **Mitigation:** Bygg en komponent åt gången. Läs React Arias Starter Kit först. Studera shadcn/ui:s React Aria-integration som referens. 21st.dev-pipelinen ger ytterligare mitigation — 5 varianter per komponent minskar risken att fastna i ett API-mönster.

### De 3 saker som blir bättre i React vs Vue

1. **Controlled/uncontrolled: 216 rader → 15 rader.** Vue 3:s boolean-casting-bugg (getCurrentInstance, vnode.props) existerar inte i React. 8 instanser av useControllable förenklas dramatiskt.

2. **Data-fetching: manuell → automatisk.** `onMounted(() => execute())` + manuell loading/error/refresh → TanStack Query med cache, prefetch, mutations, DevTools, hover-prefetch via router-loaders.

3. **2 035 rader beteende-composables → produktionstestad React Aria.** 10 composables ersätts av React Aria hooks med bättre internationalisering, fler testfall och Adobes underhåll.

---

## Öppna beslut

### Öppna

| # | Beslut | Kontext | Rekommendation |
|---|--------|---------|----------------|
| 1 | `--p-gold-700` (#96680A) vs Vue `--miranon-primary-dark` (#8E5F07) | DESIGN-SYSTEM-SPEC vs Vue-koden | Använd Vue-värdet #8E5F07, uppdatera DESIGN-SYSTEM-SPEC |
| 2 | Fokusring: guld (#D4960A) vs mörkblå (#1B4965) | DESIGN-SYSTEM-SPEC vs Vue lessons.md | Behåll #1B4965 (mörkblå) per lessons.md princip: "exklusiv färg" |
| 5 | 21st.dev component_builder vs component_inspiration | component_builder var trasig mars 2026, component_inspiration fungerade | Testa builder i Fas 3 — om trasig, använd inspiration som fallback |
| 6 | Desktop-navigation: bottom tab bar eller top nav? | FK-app använder bottom tabs, desktop har mer yta | Bottom tab bar överallt (iPad-först, konsekvent). Omprövas i Fas 7. |

### Stängda

| # | Beslut | Utfall | Var dokumenterat |
|---|--------|--------|------------------|
| 3 | Repo-namn | `miranon-media-admin` (React är default framåt) | CLAUDE.md sektion "Nästa steg — React-konvertering" |
| 4 | Vue som FK-experimentverkstad | Behålls — Vue-repot stannar kvar som referens och experimentverkstad | CLAUDE.md sektion "Arkitekturbeslut: FK Designsystem" |
| 7 | Max-width 600px | Ja, med undantag för ev. tabell-vyer | conversion-plan sektion L: FK-designriktning, princip 2 |
| 8 | Mer-sidan: flat lista | Flat lista som FK bild 4 | conversion-plan sektion L: 4 flikar-tabellen |

---

*Detta dokument är den enda sanningskällan för konverteringen. Alla faser, filer, beslut och verifieringar finns här. Om något saknas — det har medvetet eliminerats.*
