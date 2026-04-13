# React Stack Research — Miranon Media Admin
*Research genomförd: 2026-04-05 | 4 parallella research-agenter*

---

## Sammanfattning

Denna rapport jämför React-ekosystemets bästa verktyg 2026 för en konvertering av Miranon Media Admin (Vue 3 → React). Varje område har researchats oberoende med web-sökning efter data från 2025–2026.

### Rekommenderad stack

| Lager | Rekommendation | Alternativ att bevaka |
|-------|----------------|----------------------|
| **UI-primitiver** | React Aria (Adobe) | Base UI (MUI-teamet) |
| **Routing** | TanStack Router | — |
| **Data-fetching** | TanStack Query v5 | — |
| **Styling** | Tailwind CSS v4 + CSS custom properties | Vanilla Extract (om typsäkra tokens prioriteras) |

**TanStack-synergier:** Router + Query + (Table, Form) bildar ett integrerat ekosystem med delad filosofi: type-safe, headless, framework-agnostisk. Loader-baserad prefetching, hover-prefetch och end-to-end TypeScript-inferens fungerar "gratis" när båda används tillsammans.

---

## 1. Headless UI-primitiver

### Jämförelsetabell

| Dimension | Radix UI | React Aria | Base UI | Ariakit | Headless UI |
|-----------|----------|------------|---------|---------|-------------|
| **GitHub-stjärnor** | 18 692 | 14 961 | 9 105 | 8 538 | 28 491 |
| **npm/vecka** | 36,6M (dialog) | 2,1M (hooks) + 1,6M (components) | 274K | 652K | 4,8M |
| **Antal komponenter** | ~28 UI + 26 utilities | 40+ hooks, 50+ komponenter | 38 komponenter | ~25 | 16 |
| **TypeScript** | Bra | Utmärkt | Utmärkt | Bra | Bra |
| **ARIA-compliance** | Hög | Branschledande | Hög | Hög | Medel |
| **Tangentbord** | Komplett | Komplett + internationellt | Komplett | Komplett | Grundläggande |
| **Fokushantering** | Bra | Avancerad (FocusScope, virtuellt) | Bra | Bra | Grundläggande |
| **Underhåll 2025–2026** | **Saktat** (senaste commit feb 2026) | Dagliga commits, månatliga releases | Dagliga commits, v1.0 dec 2025 | Dagliga commits (solo-maintainer) | **Saktat** (senaste release sep 2025) |
| **Bundle size** | Liten (per paket) | Medel (hooks-baserat) | Liten | Liten | Liten |

### Detaljanalys

#### Radix UI — Underhållsvarning

Radix var branschstandarden 2023–2024, men har ett reellt underhållsproblem efter WorkOS-förvärvet. Flera grundare har lämnat. tldraw (stort OSS-projekt) utreder aktivt migration bort från Radix. Radix-skaparen Colm Tuite kallade själv Radix "a liability". Trots massiva npm-nedladdningar (drivet av shadcn/ui) minskar commit-aktiviteten.

**Risk:** Att bygga ett nytt komponentbibliotek med 11/11/11-ambitioner på en primitiv vars underhåll är osäkert.

#### React Aria — Mest komplett

Adobes React Aria är branschens mest kompletta tillgänglighetsbibliotek:
- 50+ komponenter, 40+ hooks
- 30+ språk, 13 kalendersystem (internationalisering)
- Avancerad fokushantering (FocusScope, virtuellt fokus)
- Adobe använder det själva (Spectrum 2)
- Dagliga commits, månatliga releases — ingen underhållsrisk
- Hooks-baserad arkitektur ger full kontroll över rendering

**Styrka för oss:** React Arias hooks-mönster mappar direkt till våra Vue composables. 9 av 12 composables har direkta ekvivalenter:

| Vue composable | React Aria-ekvivalent |
|----------------|----------------------|
| useFocusScope | FocusScope + useFocusRing |
| useDismissable | useDismiss (via useOverlay) |
| usePresence | useTransition (React 18+) |
| useControllable | Inbyggt i alla React Aria-hooks |
| useRovingFocus | useTabList / useGridList |
| useTypeAhead | Inbyggt i useComboBox, useSelect |
| useCollection | useCollection (React Aria Collections) |
| useScrollLock | usePreventScroll |
| useId | useId (React 18+) |

#### Base UI — Mest lovande nykomling

