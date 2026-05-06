# BUILD-LOG — Miranon Media Admin (React)

Kronologisk implementation journal per session. Varje session dokumenterar vad som faktiskt hände — planerat vs. faktiskt, avvikelser, verifieringsresultat, och teknisk skuld som skjuts upp.

Detta är **inte** en kravspec (den finns i `byggplan.md`) och **inte** en arkitekturbeskrivning (den finns i `DESIGN-SYSTEM-SPEC.md` + `decisions/`). Det är en förstekammare för framtida läsare som frågar *"varför gjordes det så här, på den tiden?"*.

## Miljö

| Parameter | Värde |
|-----------|-------|
| OS | Darwin 25.3.0 (macOS, `x86_64`) — Darwin Kernel Version 25.3.0: Wed Jan 28 20:53:28 PST 2026 |
| Node | v24.13.1 |
| npm | 11.8.0 |
| TypeScript | 6.0.2 |
| Vite | 8.0.8 |
| React | 19.2.5 |
| Tailwind CSS | 4.2.2 (`@tailwindcss/vite` 4.2.2) |
| Biome | 2.4.11 |

Uppdateras vid större versionsändringar. Mindre patch-uppdateringar (auto via `npm audit fix`, dependabot) noteras i `package-lock.json`-diff men inte här.

## Innehåll