Skapad av ex-Radix-teamet. Colm Tuite (Radix-grundare) är Director of Design Engineering. Teamet på 7 heltidsanställda inkluderar folk från Radix, Floating UI och Material UI. v1.0 släpptes december 2025.

- 38 komponenter (redan fler än Radix)
- Modernaste API:t av alla (render prop + hook-baserat)
- shadcn/ui lade till Base UI-stöd januari 2026
- Dagliga commits

**Risk:** Bara ~4 månader sedan v1.0. Lite community-erfarenhet i produktion.

#### Headless UI — Utesluts

Bara 16 komponenter. Underhållet har saktat ned (senaste release september 2025). Designat som companion till Tailwind UI, inte som fristående primitiv-bibliotek. Otillräckligt för 11/11/11-krav.

#### Ariakit — Bra men solo-maintainer

25 komponenter, dagliga commits, men underhålls av en person. Risk för "bus factor" i ett projekt som ska bära framtida produkter.

### shadcn/ui-analys

shadcn/ui är inte ett komponentbibliotek utan en **koddistributionsmodell**: du kopierar kod, äger den, anpassar den. Detta passar vår filosofi — vi vill äga vårt komponentbibliotek (Mm Component Library → React-version).

**Nytt sedan januari 2026:** shadcn/ui stöder nu både Radix och Base UI som primitiv-backend. Utvecklare väljer vid projektstart och kan byta utan kodändringar. Detta minskar risken med Radix underhåll — man kan migrera till Base UI om Radix försämras.

**Relevant för oss?** Ja, som **inspiration och mönster** — inte som direkt beroende. shadcn/ui:s CSS vars + Tailwind + headless-primitiv-mönster är exakt den arkitektur vi vill bygga. Men vi bygger vårt eget bibliotek med strängare tillgänglighetskrav.

### Rekommendation: React Aria

**Primärval:** React Aria — bäst tillgänglighet, flest komponenter, säkrast underhåll (Adobe). Enda biblioteket som matchar våra 11/11/11-ambitioner utan kompromisser.

**Sekundärval att bevaka:** Base UI — bästa teamet och modernaste API:t, men bara 4 månader gammalt i v1.0. Kan bli primärval om 6–12 månader.

**Risker:**
- React Aria har en brantare inlärningskurva än Radix (hooks-baserat kräver mer boilerplate)
- Mindre community-ekosystem kring styling/theming jämfört med Radix/shadcn
- Adobe-beroende (företagsprioritering kan ändras, men Spectrum 2 behöver det)

---

## 2. Routing

### Jämförelsetabell

| Dimension | TanStack Router | React Router v7 |
|-----------|----------------|-----------------|
| **Version** | v1.168.10 | v7.14.0 |
| **GitHub-stjärnor** | 14 064 | 56 336 |
| **npm/vecka** | ~2 700 000 | ~44 350 000 |
| **Bundle size (gzip)** | ~41 kB | ~20–32 kB |
| **TypeScript** | 100% TS-first. Auto-genererad routeTree.gen.ts | Begränsat i SPA-läge (params = `string \| undefined`) |
| **Typ-säkra search params** | Förstklassigt: Zod-schema, auto-validering, hierarkiskt arv | Manuellt: URLSearchParams (strängar) |
| **Data-laddning** | Inbyggda loaders med caching, pending/error per route | Loaders (Remix-arvet), ingen caching |
| **Prefetching** | Inbyggt: `preload="intent"` (hover) | Ingen inbyggd |
| **DevTools** | Dedikerade: route matches, loader-status, search params, historik | Tredjepartspaket |
| **Nestade routes** | Fullt stöd | Fullt stöd (branschstandard sedan v4) |
| **SSR** | Via TanStack Start | Förstklassigt via Framework-läge |
| **Filbaserade routes** | Valfritt via @tanstack/router-plugin (Vite) | Framework-läge: konventionsbaserat |
| **Inlärningskurva** | Medel (kräver TS-vana) | Låg (de flesta känner React Router) |
| **Ekosystem** | Mindre men +120% YoY tillväxt | Enormt (12 år, tusentals guider) |

### TanStack Router + TanStack Query-synergi

Denna kombination är avgörande för vår dashboard-app:

```
Route loader → queryClient.ensureQueryData(options)
                        ↓
                TanStack Query cache
                        ↑
Komponent (useSuspenseQuery) → Läser från cache (ingen ny request)
```

**Nyckelmekanismer:**

1. **QueryClient via Router context** — alla loaders får tillgång till queryClient utan importer
2. **Loaders seedar cachen** — `ensureQueryData()` startar fetch innan komponenten renderas
3. **Komponenter konsumerar samma cache** — `useSuspenseQuery(sameOptions)` hittar redan-laddad data
4. **Hover-prefetch** — `preload="intent"` startar loadern 200–300ms innan klick
5. **Stale-while-revalidate** — navigering tillbaka visar cachad data direkt, bakgrundsfetch uppdaterar
6. **Hierarkisk invalidering** — query keys (`["events"]`, `["events", id]`) invaliderar exakt rätt data

**Konkret för oss:** Dashboard-routens loader prefetchar events, registreringar och betalningar parallellt. Event-detaljrouten prefetchar vid hover på event-kort. Navigering känns instant.

### Search params — avgörande skillnad

TanStack Routers killer-feature för dashboard-appar:

```typescript
// TanStack Router: Zod-validerade search params
export const Route = createFileRoute('/events/')({
  validateSearch: z.object({
    status: z.enum(['active', 'past', 'all']).default('active'),
    page: z.number().default(1),
    sort: z.enum(['date', 'name']).default('date'),
  }),
})
// Automatisk validering, serialisering, TypeScript-inferens
```

React Router v7: `useSearchParams()` returnerar strängar. Manuell parsning och typning krävs för varje komponent.

**80% av Lottas interaktioner** involverar filter, sortering och paginering i URL:en. TanStack Router eliminerar en hel kategori buggar och boilerplate.

### Rekommendation: TanStack Router

**Avgörande faktorer:**
1. Typ-säkra search params (Zod-validering, hierarkiskt arv)
2. TanStack Query-synergi (loader-prefetch, hover-prefetch)
3. Dedikerade DevTools
4. Automatisk code-splitting via router-plugin

**Risker:**
- Större bundle (+10–20 kB vs React Router) — acceptabelt för intern admin-app
- Färre tutorials — kompenseras av utmärkt officiell dokumentation
- 572 öppna issues (vs 162) — reflekterar delvis hög utvecklingstakt

---

## 3. Data-fetching & Server State

### Jämförelsetabell

| Dimension | TanStack Query v5 | SWR v2 | RTK Query |
|-----------|-------------------|--------|-----------|
| **Version** | v5.96.2 | v2.4.0 | Del av Redux Toolkit 2.x |
| **GitHub-stjärnor** | ~49 000 | ~32 400 | ~10 700 |
| **npm/vecka** | ~33,8M | ~8,5M | ~15M (via RTK) |
| **Bundle size (gzip)** | ~16,9 kB | ~8,5 kB | ~14 kB (+ RTK-bas ~40 kB) |
| **Marknadsandel** | 60–70% | 15–20% | 10–15% |
| **Mutations** | useMutation med komplett lifecycle | Manuellt via mutate() | Endpoints-config, auto-genererade hooks |
| **Optimistic updates** | Inbyggt (2 strategier: cache-manipulation eller mutation.variables) | optimisticData (begränsat) | onQueryStarted + automatisk rollback |
| **DevTools** | Dedikerade, branschledande | Inga officiella | Redux DevTools (time-travel) |
| **Prefetching** | prefetchQuery, ensureQueryData, usePrefetchQuery | preload() (begränsat) | initiate() |
| **Dependent queries** | `enabled: !!eventId` (deklarativt) | Conditional key (manuellt) | `skip: !eventId` |
| **Cache-invalidering** | Hierarkisk queryKey + predicate-baserad | Per key (manuellt) | Tag-baserad (providesTags/invalidatesTags) |
| **Offline** | networkMode: 'offlineFirst', mutation-kö, persistQueryClient | Grundläggande cache | Ej inbyggt |
| **Router-integration** | Djup med TanStack Router | Ingen | Ingen |
| **Pagination** | useInfiniteQuery (dedikerad hook) | useSWRInfinite | Manuell state-hantering |
| **React Suspense** | useSuspenseQuery | suspense-option | Nej |
| **Multi-framework** | React, Vue, Solid, Svelte, Angular | Enbart React | Enbart React (kräver Redux) |

### Detaljanalys