- [Session 1 (React) — Fas 0 + Fas 1 + dokumentation](#session-1-react--fas-0--fas-1--dokumentation)
  - [Fas 0: Projektsetup + tokens](#fas-0-projektsetup--tokens)
  - [Fas 1: Domäntransplant](#fas-1-domäntransplant)
- [Session-modellen](#session-modellen)

---

## Session 1 (React) — Fas 0 + Fas 1 + dokumentation

**Datum:** 2026-04-13 till 2026-04-14
**Session-nummer:** 1 (React) — motsvarar Session 31 i total projekthistorik. Vue-bygget var session 1–30 i `~/Repon/miranon-media-os/`.
**Commit-range:** `1aa2544` → `c91bfa0` → docs-commit (denna session)
**Effort-nivå:** max

Första session där React-repot faktiskt får kod. Innan denna session fanns bara `CLAUDE.md`, `tasks/todo.md`, `tasks/lessons.md` samt en init-commit (`869c7c6`). Sessionen omfattar **två fullständiga implementation-faser (Fas 0 + Fas 1)** samt sessionsavslutets dokumentationsläggning.

### Fas 0: Projektsetup + tokens

**Commit-range:** `1aa2544` → `fcc6de3` → `e3d8e8a`
**Primär commit:** `fcc6de3 fas 0: projektsetup + tokens`
**Lärdoms-commit:** `e3d8e8a lessons: två UNIVERSAL-lärdomar från Fas 0`
**Mål:** Fungerande React-projekt med alla verktyg installerade, tokens konfigurerade, lint som passerar. Se [`conversion-plan.md`](archive/conversion-plan-2026-04-14.md) §D Fas 0.

#### Planerat vs faktiskt

**Planerat:** 19 filer enligt [`conversion-plan.md`](archive/conversion-plan-2026-04-14.md) §D Fas 0 + `tasks/todo.md` Fas 0-checklista (inklusive [GA]-tillägg).

**Faktiskt skapat (22 filer, 6 502 insertions enligt `git show --stat fcc6de3`):**

| Fil | Rader | Kategori |
|-----|-------|----------|
| `package.json` | 51 | config |
| `package-lock.json` | 5 732 | lockfile |
| `tsconfig.json` | 4 | config |
| `tsconfig.app.json` | 31 | config |
| `tsconfig.node.json` | 22 | config |
| `vite.config.ts` | 19 | config |
| `biome.json` | 56 | config |
| `playwright.config.ts` | 39 | config |
| `index.html` | 13 | entry |
| `.gitignore` | 27 | config |
| `.claude/settings.json` | 10 | config (pre-commit hook) |
| `src/main.tsx` | 42 | entry |
| `src/vite-env.d.ts` | 1 | types |
| `src/env.ts` | 19 | [GA] env-validering |
| `src/lib/cn.ts` | 6 | util |
| `src/lib/report-web-vitals.ts` | 40 | [GA] observability |
| `src/styles/base.css` | 77 | styles |
| `src/styles/tailwind.css` | 109 | styles (@theme) |
| `src/styles/tokens/primitives.css` | 108 | tokens (lager 1) |
| `src/styles/tokens/semantic.css` | 66 | tokens (lager 2) |
| `src/styles/tokens/components.css` | 10 | tokens (lager 3, skelett) |
| `public/sw.js` | 20 | [GA] service worker-skelett |

**Skillnader mot plan:**

- **Bonus-fil:** `src/vite-env.d.ts` (1 rad: `/// <reference types="vite/client" />`). Krävs för att `import.meta.env` ska typas och för att `import './styles/*.css'` ska accepteras av `tsc`. Inte listad i conversion-plan men nödvändig i praktiken.
- **`.env.local`** skapades lokalt (Supabase URL + anon key kopierade från Vue-repo) men **inte committad** — verifierat med `git check-ignore .env.local`. `.gitignore` regel: `.env.*`.
- **`public/favicon/*`** och **`public/miranon-logo.svg`** skapades inte i Fas 0 — flyttades till Fas 1 tillsammans med övriga binary assets.

#### Dependencies installerade

Output från `npm ls --depth=0` efter Fas 0 + Fas 1 (versioner identiska, ingen ny dep i Fas 1):

**Dependencies (runtime):**
```
@react-aria/focus@3.21.5
@react-aria/overlays@3.31.2
@react-aria/utils@3.33.1
@react-stately/collections@3.12.10
@sentry/react@10.48.0
@supabase/supabase-js@2.103.0
@t3-oss/env-core@0.13.11
@tanstack/react-query@5.99.0
@tanstack/react-query-devtools@5.99.0
@tanstack/react-router@1.168.19
@tanstack/react-table@8.21.3
@tanstack/router-plugin@1.167.20
class-variance-authority@0.7.1
clsx@2.1.1
lucide-react@1.8.0
motion@12.38.0
react@19.2.5
react-aria-components@1.16.0
react-dom@19.2.5
react-remove-scroll@2.7.2
tailwind-merge@3.5.0
web-vitals@5.2.0
zod@4.3.6
```

**Dev dependencies:**
```
@biomejs/biome@2.4.11
@playwright/test@1.59.1
@tailwindcss/vite@4.2.2
@types/react@19.2.14
@types/react-dom@19.2.3
@vitejs/plugin-react@6.0.1
tailwindcss@4.2.2
typescript@6.0.2
vite@8.0.8
```

**Totalt:** 300 paket, 0 vulnerabilities (`npm audit --audit-level=high` = 0 high/critical).

#### Avvikelser från prompten

| Avvikelse | Beslut | ADR |
|-----------|--------|-----|
| Biome 2.4 (ej ESLint + Stylelint + Prettier) | Single-tool chain, snabbare, en config | [ADR-001](decisions/ADR-001-biome-over-eslint-stylelint-prettier.md) |
| Tailwind v4 `@theme` CSS-first (ej `tailwind.config.ts`) | En sanningskälla per token-lager | [ADR-002](decisions/ADR-002-tailwind-v4-theme-css-first.md) |
| `--p-space-0-5` (bindestreck, ej `0.5`) | Biomes CSS-parser avvisade perioder — 244 parse-fel | [ADR-003](decisions/ADR-003-css-custom-property-naming.md) |
| `baseUrl` borttaget ur `tsconfig.app.json` | Motiveringen var fel (TS 7.0 ej deprecated i TS 6.0.2), fixen är framtidssäker | [ADR-004](decisions/ADR-004-typescript-baseurl-removal.md) |
| **DESIGN-SYSTEM-SPEC.md fixar i Vue-repot:** `--p-gold-700: #8E5F07` → `#96680A` + `--p-space-0.5` → `0-5` | Parallell fix i Vue-repo commit `7013896` (pushad) | [ADR-003](decisions/ADR-003-css-custom-property-naming.md) |
| `TanStackRouterVite`-pluginet **borttaget ur `vite.config.ts`** | ENOENT-krasch vid build eftersom `src/routes/` inte existerar. TODO-kommentar för Fas 2-återinförande. | — (uppskjuten teknisk skuld, inte en ADR) |

#### Verifieringsresultat

| Steg | Krav | Faktiskt resultat |
|------|------|-------------------|
| `npm run dev` | Startar utan fel | ✅ Vite 8.0.8, redo på 320 ms, port 5174 (5173 upptagen) |
| `npm run build` | Output utan varningar | ✅ 97 moduler transformerade, `dist/index.html` 0.45 kB, `dist/assets/index-*.css` 10.83 kB, `dist/assets/index-*.js` 244.73 kB (gzip: 75.51 kB) |
| `npx tsc --noEmit` | 0 fel | ✅ 0 |
| `npx @biomejs/biome check .` | 0 fel | ✅ exit=0, 4 warnings (`!important` i `prefers-reduced-motion` — accepterat a11y-mönster) |
| Token-CSS | `--mm-primary` → `#d4960a` | ✅ Grep i `dist/assets/index-*.css` bekräftar hela kedjan: `--color-primary: var(--mm-primary) → var(--p-gold-500) → #d4960a` |
| Tailwind utilities genererade | `text-primary, bg-surface, bg-bg, text-text-secondary, text-caption, text-body, font-sans, text-4xl` | ✅ Alla 8 finns i bundled CSS |
| Service worker registrerad | `navigator.serviceWorker.controller !== null` | ✅ Kod på plats i `main.tsx` (runtime-verifiering kräver browser) |
| web-vitals importerbar | Kompilerar utan fel | ✅ tsc + build passerar |
| Env-validering kraschar | Saknad `VITE_SUPABASE_URL` → ZodError | ✅ Node-test bevisar: `Error: Invalid environment variables [VITE_SUPABASE_URL: Invalid input: expected string, received undefined]` |
| `npm audit --audit-level=high` | 0 high/critical | ✅ `found 0 vulnerabilities` |

#### Kända uppskjutna beslut / teknisk skuld

- **TanStack Router-plugin:** Borttaget ur `vite.config.ts` eftersom `src/routes/` inte existerar. Återinförs i Fas 2 när första route skapas. Kommentar i `vite.config.ts` dokumenterar steget.
- **CSP-nonce security headers-plugin:** Nämndes i prompten som `[GA]`-tillägg. Placeholder-kommentar i `vite.config.ts` (rad 6). Fullständig implementation i Fas 7 (Security consolidation).
- **Biomes `no-arbitrary-value` + `no-hardcoded-colors`:** Planerade custom GritQL-plugins som ska blockera `text-[19px]` och hårdkodade hex-värden i komponenter. Implementeras i Fas 7.
- **`lucide-react@1.8.0`:** npm gav version 1.8.0 vilket är avvikande från det förväntade (~0.500.x). Inte använt i Fas 0 eller Fas 1, men värt att undersöka innan Fas 3 (UI-primitiver) när ikoner börjar användas.

#### Tidsåtgång & observationer

- **Planerad tid:** 1 session
- **Faktisk tid:** ~1.5 timmar (inklusive verifiering och fix-loopar)
- **Oväntade friktionspunkter:**
  1. Biomes CSS-parser kraschade på `--p-space-0.5` (→ [ADR-003](decisions/ADR-003-css-custom-property-naming.md))
  2. TanStackRouter-plugin kraschade på saknad routes-mapp (borttaget)
  3. `baseUrl` TS 6.0 deprecation-varning (→ [ADR-004](decisions/ADR-004-typescript-baseurl-removal.md))
  4. Biome kunde inte parsa `@theme` utan `tailwindDirectives: true` (config-tillägg)

#### Lärdomar (universella)

Två nya `[UNIVERSAL]`-poster tillagda i `tasks/lessons.md` vid Fas 0-avslutet (commit `e3d8e8a`):

1. **CSS custom properties: undvik perioder i namn.** Biome + Lightning CSS avvisar dem. Bindestreck (`--p-space-0-5`) är den kompatibla formen.
2. **Hävda aldrig en specifik versionsorsak utan att först verifiera installerad version.** Fas 0 motiverade `baseUrl`-borttag med "TS 7.0 deprecated" — verkligheten var TS 6.0.2 med en varning. Kör `tsc --version` / `node --version` / `npm ls <paket>` innan du skriver "enligt version X".

#### Definition of Done uppfylld: Ja ✅

Godkänt av Marcus efter manuell granskning av verifieringsresultat och avvikelser. Alla 10 verifieringssteg i `tasks/todo.md` Fas 0 är gröna, samtliga avvikelser dokumenterade i [ADR-001](decisions/ADR-001-biome-over-eslint-stylelint-prettier.md) → [ADR-004](decisions/ADR-004-typescript-baseurl-removal.md). Fas 0 → `fcc6de3` + lärdoms-commit → `e3d8e8a`.

---

### Fas 1: Domäntransplant

**Commit-range:** `e3d8e8a` → `c91bfa0`
**Primär commit:** `c91bfa0 fas 1: domäntransplant`
**Mål:** Alla domain- och data-filer kopierade från Vue-repot, Zod-scheman tillagda, supabase-client konsoliderad via `@/env`, `fetchWithRetry` på infrastrukturnivå. Se [`conversion-plan.md`](archive/conversion-plan-2026-04-14.md) §D Fas 1 + §C/C2 (transplant-inventering).

#### Planerat vs faktiskt

**Planerat enligt Fas 1-prompten + conversion-plan:** 13 src-filer + 8 Zod-scheman + `fetchWithRetry` + docs/supabase via FILE-INVENTORY-scriptet.

**Faktiskt (68 filer, 13 106 insertions enligt `git show --stat c91bfa0`):**

**Kopierade src-filer (rakt av från Vue-repot):**

| Fil | Rader | Anmärkning |
|-----|-------|------------|
| `src/domain/models/Attendance.ts` | 10 | — |
| `src/domain/models/Engagement.ts` | 10 | — |
| `src/domain/models/Event.ts` | 20 | Namnkollision med DOM Event — se [ADR-007](decisions/ADR-007-event-name-collision-deferred-aliasing.md) |
| `src/domain/models/Lead.ts` | 13 | — |
| `src/domain/models/MailPayload.ts` | 31 | 3 interfaces: MailPayload, MailLogEntry, BulkMail |
| `src/domain/models/Person.ts` | 24 | — |
| `src/domain/models/Registration.ts` | 22 | — |
| `src/domain/models/WaitlistEntry.ts` | 14 | — |
| `src/domain/types/Filters.ts` | 34 | — |
| `src/domain/types/Status.ts` | 45 | — |
| `src/data/adapters/DataSourceAdapter.ts` | 59 | — |
| `src/data/adapters/AirtableAdapter.ts` | 177 | — |
| `src/data/adapters/SupabaseAdapter.ts` | 85 | — |
| `src/data/config/supabase-client.ts` | 80 | **Modifierad** — se [ADR-009](decisions/ADR-009-supabase-client-env-consolidation.md) och [ADR-006](decisions/ADR-006-fetch-with-retry-infrastructure.md) |
| `src/lib/alert-screen-reader.ts` | 167 | Kebab-case rename från `alertScreenReader.ts` |
| `src/lib/focus-utils.ts` | 90 | Kebab-case rename från `focusUtils.ts` |

**Skapade `[GA]`-filer:**

| Fil | Rader | Anmärkning |
|-----|-------|------------|
| `src/data/utils.ts` | 65 | `fetchWithRetry` — se [ADR-006](decisions/ADR-006-fetch-with-retry-infrastructure.md) |
| `src/domain/schemas/Attendance.schema.ts` | 19 | Zod-schema |
| `src/domain/schemas/Engagement.schema.ts` | 12 | Zod-schema |
| `src/domain/schemas/Event.schema.ts` | 22 | Zod-schema |
| `src/domain/schemas/Lead.schema.ts` | 15 | Zod-schema |
| `src/domain/schemas/MailPayload.schema.ts` | 33 | 3 schemas (MailPayloadSchema, MailLogEntrySchema, BulkMailSchema) |
| `src/domain/schemas/Person.schema.ts` | 26 | Zod-schema |
| `src/domain/schemas/Registration.schema.ts` | 24 | Zod-schema |
| `src/domain/schemas/WaitlistEntry.schema.ts` | 16 | Zod-schema |
| `src/domain/schemas/index.ts` | 18 | Barrel-export |
| `src/domain/__tests__/schemas.assignable.ts` | 66 | `AssertEqual`-compile-time-test för schema↔interface parity |
| `scripts/verify-phase-1.ts` | 173 | Runtime-verifiering (Node `--experimental-strip-types`) |

**Kopierade docs (selektivt från FILE-INVENTORY-scriptet):**

21 filer i `docs/` (plattade ut, inte under `react-migration/`): `conversion-plan.md`, `DESIGN-MANIFESTO.md`, `DESIGN-OPERATING-SYSTEM.md`, `DESIGN-SYSTEM-SPEC.md`, `SECURITY-SPEC.md`, `PERFORMANCE-BUDGET.md`, `STATE-STRATEGY.md`, `URL-STATE-SPEC.md`, `ARIA-UPGRADE.md`, `FUTURE-COMPAT.md`, `SPA-ARCHITECTURE-DECISION.md`, `gap-analysis.md`, `README.md`, `ACCESSIBILITY-CHECKLIST.md`, `ACCESSIBILITY-AUDIT-MALL.md`, `KVALITETSDEFINITIONER-11.md`, `DOKUMENTATIONSSTANDARD.md`, `BYGGPLAN-LÄTTLÄST.md`, `BYGGPLAN-LÄTTLÄST-v2.md`, `features/FEATURE-ACTIVITY-LOG.md`, plus 4 research-filer under `docs/research/`.

**Supabase Edge Functions (7 filer):**

`supabase/functions/_shared/airtable-client.ts`, `_shared/cors.ts`, `create-admin-user/index.ts`, `get-events/index.ts`, `get-persons/index.ts`, `get-registrations/index.ts`, `update-record/index.ts`.

**Binärer:**

`public/favicon/*` (7 filer: `apple-touch-icon.png`, `favicon-96x96.png`, `favicon.ico`, `favicon.svg`, `site.webmanifest`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`) + `public/miranon-logo.svg`.

**Config-ändringar:**

- `biome.json` — exkludering av `supabase/functions` ([ADR-010](decisions/ADR-010-biome-exclude-deno-edge-functions.md))

**Skippade från FILE-INVENTORY-scriptet (se [ADR-008](decisions/ADR-008-file-inventory-selective-run.md)):**

- `tasks/lessons.md` — React-versionen har Fas 0-lärdomar Vue-versionen saknar
- `tasks/todo.md` — React-versionen är aktuell
- `.claude/settings.json` — React-versionen har rätt sökväg
- `.claude/settings.local.json` — behövs inte

#### Dependencies installerade

Ingen ny dep i Fas 1. Zod, @t3-oss/env-core och web-vitals installerades redan i Fas 0. Fas 1 använder bara det som redan fanns.

#### Avvikelser från prompten

| Avvikelse | Beslut | ADR |
|-----------|--------|-----|
| Zod parallella definitioner (ej schema-som-sanningskälla) | Bevarar "kopieras rakt av"-garantin; refaktorering uppskjuten till Fas 2/3 | [ADR-005](decisions/ADR-005-zod-parallell-definitions.md) |
| `fetchWithRetry` i `src/data/utils.ts` (ej `adapters/utils.ts`) | Undviker cirkelberoende `config/` ↔ `adapters/` | [ADR-006](decisions/ADR-006-fetch-with-retry-infrastructure.md) |
| `fetchWithRetry` injicerad i `callEdgeFunction`/`postEdgeFunction` (ej i varje adapter-metod) | Infrastruktur-nivå, adapters ovetande om retry-logik | [ADR-006](decisions/ADR-006-fetch-with-retry-infrastructure.md) |
| `supabase-client.ts` importerar från `@/env` (ej `import.meta.env`) | En sanningskälla för env-validering | [ADR-009](decisions/ADR-009-supabase-client-env-consolidation.md) |
| `Event`-interface kopierad rakt av utan alias | Inga `.tsx`-filer i Fas 1 = inget aktuellt problem | [ADR-007](decisions/ADR-007-event-name-collision-deferred-aliasing.md) |
| FILE-INVENTORY-scriptet INTE kört (selektiv manuell kopiering istället) | Skyddar Fas 0-versioner av `tasks/` och `.claude/` | [ADR-008](decisions/ADR-008-file-inventory-selective-run.md) |
| `biome.json` exkluderar `supabase/functions` | Deno-kod ska lintas av Deno, inte Biome | [ADR-010](decisions/ADR-010-biome-exclude-deno-edge-functions.md) |
| `useOptionalChain`-warnings auto-fixade i 3 filer | Kosmetisk hygien för grön Biome | — |

#### Verifieringsresultat

Samtliga verifierade via `scripts/verify-phase-1.ts` (runtime) + `tsc` + `biome`:

| Test | Krav | Faktiskt |
|------|------|----------|
| `npx tsc --noEmit` | 0 fel | ✅ 0 |
| Typer resolvar (Event, Registration, Person) | Import kompilerar | ✅ via `schemas.assignable.ts` som importerar alla modeller + scheman |
| `z.infer<typeof XxxSchema>` assignable till interface | 10 compile-time-asserts | ✅ `AssertEqual` tvåvägs strukturell jämlikhet på alla 10 typer (Attendance, Engagement, Event, Lead, MailPayload, MailLogEntry, BulkMail, Person, Registration, WaitlistEntry) |
| `EventSchema.parse({})` | Kastar ZodError | ✅ Runtime-verifierat: `ZodError` med `path: ['id']`, `message: 'Invalid input: expected string, received undefined'` |
| `fetchWithRetry` retry-count | 4 försök (1 + 3 retries) vid nätverksfel | ✅ Exakt 4 anrop |
| `fetchWithRetry` backoff | 200ms, 400ms, 800ms ± jitter | ✅ Sleep 1: 200–300ms, Sleep 2: 400–500ms, Sleep 3: 800–900ms |
| `fetchWithRetry` fel propageras | Sista felet throws efter retries | ✅ `TypeError('network error')` propageras |
| `alertScreenReader('test')` | Skapar `<div>` i document.body med rätt attribut | ✅ DOM-stub bekräftar: wrapper finns i body, har `data-mm-announcer`, har `aria-live`, har `<p>test</p>`-barn |
| `npx @biomejs/biome check .` | exit=0 | ✅ exit=0, 4 warnings (samma som Fas 0) |

**Sammanfattning av runtime-verifiering:** `scripts/verify-phase-1.ts` → `11 passed, 0 failed`.

#### Kända uppskjutna beslut / teknisk skuld

- **Zod refaktorering:** Schema blir sanningskälla via `z.infer<typeof ...>` i Fas 2/3 när vi ändå rör domain-filer för branded types + discriminated unions ([ADR-005](decisions/ADR-005-zod-parallell-definitions.md))
- **Event-aliasering:** Lokal alias per `.tsx`-fil i Fas 2+. Global rename till `MiranonEvent` om 5+ filer behöver alias. ([ADR-007](decisions/ADR-007-event-name-collision-deferred-aliasing.md))
- **Deno lint/format/check på edge functions:** Fas 7 ska lägga till `deno check supabase/functions/**/*.ts` i pre-commit-hook + CI. ([ADR-010](decisions/ADR-010-biome-exclude-deno-edge-functions.md))
- **Schema-validering i adapter-metoder:** Fas 1 har scheman men inga adapter-metoder använder `.parse()`-anrop ännu. Fas 2 ska wrappar `callEdgeFunction`-resultat med `EventSchema.array().parse(data.events)` etc.
- **docs/specs/DESIGN-SYSTEM-SPEC.md stale-risk:** Kopierad till React-repot. Framtida uppdateringar i Vue-repot synkas inte automatiskt. Governance-beslut uppskjutet efter alla faser per Marcus beslut (Session 1 (React), = Session 31 i total historik).

#### Tidsåtgång & observationer

- **Planerad tid:** 0.5 session (conversion-plan estimate)
- **Faktisk tid:** ~1 timme (inklusive ADR-diskussion, verifieringsloop)
- **Oväntade friktionspunkter:**
  1. Biomes `useBiomeIgnoreFolder` ville ha `!supabase/functions` (utan `/**`)
  2. DOM-stub i `verify-phase-1.ts` behövde iterera tills alla API:er som `alert-screen-reader.ts` anropar var tillgängliga (`style`, `firstChild`, `.remove()`, `parentElement`)
  3. Fas 0-warning om `!important` i `prefers-reduced-motion` förblev (accepterat)

#### Filstruktur-snapshot (slutet av Fas 1)

```
src/
├── data/
│   ├── adapters/
│   │   ├── AirtableAdapter.ts
│   │   ├── DataSourceAdapter.ts
│   │   └── SupabaseAdapter.ts
│   ├── config/
│   │   └── supabase-client.ts       [modifierad — @/env + fetchWithRetry]
│   └── utils.ts                     [GA — fetchWithRetry]
├── domain/
│   ├── __tests__/
│   │   └── schemas.assignable.ts    [AssertEqual compile-time-test]
│   ├── models/
│   │   ├── Attendance.ts
│   │   ├── Engagement.ts
│   │   ├── Event.ts
│   │   ├── Lead.ts
│   │   ├── MailPayload.ts
│   │   ├── Person.ts
│   │   ├── Registration.ts
│   │   └── WaitlistEntry.ts
│   ├── schemas/                     [GA]
│   │   ├── Attendance.schema.ts
│   │   ├── Engagement.schema.ts
│   │   ├── Event.schema.ts
│   │   ├── Lead.schema.ts
│   │   ├── MailPayload.schema.ts
│   │   ├── Person.schema.ts
│   │   ├── Registration.schema.ts
│   │   ├── WaitlistEntry.schema.ts
│   │   └── index.ts
│   └── types/
│       ├── Filters.ts
│       └── Status.ts
├── env.ts                           [GA — @t3-oss/env-core]
├── lib/
│   ├── alert-screen-reader.ts
│   ├── cn.ts
│   ├── focus-utils.ts
│   └── report-web-vitals.ts         [GA — web-vitals]
├── main.tsx
├── styles/
│   ├── base.css
│   ├── tailwind.css                 [@theme]
│   └── tokens/
│       ├── components.css           [skelett]
│       ├── primitives.css           [lager 1]
│       └── semantic.css             [lager 2]
└── vite-env.d.ts
```

**Totalt:** 37 `.ts`/`.tsx`/`.css`-filer i `src/` efter Fas 1.

#### Definition of Done uppfylld: Ja ✅

Godkänt av Marcus efter manuell granskning av verifieringsresultat och avvikelser. Alla 9 verifieringspunkter i Fas 1 (tsc, biome, schema-parity, ZodError, fetchWithRetry retry-count + backoff, alertScreenReader DOM-stub, commit, push) är gröna. Runtime-verifiering via `scripts/verify-phase-1.ts`: **11 passed, 0 failed**. Samtliga avvikelser dokumenterade i [ADR-005](decisions/ADR-005-zod-parallell-definitions.md) → [ADR-010](decisions/ADR-010-biome-exclude-deno-edge-functions.md). Fas 1 → `c91bfa0`.

---

## Session 2 (React) — Fas A: Säkerhetshardening + P0–P3a (byggplan-revision)

**Datum:** 2026-04-30 till 2026-05-05
**Session-nummer:** 2 (React) — motsvarar Session 32–34 i total projekthistorik (3 arbetsdagar effektiv tid spridda över 7 kalenderdagar).
**Commit-range:** `9490d8e` → `b2ab337` (Fas A: 18 commits — 14 M-mappade + 4 omgivande doc; P0–P3a: ~17 commits — kärna + städning + direktiv-status)
**Effort-nivå:** max

Sammansatt session som omfattar Fas A (säkerhetshardening, M1–M8) och hela byggplan-revisionen (P0 → P1 → P2 → P3a). Fas A låste arkitekturmönster post-Vue (operations-baserat API, AuthContext|Response, INVARIANT, structured logging, klient-DSN, test-prefix-konvention). Byggplan-revisionen ersatte conversion-plan med [`byggplan.md`](byggplan.md) — 13 fas-prompter + 10 nya ADR:er (ADR-011..ADR-020). P3b avslutar genom att städa repo-hygien.

### Fas A: Säkerhetshardening (M1–M8)

**Commit-range:** `9490d8e` (arbetsdokument + Gate A1) → `eee29c1` (övergång till P0). 14 implementations-commits + 4 omgivande dokumentations-commits.
**Mål:** Stänga 8 säkerhetsluckor identifierade i Code-verifieringen 2026-04-29 (auth, CORS, write-API, payload-eskapering, observability, config).
**Auktoritativ trail:** [`tasks/sessions/2026-05-04-security-hardening.md`](../tasks/sessions/2026-05-04-security-hardening.md) — full DoD per M, Gate A1-A4-svar, 8 arkitekturmönster.

#### Planerat vs faktiskt

**Planerat:** 8 milstolpar i körordningen M1 → M2 → M8 → M6 → M3 → M4 → M5 → M7 (per direktiv §8.5.4 + Gate A1).
**Faktiskt:** 8 milstolpar levererade i exakt planerad ordning. 14 commits (snitt 1.75 commits/M). Tre milstolpar krävde hot-fixes (M2 ×2, M4 discovery, M8 ×1) — inom toleransramen för "max"-effort.

#### Milstolpar — commit-tabell + 1-rads sammanfattning

| # | Commit | M | Subject | Sammanfattning |
|---|---|---|---|---|
| 1 | `6d84bb8` | M1 | feat(security): M1 — requireUser-helper för Edge Functions | Helper i `_shared/auth.ts` returnerar `{user}` eller 401. Mönster: AuthContext\|Response. |
| 2 | `26e38bc` | M2 | feat(security): M2 — wire requireUser i datafunktioner + Playwright deny-paths | requireUser anropas först efter handleCors i 4 datafunktioner. |
| 3 | `249193b` | M2 | docs(security): M2 — TODO Fas 7-not för test*-exkludering + lessons | Test-prefix-konvention dokumenterad. |
| 4 | `382c6b5` | M2 | fix(security): rename _test_auth → test-auth (Supabase CLI namn-constraint) | Hot-fix. Underscore-prefix förkastas av Supabase CLI. |
| 5 | `605502f` | M2 | fix(security): M2 staging-verifiering — assertions hanterar gateway+helper | Hot-fix. Tester skiljer Supabase Gateway-401 från requireUser-401. |
| 6 | `09f780b` | M8 | feat(security): M8 — supabase/config.toml med verify_jwt per funktion | Per-funktion JWT-verifiering, config committad. |
| 7 | `620c407` | M8 | docs(lessons): nya UNIVERSAL — Supabase två-stegs auth-check | Lessons-fångst. |
| 8 | `86e7953` | M8 | fix(security): classify401Body atomär — status + body i ett anrop | Hot-fix. Race condition stängd: ATOMÄR-LÄSNING-mönstret. |
| 9 | `e76179e` | M6 | feat(security): M6 — caller-verifiering i create-admin-user | admin-only via JWT-claim-kontroll. |
| 10 | `1259d53` | M3 | feat(security): M3 — CORS origin-allowlist (env-driven) | Wildcard CORS borttaget; allowlist via env-var. |
| 11 | `10dcc51` | M4 | docs(security): M4 discovery — Vue saknar write-UI, hypotes oförankrad | Discovery-rapport före implementation: operations-allowlist måste bli infrastruktur. |
| 12 | `8773de0` | M4 | feat(security): M4 — operations-allowlist (infrastruktur, tom lista) | `_shared/field-allowlists.ts` — operations registreras stegvis i Fas 5.5/6 per ADR-016. |
| 13 | `0cf27b8` | M5 | feat(security): M5 — formula-injection-eskapering + INVARIANT-test | `_shared/airtable-filter.ts` — INVARIANT round-trip-tester. |
| 14 | `924af41` | M7 | feat(security): M7 — generisk felmodell + Sentry-init | `_shared/errors.ts` + `src/observability/sentry.ts`. requestId + structured JSON-loggning. |

**Omgivande dokumentations-commits (icke-M-mappade):**

| Commit | Subject | Roll |
|---|---|---|
| `9490d8e` | docs(security): Fas A arbetsdokument + Gate A1 godkänt | Pre-M1 — arbetsdokumentet etablerat |
| `f097dd6` | direktiv §8.5 Fas A-fynd | Mid-Fas A — direktiv-uppdatering |
| `126abf0` | Fas A slutsummering | Post-M7 — sessionsdok låst |
| `eee29c1` | direktiv: Fas A slutförd + städnings-DoD i P3 | Övergång — markerar Fas A SLUTFÖRD i direktiv §11 |

#### Avvikelser

Tre M:er krävde mer än en commit. Detaljerade orsaker + lärdomar finns i [`security-hardening.md`](../tasks/sessions/2026-05-04-security-hardening.md) §B (per-M DoD-block):

- **M2 (4 commits):** Hot-fix `382c6b5` — Supabase CLI accepterar inte underscore-prefix på funktionsnamn → test-prefix-konvention `test-*` införs. Hot-fix `605502f` — staging-tester misstog Supabase Gateway-401 för requireUser-401 → assertions skiljer på källan.
- **M4 (2 commits):** Discovery-rapport `10dcc51` bekräftade att operations-allowlist måste byggas som infrastruktur (tom lista) eftersom Vue inte har write-UI som källa. ADR-016 bygger på detta.
- **M8 (3 commits):** Hot-fix `86e7953` — `classify401Body` läste status och body i två separata anrop, race condition stängd med ATOMÄR-LÄSNING-mönstret.

#### Arkitekturmönster + tester

Fas A etablerade 8 arkitekturmönster (operations-API, AuthContext, INVARIANT, klient-DSN, structured logging, requestId, isOperationalError, test-prefix). Mönstren införlivades i [`SECURITY-SPEC.md`](SECURITY-SPEC.md) §6 + [`STATE-STRATEGY.md`](STATE-STRATEGY.md) §8 i P2 (commits `176984d` + `c2ecffd`) och bär byggplanens §3.

113 tester (Playwright deny-paths per funktion + INVARIANT round-trip + auth-suite). Förväntat antal per direktiv §6 P3-DoD: 113. Verifieras grön i P3b K4 via `npm run test:api`.

#### Filstruktur-snapshot (verifierad mot HEAD 2026-05-05)

```
supabase/
├── config.toml                       [NY — M8: verify_jwt per funktion]
└── functions/
    ├── _shared/
    │   ├── airtable-client.ts        [PRE-FAS A — etablerad 2026-04-13]
    │   ├── airtable-filter.ts        [NY — M5: formula-injection-eskapering + INVARIANT-test]
    │   ├── auth.ts                   [NY — M1: requireUser-helper]
    │   ├── cors.ts                   [MODIFIERAD — M3: origin-allowlist]
    │   ├── errors.ts                 [NY — M7: generisk felmodell]
    │   └── field-allowlists.ts       [NY — M4: operations- + fält-allowlist (infrastruktur)]
    ├── create-admin-user/index.ts    [MODIFIERAD — M6: caller-verifiering]
    ├── get-events/index.ts           [MODIFIERAD — M2: requireUser]
    ├── get-persons/index.ts          [MODIFIERAD — M2: requireUser]
    ├── get-registrations/index.ts    [MODIFIERAD — M2: requireUser]
    ├── update-record/index.ts        [MODIFIERAD — M2 + M4 + M5]
    └── test-auth/                    [NY — M2-helper för Playwright deny-paths-tester. TEKNISK SKULD: ska tas bort från produktion i Fas 7 — verify_jwt = false i config.toml just nu.]

src/
├── observability/
│   └── sentry.ts                     [NY — M7: Sentry-init med klient-DSN]
└── main.tsx                          [MODIFIERAD — M7: initSentry före React-mount]
```

Avvikelser från security-hardening sessionsdokens namnkonvention dokumenterade ovan: `field-allowlists.ts` (kallad `operations.ts` i några tidiga refs), `airtable-filter.ts` (kallad `escape-formula.ts` i några tidiga refs). Faktiska filnamn är de auktoritativa.

#### Tidsåtgång

- **Planerat:** ~19 h (per direktiv §8.5.4) över 2,5 dagars koncentrerad utveckling
- **Faktiskt:** ~3 arbetsdagar spridda över 5 kalenderdagar (2026-04-30 → 2026-05-04). Hot-fixes i M2 (×2) och M8 (×1) lade till ~3-4 h utöver prognos. Inom toleransramen.

#### Definition of Done — Fas A

Ja ✅ (godkänt av Marcus 2026-05-04 vid sessionsavslut för security-hardening). Alla 8 milstolpar levererade per direktiv §8.5.4. Gates A1–A4 godkända. Se sessionsdok §C för Marcus' Gate-svar verbatim.

---

### P0 — Byggplan-revision inventering

**Commit:** `f3e4426 p0: byggplan-revision inventory — alla 9 §D-faser klassade`
**Trail:** Inventeringen är sin egen output — se [`byggplan-revision-inventory.md`](byggplan-revision-inventory.md).
**Mål:** Klassa varje påstående i conversion-plan §D som *oförändrad / behöver justering / behöver omformuleras / försvinner*.
**Resultat:** 9 fas-rader klassade. P0 stop-test passerat 2026-05-04.

---

### P1 — Fas-sekvens-revision (8 beslut, 9 ADR-katalog)

**Commits (kärna):** `810d669` (sessionsdok) → `5ed4668` (§5-applicering till `tasks/byggplan-direktiv.md`, +10/-9 rader) → `5336d02` (avslutningsdok)
**Commits (städning):** `97573c0` (3 UNIVERSAL lessons) + `def879a` (todo P-fas tracking + §11 status-sync)
**Trail:** [`2026-05-04-byggplan-revision-p1.md`](../tasks/sessions/2026-05-04-byggplan-revision-p1.md) + [`2026-05-04-p1-avslutning.md`](../tasks/sessions/2026-05-04-p1-avslutning.md)
**Mål:** Slutgiltig fas-lista för byggplanen. 8 beslut (A1-A5 + B1-B3) på alla "NEW" och "modified scope"-faser.
**Resultat:** §5-tabellen uppdaterad till 15 rader (Fas 8 ny). 9 ADR:er identifierade för P3 (blir ADR-011..ADR-019 efter P3a). 3 UNIVERSAL-lessons. P1 stop-test passerat 2026-05-04.

---

### P2 — Stödspec-synkning (4 specs uppdaterade)

**Commits (kärna):** `89979b5` (sessionsdok + ACCESSIBILITY-CHECKLIST omskrivning) → `176984d` (SECURITY-SPEC: 8 Fas A-mönster införlivade) → `c2ecffd` (STATE-STRATEGY: strangler-fig + operations-API §8)
**Commits (städning):** `1fbb70c` (4 UNIVERSAL lessons) + `167afd7` (todo P3 next)
**Trail:** [`2026-05-04-stodspec-synk-p2.md`](../tasks/sessions/2026-05-04-stodspec-synk-p2.md)
**Mål:** Uppdatera stödspecs. Avgöra A1-scenariobeslutet (Fas 3.5 egen fas eller integrerad).
**Resultat:** 4 specs uppdaterade. **Fas 3.5 = egen fas** (P2-utfall — alla 4 trigger-tabellrader visade JA). 1 ny ADR identifierad (blir ADR-020). 4 UNIVERSAL-lessons. P2 stop-test passerat 2026-05-04.

---

### P3a — Byggplan + ADR-katalog

**Commits:** `6de7c94` (K1 sessionsdok-skelett) → `2ffede0` (K2 byggplan.md, 832 rader) → `866b430` (K3 10 ADRs ADR-011..ADR-020) → `ce9dd02` (K4 README index + sessionsdok pass-status, +266/-14 rader på sessionsdoket)
**Avslutning:** `b2ab337` (track P2 + P3a completion in §11 Status)
**Direktiv-bonus:** `60ad326` (direktiv: byggplan ersätter conversion-plan, P0-P3) — meta-rad i direktivets header som dokumenterar plan-skiftet.
**Trail:** [`2026-05-05-byggplan-skriv-p3a.md`](../tasks/sessions/2026-05-05-byggplan-skriv-p3a.md)
**Mål:** Skriv `docs/byggplan.md` (slutprodukten) + 10 ADR:er + uppdatera `decisions/README.md` index.
**Resultat:** [`byggplan.md`](byggplan.md) v1.1 (832 rader, 13 fas-prompter, alla 8 sektioner per fas). 10 nya ADR:er ADR-011..ADR-020 (snitt 75 rader/ADR). README-index 20 rader. P3a stop-test passerat 2026-05-05.

---

### Definition of Done — Session 2

**Fas A:** Ja ✅ (godkänt av Marcus 2026-05-04). Alla 8 milstolpar levererade per direktiv §8.5.4.
**P0 → P3a:** Ja ✅ (varje fas hade egen stop-test, alla passerade).
**P3b (denna sessions följande klungor):** Avslutar §6 P3-städnings-DoD och markerar direktivet SLUTFÖRT i §12.

---

## Session-modellen

Varje framtida session läggs till denna fil **som en ny `## Session NN`-sektion** (inte under en fas-rubrik — faserna kan spänna över flera sessioner eller flera faser kan rymmas i en session).

Per session:

- **Datum, session-nummer, commit-range** (hash → hash)
- **Mål** (1 mening + länk till byggplan.md §4)
- **Fas/fasers subsektioner** med planerat vs faktiskt, dependencies, avvikelser (ADR-referenser), verifiering, teknisk skuld, filstruktur-snapshot

Syftet är att en ny läsare ska kunna läsa sista sessionen och förstå var vi står idag, utan att scrolla uppåt hela filen.

## Referenser

- [`decisions/`](decisions/) — Architecture Decision Records (20 ADR:er totalt — ADR-001..ADR-010 från Session 1 (React) Fas 0+1, ADR-011..ADR-020 från Session 2 (React) P3a)
- [`byggplan.md`](byggplan.md) — fas-för-fas-planen (styrande)
- [`archive/conversion-plan-2026-04-14.md`](archive/conversion-plan-2026-04-14.md) — historisk fas-för-fas-plan, ersatt av `byggplan.md` per [ADR-012](decisions/ADR-012-conversion-plan-ersatt-av-byggplan.md)
- [`gap-analysis.md`](gap-analysis.md) — gap-analys som motiverade `[GA]`-tilläggen
- [`../tasks/lessons.md`](../tasks/lessons.md) — universella lärdomar
- [`../tasks/todo.md`](../tasks/todo.md) — aktuell todo-status