#### TanStack Query v5 — Tydlig vinnare

**Mutations för CRUD (events, registreringar, betalningar, personer):**

Två strategier för optimistic updates:

1. **Cache-manipulation** — onMutate snapsar cache, uppdaterar optimistiskt, onError rullar tillbaka:
```typescript
useMutation({
  mutationFn: updateEvent,
  onMutate: async (newEvent) => {
    await queryClient.cancelQueries({ queryKey: ['events', newEvent.id] })
    const previous = queryClient.getQueryData(['events', newEvent.id])
    queryClient.setQueryData(['events', newEvent.id], newEvent)
    return { previous }
  },
  onError: (err, newEvent, context) => {
    queryClient.setQueryData(['events', newEvent.id], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
  },
})
```

2. **mutation.variables** (v5) — renderar pending-data utan cache-manipulation. Enklare, mindre felbenäget.

**Dependent queries (Event → Registreringar → Person):**
```typescript
const { data: event } = useQuery({ queryKey: ['events', id], queryFn: ... })
const { data: regs } = useQuery({
  queryKey: ['registrations', id],
  queryFn: ...,
  enabled: !!event, // Väntar på event
})
```

**Cache-invalidering (hierarkisk):**
- `invalidateQueries({ queryKey: ['events'] })` — alla event-queries
- `invalidateQueries({ queryKey: ['events', id] })` — specifikt event
- `invalidateQueries({ predicate: (q) => ... })` — villkorsbaserad

#### SWR v2.4 — Otillräckligt för CRUD-tung app

Extremt enkel API (en hook, en fetcher) men saknar dedikerad useMutation, officiella DevTools, query cancellation, offline mutation-kö och hierarkisk cache-invalidering.

**OBS:** SWR v3 existerar inte per april 2026. Senaste stabila version är v2.4.0 (februari 2025). Gapet mot TanStack Query har inte stängts.

#### RTK Query — Kräver Redux, utesluts

Kräver Redux Toolkit som beroende. Att introducera hela Redux-ekosystemet enbart för data-fetching är overengineering. Bundle (~40 kB) och inlärningskurva motiveras inte utan befintligt Redux.

### Rekommendation: TanStack Query v5

**Avgörande faktorer:**
1. CRUD-fokus — useMutation med optimistic updates och rollback
2. Dependent queries — Miranons datamodell har relationer (Event → Registreringar → Person)
3. TanStack Router-synergi — loader-prefetch, hover-prefetch, SSR-hydration
4. Offline-stöd — Scenario 3 (Eventdag — närvaro, mobil) behöver detta
5. DevTools — avgörande under utveckling av 15+ vyer och 15+ adapter-metoder
6. Hierarkisk cache-invalidering — matchar vår domänstruktur

**Bundle-kostnad (16,9 kB gzip) ersätter hundratals rader manuell cache-logik.**

---

## 4. Styling-arkitektur

### Jämförelsetabell

| Dimension | Tailwind v4 | CSS Modules | styled-components | Vanilla Extract |
|-----------|------------|-------------|-------------------|-----------------|
| **npm/vecka** | ~12M (snabbast växande) | N/A (inbyggt) | ~7–9M (sjunkande) | ~450K |
| **GitHub-stjärnor** | ~94 000 | N/A | ~41 000 | ~9 500 |
| **Bundle-påverkan** | 5–20 kB CSS, 0 kB JS | 0 kB JS | ~30–50 kB JS | 0 kB JS |
| **Runtime-kostnad** | Ingen | Ingen | Medel (style injection) | Ingen |
| **TypeScript-tokens** | Nej (className-strängar) | Nej | Ja (via generics) | Ja (full) |
| **CSS custom properties** | Nativ via @theme | Nativ (standard CSS) | Manuellt via tema | createVar() + createTheme() |
| **Dark mode** | dark: variant inbyggd | Manuellt | Runtime ThemeProvider | Selector-baserat |
| **prefers-contrast** | contrast-more: variant inbyggd | Manuellt | Manuellt | Manuellt |
| **RSC-kompatibel** | Ja | Ja | Begränsat (v6.3+) | Ja |
| **Momentum** | Stark uppgång | Stabil | Sjunkande | Stabil/nisch |

### Token-integration med befintliga CSS custom properties

| Approach | Integration med --miranon-* tokens | Ansträngning | Typ-safety |
|----------|-----------------------------------|--------------|------------|
| **Tailwind v4** | Direkt i @theme — genererar utilities automatiskt | Minimal | Nej (strängar) |
| **CSS Modules** | Direkt via var() | Ingen | Nej |
| **styled-components** | Via ThemeProvider + CSS vars | Medel | Ja |
| **Vanilla Extract** | createThemeContract() eller manuell var() | Hög | Ja (full) |

### Tailwind v4 — CSS-first revolution

Den stora förändringen i v4 vs v3: tokens definieras i CSS, inte JavaScript:

```css
@import "tailwindcss";

@theme {
  --color-primary: var(--miranon-primary);
  --color-copper: var(--miranon-copper);
  --color-ink: var(--miranon-ink);
  --color-background: var(--miranon-background);
  --spacing-base: 4px;
  --font-display: "Inter Display", sans-serif;
  --font-body: "Inter", sans-serif;
}
```

Tokens exponeras som CSS custom properties vid runtime OCH genererar utilities automatiskt (`bg-primary`, `text-copper` etc.). Ny Oxide-motor: 5x snabbare full-builds, 100x+ snabbare inkrementella.

**prefers-contrast:more** (som vi redan har i Vue-buildet) mappas direkt:
```html
<div class="bg-primary contrast-more:bg-primary-dark">
```

### CSS-in-JS: Sjunkande trend

npm-data 2023 → 2026:
- styled-components: 8,5M → 6,8M = **-20%**
- Emotion: 10M → 9,1M = **-9%**
- Tailwind: +100% på 3 år

Mantine v7 lämnade Emotion explicit för "performance and bundle size reasons." Runtime CSS-in-JS är inte dött men nya projekt väljer bort det.

### Panda CSS och StyleX — korta bedömningar

**Panda CSS (v1.9.1, Chakra-teamet):** Build-time CSS-in-JS med typsäkra tokens och zero runtime. Tekniskt imponerande men ~200–500K nedladdningar. För litet ekosystem för produktionskritiska system. Värt att bevaka.

**StyleX (v0.18.2, Meta):** Driver Facebook, Instagram, WhatsApp. 80% CSS-reduktion via atomisk deduplicering. Men v0.x, kräver Babel-plugin, begränsat ekosystem. Inte moget nog utanför Meta.

### Rekommendation: Tailwind CSS v4 + CSS custom properties

**Avgörande faktorer:**
1. **Bäst token-integration** — våra `--miranon-*` tokens registreras direkt i @theme
2. **shadcn/ui-kompatibilitet** — samma CSS vars + Tailwind + headless-mönster
3. **Noll runtime** — all CSS kompileras build-time
4. **Dark mode + prefers-contrast** — inbyggda varianter (`dark:`, `contrast-more:`)
5. **Designsystem för flera produkter** — @theme-tokens paketeras i delad CSS-fil
6. **Ekosystem-momentum** — 12M+/vecka, AI-verktyg standardiserar på det

**Komplement för det Tailwind inte ger:**

| Saknas | Lösning |
|--------|---------|
| Typsäkra tokens | tailwind-merge + clsx + ESLint-plugin |
| className-röra | cn()-helper (shadcn/ui-standard) |
| Komplexa animationer | Framer Motion (vi har redan motion-skill) |
| Komponent-variants | CVA (class-variance-authority) |

---

## 5. Sammanfattande stack

| Lager | Val | Version | Bundle (gzip) | Motivering |
|-------|-----|---------|---------------|------------|
| **UI-primitiver** | React Aria | Latest | Per hook | Bäst a11y, flest komponenter, säkrast underhåll |
| **Routing** | TanStack Router | v1.x | ~41 kB | Typ-säkra search params, Query-synergi |
| **Data-fetching** | TanStack Query | v5.x | ~16,9 kB | CRUD, mutations, offline, DevTools |
| **Styling** | Tailwind CSS v4 | v4.x | 5–20 kB CSS | Token-integration, zero runtime |
| **Animationer** | Framer Motion | Latest | ~15 kB | Redan i vår skill-stack |
| **Formulär** | TanStack Form | Latest | ~5 kB | Samma ekosystem, type-safe |
| **Tabeller** | TanStack Table | Latest | ~15 kB | Headless, sorterar inte data (samma filosofi som MmDataTable) |
| **Variants** | CVA | Latest | ~1 kB | Typsäkra komponent-varianter |
| **Utility** | clsx + tailwind-merge | Latest | ~2 kB | cn()-helper för Tailwind |

### Synergieffekter

```
TanStack Router
    ├── Loaders → TanStack Query (prefetch)
    ├── Search params → Zod → TanStack Table (filter/sort/page)
    └── Context → queryClient → alla routes
    
React Aria
    ├── Hooks → Egna komponenter (a11y)
    └── FocusScope, useOverlay → MmDialog, MmMenu (mappat från Vue composables)
    
Tailwind v4
    ├── @theme → --miranon-* tokens
    ├── CVA → Komponent-varianter
    └── cn() → Conditional styling
```

---

## 6. Risker och trade-offs

### Arkitekturrisk: TanStack-beroende
Tre kärnbibliotek från samma ekosystem (Router, Query, Table). Om TanStack-utvecklingen saktar ned påverkas hela stacken.

**Mitigering:** TanStack är open source med stort community (49K+ stjärnor för Query). Tanner Linsley är heltid på TanStack. Varje del kan bytas oberoende — Router kan ersättas av React Router, Query av SWR, Table av @tanstack/react-table har inga alternativ ändå.

### React Aria: Inlärningskurva
React Aria är hooks-baserat och kräver mer boilerplate än Radix. Varje komponent kräver att du monterar hooks manuellt och kopplar ARIA-attribut.

**Mitigering:** Detta matchar vår filosofi — vi bygger redan egna komponenter med composables. Mer kontroll = högre kvalitet. Inlärningskurvan är en engångskostnad.

### Tailwind: className-läsbarhet
Långa className-strängar i JSX kan bli svårlästa.

**Mitigering:** cn()-helper + CVA-varianter + ESLint-plugin-tailwindcss. Konsekvent klassordning. Extrahera komplexa stilar till separata variabler.

### Bundle size
Total estimerad JavaScript-bundle: ~95 kB gzip (Router 41 + Query 17 + Motion 15 + Table 15 + övrigt 7).

**Bedömning:** Acceptabelt för intern admin-app. Inte lämpligt för publik landningssida (men det bygger vi i Framer).

---

## 7. Vue composables → React hooks: Mappning

| Vue composable | React-ekvivalent | Bibliotek |
|----------------|------------------|-----------|
| useId | useId | React 18+ (inbyggt) |
| useFocusStack | FocusScope | React Aria |
| useScrollLock | usePreventScroll | React Aria |
| alertScreenReader | announce() / useAnnounce | React Aria LiveAnnouncer |
| useControllable | useControlledState | React Aria (inbyggt i hooks) |
| usePresence | useTransition / AnimatePresence | React 18+ / Framer Motion |
| useFocusScope | FocusScope | React Aria |
| useDismissable | useDismiss / useOverlayTrigger | React Aria |
| useCollection | useCollection | React Aria Collections |
| useRovingFocus | useTabList / useGridList | React Aria |
| useTypeAhead | Inbyggt i useComboBox, useSelect | React Aria |
| useResizable | useMove / custom hook | React Aria useMove + custom |
| useDashboardData | useQuery + queryOptions | TanStack Query |
| useUserDisplayName | useQuery | TanStack Query |

**Fundamental skillnad:** Vue composables är reaktiva (ref/computed triggar uppdateringar). React hooks kör om hela funktionen vid state-ändring. Mönstren är konceptuellt lika men implementationsdetaljerna skiljer sig — state-uppdateringar, effect-cleanup och memoization hanteras annorlunda.

---

## 8. Nästa steg

1. **Validera stacken** — Bygg en minimal proof-of-concept (1 route, 1 query, 1 React Aria-komponent, Tailwind tokens)
2. **Definiera migrationsordning** — Vilka komponenter först? (Förslag: MmDialog → MmButton → MmDataTable)
3. **Sätt upp projektstruktur** — Vite + TypeScript + TanStack Router (filbaserat) + TanStack Query + Tailwind v4
4. **Migrera design tokens** — @theme-fil med alla --miranon-* tokens
5. **Bygg React Aria wrapper-hooks** — Mappning av Vue composables → React hooks

---

*Research genomförd med 4 parallella agenter, >140 web-sökningar, data från npm, GitHub, pkgpulse.com, npmtrends.com, patterns.dev, State of React 2025.*
