<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk. L_WWW-precondition träffad (7 Vale.Terms-fynd). Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

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

Uppdateras vid större versionsändringar. Mindre patch-uppdateringar (auto via `npm audit fix`, Dependabot) noteras i `package-lock.json`-diff men inte här.

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

```text
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

```text
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
- **Deno lint/format/check på Edge Functions:** Fas 7 ska lägga till `deno check supabase/functions/**/*.ts` i pre-commit-hook + CI. ([ADR-010](decisions/ADR-010-biome-exclude-deno-edge-functions.md))
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

```text
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
**Auktoritativ trail:** [`tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md`](../tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md) — full DoD per M, Gate A1-A4-svar, 8 arkitekturmönster.

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

Tre M:er krävde mer än en commit. Detaljerade orsaker + lärdomar finns i [`security-hardening.md`](../tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md) §B (per-M DoD-block):

- **M2 (4 commits):** Hot-fix `382c6b5` — Supabase CLI accepterar inte underscore-prefix på funktionsnamn → test-prefix-konvention `test-*` införs. Hot-fix `605502f` — staging-tester misstog Supabase Gateway-401 för requireUser-401 → assertions skiljer på källan.
- **M4 (2 commits):** Discovery-rapport `10dcc51` bekräftade att operations-allowlist måste byggas som infrastruktur (tom lista) eftersom Vue inte har write-UI som källa. ADR-016 bygger på detta.
- **M8 (3 commits):** Hot-fix `86e7953` — `classify401Body` läste status och body i två separata anrop, race condition stängd med ATOMÄR-LÄSNING-mönstret.

#### Arkitekturmönster + tester

Fas A etablerade 8 arkitekturmönster (operations-API, AuthContext, INVARIANT, klient-DSN, structured logging, requestId, isOperationalError, test-prefix). Mönstren införlivades i [`SECURITY-SPEC.md`](specs/SECURITY-SPEC.md) §6 + [`STATE-STRATEGY.md`](specs/STATE-STRATEGY.md) §8 i P2 (commits `176984d` + `c2ecffd`) och bär byggplanens §3.

113 tester (Playwright deny-paths per funktion + INVARIANT round-trip + auth-suite). Förväntat antal per direktiv §6 P3-DoD: 113. Verifieras grön i P3b K4 via `npm run test:api`.

#### Filstruktur-snapshot (verifierad mot HEAD 2026-05-05)

```text
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
**Trail:** Inventeringen är sin egen output — se [`byggplan-revision-inventory.md`](archive/byggplan-revision-inventory.md).
**Mål:** Klassa varje påstående i conversion-plan §D som *oförändrad / behöver justering / behöver omformuleras / försvinner*.
**Resultat:** 9 fas-rader klassade. P0 stop-test passerat 2026-05-04.

---

### P1 — Fas-sekvens-revision (8 beslut, 9 ADR-katalog)

**Commits (kärna):** `810d669` (sessionsdok) → `5ed4668` (§5-applicering till `tasks/byggplan-direktiv.md`, +10/-9 rader) → `5336d02` (avslutningsdok)
**Commits (städning):** `97573c0` (3 UNIVERSAL lessons) + `def879a` (todo P-fas tracking + §11 status-sync)
**Trail:** [`2026-05-04-byggplan-revision-p1.md`](../tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md) + [`2026-05-04-p1-avslutning.md`](../tasks/sessions/archive/2026-05/2026-05-04-p1-avslutning.md)
**Mål:** Slutgiltig fas-lista för byggplanen. 8 beslut (A1-A5 + B1-B3) på alla "NEW" och "modified scope"-faser.
**Resultat:** §5-tabellen uppdaterad till 15 rader (Fas 8 ny). 9 ADR:er identifierade för P3 (blir ADR-011..ADR-019 efter P3a). 3 UNIVERSAL-lessons. P1 stop-test passerat 2026-05-04.

---

### P2 — Stödspec-synkning (4 specs uppdaterade)

**Commits (kärna):** `89979b5` (sessionsdok + ACCESSIBILITY-CHECKLIST omskrivning) → `176984d` (SECURITY-SPEC: 8 Fas A-mönster införlivade) → `c2ecffd` (STATE-STRATEGY: strangler-fig + operations-API §8)
**Commits (städning):** `1fbb70c` (4 UNIVERSAL lessons) + `167afd7` (todo P3 next)
**Trail:** [`2026-05-04-stodspec-synk-p2.md`](../tasks/sessions/archive/2026-05/2026-05-04-stodspec-synk-p2.md)
**Mål:** Uppdatera stödspecs. Avgöra A1-scenariobeslutet (Fas 3.5 egen fas eller integrerad).
**Resultat:** 4 specs uppdaterade. **Fas 3.5 = egen fas** (P2-utfall — alla 4 trigger-tabellrader visade JA). 1 ny ADR identifierad (blir ADR-020). 4 UNIVERSAL-lessons. P2 stop-test passerat 2026-05-04.

---

### P3a — Byggplan + ADR-katalog

**Commits:** `6de7c94` (K1 sessionsdok-skelett) → `2ffede0` (K2 byggplan.md, 832 rader) → `866b430` (K3 10 ADRs ADR-011..ADR-020) → `ce9dd02` (K4 README index + sessionsdok pass-status, +266/-14 rader på sessionsdoket)
**Avslutning:** `b2ab337` (track P2 + P3a completion in §11 Status)
**Direktiv-bonus:** `60ad326` (direktiv: byggplan ersätter conversion-plan, P0-P3) — meta-rad i direktivets header som dokumenterar plan-skiftet.
**Trail:** [`2026-05-05-byggplan-skriv-p3a.md`](../tasks/sessions/archive/2026-05/2026-05-05-byggplan-skriv-p3a.md)
**Mål:** Skriv `docs/byggplan.md` (slutprodukten) + 10 ADR:er + uppdatera `decisions/README.md` index.
**Resultat:** [`byggplan.md`](byggplan.md) v1.1 (832 rader, 13 fas-prompter, alla 8 sektioner per fas). 10 nya ADR:er ADR-011..ADR-020 (snitt 75 rader/ADR). README-index 20 rader. P3a stop-test passerat 2026-05-05.

---

### Definition of Done — Session 2

**Fas A:** Ja ✅ (godkänt av Marcus 2026-05-04). Alla 8 milstolpar levererade per direktiv §8.5.4.
**P0 → P3a:** Ja ✅ (varje fas hade egen stop-test, alla passerade).
**P3b (denna sessions följande klungor):** Avslutar §6 P3-städnings-DoD och markerar direktivet SLUTFÖRT i §12.

---

## Session 5+5b (React) — Fas 2: Routing + Auth

**Datum:** 2026-05-11 till 2026-05-13 (Session 4 + Session 5 + Session 5b — Fas 2 KOMPLETT 2026-05-13)

### Sammanfattning

Samtliga commits från K0åg-respons + K2-K4 + K5.1-K5.3 (Session 5) + K3.4 + K5.4-K5.6 (Session 5b) — sammanlagd commit-räkning verifierbar via `git log --oneline ea59787..HEAD` post-K5.6b. **Fas 2 alla 8 DoD-rader stängda och empiriskt verifierade via K4.3 6-tests Playwright-regression.** Defense-in-depth tre-skikt-arkitektur levererad: skikt 1 (klient-guard K3.2/K3.3) + skikt 2 (AuthError throw K3.4) + skikt 3 (server requireUser Fas A M2). Kvalitetsklyfta för Fas 3.5: skikt 2:s throw-path är typkontrakt-bevisad via tsc + Biome men inte regression-skyddad i isolation post-K3.4 (vitest-installation deferred per Gate 1-beslut 2026-05-13). Lyfts som todo.md Fas 3.5-underpunkt i K5.6b.

### Commits Session 5 (kronologisk ordning)

K0-tilläggsåtgärd (säkerhetsincident från Session 4-natt → Session 5-morgon):

- `ea59787` — security(fas2): remediate GHSA-rmmr-r34h-pfm5 supply chain malware (K0åg)
- `35cd10e` — docs(decisions): add ADR-028 Supply chain incident-respons-protokoll
- `807195f` — docs(fas2): K1.7 sessionsdok-skelett-utfyllnad

K2 — TanStack Router skelett + audit-ci-disciplin:

- `5709f26` — build(fas2): introduce audit-ci with GHSA-rmmr-r34h-pfm5 allowlist (K2.1)
- `135ff6a` — feat(fas2): TanStack Router file-based skelett + Sentry ErrorBoundary (K2.2)
- `b32ec51` — fix(fas2): sort imports + tailwind classes per Biome 2.4.15 strict mode (K2.2 follow-up)
- `0194787` — fix(fas2): pre-generate routeTree before tsc -b in build script (K2.2 follow-up 2)
- `34a3a33` — feat(fas2): main.tsx providers + React 19 createRoot Sentry-hooks (K2.3)
- `02a35a0` — fix(fas2): sort imports in main.tsx per `biome organizeImports` (K2.3 follow-up)

K3 + K3.5 — AuthProvider + login/logout + skyddade routes + race-condition-fix:

- `8e72a10` — docs(claude): activate Kandidat 25 `biome check` disciplin pre-commit (K3.0)
- `2bb5a21` — refactor(fas2): extract router + queryClient to src/router.ts (K3.1)
- `4dc675c` — feat(fas2): AuthProvider full Supabase-integration + InnerApp-pattern (K3.2)
- `e42f395` — fix(fas2): satisfy `biome noNonNullAssertion` + `useExhaustiveDependencies` (K3.2 follow-up)
- `9078d9f` — feat(fas2): login route + index redirect + _authenticated guard (K3.3)
- `ea673f4` — fix(fas2): InnerApp useEffect deps inkluderar isLoading för guard re-eval (K3.5)

K4 — nuqs + Playwright auth-fixture + arkitektur-regression-suite:

- `a49d8f6` — feat(fas2): NuqsAdapter + dev-only test-route för DoD 4 (K4.1)
- `fca8bfd` — feat(fas2): Playwright auth.setup + storageState för DoD 6 (K4.2)
- `d0eab46` — test(fas2): K3-arkitektur regression-suite via Playwright (K4.3)

K5 (Session 5-scope — final defer till Session 5b):

- `40a2060` — docs(lessons): skörda Kandidater 24-36 från Session 5 (K5.1)
- `e4a5faf` — docs(sessions): full bake-in K2-K4 + K3.5 i sessionsdok (K5.2)
- `9bf3f41` — docs: Session 5 wrap-up + Session 5b handoff (K5.3)

K3.4 + K5 final (Session 5b — Fas 2-stängning):

- `1d3fc21` — feat(fas2): K3.4 remove anon-key fallback — AuthError contract
- `f9328f7` — docs(sessions): K5.4 bake-in K3.4 in sessionsdok (Session 5b)
- `7b3b693` — docs(sessions): K5.5a bake-in Kandidat 38 in sessionsdok Del 7.2
- `e997eed` — docs(lessons): K5.5b skörd K0åg-kandidater + Session 5b-kandidater (K17-K19 + K37 + K38)
- (K5.6a denna commit) — docs(build-log): K5.6a Fas 2-avslutning i BUILD-LOG

### Bundle-evolution Session 5

| Milstolpe | Main JS raw | Main JS gzip | Delta vs Pre-Session 5 |
|---|---|---|---|
| Pre-Session 5 (post-K1.6) | 327.28 kB | 103.13 kB | — |
| Post-K2.3 (provider-tree) | 440.22 kB | 138.83 kB | **+113 kB raw / +35.7 kB gzip** |
| Post-K3.2 (AuthProvider full) | 637.97 kB | 188.86 kB | **+311 kB raw / +85.7 kB gzip** |
| Post-K4.1 (nuqs) | 640.80 kB | 189.22 kB | **+313.5 kB raw / +86.1 kB gzip** |
| Post-K3.4 (Session 5b) | 640.82 kB | 189.22 kB | Oförändrat — AuthError-klass (~12 rader) tree-shakes om okatchad |
| Post-Session 7 K0 (2026-05-27) | 640.49 kB | 188.97 kB | ~oförändrat; test-nuqs-chunk (−12.21 kB) ut ur total (separat chunk, ej main). Main-chunk oförändrat → Fynd 7 Fas 7-defer står (ej regression) |

**Total Fas 2 bumpa: +313 kB raw / +86 kB gzip.** Hög andel från `@supabase/supabase-js` runtime-stack (~197 kB raw, Kandidat 32). Defer till Fas 7 perf-budget: `lazyRouteComponent` på `_authenticated`-trädet + tree-shake-verifikation av Realtime + `chunkSizeWarningLimit: 600`.

### Lessons-skörd

**13 + 5 = 18 nya kandidater totalt.**

Session 5 (under H2 `## 2026-05-12 — Fas 2 Session 5 (K2-K4 + K3.5)`): K24-K36 i `tasks/lessons.md`. K34 (test-credentials aldrig-läcka) + K36 (automatiserad test fångar timing-bugs) markerade som hub-lyft-kandidater.

Session 5b (under H2 `## 2026-05-13 — Fas 2 Session 5b (K3.4 + K0åg-skörd)`):

- K17 (live security-state vid sessionsstart) [hub-lyft]
- K18 (audit-output är signal, inte sanning) [hub-lyft]
- K19 (pin + overrides reversibel supply chain-respons) [hub-lyft]
- K37 (test-runner-konvention ska verifieras i RAPPORTERA) [hub-lyft]
- K38 (VERIFIERA-grep-kriterier ska vara form-toleranta) [hub-lyft]

**7 hub-lyft-kandidater totalt** (K17 + K18 + K19 + K34 + K36 + K37 + K38) lyfts till `~/Repon/marcus-system/tasks/lessons.md` i K5.7 hub-sync.

### ADR-tillägg Session 5

- **ADR-028** (commit `35cd10e`, K0åg): Supply chain incident-respons-protokoll. Etablerar process för audit-ci-allowlist + pinning-disciplin vid security-incidents.

### DoD-rader stängda Session 5

Alla 8 DoD-rader från byggplan §4 Fas 2:

| # | Krav | Stängd i |
|---|---|---|
| 1 | npm run dev → login → /hem | K3.3 (verifierad K4.3 Test 3) |
| 2 | Logout → /login | K3.2; router-reaktion på förlorad session verifierad (K4.3 Test 6, storage-clear). `auth.logout()`→`signOut()`-vägen typbevisad (tsc/Biome), **ej regressionstestad** → logout-test deferrat Fas 3.5/5 (todo.md, Fynd 5) |
| 3 | Skyddad route utan session → /login | K3.3 + K3.5 (verifierad K4.3 Test 4) |
| 4 | nuqs-infra: paket + NuqsAdapter wirad i `__root.tsx` (statiskt verifierbar); första useQueryState + regressionstest → Fas 6 | K4.1 (smoke via test-route, pensionerad K0.4) |
| 5 | Router Devtools dev-only | K2.2 |
| 6 | Playwright authenticatedPage-fixture | K4.2 (verifierad K4.3) |
| 7 | [GA] Laddningsindikator under auth-resolution — uppfylld via render-gate, ej Suspense (ADR-037) | K2.2 (Suspense, fel mekanism) + K0.2b (render-gate) |
| 8 | [GA] Error boundary på root — router-fel inkl. root-route → branded fallback (ADR-038) | K2.2 (Sentry.EB) + K0.3b (defaultErrorComponent) |

**Defense-in-depth-arkitekturen empiriskt verifierad:**

Test 5 (INGA functions/v1-anrop med anon-key) är hjärtat i K4.3-suiten — verifierar att UI-flow-guarden (skikt 1) blockerar otillåtna Edge Function-anrop. Post-K3.4: AuthError throw (skikt 2) garanterar loud-failure även om skikt 1 brister. Skikt 3 (server requireUser) avvisar anon-key oberoende. CI-grön för alla tre skikt på var sin Session 5b-commit.

### Fas 2 — Definition of Done sammanfattning

**Fas 2 KOMPLETT 2026-05-13.** Alla 8 DoD-rader från byggplan §4 stängda och empiriskt verifierade. Sessions 4 + 5 + 5b sammanlagt — sessionsdoket arkiveras till `tasks/sessions/archive/2026-05/` i K5.8.

**Kvarvarande efter Fas 2:**

- Hub-lyft 7 UNIVERSAL-kandidater till `~/Repon/marcus-system/tasks/lessons.md` (K5.7)
- BYGGPLAN-LÄTTLÄST-v3 Fas 2-status-uppdatering om filen finns (K5.8)
- Sessionsdok-arkivering + CLAUDE.md trail-link-uppdatering (K5.8)
- Transcript-disciplin etablering (K5.9 — absolut sista commit)

**Kvalitetsklyfta deferred till Fas 3.5:**
Skikt 2 (AuthError throw-path) är inte regression-skyddad i isolation post-K3.4. Test 5 verifierar att skikt 1 inte triggar skikt 2 — den verifierar inte skikt 2:s faktiska beteende. Fas 3.5 test-infra-arbetet ska inkludera unit-test-mönster för auth-error-paths. Vitest-installation hör hemma där per Gate 1-beslut 2026-05-13 (scope-creep att göra i K3.4 utan ADR).

**Nästa fas:** Fas 2.5 — Schema-kontrakt-sync (per `docs/byggplan.md` §4).

---

## 2026-05-14 — Session 6 (CI-optimering mellan Fas 2 och Fas 2.5)

**Status:** ✅ KLAR

**Leverans:**

- Strategi E (Vite-mönstret: changed-files + needs-skip + aggregator) etablerad per ADR-029
- ci.yml restrukturerad från 12-stegs verify-jobb (1 jobb) till 5 jobs (changed → lint → test → docs → ci-passed)
- Empirisk verifikation: doc-only-commits ~34s vs ~95s baseline = **~64 % besparing**
- Kod-commits ~96s = matchar baseline med marginalia parallellisering
- lychee broken-link-detection etablerad som NY kvalitetscheck (0 errors empiriskt verifierad post-K1.D)
- ADR-028 utvidgad till ADR-029 § Third-party Actions-policy (SHA-pin + veckogranskning för Actions)
- K17 supply-chain-skydd bevarat (audit-ci kör på alla commits)
- Branch-protection-readiness etablerad via `ci-passed`-aggregator (ej aktiverat)

**Defer:** Session 6.5 — broken-links-batch-städning av ~71 verkliga drift-errors (kategori A: ~25 stale refs efter ADR-021/023/027 + K5.8b; kategori B: ~46 path-konstruktion-fel i `docs/analysis/`). Estimat ~30-60 min. Trigger: K0-mini-klunga FÖRE Fas 2.5 i Session 7. Detalj i ADR-029 § Baseline-fynd 2026-05-14.

**Lessons:** 17 UNIVERSAL-kandidater skördade (största enskilda session-skörd i projektets historia). 10 hub-lyfta till `marcus-system/tasks/lessons.md`.

**Commits:** 12 totalt (K1-skelett `120ef50` + K0åh `0d19ede` + `9a4d8d5` + K1.D 8 + K-sista 3-4)

**Nästa:** Session 6.5 (defer-paket) → Session 7 (Fas 2.5 Schema-kontrakt-sync per docs/byggplan.md § 4).

---

## Session 6.5 — Broken-links-batch-städning (2026-05-14)

Commit-range: `041740b` (K1-skelett) → `6a3ebcf` (K2.2 + komplett DEFERRED-FIX-MARKER-eliminering). 8 commits totalt (6 fix + 1 revert + 1 disciplin).

### Planerat vs faktiskt

Planerat (per ADR-029 § Baseline-fynd 2026-05-14): ~71 broken links i kategori A (~25) + B (~46), estimat 30-60 min Code-arbete, 1 K2-IMPLEMENTERA-klunga.

Faktiskt: 54 broken refs fixade (6 + 23 + 1 + 24) + 1 disciplin-utvidgning (ADR-022 kategori 4). Scope delades i 5 sub-klungor (K2.1, K2.4, K2.3, K3 v2, K2.2) + 1 revert. ~3 timmar Code-arbete inkl. K3 v1-recovery.

### Avvikelser

1. **A.4 estimat 1 ref → faktisk 23 refs i annan fil** — ADR-029 antog `06b-supabase-target.md`, faktisk lokalisering `08-odoo-validation.md`. K10-mönster (siffror driver). Hanterat via 6-pass sed efter empirisk verifikation.

2. **K3 v1 broken (path-matematik-fel)** — `../`-prefix istället för `../../`. Reverted via `8bbb8c1`. Re-implementerat i K3 v2 (`e49d7b0`) med empirisk dry-resolv-disciplin INNAN pattern-applicering. 7 nya lessons-kandidater från recovery-arbetet.

3. **B.1+B.2 visade sig vara samma skuld** — K2 RAPPORTERA klassade som 2 kategorier; empirisk verifikation i K3 visade att B.2 var 5-6 B.1-refs felklassade + 3 anchor-form-missar. Mönsterförstärkning av K1.16.

4. **A.2 behövde disciplin-utvidgning, inte content-fix** — refs i frysta direktiv/ADR:er/analys-leveranser pekar på pre-ADR-027 spec. Mekanisk fix bryter trail-integritet. ADR-022 utvidgad med kategori 4 "Frusen extern leverans". `.lycheeignore`-pattern flyttad från Block 2 → Block 1 permanent acceptable.

### Verifieringsoutput

| Stop-test | Resultat |
|---|---|
| 6/6 DEFERRED-FIX-MARKER-rader eliminerade | ✅ (0 kvarstår i `.lycheeignore` Block 2; Block 2-header borttagen) |
| lychee mot full scope: 0 errors | ✅ CI 25856786950 |
| CI grön mot main efter sista commit | ✅ |
| Lessons skördade och hub-synk schemalagd | ✅ 15 kandidater (13 [UNIVERSAL], 2 lokala) |

### Kända uppskjutna beslut / teknisk skuld

- **Session 7 K0 — Fas 2 11/10-verification-paket** (`docs/analysis/Fas-2-11-10-verification-2026-05-14.md`) committad som "received" i pre-K1 per K7. 7 gap-punkter ska adresseras i Session 7 K0 innan Fas 2.5 startar.

### Filstruktur-snapshot

`.lycheeignore`: 55 → 35 rader (6 DEFERRED-FIX-MARKER eliminerade + Block 2-header borttagen + A.2 flyttad till Block 1).

`docs/decisions/ADR-022`: 60 → 63 rader (kategori 4 + utvidgad åf-paragraf).

### Definition of Done uppfylld: Ja

---

## Session 6.6 — Docs-grindvakter + frontmatter-policy + observations-pass (2026-05-14 + fortsättning #2 2026-05-15)

Commit-range Session 6.6 (2026-05-14 K1-K7): per sessionsdok Del 4 K2-K7 commits — yamllint + markdownlint + scripted-checklist + Vale + frontmatter-policy infrastruktur.

Commit-range Session 6.6 fortsättning #2 (2026-05-15 K7.5 + K9 + K-sista):
`74dcd1d` (K7.D handoff-prep) → `d12213d` (K7.5 atomic config-driven-refactor) → `2c4aac3` (K7.5 polish SC2034 klass-fix) → `01f5cbb` (K-sista #1 lessons + ADR-030 + sessionsdok + todo + 6.7-prep) → `4e80647` (K-sista #1 hotfix todo.md forward-pekare → pre-arkiv-path) → `173e75b` (K-sista #2 hub-bake-in — separat operation i marcus-system) → denna commit (K-sista #3 sessionsdok-arkivering + BUILD-LOG + retroaktiv K-sista.2).

### Planerat vs faktiskt

Planerat (per prep-dok Del 1.2 + Del 4): 5 CI-grindvakter (markdownlint, typos, Vale, yamllint, scripted-checklist) + frontmatter-policy 7 docs + 8-12 lessons. Estimat ~10-15h Code-arbete över 2 sessioner.

Faktiskt: 5 grindvakter etablerade (typos rejected → ersatt av check-frontmatter-validator som #5; markdownlint + Vale + yamllint + scripted-checklist + frontmatter-validator). Frontmatter-policy 4 fält på 9 styrande docs (utvidgat från 7 till 9 per K7.A pre-flight + ADR-030 § Del 2 till 10 inkl. hub). 15 [UNIVERSAL] lessons skördade (större skörd än uppskattat — 8 K7.x + 4 K7.5.x + 1 K9.1 + 2 K-sista.x). ~12h Code-arbete inkl. K7.5 retroaktiv refactor + SC2034 polish.

### Avvikelser

1. **typos rejected post-empirisk baseline** — Pre-empirisk antagande att typos skulle täcka stavfel; empirisk K3-baseline 6 490 fynd (svenska false-positives). Tool-uppgift-mismatch (engelsk-only-default mot svensk-dominant repo). Slot-numrering bevarad i ADR-030 § Del 1 position #2 per ADR-022 kategori-utvidgning-mönster.

2. **Vale 539 fynd → defer 6.6.6** — K6.2 V4 bekräftade Vale 3.14.1 har INGEN `--fix`-flagga. Per-fil rad-1-disable Alt F vald för regression-skydd. Mini-session 6.6.6 schemalägs.

3. **K7.5 retroaktiv refactor (Marcus' Gate 2 Fångst #4)** — K5 scripted-checklist hade hårdkodade paths; refactoreras till config-driven (`.checklist-policy.conf`) post-K7-pattern för hub-spoke-portabilitet. Egen sub-fas Session 6.6 fortsättning #2.

4. **K8 deferrad helt till Session 6.7** — Per Marcus' Block D #3-caveat: K1-K7 + K7.5 + K9 åt tiden. Konservativ defer per P3a "var beredd att splitta".

5. **K-sista #1-hotfix 4e80647** — lychee fångade forward-pekare i todo.md (sessionsdok-archive-path som inte existerade än). Skapade ny lesson-kandidat K-sista.2 (retroaktiv). Mitigation-mönster: arkiverings-pekare måste matcha HEAD-state vid commit-tid.

6. **Dependabot secrets-skuld upptäckt post-K2 merge** — 5 öppna PR:er failar på staging-secrets (pre-existing 5 dagar pre-K2). Defer till mini-session 6.6.5 + ADR-031.

7. **Session 6.6.7 NY defer** — shellcheck-grindvakt-mini-session från K7.B + K7.5.4 SC2034 klass-fix. Egen ADR-trail per ADR-029 § Konvention.

### Verifieringsoutput

| Stop-test | Resultat |
|---|---|
| 5 docs-grindvakter aktiva i CI | ✅ K9-verifierat på run 25923521145 (yamllint + markdownlint-cli2 + scripted-checklist + Vale + check-frontmatter) |
| Frontmatter-policy på 9 styrande docs | ✅ K7.C commit `866dd7c` (0 fel post-implementation) |
| Pre-commit hook auto-bump aktiv | ✅ K7.C via `git config core.hooksPath .githooks` |
| lychee 0 errors mot full scope | ✅ Bevarat från Session 6.5-baseline (+ hotfix 4e80647 åtgärdade ny forward-pekare-drift) |
| ADR-030 Status Draft → Accepted | ✅ K-sista commit #1 `01f5cbb` |
| 15 [UNIVERSAL] lessons skördade | ✅ K-sista commit #1 + retroaktiv K-sista.2 i commit #3 |
| Hub-sync K6.6.1-K6.6.5 (5 konsoliderade rader) | ✅ Commit #2 hub `173e75b` |
| Strategi E job-skip post-K7.5-baseline | ✅ docs-only 36s, full-CI 88s (empiriskt bättre än uppskattat ~50-65s/~110-130s) |
| Sessionsdok + handoff-fil arkiverade | ✅ Denna commit `git mv` till `tasks/sessions/archive/2026-05/` |

### Kända uppskjutna beslut / teknisk skuld

- **Session 6.6.5:** Dependabot secrets-skuld (5 PR-fails) + ADR-031. Strategi-val A/B/C/D vid sessionsstart.
- **Session 6.6.6:** Vale.Terms (425) + Miranon.VueToReact (114) manuell fix per förekomst (~7-10h över 52 filer).
- **Session 6.6.7:** shellcheck-strict-grindvakt för scripts/*.sh + .githooks/* (0 warnings + 0 errors).
- **Session 6.7:** CLAUDE.md-audit + skills-extraktion + checklist-trimning (K8 deferrad hit). Inkl. NY scope-domän: Vale-mönster-hub-extraktion (3 mönster: Brand + VueToReact + Vocab-dual-function) + chat-self-review-skill (K-sista.1 trigger).
- **Marcus-action (när som helst):** Branch-protection-aktivering på main per ADR-029 § Konsekvenser. Aggregator `ci-passed` ready (3-4s konsekvent på 5/5 senaste runs). `gh api .../branches/main/protection` returnerar HTTP 404 "Branch not protected" — design-medveten defer, inte arkitektur-bug.
- **Framtida hub-polish:** Hub-K6.6.4-rad i `~/Repon/marcus-system/tasks/lessons.md` refererar K-sista.1 men inte K-sista.2 (retroaktiv skapelse). Flaggas för polish-commit vid framtida hub-touch.

### Filstruktur-snapshot

`.checklist-policy.conf` (NY i K7.5 commit `d12213d`): 40 rader, file-level SC2034-disable.

`.frontmatter-policy.conf` (NY i K7.C commit `866dd7c`): file-level SC2034-disable post-K7.5 polish `2c4aac3`.

`scripts/check-public-checklists.sh`: refactored config-driven (post-K7.5).

`scripts/check-frontmatter.sh` + `.githooks/pre-commit`: nya i K7.C.

`scripts/test-check-frontmatter.sh` (9 testfall) + `scripts/test-check-public-checklists.sh` (5 testfall): nya empiriska test-suiter.

3 Miranon-stilguide-filer: `styles/Miranon/VueToReact.yml` + `Brand.yml` + `Undvik.yml` + `Vocab/Miranon/accept.txt` (25 termer).

`docs/decisions/ADR-030-docs-grindvakter-frontmatter-policy.md`: 273 rader, Status Accepted.

`docs/specs/SECURITY-SPEC.md` + `docs/reference/hur-systemet-funkar.md` + `docs/reference/data-model.md` + 6 fler: frontmatter-add (4 fält × 9 styrande docs).

ADR-räkning post-Session 6.6: 30 (ADR-001 till ADR-030).

### Definition of Done uppfylld: Ja

---

## Session 6.6.5 — Dependabot-strategi 2026 (2026-05-16)

**Estimat:** 2-3h Code-arbete
**Faktiskt:** ~en sessions chat-arbete + 8 commits + 1 PR
**Branch:** feature/session-6-6-5-dependabot-strategi
**PR:** #26
**ADR:** ADR-031 Draft → Accepted (4-lager-strategi: grouping + cooldown + minimal CI-yta + manuell review)
**Parent:** Session 6.6 (K2.5 Alt H defer av Dependabot-skuld)

### Leverans

| K-fas | Status | Commit | Tema |
|---|---|---|---|
| K1 | ✅ KLAR | `29bcef5` | Sessionsdok-skelett + ADR-031 Draft + README ADR-katalog (atomisk: ADR-030 + ADR-031) |
| K2 | ✅ KLAR | `ce5c0a8` | dependabot.yml uppgradering (4 stack-grupper + 2 catch-all + 1 GHA-grupp + cooldown 7d/3d + reviewers + commit-prefix + limit 5/3) |
| K2.1 | ✅ KLAR | `a67908d` | fetch-depth: 50 retrofit på lint+test+docs jobs (rotorsak-fix för L8) + lychee URL-fix i ADR-031 |
| K3 | ✅ KLAR | `06cbcc4` | ci.yml Alt D Hybrid (`if: github.actor != 'dependabot[bot]'` på staging + e2e steg) |
| K4 | ✅ KLAR | `0eedc6a` | PR-backfill (6 Dependabot-PR:er stängda: #19, #21, #22, #23, #24, #25) |
| K-sista #1 | ✅ KLAR | `16e4591` | ADR-031 Draft → Accepted + Baseline-fynd ifyllt per lager |
| K-sista #2 | ✅ KLAR | `ca57753` | Lessons-skörd 14 [UNIVERSAL] (L1-L14) i 4 domäner |
| K-sista #3 | ✅ KLAR | `c55cb96` | BUILD-LOG + todo.md cleanup + ADR-030 Alt B-tillägg |
| K-sista #4 | ✅ KLAR | `04bc462` (hub) | hub-CLAUDE.md "Alltid gäller" L6 + L1-bullets (separat hub-repo-commit) |
| K-sista #5 | ✅ KLAR | `f7dba69` (hub) | hub-lessons.md sync 8 konsoliderade rader K6.6.5.1-K6.6.5.8 (separat hub-repo-commit) |
| K-sista #6 | ✅ KLAR | `a5e895b` | Sessionsdok-arkivering + ADR-031 trail-link-update (atomic per Kandidat 1; K-sista #7 trail-link-pass sammanslagen) |
| K-sista #6.5 | ✅ KLAR | `e53c720` | `.lycheeignore` Block 1-add för opentelemetry CI-runner-flakiness (instans #2 av TanStack-precedens från Session 6.6 K6) |
| K-sista #7 | ✅ KLAR | denna commit + squash-commit på main | BUILD-LOG-update + PR #26 Draft → Ready → Squash-merge till main |

### Pre-existing-skuld upptäckt + fixad i denna session

- **L8 — ADR-030 § Del 3 Check 2 latent shallow-clone-bug** triggades första gången 2026-05-16 pga dag-rollover-invarians-brott (sammanträffande invariant från K7.C atomisk bake-in 2026-05-15 bröts av selective README-bump i K1). Rotorsak-fix via K2.1 fetch-depth: 50 retrofit på lint + test + docs jobs (commit `a67908d`).
- **lychee broken link i ADR-031** (K1-introducerad URL-typo `travis.gosselin.com` → korrekt `travisgosselin.com`). Fixad i K2.1.
- **README ADR-katalog saknade ADR-030** (pre-existing från Session 6.6 K-sista). Atomisk bake-in i K1 stängde luckan tillsammans med ADR-031.
- **opentelemetry.io CI-runner-flakiness** (instans #2 av TanStack-precedens från Session 6.6 K6) — lychee fail mellan K-sista #1 (`16e4591`, grön) och K-sista #2 (`ca57753`, röd) trots fungerande URL (lokal curl: HTTP 200). Sannolik orsak: Cloudflare/CDN blockerar GitHub Actions IP-ranges intermittent. Fixad i K-sista #6.5 (`e53c720`) via `.lycheeignore` Block 1-add med kategori "CI-runner-flakiness" + lessons-flag för framtida re-utvärdering.

### Avvikelser från ursprungsplan

- **K1.5 forensisk-pass** var inte planerat — tillkom efter Marcus' stopp pre-K2.1 ("vi satt 10h igår och fixade hela CI-setupen, det sista var frontmatter"). Förebyggde att K2.1 körts som symptom-fix (manuell frontmatter-bump på 8 docs) istället för rotorsak-fix (fetch-depth-retrofit). Mönsterförstärkning av L1 (pre-K-implementation forensisk-pass GLOBAL regel).
- **K2.1** var inte planerat — tillkom efter CI-fail på K2-push.
- **Reframing från instans- till klass-tänkande** post-Marcus' "tänk seniorproffs"-fångst. Original prep-dok A/B/C/D-strategi (secrets-fix) ersatt av 4-lager-strategi (grouping + cooldown + CI + manuell review) efter web-research-grund. Mönsterförstärkning av L5 + L13.

### Lessons-skörd

14 [UNIVERSAL] lessons (L1-L14) skördade. Domän-fördelning: 4 + 4 + 3 + 3 (A: empirisk verifikation, B: branschstandard & 11/10 GOLV, C: verifikations-design & policy-fångst, D: CI-grindvakts-design & trail-disciplin). Gate 2-fångst-fördelning: Marcus 4 + Code 3 + Chat self-review 1. Se `tasks/lessons.md` H2 `## 2026-05-16 — Session 6.6.5` för fullständiga texter.

### Hub-sync (K-sista #4 + #5)

- Hub-CLAUDE.md `## Instruktioner — Alltid gäller`-bullets tillägg: 11/10 som GOLV-disciplin (L6) + Pre-K-implementation forensisk-pass GLOBAL regel (L1). Hub-commit `04bc462`. ("Ristat i sten" är Chat-koncept-term; faktisk sektion-rubrik i hub-CLAUDE.md är "Instruktioner — Alltid gäller" — bekräftat via K-sista #4.A forensisk-pass.)
- Hub-lessons.md sync av 8 konsoliderade rader K6.6.5.1-K6.6.5.8 från 14 [UNIVERSAL] spoke-lessons under H2 `## 2026-05-16 — Session 6.6.5 (miranon-media-admin)`. Hub-commit `f7dba69`.

### K-sista-checkpoints för framtida sessions

- **Dependabot-side empirisk-verifikation:** Marcus reviewar första post-K4 Dependabot-PR (weekly cadence per `dependabot.yml`) och bekräftar (a) grouping-mönster (production-deps / development-deps / stack-grupper), (b) cooldown-filter (versioner publicerade <7d skippas, patch <3d), (c) staging-steg-skip per K3 Alt D Hybrid.
- **Shallow-clone-detection defer (Alt C-element):** `scripts/check-frontmatter.sh` utvidgning med `git rev-parse --is-shallow-repository`-detection + gracefully degradation av Check 2 + test-suite-utvidgning för shallow-scenarier. Defensive programming utöver K2.1 fetch-depth-retrofit. Egen mini-session eller integrerat i Session 6.6.6 K-sista. Flaggad i `tasks/todo.md`.

### Definition of Done uppfylld: Ja

- [x] ADR-031 Accepted med Baseline-fynd
- [x] dependabot.yml 4-lager-strategi implementerad
- [x] ci.yml Alt D Hybrid (staging-skip för dependabot[bot])
- [x] 6 öppna Dependabot-PR:er stängda
- [x] 14 [UNIVERSAL] lessons skördade
- [x] BUILD-LOG + todo.md uppdaterade
- [x] ADR-030 § Del 3 sub-§ "Implementations-krav på CI-miljö" tillkommen
- [x] Hub-CLAUDE.md `## Instruktioner — Alltid gäller` + hub-lessons-sync (K-sista #4 commit `04bc462` + K-sista #5 commit `f7dba69`)
- [x] Sessionsdok arkivering + trail-link-update (K-sista #6 commit `a5e895b`; K-sista #7 trail-link-pass sammanslagen per Kandidat 1 atomic-disciplin)
- [x] opentelemetry CI-runner-flakiness fixad (K-sista #6.5 commit `e53c720`)
- [x] PR #26 merge till main (K-sista #7 squash-commit på main)

---

## Session 6.6.7 — Shellcheck-strict-grindvakt + shallow-clone-detection (2026-05-16)

**Estimat:** ~2-3h Code-arbete
**Faktiskt:** ~3-4h (utöver budget pga K4.1 design-bug-cykel; inom 2-3h-spann för övriga K-faser)
**Branch:** main (mini-session, direkt-commit-flöde)
**PR:** ingen (direct-to-main per mini-session-konvention)
**ADR:** ADR-033 Draft → Accepted (shellcheck-strict-grindvakt + shallow-clone-detection defense-in-depth lager 2)
**Parent:** Session 6.6 (K7.B miljö-disciplin-defer + K7.5.4 SC2034 klass-blindhet-lesson) + Session 6.6.5 (L8 latent shallow-clone-bug + Alt C-defer)

Commit-range Session 6.6.7: lokal-trail från `3f025b9` (K2 sessionsdok + ADR-033 Draft) till K-sista #6 (hub-sync, schemalagd post-arkivering).

### Leverans

| K-fas | Status | Commit | Tema |
|---|---|---|---|
| K2 | ✅ KLAR | `3f025b9` | Sessionsdok-skelett + ADR-033 Draft + Strategi β-bekräftelse |
| K3.1 | ✅ KLAR | `62b0afc` | A.1.a design-beslut-fix (4 fynd: 2 SC2148 errors + 2 SC2312 info) |
| K3.2 | ✅ KLAR | `d86d846` | A.1.b mekanik-pass (364 fynd: 363 auto via `--format=diff` + 1 manuell SC2292 cross-syntax) |
| K3.3 | ✅ KLAR | `82a7793` | shellcheck-strict-grindvakt v0.11.0 SHA-pinnad install + CI-step i lint-jobb |
| K3.4 | ✅ KLAR | `be68026` | ADR-033 § Baseline-fynd bake-in (post-K3.3-state 0/0/0/0) |
| K4.1 | ⚠️ design-bug | `b2970fd` | Shallow-clone-detection v1 — `--is-shallow-repository` false-positive på fetch-depth: 50 |
| K4.1.1 | ✅ KLAR | `4dc55e5` | Hot-fix hybrid-check + `FRONTMATTER_MIN_HISTORY_DEPTH=50`-config |
| K4.2 | ✅ KLAR | `47f8ed8` | Test-suite T10/T11a/T11b/T12 (truth-table-täckning) |
| K4.3 | ✅ KLAR | `e83a4b1` | ADR-030 § Del 3 "Defensive programming"-bullet (defer) → (implementerad i ADR-033 K4) |
| K-sista #1 | ✅ KLAR | `32e9405` | Lessons-skörd L_A-L_K (11 [UNIVERSAL]) + ADR-033 Status Draft → Accepted |
| K-sista #2 | ✅ KLAR | `bba5dfa` | ADR-032-reservation-rad i todo.md (L19-mitigation 6.6.7) |
| K-sista #3 | ✅ KLAR | denna commit | BUILD-LOG + todo.md + CLAUDE.md status (drift-stängning för Session 6.6 + 6.6.5) + L_L-skörd |
| K-sista #4-#6 | #5+#6 ✅ KLAR (arkiv-fil + hub-commit `98f1978`); #4 ej verifierad | `98f1978` | cross-doc-grep-sanity (#4) + arkivering (#5) + hub-sync (#6) |

Lessons-flagga-commits (atomic per L_-flagga): `ad22585` L_D, `3dc7495` L_E, `15cb0dc` L_F+L_G, `24c44a6` L_H, `2ecb8df` L_I+L_J, `ea40d63` ADR-033 SHA-pin-fallback-dokumentation.

### Pre-existing-skuld upptäckt + fixad i denna session

- **K4.1 `--is-shallow-repository`-misstolkning** triggades på första CI-run post-K4.1 (commit `b2970fd`). `--is-shallow-repository` returnerar `true` för ALLA fetch-depth-värden (1, 50, 100), inte bara depth=1. CI:s safe-shallow-state (fetch-depth: 50 per K2.1) träffade detection-trip. Rotorsak-fix via K4.1.1 hybrid-check (commit `4dc55e5`).
- **shellcheck-version-mismatch CI vs lokal** (K3.3 VILLKOR A pre-flight): ubuntu-latest har shellcheck 0.9.0-1 pre-installerat (Ubuntu 24.04 runner-image-manifest). v0.9.0 saknar v0.10+ optional checks (SC2310 m.fl.) — falsk-grön-risk per L9. Fixad via SHA-pinnad v0.11.0-download från koalaman GitHub releases.
- **CLAUDE.md status-drift för Session 6.6 + 6.6.5** (K-sista #3 pre-flight A3-grep): Sessions 6.6 + 6.6.5 K-sista-pass uppdaterade BUILD-LOG men hoppade CLAUDE.md status-rad-bump. Drift = 12+ dagar utan upptäckt. Fixad atomic i K-sista #3-commit (3 nya bullets för Session 6.6 + 6.6.5 + 6.6.7). L_L skördad.

### Avvikelser från ursprungsplan

1. **K4.1 design-bug + hot-fix-cykel.** Detection-logik triggade falskt på CI:s safe-shallow-state. Fångad via CI-röd-state (grindvakts-feedback fungerar). L_I + L_J skördade.
2. **shellcheck-baseline räknings-avvikelse** (K1 RAPPORTERA: 367 SC-kod-träffar vs 366 fynd-rader). Förklarad via K1-grep-artefakt; K3.1 JSON-räkning etablerade korrekt distribution. L_A skördad.
3. **SHA-pin-strategi-fråga** (K3.3 STEG 1 Metod 2). koalaman/shellcheck publicerar inte separata .sha256sum-filer. Fallback till Metod 1 (downstream-beräknad SHA256 + GitHub-release-immutability). L_G skördad.
4. **F3 + F4 SC2312-fix flippad** från Codes initial `|| true`-suggestion till refactor (CURRENT_DIR-variabel). Chat-mediated 11/10-granskning applicerade L_C-nivå-1-disciplin.
5. **T11 splittades till T11a + T11b** post-Chat-mediated 11/10-granskning. Truth-table-täckning av 4 hybrid-detection-fall.
6. **CLAUDE.md status-drift-stängning** scope-creep utöver K-sista #3 explicit-instruktion → Marcus' Alt B-beslut (atomic-state-propagation). L_L skördad.

### Verifieringsoutput

| Stop-test | Resultat |
|---|---|
| Shellcheck-strict 0/0/0/0 på K3-scope | ✅ post-K3.2 + post-K3.3 + post-K4.1.1 |
| 13/13 test-suite PASS (T1-T9 + T10/T11a/T11b/T12) | ✅ runtime ~17s |
| CI grön mot main efter sista commit | ✅ post-K3.3 + post-K4.1.1 + post-K-sista #1 + #2 + #3 |
| Lessons skördade och hub-synk schemalagd | ✅ 12 [UNIVERSAL] (L_A-L_L), hub-sync K-sista #6 |
| ADR-033 Status: Draft → Accepted | ✅ K-sista #1 (commit `32e9405`) |
| ADR-032-reservation L19-mitigation committad | ✅ K-sista #2 (commit `bba5dfa`) |
| CLAUDE.md status-drift stängd (Session 6.6 + 6.6.5 + 6.6.7) | ✅ K-sista #3 (denna commit) |

### Lessons-skörd

12 [UNIVERSAL] lessons (L_A-L_L) skördade. Domän-fördelning:

- **Räknings-disciplin** (L_A, L_D) — auktoritativ output-tolkning + post-fix-räkning-fullständighet
- **Lessons-meta** (L_B, L_J) — lesson-applicerings-scope + Chat-side empirisk-grund
- **Fix-strategi & defense-in-depth** (L_C, L_H, L_I) — 3 fix-kvalitets-nivåer + lager-N-hard-fail + truth-table FÖRE detection
- **CI-grindvakts-aktivering** (L_F, L_G) — runner-image-version-mismatch + supply-chain-fallback
- **Cross-syntax & cross-ADR** (L_E, L_K) — auto-fix icke-fullständig + ADR-tidsstämpel-bevarande
- **K-sista-process-disciplin** (L_L) — status-bump-checklista per-fil-coverage-verifikation

Gate 2-fångst-fördelning: Code 5 (K3.1 räknings + K3.3 SHA + K4.1.1 truth-table + K4.3 ADR-disciplin + K-sista #3 drift-fynd) + Chat-mediated 2 (Marcus refactor-val + Marcus design-flipp) + CI-feedback 1 (K4.1 → K4.1.1 hot-fix). Se `tasks/lessons.md` H2 `## 2026-05-16 — Session 6.6.7` för fullständiga texter.

### Hub-sync (K-sista #6 ✅ KLAR)

12 [UNIVERSAL] lessons konsolideras vid hub-sync till `~/Repon/marcus-system/tasks/lessons.md` under H2 `## 2026-05-16 — Session 6.6.7 (miranon-media-admin)`. Separat operation post-arkivering. ✅ Gjord: hub-commit `98f1978` (8 konsoliderade rader K6.6.7.1-8).

### K-sista-checkpoints för framtida sessions

- **shellcheck-grindvakt empirisk-verifikation över tid:** observera första post-merge non-shellcheck-edit-commit:s lint-jobb-tid; bekräfta att shellcheck-step inte adderar mätbar overhead över jitter-spann ±5s. K3.3 baseline: ~1-2s overhead.
- **Shallow-clone-detection re-verifikation vid spoke-kopiering:** om frontmatter-grindvakten dupliceras till annan spoke, verifiera empiriskt att `FRONTMATTER_MIN_HISTORY_DEPTH`-default 50 är lämpligt + att fetch-depth-config kopieras tillsammans med scripts.
- **Vale-cleanup (Session 6.6.6):** ✅ levererad. ADR-032 Accepted (K3.5). Lessons konsoliderade 125 → L15-L27, bakade i lessons.md (commit `950aa0f`). Se ## Session 6.6.6-block nedan. L_A-L_L var REDAN bake:ade i Session 6.6.7 K-sista #1 + #3.

### Definition of Done uppfylld: Ja

- [x] shellcheck-strict-grindvakt aktiverad i lint-jobb (CI-step `Validate bash scripts with shellcheck-strict`)
- [x] 366 baseline-fynd fix:ade till 0/0/0/0 (363 auto + 1 manuell + 4 design-beslut)
- [x] Shallow-clone-detection lager 2 implementerad (`scripts/check-frontmatter.sh`) + test-suite-utvidgning T10-T12
- [x] ADR-033 Accepted med komplett § Baseline-fynd + § Säkerhet SHA-pin-bullet + § Medvetna utelämningar punkt 6
- [x] ADR-030 § Del 3 "Defensive programming (implementerad i ADR-033 K4)"-bullet uppdaterad
- [x] 12 [UNIVERSAL] lessons (L_A-L_L) skördade
- [x] BUILD-LOG + todo.md + CLAUDE.md uppdaterade (K-sista #3 atomic)
- [x] ADR-032-reservation committed (L19-mitigation)
- [x] CI grön mot main efter K-sista #3
- [ ] Cross-doc-grep-sanity (K-sista #4 — ej verifierad)
- [x] Sessionsdok-arkivering + trail-link-uppdateringar (K-sista #5 — arkiv-fil `tasks/sessions/archive/2026-05/2026-05-16-session-6-6-7.md`)
- [x] Hub-sync till marcus-system (K-sista #6 — hub-commit `98f1978`)

---

## Session 6.6.6 — Vale-cleanup + lessons-konsolidering (2026-05-14–2026-05-24)

### Leverans

- Vale-config-cleanup K2.3-K3.4: baseline 0/0/0.
- ADR-032 (Vale lazy-continuation helfil-disable) Accepted, K3.5.
- K2.6.2.F Vale-regression-test-suite, K3.6.
- Lessons-konsolidering K-sista-0: 125 kandidater → 13 konsoliderade (L15-L27, 12 UNIVERSAL + 1 PROJEKT).
- K-sista-1-A: L15-L27 bakade i tasks/lessons.md (commit `950aa0f`).
- K-sista-1-B: sessionsdok arc-retrospektiv (commit `50251cb`).
- K-sista-1-C: hub-sync 12 UNIVERSAL → marcus-system (hub-commit `e2a09d8`).
- K-sista-1-D: "Ristat i sten"-bullets i hub+spoke-CLAUDE.md (spoke `05d7bf4`, hub `b895609`).
- K-sista-1-E: Lager 2-checklist v1.0 (hub `b810c18` + cleanup `366a45c`).

### Definition of Done uppfylld: Ja

- [x] K-sista-1-A till -E (lessons-bake + sessionsdok + hub-sync + Ristat-i-sten + Lager 2 v1.0) — se § Leverans ovan
- [x] K-sista-1-F: Session 6.7-prep uppdaterad (1825b3e + 762706f)
- [x] K-sista-1-G: 12 filer arkiverade till archive/2026-05/ + 4 frontmatter-superseded + 2 atomiska länkfixar (d4c3620)
- [x] K-sista-1-H: cross-doc-grep-sanity + DoD-stängning + CLAUDE.md-bump verifierade i denna commit; push omedelbart efter
- [x] CI grön mot main efter K-sista-1-H push

### Spårbarhet

Full retrospektiv: tasks/sessions/archive/2026-05/2026-05-14-session-6-6-6.md Del 8.
Lessons: tasks/lessons.md H2 "## 2026-05-23 — Session 6.6.6".
Konsoliderings-trail: tasks/sessions/archive/2026-05/2026-05-23-k-sista-0-lessons-rakatalog.md.

---

## Session 7 — Fas 2-fynd-verifiering (K0, 2026-05-27)

Stänger Fynd-punkter ur `docs/analysis/Fas-2-11-10-verification-2026-05-14.md` före Fas 2.5. Trail i `tasks/sessions/archive/2026-05/2026-05-26-session-7.md`.

**K0.1 — Fynd 1 (typecheck no-op):** `tsc --noEmit` utan `-b` ignorerade TypeScript project references (`tsconfig.json` = `files: []`), så Fas 2:s namngivna typecheck-signal var no-op för app-koden — `npm run build` (`tsc -b`) fångade typfel, men `typecheck`-scriptet + CI-steget `TypeScript check` gjorde det inte. Åtgärdat (commit `3c8c3f6`): `typecheck` → `tsr generate && tsc -b --noEmit`; CI `TypeScript check` → `npm run typecheck`. Negativ test bevisade kontrasten (TS2322 i app-fil: ny form exit 2, gammal exit 0). Typecheck-signalen är nu ärlig. Ingen ADR — bugg-fix av trasigt script, inget arkitekturbeslut.

**K0.2 — Fynd 2 + 3 + index.tsx-vektorn (auth-resolution no-flash):** `_authenticated.tsx` `beforeLoad` blockerade inte render under `auth.isLoading` (synkron return = no-op) → flash av skyddat innehåll (Fynd 2); `__root.tsx` `<Suspense>` gateade aldrig auth (`AuthProvider` kastar ingen promise — Fynd 3); `index.tsx` saknade isLoading-hantering (egen flash-vektor). Åtgärdat (commit `e5346a5`): render-gate i `InnerApp` (`main.tsx`) — `<RouterProvider>` monteras först när auth löst + `router.invalidate()` guardad `if(!isLoading)` (ogardad → krasch mot router-modul-default `context.auth=undefined`); `beforeLoad` i `_authenticated`/`index`/`login` förenklade. No-flash strukturellt utesluten (RouterProvider monteras aldrig under loading); K4.3-sviten 7/7 grön. Deterministiskt regressionstest deferrat till Fas 3.5 (vitest), spec:at i `tasks/todo.md`. [ADR-037](decisions/ADR-037-auth-resolution-render-gate.md). DoD-rad 7-mekanismen omtolkad (render-gate-splash, ej Suspense).

**K0.3 — Fynd 4 (root error boundary):** empiriskt fel-test (K0.3a) smalnade fyndet — loader-/route-komponent-fel fångades redan av `Sentry.ErrorBoundary` (app-fallback), men **root-route-render-fel** föll till TanStacks obrandade default ("Something went wrong!"); DoD-rad 8:s "ladda om"-fallback levererades inte för dem. Alla router-fel nådde Sentry via `createRoot` `onCaughtError`. Åtgärdat (commit `6bd756d`): `defaultErrorComponent` (`src/components/RouteErrorFallback.tsx`) i `createRouter` — branded fallback för alla router-fel inkl. root-route. K0.3b kontrast-test: (c) root-route-fel ger nu branded fallback (TanStack-varningen borta); `onCaughtError` 1× per fel (Sentry-capture intakt, ingen dubbel-rapport). Ingen `onError` (undviker dubbel-rapport); `Sentry.ErrorBoundary` orörd. [ADR-038](decisions/ADR-038-router-fel-defaultErrorComponent.md). Öppna frågor (Sentry.ErrorBoundary-roll, render-gate-yta, capture-konsolidering) → fel-hanterings-arkitektur-konsolidering i `tasks/todo.md`.

**K0.4 — Fynd 6 (test-nuqs i prod-bundle):** `test-nuqs` var en DEV-fixtur för K4.1:s DoD 4-verifiering (bevisa nuqs); en inert test-route kvar permanent i prod-route-tree + bundle (~12.21 kB chunk) var en grön signal utan rätt mätning. Borttagen (commit `c9c44b1`): `src/routes/_authenticated/test-nuqs.tsx` raderad, `routeTree.gen.ts` (gitignored) regenererad utan `/test-nuqs`. Ren build verifierad — test-nuqs-chunk borta ur `dist/assets`. **nuqs-infra intakt:** paketet + `NuqsAdapter` i `__root.tsx` orörda; första riktiga `useQueryState` + regressionstest sker i Fas 6 (första URL-state-feature). DoD-rad 4 omtextad till varaktigt tillstånd. Ingen ADR — fixtur-städning.

**K0.5 — Fynd 5 + 7 (ärlig omklassning av deferrade fynd):** båda har etablerade defer-beslut → ingen kod-åtgärd; K0.5 registrerar dem sant så Fas 2:s 11/10-status inte hålls gisslan. **Fynd 5 (logout):** K4.3 Test 6 verifierar router-reaktion på förlorad session (storage-clear), men `auth.logout()`→`signOut()`-vägen är typbevisad, ej regressionstestad — DoD-rad 2 omtextad, logout-test deferrat (Fas 3.5/5, `tasks/todo.md`). **Fynd 7 (bundle):** main-chunk 640.49 kB raw / 188.97 kB gzip (~oförändrat vs baslinje 640.82/189.22; test-nuqs −12.21 kB ur total, main oförändrat → ingen regression) — medveten Fas 7 perf-budget-defer, ej 11/10-blocker (bundle-evolution-tabell + `tasks/todo.md` Fas 7-punkt). Ingen ADR. **Alla sju Fas 2-fynd därmed hanterade** (Fynd 1–4 + 6 åtgärdade K0.1–K0.4; Fynd 5 + 7 ärligt omklassade K0.5).

---

## Session 8 — Process-retrospektiv (K0a + K0b + K0c, 2026-05-27 → 2026-05-28)

Process-retrospektiv mellan Fas 2 och Fas 2.5 — diagnos av en tyst doc-drift-klass (kadens-missmatch), åtgärd med 2 deterministiska per-push-grindar, och cross-repo-stängning av två hub-trådar. Full trail i `tasks/sessions/archive/2026-05/2026-05-27-session-8.md`. Session 8 spände två kalenderdagar utan att split:as — empirisk bekräftelse av [ADR-040](decisions/ADR-040-sessions-numreringskonvention.md) Beslut 2 (en session = en logisk arbetsenhet; en paus renumreras inte).

**K0a — kartläggning (förrättad i en tidigare Code-session, retroaktivt registrerad i sessionsdoket):** inventerade skydds-mekanismerna (4 skills + ~11 CI-grindar + den enda fas-bundna doc-drift-vakten `phase-end-verify.sh`), klassade Session 7:s 8 fix-steg (Klass A CC-tooling: 2; Klass B ogrindad artefakt-drift: 4; Klass C self-review-fångad: 2), och hittade 2 aktiva driftar: README ADR-räkning `28` vs faktiskt `38` filer + ADR-029 § Utelämning #6 `fetch-depth: 50` vs ci.yml `100`. Roten diagnoserad som **kadens-missmatch**: enda mekaniska doc-drift-vakten körs vid fas-avslut medan artefakter ändras varje session — drift osynlig (inga failande tester) tills någon läser fel värde. K0b avtäckte dessutom att `phase-end-verify`:s ADR-check redan var trasig (greppade stale `28` på en andra README-rad — `head -1`-icke-determinism). Ingen kod-åtgärd här; K0a är diagnos.

**K0b — åtgärd (commits `e572a17` + `0227a1c`, 2026-05-27):** atomisk K0b-commit (12 filer) levererade: (a) README ADR-räkning lyft ur fryst "Statistik"-ram till en kanonisk levande rad (token `<N> arkitekturbeslut`, exakt 1 träff i README — skyddar phase-end-verifys `head -1`); (b) ADR-029 fetch-depth-erratum (scope:ad till `changed`-jobbet inom ADR-029:s jurisdiktion, cross-job-invariant deferad till ADR-039); (c) 2 deterministiska CI-grindar — `scripts/check-adr-count.sh` (ADR-fil-antal == README-token) + `scripts/check-fetch-depth-invariant.sh` (6 levande bärare ömsesidigt lika; ADR-029/030 verifieras bära erratum, ej värde-likhet — `^[[:space:]]*`-ankare exkluderar ci-yaml-kommentarer); (d) 2 truth-table-suiter (4+7 fall, kontrast-bevisade grön→röd→grön; T5 bevisar frusen-text-exklusion); (e) wirade i alltid-körande `lint`-jobbet (kör-varje-push, shellcheck-strict 0/0/0/0); (f) [ADR-039](decisions/ADR-039-konsistens-grindar-kadens.md) (kadens-principen + lesson→grind-principen, utvidgar [ADR-036](decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md)); (g) L51–L54 [UNIVERSAL] + lesson→grind-todo (CI-wira `test-check-{frontmatter,public-checklists}.sh` — kvar öppen). Self-catch: ADR-039-filen bumpade ADR-antalet 38→39 → grinden fångade behovet på sin egen commit. Separat commit `0227a1c` för [ADR-040](decisions/ADR-040-sessions-numreringskonvention.md) (sessions-numreringskonvention — sekventiella heltal, decimaler avvisade) + README 39→40 + index-rad i samma atomic commit (krav från check-adr-count). CI grön på enforcement-ytan (runs 26511094980 + 26511266901).

**K0c — cross-repo-stängning (hub `96e6727` + `a2bd96b` + `3c611bd`, spoke `bdb5f6c` + `1a20415`, 2026-05-28):** två hub-trådar K0b lämnade öppna. (1) Hub-skill `session-start/SKILL.md` fick en universellt formulerad sub-disciplin för ADR-040 (sekventiella heltal, mini-handoffs ≠ ny session, faser separat axel, historik grandfathrad) — **description orörd** (diff-verifierat: K8-discovery-skyddet intakt; session-start var 1 av 4 rena per Session 6.7 K8); pekare i kropp, inte i description. Plugin bumpad 1.1.0 → 1.1.1 (PATCH för body-enrichment — etablerar precedens vs enda tidigare bump `e8aadf0` MINOR för skill-set-ändring). Empiriskt aktiveringsbevis: cache är path-keyed by version — pre-bump `grep -c "sessionsnummer (numreringskonvention)"` på `1.1.0/` = 0; post-`claude plugin marketplace update marcus-hub` + `claude plugin update marcus-system@marcus-hub` materialiserades `1.1.1/` med grep = 1 (gamla `1.1.0/` bevarad frusen). Session 7 STOPPA #1-klassen (settings.json-klobber per L38) vaktad med per-kommando-sha256-snapshot: spoke `.claude/settings.json` byte-identisk PRE / POST båda CC-kommandona — risken inträffade inte. (2) Hub-lessons-lift K8.1–K8.5 i `marcus-system/tasks/lessons.md` (1:1 från spoke L51–L55), Source-header med spoke-H2-datum 2026-05-27 + hub-H2 datum 2026-05-28 (avsiktlig asymmetri per Session 7-precedensen). Spoke L55 + "Senaste lyft"-markör uppdaterad → hub-sha `3c611bd`. Spoke `.githooks/pre-commit` auto-bumpade `tasks/lessons.md` `updated: 2026-05-27 → 2026-05-28` — första icke-idempotenta hook-körningen i hela trailen (dag-rollover-triggad), empirisk bekräftelse att ADR-030-hooken faktiskt fyrar korrekt, inte bara står grön. CI grön på enforcement-ytan (runs 26559550509 + 26567611880); K0b:s grindar oregredderade. Sessionsdok finaliserad ✅ KLAR; non-governing per `.frontmatter-policy.conf` → manuell `updated:`-bump (verifierat empiriskt, hooken orörd). **Transparent stale-fält:** `installed_plugins.json.gitCommitSha` stannade på `e8aadf06` trots att `1.1.1/` materialiserades från `a2bd96b` — andra empiriska datapunkten på K7.4/L41–L42-fenomenet att CC:s plugin-state-fält är opålitliga; funktionellt irrelevant (CC läser från `installPath`); loggad i K8.5/L55.

**Uppskjutet (egen framtida commit, ej Session 8-scope):** CI-wiring av `test-check-frontmatter.sh` + `test-check-public-checklists.sh` — lesson→grind-todo per L52/K8.2 (öppen i `tasks/todo.md` § "Session 8 K0b — lesson→grind-uppföljning"); pre-existing inkonsistens K0a avtäckte. Plus Session 9-backlog-punkt: omdefiniera session-end-skillens roll (autonom motor vs verifierings-checklista) — kandidat-ADR, fångad efter K0c efterhands-verifiering.

---

## Session 9 — Roll-arkitektur + ADR-041 do-confirm-reframe + fetch-depth-invariant 100→250 (DEL 1 + DEL 2 + DEL 2.5 + DEL 3 + DEL 4 + DEL 3.5a + DEL 5, 2026-05-29)

Process-tung session med fyra parallella tematiska tyngdpunkter — startade som prepfas inför Fas 2.5 men kristalliserades till fundament-arbete för roll-arkitektur Chat/Code/Marcus. Full trail i `tasks/sessions/archive/2026-05/2026-05-29-session-9.md`.

**DEL 1 — ADR-041 do-confirm-roll (commits `23e8254` + `6e0c175` + `3682ef3`, 2026-05-29):** session-end-skillens roll omdefinieras från read-do autonom motor till do-confirm-verifiering körd av Code mot Chat-dirigerat avslut. Etablerar tre-lagers-kadens: Lager 1 per-push CI-grindar ([ADR-039](decisions/ADR-039-konsistens-grindar-kadens.md)), Lager 2 phase-end-verify, Lager 3 denna skill. Killer items (BUILD-LOG, Marcus-Update) i förgrunden per Gawandes 5-9-postersregel. Additiv erratum på [ADR-023](decisions/ADR-023-sessions-arkivering.md) harmoniserar arkiverings-formulering. Två cleanup-runder (MD004 + Vale.Repetition) etablerade [L56](../tasks/lessons.md#L56) som permanent disciplin.

**DEL 2 — lesson→grind-wiring arkiverad efter T11b-discovery (commits `e25f2fe` → `fb38af8` → `49de062` → `50b91e6` → `32c953f` → `ec8f4cd` → `af6b05d` → `fba2624`, 2026-05-29):** wiring av `test-check-frontmatter.sh` + `test-check-public-checklists.sh` i CI exponerade pre-existing CI-only-race i T11b (git upload-pack/pack-objects + auto-gc/maintenance.auto). Web-research mot förstapartskälla git-gc(1) gav verifierad fix (`gc.auto 0` + `maintenance.auto 0` i `setup_repo()`, 10/10 grönt). Attribuerings-försök blockerades av separat PR-mode-checkout-artefakt. Sidotråden eskalerade i fyra rundor; meta-fråga från Code utlöste **arkivering** av wiring + revert (commit `fba2624`). T11b-fixen dormant i scriptet som evidens-trail. Lessons L57–L61 fångar mönstren (lesson→grind-wiring som upptäcktsoperation, web-research falsifierings-disciplin, verifierad fix utan attribuering, PR-mode mode-känslighet, scope-eskalering vid lokalt försvarbara beslut).

**DEL 2.5 — fetch-depth-invariant 100→250 (commit `c289830`, 2026-05-29):** post-DEL-2-revert exponerade pre-existing deterministisk drift på huvud-grinden `check-frontmatter` (4 av 9 styrande docs utanför fetch-depth 100, värsta 115 commits). Mekanism: shallow-fetch-cutoff över commit-tunga repo-fas. Konstitutions-underhåll inom ADR-039:s mönster (mönsterförstärkning av Session 7 K0.S2 50→100). Bump-värde 250 grundat empiriskt på commits-per-session-takt × marginal. Atomisk commit över 11 yttringar: 4 ci.yml-jobb + .frontmatter-policy.conf + scripts/check-frontmatter.sh + ADR-029 + ADR-030 + ADR-039 ny erratum + T11b edge-case-bumpar. Lessons L62–L63 (invariant-värde-översyn periodisk, multipla yttringar atomiskt).

**DEL 3 — Chat-side roll-arkitektur (commit `5523278`, 2026-05-29):** fyra nya sektioner i `project-instructions/miranon-media-admin.md` — ROLL-ARKITEKTUR, CHAT-OUTPUT 4-ZONERS DISCIPLIN, SESSIONSSTART, SESSIONSAVSLUT. Återställer 4-zoners-mallen (etablerad Session 6.5 commit `c06d3ff`, utlyft ur hub-CLAUDE.md Session 6.7 K6-refactor, aldrig landad i spoke per ursprunglig klassningstabell). Forensik från hub-CLAUDE.md `2a4a8c7^` gav verbatim-text för 4-zoners-mall + STOPPA-format. Aktiverad i claude.ai-projektinställningar samma dag (Marcus' manuella moment per ADR-034 p.9). L64 (disciplin scope-bunden — "0 violations"-krav hör i CI-grindade filer) skördad ur Code:s STOPPA-OCH-FRÅGA-fångst av prompt-motsägelse.

**DEL 4 — session-end-skill reframe (hub commits `9725a78` + `56684fe`, 2026-05-29):** SKILL.md i hub-pluginet krymper 115 → 96 rader. Read-do-stegen ersätts av do-confirm-pass med 10 numrerade poster (killer items #4 BUILD-LOG + #10 Marcus-Update i fetstil). Trigger-mening + negativ trigger K8-skyddade orörda; endast "Täcker..."-mening minimal accuracy-edit. Transcript-disciplin + P3a bevarade verbatim (H3 → H2-promotion när ## Procedur-containern legitimt försvann — L65-källans instans 1). Plugin.json bumpas 1.1.1 → 1.2.0 (minor). Re-install via `claude plugin update marcus-system@marcus-hub --scope user`. Cache-content bidirektional verifierad empiriskt (ny H1 i 1.2.0 ✓, ej i 1.1.1; gammal H1 i 1.1.1 ✓, ej i 1.2.0) — konsoliderar L55 utan ny lesson. Settings.json-vakt: SHA256 identisk pre/post re-install (`72f8031b...`).

**DEL 3.5a — Code-side roll-arkitektur (hub commits `5866f68` + `1845ca9`, 2026-05-29):** ny H2-sektion `## Roll-arkitektur — Chat, Code, Marcus` i hub-CLAUDE.md mellan rad 41 ("Hur Marcus jobbar") och rad 45 ("Instruktioner"). Pekarstil per hub-prejudikatet (PRINCIPER inline, HUR delegerat). Pekare till `plugins/marcus-system/skills/session-start/` + flagga att full code-roll-disciplin etableras i Session 10 som egen skill. Research-grundad: Anthropic Engineering (Boris Cherny), multi-agent LLM-litteratur, Google SRE — tre branscher konvergerade mot explicit roll-arkitektur framför implicit kontrakt. Follow-up-commit `1845ca9` bumpade `updated:` (hub saknar frontmatter-hook). L65-källans instans 2 (`updated:`-fält strikt "ORÖRD"-tolkning → fel datum bevarat → mönsterklass etablerad).

**DEL 5 — sessionsdok + lessons + todo + BUILD-LOG (commits `dec50ee` + `cd27ff0` + `40d19e8` + denna, 2026-05-29):** lessons L56–L65 skördade ([UNIVERSAL], alla hub-lyft pending nästa K-sista). Sessionsdok 466 rader, 8 sektioner. Todo uppdaterad: Senast uppdaterad 2026-05-28 → 2026-05-29, Session 8 K0b ompositionerad till "pending dedikerad session", Session 9-backlog markerad ✅ KLAR med commit-trail, Session 10-scope flaggad (code-roll-disciplin-skill = första punkt, sessionsdok-skapande-skill kandidat efter, Fas 2.5 huvudtema). L56:s lokala CI-paritet fångade L56:s egen leverans (9 MD042+MD033 violations i nyformulerade lessons) — extern fångst-arkitektur i full sysselsättning. L65 manifesterades tre gånger i samma session den etablerades.

**DEL 6 — dogfood i restartad Code-session (mot 1.2.0-skillen i RAM):** do-confirm-pass mot Session 9:s sammantagna leverans fångade två killer-SAKNAS — BUILD-LOG-entry (denna commit) + Marcus-Update-påminnelse (given i Code:s dogfood-rapport). Båda samma killer som föll Session 8 (L55-syskon-mönster). ADR-041:s do-confirm-roll empiriskt validerad på första körning.

**Uppskjutet (Session 10 + framtida):** code-roll-disciplin-skill (Session 10 första punkt), sessionsdok-skapande-skill (Session 10+ kandidat), Fas 2.5 Schema-kontrakt-sync (Session 10 huvudtema efter skill-fundament). DEL 2 lesson→grind-wiring → dedikerad framtida session (ej Session 10-scope per L57). Hub-governance-lyft (markdownlint + CI + frontmatter-hook för marcus-system-repot) → egen framtida designsession. Hub-lyft av L56–L65 → nästa K-sista.

---

## Session 10 — code-roll-disciplin (ADR-042) + session-lifecycle-arkitektur (ADR-043 Proposed) + recovery-backfill (2026-05-30)

Session öppnade på Session 9-handoffens "code-roll-disciplin-skill" men avtäckte tre process-haverier: sessionsdoket föddes aldrig vid sessionsstart, `todo.md` uppdaterades inte vid landning, och verifierings-disciplinen feltillämpades på Chats eget icke-utförda arbete. Sessionsdoket backfillades från git-trail. Full trail i `tasks/sessions/archive/2026-05/2026-05-30-session-10.md`.

**ADR-042 — code-roll-disciplin alltid-på, inte skill (spoke commit `c4af8bf` + hub commit `f9d59f5`, 2026-05-30):** Session 9-handoffen föreslog en egen skill; falsifiering mot [ADR-034](decisions/ADR-034-skill-arkitektur.md) p.8 + K8 (meta-disciplin auto-upptäcks ej tillförlitligt) visade att disciplinen hör hemma som alltid-på, template-buren regel. Hub-template `templates/code-role-discipline.md` (162 rader) bär HUR-stegen (handover-protokoll, transparens-rapport-format, STOPPA-grindar som procedursteg); hub-CLAUDE.md + spoke-konstitutionen pekar mot den (PRINCIP inline, HUR delegerat). Spoke-konsekvenser: README + decisions/README + Session 9 BUILD-LOG-backfill (commits `c4af8bf` + `6b476c5` + `33d1cbd`). L66 (handoff-formulering är mekanism-förslag, inte mekanismbeslut).

**ADR-043 — session-lifecycle som två-ytors skill-par, Proposed (commit `80f87aa`, 2026-05-30):** lifecycle modelleras som Chat-halva (claude.ai `/`-anrop) + Code-halva (plugin-skill) bundna av ett handoff-kontrakt, plus Project Instructions bas/delta-mall och `create-session-doc` i session-starts Code-halva — ger Chat-ytan en lifecycle-mekanism utan discovery-beroende. Ratificerad av Marcus i direktion men hålls **Proposed**; flippas till Accepted vid första inkrementets landning. Bygge (inkrement 1–5) defererat till Session 11. Atomisk commit: ADR-fil + katalog-rad (Proposed) + README-räkning 42→43 ([ADR-039](decisions/ADR-039-konsistens-grindar-kadens.md)-grind 43==43 grön). Pre-commit-hooken auto-bumpade `decisions/README.md` `updated:` → 2026-05-31 (dag-rollover; governing-doc stämplas med faktiskt klock-datum medan sessionsdok + ADR behåller arbetsdatumet 2026-05-30 — L67).

**Recovery-backfill — sessionsdok + lessons + todo + denna entry (commits `38ca605` → `80f87aa`, 2026-05-30):** sessionsdoket (138 rader) backfillat från git-trail eftersom det aldrig föddes vid start (process-haveri 1). Lessons L66–L69 skördade ([UNIVERSAL], hub-lyft pending nästa K-sista). De tre process-haverierna kodifierade: L67 (levande artefakter har landnings-kadens, inte avsluts-kadens), L68 (regel-finns-men-oanvänd — att läsa lessons vid start ≠ operationalisera dem), L69 (verifierings-disciplin gäller externt state, inte eget agerande). Todo uppdaterad till landnings-status. Hela passet kördes mot code-roll-disciplinens transparens-rapport-format med STOPPA-grindar (overifierbara cross-referenser i L66/L68 flaggade för kvittens i stället för gissade).

**Uppskjutet (Session 11 + framtida):** ADR-043-bygge inkrement 1–5 (Session 11); Fas 2.5 Schema-kontrakt-sync (Session 11+); hub-lyft av L66–L69 → nästa K-sista; DEL 2 lesson→grind-wiring + hub-governance-lyft → fortsatt egna framtida sessioner (oförändrat sedan Session 9).

## Session 11 — ADR-043 inkrement 1 (PI bas/delta) + drift-fix/CI-integritet (pågående 2026-06-03)

ADR-043 inkrement 1 (PI bas/delta) landat + ADR-043 Accepted. Hub-bas `templates/project-instructions-base.md` (`16a4e9f`); spoke-delta + ADR-flip + README (`393ec9c`); beslut T1′ (lifecycle-prosa parkerad i delta, ej pekare i bas) + T2 (två-fils-paste); no-loss-diff grön. Drift-fix för fem pre-existing externa länkfel (ej inkrement-1-orsakade): browser-UA via `--header` för UA-WAF 406/415 + digg.se timeout-ignore (`6274918`); skip/config-revaliderings-gap lagat via decouplad `docs_changed` (`6a0ab9c`). Tre CI-integritetshål ytade (cache-maskering öppen → ADR-044-kandidat; skip- + config-utan-revalidering lagade). CI-validerat grön run `26907015576`. Inkrement 2–5 + Fas 2.5 carry → Session 12. Sessionsdok-trail: [`tasks/sessions/archive/2026-06/2026-06-02-session-11.md`](../tasks/sessions/archive/2026-06/2026-06-02-session-11.md).

## Session 12 — ADR-043-bygge komplett (inkrement 2–5) + lifecycle-dogfood (2026-06-05 → 2026-06-10)

ADR-043-bygget slutfört, commit-range `9c1d3f5` → sessionsavsluts-commiten (spoke) +
`8db2b5a` → `9b19558` (hub). Inkrement 2: session-start Code-halva + create-session-doc-
referensfil, plugin 1.2.0→1.3.0 inkl. marketplace-drift-heal (`8db2b5a`+`3f11ed2`; L77/L79).
Inkrement 3: Chat-halvorna session-{start,end,resume} som claude.ai-skills (`332eb04`) +
T1′-swap (pekare i PI-bas `d7eb1e1`, parkerad prosa raderad `7c72f78`, no-loss-verifierad).
Inkrement 4: handoff-kontrakt `templates/chat-code-handoff-contract.md` v1.0 (`9b19558`).
Inkrement 5: skarp dogfood — `/session-resume` PASS båda halvor, `/session-end` körd som
denna stängning, 5c (`/session-start`) restmoment → Session 13-öppning. Extra: CI-grönfix
`c1486fc` (travisgosselin.com cachad-timeout → anchored `.lycheeignore`, L82; ADR-044-tråd).
Lessons L77–L82 skördade ([UNIVERSAL], hub-lyft pending nästa K-sista). **Fas 2.5
(Schema-kontrakt-sync) öppnar Session 13 på dogfood-verifierat lifecycle-fundament.**
Sessionsdok-trail: [`tasks/sessions/archive/2026-06/2026-06-05-session-12.md`](../tasks/sessions/archive/2026-06/2026-06-05-session-12.md).

---

## Session 13 — Synk-gate 1-forensik + Fas 2.5 Schema-kontrakt-sync KOMPLETT + fas-avslut (2026-06-10)

**Planerat:** Fas 2.5 per byggplan §4.5 (1 session, estimat hållet). **Faktiskt:** gate-forensik
tillkom som arbetspunkt 0 — orienterings-passet fann gate-divergens utan beslutsspår.
Sessionsdok fött via create-session-doc-grenen (`3801046`; ADR-043 restmoment 5c PASS).
Synk-gate 1: forensik (transkriptions-drift bevisad, ingen beslutstrail) → byggplan-
korrigering mot A4 (`121785b`) → A1–A12-inventering MCP-verifierad mot live (`ba7f288`;
A1–A8 EJ APPLICERADE, A10–A11 preserve, A12 ej MCP-verifierbar) → gate STÄNGD efter
Marcus-kvittens (`1f8eb8e`) med schema-frys till fas-stängning. Fas 2.5 i fyra klungor:
K1 Status.ts 4→6 (`fa712a6`), K2 enum-granskning noll divergens + path-fix (`9f5e7a9`),
K3 z.enum-hårdning + modell-smalning efter outlier-svep 0 träffar (`c50280a`+`edf6e2e`),
K4 adapter-debt-klassning 9 metoder per A5 + EventStatus (`6b7ca56`). DoD 1–7 uppfyllda;
Test+Build körd grön på varje kod-commit (separerade pushar). **Avvikelser:** inga EF-deploys
(by design); död-kod-utfall: ingen metod A5-klassad som död — fetchLeads/fetchMailLog
omvärderas Fas 6; bifynd Deadline slutbetalning-formeldrift → todo (Fas B-sfär).
Lessons L83–L87. Fas-avslut körd denna session (phase-end-verify + hub-sync + CHANGELOG 0.4.0).
Sessionsdok-trail: [`tasks/sessions/archive/2026-06/2026-06-10-session-13.md`](../tasks/sessions/archive/2026-06/2026-06-10-session-13.md).

---

## Session 14 — Fas 3 UI-primitiver: alla 6 byggda + ADR-044 + kontrastfix (2026-06-10 → 2026-06-11)

**Planerat:** Fas 3-start per byggplan §4 (estimat 2 sessioner). **Faktiskt:** alla 6
primitiver plus ADR-044, kontrastfix och KVALITETSDEF §1/§2 i EN session; DoD 1 (axe/skärmläsardel) + DoD 4
→ Fas 3.5 per ADR-020 — **Fas 3 ÖPPEN tills dess.** Sessionsdok fött via create-session-doc-
grenen (`c826629`). K1: ADR-044 (react-aria-components som bas + /dev/primitives i st f
Storybook; byggplan §4-scope-korrigering, `950d6b0`) + Button + demo-route (`7e063ac`);
tailwind-merge-fyndet rotorsaks-fixat i cn.ts (L88); enda browser-passet — mönster-sättaren
bevisad en gång (L89). K2: Input + Select + --mm-button-*-tokens i components.css (`f19a262`);
verifierings-protokoll justerat (Code endast programmatiska grindar). K3: KVALITETSDEF §1/§2
React-mappning (`deb5538`) + MessageBox/Modal/Dialog + --mm-border-field ← --p-neutral-400
(3,50:1 mot WCAG 1.4.11) (`0a70103`). Test+Build körd grön på varje kod-commit; docs/kod i
separerade pushar (L87). **Avvikelser:** K4-direktivets premiss ("/dev/primitives bakom auth")
falsifierad av LÄS-forensik — stängd som rapport-leverans utan commit (L85/L90);
namnrymds-divergens K2 (--mm-btn-* → --mm-button-*) löst med beslutsspår per L83.
Marcus interaktiva checklista mot /dev/primitives: GRÖN. Lessons L88–L90.
Sessionsdok-trail: [`tasks/sessions/archive/2026-06/2026-06-10-session-14.md`](../tasks/sessions/archive/2026-06/2026-06-10-session-14.md).

---

## Session 15 — Fas 3.5 A11y-baseline: runner + mönsterbibliotek + ADR-045/046 (2026-06-11)

**Planerat:** Fas 3.5 per byggplan §4 (estimat 1 session). **Faktiskt:** hela infran +
mönsterbiblioteket + wiring-beslutet i en session. K1: ADR-045 (CI-måltavla /dev/primitives
via webServer-dev-server; 0 violations kanonisk; test:a11y i Test+Build-sfären, `171e366`) +
byggplan §4 Fas 3.5 i components-termer + checklist §5-korrigeringar; ADR-039-grinden fångade
räknings-miss (`bdee8f8`). K2: axe-runner (7 tester, 6 primitiver) + STOPPA på verkligt
kontrastfynd → Marcus-beslut A: --mm-text-muted → --p-neutral-500 (`de33f99`); DoD 2-bevis:
medvetet brytande branch → run 27337333679 RÖD exakt på a11y-steget, PR #41 stängd utan merge.
K3: /dev/patterns med 5 referens-implementationer + 5 pattern-specar + port-härdad alltid-färsk
a11y-server (`3f66dfb`) + docs/aria-patterns/ 5 filer (`85b1052`). K4: aria-errormessage-forensik
(DOM-dubbel-referens på Input; död wiring på Select) korsad med Marcus skärmläsarpass
(VoiceOver/Safari) → ADR-046: explicit errormessage-wiring riven, describedby/FieldError enda
vägen (`8c4a2da` + `8403040`); ComboBox-spec-flakighet fixad med riktiga tangenttryck (`4914955`).

**Fas 3 ✅ KLAR + Fas 3.5 ✅ KLAR 2026-06-11** — båda med fullt fas-avslut
(phase-end-verify, hub-sync L88–L94, CHANGELOG 0.5.0, arkiveringspass).
**Gate "A11y-baseline godkänd": PASSERAD 2026-06-11 — FÖRE Fas 6-start** (Fas 3.5 DoD 6).
Bevis: runner 12/12 i CI (run 27343206661); CI failar vid violation (gate-proof-run
27337333679 röd på a11y-steget, button-name critical); Marcus skärmläsarpass grönt
(Modal/Dialog: annonsering, fokus-fångst, fokus-retur; /dev/patterns-genomgång grön);
[ADR-045](decisions/ADR-045-a11y-runner-arkitektur.md) +
[ADR-046](decisions/ADR-046-felmeddelande-wiring-describedby.md).
Sessionsdok-trail: [`tasks/sessions/archive/2026-06/2026-06-11-session-15.md`](../tasks/sessions/archive/2026-06/2026-06-11-session-15.md).

---

## Session 16 — Fas 5 App-shell KOMPLETT + fas-avslut (2026-06-12)

K1: [ADR-047](decisions/ADR-047-pwa-arkitektur-fas-5.md) + byggplan-DoD 4-modernisering — Lighthouse
v12 tog bort PWA-kategorin (`6c47754`). K2: PWA-fundament — `vite-plugin-pwa` injectManifest,
Fas 0-skelettet porterat till `src/sw.ts`, offline.html, manifest + ikoner (`9a642c3` + `cdbfe0e`).
K3: API-runtime-caching-defer till Fas 6 (`8137938`) + app-skal på `_authenticated` per
STOPPA-utfall A: tab bar, skip-länk, RouteAnnouncer i `__root`, staticData.title-konvention
(`f0d392c`). K4: error-boundary-konsolidering till två lager — `Sentry.ErrorBoundary` +
`RouteErrorFallback` rivna, `SectionError` + `AppErrorBoundary` in; `networkMode: 'online'` +
OfflineIndicator (`7e558a3`). K5: varaktiga DoD-tester (shell + pwa-offline,
miljö-självguardande) samt Lighthouse 81/100/100 mot baseline 86/100/96 — Perf accepterad mot
Fynd 7-defern (`ae049a5` + `3422e90`). K5b–d: ikon-kvalitet (lossless, `pwa-assets.config.ts`),
maskable-geometri (padding 0.45, hörn-radie-kvot 0,868), rund favicon
(`4fea8f4`, `80a93ab`, `750be7e`).

**Fas 5 ✅ KLAR (KOMPLETT) 2026-06-12** — fullt fas-avslut (phase-end-verify, hub-sync
L96–L102 → K16.1–K16.7, CHANGELOG 0.6.0, arkiveringspass). Alla 10 DoD-rader stängda
(DoD 4 i ADR-047-form; DoD 4c via Fynd 7-arvet per ADR-047-korrigeringsnoten). Marcus-moment
PASS: installerbarhet, VoiceOver-annonsering, maskable safe zone, rund favicon.
Bevis: shell-sviten + pwa-offline-sviten gröna (runs 27410118400 → 27412742687); ad hoc-pass
19/19 (K3) + 13/13 (K4); axe 0 violations på inloggat skal.
Sessionsdok-trail: [`tasks/sessions/2026-06-12-session-16.md`](../tasks/sessions/2026-06-12-session-16.md).

---

## Session 17 — Repo-hygien + synk-horisont (mellanfas, ingen byggfas) (2026-06-13)

Commit-range `85990b1` → `0108ffe` + K-sista bake-in. Drivkraft: K0-inventeringen
(orienterings-pass 2026-06-12) visade projektkunskaps-synken på 91 % av kapaciteten
med 37 % av spårad textvolym i rena arkiv-/historikkataloger.

Advisory-incident direkt efter dok-födelsen: GHSA-gv7w-rqvm-qjhr (esbuild < 0.28.1,
high, Deno-vektor) gjorde audit-jobbet rött — hanterad per ADR-028-flödet:
diagnostik (transitiv dev-only via vite/tsx; Deno-sidan oberörd) → Marcus-val C →
allowlist med expiry 2026-07-13 (`9429336`) + riv-todo; trail i ADR-028 Updates.
Flyttar: tre direktivfiler tasks/ → docs/archive/ (`f343db3`); docs/logs/ avvecklad
(`39fe4ba`); datamodell-research in under archive/2026-04/ (`43648af`);
docs/analysis/ avvecklad — 5 konsumerade analyser → docs/archive/ med levande
pekare uppdaterade (`4550886`). Lokal hygien: odoo-workbench (409 MB) ut ur
arbetsträdet, git gc 31 MB → 3,6 MB. [ADR-048](decisions/ADR-048-synk-horisont-arkiv-atkomst.md)
med pekar-paketet: CLAUDE.md § Synk-horisont, PI-delta, arkiv-README:er (`bd3957d`,
`5dc43e5`, `89b2d4e`); CI-eftersläp rättat `3dd0fad` (todo-länk + ADR-räknare 47→48).
K6 struktur-audit: rot/docs/kod friska (30 rotfiler alla verktygsmotiverade, noll
felplaceringar, alla skript refererade); config-gap funnet: 3 av 6
grindvakts-testsviter utanför CI. K7 stängde gapet: aktiva sessionsdok in i
markdownlint-/lychee-scope med 0-mätt skuld (`cced32d`) + testsviterna in i
Lint-jobbet som eget steg, STOPPA-val B, run-bevisade 14/14 + 5/5 + 9/9
(`49ebbdb`, run 27449167933) + todo-rader och Del 3 (`0108ffe`).

**K5-utfall:** Marcus exkluderade `tasks/sessions/archive/` + `docs/archive/` ur
claude.ai-synken och omklistrade PI (bas + nytt delta): **91 % → 64 %**.
Lessons L103–L109 skördade (6 UNIVERSAL; hub-lyft pending nästa K-sista).
Sessionsdok-trail: [`tasks/sessions/2026-06-13-session-17.md`](../tasks/sessions/2026-06-13-session-17.md).

---

## Session 18 — Fas 5.5 server-kontrakt (K1) + PAUS (ingen fas-status-ändring) (2026-06-13)

Commit-range `fae1343` → `2108dd6`. Drivkraft: Fas 5.5:s vertikala write-slice
"markera anmälningsavgift som betald" — server-sidan (operations-registrering +
deny/allow-tester + ADR); klient-UI deferrat till K2.

**Levererat:** Synk-gate 2-handshake bekräftade `Anmälningsavgift`
(`fldJtKQ3qLxRKOvR6`) mot 06a/06b (ingen target-rename). Operationen
`mark-registration-fee-paid → { tableId 'tbloOcrppVoyrHbrq', allowedFields
['Anmälningsavgift'] }` registrerad i `field-allowlists.ts` (`59a5281`).
[ADR-049](decisions/ADR-049-fas-5-5-betalfalt-val.md): fält-val
Anmälningsavgift INTE Status (Status saknar betald-värde; ADR-016:s
Status-kodexempel var pre-Fas-2.5-drift) — ADR-016 fick dubbel-erratum
(kanonisk korrigerings-not efter header-blocket per decisions/README §34 +
inline vid kodexemplet); README-räkning rättad 48→49 via
`check-adr-count`-grinden (`1c7e469`).

**CI-fynd → forward-fix:** run `27463508240` blev rött på två jobb — (a)
fält-deny-testet föll med `"Unknown operation: mark-registration-fee-paid"`
(den deployade EF:en känner inte operationen; CI har inget deploy-steg), (b)
Vale-länktext-gemener i ADR-049. Forward-fix (`2108dd6`): de två
operations-beroende deny-testerna re-skippade tills redeploy (`recordId-prefix`
passerade dessförinnan för fel anledning) + backtick-wrap av länktext →
run **`27463660822` grön**. Endast `deny: okänd operation` aktiv; övriga tre
`test.skip` gated på redeploy.

**Pausorsak (ej fas-avslut):** deploy-kapacitets-verifieringen visade att orgen
har **ett enda** Supabase-projekt — "staging" testerna träffar är den levande
miljön + samma Airtable-bas. Att deploya mot/mutera den enda miljön avvisades;
rätt åtgärd är att bygga riktig staging först (Session 19, research-gated,
ADR-050). Fas 5.5 förblir pågående (ej KLAR); byggplanens fas-tabell orörd.
Lessons L110–L113 skördade (4 UNIVERSAL). Sessionsdok-trail:
[`tasks/sessions/archive/2026-06/2026-06-13-session-18.md`](../tasks/sessions/archive/2026-06/2026-06-13-session-18.md).

---

## Session 19 — Staging-miljö designsession: ADR-050 + förarbete steg 1+2 (ingen fas-status-ändring) (2026-06-13)

Commit-range `3a3269a` → `009a8d1`. Research-gated: empirisk miljö-verifiering →
ADR-050 → förarbete → Marcus miljö-moment. Avblockerar (efter Session 20-bygget)
Fas 5.5:s deny/allow-tester. Fas 5.5 förblir **PÅGÅENDE** (ej fas-avslut).

**Miljö-forensik:** `supabase projects list` bekräftade ett enda projekt
(L110 håller). Schema-introspektion via fyra oberoende read-only-kanaler
(`supabase inspect db` table/index/vacuum-stats + PostgREST OpenAPI-rot) visade
**noll app-tabeller** — all data i Airtable, Postgres bär bara managed Auth →
`db pull`/migrations deprioriterat (L115).

**[ADR-050](decisions/ADR-050-isolerad-staging-miljo.md):** isolerad staging —
separat Supabase-projekt (Pro) + dedikerad Airtable-bas utan records +
env-driven `AIRTABLE_BASE_ID`. Avvisar Free+keep-alive och branching som primär.
Commits `1f9d5b4` + `8445f75` (grindfix: README count 49→50, katalog-rad, Vale
code-span). Status `Accepted` (engelsk konvention, L114). README-räkning via
`check-adr-count`-grinden.

**Förarbete steg 1 (`49267b4`):** `AIRTABLE_BASE_ID` env-drivet med fail-fast
(ingen prod-fallback); tabell-adressering i 4 EF:er bytt från bas-unika
`tbl`-id:n till tabell-NAMN (Eventplanering/Personer/Anmälningar, live-verifierade
och Airtable-docs-bekräftad namn-i-path). `.env.test.example`/`ci.yml` medvetet
ej rörda — ingen testväg läser secreten (L117).

**Förarbete steg 2 (`009a8d1`):** fail-closed prod-deploy-allowlist mot Fas
7-skulden — `.prod-functions-allowlist.conf` (5 prod; test-auth utanför) +
`scripts/deploy-prod-functions.sh` + `scripts/test-deploy-prod-functions.sh`
(4 testfall, CI-kört eget steg). Allowlist-över-blocklista: ny funktion =
prod-exkluderad by default.

**Marcus miljö-moment:** Supabase uppgraderad till Pro; staging-projekt skapat
(`miranon-media-admin-staging`, AWS eu-west-1, Micro, Data API på,
auto-expose/auto-RLS av); Airtable staging-bas skapad ("Miranon Media OS -
staging", utan records, samma workspace som prod — isolering via bas-ID, ej
workspace, L118).

**Bär vidare (kritiskt):** (1) `AIRTABLE_BASE_ID` måste sättas som prod-secret
FÖRE nästa prod-redeploy (annars fail-fast). (2) Prod-deploy endast via
allowlist-skriptet. Lessons L114–L118 skördade (3 UNIVERSAL). Nästa: Session 20
bygg-steg 3–8. Sessionsdok-trail:
[`tasks/sessions/archive/2026-06/2026-06-13-session-19.md`](../tasks/sessions/archive/2026-06/2026-06-13-session-19.md).

---

## Session 19 (resume 2026-06-15) — staging-migration steg 3–7 KOMPLETT (ingen fas-status-ändring)

Commit-range `060c1dc` → `45c02a9` (resume-work-burst; session-end-commits förlänger).
Återupptog session 19 via `/session-resume` (lifecycle paused→active). ADR-050:s
bygg-sekvens slutförd mot en riktig isolerad staging. Fas 5.5 förblir **PÅGÅENDE**
(deny/allow-grinden avblockerad; K2 klient-UI återstår, ej fas-avslut).

**Staging-migration (ADR-050 bygg-sekvens 1–7 KOMPLETT):**

- **Steg 3** — empirisk ID-läsning: staging-bas `apphjj8Q7lkXCMsL4` (exakt 1 bas,
  scope ren), 18 tabeller; schema-check (T4) CLEAN (Eventplanering/Personer/
  Anmälningar finns, namn-portabelt).
- **Steg 4** — staging-secrets satta: `AIRTABLE_TOKEN`/`ADMIN_EMAILS` via
  `--env-file` samt `AIRTABLE_BASE_ID` inline; throwaway-fil raderad.
- **Steg 5** — 6 EF:er deployade via **bare CLI** mot staging-ref `pqtshyierkdgwdnxuirz`
  (ADR-050 steg 5 GOVERNING: alla 6 inkl `test-auth`; prod-allowlist-skriptet är
  PROD-spärr, ej använt). PROD orört. Migrations ej tillämpligt (L115).
- **Steg 6** — 6 CI-test-secrets repointade mot staging (väg b: Marcus skapade 2
  staging-auth-users); `ADMIN_EMAILS`=test-admin. Live-verifierat: CI 40 passed/1
  skipped, inga 401 → users↔secrets bekräftade.
- **Steg 7a** — `CORS_ALLOWED_ORIGINS=http://localhost:5173`; deny-tester (rad 56/83)
  av-skippade (`ac9f842`).
- **Steg 7b** — staging-access-gap löst (Airtable-token-scope utökat → Code når
  staging direkt); syntetisk Anmälningar-rad seedad (`recynkk5KWpWirv7k`,
  `Anmälningsavgift='Ej mottagen'`); `TEST_REGISTRATION_RECORD_ID` wired; allow-test
  (rad 110) aktivt med try/finally-restore + läs-tillbaka-assert (`a63dda2`).
  Staging-svit: **41 passed / 0 skipped**; determinism bekräftad (post restaurerad).

**Supply-chain-detour:** GHSA-fx2h-pf6j-xcff (vite high, dev-server-only, icke-malware)
fixad via **kirurgisk** vite-bump 8.0.12→8.0.16 (`dfb895e`) — §2-avvikelse (full-regen
är malware-purge, ej tillämplig) kvitterad + loggad i ADR-028 ## Updates; defer av
§2-amendering registrerat som **T07**.

**Status:** ADR-050 KOMPLETT; `staging==prod`-defekten (L110) strukturellt stängd.
Öppet: ADR-050 **T4** (löpande schema-sync-disciplin staging↔prod). Lessons L132–L136
(5 UNIVERSAL). Sessionsdok-trail:
[`tasks/sessions/archive/2026-06/2026-06-13-session-19.md`](../tasks/sessions/archive/2026-06/2026-06-13-session-19.md)
Del 2.

---

## Session 21 — Tråd-arkitektur: ADR-053 + register + triage (process-fundament, ingen byggfas) (2026-06-14)

Commit-kedja `f7404d5` → `c811a2c` → `2fba5f6` → `4a0e419` → `ccde82b` → `e434bc8` → K-sista. Process-fundament-session (Fas 5.5 förblir **PÅGÅENDE**, orörd). Stänger seed:ets gap-tes: tråden blir förstaklass-organisationsenhet parallell med sessionen, och det oväntade får ett inkodat hem. Denna post skrivs eftersom vi landar mot avslut (ej pausar) — själva paus-lucke-ironin seed:et pekade på.

**Planerat vs faktiskt (K1→K5, alla CI-gröna):**

- **K0 (`f7404d5`):** Session 21-dok fött vid start (ADR-043 + L67/L68), `lifecycle: active`.
- **K1 (`c811a2c`):** [ADR-053](decisions/ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) Accepted + ADR-räknare 52→53 + katalograd. MEDIUM-på-MINIMAL (event-sourcad ombyggnad förkastad — git ÄR redan append-only-loggen).
- **K2 (`3e035f5` rename + `2fba5f6` transform):** tråd-register `tasks/threads/` (index-README + T01-kort) + seed→T01-migration via **tvåstegs-commit** (historik bevarad, `git log --follow` når seed-födelsen `f83b195`).
- **K3 (`4a0e419`):** `check-lifecycle.sh` utvidgad till tråd-kort (enum + fält↔index-konsistens, passiv drift-vakt) + 16/16 test + markdownlint/lychee-glob för `tasks/threads/`. Vale/trigger täckte redan.
- **K4 (`ccde82b`):** alltid-på triage-mikroregel på två ytor (CLAUDE.md + PI-delta, `[UNIVERSAL]`), brödtext byte-identisk.
- **K5 (`e434bc8`):** tråd-konventioner formaliserade — `[T<NN>]`-commit-tagg + `Tråd:`-header i ADR-053 + `tråd:`-fält i sessionsdok. Första commit med `[T01]`-tagg.

**Tre STOPPA-grindar under bygget (Code reste, löstes öppet):**

1. **Ratificering (K1):** ADR-053 levererades `Proposed` med villkorad flip; Code stannade för Marcus Gate-2-kvittens → landade `Accepted`.
2. **Historik vs en commit (K2):** `git mv` + fullständigt innehållsbyte i samma commit → git ser Delete+Add (similarity <10%) → `--follow` tappar historik. Löst med tvåstegs-commit (ren rename → transform). Se L126.
3. **Verbatim-text vs grindar (K1):** `<NN>`/`<slug>`-placeholders triggade MD033; reell domän `adr.github.io` triggade Vale.Terms. Löst per repots mönster (backtick-kodspann; IL Vale-disable, ADR-032) utan att ändra sak-innehållet.

**Tre dogfood-bevis (tråden bevisar sin egen tes):**

- **T01-födelse:** registret föds genom att registrera sin egen skapelse-tråd (seed-migrationen).
- **T02-defer:** `project-instructions/` CI-täckningsgap (oväntat fynd i K4) defererat till registret via triage-regeln.
- **T03-defer:** Session 20:s BUILD-LOG-glapp (se nedan) defererat via triage-regeln.

**Lessons:** L126–L131 skördade under `## 2026-06-14 — Session 21`-H2 i [`tasks/lessons.md`](../tasks/lessons.md) (L126–L129 hub-lyft-kandidater). Detaljer där; dubbleras ej här.

**Not — Session 20 saknar post i denna logg:** ett do-confirm-glapp vid Session 20:s avslut (BUILD-LOG är killer item per ADR-051 beslut 3). Luckan är **registrerad som T03** i [`tasks/threads/README.md`](../tasks/threads/README.md) för backfill i egen session — den backfillas medvetet INTE här (ADR-023-immutabilitets-klass, annan sessions arbete). Hålet görs synligt där det finns, ej tyst.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-14-session-21.md`](../tasks/sessions/archive/2026-06/2026-06-14-session-21.md). Sessionen är ej formellt avslutad — `/session-end` (ADR-041) är ett separat steg efter denna landnings-klunga; `lifecycle` förblir `active` tills dess.

---

## Session 22 — Fas 5.5 K2 (klient-UI); Landning 1: CI-rotorsak-fix + Landning 2: K2 klient-UI (2026-06-17)

**Mål:** Fas 5.5 K2 — klient-UI för "markera anmälningsavgift som betald" (byggplan.md §4). Landning 1 = enabling-detour som avblockerade CI; Landning 2 = själva K2-bygget (klientsidan av write-slicen).

**Commit-range:** `b5ff420` (sessionsdok fött) → `bfc6cf1` (Landning 2 + markdownlint-fix).

### Landning 1 — CI-rotorsak-fix: `fetch-depth: 0` (full historik), ADR-054 (`6610d6d`)

Sessionsdok-födelsen (`b5ff420`) gjorde CI röd — inte av dok-innehållet, utan genom att ytterst-exponera en latent CI-infra-bugg: dok-committen sköt shallow-fönstret `263 → 264`, varpå tre **orörda** governing-docs (SECURITY-SPEC, hur-systemet-funkar, data-model) fälldes på falsk drift. Deras sanna ändrings-commit (`91b6337`, committer-datum 05-17) hamnade på position 264 — utanför `fetch-depth: 250` — så shallow-boundaryns commit (05-18) blev datum-proxy.

Rotorsak-fix (inte en femte bump): finit djup **är** anti-mönstret (1→50→100→250 brast 4 ggr). `fetch-depth: 250 → 0` = hela historiken, atomiskt över ADR-039:s 6 levande bärare (L63). [ADR-054](decisions/ADR-054-fetch-depth-full-historik.md) (Accepted) bär beslutet med web-citat + öppen rivning av ADR-030:s finit-djup-rationale; ADR-029/030/039 fick additiva daterade errata (uppfyller ADR-039:s Session 9-not + L62). Shallow-detektionen blir no-op vid tröskel 0 (acceptabelt — full-clone-kanon); T10/T11b frikopplade till explicit override-tröskel; invariant-test-svit oförändrad. Deferrad tråd **T08** registrerad (avveckla apparaten via changed-files-Check 2).

Verifiering: 9 grindar lokalt gröna (invariant 6==0 / frontmatter 9/9 / adr-count 54 / test-sviter 7+14 / markdownlint / Vale / lifecycle / shellcheck-strict). CI-run `27699101873`: **alla jobb success** — inkl. Lint+Audit+TypeCheck (det tidigare röda) + Test+Build (kördes pga ci.yml-ändring).

### Landning 2 — K2 klient-UI: optimistisk mark-paid via router-context-DI (`5006e7b`→`bfc6cf1`)

Klientsidan av Fas 5.5:s write-slice (server-kontraktet + staging-svit redan grönt sedan Session 18/19). Landad i atomiska commits, foundation-push + feature-push:

- **DI-arkitektur — [ADR-055](decisions/ADR-055-datakalla-atkomst-router-context-di.md)** (`5006e7b`). Första UI→data-wiringen; precedensbärande för Fas 6. Datakällan nås via **TanStack Router-context-DI** (adaptern injiceras bredvid `queryClient`/`auth`), inte direkt-importerad modul-singleton. Avvisade: modul-singleton (DI-idiom-blandning), `useDataSource`-provider (redundant), env-factory (YAGNI). README-räknare 54→55; additiva errata-noter vid STATE-STRATEGY:152 + ADR-016 (åtkomst-mekanismen var aldrig ADR-beslutad förrän nu).
- **DI-wiring** (`63a3f08`). `src/data/dataSource.ts` (namngivet hem, `new AirtableAdapter()` — enda körbara adaptern; Fas E-byte = en rad) injiceras i router-context; `useDataSource()` route-agnostisk access-hook (`useRouteContext strict:false` + invariant-guard).
- **EdgeFunctionError** (`c2d37ae`). Enabling-fix: `callEdgeFunction`/`postEdgeFunction` kastar typad `EdgeFunctionError` (status + strukturerad `requestId` ur EF-fel-kroppen) i stället för plain Error — UI kan surfa requestId. Additiv + bakåtkompatibel.
- **Feature** (`8206446`). `queryKeys`-factory (STATE-STRATEGY §3); `markRegistrationPaid` (ADR-016 fem komponenter A–F: `updateRecord('mark-registration-fee-paid', …, { Anmälningsavgift: 'Mottagen' })`, optimistisk flip + rollback-context + invalidate + aria-live success); `RegistrationsList` + `MarkPaidButton` (status som text, knapp dold när Mottagen, MessageBox `role=alert` med requestId); route `event.tsx → event/index.tsx` + `event/$eventId.tsx` (syskon-leaf). 3 e2e (`mark-paid.staging.test.ts`) via deterministisk `page.route`-interception (svars-gate bevisar flip före nätverkssvar).

**Avvikelser (medvetna, dokumenterade):** (1) a11y — fel surfas via MessageBox `role=alert` (assertiv), EJ även `alertScreenReader` (undviker dubbel annonsering); success via `alertScreenReader` (ingen visuell success-indikator). (2) e2e mockar EF-svar i stället för faktisk staging-mutation — server-write-kontraktet bevisas redan av `update-record.staging.test.ts`; klient-optimistic testas renast deterministiskt utan att mutera staging-data.

**DoD-täckning (byggplan Fas 5.5):** DoD 1 (flip→rollback) + 5 (flip utan network-wait) + 6 (5xx → rollback + MessageBox/requestId) + 7 (invalidate) + 8 (axe 0 + aria-live) via de 3 e2e; server-DoD 2/3/4 + ADR-016/DoD 11 redan klara. DoD 9/10 (aktiveringsguide + "mall för Fas 6") noterade i sessionsdoket.

Verifiering: typecheck + biome (exit 0) + build + api-pure (72) + adr-count (55==55) + frontmatter (9/9) + lifecycle + fetch-depth-invariant + public-checklists + lychee (67) + vale (0) + markdownlint lokalt gröna. Foundation-CI `27706634831` fälldes på markdownlint MD028 (gate jag missade köra lokalt → fix `bfc6cf1`); feature-CI **`27706856446`: alla jobb success** inkl. Test+Build (kör `test:e2e:staging` — de 3 nya e2e gröna).

### Landning 3 — legibility-fix: namnkrock `useDataSource` i ADR-055

ADR-055:s avvisade alternativ 2 var formulerat med namnet "useDataSource" — kunde läsas som att det avvisade alternativet byggdes. Förtydligande (ej beslutsändring): alternativ 2 beskrivs nu per mekanism (dedikerad React Context-provider, skild från router-context) + kontrast-mening att den levererade `useDataSource()`-hooken (`src/data/useDataSource.ts`) läser router-context. Kort klargörande kommentar i hook-filen.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-17-session-22.md`](../tasks/sessions/archive/2026-06/2026-06-17-session-22.md). Sessionen ej formellt avslutad; `lifecycle: active` tills `/session-end`. Nästa: `/session-end` (lessons-skörd L137+ deferrad dit).

---

## Session 23 — Fas 6a Persons-domän: cursor-port → Anteckningar-write (Fas 6a KLAR) (2026-06-18 → 2026-06-19)

**Mål:** Fas 6a (strangler-fig första domän, byggplan.md §4 rad 81). Persons-lista + detaljvy + cursor-paginering + write `Personer.Anteckningar` — sista sub-fas-landningen. Pausad efter Landning 3, återupptagen 2026-06-19 (resume #1 + #2).

**Commit-range:** `b29ace9` (Landning 1) → `e1034ee` (L6c-kadens markdown-fix). Strangler-fig-vertikal i sex landningar; nummer 23 behållet över paus.

### Landning 1–5b + gräns-coercion (pre-/tidig-resume, CI-gröna)

- **L1** lättläst-driftfix (`b29ace9`); **L2** Personer-lista (`de210ba`); **L3** cursor-port end-to-end + **[ADR-056](decisions/ADR-056-list-paginerings-port-cursor-dubbel-kalla.md)** (Accepted) (`83f55f9`); **L4** staging-deploy cursor-EF + seed/conformance-harness; **L5a** aggregerande `get-person` + full-historik-detaljvy (a11y 11/10); **L5b** get-person staging-deploy + skarp conformance (noll-trunkering bevisad över chunk-gräns). Detaljer i sessionsdok Del 1–6.
- **Gräns-coercion-klassen ("Ort")** (`bc155cb`+`f2aebde`, CI `27812371727`): kanonisk `_shared/coerce` (scalarString/stringArray/selectName, namngiven efter aritet); `ort`+`allaHamtningar` → `string[]` (data-förlust-regression stängd, skarp-bevisad mot multi-värd fixtur). Lessons L140–L143. Sessionsdok Del 7.

### Landning 6 — write `Personer.Anteckningar` (Fas 6a SISTA): server → staging-bevis → klient

Bruten i tre commit-säkra steg över deploy-grinden (L145):

- **L6a server-op** (`15efaec`, CI `27844743043`). `update-person-note` → `{ tableId: 'Personer', allowedFields: ['Anteckningar'] }` i `field-allowlists.ts` (registret = enda registrerings-ytan; ingen EF-kodändring). Vilande tills redeploy.
- **GRIND — staging-redeploy.** `update-record` **v4→v5** ACTIVE (staging `pqtshyierkdgwdnxuirz`, bare CLI). PROD (`lvjsfnphlauldxqlncpl`) orört. Säkerhetsfynd: CLI lokalt länkat till PROD-ref → bare deploy utan `--project-ref` hade träffat prod; explicit staging-ref varje gång (**T12** registrerad).
- **L6b staging deny/allow** (`c80dbb8`; T12-tråd `8e3a31f`, CI `27845520247`). deny (Förnamn utanför allowlist → 400 `/not allowed for operation/`) + allow (Anteckningar → 200, mutera→läs→restore mot ZZ-History Person 01) — **körda mot staging-v5 i CI = S5-beviset** (väg B: lokalt staging-bevis omöjligt utan prod-risk pga `.env.test`→prod, L148/T12). `HISTORY_PERSON_ID` single-source (`tests/api/fixtures.ts`). API staging 49→**51 passed**.
- **L6c klient edit-in-place** (`4f89cbb` återland, CI `27846933085`). `useUpdatePersonNote` (optimistic, ADR-016-mall, enskilt-record-cache) + `PersonNoteEditor` (read-by-default, Spara=knapp/Esc=avbryt, rollback→åter till edit, fokus-retur WCAG, MessageBox `role=alert` via aria-describedby + aria-invalid). 4 e2e (optimistic-flip, rollback, avbryt, axe read+edit). E2E 30→**34 passed**.

**Avvikelse (egen oversight denna session, ej design):** L6c:s glesa axe-mock avslöjade en pre-existerande L5a-bugg — empty-state-`<p>` som direkt barn i `<dl>` (Kontakt + Leads), axe `only-dlitems`. Hanterat per direktiv: revert ren (`b9b473c`, K27) → grön main → **fix** (`6ceda61`: `<p>` ut ur `<dl>`, villkorad dl-rendering, + gles-mock axe-test, noll beteendeändring) → **återland L6c** (`4f89cbb`, cherry-pick ren auto-merge). Grep-verifierat: `<dl>` finns ENBART i PersonDetail.

**Lessons:** L144 (rika mocks döljer empty-state-buggar), L145 (deploy-grind → källa-först commit-ordning), L146 (beteendemässig test-isolation slår schema-isolation), L147 (CI-grindar > DoD-kommandolistan; kör docs-grindar lokalt), L148 (direktivs miljö-presumtion = latent defekt fångad av STOPPA; [[L19]]).

**T12 registrerad:** `.env.test`→prod (latent staging-mutations-risk), `paused`. Durabel fix: repo-nivå fail-fast-grind (mål-URL ≠ staging-ref → vägra mutations-svit).

**Verifiering (slutlig, CI `e1034ee`):** typecheck + biome (4 pre-existerande CSS-varningar) + build + API pure 80 + API staging 51 + E2E 34 + A11y 12 + docs-grindar (frontmatter 9/9, lifecycle, vale 0, markdownlint 0). Alla jobb success. **Fas 6a KLAR** — Fas 6b (Events) nästa session.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-18-session-23.md`](../tasks/sessions/archive/2026-06/2026-06-18-session-23.md) (Del 1–8). Fas-avslut EJ tillämpligt (Fas 6 fortsätter 6b–6e; ingen fas stängd, sessionsdok ej arkiverat).

---

## Session 24 — Institutionalisera kvalitetsstandard + arkitektur-fitness-audit (hub-nivå) (2026-06-20)

Process-/governance-session (spänner spoke + hub-repot). Ingen produktkod rörd; ingen fas stängd (Fas 6 fortsätter 6b). Fyra inkrement landade, alla CI/disk-verifierade.

### Inc 1 — Kvalitetshållning → alltid-på-lagret (hub `ac72925`)

base-PI ny sektion `KVALITETSHÅLLNING — ALLTID-PÅ` (11/10-golv, dubbelriktad över-engineering-vakt, lager-oberoende-princip) + hub-CLAUDE.md `## Instruktioner` +2 punkter (över-engineering-vakt + bygg i oberoende lager; rad 84/117 orörda). `~/.claude/CLAUDE.md` = symlink → repo-filen. Universell hållning, ett ställe per yta (ADR-034). Fynd: hub-repot saknar CI/docs-grindar (**T13**).

### Inc 2 — Fitness-kontrakt + drift-fixar (spoke `4811410` + `2f69013` + `578db2b`)

**ADR-057** lager-oberoende-fitness-invariant (fyra checkbara klausuler; grundad i fitness functions Ford/Parsons/Kua; räkning 56→57). Drift-fixar: CONTRIBUTING 11/11/11-axel data/design/code → Tillgänglighet/Teknik/Återanvändbarhet; SECURITY-SPEC **§6.10** per-EF-checklista (EF1–EF6 ur M1–M8); KVALITETSDEFINITIONER SKELETT-not → §1–2 ifyllda. **T13** registrerad. (Forward-fix `e2b4a3b`: MD004 radstart-`+` i todo, amendad före push.)

### Inc 3a — Audit-mekanism + Code-side verifierare (spoke `ae5c627` + hub `e17438b`)

**ADR-058** arkitektur-fitness-audit (fem områden, fast rapport-kontrakt, governance-nisch ADR-039↔ADR-041; räkning 57→58). Code-side `arch-audit`-skill i pluginet (SKILL.md 116 rader + buntat `arch-fitness-check.sh`); **plugin 4→5 skills, v1.3.0→1.4.0** (plugin.json + marketplace.json atomiskt; re-install disk-verifierad). Fitness-skript kört mot live-spoke: DI-switch OK, 0 kringgångar, paritet 15==15==15, EF-ribba i alla 5 data-EF:er. Två falska positiv kalibrerade bort (L150).

### Inc 3b — Audit-skill-parets Chat-halva (hub `d482493`)

Chat-side `arch-audit`-skill i `claude-app-skills/` (67 rader; par till Code-halvan). Befintligt handoff-kontrakt räckte (inget nytt byggt). (Forward-fix `86e16be`: MD004 radstart-`+` i Del 5 — main kort röd på `21601a8`, L149.)

**Lessons:** L149 (docs-grind = separat gate, ej batchat — annars slinker lint-fel förbi; [[L147]]/[[L137]]), L150 (fitness-check måste koda faktiska distinktioner, ej substräng-matcha; [[L136]]). Båda [UNIVERSAL], hub-lyft pending nästa K-sista.

### Inc 4 — Deferrad till Session 25

Valideringskörning av `/arch-audit` mot Fas 6a KALLT (reproducera+korrigera 14-vs-15-driften, bevisa ADR-058-kontraktet, dogfood discovery+flow). Kräver installerad+aktiv skill — egen session.

**Verifiering:** spoke per-commit docs-grindar (markdownlint 0, Vale 0, frontmatter 9/9, ADR-count 58==58), per-jobb-CI auktoritativt grön (slutlig HEAD `86e16be`); hub shellcheck-ren skript + plugin disk-verifierad v1.4.0/5 skills (hub saknar CI, T13). Inga produktkod-grindar tillämpliga (ingen kod rörd).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-20-session-24.md`](../tasks/sessions/archive/2026-06/2026-06-20-session-24.md) (Del 1–5). SESSIONSGRÄNS, ej fas-avslut: ingen phase-end-verify, ingen arkivering, ingen CHANGELOG-release (ADR-023). Nästa: **Session 25** (Inc 4 + Fas 6b).

---

## Session 25 — Inc 4 (kall arch-audit mot Fas 6a) + Fas 6b Events-domän KLAR (2026-06-20)

Inc 4 + tre 6b-landningar + kall arch-audit, allt CI-grönt. SESSIONSGRÄNS, ej fas-avslut (Fas 6 fortsätter 6c–6e). Inget nytt ADR.

### Inc 4 — kall `/arch-audit` mot Fas 6a (validering av ADR-058-mekanismen)

Kall körning av arch-audit-skillen mot Fas 6a: fem fitness-områden rena, betyg 11/10/10 på vy-ribban, dogfood-validerad — "14 metoder" i Session 23:s fritext-audit avslöjat som räknefel (disk bar 15: iface + båda adaptrar mekaniskt räknade). ADR-058-kontraktet bekräftat. Inget ADR-059 påkallat. **Inc 4 KLAR.** Lesson L151.

### Fas 6b L1 — route-struktur C1 + /event-lista

Nested routes `/event/$eventId/` (info/betalning/narvaro-leaves) + /event-lista (beläggning som text, sort-a11y, aria-live). Spec-reconciliering. **T14** registrerad (temporal-filter vs Airtable Status-fält — begreppskrock, paused).

### Fas 6b L2 — get-event-EF + info-vy + NaN-klassfix

get-event (single-get-mall, 404-kontrakt ärvt från get-person) + staging-deploy + EventDetail (berikad operations-översikt, a11y 11/10). **Coerce-klassfix (L152):** Airtable levererar formel-NaN som OBJEKT `{specialValue}` → `scalarNumber` i BÅDE get-event och get-events (latent i deployade get-events; skarp `.parse()`-conformance fångade). Commits `8fadfac`/`6d4220a`/`6b379df`.

### Fas 6b L3 — get-attendance-EF + närvaro-vy + filter-fix (väg D)

get-attendance + EventAttendance (sessions-grupperad LÄS-vy, a11y 11/10) + namn-batch ur Personer.Namn (VÄGVAL A; AttendanceSchema additivt `personNamn`). **CI-conformance fällde det ärvda länk-filtret:** `buildLinkedRecordFilter` → `FIND(recId, ARRAYJOIN({Event}))` matchar länkens primär-display, ej record-ID (verifierat prod+staging; latent även i get-registrations → **T15**). **Fix väg D:** record-ID-batch från event-hållet via Eventplanering `Närvaro (records)`-länk (speglar get-person; kringgår klass-buggen helt). Commits `0e688a4`/`e8ff852`/`c3fa0d5`/`2ee7a7d`/`c09a67f` + fix `ffbe3e0`/`5f10c9a`/`4642482`.

### Fas 6b arch-audit (kall, ADR-058) + Fas 6b KLAR

Fem områden GODKÄNDA, 0 avvikelse, 11/10/10: port-paritet 15==15==15 intakt efter fetchEvent/fetchAttendance-aktivering, EF-ribba 2/2/2/2 på tre nya/ändrade EF, T15-inhägnad + NaN-fix mekaniskt verifierade, ingen spekulation över golvet (`chunk()`-duplicering noterad som framtida DRY-trigger, ej avvikelse). **Fas 6b KLAR.**

**Lessons:** L151 (fast audit-kontrakt eliminerar fritext-drift), L152 (Airtable NaN-objekt; smoke-test ej `.parse()` döljer latent coercion-klass), L153 (länk-display≠record-ID; formel-syntax-test bevisar ej match-semantik), L154 (record-ID-batch från relationens båda håll kringgår klassen). Alla [UNIVERSAL], hub-lyft pending nästa K-sista.

**Verifiering:** CI-run `27883557439` (HEAD `4642482`) alla 5 jobb gröna — api-staging 61 passed (inkl. 4 get-attendance väg-D-conformance, S-bevis mot staging), Test+Build + Docs-link-check gröna. ADR-count 58==58 (inget nytt ADR).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-20-session-25.md`](../tasks/sessions/archive/2026-06/2026-06-20-session-25.md) (Del 1–6). SESSIONSGRÄNS, ej fas-avslut: ingen arkivering, ingen CHANGELOG-release (ADR-023). Nästa: **Session 26** (Fas 6c — Registrations + Väntelista).

---

## Session 26 — Fas 6c Registrations + Väntelista: fyra leverabler + ADR-059/060 + T24-b harness-fix (2026-06-20 → 2026-06-22)

Fas 6c byggd över flera resumes: fyra leverabler (get-registrations T15-fix → anmälda-vy → väntelista → create-registration), ADR-059 (idempotens-defer) + ADR-060 (sentinel-conformance), och en CI-harness-fix (T24-b). Allt CI-grönt per-jobb. SESSIONSGRÄNS, ej fas-avslut (6c funktionellt + dokumentärt KLART; /arch-audit + phase-end-verify är nästa session). 6c-skrivande (create) är första write-domänen efter Fas 5.5-mallen.

### Beslut före bygge — ADR-059 (idempotens-lagring → Fas E)

ADR-014:s Airtable-lagrings-mekanism falsifierad (Airtable kan ej påtvinga unik-constraint på skrivbart fält) → **ADR-059** (Accepted, `24070eb`/`9ba9ca7`): defer äkta server-side idempotens till Fas E; interim klient-skydd (mutationKey-dedup + disabled-submit) + klient-UUID-nyckel bevarad i kontraktet (loggas, lagras ej). Superseder ADR-014:s lagrings-mekanism + timing-beslut (kravet står).

### Leverabel 1 — get-registrations T15-fix (väg D)

eventId-grenen: record-ID-batch från event-hållet via `Eventplanering.Anmälningar (länkat fält)` (speglar get-attendance/get-person), ersätter den trasiga `buildLinkedRecordFilter` (T15-klassen). Skarp staging-conformance (G1-grind: spegeln måste vara populerad; NOLL trunkering över chunk-gräns vid `REGISTRATIONS_BATCH_SIZE=2`). Commit `29e55ed`.

### Leverabel 2 — anmälda-vyn + T24-b CI-harness-fix

`/event/$eventId/anmalda` LÄS-vy via get-registrations (a11y 11/10, status-text-väg A, T15 väg D). Commits `0c84497`/`2f3884e`/`46fc2ca`. **T24-b:** api-staging kollapsad till EN login per credential via setup-projekt + token-återanvändning (44 logins → 2) — eliminerar GoTrue-rate-limit-429-burst. **T24 stängd** (`c9174be`/`2f4443c`).

### Leverabel 3 — väntelista (get-waitlist global läs-EF + vy)

get-waitlist: egen `Väntelista`-tabell, aktiv-filtrerad `NOT({Flyttad till anmälan})`, GLOBAL (event-fältet är `singleLineText`-konstant, ej länk → ingen T15-exponering, ingen per-event-distinktion i datan). `/mer/vantelista` + Mer-landning. Commits `66f8770`/`b8057a8`/`5c89d10`.

### Leverabel 4 — create-registration (write-kärnan) + formulär + ADR-060

**L1 (write-EF, `49671c4`):** ny `createAirtableRecord`-POST-helper + create-registration-EF som speglar update-record:s säkerhet (POST→405, requireUser→401, allowlist-SSOT, deny→400). Skriver Källa="Manuell"/Status="Obekräftad"/Inskickad/EventKey/Event-länk; EventKey härleds via Eventplanering-lookup (VÄG B, Chat-låst; historiska `'Event-17'`-värdet borta), 409 på Normaliserad e-post (`LOWER(TRIM)`) + EventKey-STRÄNG (ej länk, T15), INVARIANT idempotency-nyckel→400+logg, Person-länk delegeras A2. Port-redesign: `CreateRegistrationInput` (write-shape) över alla tre adaptrar (ADR-057-paritet). VÄG B + Normaliserad e-post-formeln live-verifierade staging↔prod-paritet FÖRE bygge (MCP). EF-only conformance: allow→201+skriv-bevis/409/INVARIANT/deny/404/401/CORS. **L2 (formulär, `3c40c06`/`96af589`):** AddRegistrationModal (Overlay-mönstret, React Aria Form, kontrollerad validering, fokus-hantering, klient-UUID per öppning), useCreateRegistration (ADR-016-struktur, MEDVETET ej optimistic-insert — create kan 409). ADDITIV knapp i anmälda-headern. Vy-test (mockad EF): submit 201/409 inline/required-validering/fokus-retur/axe 0. **L3 (`09ee57e`):** **ADR-060** (sentinel-markerade test-records + setup-purge, EF-only, prod-delete + test-cred avvisade). **L4:** denna 6c-completion-dok-landning. Staging-deploy explicit `--project-ref pqtshyierkdgwdnxuirz` (PROD orörd).

### 6c-completion (dokumentärt)

§9 i `airtable-interaction.md` (T19): de tre `[AKTUELLT TILLSTÅND]`-markörerna (create-registration, get-waitlist, get-registrations väg D) ersatta med fil:rad-belagda STABIL MEKANIK-kontrakt. **T15 STÄNGD** (`buildLinkedRecordFilter` noll live-callers). ADR-räkning 59→60 (ADR-060).

**Landning 5 — full stamp-honest reconciliation (`airtable-interaction.md`).** L4:s §9-ensam edit bröt §5↔§9-koherensen (§5 sa ännu "get-registrations bär T15-buggen") — self-review fångade. Komplett fix (väg X): git-verifierat att 6c ändrade exakt 5 filer (3 EF + 2 `_shared`) sedan stämpel `346c386`, sedan re-belägg av varje berörd sektion mot HEAD `e499a89` — §5 (EF-katalog 9→11: get-registrations väg D + NYA get-waitlist/create-registration), §6 (T15-bug→väg D, helper dormant), §7 (write-allowlist 2→3 operationer), §8 (createAirtableRecord-export + getOperation/findDisallowedField rad-skift), §9 (tömd på 6c-poster → §5, åter "planerade"). Stämpeln nu HOLISTISKT sann. Residual: T19 Pass 2 bredare prosa-granskning (registrerad under T19, egen omgång).

**Verifiering:** alla fyra L4-landningar CI-gröna per-jobb (`49671c4`/`3c40c06`+`96af589`/`09ee57e` + denna). api-staging create-registration-conformance grön mot deployad staging; e2e create-modal 5/5 grön; markdownlint 0 + docs-link-check grön; ADR-count 60==60.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-20-session-26.md`](../tasks/sessions/archive/2026-06/2026-06-20-session-26.md). SESSIONSGRÄNS, ej fas-avslut: ingen audit, ingen arkivering, ingen CHANGELOG-release. **Nästa:** 6c /arch-audit + phase-end-verify (egen session).

### 6c arch-audit + Fas 6c KLAR (resume-finalisering 2026-06-22)

Resume i färsk chatt (`815701e`: `lifecycle` paused→active + paus-rubrik→öppen historik-form). Kall `/arch-audit` mot Fas 6c per ADR-058 (READ-ONLY, ej committad): fem fitness-områden GODKÄNDA — **i** lager-oberoende (port-paritet 15==15==15 inkl. nya `createRegistration`/`fetchWaitlist`, 0 UI-adapter-import, 0 `callEdgeFunction` utanför `src/data/`, DI-switch en rad); **ii** swappbarhet (`dataSource` direkt-importerad endast av kompositions-roten `src/router.ts`, dubbel-källa); **iii** EF-ribba 3/3 (get-registrations väg-D / get-waitlist / create-registration bär requireUser+corsHeadersFor+generateRequestId+mapErrorToResponse) + create-registration server-side write-allowlist (`field-allowlists.ts:57`, `findDisallowedField`→deny 400) + deny/allow-conformance CI-grön (T24-b); **iv** golv hållet i båda riktningar (ingen spekulation över golvet — Supabase-stubbar = port-paritets-krav, ej "ifall"; 6b chunk()-DRY EJ återupprepad); **v** axel-betyg 11/10/10 × 3 ytor (anmälda-vyn, väntelista-vyn, Lägg-till-modalen), inga oförtjänta 11:or. **AVVIKELSE TOTALT: ingen → Fas 6c KLAR** (arkitektoniskt förstklassigt klar mot kontraktet).

SESSIONSGRÄNS, ej fas-avslut: ingen phase-end-verify, ingen arkivering, ingen CHANGELOG-release; lessons-HUB-lyft PENDING (vid FULLT Fas 6 fas-avslut efter 6d). chunk()-DRY (rule-of-three, 3 call-sites) registrerad som tråd **T25** (`paused`). Lessons L169–L175. Trail: sessionsdok-26 (Del 7). **Nästa:** NY session → Fas 6d (Hem-aggregering, egen arch-audit).

---

## Session 27 — T16 data-model.md reconciliation (a) + dok-synk-rutin (b); T16 STÄNGT (2026-06-21)

Föregår den pausade Session 26 (6c-bygget, ej återupptaget). Ren dok-/process-session: ingen kod, inget nytt ADR, SESSIONSGRÄNS ej fas-avslut → ingen arkivering, ingen CHANGELOG-release (ADR-023). (Session 26:s egen BUILD-LOG-entry är pending dess resume/stängning.)

**Planerat vs faktiskt:** planerat = T16 (a reconciliation + b avsluts-rutin). Faktiskt = T16 helt stängt PLUS fem kringliggande landningar (PI-regel i hub, dok-födelse, tre tråd-registreringar). Ingen avvikelse nedåt; scope växte med fångade cross-repo-rester (registrerade, ej svällda in i sessionen).

**Landningar (kronologisk, commit-hashar):**

- **PI-interaktionsregel i hub** (`0212282`, hub-repot `marcus-system`) — "inga klick-formulär" som alltid-på meta-disciplin i `project-instructions-base.md`. Hub saknar frontmatter-hook → `updated:` manuellt. Källa-vs-yta: kräver omklistring i varje spokes claude.ai-PI-ruta.
- **Session 27-dok fött** (`03e269b`) — create-session-doc-grenen; sent fött (L156).
- **T19 + T20 registrerade** (`d652bdf`) — T19 (app↔Airtable-interaktions-dok) + T20 (levande styrdok utanför hook-scope).
- **T16 Pass 1 reconciliation** — LÄS-pass, 1 MCP-anrop. **Hink 1 (faktafel) tom:** doket ljög inte om schemat; det "kända" Event(ID)-felet bor i research-doket `02-live-state.md` §3.4, ej i data-model.md (#23 korrekt, MCP-bekräftad). Problem: tids-stale + EF-sektion fel-repo (psionautics) + luckor. Struktur motsade ej frusna-besked → ingen STOPPA.
- **T16 Pass 2** — Commit A (`41345e9`, kirurgiska fixar: stämpel, deadline-omramning ×3, Lucka 7 STÄNGD inline, Lucka 6-refs, Person-lookup-rad, Totala deltaganden-not, Närvaro (nyckel)-konsument i #23, död synk-pekare path-fix) + Commit B (`40431c4`, EF-sektion −200 rader psionautics-EF → T19-pekare, avduplicering).
- **T21 registrerad** (`4cc9fb9`) — cross-repo-rest: psionautics-synk-drift (kopian bär ännu stale EF-sektion) + T19-pekarens repo-agnosticitet. **Känd cross-repo-drift tills Marcus psionautics-synk-moment.**
- **T16 (b) avsluts-rutin** (`0dd1aa1`) — villkorad data-model-uppdaterings-rad i CONTRIBUTING per-session-DoD, parallell med constraints-raden. **T16 STÄNGT** (a+b).

**Lessons:** L155 (paused session ⇒ resume ej start), L156 (create-session-doc först), L157 (verbatim skyddar innehåll ej markup), L158 (backtick:a paths mot Vale.Terms), L159 (anta aldrig fil-mekanismer — förstärker L139), L160 (senior = dom ej meny), L161 (web-research kan vända en rekommendation). L155–L160 `[UNIVERSAL]`, hub-lyft pending.

**Verifiering:** alla sju landningars CI gröna (utom hub-PI som saknar CI) — sista spoke-run per commit: `41345e9`/`40431c4`/`4cc9fb9`/`0dd1aa1` alla Docs-link-check körd+grön, Test+Build skipped by-design (docs-only). ADR-count oförändrat (inget nytt ADR).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-21-session-27.md`](../tasks/sessions/archive/2026-06/2026-06-21-session-27.md) (Del 1–3). Nästa-session-ordning (Marcus-beslutad): **T19 (FÖRE 6c) → T17 → /session-resume Session 26 6c-bygget.**

---

## Session 28 — T19 app↔Airtable-interaktions-dok LEVERERAD (författning → granskning → rättelse) (2026-06-21)

Föregår den pausade Session 26 (6c-bygget, ej återupptaget). Ren dok-/process-session: ingen produktkod (en test-fixtur-touch), inget nytt ADR, SESSIONSGRÄNS ej fas-avslut → ingen arkivering, ingen CHANGELOG-release (ADR-023).

**Planerat vs faktiskt:** planerat = T19 (författa den saknade fjärde reference-ytan, app↔Airtable-interaktions-doket). Faktiskt = doket levererat OCH wirat (governing + DoD-rad) OCH extern-granskat (Pass 2) OCH rättat — plus två satellit-touchar (T21-vidgning, data-model:221-fix). Ingen avvikelse nedåt; en Pass-2-rättelse fångade fyra fynd som self-review missade (L163).

**Landningar (kronologisk, commit-hashar):**

- **Pass 0 + dok-födelse** (`346c386`) — komplett interaktions-inventering (9 EF + `_shared`); Session 28-dok fött via create-session-doc-grenen.
- **Landning A — författning** (`f2a7118`) — [`docs/reference/airtable-interaction.md`](../docs/reference/airtable-interaction.md), 11 sektioner, fil:rad-belagt mot `346c386`, färskhets-kontrakt (STABIL MEKANIK vs `[AKTUELLT TILLSTÅND]`).
- **Landning B — wiring** (`e3e50dd` + fix `cd46bee`) — governing-registrering i `.frontmatter-policy.conf` (10→11 docs), data-model EF-pekare "pending" → live, T19-tråd `paused`→`active`; B fällde först på en test-fixtur-koppling (T1/T12 hårdkodade 10 docs + saknad fixtur-rad) → `cd46bee` (14/14 PASS). **Grundorsak: config↔test-fixtur-lockstep.**
- **Landning C — T21-vidgning** (`84561ad`) — T21 utökad till båda synkade reference-doken + färsk C1-drift-siffra (hur-systemet-funkar.md-kopia ~19 dagar/24 rader stale; master = miranon; två path-drifter i synk-pekarna, L159-klass).
- **Pass 2 — kall extern granskning** — alla ~44 fil:rad-belägg rad-exakta; 4 fynd: (1+2) §9 get-waitlist motsade schema-auktoriteten (`Väntelista.Event` länkfält-påstående) + stängde en öppen design-fråga; (3) get-person över-attribuerat T15-citat; (4) §6 "deployade sviten" blandade källkod/tillstånd.
- **Rättelse-landning B** (`d866347`) — live-MCP bekräftade `Väntelista.Event` = `singleLineText`-konstant "Psionautics" (ej länkfält → ingen T15; data-model:221 korrekt, Session 26:96-97 sido-watch falsifierad); §9 öppen design-fråga återställd; get-person/§6-rättelser. **Rättelse-landning C** (`ab75169`) — CONTRIBUTING DoD-rad för T19-doket (paritet med constraints/data-model-raderna).
- **Sista dok-touch** (`d645745`) — `data-model:221` brand-värde-fix ("Medveten Kontakt" → live-verifierat "Psionautics", event/brand-förväxling klargjord) + T19 §9-berikning (väntelista de facto global) + T21-not brand/event-kontext.
- **Lessons-skörd** (`5cbc3d7`) — L162–L164. **Todo** (`d019b1e`) — Session 28-sektion + stämpel.

**Lessons:** L162 (overifierad sido-watch får ej hårdna till kontrakt utan korsläsning mot reconcilerad auktoritet + live), L163 (kod-/schema-härledda dok kräver externt VERIFIERA-pass, ej self-review), L164 (reconciliation = daterad ögonblicksbild; live slår daterad reconciliation). Alla tre `[UNIVERSAL]`, hub-lyft pending.

**Verifiering:** alla landningars CI gröna per-jobb (Docs link check körd+grön på dok-commits; Test+Build körd+grön på `cd46bee` (test-fixtur), skipped by-design på rena docs-commits). ADR-count oförändrat (inget nytt ADR). `Väntelista.Event`-typ live-verifierad MCP-pull 2026-06-21 mot prod `app8uGPrVCVOm6LfD`.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-21-session-28.md`](../tasks/sessions/archive/2026-06/2026-06-21-session-28.md) (Del 1–3). T19-tråd kvar `active` (§9 fylls av 6c). Nästa-session-ordning (Marcus-beslutad): **T17 → /session-resume Session 26 6c-bygget.**

---

## Session 29 — T17 system-dok `systemet.md` LEVERERAD (kartläggning → författning → granskning → wiring) (2026-06-21)

Föregår den pausade Session 26 (6c-bygget, ej återupptaget). Ren dok-/process-session: ingen produktkod (en test-fixtur-touch), inget nytt ADR, SESSIONSGRÄNS ej fas-avslut → ingen arkivering, ingen CHANGELOG-release (ADR-023).

**Planerat vs faktiskt:** planerat = T17 (författa ett världsklass-dok över det körande Chat/Code/Marcus-samarbets-systemet — meta-systemet appen byggs *med*). Faktiskt = doket levererat OCH governing-wirat (12/12) OCH DoD-bundet (mekanism-triggad) OCH extern-granskat (kall Pass 2) OCH rättat i två rundor OCH upptäckbart i båda orienterings-ytor. Ingen avvikelse nedåt; granskningen fångade 7 fynd (F1–F7) som self-review missade — inkl. F5: doket märkte SJÄLVT ett tillstånd (fångst-raterna) som mekanik, i färskhets-dokumentet vars hela tes är den distinktionen (L167).

**Landningar (kronologisk, commit-hashar):**

- **Dok-födelse + tråd-flip** (`39abd35`) — Session 29-dok fött via create-session-doc-grenen; T17 `paused`→`active`.
- **Kartläggning Pass 0 / 1a / 1b** (read-only, ej committad → RAPPORTERAD till Chat) — Pass 0 navigerings-karta (båda träd, plugin, skills, governing/distribution); Pass 1a konstitutions-/identitets-kärnan (de fyra hub-rot-doken + hub-CLAUDE.md + hub↔spoke-instantiering); Pass 1b mekanik-kroppen (4 in-drift-templates + 5 disciplin-skills + governing/distributions-detalj). Tre Chat-premisser falsifierade mot disk (L168).
- **Pass 2 — författning** (`1462a12`) — [`docs/reference/systemet.md`](reference/systemet.md), 10 sektioner + öppnings-ruta, färskhets-kontrakt (STABIL MEKANIK vs `[AKTUELLT TILLSTÅND]`), fil:rad-evidens inline (hub-refs som inline kod — L165: relativa länkar utanför CI-checkout hade brutit lychee). T22 (hub-reconciliation) registrerad.
- **Rättelse #1** (`3d8292a`) — kall granskning (F1–F7): §0 ordlista (Lager 3/do-confirm/BUILD-LOG/governing/K-sista), fångst-rater omklassade [STABIL MEKANIK]→[AKTUELLT TILLSTÅND] (F5), skill-medlemskap likaså, ADR-041/058 länkade; + §4.5 arbetscykel-vinjett; + governing-wiring (`.frontmatter-policy.conf` 11→12 + test-fixtur-bump, 14/14 PASS — **config↔test-fixtur-lockstep igen, jfr Session 28 cd46bee, L166**) + per-session-DoD-rad (CONTRIBUTING, mekanism-triggad).
- **Rättelse #2** (`afac99b`) — två precisions-fixar: färskhets-kontraktets exempel siffer-löst (fick ej självt drifta); §6 kapabilitets-skill-ägare disk-belagt korrekt ("Claude Code-skills" i `~/.claude/skills/`, ej "Chat/Code").
- **Pekar-wiring** (`2f0ae23`) — on-demand-pekare till systemet.md i spoke-CLAUDE.md (`## Instruktioner`, inline-kod-form) + PI-delta (ny H2). Hook auto-bumpade CLAUDE.md `updated:`. Chat-ytan kräver Marcus PI-omklistring (distributions-asymmetri, §9).

**Lessons:** L165 (hub-referenser som inline kod — relativa länkar utanför CI-checkout bryter lychee), L166 (governing-tillägg kräver samtidig test-fixtur-bump — config↔fixtur-koppling, två sessioner i rad → tråd T23), L167 (disciplin-byggaren är ej immun mot att bryta den; extern granskning krävs även då — farliga färskhets-riktningen), L168 (återkommande premiss-falsifiering = strukturell fångst-arkitektur i drift, ej slarv). Alla fyra `[UNIVERSAL]`, hub-lyft pending.

**Verifiering:** alla landningars CI gröna per-jobb (Docs link check körd+grön; Test+Build körd+grön på `3d8292a` (.conf+scripts), skipped by-design på rena docs-commits). ADR-count oförändrat (inget nytt ADR). systemet.md governing (12/12), real check-frontmatter "alla 12 styrande docs passerar".

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-21-session-29.md`](../tasks/sessions/archive/2026-06/2026-06-21-session-29.md). Trådar: T17 (denna leverans), T22 (hub-reconciliation), T23 (mekanisera fixtur-koppling). Nästa-session-ordning (Marcus-beslutad): **/session-resume Session 26 → 6c-bygget** (T17 var FÖRE 6c — nu klar).

---

## Session 30 — Fas 6d Hem-aggregering: L1 statisk vy + L2 polling/refresh + arch-audit (2026-06-23)

Återupptar Fas 6-sekvensen efter de pausade dok-sessionerna (27–29). Fas 6d byggd i två landningar + audit; **inga nya Edge Functions** (konsumerar 6a/6b/6c:s read-EF). SESSIONSGRÄNS, ej fas-avslut: Fas 6 hålls öppen mot 6e → ingen arkivering, ingen CHANGELOG-release, ingen byggplan-fas-status-flip, ingen hub-lyft (ADR-023).

**Landningar (commit-hashar + CI per-jobb):**

- **L1 — /hem-aggregeringsvy (statisk)** (`fbffa53`, CI-run `28043340092` grön per jobb) — `queryKeys.dashboard`-gren + Hem-container + Greeting + NyaAnmalningar/NastaEvent/Obetalda-cards + CTA + delat `DashboardCard`-skal + `useDashboardData`-hook. Data via router-context-DI (ADR-055) mot befintliga read-EF (get-registrations event-lösa gren + get-events). 11/10/10, axe 0, 5 Playwright-tester. **Avvikelse:** första push (`4a2d1e6`) blev CI-röd — skal-/auth-sviten pinnade /hem som inert; revertad (`2be52f1`, main grön) + STOPPA-OCH-FRÅGA på arkitektur-kritiskt Test 5 → Marcus-beslut **A** → åter-applicering med två buggfixar (`<header>`→`<div>`, h1-autofokus bort) + Test 5 flyttad till oinloggad väg + klass-korsläsning av alla /hem-tester.
- **L2 — polling/refresh + ADR-017-erratum** (`788322c`, CI-run `28045067055` grön per jobb) — `DASHBOARD_POLLING` (refetchInterval 60s + refetchIntervalInBackground false + per-query staleTime 30_000 + gcTime 300_000) + `<RefreshButton>` → invalidateQueries(dashboard.all) (a11y-knapp, ej touch-drag) + 2 Playwright (RefreshButton-invalidate + refetchInterval via falsk klocka). **ADR-017-erratum** (additivt, Accepted orört): §3-mekanik riven (v5 focusManager + global refetchOnWindowFocus + staleTime; intention bevarad), §2→RefreshButton, §4 gcTime-typo rättad; §1/§5 orörda; v5-doc-citat (context7-grundat). Besluten B/C/D burna.
- **Arch-audit (ADR-058)** (`028a014`, CI grön) — fem fitness-områden mot disk: i lager-oberoende (0 kringgång i 6d-kod, data endast via useDataSource), ii swappbarhet (port-paritet 15==15==15 oförändrad), iii EF-ribba (0 ny EF → ej tillämplig på ny yta), iv över-engineering-vakt (golv-JA: a11y 11/guard intakt; spekulation-NEJ: ingen egen visibilitychange-handler/död kod), v ärliga betyg 11/10/10. **AVVIKELSE: ingen.** 6d förstklassigt klar på audit-axeln.

**Lessons:** L176 `[UNIVERSAL]` — test som pinnar bestående invariant via tillfälligt sido-tillstånd är en tidsbomb (Test 5-flytten). Hub-lyft pending (vid FULLT Fas 6 fas-avslut efter 6e).

**Trådar:** **T26** registrerad (`paused`) — e2e-svit-flakiness under parallell last (focus/loading/axe-timing) + `retries: 0` → latent CI-risk; lösningsrymd a/b/c i tråd-noten. T25 (chunk-DRY) kvar `paused`.

**Verifiering:** alla landningars CI gröna per-jobb (Docs link check körd+grön på docs-/erratum-commits; Test+Build körd+grön på kod-landningar). ADR-count oförändrat (inget nytt ADR — ADR-017-erratum är additivt). Inga EF/deploy/write.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-23-session-30.md`](../tasks/sessions/archive/2026-06/2026-06-23-session-30.md) (Del 1 scope + Del 2 L1 + Del 3 L2 + Del 4 audit). Nästa: NY session → Fas 6e (Mer, villkorlig) ELLER FULLT Fas 6 fas-avslut. `lifecycle: closed`.

---

## Session 31 — T26 e2e-flakiness STÄNGT (2 landningar) + miljö-kluster-dok T30 (2026-06-23)

Egen session (ADR-051): tog upp + stängde tråd T26 (e2e-svit-flakiness under parallell worker-last + `retries: 0` → latent CI-röd-risk). **Inga nya Edge Functions, ingen deploy, ingen write, ingen app-kod** — test- + config- + dok-ändringar. SESSIONSGRÄNS, ej fas-avslut: Fas 6 öppen mot 6e → ingen arkivering, ingen CHANGELOG-release, ingen byggplan-flip, ingen hub-lyft (ADR-023).

**Planerat vs faktiskt:** planerat = stäng T26 via 2 landningar (A config, B test-härdning). Faktiskt = båda landade + scope växte KONTROLLERAT (registrerat, ej svällt) med 3 triage-deferrade trådar (T27/T28/T29) + ett forensik-pass + ett kluster-tråd-kort (T30). Avvikelse: repro-path blockerad av en prod-pekare (`.env.local`) → forensiken som följde avtäckte miljö-isolations-rotorsaken.

**Landningar (commit-hashar + CI per-jobb):**

- **T26 Landning A — config-grind** (`910ebb9`, CI-run `28048711187` grön) — `playwright.config.ts`: top-level `retries: process.env.CI ? 2 : 0` (flaky ≠ failed; stänger latent CI-röd-risk) + chromium-authenticated `trace` `retain-on-failure`→`on-first-retry` (Landning B-diagnostik) + stale doc-projekt-räkning 7→8 (api-setup saknades). CI-base-URL-observation (E2E mot CI-lokal Vite, ej deployad frontend) → tråd **T27** (`paused`). E2E-jobbet grönt: 78 passed.
- **T26 Landning B — preventiv test-härdning** (`69a89f4`, CI-run `28050682542` grön) — repro mot staging blockerad: `.env.local`→PROD-ref → STOPPA per prod-guard; staging-override-repro failade på `auth.setup` (lokala `TEST_USER`-creds = de facto prod-creds). Måltesterna `page.route`-mockade → racerna **miljö-oberoende** → statisk-analys-härdning: (a) `event-anmalda` loading-state → opt-in `manualRelease` (deterministiskt fönster, bakåtkompatibel helper); (b) `person-detail` → stabil `aria-live`-data-gate FÖRE `toBeFocused`; (c) `events-list` → `toHaveCount(3)` listitem FÖRE axe. **Komponentkod orörd. PREVENTIV, ej trace-belagd.** E2E 78 passed, **noll flaky** (härdningen höll). `error-context`-aria-snapshot-klartext-cred → tråd **T29** (`paused`).
- **T30 kluster-tråd-kort** (`5e5914b`, CI-run `28051877515` grön) — forensik (disk-belagd: `conversion-plan-2026-04-14.md:1157-1159` instruerade `.env.local`→prod från dag ett; lokal e2e-auth `fca8bfd` 2026-05-12 föddes före staging-bygget `45c02a9` 2026-06-15; ADR-050 noll lokal-yt-förekomster → blind fläck; `.env.test` halv-migrerad session-26 ~rad 320) visade att T12/T28/T29 = tre symptom på EN rotorsak (miljö-isolation stannade vid CI-/deploy-gränsen, nådde aldrig lokal disk). `tasks/threads/T30-lokal-miljo-isolation.md`: rotorsak + tre symptom + branschledar-lösningsrymd (`Vite` mode-separation / fail-fast uppstarts-validering / cred-hygien). **Diagnostiserar, beslutar ej** — lösnings-ADR = nästa session.

**Lessons:** L177 `[UNIVERSAL]` (preventiv härdning utan repro, miljö-oberoende mock), L178 `[UNIVERSAL]` (citat-verifiering mot disk före auktoritativt dok), L179 (sent fött sessionsdok fångat av do-confirm POST 0). Hub-lyft pending (vid FULLT Fas 6 fas-avslut efter 6e).

**Trådar:** T26 `paused`→`closed` (stängd via A+B). T27 (CI-lokal Vite), T28 (`.env.local` prod-pekare), T29 (`error-context` klartext-cred) registrerade `paused`. **T30** registrerad `paused` — kluster-parent för T12/T28/T29 (kluster-not i registret).

**Verifiering:** alla landningars CI gröna per-jobb (E2E 78 passed × 3 körningar, noll flaky efter härdning; docs-grindar markdownlint/Vale/lifecycle gröna på dok-commits). ADR-count oförändrat (inget nytt ADR). Inga EF/deploy/write/app-kod.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-23-session-31.md`](../tasks/sessions/archive/2026-06/2026-06-23-session-31.md) (sent fött, POST 0-åtgärd; Del 1 scope + Del 2 landningar + Del 3 lessons + Del 4 tråd-bokföring + Del 5 nästa). Nästa: NY session → miljö-isolations-lösnings-session (T30 → ADR) ELLER Fas 6e / FULLT Fas 6 fas-avslut. `lifecycle: closed`.

---

## Session 32 — T30-klustret LÖST: ADR-061 lokal miljö-isolation (4 pelar-landningar + cred-synk + tråd-flipp) (2026-06-23)

Egen session (ADR-051): tog upp + stängde T30-klustret (tre symptom T12/T28/T29, en rotorsak — miljö-isolation stannade vid CI-/deploy-gränsen, nådde aldrig dev-disken). **SESSIONSGRÄNS, ej fas-avslut**: Fas 6 öppen → ingen arkivering, ingen CHANGELOG-release, ingen byggplan-flip, ingen hub-lyft.

**Planerat vs faktiskt:** planerat = diagnos→ADR+implementation. Faktiskt = ADR-061 + FYRA pelar-landningar (Pelare 2.5 tillkom mitt i som keystone-komplettering efter att verifieringen avtäckte build-ytans blinda fläck) + cred-synk (forensik-detour, UTFALL 2) + tråd-flipp.

**Landningar (commit-hashar + CI per-jobb gröna):**

- **ADR-061 beslut** (`632389d`) — lokal miljö-isolation, tre pelare, Väg B (dev→staging interim; lokal-stack deferrad → T31). README-index + räkne-rad-bump (L180) + T31/T32 registrerade.
- **Pelare 1** (`dde6d41`) — `Vite` mode-separation: committade `.env.development`/`.staging`/`.production` (publika `VITE_`-vars), dev→staging, `.env.local`-pekaren ut. Steg 0-fynd: ingen frontend-deploy finns (CI Build = smoke-test utan env-injektion).
- **Pelare 2** (`8315d5a`) — fail-fast mode-medveten grind (keystone): ren modul `src/lib/env-coherence.ts` + klient-runtime (`src/env.ts`) + api-test-yta (`tests/api/helpers.ts`) + hermetiskt bevis-test (api-pure).
- **Pelare 2.5** (`eb7ae4c`) — build-tids-vägran via `vite.config.ts` (tredje grind-ytan; `loadEnv` fångar både fil-fel OCH process.env-injektion) + ADR-061-erratum. Avtäckt av L181 (runtime-grind validerar ej build-artefakt).
- **Pelare 3** (`445b46f`) — T29 `error-context`-klartext-läcka stängd (`globalTeardown`-purge, reproducerad→bevisad noll träff); T12 → **UTFALL 2** (auth mot staging 400 → cred-split bekräftad).
- **Cred-synk** (ingen commit) — forensik (L183): `@miranon-admin.local` = prod-era-testanvändare (2026-05-04), kvarlämnade genom S19 (secrets-only) + S26 (URL-only). Marcus satte nya lösenord på `staging-user@`/`staging-admin@miranon.test` (dashboard) + synkade `.env.test` + GitHub-secrets. Code-verifiering: auth mot staging grön (user+admin), noll prod-anrop. Least-privilege hölls (L184: nekade service_role på laptop → T34).
- **Tråd-flipp** (`7012d89`) — T12/T28/T29/T30 → `closed`; T30-kortet pekar på ADR-061 (Lösning-sektion med pelar-SHA); T33/T34 registrerade `paused`.

**Lessons:** L180 `[UNIVERSAL]` (enumerera alla filer en grind läser), L181 `[UNIVERSAL]` (runtime-grind ≠ build-validering), L182 `[UNIVERSAL]` (cred↔miljö bevisas av auth-körning, ej fil-läsning), L183 `[UNIVERSAL]` (avvikelse rotorsaks-spåras före fix-förslag), L184 `[UNIVERSAL]` (least-privilege även "för att få jobbet gjort"). **Hub-lyft pending** (vid FULLT Fas 6 fas-avslut).

**Trådar:** T12 / T28 / T29 / T30 `paused`→`closed` (löst av ADR-061). T31/T32 registrerade `paused` (ADR-061-landningen). T33 (prod-era-cred-rensning) + T34 (CLI länkad mot prod) registrerade `paused` (flippen).

**Verifiering:** alla landningars CI gröna per-jobb. Keystone-grinden bevisad av CI-kört test (api-pure, failar om grinden tas bort). Build-tids-vägran demonstrerad (`vite build --mode development` + prod-ref → kastar). Auth mot staging grön efter cred-synk (user+admin, noll 400). `check-lifecycle.sh` grön (T30 kort↔index `closed`-match). Inga EF/deploy/prod-touch.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-23-session-32.md`](../tasks/sessions/archive/2026-06/2026-06-23-session-32.md) (Del 1 scope + Del 2 landningar + Del 3 lessons L180–L184 + Del 4 tråd-bokföring + Del 5 nästa). Nästa: NY session (Fas 6 öppen). `lifecycle: closed`.

---

## Session 35 — Fas 6g L1+L2 (segment-motor + byggar-yta) LEVERERAD (2026-06-25)

Byggde Fas 6g:s två första lager — segment-beräknings-motorn (L1) + segment-byggar-ytan (L2) — efter en forensisk pre-pass som låste kontraktet mot LIVE-data. **SESSIONSGRÄNS, ej fas-avslut**: L3 (spara) + L4 (frys/export) + 6h (mail) återstår → ingen arkivering, ingen CHANGELOG-release, ingen phase-end-verify, ingen hub-lyft.

**Planerat vs faktiskt:** planerat = Fas 6g L1+L2. Faktiskt = pre-pass + ADR-064 + defekt-register + L1 (motor+EF+deploy+integration) + L2 (vy+primitiv+adapter+a11y), alla verifierade. **Avvikelse uppåt:** pre-passet ytade en taxonomi-förfining (ADR-064) som inte var planerad men korrekt — närvaro-snapshoten (3 par) ⊊ event-domänens taxonomi (sju par / sex kursnamn); tre Chat-premisser falsifierade mot live.

**Landningar (commit-hashar + CI gröna):**

- **ADR-064 + ADR-062-förfining + index** (`7d0e895`) — taxonomi från event-domänen (självväxande), medlemskap strikt `Närvaropoäng=1`, basens ofullständighet = ärlig signal. Count-grind grön före commit (L190).
- **Defekt-register** (`10bf75a`) — data-model §Kända fällor 34 (16 oavstämda Föreläsnings-Deltaganden) + 35 (naket "Resor i medvetandet"-namnkollision) som kravspec för post-Fas-6-bas-maximering (ADR-063); T16-vidgning.
- **L1 beräknings-motorn** (`6f94583`) — `compute-segment`-EF (repots första POST-läs-EF) + ren `computeMembership` i `_shared` (noll Airtable-import) + svars-Zod + 24 enhetstester. Grupperingsfält disk-verifierat (0 tomma / 1012). Consent buren, ej filtrerad.
- **L1 deploy + integration** (`704cc56`) — `compute-segment` deployad till STAGING via explicit `--project-ref` (prod-pekande CLI-länk neutraliserad, T34); api-staging HIT/MISS/AUTH grön. Assertion-fix: email-krav striktare än kontraktets nullbarhet (Chat-fel, Code-fångat live).
- **L2 byggar-ytan** (`7afc7e9`) — RadioGroup-primitiv + `deriveTaxonomy` (domän-härledd) + request-Zod + Status.ts `Modalitet` + `computeSegment`-adapter + vy/route/nav + e2e a11y (AxeBuilder 0). JOIN-nyckel-cross-check teckenexakt (STOPPA-grind passerad).
- **Securing-landning** (denna) — Del 2 + denna BUILD-LOG-post + lessons L193–L196 + `docs/reference/segment-arkitektur.md` (governing) + todo.

**Lessons:** L193 `[UNIVERSAL]` (assertera mot kontraktet, ej fixturens incidentella rikedom), L194 `[UNIVERSAL]` (join-nyckel-alignment som STOPPA-grind, ej runtime-hopp), L195 `[UNIVERSAL]` (lossy källa tvingar fram bättre arkitektur — läs källan, lappa ej projektionen), L196 `[UNIVERSAL]` (tvetydig outward-facing-default → explicit mål + maskin-grind, ej operatörens minne). **Hub-lyft pending** (efter Fas 6).

**Verifiering:** L1 24 enhetstester + api-staging HIT/MISS/AUTH (mot deployad staging-EF); L2 9 taxonomi-enhetstester + e2e a11y AxeBuilder 0 violations; alla CI-grindar gröna (typecheck, biome, check-frontmatter/lifecycle/adr-count); JOIN-nyckel teckenexakt (STEG-0 STOPPA-grind). ADR-count 64 oförändrad denna fas. Hashar: `7d0e895`, `10bf75a`, `6f94583`, `704cc56`, `7afc7e9` (+ securing-landningen).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-25-session-35.md`](../tasks/sessions/archive/2026-06/2026-06-25-session-35.md) (Del 1 scope + Del 2 landningar). Nästa: NY session → Fas 6g L3 (Spara segment). `lifecycle: active` tills do-confirm-passet.

---

## Session 36 — Fas 6g L3 (Spara segment — repots första 6g-WRITE) LEVERERAD (2026-06-26)

Levererade Fas 6g L3 (spara en segment-regel som en rad i Segment-tabellen + lista över sparade segment) — repots FÖRSTA WRITE i 6g. **SESSIONSGRÄNS, ej fas-avslut**: L4 (frys/export) + 6h (mail) återstår → ingen arkivering, ingen CHANGELOG-release, ingen phase-end-verify, ingen hub-lyft.

**Planerat vs faktiskt:** planerat = Fas 6g L3. Faktiskt = (oplanerad) CI-grön-återställning + ADR-065 + schema-mutation (staging+prod) + write-vertikal (2 lager). **Avvikelse uppåt (2 st):** (1) en oplanerad **enabling-detour** — main hade varit rött sedan Session 35 (4 markdownlint-fel fällda av docs-jobbet; sessionen stängd ovanpå rött), åtgärdat före L3 (ADR-053-triage); (2) en **ID-topologi-upptäckt** — staging+prod delar identiska tabell/fält-ID:n, vilket falsifierar ADR-050 T2:s "nya ID:n"-antagande (additiv erratum landad; sak-beslutet står).

**Landningar (commit-hashar + CI gröna):**

- **Landning 0 — CI-grön-återställning** (`61fdc4e`) — Session 35-skuld: 4 markdownlint-fel (MD028 ADR-062 errata-separator / MD029 data-model fällor 34-35 semantiska ID:n → disable / MD032 segment-arkitektur). ADR-062:s besluts-text orörd (immutabilitet).
- **Dok-födelse** (`4a47032`) — Session 36-doket fött (create-session-doc), `lifecycle: active`.
- **L0 ADR-065** (`771297b`) — segment-regel-persistens: typad JSON i nytt `App-segmentregel`-fält i befintliga Segment-tabellen; fältnamn LÅST (Chat-väg-beslut efter STOPPA); migrations-mål för de 9 legacy-segmenten; PEKAR ADR-062 b7 + T16. Count 64→65 lockstep (rot-README + decisions/README).
- **Schema-mutation** (`2ed356d`) — `App-segmentregel` (multilineText) tillagt på STAGING först, sedan PROD, additivt. **Write-isolation empiriskt bevisad** (`create_field` landade staging-only, prod orört) FÖRE prod-touch, efter STOPPA på ID-topologi-anomalin. data-model § Segment — write-fält + ID-topologi-not. INGEN record-write.
- **Write-vertikal Lager 1** (`227c6a4`) — `save-segment`-EF (fields SERVER-SIDE ur typad input, allowlist-SSOT-grind, create-registration-mallen) + `get-segments`-EF (global läs-lista; FILTRERAR legacy-rader utan `App-segmentregel`, L193) + field-allowlists-post (`save-segment`; Make-fält MEDVETET utanför) + `SavedSegmentSchema` + api-staging-test (allow/deny/anon/get-smoke, sentinel ADR-060). Deployad STAGING (`--use-api`, `--project-ref pqtshyierkdgwdnxuirz`); smoke-verifierad live.
- **Write-vertikal Lager 2** (`a4ef566`) — adapter `saveSegment`/`listSegments` (Zod-parse vid datagräns) + Supabase-stub + `queryKeys.segment.saved` + `SavedSegmentsList` (egen query, legacy server-filtrerad, a11y) + SegmentBuilder spara-UI (namn-Input + spara-Button + MessageBox + aria-live; definition byggd ur regeln; onSuccess invaliderar+rensar) + e2e spara-happy-path (stateful mock, axe oförändrat). "Session 36"-mislabel städad → "Session 35 pre-pass".
- **Securing-landning** (denna) — ADR-050 ID-topologi-erratum + lessons L197–L198 + Del 2 + denna BUILD-LOG-post + todo.

**Lessons:** L197 `[UNIVERSAL]` (CI-conclusion hör till BÅDE orientering och avslut; git-tillstånd räcker ej), L198 `[UNIVERSAL]` (obeprövad write-kodväg ärver ej en bevisad läs-vägs isolation — bevisa write-isolation reverserbart FÖRE prod-mutation). **Hub-lyft pending** (efter Fas 6).

**Verifiering:** Lager 1 api-staging (save-segment allow/deny/anon + get-segments smoke mot deployad staging-EF) grön; Lager 2 e2e (spara-happy-path + befintliga L2-tester + axe 0) grön; alla CI-grindar gröna (typecheck, biome, check-frontmatter/adr-count). Skrivbarhets-grind (STEG 0) live-godkänd för de tre måls-fälten. ADR-count 64→65 (ADR-065). Hashar: `61fdc4e`, `4a47032`, `771297b`, `2ed356d`, `227c6a4`, `a4ef566` (+ securing).

**STATUS — deploy-tillstånd:** 6g-EF:erna (`compute-segment`, `save-segment`, `get-segments`) är **STAGING-deployade, EJ prod**. Prod-deploy är en medveten SEPARAT handling (ej L3-scope) — Lotta kan ej spara segment i prod-appen förrän dess. Schema-fältet `App-segmentregel` finns dock på BÅDA baser (staging+prod).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-26-session-36.md`](../tasks/sessions/archive/2026-06/2026-06-26-session-36.md) (Del 1 scope + Del 2 landningar). Nästa: NY session → Fas 6g L4 (frys/export — SKOOL-lista, ADR-062 beslut 4). `lifecycle: active` tills do-confirm-passet.

## Session 37 — Fas 6g L4 (SKOOL-export) + 6g arch-audit → Fas 6g KLAR (2026-06-27)

Levererade Fas 6g L4 (SKOOL-export, ren READ + klient-export, ingen EF/WRITE) + 6g arch-audit (ren) → **Fas 6g KLAR (L1–L4)**, föregånget av en oplanerad **enabling-detour** (CI-grön-återställning, linkify-it ReDoS) + pre-L4 housekeeping (T37 + consent-allokering). **SESSIONSGRÄNS, ej fas-avslut:** Fas 6 öppen (6e retro-audit / 6f Skapa event / 6h Mail återstår) → ingen arkivering, CHANGELOG-release, phase-end-verify, byggplan 6→KLAR-flip eller hub-lyft. 6g-EF:erna är STAGING-deployade, EJ prod (medveten separat handling).

**Landningar (commit-hashar):**

- **Landning 0a — Dok-födelse** (`a552488`) — Session 37-doket fött (create-session-doc), `lifecycle: active`. Pushens CI föll på audit-ci (ej doc-relaterat) → utlöste detouren.
- **Landning 0b — CI-grön-återställning** (`9b97dad`) — **enabling-detour** (ADR-053-triage: blockerande + enabling → hantera nu). `audit-ci` high-gate fälldes av **GHSA-22p9-wv53-3rq4** (`linkify-it@5.0.0`, kvadratisk scan-loop / ReDoS, high). Dev-only path (`markdownlint-cli2` → `markdown-it@14.1.1` → `linkify-it`), ej i prod-bundle. **Ren fix:** avgränsad `overrides`-pin → `5.0.1` (patch, i `^5.0.0`-range, ingen major, lock-churn = endast linkify-it). Övriga audit-fynd moderate/low → fäller ej high-gaten; `GHSA-gv7w-rqvm-qjhr` redan tidsboxat allowlistad. DoD-svit grön lokalt (typecheck/biome/build/test:api/markdownlint).
- **Landning 1 — Pre-L4 housekeeping** (`d6c3376` + `b82c576`) — (a) tråd **T37** registrerad (Dependabot private-registry-config saknas, `npm.pkg.github.com`; "Dependabot Updates"-workflow röd men gatar ej CI; ADR-053-defer/`paused`); (b) **consent-allokering vid export LÅST** i `segment-arkitektur.md` (governing-note, ej ADR): SKOOL-export = community-access-grant (ej mail-consent-gated, ADR-062 b5), mail-utskick (6h) = consent-gated vid send-gaten, dedup-vid-handling (normaliserad e-post) i exporten (golv ADR-062 b7). Atomiska commits.
- **Landning 2 — Fas 6g L4 SKOOL-export** (frys/export) — "Exportera till SKOOL-lista"-handling på SegmentBuilder. **Ren util** `src/lib/segment-export.ts`: `buildSkoolExport(members)` → `{ csv, exportedCount, excludedCount }` (normaliserad-e-post-dedup [lowercase/trim], e-post-lösa exkluderade + räknade, **consent IGNORERAS** — SKOOL = access-ström per låst allokering), `skoolExportFilename` (slug + datum), `downloadCsv` (Blob + anchor, enda sidoeffekten — separerad). Konsumerar det **redan beräknade** compute-resultatet (`mutation.data.members`) → ingen parallell compute-väg; **filen ÄR frysningen** (b6, ingen lagrad/materialiserad lista). Gunilla-bekräftelse (X med e-post / Y saknar e-post / "bjud in i grupper om max 500"); tomt segment + alla-saknar-e-post hanterade (ingen tyst tom fil). **INGEN ny EF / WRITE / Airtable-mutation / field-allowlists-ändring / deploy** — ren READ + klient-export. Tester: 10 unit (api-pure) + 3 e2e (nedladdning triggad, axe 0). DoD grön lokalt (api-pure 141, e2e 11, typecheck/biome/build). SKOOL CSV-kolumnmappning ej auktoritativt pinnad → UI-hjälptext flaggar att Lotta verifierar vid första skarpa import.
- **Landning 3 — 6g arch-audit (ADR-058) → Fas 6g KLAR** (`3c547d2`; audit = LÄS+BETYGSÄTT, ingen kod rörd) — fitness-audit mot HELA 6g-ytan (L1–L4, Sessions 35–37). **Fem områden GODKÄNDA:** (i) lager-oberoende 0 kringgång + route tunn; (ii) port-paritet 18==18==18 (nya `computeSegment`/`saveSegment`/`listSegments` + ärliga `NOT_IMPLEMENTED`-Supabase-stubbar); (iii) EF-ribba 3/3 (compute-segment / save-segment / get-segments bär EF1/EF2/EF4–6); (iv) golv hållet JA (EF-ribba + consent-allokering + dedup + axe 0 + deny-by-default-allowlist) / spekulation NEJ (ingen död kod, stubbar = ADR-056-port); (v) ärliga betyg — bibliotek 11/11/11 (`segment-export.ts` ärligt 11/11/**10**, SKOOL-kopplad reuse), vyer 11/10/10 (axe 0 förtjänat). **AVVIKELSE: ingen fitness-brist.** → **Fas 6g KLAR (L1–L4).** Bi-fynd: 6e (Mer) aldrig arch-auditerad (Session 33 felaktig "ingen app-kod"-justifiering, get-leads/get-mail-log + vyer hade landat) → tråd **T38** (retro-audit-förkrav före FULLT Fas 6-avslut).
- **Close-landning** (Session 37 do-confirm) — byggplan §2 per-subfas audit-status-matris (ADR-058) + closeout-förkrav-not; tråd T38; lessons **L199–L201** (`[UNIVERSAL]`, hub-lyft pending); todo + Del 2 + denna BUILD-LOG. `lifecycle: active → closed`. **SESSIONSGRÄNS, ej fas-avslut** (Fas 6 öppen mot 6e-retro/6f/6h) → ingen arkivering / CHANGELOG / phase-end-verify / byggplan-6-flip / hub-lyft.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-27-session-37.md`](../tasks/sessions/archive/2026-06/2026-06-27-session-37.md) (Del 1 scope + Del 2 sex landningar). Transcript ej tillgängligt (`/mnt/transcripts/` saknas, ADR-041) → Code-transparens-rekonstruktion mot disk/git. Nästa: NY session 38 → kvarvarande Fas 6 (6e retro-audit / 6f Skapa event / 6h Mail) → därefter FULLT Fas 6 fas-avslut.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-27-session-37.md`](../tasks/sessions/archive/2026-06/2026-06-27-session-37.md). Nästa: L4 frys/export-design (Chat-dirigerad efter Marcus design-kvittens).

---

## Session 38 — Fas 6f Skapa nytt event (create-event write-vertikal): L0 doc-grund (2026-06-27)

**Mål:** lägg doc-grunden för appens nästa write-vertikal — skapa nytt event i Eventplanering ([byggplan §4 Fas 6f](byggplan.md)). L0 = ADR + referens-uppdatering; EF/allowlist/schema-fält/deploy = L1.

- **Doc-födelse** (`a72a032`) — Session 38-dok fött vid `/session-start` (ADR-043, `lifecycle: active`). Provisorisk Fas 6f-scope, låst av forensiskt pre-pass.
- **Forensiskt pre-pass** (READ-only, ingen commit) — create-event-kontraktet låst mot live STAGING-schema (`tblVE3UKWl1CKrphV`) + write-vertikal-mönstret (create-registration 6c L4 / save-segment 6g L3). Två fynd styr: (1) `EventKey`/`Event-nr` system-genererade (formel-på-autoNumber) → sätts aldrig; (2) **AVVIKELSE A** — `data-model.md`:s Eventplanering write-fält-tabell var UPDATE-orienterad, saknade create-essentiella identitets-/datum-fält.
- **STEG 0' — READ-only prod-introspektion** (auktoriserad; PROD `app8uGPrVCVOm6LfD`, noll mutation) — grundade beslut 5 mot RIKTIG event-population: **N=50 event, 0 test-rader exkluderade**; Utbildning 46/46 + Föreläsning 4/4 bär sessionsmall (**100 % båda klasser**) → **GREN A** (Eventtyp KRÄVS vid create rakt av, ingen carve-out). Ersatte den föregående staging-baserade STEG 0 som STOPPADE (staging bar bara 3 syntetiska event, 0 Föreläsning → otillräckligt underlag).
- **Landning 0 (COMMIT A, `1bf4ad4`)** — [ADR-066](decisions/ADR-066-skapa-event-write-vertikal-idempotens.md) (create-event write-vertikal + idempotens). Sex beslut: ett rad-write/ingen kaskad; server-side-byggt create-set + allowlist-SSOT; idempotens via **Airtable-nativ upsert** (`performUpsert.fieldsToMergeOn: ['Idempotensnyckel']`, nytt dedikerat fält — affärsnyckel-merge/ingen-idempotens/check-then-create-TOCTOU avvisade); pessimistisk create (TanStack-grundad) + disabled-knapp; Eventtyp required (GREN A); Månad/år härleds ur Startdatum. Web-research-grundad (Stripe/IETF/TanStack/Airtable, citerade). **count 65→66** (`check-adr-count.sh` grön, L190-token-svep). Index-rad + README-bump i samma commit.
- **Landning 0 (COMMIT B, `ae2e974`)** — `data-model.md`: nytt **Eventplanering — create-fält**-avsnitt (live STAGING-belagt, skilt från UPDATE-tabellen → AVVIKELSE A durabelt fångad, L189). §Kända fällor **36** (Månad/år manuell-singleSelect-drift → maximerings-kandidat T16, **AVVIKELSE B**) + **37** (Idempotensnyckel L1-schema-tillägg). T16-not vidgad Session 38.
- **INGEN EF / allowlist-kod / schema-mutation / deploy i L0** — allt LÅST i ADR, IMPLEMENTERAS L1. 6g-EF:er-carry (staging-only) oförändrad.
- **Landning L1 — create-event write-vertikal (server + schema), STAGING-only** (`3d0ea52` schema · `d3b696e` EF+allowlist+deploy · `20433f9` tester). (a) `Idempotensnyckel`-fält (singleLineText `fldOWoh4WR5zG6XgQ`) skapat+verifierat i STAGING Eventplanering (ej beräknat, tomt på alla rader); **PROD-fält medvetet ej skapat** → hård prod-deploy-förutsättning (§Kända fällor 37, L192). (b) ny `create-event`-EF (egen katalog, säkerhets-kontrakt speglat create-registration/save-segment; server-side fält-shape; system-genererade + spegel/länk aldrig; Månad/år härledd; Eventtyp required GREN A); ny `upsertAirtableRecord`-helper (`performUpsert.fieldsToMergeOn:['Idempotensnyckel']`, `typecast:false`) → 201 create / 200 replay; allowlist-post; manuell validering (ej Zod — EF-lager-konsistens). Deployad STAGING `pqtshyierkdgwdnxuirz` (explicit `--project-ref`, T34), **PROD orörd**. (c) `create-event.staging.test.ts` **7/7 grönt mot live STAGING** — KÄRNAN bevisad: färsk UUID→201 created, samma UUID→200 replay, SAMMA record-ID, noll dubblett; write-bevis (Månad/år härlett, Sessionsmall via Eventtyp-länk, EventKey/Event-nr födda). **STEG 0-fynd:** staging Eventformat TOMT → permanent sentinel-fixtur seedad (`recclDd7hUQsfxoVs`) + dokumenterad fallback (ingen ny CI-secret); L202 [UNIVERSAL]. Hård merge-STOPPA-grind EJ utlöst (bevisat live). Sentinel-events MCP-städade lokalt (ADR-060 i CI).
- **Carry till L2 + prod:** adapter + skapa-event-formulär + e2e = L2. **Prod-handling bundlad/separat-auktoriserad:** prod-fält `Idempotensnyckel` + create-event-EF-prod-deploy = EN atomisk handling (prod-fältet hård förutsättning).
- **Landning L2 — create-event klient-vertikal (adapter + formulär + e2e), STAGING-only** (`8a88b38` get-event-formats-EF · `412daf0` adapter+formulär · `cfd274e` e2e). STEG 0 = NEJ (ingen befintlig EF exponerar Eventformat) → (a) `get-event-formats` read-EF (speglar get-segments), deployad STAGING, 3/3 staging-test. (b) CreateEvent-schemas + port-metoder (createEvent/getEventFormats) + AirtableAdapter-impl + Supabase-stubbar (ADR-056-paritet) + `events.formats`-key; **CreateEventForm** (`/mer/skapa-event`): pessimistisk mutation (ADR-066 b4 — 201+200 båda framgång → navigera till skapat event, värden bevarade vid fel, ingen optimistisk insert), idempotency-key lazy en gång/öppning (b3), Eventformat required ur fetch (b5, ingen hårdkodad lista), Event/Typ-options ur get-events. (c) e2e 4/4 (happy/required/axe-0, page.route-mockad → ingen staging-write). DoD grön (typecheck/biome 204/build/api-pure 141/staging create-event 7/7 + get-event-formats 3/3/e2e 4/4). **L203** [UNIVERSAL] (substring-kollision i e2e-selektorer + route-mock-regexar). **PROD orörd.**
- **Fas 6f-status:** create-event funktionellt klar på staging (server+schema+klient+e2e). ÅTERSTÅR före 6f-deklaration: **6f arch-audit** (ADR-058, separat) + **prod-deploy** (fält + EF, bundlad separat-auktoriserad handling). SESSIONSGRÄNS, EJ fas-avslut.
- **Landning 6f arch-audit (ADR-058) → 6f auditerad** (audit = LÄS+BETYGSÄTT, ingen kod rörd) — fitness-audit mot HELA 6f-ytan (L0–L2). **Fem områden GODKÄNDA:** (i) lager-oberoende 0 kringgång + route tunn; (ii) port-paritet **20==20==20** (createEvent/getEventFormats + ärliga Supabase-`NOT_IMPLEMENTED`-stubbar); (iii) EF-ribba 2/2 (create-event 405/401/400 + get-event-formats read-EF); (iv) golv hållet JA (idempotens live-bevisad + deny-by-default + typecast:false + Eventtyp-required + axe 0) / spekulation NEJ (ingen check-then-create/temp-id/hårdkodad-options-spegel/död kod); (v) ärliga betyg — bibliotek **11/11/11** (`upsertAirtableRecord` genuint generisk), vy **11/10/10** (axe 0 förtjänat). **AVVIKELSE: ingen fitness-brist.** Bi-fynd: 6e-retro (T38) + prod-deploy-skuld registrerade, ej inböjda. byggplan §2-matrisen: 6f → ✅ ren.
- **Landning prod-deploy — create-event-vertikalen staging→prod (de 2 EF:erna), full smoke deferrad** (`7cadb07` allowlist-tillägg) — 6f:s enda prod-muterande handling, separat-auktoriserad. **STEG 1** (`7cadb07`): create-event + get-event-formats tillagda i `.prod-functions-allowlist.conf` (`--list` deploy-set 7, `test-deploy-prod-functions.sh` 4/4 PASS fail-closed intakt, CI grön) — enabling-detour FÖRE prod-mutation eftersom kanonisk `scripts/deploy-prod-functions.sh` är fail-closed mot allowlisten (todo.md:319 KRITISK, L115). **STEG 2:** prod-fält `Idempotensnyckel` (`fldkc33LVnbnz2ZmW`, singleLineText, tomt på alla 50 prod-rader) skapat FÖRE EF (hård ordning, §Kända fällor 37). **STEG 3:** create-event + get-event-formats **ACTIVE v1 på PROD** (`lvjsfnphlauldxqlncpl`) via skriptet + `ALLOWLIST_FILE`-override (engångs-temp, ej committad) → endast de 2; de **5 redan-live OBERÖRDA** (v9/v10 + updated-at 2026-05-04 oförändrad — skriptet deployar annars HELA setet, override smalnade körningen; committad allowlist förblir 7). **STEG 4' (READ-only, beslut C):** auth-grind prod-bevisad — create-event anon→401 / fel metod→405 / anon-Bearer→401, get-event-formats anon→401; **inget 200 utan äkta user** (grind läcker ej); radantal oförändrat 50 (ingen create). **DEFERRAT:** full autentiserad idempotens-prod-create-smoke (`requireUser` kräver prod-user-JWT; prod-GoTrue ≠ staging; prod-auth-kontoskapelse/lösenord-i-kanal = ej tillåtna vägar) → tråd **T40**. **§Kända fällor 37-prerekvisit UPPFYLLT** (deployad + grind-bevisad; mekanismen redan staging-live-bevisad). **Trådar:** T39 (prod-funktions-drift-sync, de 5 ligger efter HEAD — 16 `_shared`-commits) + T40 (full prod-smoke). **Lessons:** L204 + L205 [UNIVERSAL]. Committad allowlist = 7 (deklaration); denna körning deployade 2.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-27-session-38.md`](../tasks/sessions/archive/2026-06/2026-06-27-session-38.md) (Del 1 scope + Del 2 L0/L1/L2 + 6f arch-audit + prod-deploy). Nästa (Chat dirigerar): 6e-retro-audit (T38) + 6h Mail + T39 prod-funktions-drift-sync + T40 full prod-smoke före FULLT Fas 6-avslut.

---

## Session 39 — Fas 6h Bulk-mail på segment (send-email write-vertikal): L0–L2c (2026-06-28)

**Mål:** bygg appens sista obyggda write-vertikal — bulk-mail PÅ ett segment via Resend ([byggplan §4 Fas 6h](byggplan.md)). Commit-range `2911d2c`→`d2831dd`. SESSIONSGRÄNS (Fas 6 + 6h öppna; L2d/L3 återstår), EJ fas-avslut.

### Fas 6h (planerat vs faktiskt)

- **L0 doc-grund** (`2911d2c`, länk-fix `42efd51`) — forensiskt pre-pass avtäckte 3 forks (ADR-015-enkel-sänd-aldrig-byggd vs landad bulk-`MailPayloadSchema`; Resend-yta; Utskickslogg-fält-IDs ej på disk, L189) + live-introspektion (Utskickslogg `tblIesjbuSWNp6oxK` 9 fält; Bulkutskick = valfri länk → en-tabells; `Idempotensnyckel` additiv-OK). [ADR-067](decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) (D1–D8 + 3 deferrade): **supersederar ADR-015** (send-delen, immutabel besluts-text bevarad); Resend `/emails/batch`; två-lagers idempotens (Resend 24h + Utskickslogg-merge); consent-gate GOLV; partial-failure aldrig binär; multipart. **count 66→67** (L190). data-model Utskickslogg-sektion + §Kända fällor 38. Trådar **T41/T42/T43** (durabel-kö / webhook-opens-ingestion / schemalagd-send, paused).
- **L1 ren `prepareBulkSend`** (`df4c684`) — [`_shared/prepare-bulk-send.ts`](../supabase/functions/_shared/prepare-bulk-send.ts): consent/dedup/e-post-lös/chunk/status, NOLL I/O. `normalizeEmail` speglar `src/lib/segment-export.ts` exakt (runtime-gräns Deno/Vite). **18 api-pure enhetstester**, invariant verifierad.
- **L2a Resend-sanningskoll + schema** (`51ee330` doc-drift) — **Resend läge (1):** ingen `RESEND_API_KEY` på staging/prod → kan ej sända. `Idempotensnyckel` (singleLineText, **`fldgB4EWDIksNCvN2`**) tillagt på Utskickslogg STAGING, rent additivt (9→10). Prod orört.
- **L2b EF + orkestrator (Resend MOCKAD)** — forkar A/A (Marcus). `c22f934`: [`_shared/segment-resolution.ts`](../supabase/functions/_shared/segment-resolution.ts) extraherad ur compute-segment (compute-segment → tunn wrapper, beteende-bevarande); `0b617ee`: [`_shared/send-bulk.ts`](../supabase/functions/_shared/send-bulk.ts) (dependency-injicerad orkestrator: lastbärande icke-prod-spärr, batch-nyckel `<jobId>/b<index>`, partial-status, injicerad logg-writer) + [`send-email/index.ts`](../supabase/functions/send-email/index.ts) (Deno EF, create-event-kontrakt; `isProd=ENVIRONMENT==='production'` fail-closed; 400/422/503-vägar); **`ENVIRONMENT=staging`** satt; `b19cee0`: allowlist `send-email` + **14 api-pure kontraktstester** (noll riktig Resend/Airtable, injicerade mockar). Avvikelse: api-staging-modellen = HTTP-mot-deployad → HTTP/real-Airtable deferrat L2c/L2d.
- **L2c staging-deploy + nyckel-oberoende HTTP-kontrakt** (`d2831dd`) — T34: länkad=PROD → båda deploys explicit `--project-ref pqtshyierkdgwdnxuirz`. compute-segment redeployad → **beteende-bevarande-grind GRÖN i drift** (HIT/MISS/AUTH 3/3, COMMIT 1-grind fullbordad). send-email **ACTIVE** (`resend@4` bundlade rent). [`send-email.staging.test.ts`](../tests/api/send-email.staging.test.ts) **6/6** mot deployad EF: 401/405/400(UUID)/400(tom segmentIds)/**400 SegmentNotResolvable** (cross-check: extraherad resolution live i deploy, skriver inget). Utskickslogg **tomt** efter pass.

### Avvikelser

ADR-067 + **ADR-015-supersession**; trådar **T41/T42/T43**; **gate-liveness-422 deferrad till L2d** (inget befintligt segment löser upp riktig-formad adress); **test-form-divergens** (api-staging = HTTP-mot-deployad → HTTP/real-Airtable-kontrakt deferrat L2c/L2d, ej tyst mockat som staging).

### Verifiering

L1 18 api-pure enhetstester · L2b 14 api-pure kontraktstester · L2c 6/6 HTTP-kontrakt mot deployad EF + compute-segment beteende-grind 3/3 grön i drift. Alla CI-gröna.

### Teknisk skuld

6g + 6h-EF:er **STAGING-only** (ej prod). Deferrat **L2d** (grindat på staging-Resend-test-nyckel = Marcus-handling): riktig Resend mot @resend.dev + permissive-pin (`batchValidation:'permissive'` mot resolverad `resend@4`), riktig Utskickslogg-merge happy-path, idempotens-rerun-samma-rad, 503-väg, gate-liveness-422. **T39 VIDGAD** (compute-segment prod-drift). 6h arch-audit förfaller vid 6h-completion (efter L3).

### Filstruktur-snapshot (nytt/ändrat i Session 39)

```text
supabase/functions/
  _shared/prepare-bulk-send.ts      (L1, ny — ren modul)
  _shared/segment-resolution.ts     (L2b, ny — extraherad ur compute-segment)
  _shared/send-bulk.ts              (L2b, ny — orkestrator)
  _shared/field-allowlists.ts       (L2b, +send-email-operation)
  compute-segment/index.ts          (L2b, refaktorerad → tunn wrapper)
  send-email/index.ts               (L2b, ny — Deno EF)
tests/api/
  prepare-bulk-send.test.ts         (L1, 18 enhetstester)
  send-bulk.test.ts                 (L2b, 14 kontraktstester)
  send-email.staging.test.ts        (L2c, 6 HTTP-kontrakt)
docs/decisions/ADR-067-*.md          (L0, ny) + ADR-015 (superseded-not)
docs/reference/data-model.md         (L0/L2a, Utskickslogg-sektion + fälla 38)
tasks/threads/README.md              (L0, T41/T42/T43)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-28-session-39.md`](../tasks/sessions/archive/2026-06/2026-06-28-session-39.md) (Del 1 scope + Del 2 L0–L2c). Nästa: **NY Session 40 → Fas 6h L2d** (riktig Resend-integration, grindad på staging-Resend-test-nyckel) → L3 (klient) → 6h arch-audit → prod-deploy → Fas 6 closeout-förkrav (T38/T39/T40) → FULLT Fas 6-avslut.

---

## Session 40 — Fas 6h Bulk-mail på segment (send-email): L2d riktig Resend-gräns (staging) (2026-06-28)

**Mål:** byt L2c-platshållaren mot den RIKTIGA Resend-gränsen och bevisa send-vertikalen mot deployad staging-EF nu när M2 (staging-test-nyckel) är provisionerad ([byggplan §4 Fas 6h](byggplan.md), [ADR-067](decisions/ADR-067-bulk-mail-segment-send-kontrakt.md)). Commit-range `a27ba2d`→`bcda7ff` (+ denna BUILD-LOG-entry, killer-item-#4-komplettering post-close — historik, ej återöppning; sessionsdok-40 `lifecycle: closed` orört). SESSIONSGRÄNS (Fas 6h öppen: L3 + 6h-audit + prod-deploy; Fas 6 öppen: T38/T39/T40), EJ fas-avslut.

### Fas 6h L2d (planerat vs faktiskt)

- **STEG 0 strukturobservation** (throwaway-probe, ej committad) — engångs staging-EF (`l2d-resend-probe`, `--no-verify-jwt`, raderad direkt + aldrig committad) gjorde riktig `batch.send` mot test-adresser och returnerade ENBART struktur. Observerat mot resolverad `resend@4`: `{ data: { id }[] }`, **`errors` FRÅNVARANDE (undefined)** vid 2/2 giltiga → bekräftar formen, ingen STOPPA (L210). Kanal-val: CLI saknar `functions logs` + staging-nyckel bara server-side.
- **STEG 1–2 svar-parsning + tester** (`b4677e8`) — ny Node-importerbar [`_shared/resend-batch.ts`](../supabase/functions/_shared/resend-batch.ts) `parseBatchOutcome`: rejected ur `errors[].index → batch[index].email + message`; accepted = **index-KOMPLEMENT** (rad-exakt, ej beroende av kompakterade id-only `data.data`); defensiv `data.data.length`-cross-check; fabricerar aldrig e-post vid index utanför intervall. Ersatte L2c-platshållaren i `makeRealBatchSender`. **L2c-PIN UPPLÖST** (STEG 0 + förstaparts-SDK-typ `CreateBatchSuccessResponse`). **8 api-pure enhetstester** (full-accept/partial/defensiva kanter); partial-grenen schema-bekräftad mot Resend-doc, EJ live-framkallbar (icke-prod-spärren) (L208).
- **STEG 3–5 live mot deployad staging-EF** (`603a60f` doc-trail; deploy explicit `--project-ref pqtshyierkdgwdnxuirz`, prod orört) — via EFEMÄR fixtur (L209): seedade i ett TOMT `kurs×modalitet`-par (staging hade bara 3 RIM/Utbildning-rader) — HAPPY (`Psionautics/Utbildning` → delivered@/bounced@resend.dev) + GATE (`Fjärrskådning/Utbildning` → `blocked@example.com`); allt raderat efter (basen leverabel). **(3)** happy-path **HTTP 200 `sent`**, `requested=2 accepted=2` (isolering bekräftad via EF:ens egen räkning), Utskickslogg-merge **0→1** (5 skrivbara fält + `Idempotensnyckel=jobId` + Skickat till=2 person-ID). **(4)** idempotens-rerun (samma jobId): **radantal oförändrat + samma `logRecordId`** (app-merge) + Resend 24h via `<jobId>/b<index>`. **(5a)** 503-grenen **död i happy-path** (200, ej 503, med nyckel). **(5b)** 422 gate-liveness → **`non_prod_address_refused`**, noll send, 0 Utskickslogg-rader. **Alla 6 L2d-DoD KLAR (staging).**

### Avvikelser

`Antal skickade` (COUNTA på länkfält) visade 1 vid 2 mottagare → **§Kända fällor 39** (hypotes-märkt rot, bas-formel-quirk, utanför app-skrivkontraktet → AT-Max/[ADR-063](decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md), ej L2d-defekt). Live-checkarna EJ committade som CI-tester (api-staging-runnern saknar Airtable-seed) → **tråd T45** (paused); regressionsgrind för parsningen = api-pure `resend-batch.test.ts`.

### Verifiering

8 api-pure L2d-tester (parseBatchOutcome) + live 5/5 STEG mot deployad staging-EF (happy-path / merge / idempotens-rerun / 503-omvänt / 422). Ackumulerat Fas 6h: 18 (L1) + 14 (L2b) + 6 (L2c) + 8 (L2d). Alla CI-gröna.

### Teknisk skuld

L2d **STAGING-only**. Prod kvarstår (M3 prod-nyckel + verifierad domän + Code-at-prod-deploy, [T44](../tasks/threads/T44-fas-6h-externa-provisionerings-forkrav.md)). **T44 M2 PROVISIONERAD** (grindar ej längre L2d). **T44 M3 konkretiserad:** avsändardomän `miranon.dev` (GoDaddy, 2026-06-28) + öppen root-vs-subdomän-fråga (mot psionautics SPF/DKIM/DMARC). 6h arch-audit förfaller efter L3 (ej mid-build). Lessons **L208–L210** `[UNIVERSAL]` (L193–L210 EJ hub-lyfta — pending efter FULLT Fas 6).

### Filstruktur-snapshot (nytt/ändrat i Session 40)

```text
supabase/functions/
  _shared/resend-batch.ts           (L2d, ny — parseBatchOutcome, Node-importerbar)
  send-email/index.ts               (L2d, makeRealBatchSender → riktig parsning)
tests/api/
  resend-batch.test.ts              (L2d, ny — 8 api-pure enhetstester)
  send-email.staging.test.ts        (L2d, DEFERRAT→VERIFIERAT-LIVE-not)
docs/reference/data-model.md         (§Kända fällor 39 — Antal skickade-quirk)
tasks/threads/README.md              (T45 — api-staging-seed-lucka)
tasks/threads/T44-*.md               (M2 PROVISIONERAD + M3 konkretiserad)
docs/byggplan.md                     (6h audit-matris-rad → byggd L0–L2d staging)
tasks/lessons.md                     (L208–L210, Session 40-H2)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-28-session-40.md`](../tasks/sessions/archive/2026-06/2026-06-28-session-40.md) (Del 1 scope + Del 2 STEG 0–5 + durabilitets-registreringar + handoff). **Sessionsavslut:** do-confirm-pass (POST 1–6, 5 åtgärdade) + `lifecycle: closed` (`bcda7ff`). Nästa: **NY Session 41 → Fas 6h L3 (klient)** — compose-UI + adapter (operationKey `send-email`, klient-side Idempotency-Key) + e2e; obligatoriskt forensiskt pre-pass mot create-event (6f)/save-segment (6g) klient→EF-mönstret → 6h arch-audit → prod-deploy (M3 + Code-at-prod-deploy, T44) → Fas 6 closeout (T38/T39/T40).

---

## Session 41 — Fas 6h slutförande: L3 (klient) + 6h arch-audit + avvikelse-fix (2026-06-28)

**Mål:** slutför Fas 6h-bygget — klient-lagret (compose-UI + adapter-aktivering + e2e), 6h arch-audit, och rot-resolvera dess avvikelse ([byggplan §4 Fas 6h](byggplan.md), [ADR-067](decisions/ADR-067-bulk-mail-segment-send-kontrakt.md), [ADR-058](decisions/ADR-058-arkitektur-fitness-audit-mekanism.md)). Commit-range `1ed5c48`→`ac0d902` (+ denna BUILD-LOG-entry + lifecycle-flip). SESSIONSGRÄNS (Fas 6h staging-klar; prod = T44 M3 + Code-at-prod-deploy. Fas 6 öppen: T38/T39/T40), EJ fas-avslut.

### Fas 6h L3 — klient (planerat vs faktiskt)

- **Doc-birth** `1ed5c48` + hygien-fix `4816b21` (verbatim-scopens `-`-bullets föll MD004/MD022/MD032 → skördade **L211**: verbatim-text i en lint-governad fil ärver fil-governance; handoff normaliserar + lokal lint FÖRE commit). **Commit 0 (L211)** `fccdb09`.
- **Commit A** `d580bae` — `sendEmail` aktiverad i BÅDA adaptrarna (Airtable: riktig `postEdgeFunction('send-email')` + `MailSendResultSchema.parse` vid datagränsen; Supabase: ärlig `NOT_IMPLEMENTED`-stub = rätt ADR-056-paritetsmönster). `MailPayload.idempotencyKey` + `MailSendResult(Schema)` + assignable-test. Ny **`TextArea`-primitiv** (flerradig mailtext, speglar `Input`:s a11y-kontrakt). Ny **`SegmentMailCompose`** monterad i SegmentBuilder: floors a–h (pessimistisk, stabil UUIDv4-idempotens per send-avsikt, mottagar-antal FÖRE send via compute-segment på sparat segments regel, bekräftelse-modal, consent-utfall server-SSOT-visat, 5xx-fel-väg, klient-validering deny-by-default, a11y axe 0). **STOPPA-grind avklarad:** segment→segmentIds-upplösningen är kontrakt-determinerad (ADR-067: sparade record-ID), ej ett oavgjort beslut → ingen ny ADR.
- **Commit B** `1dd50f9` — Playwright vy-baseline (mockad send): happy path + body-kontrakt (`segmentIds`/`amne`/`mailtext`/UUID-nyckel) + axe 0.
- **Commit B-fix** `0635b24` — regression Code SJÄLV fångade i CI: compose-Selectens dolda native-`<option>` delade segmentnamn med SavedSegmentsList → strict-mode-kollision i 6g spara-testet → scopad till `region "Sparade segment"`. (HEAD `1dd50f9` röd → `0635b24` grön.)

### 6h arch-audit (ADR-058) + avvikelse

- **i–iii mekaniskt GODKÄNDA** (arch-fitness-check.sh): lager-oberoende (0 kringgång, route tunn), swappbarhet (port-paritet 20==20==20), EF-ribba (send-email bär EF1–EF6). **iv golv HÅLLET** (consent-GDPR, idempotens, pessimistisk, partial aldrig binär, a11y, deny-by-default). **v ärliga betyg:** bibliotek 11/11/11 utom `send-bulk` teknik **10**; vy `SegmentMailCompose` **11/10/10**.
- **EN AVVIKELSE (audit område iv, edge-case-honesty):** noll-leverans-send (0-mottagare ELLER alla-undertryckta, `attempted===0`) rapporterades som grön `sent` + skrev fantom-Utskickslogg-rad. Chat omklassade audit-försiktiga "ovanför golvet" → **golv** (falsk framgång + fantom-rad på oåterkallelig handling). Skördad som **L212**.

### Avvikelse-fix (rot-resolverad, CI-grön per commit)

- **Commit 1** `28a625a` — server [`_shared/send-bulk.ts`](../supabase/functions/_shared/send-bulk.ts): `attempted===0 → status 'skipped'` (ej 'sent') + **INGEN Utskickslogg-rad** (`logRecordId=null`, idempotens-konsistent). Schema/model-enum vidgat (`'skipped'`). 2 nya api-pure noll-leverans-grenar (D3-invariant grön).
- **Commit 2** `1ae3249` — klient: 0-mottagar-send blockerad client-side (`count>0`-gate + "inga mottagare"-notis) + `accepted===0` renderas ALDRIG som grön framgång (neutral varning + suppression-breakdown). e2e (0-block + accepted=0).
- **Commit 3** `4db9d96` — `TextArea` i dedikerade primitiv-a11y-sviten (stänger audit-omdömes-not; axe 0).
- **Commit 4** `53b81bd` — [ADR-067](decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) additiv not ('skipped' ⊥ sent/partial/failed + ingen loggrad); `check-adr-count` orörd **67==67**.
- **Konsekvens:** `send-bulk` → förtjänat **11** efter fix.

### Verifiering

CI grön per commit (runs per HEAD: `0635b24`/`28a625a`/`1ae3249`/`4db9d96` Test+Build success; `53b81bd` doc-only Docs-link-check success). **api-pure** send-bulk 15 (2 nya noll-leverans). **e2e** mer-segment-send 4 (happy + 0-block + accepted=0) + 6g mer-segment 12 (regression-fixad). **a11y** primitiver 13 (ny TextArea-sektion). typecheck 0 · biome 0 · build grön. **Staging-redeploy** send-email **v5 ACTIVE** (explicit `--project-ref pqtshyierkdgwdnxuirz`, T34 — CLI länkad mot PROD `lvjsf…`; prod ORÖRT) + live-sanity 6/6 HTTP-kontrakt mot redeployad EF.

### Teknisk skuld

6h **STAGING-only**. Prod kvarstår (T44 M3 prod-Resend-nyckel + verifierad `miranon.dev` + Code-at-prod-deploy). 6g-EF:er (compute/save/get-segments) STAGING-only. Fas 6 closeout-förkrav: 6e retro-audit (T38) / T39 / T40 → därefter FULLT Fas 6-avslut (phase-end-verify, 6→KLAR, fas-nivå fitness-svep, CHANGELOG, hub-lyft, arkivering). Lessons **L211–L212** `[UNIVERSAL]` (L193–L212 EJ hub-lyfta — pending efter FULLT Fas 6). Ny tråd **T46** (go-live-karta). Auditen flippade EJ Fas 6.

### Filstruktur-snapshot (nytt/ändrat i Session 41)

```text
src/domain/models/MailPayload.ts          (idempotencyKey + MailSendResult)
src/domain/schemas/MailPayload.schema.ts  (MailSendResultSchema, 'skipped'-enum)
src/data/adapters/*                        (sendEmail aktiverad/paritet × 3 + interface)
src/components/primitives/TextArea.tsx     (ny — flerradig fält-primitiv)
src/components/segment/SegmentMailCompose.tsx (ny — compose-UI, floors a–h)
src/components/segment/SegmentBuilder.tsx  (monterar SegmentMailCompose)
src/routes/dev/primitives.tsx              (TextArea demo-sektion)
src/queries/keys.ts                        (segment.sendRecipients)
supabase/functions/_shared/send-bulk.ts    (noll-leverans 'skipped' + no-log)
tests/api/send-bulk.test.ts                (2 nya noll-leverans-grenar)
tests/e2e/mer-segment-send.staging.test.ts (ny — 3 vy-tester)
tests/e2e/mer-segment.staging.test.ts      (6g spara-assertion region-scopad)
tests/a11y/primitives.spec.ts              (TextArea-sektion)
docs/decisions/ADR-067-*.md                (additiv noll-leverans-not)
docs/byggplan.md                           (6h audit-rad ✅ ren, STAGING)
tasks/lessons.md                           (L211–L212)
tasks/threads/README.md + T46-*.md         (T46 go-live-karta)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-28-session-41.md`](../tasks/sessions/archive/2026-06/2026-06-28-session-41.md) (Del 1 scope + Del 2 landnings-kadens). **Sessionsavslut:** session-end do-confirm-pass + `lifecycle: closed`. Nästa: **prod-deploy-sessioner** — (1) Skool-export (prod-deploy 6g-EF:er, närmast, inga externa deps); (2) Mail 6h (T44 M3 + Code-at-prod-deploy) → Fas 6 closeout-förkrav (T38/T39/T40) → FULLT Fas 6-avslut. Go-live-karta (T46) ritas vid prod-deploy-design.

---

## Session 42 — Fas 6e retro-audit (T38): golv-gap stängt, 6e förstklassigt klar (2026-06-29)

**Mål:** kör 6e arch-audit (T38 — oauditerad slice sedan S33-bygget), remediera fynd, reconciliera docs ([byggplan §4 Fas 6e](byggplan.md), [ADR-058](decisions/ADR-058-arkitektur-fitness-audit-mekanism.md)). Commit-range `d24d95e`→`ccea505` (+ denna BUILD-LOG-entry + lifecycle-flip). SESSIONSGRÄNS (Fas 6 öppen: prod-deploys 6f+6h via T44 M3 + phase-end-verify), EJ fas-avslut.

### L1 — arch-audit (ADR-058, read-only)

- Mekaniska områdena i–iii via `arch-fitness-check.sh`: **i** lager-oberoende (0 kringgång, DI-switch närvarande, `dataSource` direkt-importerad endast av `router.ts`), **ii** swappbarhet (port-paritet **20==20==20**), **iii** EF-ribba — get-leads + get-mail-log bär EF1 (requireUser+tidig retur)/EF2 (corsHeadersFor)/EF4 (generateRequestId)/EF5–EF6 (mapErrorToResponse strukturerad); **EF3 N/A** för rena LÄS-EF utan operationKey.
- Omdömes-områdena iv–v: **iv** golv hållet för EF + vyer (säkerhet, axe-0, Gunilla-namn) MEN **AVVIKELSE iv-1** (skal-golv-lucka: Mer-skalet saknade logout OCH Inställningar; `logout()` fanns i `AuthProvider` men anropades bara från `login.tsx`) + **AVVIKELSE iv-2** (oanvänd `_filters?: MailLogFilters`, 0 konsumenter). **v** vyer intresserade/maillogg **11/10/10** (Tillgänglighet 11 belagt av axe-0-tester); skal-betyg **uppskjutet** pga golv-luckan.
- Marcus-beslut: **Väg 1** — bygg logout (golv), de-scopa Inställningar (ingen specificerad funktion; tom "ifall"-sida = spekulation över golvet).

### L2 — skal-closeout (Väg 1-resolution)

- **Commit A** `d24d95e` — logout-affordans i [`mer/index.tsx`](../src/routes/_authenticated/mer/index.tsx): `Button`-primitiv (react-aria 11/11/11) i egen `<div>` UTANFÖR nav-landmärket (handling ≠ navigering), anropar befintlig `logout()`; redirect till `/login` via `_authenticated`-guarden (logout → `onAuthStateChange` → `router.invalidate()` → beforeLoad). Ingen bekräftelse-dialog, ingen Inställningar. E2E [`tests/e2e/mer-index.staging.test.ts`](../tests/e2e/mer-index.staging.test.ts) (affordans utanför nav + tangentbords-nåbar + ingen Inställningar + axe-0 + logout→redirect).
- **Commit B** `4a49b35` — port-hygien: skar `_filters?: MailLogFilters` ur `fetchMailLog` (interface + båda adaptrarna) + `MailLogFilters`-typdefen (0 konsumenter). `AttendanceFilters` (samma mönster, utanför scope) → T48.
- **Verifiering:** typecheck 0 · biome 0 · port-paritet **20==20==20** bevarad · api-tester 182 passed. **CI grön per jobb** (run `28379206225`, HEAD `4a49b35`): **E2E (staging) körde MED secrets** — `mer-index.staging.test.ts` 6 assertioner inkl. logout→redirect + axe-0; A11y axe-runner ✅; Build ✅.
- **Konsekvens:** skalet nu betygsättbart → **11/10/10** (axe-0 färskt CI-verifierad med logout-knappen). Område v:s uppskjutna skal-betyg **STÄNGT**.

### L3 — doc-reconciliation + audit-record

- **Inställningar de-scopad ur 6e** (deliberat): `byggplan.md` §4 (6e-rad + Filer-lista), `BYGGPLAN-LÄTTLÄST-v3.md` (Fas 6e-sektion + Mer-flik-tabell). "Logga ut" behållet.
- **T47** registrerad (kort + rad — Inställningar-yta, byggs vid konkret behov); **T48** registrerad (rad — AttendanceFilters-triage, ADR-053); **T38 → closed** (verdikt-konsistens).
- **Audit-record:** sessionsdok Del 2 (L1-verdikt) / Del 3 (L2-closeout) / Del 4 (L3-reconciliation) + verdikt-rad + lessons-kandidater (`ccea505`). De-scope-edits + trådar (`8adc540`).

### Verifiering

CI grön per jobb (run `28379206225` kod / `28380227654` docs — Test+Build success, Docs link check success, Lint+Audit+TypeCheck success). markdownlint 0 på alla rörda .md · lychee 15 OK/0 errors (T47-länkar). typecheck 0 · biome 0 · build grön · api 182 passed · e2e (staging, CI-secrets) grön inkl. nya `mer-index`-sviten.

### Teknisk skuld

**6e FÖRSTKLASSIGT KLAR mot ADR-058** (alla fem områden passerar; golv återställt; vyer + skal 11/10/10). **T38 fullt löst.** Fas 6 closeout-förkrav kvarstår: prod-deploys 6f+6h (T44 M3 prod-Resend-nyckel + verifierad domän + Code-at-prod-deploy) + T39 + T40 → därefter FULLT Fas 6-avslut (phase-end-verify, 6→KLAR, fas-nivå fitness-svep, CHANGELOG, hub-lyft, arkivering). Lessons **L213–L214** `[UNIVERSAL]` (L193–L214 EJ hub-lyfta — pending efter FULLT Fas 6). Nya trådar **T47** (Inställningar-de-scope) + **T48** (AttendanceFilters-triage). Auditen flippade EJ Fas 6.

### Filstruktur-snapshot (nytt/ändrat i Session 42)

```text
src/routes/_authenticated/mer/index.tsx    (logout-affordans, Button utanför nav)
src/data/adapters/DataSourceAdapter.ts     (fetchMailLog: filters-param borttagen)
src/data/adapters/AirtableAdapter.ts       (_filters borttagen + stale-kommentar)
src/data/adapters/SupabaseAdapter.ts       (_filters borttagen)
src/domain/types/Filters.ts                (MailLogFilters-typdef borttagen)
tests/e2e/mer-index.staging.test.ts        (ny — logout-affordans + axe-0 + redirect)
docs/byggplan.md                           (§4 6e: Inställningar de-scopad → T47)
docs/specs/BYGGPLAN-LÄTTLÄST-v3.md         (Fas 6e-bullet + Mer-flik-tabell)
tasks/sessions/archive/2026-06/2026-06-29-session-42.md    (Del 2/3/4 + verdikt + lessons-kandidater)
tasks/lessons.md                           (L213–L214)
tasks/threads/README.md + T47-*.md         (T47 + T48; T38→closed)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-29-session-42.md`](../tasks/sessions/archive/2026-06/2026-06-29-session-42.md) (Del 1 scope + Del 2/3/4 audit-record + verdikt). **Sessionsavslut:** session-end do-confirm-pass + `lifecycle: closed`. Nästa: **NY Session 43** → Fas 6 prod-deploys (Skool-export 6g + Mail 6h via T44 M3) → Fas 6 closeout-förkrav (T39/T40) → FULLT Fas 6-avslut.

---

## Session 43 — Fas 6g Skool-export PROD-DEPLOY (de 3 segment-EF:erna ACTIVE v1) (2026-06-29)

**Mål:** prod-deploya 6g-vertikalens tre Edge Functions (compute-segment/save-segment/get-segments) så Skool-export-vägen blir live ([byggplan §4 Fas 6g](byggplan.md)). Commit-range `fbca88f`→(denna landning). Risk-trappa STEG 0–4'; själva deployen är en out-of-CI prod-handling (committade inget). SESSIONSGRÄNS, EJ fas-avslut (Fas 6 öppen: 6h via T44 M3 + T39/T40).

### STEG 0 — forensisk pre-pass (read-only)

- **Deploy-set fastställt = exakt 3:** klient-adaptern anropar `compute-segment` (POST), `save-segment` (POST), `get-segments` (GET); Skool-exporten är klient-side ([`src/lib/segment-export.ts`](../src/lib/segment-export.ts)), ingen export-EF. Alla tre staging-only (ej i allowlisten).
- **`.temp`-divergens löst (T34):** live `supabase projects list` ● = `lvjsfnphlauldxqlncpl` (PROD); den stale `linked-project.json` (sa staging) är ej auktoritativ — live-källan i handlings-ögonblicket gäller (→ L215).
- **Inget prod-schema-gap:** live read-only `describe_table` mot prod-basen `app8uGPrVCVOm6LfD` — Segment-tabellens 3 skriv-/läs-fält (`Namn på segment` `flduvXn5oW00Z5TBk`, `App-segmentregel` `fldhN1wH6sXODdfb7`, `Segmentdefinition` `fldED0CiIINac9DRB`) finns alla (landade S36). **STEG 2 (fält-skapelse) utgick.**

### STEG 1 — allowlist-deklaration (config-commit)

- `dd97807` — `compute-segment`/`save-segment`/`get-segments` lagda i [`.prod-functions-allowlist.conf`](../.prod-functions-allowlist.conf) (alfabetiskt; 7→10). Fail-closed-test **4/4 PASS**; `--list` = 10. Committad **deklaration** att de 3 får prod-deployas; faktisk körning separat (STEG 3). CI grön per jobb (run `28384820694`, HEAD `dd97807`).

### STEG 3 — prod-deploy (Marcus-auktoriserad mutation)

- **OP 1–2 (pre-state):** de 3 FRÅNVARANDE på prod → first-deploy. Baslinje: de 8 pre-existerande EF:erna (5 stale @ 2026-05-04 + create-event/get-event-formats @ 2026-06-27 + test-auth). Prod-secrets närvarande (op 2b namn-set: `AIRTABLE_BASE_ID`/`AIRTABLE_TOKEN`/`SUPABASE_URL`/`SUPABASE_ANON_KEY` m.fl.). Back-out = `functions delete` (first-deploy → ingen tidigare version).
- **OP 3 (mutation):** engångs `ALLOWLIST_FILE`-override (ej committad) med endast de 3 + explicit `--project-ref lvjsfnphlauldxqlncpl` → de 3 deployade ACTIVE v1, `_shared` bundlat per funktion, temp-fil raderad. Committad `.conf` förblir 10 — override smalnade körningen (annars hade de 5 stale re-deployats blint, T39 → L216).
- **OP 4 (untouched-proof):** de 3 ACTIVE v1 (16:15:0X); de 8 pre-existerande **oförändrade** (version + updated_at = baslinjen). **Blast-radius = exakt 3.**
- **OP 5 (deny-grind, read-only):** compute-segment 401/405/401 · save-segment 401/405/401 · get-segments 401/401. **Inget 200, ingen Segment-rad skapad** (save-segment autentiserad happy-path EJ körd = T40 → L217).

### Verifiering

Pre/post untouched-proof (de 8 baslinje-identiska, blast-radius 3) · prod-secret-närvaro (op 2b namn-set) · deny-grind per EF (401/405) live mot prod. **Inga CI-tester för prod-deny-grinden** — out-of-CI live-pass (T45-klassen: api-staging-runnern saknar prod-/Airtable-seed-grind). STEG 1 CI grön per jobb (run `28384820694`).

### Teknisk skuld

**6g prod-deployad + auth-grind-bevisad** men EJ full-smoke-verifierad. **T40** vidgad: save-segment autentiserad happy-path mot prod ej körd (kräver prod-test-user via rätt kanal). **T39** skärpt: committad allowlist nu 10 → blind kanonisk `deploy-prod-functions.sh` skulle föra de 5 stale förbi verifierad version (override-smalt KRAV tills synk, L216). **6h** kvarstår (T44 M3: prod-Resend-nyckel + verifierad `miranon.dev`). **T46** go-live-karta materialiserad (6g-grenen LEVERERAD). Lessons **L215–L217** `[UNIVERSAL]` (hub-lyft pending — Fas 6). Deployen flippade EJ Fas 6.

### Filstruktur-snapshot (nytt/ändrat i Session 43)

```text
.prod-functions-allowlist.conf             (7→10: compute-segment/save-segment/get-segments)
docs/BUILD-LOG.md                          (Session 43-sektion)
docs/byggplan.md                           (§4 audit-status: 6g prod-deployad, additivt)
tasks/threads/T46-go-live-karta.md         (go-live-karta materialiserad)
tasks/threads/README.md                    (T39/T40 S43-noter + T46-not)
tasks/lessons.md                           (L215–L217)
```

PROD-EF:er deployade (ej i git — out-of-CI prod-handling): `supabase/functions/{compute-segment,save-segment,get-segments}` → ACTIVE v1 på `lvjsfnphlauldxqlncpl`.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-29-session-43.md`](../tasks/sessions/archive/2026-06/2026-06-29-session-43.md). **EJ fas-avslut; ingen lifecycle-flip** (session-end separat). Nästa: 6h prod-deploy (T44 M3) → T39/T40 → FULLT Fas 6-avslut.

---

## Session 44 — Fas 6h Mail PROD-DEPLOY: Reply-To (fas 1) + send-email skarp men sövd på prod (fas 2 A–E) (2026-06-29)

**Mål:** prod-deploya 6h-vertikalens `send-email`-EF så bulk-mail-vägen blir live ([byggplan §4 Fas 6h](byggplan.md)), efter att T44 M3:s Marcus-förkrav uppfylldes (prod-Resend-nyckel satt; `miranon.dev` verifierad i Resend som root, h5gruppen-kontot). Grindad sekvens (A–F) med STOPPA + rapport per grind. SESSIONSGRÄNS, EJ fas-avslut (Fas 6h öppen: T50 UI + Grind F + självtest; Fas 6 öppen: T39/T40).

### Fas 1 — Reply-To-stöd (secret-drivet) + staging-bevis

- **Kodändring (`346ffad`):** Reply-To saknades helt i `send-email`-payloaden. Lagt secret-drivet — ny `RESEND_REPLY_TO` läses precis som `RESEND_FROM`, men OPTIONAL (satt → `replyTo` (resend-node camelCase, context7-bekräftad) inkluderas; saknas/tom → utelämnas, nuvarande beteende bevarat). Payload-bygget extraherat till ren Node-importerbar `buildBatchPayload` i [`_shared/resend-batch.ts`](../supabase/functions/_shared/resend-batch.ts) (samma mönster som `parseBatchOutcome`) → api-pure testbar; `index.ts` är Deno-only.
- **Bevis:** 3 api-pure enhetstester (replyTo närvarande/utelämnad) + staging-deploy (`--project-ref pqtshyierkdgwdnxuirz`, `RESEND_REPLY_TO` staging-satt) + **17/17 live HTTP-kontrakt** mot deployad staging-EF (401/405/400 + SegmentNotResolvable). Fullt riktigt happy-path-utskick (200 + `emails.get` reply_to-värde) EJ kört — kräver efemär fixtur ej self-seedbar (**T45**); enhetstest = durabel emittering-bevisning, **T51** = människo-synlig end-to-end (Marcus självtest).

### Fas 2 — prod-deploy (grindad A–E; F flyttad)

- **Grind A (read-only):** live prod-tillstånd re-verifierat — prod-länk `●` = `lvjsfnphlauldxqlncpl`; Utskickslogg utan Idempotensnyckel; `RESEND_API_KEY` finns, `RESEND_FROM`/`RESEND_REPLY_TO`/`ENVIRONMENT` saknas; `send-email` ej i prod; ej i allowlist. Inga avvikelser.
- **Grind B (Airtable-skrivning #1):** prod-kolumn `Idempotensnyckel` (singleLineText, additivt) skapad på Utskickslogg `tblIesjbuSWNp6oxK` = **`fldXnfsdYxTB7PALv`** (9→10 fält, de 9 orörda, ingen data). Hård ordning kolumn FÖRE EF (§Kända fällor 37/38).
- **Grind C (secrets #2 — EJ ENVIRONMENT):** `RESEND_FROM` (= `Display Name <mail@miranon.dev>`) + `RESEND_REPLY_TO` satta på prod (`--project-ref` prod). Värde-fritt verifierat; `ENVIRONMENT` lämnad frånvarande.
- **Grind D (auto-trigger-verifiering, read-only):** ingen kod-väg avfyrar `send-email` automatiskt — enda anroparen `AirtableAdapter.sendEmail` → `SegmentMailCompose` `useMutation`, `.mutate()` endast i två uttryckliga `onPress`-handlers (bekräftelsedialog), ingen `useEffect`/cron/pg_cron/DB-trigger. Mot `data-model.md`: A1–A11 + dokumenterade Make-vägar når INTE vår EF (A6 = Airtable-native mail; transaktionella `send-email`-referenser = psionautics annat repo). Post-export-slivern (automationer efter JSON-export 2026-03-16) **bekräftad tom av Marcus direkt**. JWT-barriär (`requireUser`→401) = strukturell defense-in-depth.
- **Grind E (deploy #3 + read-only smoke):** `send-email` deployad **ACTIVE v1** på prod (ID `a47a8f5c…`, 19:10:46 UTC) via committad allowlist-deklaration 10→11 (`9c4bc38`) + smal `ALLOWLIST_FILE`-override (endast send-email; `--list`-dry-run bekräftade deploy-set = exakt 1). `_shared/resend-batch.ts` (fas 1) uppladdad. compute-segment EJ redeployad (synkad S43). READ-only smoke: anon GET→**401**, anon POST→**401** (auth-grind live; prod-gateway `verify_jwt` aktiv → 401 före 405; metod-grind staging-bevisad). Inget mail skickat.
- **Grind F — FLYTTAD (Marcus-beslut 2026-06-29):** `ENVIRONMENT=production` sätts FÖRST efter UI-härdningen (**T50**), så alla tre skyddslagren (idempotens + fail-closed-spärr + UI-bekräftelse) finns före första riktiga mottagare. Grind F + Marcus självtest (verifierar Reply-To live, **T51**) körs efter T50, EJ i Session 44.

### Verifiering

Fas 1: 3 api-pure + 17/17 live staging-kontrakt (CI run grön per jobb, `346ffad`). Fas 2: kolumn-skapelse schema-verifierad (10 fält); secrets värde-fritt verifierade; deploy dry-run + untouched-proof; READ-only smoke 401/401. **send-email skarp men SÖVD** (ENVIRONMENT frånvarande → fail-closed, vägrar varje riktig mottagare).

### Avvikelser / teknisk skuld

- **VERSION-kolumn-+1 (plattforms-artefakt):** `functions list` visade alla 11 pre-existerande EF:ers VERSION +1 medan UPDATED_AT stod stilla → Supabase version-räknare vid deploy-operation, EJ kod-redeploy. **UPDATED_AT (oförändrad) = kod-sanningen** (de 5 stale T39 kvar @ 2026-05-04). Samma mönster sågs S38→S43. Blast-radie kod = +1 (send-email).
- **Reply-To end-to-end ej körd** (fas 1) → **T51** (Marcus självtest).
- **Grind F + självtest kvar** → efter **T50** (UI-härdning, NÄSTA SESSIONS FOKUS).
- **T39/T40** oförändrat `paused` (Fas 6 closeout-förkrav). Lessons-backlogg L193–L218 EJ hub-lyft (pending efter FULLT Fas 6).

### Filstruktur-snapshot (nytt/ändrat i Session 44)

```text
supabase/functions/_shared/resend-batch.ts   (buildBatchPayload + ResendEmailSpec, fas 1)
supabase/functions/send-email/index.ts        (läser RESEND_REPLY_TO, anropar buildBatchPayload)
tests/api/resend-batch.test.ts                (3 buildBatchPayload-tester)
.prod-functions-allowlist.conf                (10→11: send-email)
tasks/sessions/archive/2026-06/2026-06-29-session-44.md        (Del 1 fas-plan + Fas 2-utfall; Del 2 landnings-kadens)
tasks/threads/README.md                        (T50–T52)
tasks/threads/T50-ui-hardning-sand-grind.md   (nytt tråd-kort)
docs/BUILD-LOG.md                              (Session 44-sektion)
tasks/lessons.md                               (L218)
```

PROD-handlingar (ej i git — out-of-CI prod-mutationer): Airtable-kolumn `Idempotensnyckel` (`fldXnfsdYxTB7PALv`) på prod-basen; prod-secrets `RESEND_FROM`+`RESEND_REPLY_TO`; `send-email` → ACTIVE v1 på `lvjsfnphlauldxqlncpl` (SÖVD, `ENVIRONMENT` ej satt).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-29-session-44.md`](../tasks/sessions/archive/2026-06/2026-06-29-session-44.md) (Del 1 + Del 2). **EJ fas-avslut; lifecycle-flip i do-confirm-passet.** Nästa: **T50** UI-härdning → Grind F (öppna spärren) → Marcus självtest (T51) → redo för Lotta; därefter Fas 6 closeout (T39/T40) → FULLT Fas 6-avslut.

---

## Session 45 — Fas 6h T50: härdad accident-proof sänd-grind (UI) (2026-06-29)

**Mål:** bygg UI-härdningen (**T50**) som gör ett oavsiktligt massutskick fysiskt omöjligt för en icke-teknisk användare (Lotta) — det TREDJE oberoende skyddslagret (UI-bekräftelse) utöver idempotensnyckeln + fail-closed-spärren, på plats FÖRE spärren öppnas ([byggplan §4 Fas 6h](byggplan.md)). Ren vy-ändring i `SegmentMailCompose` (ingen adapter/port/EF rörd). SESSIONSGRÄNS, EJ fas-avslut (Fas 6h öppen: Grind F + Marcus självtest; Fas 6 öppen: T39/T40).

### Commit 0 — hygien: T50-kortets stale beslut rättat (`e62c695`)

`[T50][T53]` — T50-kortet (`active` tråds bygg-ingång) bar stale "BESLUTAT: med" (test-till-sig-själv) som motsade Session 45:s reviderade scope. Rättat ÖPPET med kvittens FÖRE bygg-substansen (L219): "BESLUTAT: med" → DEFERRAD till **T53** (send-email segmentIds-only, ADR-067 consent-GOLV); avsändar-/Reply-To-visning utelämnad ur T50 (server-only secrets → Marcus självtest T51). Markdownlint 0.

### Commit 1 — bygget: härdad sänd-grind (`86835f9`)

`[T50][S45]` — den befintliga enkla bekräftelse-modalen UPPGRADERAD (ej parallellt flöde) till en härdad enstegs-modal (vertikalt: granska → skriv → knappar):

- **Granska-steg:** mottagar-ANTAL fokalt (störst visuell vikt, NN/g) + segment + ämne + plain-text mailförhandsvisning (`whitespace-pre-wrap`, bounded scroll, ALDRIG HTML-render) + oåterkallelighets-not.
- **Skriv-för-att-bekräfta:** Skicka låst tills `confirmText.trim() === String(recipientCount)` (GitHub type-to-confirm); exakta strängen synlig vid fältet; `confirmText` nollställs vid öppning/stängning (inget läckage); upplåsning aviseras i `aria-live`.
- **Faro-knapp** `intent="danger"` (fixar forensik-AVVIKELSEN `primary`→`danger`; label "Skicka till N personer", aldrig "OK") + **Avbryt** `ghost` spatialt separerad (`mr-auto` → motsatt ände, nås först via Tab; tryggt förval).
- **Bevarade golv** (kod-verifierat): pessimistisk UI, stabil idempotens orörd (confirmMatch rör aldrig nyckeln), auto-trigger-invariant (send endast från explicit `onPress`, ingen `useEffect`), server-side consent/resolve segmentIds-only, partial aldrig binär / accepted===0 aldrig grön.
- **Tester:** e2e (mockat send, ALDRIG live) — happy-path utökad med låst→fel→rätt→upplåst; 0-mottagar-block + accepted===0-gren locator-justerade.

### Verifiering

Lokalt: typecheck **0** · biome **0** · build grön · `test:api` **185 passed / 0 failed**. e2e lokalt EJ körbart (ADR-061 STAGING_REQUIRED — `TEST_USER`-creds saknas; Code provisionerade ej creds, isolations-/säkerhets-disciplin + T34) → **CI-verifierat**: push `ab474ba..86835f9`, **CI run `28400500605` ✅ success**; **e2e 114 passed / 0 failed** (de 3 härdade-modal-specerna gröna); **axe-0 på den härdade modalen** bekräftad (AxeBuilder wcag2a/aa+21/22 → 0 violations); 13 a11y passed. **Ingen deploy triggad** (workflow "CI" = enbart tester).

### arch-audit (ADR-058)

Ren — i ✅ (lager-oberoende; vyn når data endast via `useDataSource`, 0 kringgång) · ii ✅ (port-paritet 20/20/20 orörd — vy-only) · iii ✅ (`send-email` full EF1–EF6, oförändrad; noll EF rörd) · iv ✅ (golv hållet: NN/g-bekräftelse + säkerhets-invariant + axe-0; ingen spekulation: ingen för-tidig modal-extraktion) · v ✅ **11/10/10** (vy-ribban, ärligt satt). Inga AVVIKELSER.

### Avvikelser / teknisk skuld

- **Residual (ej AVVIKELSE):** Button-primitiven saknar ren `aria-disabled`-soft-disable → faro-knappen faller tillbaka på native `isDisabled` (tar låst knapp ur tab-ordningen). Beyond-golv-förfining (axe-0 redan mött via synlig knapp + fält-instruktion + aria-live) → registrerad **T54** `paused`.
- **Grind F + Marcus självtest kvar** → efter T50 (nästa session, T51).
- **T39/T40** oförändrat `paused` (Fas 6 closeout-förkrav). Lessons L193–L219 EJ hub-lyfta (pending efter FULLT Fas 6).

### Filstruktur-snapshot (nytt/ändrat i Session 45)

```text
src/components/segment/SegmentMailCompose.tsx   (härdad bekräftelse-modal: granska + type-to-confirm + danger + aria-live)
tests/e2e/mer-segment-send.staging.test.ts      (happy-path utökad: låst→fel→rätt→upplåst; locator-justeringar)
tasks/sessions/archive/2026-06/2026-06-29-session-45.md          (Del 1 scope; Del 2 landnings-kadens)
tasks/threads/T50-ui-hardning-sand-grind.md     (stale beslut rättat; active→closed)
tasks/threads/T53-test-till-sig-sjalv-skicka.md (nytt tråd-kort, paused)
tasks/threads/T54-button-aria-disabled-soft-disable.md  (nytt tråd-kort, paused)
tasks/threads/README.md                          (T53 + T54 indexrader; T50→closed)
docs/BUILD-LOG.md                                (Session 45-sektion)
tasks/lessons.md                                 (L219)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-29-session-45.md`](../tasks/sessions/archive/2026-06/2026-06-29-session-45.md) (Del 1 + Del 2). **EJ fas-avslut; lifecycle-flip i do-confirm-passet.** Nästa: **NY session** → Fas 6h closeout (Grind F öppnar spärren → Marcus självtest mot egen adress = första/enda skarpa utskick, verifierar Reply-To live T51) → redo för Lotta; därefter Fas 6 closeout (T39/T40) → FULLT Fas 6-avslut.

---

## Session 47 — Arbetssätt-spår: Pocock-integration (grillnings-mekanism i drift + konkordans stängd) (2026-06-30 → 2026-07-03)

**Mål:** integrera Matt Pococks AI-kodnings-arbetssätt i Chat/Code/Marcus-systemet utan att bryta det som fungerar (Del 1). Design-/process-session — ingen produktkod, ingen byggplan-fas berörd (SESSIONSGRÄNS, EJ fas-avslut). Kärnbeslutet (två-aktörs, ADR-068) förblir WIP under prövotid; count-tokens 67/67/67 orörda hela sessionen.

### Byggd substans (git-trail per Del)

- **Pocock-korpus vendorerad** (Del 4 `151817c`; plan-doket Del 8 `b610bf5`): `docs/reference/pocock/` — sammanfattnings-dok + kursnoteringar + 15 skill-kataloger + plan-djupa-moduler. Lint-exkluderingar i tre suiter (markdownlint `ignores` · lychee `--exclude-path` · Vale-sektion med komplett två-nyckels-mönster), CI-bevisade efter Del 5-detouren (`d1cc931` — lychee-cacheförgiftning avgiftad via `--cache-exclude-status '429'` + nyckel-bump).
- **ORDLISTA.md född governad** (Del 9, `4047605` + grind-svit-fix `19db2a5`): 16 poster (10 kärnobjekt + 6 flöden/distinktioner), frontmatter-allowlist 13→14, korsref i data-model.md, prose-grind-täckning.
- **Hub-plugin 1.4.0→1.6.0** (hub `9538572` Del 9 · `2ee63f7` Del 11 · legacy-arkivering `094f018`): nya skills grilling + grill-me (fork 1) och grill-with-docs (kompositionspunkt fork 2+3); ADR-barens kanoniska fulltext i grilling-kärnan; GRILLNING/ORDLISTA/ADR-BAR-NÄR-rader i hub-CLAUDE.md; spoke-pekare i `docs/decisions/README.md`; legacy-kursskills arkiverade (val A).
- **systemet.md §0-posten** (Del 15): kanonisk tracer-bullet-definition — fork 7:s enda bygge.
- **Trådar T56–T59 registrerade** (`8fcdd30` + Del 16 `e9eee5a`): plan-djupa-moduler (T56), issues-verktygsval (T57), hub-ADR-hemvist (T58), L149-mekanisering (T59).

### Design låst (dok-buren — bärs av sessionsdokets Delar tills ADR-068 Accepted)

Fork 1–7 färdiggrillade (grillnings-mekanismen · ordlistan · ADR-baren · PRD↔byggplan · prototype · diagnosing-bugs · tracer bullet som ledord) + bredd-svepet (Del 16: konkordans-statuskartan KOMPLETT — varje korpus-element KLAR eller explicit mottagare). Prövotid 7/7 defektfria körningar; /grill-with-docs 5/5.

### Verifiering

Alla landningar CI-gröna per commit (senast run `28682731539`, Del 16 `e9eee5a`). Docs-grindar per landning: markdownlint 0 · Vale 0 errors · check-lifecycle OK · frontmatter-sviten 14/14 (efter `19db2a5`). Hub-cache byte-identisk mot källa vid båda plugin-bumparna (L55-ritualen); omstarts-verifiering grön (8 skill-kataloger).

### Avvikelser / teknisk skuld

- **Fixtur-incidenten** (Del 9-addendum): två röda CI-runs innan grind-svitens fixtur bar ORDLISTA-raden → skördad som L225 ([[L147]]-datapunkt).
- **lychee-cacheförgiftning** (Del 5): transient 429 cachad som fel — enabling-detour med klass-fix, väg A.
- **Lessons L221–L225** skördade i spoke; hub-lyft PENDING nästa K-sista (L193–L225-backloggen).
- **Kvarstående bärare:** byggen på triggers (fork 4→T57-landningen; fork 5+6→UI-spårets start; invokerings-UX-mikrolandning, 4 datapunkter); migrerings-exekveringen (Del 3-kartan) = egna hub-sessioner; ADR-068-gradering = drift-metriken (p.8).

### Filstruktur-snapshot (nytt/ändrat i Session 47)

```text
docs/reference/pocock/**                         (vendorerad korpus: 34 filer Del 4 + plan-doket Del 8)
ORDLISTA.md                                      (född governad, 16 poster)
tasks/sessions/archive/2026-06/2026-06-30-session-47.md          (Del 1–16 + sessionsavslut)
tasks/threads/README.md                          (T56/T57/T58/T59-rader)
tasks/todo.md                                    (kadens-poster per landning/paus)
tasks/lessons.md                                 (L221–L225)
docs/decisions/README.md                         (ADR-bar-pekare, Del 11)
.markdownlint-cli2.jsonc / .vale.ini / .github/workflows/ci.yml  (pocock-exkluderingar + lychee-klassfix)
~/Repon/marcus-system (hub)                      (plugin 1.4.0→1.6.0: grilling/grill-me/grill-with-docs + NÄR-rader; 9538572 · 2ee63f7 · 094f018)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-06/2026-06-30-session-47.md`](../tasks/sessions/archive/2026-06/2026-06-30-session-47.md) (Del 1–16). **EJ fas-avslut; lifecycle-flip i do-confirm-passet.** Nästa: **NY session 48** via /session-start — kandidater per Del 16-kartan: T57-landningen (verktygsval → fork 4-bygge → do-work → TDD) / migrerings-hub-session 1 (Del 3 steg 1 + mät-apparat + handoff-klassning + invokerings-UX) / T56 (djupa moduler).

---

## Session 48 — T57-landningen: issues-substrat valt, testat och live (Backlog.md) (2026-07-04)

**Mål:** leverera T57 end-to-end — git-nativt issues-substrat för PRD-kort/skivor/do-work-kedjan (ADR-068 p.7): research-gated verktygsval via /grill-with-docs + minimal-test mot spoke-repot (Del 1 ordnad scope p.1–3; p.4 fork 4-bygget → NY session per Marcus-vägval väg 2). Ingen produktkod, ingen byggplan-fas berörd (EJ fas-avslut). Count 67/67/67 orörda; ADR-068 WIP.

### Byggd substans (git-trail per landning)

- **Session 48-dok fött** (`a6b602b`, ADR-043 skapande-gren) + **T60 registrerad** (`db3e9eb` — hub-ospårade transkript-kataloger, ADR-053-triage väg A).
- **Del 2 — grillningen** (`da5b176`): **Backlog.md LÅST som issues-substrat** (ADAPT; prövotids-dp8, /grill-with-docs körning 6, 8/8 defektfria körningar). Grenarna A–F låsta; DECLINE L30-durabla (GitHub Issues-molnspåret med 5 namngivna offer + återväckningsvillkor; noll-optionen per mattpocock/skills #203; steviee/taskmd/git-bug/beads/git-issue/veggiemonk på K1/K6); DEFER-karta → fork 4-bygget + do-work-landningen.
- **Substrat-instansen född** (`e106e7f`): `backlog/` toppnivå, backlog.md v1.47.1, integration none, `auto_commit`/`bypass_git_hooks`/`remote_operations` = false; K2-demo-kort task-1/task-1.1 (demo-tavla, städas vid fork 4-bygget).
- **Del 3 — minimal-testet 8/8 grönt + T57 STÄNGD** (`11c4783`): kriterie-tabell i Del 3; empiriska fynd (hierarkiska barn-ID:n `task-1.1` → matar fork 4:s mall-design; DoD-mekanismen annonserar sig live; export-path-quirken fångad + städad); T57 → `closed` i tråd-registret (levererad).

### Verifiering

Alla landningar CI-gröna PER JOBB: run 28698267109 (dok-födelse + T60) · 28714857004 (Del 2) · 28715068775 (Del 3 — **Test + Build KÖRDES och blev grönt**: pushen bar `config.yml` [icke-md] → full pipeline, starkare bevis än docs-only-skip). Docs link check körd + grön i samtliga. Lokala grindar per landning: markdownlint 0 fel (166 filer oförändrat = `backlog/` osedd), Vale 0 fel, check-lifecycle OK, check-frontmatter 14/14.

### Avvikelser / teknisk skuld

- **Export-path-quirken** (`board export` tolkar absolut sökväg projekt-relativt → skrev katalog i repot) — fångad av porcelain-disciplinen, städad omedelbart; ev. uppströms-rapport vid fork 4-bygget.
- **Hub-lyft:** L223–L227 LYFTA (hub `f573efd`: K47.1–3 + K48.1–2); **L193–L222-backloggen kvarstår PENDING** (utanför denna ends direktiv-scope; noterad i todo-huvudet).
- **Desktop-kopian av konkordans-statuskartan** förkastad som repo-artefakt (ADR-053 explicit; S47 Del 16 kanonisk; kopian stale — F4/F5 öppna där, låsta i Del 16).

### Filstruktur-snapshot (nytt/ändrat i Session 48)

```text
backlog/                                         (substrat-instansen: config.yml + task-1 + task-1.1)
tasks/sessions/archive/2026-07/2026-07-04-session-48.md          (Del 1–3 + sessionsavslut)
tasks/threads/README.md                          (T60 registrerad; T57 → closed)
tasks/todo.md                                    (kadens per landning + end)
tasks/lessons.md                                 (L226–L227)
~/Repon/marcus-system (hub)                      (lessons-lyft K47.1–3 + K48.1–2: f573efd)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-04-session-48.md`](../tasks/sessions/archive/2026-07/2026-07-04-session-48.md) (Del 1–3 + avslut). **EJ fas-avslut; lifecycle-flip i do-confirm-passet.** Nästa: **NY session 49** via /session-start — kandidater: **fork 4-bygget ÖVERST** (hub-plugin: to-prd/to-issues-adaptioner · PRD-kort-/issue-mallar [hierarkiska barn-ID-fyndet] · DoD-defaults + etikettvokabulär i config · agent-instruktionsrad · L225-grindfråga) / migrerings-hub-session 1 / T56 (djupa moduler).

---

## Session 49 — Fork 4-bygget: PRD-/skiv-mekaniken levererad end-to-end (hub 1.7.0 + spoke-substrat) (2026-07-04)

**Mål:** materialisera fork 4:s låsta design (S47 Del 12 + S48 Del 2 DEFER-karta) ovanpå T57-substratet — PRD-kort-/skiv-mekaniken som hub-mekanik (/to-prd + /to-issues + delad referens + NÄR-rad; plugin 1.6.0→1.7.0) + spoke-instans-konfiguration (DoD-defaults, etikettvokabulär, demo-städning, §0-terminologi, grind-legibility). Ingen produktkod, ingen byggplan-fas berörd (EJ fas-avslut). Count 67/67/67 orörda; ADR-068 WIP.

### Byggd substans (git-trail per landning)

- **Session 49-dok fött** (`b7b6a89`, ADR-043 skapande-gren) + **todo-kadens** (`3f5af42`).
- **Del 2 — preciseringen + hub-landningen** (spoke-dok `6da6463`; hub `e16add2`): delegerad kvittens VAL 1–3 + småbeslutsklumpen; round-trip-grinden GRÖN (sandbox 49b, städad); hub-plugin **1.7.0**: `skills/to-prd/` + `skills/to-issues/` (båda slash-only) + `references/issue-substrat.md` (femrolls-tabell med VILANDE-markering, kö-prioritering, QA-/uppföljningsmönster) + ISSUE-SUBSTRAT-NÄR-rad i hub-CLAUDE.md + **manifest-paret ATOMISKT** (plugin.json + marketplace.json, 8→10 skills); L55-ritualen körd, cache byte-identisk.
- **Substrat-instansen konfigurerad** (`28bc365`): `definition_of_done` 4 poster (VAL 1) + `labels` 3 roller (VAL 2, minimal aktivering) via CLI-sanktionerad direktredigering (sandbox-probe 49c); demo-korten task-1/task-1.1 arkiverade via `backlog task archive` (tavlan tom; `backlog/archive/tasks/`); systemet.md §0-post **Issue-substrat/PRD-kort/Skiva** (S48 terminologi-noten levererad; hook-bump `updated:`).
- **Grind-legibility-klustret** (`ca4482d`): EN kommentarrad per yta — markdownlint-globs · lint:prose-scopet (raden i .vale.ini, pekare till package.json) · frontmatter-allowlistan · lifecycle-scopet · lychee-args — "backlog/ medvetet utanför — verktygsägd yta (L226)"; L225-grinden helgrön, INGEN fixtur-spegling knäckt (tomt utfall).
- **Del 3-dok + todo** (`e8c8d93`): fork 4 design LÖST (S47 Del 12) → **BYGGD**; DEFER-kartans fork 4-poster levererade, rest = INGEN.

### Verifiering

CI-gröna PER JOBB: run 28716759005 (dok-födelse + todo) · 28717976844 (Del 2) · 28718721162 (p.3 — **Test + Build KÖRDA och gröna**: pushen bar icke-md-filer → full pipeline). Omstarts-verifieringen (trail-metoden): aktiv **1.7.0** (install-record + `claude plugin list`, gitCommitSha e16add2), **10 skill-kataloger** i cachen, **6 modell-synliga**, /to-prd + /to-issues slash-only (`disable-model-invocation: true`). L225-passet lokalt: frontmatter 14 docs + svit 14/14 · lifecycle + svit 16/16 · markdownlint 167/0 · Vale 0 fel/267 + regression 3/3 · yamllint 0 · shellcheck-strict 0.11.0/0 fynd · Biome 0 errors.

### Avvikelser / teknisk skuld

- **Marketplace-utökningen** = Chat-promptlucka (manifest-parets andra halva utanför promptens fil-lista) fångad av Codes trail-planering FÖRE utförandet (code-role-discipline §1.3) → skördad som **L228**.
- **Vale-legibility-radens hemvist:** scopet bor operativt i `package.json` `lint:prose` (JSON bär inte kommentarer) — raden lagd i `.vale.ini` med pekare dit (öppet redovisad form-anpassning).
- **actionlint saknas lokalt** — ci.yml-kommentaren täckt av CI-ledet (grönt); yamllint körd lokalt.
- **Hub-lyft:** L228–L229 LYFTA (hub `f0e62f2`: K49.1–2); **L193–L222-backloggen kvarstår PENDING** (utanför denna ends direktiv-scope; noterad i todo-huvudet).

### Filstruktur-snapshot (nytt/ändrat i Session 49)

```text
backlog/config.yml                               (definition_of_done 4 p + labels 3 roller)
backlog/archive/tasks/                           (task-1 + task-1.1 arkiverade; tavlan tom)
docs/reference/systemet.md                       (§0-post Issue-substrat/PRD-kort/Skiva)
.markdownlint-cli2.jsonc · .vale.ini · .frontmatter-policy.conf ·
scripts/check-lifecycle.sh · .github/workflows/ci.yml   (legibility-rader, L226)
tasks/sessions/archive/2026-07/2026-07-04-session-49.md          (Del 1–3 + sessionsavslut)
tasks/threads/README.md                          (T60-not: buntas med migrerings-hub-session 1)
tasks/todo.md · tasks/lessons.md                 (kadens + L228–L229)
~/Repon/marcus-system (hub)                      (plugin 1.7.0: e16add2; lessons-lyft K49.1–2: f0e62f2)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-04-session-49.md`](../tasks/sessions/archive/2026-07/2026-07-04-session-49.md) (Del 1–3 + avslut). **EJ fas-avslut; lifecycle-flip i do-confirm-passet.** Nästa (rättad 2026-07-04 — UI-först-ordningen riven av Marcus-pushback; se sessionsdokets korrigeringsnot): **NY session 50** via /session-start — **INTEGRATIONEN SLUTFÖRS FÖRST: do-work-landningen ÖVERST och ENDA huvudkandidat** (grillning via /grill-with-docs [prövotids-dp9] mot code-role-disciplinen + issue-substrat.md + Backlog.md-CLI:t; TDD-adaptionen [Del 15] + etikett-driven plockning som operativ kö ingår i grillningens grenar; bygge → hub-plugin 1.7.0→1.8.0). DÄREFTER S51: UI-spårets start = integrationens slutstation i drift — första skarpa hel-kedje-körningen /to-prd → /to-issues → do-work på riktig arbetsenhet (triggar fork 5+6-byggena [låst trigger] + första drift-metrik-matningen ADR-068 p.8). Inga produkt- eller sidospår före do-work. Städ-/mognadsskikt därefter: migrerings-hub-session 1 (inkl. T60 + invokerings-UX) / T56 / L193–L222-lyftet.

---

## Session 50 — do-work-landningen: /do-work levererad (grillning dp9 + hub 1.8.0) (2026-07-05)

**Mål:** integrationens sista kritiska station (Marcus-direktiv 2026-07-04, beroendekedjan T57 → fork 4 → do-work per S47 Del 16 F1 + S48 DEFER-karta): grilla do-work-mekaniken till samsyn mot code-role-disciplinen + issue-substrat-kontraktet + Backlog.md-CLI:t, och bygga den som hub-mekanik. Ingen produktkod, ingen byggplan-fas berörd (EJ fas-avslut). Count 67/67/67 orörda; ADR-068 WIP.

### Byggd substans (git-trail per landning)

- **Session 50-dok fött** (`6e24e72`, ADR-043 skapande-gren; drift-säkert datum styrde filnamnet → `2026-07-05-session-50.md`, skörd L231).
- **Del 2 — grillningen till samsyn** (`db04809`): /grill-with-docs körning 7, prövotids-dp9; STEG 0 besvarade 10 frågor via disk före första frågan; 7 grenar (C→A→B→D→E→F→G), sex låsta på första rekommendationen, gren E delegerad (senior-mandat) → härdning: obligatorisk rött-först-bevisrad. Beslut 1–7: kvitto-sömmen (§3.3 uppfylld uppströms av etikett + avfyrning), hub-hemvist utan ny spoke-artefakt, slash-only + oetiketterade uppföljnings-kort, mekaniskt plock-filter + ETT kort per invokering, TDD-delta + bevisrad, samma-commit-leverans + p.8-minimiform i final-summary, loop-redo gränser + INGEN ADR (baren öppet prövad: villkor 1 föll).
- **Hub-landningen** (hub `bf384e8`): `skills/do-work/SKILL.md` (11:e skillen, slash-only) + kontraktsraden i issue-substrat.md ("Konsumeras av /to-prd, /to-issues och /do-work") + **manifest-paret ATOMISKT** 1.7.0→**1.8.0** (L228-klustret) + NÄR-rads-utökning ISSUE-SUBSTRAT (exekverings-meningen); L55-ritualen (a)–(e) körd med grep-bevis (1.8.0-cachen: 11 skill-kataloger, "Kvitto-sömmen"=1, kontraktsraden=1, slash-only=5; install-record + plugin list → 1.8.0; äldre versionskataloger frusna).
- **Del 3 — spoke-landningen** (`fc17d0c`): systemet.md §0-post **do-work** (hook-bump `updated:` → 2026-07-05) + todo-kadens (L67).

### Verifiering

CI-gröna PER JOBB (docs-only → Test + Build by-design-skippade; Docs link check KÖRD + grön i samtliga): run 28731063449 (dok-födelse) · 28731796559 (Del 2) · 28731913830 (Del 3); avslutscommitens run-id redovisas i S50-avslutsrapporten. Lokala L56-paritetsgrindar före varje push: markdownlint 0/168 · Vale 0 fel · lifecycle OK · frontmatter 14/14. Omstarts-verifieringen av /do-work = nästa sessionsstarts A2-pass (förväntat: 1.8.0, 11 skill-kataloger, 5 slash-only inkl. do-work).

### Avvikelser / teknisk skuld

- **Filnamns-datumet** i start-direktivet (2026-07-04-...) stale över midnatt — fångat MEKANISKT av create-session-doc steg 5 (`date +%F`) → skördad som **L231** (direktiv-klädd tillståndsdata bär derivations-regel; L228-syskon på tidsaxeln).
- **Cache-vs-källa-editförsöket** (issue-substrat.md) fångat av Read-före-Edit-grinden före effekt — förkastad som lesson (verktygsmekanik utan beteenderegel), durabel i S50-trailen.
- **Hub-lyft:** L231 LYFT (hub `0fef62f`: K50.1, samma kadens-fönster); **L193–L222-backloggen kvarstår PENDING** (utanför denna ends direktiv-scope; noterad i todo-huvudet).

### Filstruktur-snapshot (nytt/ändrat i Session 50)

```text
docs/reference/systemet.md                       (§0-post do-work; hook-bump updated:)
tasks/sessions/archive/2026-07/2026-07-05-session-50.md          (Del 1–3 + sessionsavslut)
tasks/todo.md · tasks/lessons.md                 (kadens + L231)
~/Repon/marcus-system (hub)                      (plugin 1.8.0: bf384e8 — skills/do-work/SKILL.md,
                                                  issue-substrat.md, manifest-paret, CLAUDE.md NÄR-rad;
                                                  lessons-lyft K50.1: 0fef62f)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-05-session-50.md`](../tasks/sessions/archive/2026-07/2026-07-05-session-50.md) (Del 1–3 + avslut). **EJ fas-avslut; lifecycle-flip i do-confirm-passet.** Nästa: **NY session 51 via /session-start = UI-spårets start.** Ordning inom S51: (i) omstarts-verifiering i A2-passet (förväntat plugin 1.8.0, 11 skill-kataloger, 5 slash-only inkl. do-work), (ii) fork 5+6-byggena som AKT 0 före första /to-prd-körningen (prototype + diagnosing-bugs per låsta designer S47 Del 13/14; plugin-bump antagen 1.8.0→1.9.0, låses vid bygget), (iii) första skarpa hel-kedje-körningen /to-prd → /to-issues → /do-work på riktig arbetsenhet (UI-spåret registrerad kandidat för första PRD-kortet, beslutas där), (iv) första drift-metrik-matningen per gren F-minimiformen (ADR-068 p.8). Därefter städ-/mognadsskikt: migrerings-hub-session 1 (inkl. T60 + invokerings-UX) / T56 / L193–L222-lyftet. Mail sövt (T51/T53/T55); Fas 6-closeout-förkraven (T38/T39/T40) bärs vidare.

> **Korrigeringsnot (2026-07-05, post-close):** NÄSTA-ordningen supersederad av
> Marcus-direktiv + kvittens efter stängning — S51 = övnings-ramverkets
> inramnings-landning, S52 = UI-spårets start (oförändrat innehåll). Beslut +
> scope: tasks/todo.md § Session 51 — scope. Säkringspass-commit: denna.

## Session 51 — Övning 2 börjar här: övnings-ramverkets inramnings-landning (ADR-068) (2026-07-05)

> **Övning 2 börjar här** ([ADR-068](decisions/ADR-068-ovnings-ramverket.md),
> gränsnoten — medvetet flyttad hit från dp10-svepet till S51-posten):
> posterna ovanför är Övning 1 (session 1–50); denna och kommande poster är
> Övning 2. Historiska poster nämner inte övningarna — de läses genom
> ADR-068:s lins-not.

**Mål:** rama projektets historia som övningar (Marcus-direktiv + kvittens 2026-07-05 post-S50-close, kanoniskt säkrat i todo § Session 51 — scope): grilla de öppna grenarna till samsyn (dp10) och applicera ramen — inramnings-ADR + dok-svep över levande målytor + restlista-reparation. Ingen produktkod, ingen byggplan-fas berörd (EJ fas-avslut). Count 67→68 (ADR-068 mintad).

### Byggd substans (git-trail per landning)

- **Session 51-dok fött** (`00468d9`, ADR-043 skapande-gren; drift-säkert datum per L231; A-passet grönt inkl. A2-omstartsverifieringen av plugin 1.8.0: 11 skill-kataloger, 5 slash-only).
- **Del 2 — dp10-grillningen till samsyn** (`8978180`): /grill-with-docs körning 8, prövotids-dp10; STEG 0 löste huvuddelen via disk; 4 frågor, 2 senior-mandat (G1, F1), 2 egna val (T57 orörd, helheten); samsyn "Jag kvitterar.". Beslut: G1 terminologi-drifthem = systemet.md §0 (kanonisk-plats-par med ADR:n); G2 Fas E ÄR Övning 2:s namngivna slutfas (additiv märkning, ingen ny fas); G3 träffyta klassad (T57-raden orörd; hub noll träffar); G4 inga mall-pekare; F1 README-staleness → klass-lösning A+B+C (avduplicering — byggplan §2 enda status-ägare; under ADR-baren).
- **ADR-068 mintad** (`21142b1`): övnings-ramverket (Accepted, Projekt-grundande) — epok-linjalen (Experimentet (Vue) → Övning 1 S1–50 → Övning 2 S51→), nivå-hierarkin, terminologin + hemvisterna, Vue-repot referens-only, Fas E-slutfasen, lins-noten i två skikt. Count 67→68 ATOMISKT på tre bärare; check-adr-count grön.
- **Dok-svepet + G3-omdöpningen** (`bd5cd90`): README-berättelsen överst + F1-avdupliceringen (status/fokus → byggplan §2-pekare); byggplan-ramrubrik + Fas E-märkning + v1.13; systemet.md §0-post "Övnings-ramverket" + §11-rad; todo-/tråd-huvuden; nummer-neutral omdöpning ("två-aktörs-ADR:n (WIP)"; T57-raden + citat-klass orörda).
- **L4 — restlista-reparationen** (`5d88e6f`): integrations-restlistans 3 bärarlösa element + graderings-triggern fick levande bärare (migrerings-buntens 5 poster namngivna i todo; AFK/Ralph-loop + sandbox som egen post med ARMERAD trigger; WIP-markören bär graderings-triggern; tråd **T61** registrerad rad-först). Rotorsak durabel i sessionsdokets Del 4: klumprad-degraderingen S49→todo.

### Verifiering

CI-gröna PER JOBB (docs-only → Test + Build by-design-skippade; Docs link check KÖRD + grön i samtliga): run 28734895802 (dok-födelse) · 28741201590 (Del 2) · 28741321827 (ADR-068) · 28741469055 (dok-svepet) · 28742115061 (L4); avslutscommitens run-id redovisas i S51-avslutsrapporten. Lokala grindar före varje push: markdownlint 0 fel · Vale 0 fel · lifecycle OK · frontmatter 14/14 · check-adr-count 68==68. Post-svep-grep: "ADR-068" i levande ytor = endast övnings-ramverks-betydelsen + två beslutade undantag (todo-scope-citatet + T57-radens historik, per lins-notens skikt ii).

### Avvikelser / teknisk skuld

- **Två lint-fångster FÖRE push** (aldrig i CI): MD004 (radbrytning gjorde fortsättningsrad till plus-lista i ADR-texten) + MD028 (två intilliggande blockquotes i byggplan-prologen → sammanslagna till en). Båda fixade lokalt.
- **Restlista-fyndet** (read-only-läspass mellan dok-svepet och L4): 3 bärarlösa integrationselement + 1 halv-saknad graderings-trigger — reparerade i L4; rotorsaken (klumprad-degradering) skördad som L232, post-close-fönstret som L233.
- **Hub-lyft:** L232–L233 LYFTA (hub `f665e1f`: K51.1–2, samma kadens-fönster; manuell updated:-bump per L221); **L193–L222-backloggen kvarstår PENDING** (utanför denna ends direktiv-scope; noterad i todo-huvudet).

### Filstruktur-snapshot (nytt/ändrat i Session 51)

```text
docs/decisions/ADR-068-ovnings-ramverket.md   (NY — epok-ramen, Accepted)
docs/decisions/README.md                      (katalograd 068 + bar-blockquoten nummer-neutral)
README.md                                     (berättelsen överst; status/fokus → §2-pekare; räknerad 68)
docs/byggplan.md                              (ramrubrik + Fas E-märkning + v1.13)
docs/reference/systemet.md                    (§0-post Övnings-ramverket + §11-rad)
tasks/todo.md · tasks/threads/README.md       (huvuden + G3 + restlista-reparationen + T61)
tasks/sessions/archive/2026-07/2026-07-05-session-51.md       (Del 1–4 + sessionsavslut)
tasks/lessons.md                              (L232–L233)
~/Repon/marcus-system (hub)                   (lessons-lyft K51.1–2: f665e1f)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-05-session-51.md`](../tasks/sessions/archive/2026-07/2026-07-05-session-51.md) (Del 1–4 + avslut). **EJ fas-avslut; lifecycle-flip i do-confirm-passet.** Nästa: **NY session 52 via /session-start = UI-SPÅRETS START.** Ordning inom S52: (i) fork 5+6-byggena som AKT 0 före första /to-prd-körningen (bump antagen 1.8.0→1.9.0), (ii) första skarpa hel-kedje-körningen /to-prd → /to-issues → /do-work på riktig arbetsenhet (UI-spåret registrerad kandidat som FÖRSTA PRD-kort, beslutas vid start), (iii) första drift-metrik-matningen (gren F-minimiformen). Därefter städ-/mognadsskikt: migrerings-hub-session 1 (S47 Del 3 steg 1 [rigor-migreringen] + mät-apparaten + handoff-klassningen [migrerings-Decision A] + invokerings-UX + T60) / AFK/Ralph-loop + sandbox (T61, trigger armerad; egen landning, Marcus-takt — naturlig evidensgrind: S52:s hel-kedje-körning + drift-metriken) / T56 / L193–L222-lyftet. Mail sövt (T51/T53/T55); Fas 6-closeout-förkraven (T38/T39/T40) bärs vidare.

## Session 53 — T62: lifecycle-verbens Code-körbarhet (ADR-069 + plugin 1.10.0) (2026-07-05)

> Ren process-/hub-session (ingen produktkod, ingen byggplan-fas berörd — EJ
> fas-avslut). Marcus-sekvensens steg 1, körd MELLAN paus och resume av
> session 52 (S52:s BUILD-LOG-post skrivs vid dess end). Count 68→69.

**Mål:** lifecycle-verben paus/resume avfyrbara från Code-ytan (T62; premiss-skifte: sessioner körs i sin helhet på Code-ytan, S52/S53-precedenten) — öppen rivning av ADR-043 b5 + ADR-051 b2 och amendering av ADR-041 b2, grillad till samsyn före bygge (sessionsdok Del 2 = kanonisk plats, 7 beslut).

### Byggd substans (git-trail per landning)

- **Session 53-dok fött + T62-flipp** (`9f2edec` + `bf18b61`): skapande-grenen körd med Marcus-kvittens direkt i Code-terminalen (T62-premissdatapunkt, bokförd i dokets blockquote); T62 `paused`→`active`.
- **Del 2 — grillningen till samsyn** (`37b1e21`): /grill-with-docs (Marcus-avfyrad; CHAT-SEED (d)–(i) + Code-ytans forkar (a)–(c)); STEG 0-diskpass prövade varje seed-punkt mot faktisk skill-text FÖRE intervjun (seed d delvis falsifierad — lessons-läsningen redan täckt; transcript-fyndet nytt). 7 frågor, 7 kvittenser.
- **Hub-bygget** (hub `35a6233`): session-paus + session-resume Code-halvor (egna kataloger; resume refererar start-LÄS-fasen; vägvals-/intentions-STOPPA-grindar per designprincip f) + start/end-kompletteringspaketet 2–6 + manifest-PARET atomiskt 1.9.0→1.10.0 (13→15 skills, MINOR per L55-precedensen; L228).
- **L55-ritualen grön**: (a)–(e) kompletta; 15 kataloger i 1.10.0-cachen, nyckelfras-grep träffar rätt filer, hub==cache byte-identisk, install-record 1.10.0. **Omstart = Marcus-moment EFTER denna sessions end** (beslut 7); aktiverings-verifiering sker i S52-resume-öppningen.
- **ADR-069 mintad + Updates-noter** (`e9013f7`): "Lifecycle-verbens Code-körbarhet" (Accepted; 7 beslut + designprincip f + operativ sekvens + öppna förkastanden inkl. subagent-verifieraren) + additiva Updates-noter i ADR-041/043/051 (frysta texter orörda, L53) + count 68→69 atomiskt (fil + katalograd + rot-README).
- **Del 3 + avslutspasset** (`0fb3368` + denna landning): byggets bokföring, L234-skörd, BUILD-LOG-posten, T62 `active`→`closed`.

### Verifiering

CI-gröna PER JOBB (docs-only → Test + Build by-design-skippade; Docs link check KÖRD + grön i samtliga): run 28752512900 (dok-födelse) · 28752540221 (T62-flipp) · 28753298477 (Del 2) · 28753598738 (ADR-klustret) · 28753635781 (Del 3); avslutscommitens run-id redovisas i avslutsrapporten. Lokala grindar före varje push med OPIPAD exit: markdownlint 0 fel · Vale 0 fel · check-adr-count 69==69 · audit-ci grön vid start. Hub saknar CI-grind; de 3 default-lint-fynden i create-session-doc.md verifierades pre-existerande vid HEAD (0 nya).

### Avvikelser / teknisk skuld

- **Skill-verktygs-vägran på slash-only-skill** (grillnings-avfyrningen): hanterad via manuell cache-läsning med öppen notering, skördad som L234 `[UNIVERSAL]`.
- **Pipe-maskerad grind-exit-instans** (hub-lintpasset, fångad och omkörd med bevarad exit): datapunkt till S52:s skörd-kandidat "grind-exit får aldrig pipe-maskeras" (skördas vid S52:s end — kandidaten ägs där).
- **Lesson-kandidat förkastad EXPLICIT:** designprincip f:s generativa fråga som egen lesson — buren i sin helhet av ADR-069 beslut 5; lesson vore duplicering (decline-rationale i sessionsdok Del 4).
- **Hub-lyft:** L234 EJ hub-lyft (pending nästa hub-sync-moment; L193–L222-backloggen kvarstår).

### Filstruktur-snapshot (nytt/ändrat i Session 53)

```text
docs/decisions/ADR-069-lifecycle-verbens-code-korbarhet.md   (NY — Accepted)
docs/decisions/ADR-041-/043-/051-*.md         (+Updates-noter, frysta texter orörda)
docs/decisions/README.md                      (katalograd 069 + Updates-hänvisningar 041/043/051)
README.md                                     (räknerad 69)
tasks/sessions/archive/2026-07/2026-07-05-session-53.md       (NY — Del 1–4)
tasks/todo.md · tasks/threads/README.md       (S53-sektion + T62-flipp ×2)
tasks/lessons.md                              (L234)
~/Repon/marcus-system (hub 35a6233)           (skills/session-paus + session-resume NYA;
                                               session-start + create-session-doc +
                                               session-end kompletterade;
                                               plugin.json + marketplace.json 1.10.0)
```

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-05-session-53.md`](../tasks/sessions/archive/2026-07/2026-07-05-session-53.md) (Del 1–4). **EJ fas-avslut; lifecycle-flip efter Marcus-kvittens av coverage-rapporten (ADR-069-grinden, dogfoodad).** Nästa: **omstart (Marcus, aktiverar 1.10.0) → /session-resume SESSION 52** (resume-Code-halvans skarpa första-bruk) → /to-issues på TASK-1 → /do-work + första drift-metrik-matningen → S52 end-prövning.

---

## Session 52 — UI-spårets start: första skarpa hel-kedje-körningen — TASK-1 komplett (Hem-uppgraderingen) + drift-metrik-matning 1–5 (2026-07-05 → 2026-07-06)

> UI-/produktkod-session (EJ fas-avslut; byggplans-faserna orörda — UI-spåret
> är Övning 2-arbete ovanpå levererade vyer). TVÅ pauser + resume-cykler per
> ADR-051 (numret 52 bevarat; resume-Code-halvans FÖRSTA-BRUK, ADR-069 b7).
> Mellansessionen S53 (T62/ADR-069/plugin 1.10.0) kördes mellan paus 1 och 2.
> Count 69 orörd (ingen ny ADR — graderings-prövningen mintade medvetet inget).

**Mål:** UI-spårets start (scope Del 1): AKT 0 (fork 5+6 → plugin 1.9.0) → första skarpa hel-kedje-körningen /grill-with-docs → prototyp-pass → /to-prd → /to-issues → /do-work per kort → drift-metrik-matningarna (två-aktörs-ADR:ns evidensgrind) → end-prövning.

### Byggd substans (git-trail per landning)

- **AKT 0 + grillning + prototyp + PRD + skivning** (Del 2–6; paus-/resume-cykel 1): hub 1.8.0→1.9.0 (`9a747a1`); Hem-pilotens grillning till samsyn; prototyp A/B/C på /hem (`bf705f2`, [PROTOTYPE]-märkt, raderad per kontrakt — A-skelettet vann); TASK-1 publicerat via /to-prd (`ad44051`) + skivat 1.1–1.5 via /to-issues.
- **task-1.1 — namnkällan** (`6ef4ea8` + `0c96f4c`): TDD; `AuthUser.displayName` ur user_metadata; e-post ALDRIG fallback. Fjärrskådnings-incidenten (60 ZZ-sentinel-event → sviten 47 s) → väg A-städning + TASK-2 + ADR-060-not (`9b221d2`). Drift-metrik-matning 1.
- **TASK-2 — O(1)-fixtursökningen** (`13bb905` + `c0aa615`): get-attendance-conformance immun mot event-ackumulering; test:api 290 passed. Matning 2.
- **task-1.3 — Hem till A-skelettet** (`a8afcf9` + `bcf0db1`): 7 hem-komponenter NYSKRIVNA mot bf705f2-facit; hälsningen = h1 (AC #6); helkorts-stretched-link; "Utan event"-fallback; NOLL nya tokens; e2e-TDD 10 röda → 13/13. Design-review godkänd; Marcus helhets-designiteration → **T65**; fynd → **TASK-3** (`b3fa9b7`). Matning 3. **T66** (prototyp-tvåfas-generaliseringen, `455b7ca`).
- **task-1.4 — samlade anmälningslistan + CTA** (`7f629f2` + `aa3434a`/`76785b5`): AnmalningarList på /mer/anmalningar (registrations.all utanför polling-scopet; DRY-lyft registration-display.ts); Hem-CTA → "Visa alla anmälningar". TDD 7 röda → 24/24; full svit 125. Matning 4.
- **task-1.2 — tabbaren till FK-mönstret** (`32776d2` + `c0016a4` + `0abe67b`): ikon + etikett (lucide, domänbegrepps-val) + FLYTANDE kapsel + bred aktiv-pill i NY semantisk token `--mm-bg-emphasized` — L220-loopens första FLERVARVS-granskning (3 varv). Matning 5.
- **QA task-1.5 + TASK-1-stängningen** (`7e64bd9`): Marcus 11/11 punkter i browsern, 0 fynd; PRD-föräldern Done — repots FÖRSTA skarpa PRD-kort komplett.
- **End-passet** (denna landning): graderings-prövningen + lessons L235–L242 + BUILD-LOG + Del 11.

### Graderings-prövningen (scope p.5 — öppet utfall)

Två-aktörs-ADR:ns evidensgrind (beslut 8: CI-grön-första-pass/defekt-rate) prövad mot drift-metrikens 5 matningar: första-pass 4/5 ja (enda nej = orelaterad miljö-incident, dokumenterad); defekter i kort-scope 0/5; TDD-cykler bevisade rött→grönt per produktkort; L220-loopen fungerade i drift (inkl. flervarvs); QA 11/11 utan fynd. Marcus-utlåtande i sessionen: "arbetssättet har funkat bra". **Utfall: evidensgrinden PASSERAD → migrerings-hub-sessionerna öppnade** (utfasningskartan S51: rigor-migreringen först, systemet.md sist, arkivera-inte-radera). **Ingen ADR mintad i dag** — Accepted-graderingen ligger per kartan + beslut 8 EFTER apparat-migreringen (numret tas då, nummer-neutralt tills dess; L241).

### Verifiering

Samtliga pushar CI-gröna per jobb (produktkods-commits inkl. Test + Build; enda röda passet = MD032-fallet `aa3434a`, fixat `76785b5` inom minuter — rotorsaken pipe-maskerad lokal grind, skördad som L235). Lokala grindar per landning: typecheck (src + tests), Biome 0 fel, build, e2e-sviten (full svit 124–125 passed per kort), axe-baselines 0 på samtliga vyer. Staging-data verifierad i QA-passet.

### Avvikelser / teknisk skuld

- Loading-state-testens delayMs-fönster lastkänsligt (3 filer) — pre-existing, stash-belagt, härdnings-spec på **TASK-3** (oetiketterat, Marcus klassar).
- T64 (purge-cred-vägvalet) vilar på Marcus-beslut; T65 (Hem-designiterationen) + T66 (prototyp-skill-uppdateringen, hub-materia) registrerade `paused`.
- Lessons-hub-lyftet (L193–L242-klassen) PENDING till hub-/migrerings-session (lessons-hub-sync).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-05-session-52.md`](../tasks/sessions/archive/2026-07/2026-07-05-session-52.md) (Del 1–11 + två Paushistorik-block). **EJ fas-avslut; lifecycle-flip efter Marcus-kvittens av coverage-rapporten (ADR-069-grinden).** Nästa: **NY session (nästa lediga nummer per disk, antagen 54) = migrerings-hub-session 1** (rigor-migreringen + mät-apparaten + handoff-klassningen + invokerings-UX + T60 + lessons-hub-lyftet; T66-skill-uppdateringen kan buntas) — alternativt Marcus-vald: T65 (efter brödsmulor/shell), T61 (AFK-loop), TASK-3, T64-vägvalet.

## Session 54 — MIGRERINGS-HUB-SESSION 1: rigor-migreringen + backlogg-lyftet + plugin 1.11.0 + T60 (2026-07-06)

> Migrerings-/hub-session (EJ fas-avslut; byggplans-faserna orörda — utfasningskartans
> exekvering, öppnad av S52:s graderings-prövning). Mestadels hub-skrivningar; ingen app-kod.
> Ingen ADR mintad (Accepted-graderingen av två-aktörs-ADR:n [WIP] ligger efter
> apparat-migreringen; count 69 orörd, L241).

**Mål:** första exekverings-sessionen av migrerings-kartan (S47 Del 3): steg 1 rigor-migreringen + migrerings-buntens poster (lessons-hub-lyftet, T66-skillen, invokerings-UX, mät-apparaten, handoff-klassningen, T60).

### Byggd substans (git-trail per landning)

- **Dok-födelse** (spoke `415a360`): S54-doket fött, run 28803186379 grön per jobb.
- **Rigor-migreringen** (hub `731aa9f` + spoke `3ed2bda`; Del 2): täcknings-matrisen (hela Migrera-klassen disk-prövad — 8 TÄCKT, lifecycle-delen redan klar via ADR-069) + gap-stängningen: code-role-discipline v1.0→v1.1 (datum-invarianten §1.4 + governing/non-governing-verifieringen §1.5) + 3+-branschledar-kvantifieraren med ärlighetsklausul i konstitutionens web-research-rad (Marcus-pushback rev Code-förslagets avstå-klassning → L243). Steg 1-beviset för kartans steg 3 (retirera) på plats. Mekanik-fynd: `~/.claude/CLAUDE.md` är symlink till hub-CLAUDE.md — konstitutions-synken strukturell.
- **Lessons-hub-lyftet** (hub `faf6806` + spoke `2b9b066`; Del 3): backloggen S35–S53 → 38 [UNIVERSAL]-poster som K35.1–K53.1 under samlings-H2 (agent-delegerad transformation + skript-buren verbatim-verifiering FÖRE append — 0 innehållsfel; 22 stale pending-svansar strippade öppet; spoke-L203-dubblettkorruptionen rättad). **Hub-lyft-skulden NOLL.**
- **Hub-skill-bunten** (hub `6272336` + spoke `2fe342b`; Del 4): plugin 1.10.0→1.11.0 (manifest-paret atomiskt, L228) — T66 prototyp-tvåfasen (divergens → konvergens från EXAKT kopia → skarpt NYSKRIVET; punkterna a–c; web-förankrad: Double Diamond + NN/g parallel+iterative) + invokerings-UX-README:n (5 laddningsvägs-regler, laddningsvägarnas kanoniska hemvist). L55-ritualen grön (install-record 1.11.0, gitCommitSha == hub-HEAD). T66 → `closed` med aktiverings-förbehåll.
- **p.5 + p.6** (hub `d052ebd` + spoke `c165bdd`; Del 5): mät-apparaten — "full apparat" klassad ÖVERSPELAD av drift-beviset (S50-minimiformen ÄR apparaten; beskrivningen → två-aktörs-ADR:n vid minting); handoff-klassningen (migrerings-Decision A) bokförd LEVERERAD via T62/ADR-069 med steg 3-residualerna klassade; T60 väg (b): Odoo Events-bearbetningen → `research/` (54 filer git-skyddade), rådatan gitignorerad — **hub-trädet HELT RENT** → T60 `closed`.
- **End-passet** (denna landning): L243–L244 skördade + hub-lyfta samma session (K54.1–2, hub `fb52a0c`); sessionsdok Del 6; denna post.

### Verifiering

Samtliga spoke-pushar CI-gröna per jobb FÖRSTA passet (runs 28803186379 / 28804212250 / 28805689248 / 28806455314 / 28806885209 + end-commitens run; docs-only → Test+Build by-design-skippad, Docs link check körd + grön per run). Hubben saknar CI (T13) — varje hub-commit läs-tillbaka-verifierad mot HEAD-blob (L239) + L55-ritualen vid bumpen + skript-buren fidelitets-verifiering vid lyftet. Lokala grindar per landning: markdownlint 0 fel + Vale 0 fel, nakna exits (L235).

### Avvikelser / kvarvarande

- **OMSTART PENDING** (Marcus-moment) — aktiverar plugin 1.11.0; aktiverings-verifiering vid nästa sessionsstart.
- Kartans steg 2 (Decision B: code-role-discipline §4.1/§5), steg 3 (retirera relä-apparaten — steg 1-beviset klart i Del 2), steg 4 (omskriv, systemet.md SIST) + Accepted-graderingen av två-aktörs-ADR:n = senare migrerings-sessioner.
- T64 (Marcus-vägval) / T65 (Hem-konvergensen — blir första T66-konvergens-passet) / TASK-3 (oetiketterat) oförändrade; mail sövt (T51/T53/T55); Fas 6-closeout-förkraven (T38/T39/T40) bärs vidare.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-06-session-54.md`](../tasks/sessions/archive/2026-07/2026-07-06-session-54.md) (Del 1–6). **EJ fas-avslut; lifecycle-flip efter Marcus-kvittens av coverage-rapporten (ADR-069-grinden).** Nästa: **NY session (55)** — produktspåret (T65 / nästa vy-PRD / TASK-3-klassning / T64-vägval / T61) eller migrerings-hub-session 2 (kartans steg 2+3) — Marcus väljer.

---

## Session 55 — T65 Hem-konvergensen: K10 låst som FACIT efter 10 iterationssteg (2026-07-06 → 2026-07-07)

> Produktspårets designsession (EJ fas-avslut; byggplans-faserna orörda). Första
> T66-konvergens-passet — prototype-skillens (1.11.0) konvergens-form i skarpt första-bruk.
> Ingen ADR mintad (allt under baren: designbeslut bor i facit-specen/kortet; count 69 orörd).

**Mål:** T65 Hem-designiterationen — konvergens-prototyp från EXAKT kopia av faktiska Hem-vyn, Marcus-iteration till HELT nöjd, designlåsning.

### Byggd substans (git-trail per landning)

- **S55-öppningen** (`7b292be` + `c1dce4b`): dok-födelse + T65-flipp + T66-aktiverings-förbehållet INFRIAT (plugin 1.11.0 verifierad: install-record == hub-HEAD, tvåfas-sektionen live).
- **K1 exakt-kopia-baslinjen** (`4d48f84`): BEVISAD byte-identisk (cmp på main-element-skärmdumpar) mot skarpa vyn; bf705f2-mekaniken återupplivad (växlare, DEV-grind, devtools-gömning).
- **Iterationsvarven K2–K10** (`d0001bd` → `bb31a12`, Del 3–11): designdumpen (18 punkter, klassad A–D) + åtta feedback-varv — slutformen i Del 12. Nyckelfynd på vägen: olagrad base.css h1–h6-regel besegrar färg-utilities (3 varv "ingen färgskillnad"; @layer-byggkrav); omladdnings-kravet dumprevideraret blur→HELT osynlig (stale-while-revalidate, byte-identiska före/under/efter-bevis); FK-referenserna IMG_1538/1539 som designfacit.
- **SVAR-FÅNGSTEN + designlåsningen** (`08548c9`, Del 12): K10 = FACIT (Marcus-kvittens: "prod-vyn ska se EXAKT likadan ut"); facit-spec + byggkravs-slutlista (B1–B7 + 2 nya) som kort-input; skärmdumps-bilagor (`tasks/sessions/bilagor/s55-hem-konvergens/`) säkrade FÖRE radering.
- **Prototyp-raderingen** (`8c0537f`, klausul iv): K1–K10 + växlaren + shell-granskningsläget bort; hem.tsx/__root.tsx/AppShell.tsx återställda BYTE-IDENTISKT (0 diff mot `c1dce4b`); återupplivningsväg `bb31a12` (worktree, S52-precedentet).

### Verifiering

Samtliga pushar CI-gröna per jobb (kod-commits inkl. Test + Build; docs-only by-design-skippade Test+Build med Docs link check körd). EN CI-incident (runs på `a348816`/`6178ba7` röda): osorterade klasser — rotorsak pipe-maskerad lokal Biome-exit (L235-egen-instans); fix `60c9fd2` grön. Iterationerna computed-style-/boundingbox-asserterade i browsern mot staging (Del 6-metodfyndet), inte okulärt bedömda.

### Avvikelser / kvarvarande

- Skörden L245–L247 (alla [UNIVERSAL]: dump-som-checklista, renderad-verifiering, beteende-är-prototyp-materia) + hub-lyft K55.1–3.
- T65 `active`: design LÅST — kortet föds vid /to-prd (facit-specen Del 12 som input) → skarpt NYSKRIVET bygge genom leverans-grindarna (NY session).
- Klass C-spåren (Del 3/12): scrollbar-gutter-kortkandidaten, headerns öde app-brett, devtools-gaten, versionskällan; klass D: Mina sidor-ytan, xAPI → Fas 6.5.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-06-session-55.md`](../tasks/sessions/archive/2026-07/2026-07-06-session-55.md) (Del 1–13 + bilagor). **EJ fas-avslut; lifecycle-flip efter Marcus-kvittens av coverage-rapporten (ADR-069-grinden).** Nästa: **NY session (56)** — /to-prd på T65-facit → skivning → skarpt Hem-bygge.

---

## Session 56 — T65-kortfödseln: TASK-4 fött + skivorna 4.1–4.2 → PAUS; administrativt stängd i S73 (2026-07-07; stängd 2026-07-19)

> ADMINISTRATIV POST skriven vid S73 Del 2 (2026-07-19) — S56 pausades
> 2026-07-07 (Marcus: "kör paus") och nådde aldrig session-end; posten är
> rekonstruerad ur paus-blocket + backloggen för kronologisk läsbarhet.

**Commit-range:** dok-födelse → `12ca4b5` (paus-landningen). **Mål:** T65-kortfödseln — /to-prd på K10-facit → skivning → skarpt Hem-bygge (Fas 6d-ytan; ej fas-avslut).

- **Levererat i S56:** TASK-4 "PRD: Hem-vyn till K10-facit" fött (/to-prd, S52-processmönstret: facit-specen S55 Del 12 som input, ingen ny intervju) + skivningen (/to-issues) + task-4.1 @layer base-flytten **Done** (`c89a277`) + task-4.2 Hem-strukturen till facit **Done** (`9189cb5`; design-review Marcus-godkänd första varvet, skal-scopet).
- **PAUS efter 4.2** (ADR-051-formen, Marcus-kvittens "kör paus"; parallellkörningen S57 ∥ S56 pågick). KVAR (4.3–4.6) levererades senare på andra ytor: 4.3+4.4 S61 (AFK-batch-piloten) · 4.5 S62 (batch 3) · QA 4.6 S64/S67 (QA-vågen). TASK-4 helt **Done** (inkl. efterfödda 4.7).
- **Administrativ stängning S73 Del 2 (2026-07-19):** `lifecycle: paused → closed` · skörd **L292–L293** [UNIVERSAL] ur paus-blockets kandidater (precedens-ändring aktiverar latent död konfiguration — inventera vad som VINNER · "min diff grön" ≠ "min run grön" — CI dömer hela trädet vid din SHA) · T65-registerraden `closed` med leverans-not · ingen full retrospektiv (öppet bokfört i dokets stängnings-sektion).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-07-session-56.md`](../tasks/sessions/archive/2026-07/2026-07-07-session-56.md) (Del 1–5 + PAUSLÄGE-historik + stängnings-sektion). **EJ fas-avslut.**

---

## Session 57 — MIGRERINGS-HUB-SESSION 2: kartans steg 2+3 + steg 4-grillningen (2026-07-07)

> Process-/hub-session (EJ fas-avslut; byggplans-faserna orörda). SYSTEMETS
> FÖRSTA SAMTIDIGT-AKTIVA PARALLELLKÖRNING (S57 ∥ S56, samma checkout) —
> piloten för parallell-arbetssättet (T67). Ingen ADR mintad (Accepted-
> graderingen ligger efter kartans steg 4; count 69 orörd).

**Mål:** exekvera migrerings-kartans steg 2 (Decision B) + steg 3 (retirera relä-apparaten) med steg 0-inventering; registrera parallell-arbetssättet som tråd; grilla steg 4-designen till samsyn (Marcus-beordrat scope-tillägg).

**Levererat:**

- **Steg 0:** färsk cross-repo-inventering — klassningstabellen (steg 2/3 exekveras; steg 4-kön bokförd inkl. plugin-restposten och drift-fynd utöver kartan [spoke-CLAUDE Arbetsflöde, CONTRIBUTING Aktörer, hub-WORKFLOW 13 träffar, 8 plugin-skill-filer]; RÖR EJ-klassen skyddar historik/falska positiv) + arkiv-beslutet + **T67 registrerad** (rad + kort).
- **Steg 2 (hub `ecbdd53`):** code-role-discipline v1.1→v1.2 — §4.1 "Code → Marcus → Chat" → "Code → Marcus" (relä-etappen borttagen; rapporten = beslutsunderlag), §5 p.1 riktnings-ägarskap → Marcus, §5 p.4 vakuösa Chat-fil-halvan struken (trail-reflektions-regeln bevarad). Ytoberoende rigor-rader ORÖRDA. Läs-tillbaka L239: relä-markörer 0 träffar.
- **Steg 3 (hub `4e751f8`):** relä-apparaten ARKIVERAD — `archive/tre-aktors-apparaten/` (9 filer: ARKIV-README med återaktiverings-väg [ADR-068 p.8], handoff-kontraktet + prompt-design-checklistan + 5 claude-app-skills-wrappers via git mv [historik bevarad] + full bas-PI-snapshot före klipp); levande bas-PI kirurgiskt klippt 219→148 rader (4-ZONERS + INTERAKTIONSMEKANIK + SELF-REVIEW-relä-formen; INGEN rigor struken — bärarna verifierade: hub-CLAUDE STOPPA-raden + code-role-discipline §3.1/§3.3). Hub-trädet HELT RENT. **KARTANS STEG 2+3 KOMPLETTA.**
- **Steg 4-grillningen (Del 5):** 6 Marcus-kvitterade beslut — SYSTEMET.md = operativa systemet KOMPLETT (tredelning bevaras) · dubbelskiktade sektioner · hub-hemvist + konsolidering (ARKITEKTUR/WORKFLOW absorberas; T22 konsumeras; sannolik ADR i 4b) · EN fil C4-nedstigning · research→divergens 2–3→konvergens + FÄRSK-AGENT-TESTET som mekanisk slutgrind · steg 4a (flytt-oberoende, seriellt) → 4b (SYSTEMET.md-bygget).
- **Parallell-pilotens empiri #1–#4** (Del 1–4; L248 [UNIVERSAL] skördad + hub-lyft K57.1): förklarad dirty tree; delade append-ytor/staleness; delat git-index → pathspec-commit; rebase-pull osäker → ff-only.

### Verifiering

Samtliga spoke-pushar CI-gröna per jobb (docs-only: Test+Build by-design-skippade, Docs link check körd + grön varje gång: runs 28855350600, 28856160543, 28856371831, 28856608564, 28856680189, 28858601809). Hub-commits (ingen CI, T13) läs-tillbaka-verifierade mot HEAD-blob per L239 med nakna räkningar. Noll kollisioner som nådde disk under parallellkörningen.

### Avvikelser / kvarvarande

- Två egna L235-instanser (pipe-maskade exits) — självfångade + rättade i-session; inga nya lessons (instanser av känd).
- Öppen tidsbegränsad restpost: plugin-skillsens session-paus/resume-rader pekar på arkiverad claude-app-skills-plats — inaktuella till steg 4-bumpen (bokfört Del 2/Del 4).
- Kvar av kartan: steg 4a+4b (grillad design, egna sessioner) + steg 5/Accepted-graderingen (ADR mintas som nästa lediga nummer då; Updates-noter 041/042/043/034; mät-apparat-beskrivningen).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-07-session-57.md`](../tasks/sessions/archive/2026-07/2026-07-07-session-57.md) (Del 1–6). **EJ fas-avslut; lifecycle-flip efter Marcus-kvittens av coverage-rapporten (ADR-069-grinden).** Nästa: **steg 4a** (flytt-oberoende ytor + plugin-bunten, SERIELL session) → **steg 4b** (SYSTEMET.md-bygget); S56 stänger separat i Marcus ordning (guardrail 2).

---

## Session 58 — MIGRERINGS-HUB-SESSION 3: kartans steg 4a (Chat-ytan avvecklad ur operativa artefakter) (2026-07-07)

> Process-/hub-session (EJ fas-avslut; byggplans-faserna orörda). Exekverar migrerings-kartans
> steg 4a (S57 Del 5 beslut 6): flytt-oberoende ytor + plugin-bunten → två-aktörs (Code + Marcus).
> Seriell (S56 pausad FÖRE födelsen). Ingen ADR mintad (Accepted-graderingen + konsoliderings-ADR
> ligger i steg 4b; count 69 orörd).

**Mål:** avveckla Chat-ytan ur systemets levande operativa artefakter — hub-konstitution/mallar/
plugin-bunt + spoke-CLAUDE/CONTRIBUTING/referenser till två-aktörs-modellen; retirera PI-mekanismen.

**Levererat (9 commits: 6 hub + 3 spoke):**

- **Hub-konstitution (`0c54799`):** §Roll-arkitektur 'Chat, Code, Marcus' → 'Code, Marcus' (Code =
  agent-ytan; Marcus enda mänskliga motpart, transparens-rapport = beslutsunderlag ej relä-etapp,
  speglar code-role-discipline §4.1); empirin yt-neutral (self-review ~9 %/transparens ~64 %/pushback
  ~27 %, härkomst bevarad i §Self-review); IDENTITET §7.1 'Tre läsare' → 'Två läsare' + r59; r70/r82/
  kontinuitet yt-neutraliserade. Marcus-kalibrerad formulering (kalibrerings-STOPPA före bred applicering).
- **Hub README + CLAUDE-engineering (`331117a`):** 'Tre läsare' → 'Två läsare'; spoke-mallens metod/verktyg.
- **Retrospektiv-mallen arkiverad (`34804fd`):** levande/död-prövning gav DÖD → `archive/tre-aktors-apparaten/`.
- **Bas-PI RETIRERAD (`21af7b2`):** omklassad OMSKRIV→RETIRERA (Marcus-kvitterat, över-engineering-vakten:
  ingen nuvarande användare → bygg-ifall skärs); git rm, snapshot = permanent fallback. Ingen rigor
  stryks (dubblett av hub-CLAUDE).
- **Plugin-bunten → 1.12.0 (`505a781` + `1f45767`):** 6 skills av-dubblade (samexistens-restposten S57
  stängd) + session-end till Code-kört (oberoende-premissen bärs av Marcus coverage-kvittens;
  transcript-disciplinen till Code-era: referera JSONL, ingen repo-kopia). Manifest-paret + plugin-entry
  1.11.0→1.12.0 atomiskt (L228). OMSTART PENDING.
- **Spoke prosa (`373ba66`):** spoke-CLAUDE (Airtable/mekanik-pekare/ADR-048-synk/Arbetsflöde/Metod),
  CONTRIBUTING (Aktörer 'tre'→'två', Sessions-disciplin, Transcript till Code-era), data-model/airtable/
  byggplan läsar-/ägar-rader.
- **Spoke-delta-PI RETIRERAD (`1d000d1`):** → `docs/archive/` symmetrisk med bas-PI; T02 (CI-täckningsgap)
  moot → `closed`. Enabling-fix (`74f29b4`): bruten systemet.md-länk efter arkiveringen (→ L249).

### Verifiering

Hub-commits (ingen CI, T13): läs-tillbaka mot HEAD-blob per L239 med nakna räkningar (kvarvarande 'Chat'
= avsiktlig härkomst + historiska ADR-referenser). Spoke-pushar CI-gröna per jobb (runs 28892800648,
28893152630→28893446222: Docs link check röd på länk-brottet, grön efter enabling-fix). Plugin-källan
1.12.0 konsistent (3 versionsfält); install-record + cache 1.11.0 (OMSTART PENDING, L55-full vid nästa
start). markdownlint 0, Vale 0 errors, frontmatter 14/14, check-adr-count 69==69.

### Avvikelser / kvarvarande

- **OMSTART PENDING** (Marcus-moment) — aktiverar plugin 1.12.0.
- systemet.md är genomgående 4b-materia (tre-aktörs-språk); punkt 3 (PI-mekanismen) markerad RETIRERAD
  som enabling-fix, resten skrivs om i 4b.
- r76/r81 i hub-CLAUDE granskade + medvetet lämnade (agent-neutrala 'Code-prompts', korrekta i två-aktörs).
- Skörd L249–L251 (alla [UNIVERSAL]: inkommande-länkar-vid-arkivering, retirera-vs-omskriv-vakten,
  kalibrera-formulering-en-gång); hub-lyft via lessons-hub-sync (pending/nästa hub-sync-moment).
- Kvar av kartan: **steg 4b** (SYSTEMET.md-bygget: research→divergens→konvergens→färsk-agent-test +
  konsolidering ARKITEKTUR/WORKFLOW + ADR) — egen session S59. Steg 5 (radera-på-riktigt) + Accepted-
  graderingen (Updates-noter 041/042/043/034; count-bump; mät-apparat-beskrivningen).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-07-session-58.md`](../tasks/sessions/archive/2026-07/2026-07-07-session-58.md) (Del 1 + end-passet). **EJ fas-avslut; lifecycle-flip efter Marcus-kvittens av coverage-rapporten (ADR-069-grinden).** Nästa: **steg 4b** (SYSTEMET.md-bygget) i ny session S59 (fräsch kontext); OMSTART före start.

---

## Session 59 — MIGRERINGS-HUB-SESSION 4: kartans steg 4b (SYSTEMET.md-bygget + konsolidering) (2026-07-08)

> Process-/hub-session (EJ fas-avslut; byggplans-faserna orörda). Exekverar migrerings-kartans
> **sista aktiva steg** (4b, S57 Del 5): konsolidera systemets mekanik-dok till EN kanonisk
> två-aktörs-källa. Ingen byggfas-status-ändring. ADR-070 mintad (count 69→70).

**Mål:** samla systemets operativa mekanik i EN källa — `SYSTEMET.md` i hub-roten (två-aktörs,
dubbelskiktad) — genom att bygga doket, absorbera de stale hub-filerna och ersätta spoke-doket.

**Levererat:**

- **SYSTEMET.md byggd (hub, `307d1af`→`6837f3d`):** §0–13, drygt 520 rader, kandidat C
  "Systemkartan" (komponent-katalog + dubbelskikt "I klartext"/"Mekaniken"), färskhets-kontrakt,
  C4-disciplin inuti sektioner (beslut-4-förfining). Alla 13 drift-punkter från inventeringen
  fixade (5→15 skills, paus/resume som Code-skills, MCP + Code-konfig + backlog som egna sektioner).
  Struktur vald via research (Diátaxis/arc42/C4 + branschprecedent, 3 spår) → divergens 3
  kandidater → Marcus valde C.
- **Hub-konsolidering (`04fa792`):** ARKITEKTUR.md + WORKFLOW.md → `archive/absorberad-i-systemet/`
  (git mv + ARKIV-README); hub-CLAUDE/README-pekare omdirigerade. WORKFLOW:s projekt-livscykel-ops
  bevarade → **T70** (L250).
- **Spoke-konsolidering (`bf3671e`):** spoke-`systemet.md` → arkiv (tre-aktörs) + pekare-stub
  (governing, count 14 oförändrad); 4 spoke-länkar omdirigerade (L249); **T22 konsumerad**,
  **T70 registrerad**, **ADR-070 mintad**.
- **Acceptansgrindarna:** färsk-agent-test PASSERAT (+ 2 fynd åtgärdade); Marcus fångade
  empiri-attributions-fel (self-review ~9 % = Chat-ytan, ej Code) → rättat `6837f3d`; fel-klassen
  bredare kontrollerad (§2/§6 rena).

### Verifiering

Hub-commits (ingen CI, T13): läs-tillbaka mot HEAD-blob per L239 med nakna räkningar. Spoke-pushar
CI-gröna per jobb (runs: dok-födelse 28896822094, todo 28897124893, bilaga 28898233435, Del 2
28898977524, konsolidering 28903021575 — Docs link check körd + grön varje gång; Test+Build
docs-only-skippade). markdownlint 0, Vale 0 errors, frontmatter 14/14, check-adr-count 70==70.

### Avvikelser / kvarvarande

- **OMSTART PENDING** (Marcus-moment) — aktiverar plugin 1.12.0 (S58-restpost).
- Radbrytnings-fällan (rad 1474-lessonen: radstarts-`+` → MD004) återkom 2× (divergens-bilaga +
  sessionsdok) — självfångad lokalt via CI-identiska anrop; ingen ny lesson (känd, lessonen höll).
  Grind-mot-fel-cwd (164 falska MD013 från hub-cwd utan config) självfångad (instans av
  CI-troget-anrop). Vale-suggestion (threads rad 125 "enkelt") pre-existing (T20-not), EXIT=0.
- **Kvar av kartan:** steg 5 (radera-på-riktigt tre-aktörs-fallbacken) + två-aktörs-ADR:n →
  Accepted — **BÅDA medvetet vilande** (två-aktörs-prövotiden ej bevisad, Marcus-kvittens S59).
  Nummer-not: ADR-068 = Övnings-ramverket (Accepted, orört); två-aktörs-ADR:n WIP/onumrerad (L241).
- Skörd L252–L253 (båda [UNIVERSAL]: färsk-agent-testet, empiri-citera-från-källa); hub-lyft via
  lessons-hub-sync (pending/nästa hub-sync-moment).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-07-session-59.md`](../tasks/sessions/archive/2026-07/2026-07-07-session-59.md) (Del 1–3). Transcript (Code-körd, ADR-069): `991542f4-…jsonl` (~2,47 MB vid referens; refererad, ej kopierad). **EJ fas-avslut; lifecycle-flip efter Marcus-kvittens av coverage-rapporten (ADR-069-grinden).** Migreringskartans exekvering är därmed KLAR; kvar är endast de prövotids-gatade steg 5 + Accepted.

## Session 60 — Airtable-avstämning maj-eventen (FJS + RIM1 + Psionautics) → Genomfört + korrekt närvaro (2026-07-08)

**Commit-range:** `26597df` (sessionsdok-födelse) → HEAD. **Mål:** stämma av tre genomförda maj-2026-event mot faktiska deltagarlistor i prod-basen (`app8uGPrVCVOm6LfD`) inför Skool-segment-export. Ingen app-kod rörd — detta är en bas-avstämning (data-spår), ej en byggplan-fas. Full prod-ändringslogg: [`docs/backfill/execute-log.md`](backfill/execute-log.md) (ny fil).

- **Återupptagen** ur paus (session-resume, ADR-069): `lifecycle paused→active`, paus-rubrik → historik-form, todo-kadens ▶️.
- **FJS (Event-18) + RIM1 (Event-19)** (pre-paus): 20 walk-in-anmälningar (Marcus, Scripting), 2 kantfall fixade via MCP (Jasmin reverse-flow; Lene case-e-post-dubblett), **80 Deltaganden → Närvarande**, verifierat cross-event (Andreas 4/4).
- **Psionautics (Event-17)** (denna session): A10-bulk markerade alla 220 Deltaganden Närvarande → **källavstämning mot Lottas anmälnings-CSV avslöjade över-markering** (10 icke-Bekräftade + 44 orphan/test-Deltaganden). Korrigerat icke-destruktivt (path A, Marcus-kvitterad): **64 Deltaganden → `Ej avstämt`**. Slutstate verifierat: **156 Närvarande + 64 Ej avstämt = 220** (0 avvikelser). Bas speglar CSV:n (78 Bekräftade).
- **Status-flip** Event-17/18/19 `Planerat → Genomfört` (verifierat inert mot automations-källan).
- **STOPPA-OCH-FRÅGA + identitets-säker avstämning** fångade ett namn-kollisionsfel (två "Stefan Martinsson", nr 843 Bekräftad vs 844 Avbokad) INNAN en felaktig revert → L255.
- **Dok:** execute-log (ny); data-model fälla **40** (case-e-post-dubbletter) + **41** (orphan-Deltaganden), fälla 21 + §A2-decision-hypotesen [HYPOTES]→BEKRÄFTAD (Jasmin), Medveten-Kontakt=Psionautics-namnnot; **L254–L255** [UNIVERSAL] (blanket-mark-varning; identitets-säker matchning). Bas-defekt-hemvist → **T16** (radering av orphans/testpersoner + fällor + Jessica-Anteckningar köade).
- **Del 4 (2026-07-09):** segment-beräkning (källäst, replikerar `segment-resolution.ts`; ingen rollup) → **4 materiallistor** (RIM 3 = 0 närvaro, väntat per ADR-064) + **sex bas-defekter** avtäckta → Marcus stoppade exporten → uppröjning: Ulrika Arvas + Stefan Martinsson-dubbletter konsoliderade (**ny fälla 42**: anmälan utan e-post → A2 Gren 4 skapar permanent omatchbar Person); de 186 namnlösa = **dataförlust vid källan, ej bugg** (**ny fälla 43**: 365 ↔ exakt 365 `firstname: null` i backfill-mapping ↔ ursprungs-xlsx saknar namn före 2026-01; återvinning 0/187); **infört fel upptäckt + återställt samma dag** (adress-match som testdata-klassificering → felaktig revert; Lottas CSV var facit → **ny fälla 44** + L258); Marcus splittrade Person-identitet konsoliderad (pre-flight-grinden fällde första försöket — tp-räkning ur `returnFieldsByFieldId`-svar). Event-17 slutstate åter **156+64=220**. Export: **416 mottagare** (RIM1 310 · FS 134 · RIM2 85 · Psio 77). **L256–L259** [UNIVERSAL]; `testkonton.md` (roll-matris) ny.
- **Del 5 (2026-07-09):** Skool-mekaniken avtäckt — 3 låsta "Mentala ankare" (FS/RIM1/RIM2), inget Psionautics-ankare; **Skool dedupar INTE** (Marcus-empiri: samma adress ×3 = 3 inbjudningsmail) → **partition ersätter överlappande listor i LEVERANSEN** (grillningens motsatta slutsats riven öppet in-place i Del 1; segment-modellen i basen oförändrad). 8 uppladdningsfiler + 2 disjunkta Resend-listor (230 personlig / 186 namnlös) genererade i Skools nakna CSV-format (mall-verifierat: ingen header, ingen trailing NL); generator `docs/backfill/segment-export/skool-partition.mjs` bevarad, **fäller exit 1** vid dubbel-inbjudan/partition≠union. **T72 + T73** registrerade; kadens-commits `1e7953e`→`cfb2fa1`.
- **Del 6 (2026-07-09 → 07-11):** **Resend-riggen komplett** — kontakter importerade och riggen bevisad (skarpt minitest: `first_name`-chip → "Hej Marcus,"/"Hej där,"; citerad From; avprenumerera-länk verifierad); därefter **konsoliderad till ETT segment (416) + EN broadcast** (två-segments-splitten var en fossil av två-texters-planen; Marcus fångade den; nytt minitest grönt 07-11). R&L-mail granskat+korrigerat (417/416, 14 grupper, Psionautics-ankar-steget tillagt, team-invite ersätter creds-per-mail) + Dropbox-referensdoc (`Community-inbjudan-referens.docx`). Två grundorsaker avtäckta+lösta: (1) **OpenDNS/Telenor felstämplade `cdn.resend.app` som phishing** (`hit-phish.opendns.com`, Cisco Umbrella-cert) → Mac-DNS 1.1.1.1/8.8.8.8; (2) **editor-chips binds via egenskapsnyckeln** (`first_name` gemener; `FIRST_NAME` = legacy reserved token; docs-lucka — endast video). **T74** registrerad (consent två sanningskällor vid Resend-broadcast; vakuöst idag — 0 records bär flaggan, live-verifierat). R&L väljer sänddag. **NYTT:** Psionautics-ankare på väg → partitionen räknas om med 4:e ankare (~14 grupper; union + Resend-rigg opåverkade).
- **Numrering:** ingen ADR mintad (count 70); lessons L254–L259 skrivna (nästa L260); trådar T72/T73/T74 registrerade (nästa T75); nästa fälla 45.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-08-session-60.md`](../tasks/sessions/archive/2026-07/2026-07-08-session-60.md) (Del 1–6). **EJ fas-avslut** (data-spår, ej byggplan-fas). Skool-partitionens omräkning (Psionautics-ankaret) + hub-lyft + session-end återstår.

---

## Session 61 — T71/T61-upptaget: AFK-batch-arbetssättet grillat, piloterat och bevisat (2026-07-11)

**Commit-range:** `ed5d2f0` (sessionsdok-födelse) → HEAD. **Mål:** ta T71 (dynamic workflows, utforskning S60) + T61 (AFK/Ralph-loopen, armerad S50) till beslut och pröva autonomt kö-utförande. Inte en byggplan-fas — ett arbetssätts-/exekverings-spår som LEVERERADE produktkod via backlog-korten (TASK-3, task-4.3, task-4.4).

- **Orienterings-pass (före dok-födelsen):** senior second opinion på T71 — samtliga tekniska påståenden omverifierade mot färsk Anthropic-dokumentation (docs-agent med citat-krav; 100 % höll) + branschprecedent-kartläggning (Copilot coding agent, Ralph-loopen, Backlog.md:s agent-riktlinjer, Anthropic harness/best practices, Codex/Cursor → 8 konvergenspunkter; systemet uppfyllde 6–7, luckan = hårda stop-villkor + review-yte-valet). Nyckelfynd: AFK-etiketten ↔ design-review-DoD:n kolliderar på UI-skivor; `claude -p "/do-work"` + subagent-verktygsrestriktion nu doc-verifierade dörrar.
- **Grillning → samsyn (Del 2):** AFK-batch-kontraktet, 5 beslut, samtliga på Code-rekommendation — (1) granskningsfärdig-läget (UI-skivor stannar på öppen design-review-DoD; Done-flip = Marcus; granskningsvågor), (2) halt-first + hårda gränser (max-kort, aldrig samma kort ×2, budget-tak, kill-switch), (3) trunk-push per skiva bevaras + omprövningströskel (skarp Lotta-drift ELLER >~5 kort/batch → branch/PR-fråga som egen landning), (4) orkestrerings-skript i session som substrat; `/work-batch`-skill + ADR-071 vid bevisad pilot; allowlist-förkrav, (5) pilot = TASK-3 ensam.
- **Pilot (Del 3):** TASK-3 (delayMs-flake-härdningen) autonomt `To Do`→`Done` — leverans `dae3f1f` (4 testfiler: 3 kända + grep-fyndet `event-detail`; route-release ersätter tidsfönstret; `delayMs:`-call-sites i tests/ = 0, oberoende verifierat) + stängning `871c804`; CI grön per jobb attempt 1 på båda; first-pass ja; 0 defekter; ~24 min; 0 ingripanden. Avvikelse öppet bokförd → **T75** (final-summary-självreferensen; tvåstegs-stängning per task-2-precedent).
- **Batch 2 (Del 4):** task-4.3 + task-4.4 sekventiellt till GRANSKNINGSFÄRDIGA (frisk agent-kontext per kort). 4.3: `dc099b3`+`3065a38`, first-pass ja; h-scroll-defekt fångad+rättad före leverans; facit-avprickning 11 punkter renderat. 4.4: `25c63a9` → CI RÖD attempt 1 (tidszons-TESTDEFEKT: UTC-byggd förväntning vs appens Europe/Stockholm) → **autonomt remedierad** `e2fdea4` → grön per jobb → `0f20ce6`; facit 11 punkter. **TASK-5 + TASK-6** fynd-kort registrerade oetiketterade (stale dev-server falsk-rött; parallell staging-contention) — **agent 2 tillämpade agent 1:s mitigations via korten** (substrat-buren kunskapsöverföring, L266). S56-övertagandet öppet bokfört (4.3/4.4 var pausade S56:s KVAR).
- **Granskningsvågen (Del 5):** Marcus godkände BÅDA första varvet (inkl. reflow-avvikelsen på Obetalda-rubriken) → Code flippade DoD 5 + final-summary (AFK-proveniens) + Done (`c9dca68`) → **4.5 plockbar**. TASK-4: 4/5 skivor Done, design-review 2/2 första varvet.
- **Drift-metrik S61:** 3 kort autonomt levererade (1 direkt-Done + 2 via granskningsvåg) · first-pass-CI 2/3 · alla defekter fångade av grindarna före/vid CI, inga ogrindat till main · 0 mänskliga ingripanden i körningarna · 0 permission-stopp (allowlisten `71c9143` räckte exakt).
- **Numrering:** ingen ADR mintad (count 70; **ADR-071 deferrad till S62-bygget** per grillad samsyn beslut 4 — beslutet durabelt i Del 2 + T61/T71-korten); lessons **L263–L266** [UNIVERSAL] (nästa L267; hub-lyft deferrad → buntas med S62:s hub-landning); tråd **T75** registrerad (nästa T76); nästa fälla 45 (oförändrad).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-11-session-61.md`](../tasks/sessions/archive/2026-07/2026-07-11-session-61.md) (Del 1–6). **EJ fas-avslut.** Kvar till S62: bygget (`/work-batch`-skill + ADR-071 + T75-buntning + hub-lyft L263–L266, EN hub-landning) → batch 3 (4.5) som skillens första bruk → QA 4.6 (Marcus) → TASK-5/6-klassning + webbtavle-kollen.

---

## Session 62 — Bygget /work-batch + ADR-071, batch 3 skarpt, granskningsvåg 4.5 + design-fyndet task-7 (2026-07-11)

**Commit-range:** `7c23edb` (sessionsdok-födelse) → HEAD. **Mål:** verkställa S61:s deferrade bygge (`/work-batch`-skill + ADR-071 + T75-buntning + hub-lyft, EN hub-landning) och bruka skillen skarpt på batch 3 (skiva 4.5). Ej byggplan-fas — arbetssätts-spår som levererade produktkod via backlog-kortet.

- **Bygget (Del 2):** hub-landning `3174a1e` (plugin 1.12.0 → 1.13.0, 7 filer): `/work-batch`-skill född (Marcus-avfyrad, kontraktet kodat) · do-work steg 5 → tvåstegs-stängningen (T75/L263) · hub-lyft K61.1–K61.4 (L263–L266) · SYSTEMET.md §0/§5/§7 · konstitutionens ISSUE-SUBSTRAT-rad konsekvens-synkad. Spoke: **ADR-071** mintad (AFK-batch-kontraktet) · T61/T71 synkade · **T75 → closed**.
- **Omstartskedjan (Del 2-NÄSTA + Del 3):** omstart 1 RÖD — plugin-cachen uppdateras INTE av omstart (marketplace-hämtning stale sedan 2026-07-08) → `claude plugin update` → **L267** [UNIVERSAL] (tre-länkars distributionskedja; skill-registryn låses vid sessionsstart) → omstart 2 GRÖN (1.13.0 @ hub-HEAD, gitCommitSha-match).
- **Batch 3 (Del 3) — `/work-batch` FÖRSTA SKARPA BRUK** (run `wf_72a786e1-c30`, maxCards=1, halt-first): task-4.5 (Osynliga uppdateringen B3) → GRANSKNINGSFÄRDIG. Leverans `c1aa713` (produktkods-delta EN rad: `placeholderData: keepPreviousData`, ärligt bokförd inert; bevisen = permanenta e2e-tester per S55 Del 11-mönstret i prod-form: byte-identiska FÖRE==UNDER==EFTER-skärmdumpar med nätverksnivå-bevisad aktiv omhämtning, 5 containrar boundingBox-mät-stilla, kallstart utan delay-fönster) → CI grön per jobb attempt 1 (run `29164601255`, inkl. Test+Build) → `cdfd4ee`. TDD-avvikelse öppet bokförd (bevis-skiva; röd-kapabilitet via 2 inducerade prober). 0 defekter · 0 fynd · 0 ingripanden · ~28 min · first-pass JA. Avfyrningsmekanik-fynd → L268.
- **Granskningsvåg 4.5 (Del 4):** Marcus godkände osynligheten live (60+ s) men UNDERKÄNDE kallstartens laddläges-design (kollapsade kort + "Laddar…"-textrader = layout-skift; ospecat designutrymme — "lugnt laddläge" odefinierat, K10-facit täcker laddat läge) → väg-beslut A: 4.5 **Done** (`e113890`, final-summary med AFK-proveniens) + **task-7 fött** (Design: kallstartens laddläge — skeleton + persist-cache till branschstandard; web-research-grundat NN/g + repo-specarna; väg research → grillning → /to-prd → /to-issues) → **QA 4.6 OBLOCKAD**. **TASK-4: 5/5 skivor Done** — PRD-stängning väntar på QA 4.6. → L269.
- **Post-batch (Del 5):** TASK-5/6 klassade `ready-for-agent` på Marcus kvittens (AC ×3 per kort ur FÖRVÄNTAT-styckena, `b517d79`) = batch 4-kandidater · webbtavle-kollen UTFÖRD empiriskt (tavlan visar ocommittade ändringar vid serverstart 17/17; `/api/tasks` = uppstarts-snapshot; websocket-UI-kanalen separat) — S61-observationen är display-quirk i backlog.md 1.47.1, inte substrat-egenskap; EXPLICIT förkastad som vidare spår · QA 4.6 framskjuten (Marcus-takt) · docs-lint-defekten `588e29b`→`d8d5e4f` öppet bokförd → L270.
- **Numrering:** **ADR-071 mintad** (count 71, nästa 072) · lessons **L267–L270** [UNIVERSAL] (nästa L271; hub-lyft L267–L270 vid nästa hub-sync-moment) · tråd T75 closed, ingen ny (nästa T76) · fälla 45 oförändrad.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-11-session-62.md`](../tasks/sessions/archive/2026-07/2026-07-11-session-62.md) (Del 1–5). **EJ fas-avslut.** Kvar till S63 (HANDOFF): **task-7-grillningen** (/grill-me) → design → /to-prd → /to-issues; i Marcus-takt: QA 4.6 (sista grinden för TASK-4-PRD:n) · batch 4-kandidater TASK-5/6 plockbara för `/work-batch`.

---

## Session 63 — Task-7-kedjan komplett: grillning → ORDLISTA → ADR-072 → PRD TASK-8 → skivor 8.1–8.5 (2026-07-12)

**Commit-range:** `c8ad628` (sessionsdok-födelse) → HEAD. **Mål:** driva design-kortet task-7 (kallstartens laddläge) från granskningsfynd till byggbar spec per S62-handoffen. Ej byggplan-fas — design-session som producerade spec-artefakter + en CI-remediering.

- **Födelsen:** midnatts-datum-driften fångad av create-session-doc steg 5 (`date +%F` vid skapandet → fil-datum 2026-07-12); numrerings-avvikelse disk-vunnen (T76 registrerades post-S62-stängning → nästa tråd T77, inte T76).
- **Grillad samsyn (Del 2):** 5/5 beslut på Code-rekommendation A — app-bred **Lugnt laddläge**-princip + Skeleton-primitiv med Hem först · persist-cache med skyddsräcken · riktigt chrome + förenklade datablock med långsam shimmer · mät-först-tröskeln · ADR för persist-beslutet. Research käll-verifierad FÖRE rekommendationerna (web-agent: NN/g, Chung, Viget, TanStack-dok + maintainers, OWASP, Roselli, FK): kortets "0,5 s"-tröskel gick inte att verifiera → öppet riven → 1 s (NN/g + FK samstämmiga); FK saknar skeleton → designen går ÖVER FK-golvet, öppet bokfört. ORDLISTA-posten "Lugnt laddläge" landad obuntad vid kristallisering (`e7a70ac`).
- **CI-röd-detour (Del 3):** Del 2-landningens run föll på pill-testet (task-4.3) — datumsträngar i runnerns UTC vs browserns Stockholm; latent 22–24Z-fönsterbugg (L264-klassen för datumsträngar). Red-kapabel slinga: `TZ=UTC`-repro RÖD lokalt medan fönstret var öppet → fix per repots Intl-förebild → RÖD→GRÖN båda zonerna → `c4c52b2` → **CI grön per jobb I fönstret** (run 29170841109). → **L271**.
- **Spec-kedjan (Del 3–4):** **ADR-072 mintad** (klient-persist av query-cachen med skyddsräcken; hotmodellen öppen, count 72==72) · **PRD TASK-8 publicerad** (16 användarberättelser, 11 implementationsbeslut, Marcus-kvitterad test-skarv: e2e/axe + a11y-primitiv, inga nya skarvar) · **task-7 → Done** (final summary) · **skivorna task-8.1–8.5 publicerade** (skiv-godkännandet Marcus-delegerat till senior-avgörande, S56-precedenten; täcknings-pass 16 UB + 11 beslut → 5 skivor: mätprotokollet S · Skeleton-primitiven M · persist-lagret M · Hem till Lugnt laddläge M ←8.1+8.2 · QA S ready-for-human; DoD-arv 2 spec-grindar per skiva) · T76-nummer-noten (pilot-ADR:n ≠ 072, öppet justerad).
- **Vägvalet (Marcus):** S63 stängs; S64 = T69-upptaget (Mer-vyn: grillning → PRD → skivor) → S65 = T76-piloten på partitionen task-8-skivorna ∥ T69-skivorna (Code-bedömning: disjunkt sånär som på tre kollisionsytor bokförda i T76-kortet — lockfilen [8.3:s beroenden], design-system-specen [8.2:s sektion], routeTree vid route-ändringar; TASK-5/6 hålls utanför piloten).
- **Numrering:** **ADR-072 mintad** (count 72, nästa 073) · lesson **L271** [UNIVERSAL] (nästa L272; hub-lyft L267–L271 vid nästa hub-sync-moment) · fälla 45 oförändrad · ingen ny tråd (nästa T77).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-12-session-63.md`](../tasks/sessions/archive/2026-07/2026-07-12-session-63.md) (Del 1–5). **EJ fas-avslut.** Kvar till S64 (HANDOFF): **T69-upptaget** (Mer-vyn FK-mönstret: design-kedjan) → S65: T76-pilot-bygget + pilot; i Marcus-takt: QA 4.6 (sista grinden för TASK-4-PRD:n) · batch 4 (TASK-5/6, sekventiellt) · task-8-skivorna 8.1–8.3 plockbara.

---

## Session 64 — T69-kedjan komplett: rubrik-research → Hem-identiteten → konvergens-facit M6 → PRD TASK-9 → skivor 9.1–9.4 (2026-07-12)

**Commit-range:** `b54379d` (sessionsdok-födelse) → HEAD. **Mål:** driva T69 (Mer-vyn till FK-mönstret) från grillad struktur-samsyn till byggbar spec per S63-handoffen. Ej byggplan-fas — design-session med konvergens-prototyp + spec-artefakter.

- **Upptaget:** T69-kortet `paused` → `active` (`69dda80`); rubrik-research-passet käll-verifierat i FEM konvergerande källklasser (FK:s åtta referens-skärmar avlästa + Apple HIG + Material 3 + GOV.UK-klassen inkl. GOV.UK-appens öppna källkod + WCAG/SPA-konsensus via tre web-agenter med citat-krav) → alla pekar på synlig h1 per vy UTOM hemytan.
- **Hem-identiteten (Del 2):** FK login-flödesserien (5 nya referensbilder, Marcus-fotade — "Hej Marcus!" bor i FK:s login-loading) → **Marcus-realiseringen "HELA FK-appen ÄR Mina sidor"** → chat-samsyn 1–5 kvitterad: rubrikpolicyn (synlig h1 alla vyer utom Hem; Hem-K10 orörd) · T69 B/B2 RIVNA · task-4 beslut 4 RIVET (Hem-platshållaren) · **T77 notis-centret född** (ringklockan; aldrig död ikon) · ORDLISTA "Mina sidor" omskriven obuntat (`1a9e929` — termen = hela inloggade appen, aldrig en destination).
- **Konvergens-passet (Del 3):** T66-formen på riktiga `/mer` (underform A), M1-baslinje → 5 Marcus-varv → **M6 LÅST SOM FACIT** ("Vi kör på detta. Vi låser."): FK-måtten computed-låsta (sidmarginal 16 [dubbelkants-fynd], radhöjd 58, gap 10/32, etikett 600), chevronen bort (D-revisionen: app-bred regel), M3:s hover-variant PRÖVAD+FÖRKASTAD, ikon-krocken Users→Filter löst, tabbar-ikonparitet research-belagd (M3-listspec: leading icon on-surface-variant). Bilagor 9 dumpar; återupplivningsväg `230f322`; prototypen raderad per klausul iv (`a0e2536`, CI grönt inkl. Test+Build på återställd vy).
- **Spec-kedjan (Del 4–5):** **TASK-9 publicerad** (PRD: Mer-vyn till FK-mönstret — ETT kort bär struktur + facit per H-beslutet; 14 UB, 10 implementationsbeslut; skarv-kvittens A: primitiv-axe + mer-e2e/axe, inga nya; 2 extra DoD-spec-grindar) · **skivorna 9.1–9.4** (NavCard M oblockad · Mer-vyn M ←9.1 · Hem-platshållaren S oberoende · QA S ready-for-human; skiv-godkännande Marcus "A"; täcknings-pass utan föräldralösa). **9.1 + 9.3 oblockade = T76-partitionens pipeline B.** L268-fallbacken (skill-avfyrning) öppet bokförd ×2; L270-återfall ×2 fångade+remedierade (`47a9ec0`, `b9fdbf8`), öppet bokförda utan ny lesson.
- **Numrering:** ingen ADR mintad (nästa 073) · lesson **L272** [UNIVERSAL] (tsr-split-stale — transformerad dev-modul är egen cache-nyckel; computed-assertioner slår pixel-titt) · fälla 45 oförändrad · **T77 född** (nästa T78).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-12-session-64.md`](../tasks/sessions/archive/2026-07/2026-07-12-session-64.md) (Del 1–6). **EJ fas-avslut.** Kvar till S65 (HANDOFF): **T76-pilot-bygget + piloten på partitionen task-8-skivorna ∥ task-9-skivorna (9.1/9.3)**; i Marcus-takt: QA 4.6 · batch 4 (TASK-5/6, sekventiellt) · 8.1–8.3 plockbara för /work-batch.

---

## Session 65 — T76-piloten bevisad: parallella batch-pipelines 5/5 first-pass + ADR-073 + granskningsvåg (2026-07-12)

**Commit-range:** `5513c3d` (sessionsdok-födelse) → HEAD. **Mål:** T76 från grillad samsyn till BEVISAD pilot på partitionen pipeline A = task-8-skivorna (8.1–8.3) ∥ pipeline B = task-9-skivorna (9.1/9.3), därefter bevis-landningen. Ej byggplan-fas — arbetssätts- + leverans-session.

- **Pilot-designen (Del 2):** empiriska verifieringar FÖRE design (worktree-minimal-test 2 agenter · CI-concurrency per PR · Test+Build kör staging-stegen → CI-staging-serialiseringen) → kvitterad form A: fasat schema (8.1 exklusiv → 8.3∥9.1 → 8.2∥9.3), mkdir-semafor + port-pre-flight, orkestrator-ägd seriell PR→CI→merge-kedja per kort, drain-halt, max-kort 5, allowlist-diff.
- **Batchen (Del 3–5): 5/5 kort first-pass** — 0 aborts · 0 ingripanden · 0 permission-stopp · 0 merge-konflikter · 7 defekter agent-fångade (0 till main) · parallell-vinst ≈35 % väggklocka · semafor totalt 220 s. Leveranser: 8.1 mätprotokollet (skeleton-från-första-bildrutan låst på empiri) · 8.3 persist-lagret ADR-072 (falsifikations-pass i TDD:n) · 9.1 NavCard · 8.2 Skeleton (spec-§15-kollisionen designad bort) · 9.3 Hem-platshållaren riven. Drain-vägen ALDRIG triggad (öppen gräns).
- **Bevis-landningen (Del 6):** **ADR-073 mintad** (parallell-formen som 7 beslut inkl. B-switch färdigspecad; amenderar ADR-071) · T71-raden ÖPPET reviderad · T46-switch-posten · hub `38821c6`: /work-batch **1.14.0** + SYSTEMET.md §0-termerna (pipeline/fan-out fan-in/drain).
- **Granskningsvågen + post-batch-fällorna (Del 7):** två fällor i människans verifieringsmiljö fångade + TASK-10-bokförda (fälla 4: stale node_modules på main efter manifest-merge + Vite-omstartskravet, `d0b17de` · fälla 5: byggd SW på dev-originet 5173 servar gammal bundle cache-first, verifierad kedja disk→transform→färsk kontext, `07b17e8`) → reparerad miljö → Marcus-kvittens alla 4 kort → **Done med final-summary** (tvåstegs-stängningen) → **8.4 + 9.2 oblockade**. Plugin 1.13.0→1.14.0 utförd (omstart = sessionsbytet, L267).
- **Numrering:** ADR **073** mintad (nästa 074) · lessons **L273–L276** skördade [UNIVERSAL] (nästa L277) · fälla 45 oförändrad · tråd T78 nästa.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-12-session-65.md`](../tasks/sessions/archive/2026-07/2026-07-12-session-65.md) (Del 1–8). **EJ fas-avslut.** Kvar till S66 (HANDOFF): förbättringspasset parallell-formen (research-pass: merge queue-precedent, affected-graph-partitionering, SW-/dev-origin-hygien + skyddsräckes-skivor ur TASK-10-klassningen + TASK-5/6 som sekventiell batch 4) → parallell-batch 2 (8.4 ∥ 9.2); i Marcus-takt QA 4.6 · 8.5 · 9.4.

---

## Session 66 — Förbättringspasset parallell-formen: research → skyddsräcken → batch 4 (3/3) → parallell-batch 2 (2/2) → ADR-073-amendering + /work-batch 1.15.0 (2026-07-12)

**Commit-range:** `208b2f7` (sessionsdok-födelse) → HEAD. **Mål:** härda parallell-formen efter bevisad pilot (S65) till branschförankrad form före andra skarpa bruket, lösa ut TASK-10-klassningen till skyddsräcken, leverera TASK-5/6, därefter parallell-batch 2 som första skarpa 1.14.0-bruket. Ej byggplan-fas — arbetssätts- + leverans-session.

- **Research-passet (Del 2):** tre web-agenter med citat-krav — merge queue-klassen löser logisk integritet, inte resurs-mutex (orkestrator-serialiseringen BEKRÄFTAD; GitHub MQ dessutom otillgänglig för User-ägt repo) · manuell partitionering med worktree-isolering ÄR state of practice hos alla fyra agent-plattformarna; de mekaniska stegen är claims-check + `git merge-tree` · SW-/miljöhygien: Vites/Playwrights förstaparts-mönster täcker fälla 1–4; spec-fyndet "inte ens 404 avregistrerar en aktiv SW" (W3C #204 wontfix) korrigerar L276 och falsifierar ADR-073:s ursprungliga B-recept.
- **Räckena (Del 2, kvittens A/A/A/A):** Test+Build-jobbet serialiserat mekaniskt (`staging-tests` + `queue: max` — komplement bakom orkestrator-kedjan; actionlint-schemat släpade → smal ignore med lift-villkor) · CORS-allowlisten utökad med preview-originet 4173 (digest-verifierad superset-skrivning mot staging-refen explicit; trippel preflight-bevis) · TASK-10 AC-formulerad.
- **Batch 4 sekventiellt (Del 3): 3/3 Done first-pass 6/6 runs** — TASK-5 webServer alltid-färsk + serverfria test:api · TASK-6 plain-formen icke-stödd efter empiriskt RÖD-bevisad (a)-väg · TASK-10 staging-scripts + permanent preview-spec + dotenv (source-prefixet pensionerat) + runbooken. Falsk-röd-halten (grind mätte portens tomhet, inte agentens processer) öppet bokförd → grind omskriven → cache-resume. Fynden TASK-11∥12 (syskon-dubbletter, samma rotorsak) registrerade.
- **Parallell-batch 2 (Del 4): 8.4 ∥ 9.2 first-pass 4/4 runs, 0 konflikter** — första skarpa 1.14.0-bruket; semaforen formaliserad som repo-artefakt (`scripts/staging-semaphore.sh`); S66-grindarna skarpbevisade (merge-tree 2/2 · claims-kvitton 2/2 · pr-ci-bevisformen bar båda korten). NYTT mekanik-fynd: worktree-familjens delade `origin/main`-ref → förgrenings-SHA-regeln (L278). Granskningsvågen Marcus-kvitterad ("allt ser bra ut") → 8.4 + 9.2 Done → 8.5 + 9.4 oblockade.
- **Slutlandningen:** ADR-073 AMENDERAD (B-receptet → egen preview-port · F1-komplementet · beslut 2-skärpningen; immutabilitets-formen, 73==73) · hub `01eb164`: **/work-batch 1.15.0** (claims-check, förgrenings-SHA-regeln, semafor-artefakten, merge-tree-grinden, claims-kvittot, pr-ci-bevisformen, post-CI-bockar, reviderat B-recept, nytt delta 7 post-batch-miljösteget).
- **Numrering:** ingen ny ADR (amendering; nästa 074) · lessons **L277–L280** skördade [UNIVERSAL] + **L276-korrigeringen** (nästa L281) · fälla 45 oförändrad · tråd T78 nästa.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-12-session-66.md`](../tasks/sessions/archive/2026-07/2026-07-12-session-66.md) (Del 1–5). **EJ fas-avslut.** Kvar efter S66: QA-korten 4.6 · 8.5 · 9.4 (`ready-for-human`, Marcus-takt) · TASK-11/12-konsolideringen (Marcus-triage) · PRD-stängningarna TASK-4/8/9 (väntar respektive QA) · hub-lyftet L267–L280 (nästa hub-sync) · plugin-update till 1.15.0 (Marcus Update-klick + omstart) · ADR-073:s öppna gränser ärvda (drain aldrig triggad · B-formen aldrig körd i drift · >2 pipelines kräver ny prövning).

---

## Session 67 — QA-vågen till PRD-stängningarna + TASK-11/12 + plugin 1.15.0 + dependabot-passet (2026-07-18)

**Commit-range:** `22f44d0` (sessionsdok-födelse) → HEAD. **Mål:** S66-handoffens Marcus-takt-moment — QA-vågen 4.6/8.5/9.4 → PRD-stängningarna TASK-4/8/9, TASK-11/12-miljöfixen, dependabot-passet (7 PR:er) samt plugin-updaten 1.15.0 (Marcus-tillägg vid scope-kvittensen). Ej byggplan-fas — QA-/underhålls-session.

- **TASK-11/12 (konsoliderade → Done):** seed-ankaret `TEST_REGISTRATION_RECORD_ID` i `.env.test.example` + Marcus `.env.test` (kvitterad väg) + pekande felmeddelanden i de 3 hårda expect:en + nyckeldok (helpers-headern, CONTRIBUTING); skipvakts-utökningen 6→7 förkastad med motiv (svit-global vakt vs 6-falls-lokal nyckel). Bevis RÖD→GRÖN (funktionellt 296/296); `bb65b7f`, run 29642391302 grön per jobb.
- **Plugin-updaten 1.14.0 → 1.15.0:** utförd i sessionen; L267-verifieringen grön (install-recordets gitCommitSha == hub-HEAD `01eb164`, inte bara versionssträngen). Omstarten = sessionsbytet — 1.15.0-registryn aktiveras i nästa session.
- **QA-vågen (preview-formen 4173 per runbooken):** två fynd med hela livscykeln inom vågen — **task-8.6** skeleton-tonen (L269-klassen: WCAG 1.4.11-feltillämpning på dekorativa block falsifierad mot W3C Understanding + MUI/Carbon/shadcn-branschbandet → neutral-200 via ny semantisk roll-token `--mm-bg-placeholder`, shimmer 45→75 %, dubbelriktat test-kontrakt; `49fbb76`) + **task-4.7** fokusring-klippet i anmälningslistans rullningsyta (utanpåliggande ring klipps av overflow → inset-formen per React Aria/Spectrum-mönstret, containerns egen ring bevarad; 3 bevisbilder i `tasks/sessions/bilagor/s67-fokusring-klipp/`; `01b4031`). Foundation-drift-observationen (fokusringens §6-form) öppet noterad UTAN åtgärd (Marcus: färgen ej problemet). Marcus helhetskvittens → 4.6/8.5/9.4 Done → **PRD:erna TASK-4/8/9 Done** (QA-grinden var sista beroendet; T69-kedjan levererad hela vägen).
- **Dependabot-passet (ADR-031 lager 4, Marcus-delegerat):** 6 squash-merges med main-CI grön PER STEG (#56 → #57 → #44 → #45 → #39 → #53) + #46 stängd med motiv (types ska spegla runtime). Felanalyserna friade båda röda från paketfel: #44 = L279-klassen (rebase räckte) · #53 = ERESOLVE-grupperingsluckan + Biome 2.5:s nya svg-lintning (semantisk felträff → smal override `4f90678`, dubbelverifierad 2.4+2.5). Config-härdningen `fa03742` (dev-gruppen speglar stack-exkluderingarna). L275-steget fullbordat + `npx playwright install` (binär-sidoeffekten fällde a11y brett innan). Verifiering på nya versionerna: yamllint/Biome 2.5.3/typecheck/a11y 31/31/build+bundelgrind gröna; test:api 294/296 där väg D-paret är **TASK-14-fyndet** (filtrerade vägen stabilt ~30 s ×3 mätningar vs 1,7 s ofiltrerad — ej deps-regression, CI grön på samma fall; mätserie + recept på kortet). **TASK-13** född (CI kör EOL-Node 20 → runtime-lyftet 24 LTS som en medveten ändring).
- **Kort-facit:** 10 kort Done (TASK-11, TASK-12, 8.6, 4.7, 4.6, 8.5, 9.4, TASK-4, TASK-8, TASK-9) + 2 födda (TASK-13, TASK-14) + PR #46 stängd med motiv. Tavlans To Do rymmer endast de två nya fynden.
- **Numrering:** ingen ny ADR (73==73; nästa 074) · lessons **L281–L283** skördade [UNIVERSAL] (nästa L284) · fälla 45 oförändrad · tråd T78 nästa.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-18-session-67.md`](../tasks/sessions/archive/2026-07/2026-07-18-session-67.md) (Del 1–5). **EJ fas-avslut.** Kvar efter S67: TASK-13 + TASK-14 i Marcus-takt · hub-lyftet L267–L283 (nästa hub-sync) · omstarten aktiverar 1.15.0 · nästa PRD/batch med parallell form som default (kräver 1.15.0-registryn, ny session).

---

## Session 68 — Arbetssätts-paketet: asynkron CI-vakt (R1) + dependabot ur staging-mutexen (R2) + TASK-14-prioriteringen (R3) + hub-syncen L267–L283 (2026-07-18)

**Commit-range:** `fd37fec` (sessionsdok-födelse) → HEAD. **Mål:** exekvera rekommendationspaketet ur arbetssätts-utforskningen "väntan på CI" (samma konversation, före sessionsstart: uppmätt nuläge — staging-stegen 345 s av Test+Builds 409 s, 0 röda Test+Build på main i 50-fönstret, dependabot-FIFO-kön 44 s arbete/7m15s elapsed — + branschresearch Fowler/CircleCI-2026/Meta-stacking/DevEx/merge-queue-org-kravet/Pocock-korpusen). Marcus-order: "vi kör på dina rekommendationer". Ej byggplan-fas — arbetssätts-/infrastruktursession.

- **R2 — dependabot ur staging-mutexen** (`62750f0` + fix `3ac7751`): Test+Build-jobbets concurrency-grupp villkorlig — Dependabot-actorn (skippar samtliga staging-/serversteg per ADR-031 Lager 3) får unik grupp `depbot-<run_id>`; övriga behåller konstant `staging-tests` + `queue: max`. Samma-predikat-argumentet (stegens skip och grupp-valet läser samma `github.actor`) gör staging-invarianten definitionell även vid re-run. ADR-073-amendering 2 (additiv). L279-verifiering: actionlint via CI:ns exakta install-skript + yamllint, 0 fel. **L280-återfall ×1 öppet bokfört:** pipe-maskade docs-grindar (`| tail -1`) push:ade `62750f0` med rött docs-jobb (MD028 + Vale.Terms ×3); fångat direkt, fixat `3ac7751`, kedje-formen därefter pipe-fri — och den bundna kedjan STOPPADE nästa fel (MD004) före commit, formens bevis. **R2-beviset:** run 29657134390 Test+Build SUCCESS genom hela staging-sviten; fixrun 29657198592 helgrön per jobb.
- **R1 — asynkron CI-vakt kodifierad i hubben** (hub `dd15831`, plugin 1.15.0 → **1.16.0**): do-work steg 5 — vakten som BAKGRUNDSTASK (headSha-match L265), stängnings-commiten EXEKVERAS ENDAST på vaktens exit 0 (L280-bindning), halt-first vid rött, aldrig ny push före vaktens utfall; work-batch delta 4 — orkestratorns båda vakt-moment bakgrundade, kedjans serialisering per kort oförändrad. Tvåstegs-stängningen (L263) och alla grindar orörda — endast väntans placering flyttas. SYSTEMET.md medvetet orörd (rad 340 sann oavsett vänteform; mekaniken bor i skillsen). **Dogfoodad i S68:** fyra bakgrundsvakter körda skarpt; hela R1-editeringen + hub-lyftet utfördes i run-vakttid. Aktiveras vid Marcus Update-klick + omstart (L267-verifieringen mot hub-HEAD `6f881d3`).
- **R3 + parkeringen:** TASK-14 → `ready-for-agent` + priority high + not via backlog-CLI:t (klassnings-akten = Marcus-ordern; kall-morgon-mätningen = nästa sessions ingång, inget av kortet utfört i S68). **PR #58–#63 PARKERADE** på Marcus-order — vågen född 17:49–17:51 ur gruppfix-omscannen, korsade S67:s inbox-0-bokföring i minutfönstret (ingen S67-miss); #58 röd (trolig #46-klass, overifierad) · #63 typescript 6→7 major · #59–#62 gröna; nästa dependabot-pass ärver vågen (+ kan pröva att avlista audit-ci-allowlist-posten GHSA-gv7w-rqvm-qjhr per verktygets egen rekommendation, observerad vid sessionsstart).
- **Hub-syncen L267–L283** (hub `6f881d3`, 287 rader): sex sessions-sektioner K62.1–K67.3, 17 UNIVERSAL-poster med commit-trail-headerblock per S61-precedenten; S67-handoffens vid-nästa-hub-beröring-villkor löst i samma session som beröringen.
- **Numrering:** ingen ny ADR (amendering 2 på ADR-073 ändrar inte antalet; 73==73, nästa 074) · inga nya lessons — 5 kandidater förkastade med motiv i Del 6 (nästa L284) · fälla 45 · tråd T78 (inga nya trådar; ADR-053-triagen i Del 6).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-18-session-68.md`](../tasks/sessions/archive/2026-07/2026-07-18-session-68.md) (Del 1–6). **EJ fas-avslut.** Kvar efter S68: TASK-14-mätningen kall morgon (prioriterad ingång) · TASK-13 · dependabot-passet #58–#63 · Marcus-moment: Update-klicket + omstarten (aktiverar 1.16.0).

---

## Session 69 — Fynd-korten: TASK-15 quotepath-fixen + TASK-14 kall-morgon-mätningen → ADR-060-städningen + TASK-13 Node-lyftet (3 kort Done · TASK-16 fött · L284–L285) (2026-07-18/19)

**Commit-range:** `ed83495` (sessionsdok-födelse, 23:50 CEST 18/7) → HEAD. **Mål:** exekvera S68-handoffens fynd-kort med tidsvillkoret hanterat — ordningsbytet (TASK-15 i kväll, TASK-14 i morgon bitti) Marcus-kvitterat mot kall-morgon-receptet. Första sessionen på plugin 1.16.0 (asynkrona CI-vakten skarp — samtliga vakter bakgrundade, headSha-formen L265). Ej byggplan-fas — fynd-korts-/underhållssession.

- **TASK-15 Done** (`378db8c` → kontrastbevis `7f36257`): `quotepath: false` på BÅDA changed-stegen i ci.yml — gits quotepath-escapning av UTF-8-filnamn (backlog-kortens å/ä/—) föll ur `**/*.md`-globben → `only_changed=false` → onödig full Test+Build per stängnings-commit (K1.17-klassen; käll-belagd trippel). Följdfynd fixat i samma invariant: docs-steget hade samma default ⇒ UTF-8-namngiven `.md`-ändring skulle TYST skippa Docs link check. Kontrastbeviset run 29663106983: kortfils-only-commit → Test+Build SKIPPED + Docs link check körd grön (före-bilden 29657524469 full svit ~7 min); därefter bevisat i drift på varje stängnings-commit i sessionen.
- **TASK-14 Done** (mätningen + ADR-060-städningen): kall-morgon-serien (09:35, ~9 h staging-vila) 32,7/31,6/31,9 s vs ofiltrerad ~1,6 s → transient-hypotesen FALSIFIERAD; mekanismen belagd: staging-secreten `REGISTRATIONS_BATCH_SIZE=2` × 354 ackumulerade create-test-sentineler på seed-ankarets event ⇒ 180 seriella Airtable-anrop × ~177 ms EU-RTT (EF exekverar i anroparens region — förklarar CI-grön/lokal-röd deterministiskt, L284). Forensiken: ingen omedveten läcka — ADR-060 punkt 5:s MEDVETNA interim (S52-prejudikatet fanns). Åtgärd (Marcus-beslut väg B): markör-matchad MCP-radering av samtliga 354 ur staging-basen `apphjj8Q7lkXCMsL4` (bas-identitet trippelverifierad; seed + 4 icke-sentineler bevarade) → väg D 1,3 s ×3 · lokala sviten 294/296 → **296/296**. ADR-060 Updates-post (andra tröskeln); timeout-höjning + EF-parallellisering + A-härdning förkastade med motiv (`843fccd`).
- **TASK-13 Done** (`0ef57f4`): runtime-lyftet Node 20 → 24 LTS i EN ändring — .nvmrc 24 · engines `>=24` · @types/node ^24.13.3 (spegel-principen: NED från 25) · README-badgen; CI:s setup-node följde `.nvmrc` automatiskt. Kompat käll-verifierad (nodejs/Release: v24 Active LTS, EOL 2028-04-30 · Playwright: Node 20 UTE ur stödlistan · Vite 22.12+ uppfylls · Biome binär). CI-run 29679590743 grön per jobb med full Test+Build på **v24.18.0** (jobblogg-verifierat).
- **TASK-16 fött** (utan triage-etikett): ADR-060-purgens wiring — interim-premissen falsifierad ×2; återackumuleringstakten ~250 rader/månad ⇒ ~6 veckors horisont som deadline-signal på kortet (L285-mönstret).
- **Numrering:** ingen ny ADR (ADR-060 fick Updates-post; 73==73, nästa 074) · lessons **L284–L285** [UNIVERSAL] (miljö-delad latens = kedja × RTT × exekverings-region · tolererat interim kräver horisont + trigger) + 4 kandidater förkastade med motiv i Del 6 (nästa L286) · fälla 45 · tråd T78 (inga nya trådar).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-18-session-69.md`](../tasks/sessions/archive/2026-07/2026-07-18-session-69.md) (Del 1–6). **EJ fas-avslut.** Kvar efter S69: Dependabot-passet #58–#63 (+ pröva allowlist-avlistningen GHSA-gv7w-rqvm-qjhr) som S70-ingång · TASK-16 väntar Marcus-klassning · nästa PRD/parallell batch på 1.16.0.

---

## Session 70 — Dependabot-passet: inbox 0 (4 merges + 2 durabelt stängda + allowlist-rivningen + biome migrate + TS7) + TASK-16-klassningen (2026-07-19)

**Commit-range:** `601cba3` (sessionsdok-födelse) → HEAD. **Mål:** exekvera S69-handoffens första ingång — Dependabot-passet över parkerade vågen #58–#63 med felanalys-först-disciplinen + allowlist-prövningen GHSA-gv7w-rqvm-qjhr; TASK-16-klassningen i Marcus-takt. Ej byggplan-fas — deps-/underhållssession. Main-CI grön PER STEG genom hela kedjan; samtliga vakter asynkrona bakgrundstasks (R1, andra skarpa sessionen).

- **#58 (Actions ×2):** felanalysen friade paketen — rött var markdownlint-MD036 i Docs link check-jobbet (merge-ref äldre än S67:s ADR-010-fix, `d9b4ec1` 19:51 vs PR-CI 17:49) ⇒ ren L279-klass; parkeringens "trolig #46-klass"-hypotes falsifierad. Supply-chain FÖRE åtgärd: lychee-SHA == upstream v2.9.0-taggen exakt · advisory historisk (patched 2.0.2 < 2.9.0) · setup-node v6→v6.4.0 first-party pin-skärpning. Rebase → helgrön → `a39a388`.
- **#62 (@types/node 24→26) ⇒ durabel regel:** spegel-principen kodifierad som dependabot-ignore `version-update:semver-major` för @types/node (`fd3b628`; syntax käll-verifierad mot GitHub-docs; lyft-villkor i regelkommentaren). Dependabot stängde själv PR:n 08:45:38 som direkt reaktion — regeln bevisad i drift på sekunder; motiv-kommentar lagd för spårbarheten. Sidoeffekt öppet bokförd: config-re-parsen omgrupperade inboxen (#61 Biome-solo → #64 dev-deps-gruppen Biome 2.5.4 + vite 8.1.5).
- **Allowlist-rivningen (S17-tråden STÄNGD):** GHSA-gv7w-rqvm-qjhr riven ur audit-ci.jsonc (`606ffef`) — sluttillståndet STARKARE än riv-villkoret: esbuild HELT ute ur trädet (`npm ls` tomt; vite 8-erans bumpar drog beroendet), npm audit 0 träffar, audit-ci PASSED utan varningen; historik-kommentar per K0åh-formen; S17-riv-todon bockad i samma commit.
- **Merge-kedjan:** #59 tanstack ×3 (`667b239`) → #60 supabase-js 2.110.6 (`32cf128`) → #64 (`aec61cf`, dependabot-auto-rebasad) → biome migrate (`c19fd79`: schema-driften 2.4.15→2.5.4 stängd [S69-villkoret "vid nästa Biome-beröring"] + verktygets nyckel-rename recommended→preset; check 0 fel före/efter). L275-synk per steg.
- **#63 typescript 6.0.3→7.0.2 (nativa Go-kompilatorn) mergad på empiri** (`b3e3011`): registry-fakta (7.0.2 = latest sedan 2026-07-08; cooldown uppfylld) + upstream-annons (--build/--noEmit stödda; API-gapet berör ej repot) + **minimaltest i isolerad worktree FÖRE väg-val** (typecheck 2,0 s · build+PWA grön) + proveniens utan regression (attestations saknas ÄVEN på 6.0.3; signaturer intakta). Före/efter main-trädet: typecheck 7,85 → 2,5 s (~3×). Full Test+Build grön per jobb (run 29681765375). Rollback trivial; VS Code opåverkad by default.
- **TASK-16 KLASSAD ready-for-agent + medium** (`34f8ac8`; klassnings-akten = Marcus-ordern + Code-bedömning mot substrat-kontraktet): symptom dubbel-belagt, form ADR-beslutad (060 p3–4), design-frågorna inom utförar-ramen; ~6-veckors-horisonten = deadline-signal (nästa tröskel ≈ 2026-08-30); EF-only-gränsen inskriven i klassnings-noten.
- **Hygien + avvikelser (öppet bokförda):** labels `dependencies`+`ci` skapade (config-deklarerade men saknade — dependabots timeline-klagan) · **L280-återfall ×1** (tail-pipe maskade markdownlint-exit → `8c619e2` pushad röd [MD018]; fixad `976ec99`, grindar därefter på obruten exit-kod) · vakt-avvikelse ×1 → **L286** · npm install-lockfil-driften → **L287** · R2:s dependabot-gren skarpbevisad ×4 (parallella PR-runs under pågående main-run).
- **Numrering:** ingen ny ADR (ignore-regeln under ADR-baren, inom ADR-031:s ram; 73==73, nästa 074) · lessons **L286–L287** [UNIVERSAL] (vakt-matchning = headSha × workflow-identitet + jobbform-kontroll · npm ci som post-merge-synkverb) + 5 kandidater förkastade med motiv i Del 3 (nästa L288) · fälla 45 · tråd T78 (inga nya trådar; S17-riv-tråden stängd).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-19-session-70.md`](../tasks/sessions/archive/2026-07/2026-07-19-session-70.md) (Del 1–3). **EJ fas-avslut.** Kvar efter S70: TASK-16 plockbar (ready-for-agent, deadline-signal ≈ 2026-08-30) · nästa PRD/parallell batch på 1.16.0 · hub-lyftet L284–L287 vid nästa hub-beröring · Marcus-moment: Update-klicket i claude.ai.

## Session 71 — TASK-16: ADR-060-purgens wiring — sentinel-purge skarp i drift (22+288 raderade · kortet Done · L288–L289) (2026-07-19)

**Commit-range:** `cdac60c` (sessionsdok-födelse) → HEAD. **Mål:** exekvera TASK-16 via do-work-formen (Marcus-kvittens "Kvitterar A — kör TASK-16." efter öppen nu-vs-vänta-analys; L285-skulden: två tröskel-incidenter, ~250 sentineler/månad mot ≈2026-08-30). Ej byggplan-fas — tooling-/infrastruktursession. Delegerad senior-form på designen ("branschledarmässigt = den vägen").

- **Leveransen (`e57b2b2`):** setup-purge per ADR-060 p3–4 ordagrant — separat CI-jobb `Staging sentinel purge` FÖRE Test + Build (egen runner-VM, egen secret `STAGING_AIRTABLE_TOKEN` = least-privilege-PAT scopad till ENBART staging-basen; test-jobbet ser aldrig token, EF-only-gränsen intakt; `needs: [changed, purge]` med skipped-tolerans men failure-stopp; `ci-passed` aggregerar — inget falsk-grönt hål) + `scripts/purge-staging-sentinels.mjs` (universell logik) + `.purge-staging-policy.json` (config-driven per grindvakts-konventionen) + `npm run purge:staging` (lokal form, `.env.seed`) + guard-testsvit 23→25 fall (inkl. S52-ZZ-History-skyddet). Fyra skyddsräcken: bas-guard (prod hårt blockerad — staging/prod DELAR tabell-ID:n, data-model §ID-topologi) · ålders-guard 60 min i KOD på `createdTime` (`CREATED_TIME()` i filterByFormula odokumenterad — förstapartskälls-verifierat) · exakt markör-match · namn-agnostisk länk-guard. Live-schema-verifiering FÖRE design betalade sig: länk-fältet heter "Anmälningar (länkat fält)", inte "Anmälningar". Fetch-depth-invarianten respekterad (purge-checkout medvetet utan config-rad; EXPECTED_CI_CARRIERS=4 orörd).
- **Skarp-kedjan:** MCP-förbevis av formlerna → run 29685010681: Anmälningar **22/22 + efter-verifiering 0** ✓ men 288/288 event-sentineler länk-guardade på `Eventtyp` (konstruktions-obligatorisk typ-referens, ADR-066 b5) → **L288-klassen**: smal config-driven exkludering `linkGuardExcludeFields` (`d599953`, +2 tester) → run 29685680050: **288/288 raderade + efter-verifiering 0 + ålders-guarden skarp-bevisad live** (4+4 färska sentineler från föregående runs skyddade). Lokala formen dry-run-bevisad efter Marcus' `.env.seed`-moment (6+6 träffar, alla korrekt ålders-skyddade — basen ren).
- **Sidospår (ADR-053-triage: blockerar + utanför scope ⇒ STOPPA):** shields.io-outage fällde Docs link check 2× (attempt 1+2; dubbel-bevisad — lokal curl 000/15 s från separat nät; Errors 0, README orörd av leveransen) ⇒ Marcus-kvitterad väg A: `.lycheeignore`-post (add-only-beviskravet uppfyllt; badge-dekor utanför länk-grinden, jfr ADR-022 kat. 4) + badge-driften fixad (Biome major-only 2.4→2 · TypeScript 6→7) i `55b0157`, run 29685511779 grön per jobb.
- **Hygien + avvikelser (öppet bokförda):** CI-grön-första-pass: nej (extern outage + Eventtyp-fyndet; fail-safe-riktningen gjorde fyndet till ofarlig no-op, 0 felraderingar) · **L289-klassen**: MCP-förkollen frågade smalare än guardens faktiska predikat (två namngivna fält vs namn-agnostisk) — missade Eventtyp · L280-återfall ×1 (tail-pipe i lokala dry-run-verifieringen maskade exit; omkörd på obruten form) · gh-CLI-frågan (Marcus) besvarad verifierat: 2.88.1 bakom 3 advisories ⇒ `brew upgrade gh` → 2.96.0 efter sista vakten (lokalt verktyg — ingen repo-yta) · CI:s förväntade jobbform är nu SEX jobb (Staging sentinel purge tillkom; docs-only skippar purge+Test+Build by design, bevisat run 29685962055).
- **Numrering:** ingen ny ADR (formen var REDAN beslutad i ADR-060 p3–4 — wiringen är implementering; ADR-060 Updates-post bär landningen; 73==73, nästa 074) · lessons **L288–L289** [UNIVERSAL] (strukturell fail-safe-vakt måste skilja konstruktions-referens från data-koppling · förkontroll måste ställa vaktens faktiska fråga) + 4 kandidater förkastade med motiv i Del 3 (nästa L290) · fälla 45 · tråd T78 (inga nya trådar — Eventtyp-fyndet fixat i sessionen, shields.io löst durabelt).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-19-session-71.md`](../tasks/sessions/archive/2026-07/2026-07-19-session-71.md) (Del 1–3). **EJ fas-avslut.** Kvar efter S71: S72 = grillning + hela kedjan på event-vyn (Marcus-deklarerad riktning; ger skivor för parallell batch-test) · hub-lyftet L284–L289 vid nästa hub-beröring · Marcus-moment: Update-klicket i claude.ai.

---

## Session 72 — Event-listan: grillad samsyn → konvergens till FACIT (variant B, K1–K14) + skarpa skal-fixar + T78 (2026-07-19)

**Commit-range:** `18fad51` (sessionsdok-födelse) → `84e1a6a` (FACIT-landningen), 26 commits, samtliga CI-gröna per jobb utom fyra öppet bokförda röda under scrollbar-sagan (läkta `efeb288`). **Mål:** hela kedjan på event-vyn, listan först (Marcus-kvitterad S71-riktning). Ej byggplan-fas — design-/konvergenssession; skarpt bygge sker via PRD + skivor (S73+).

- **Grillningen (Del 2):** 8 Marcus-låsta beslut — hela familjen som mål/listan först · grund-arvet (allt ärvbart ärvs) · pill-toggle [Kommande|Tidigare] ersätter båda Selecterna · månadsgrupprubriker · 3-raders kort-anatomi · statusbadge endast vid avvikelse (**T14 reconcilierad**; ORDLISTA-posten **Period**, `f4b406a`) · strukturerat text-tomläge · arkitektursnittet (pill-toggle = primitiv; EventCard vy-lokal; `?period` ersätter `?status`+`?sort`). FK-referensen +9 bilder (vab-wizardserien IMG_1590–1598, `3a3887d`).
- **Konvergensen (Del 3; T66-instans 3, prototype-skillen; facit-kanon = bilagan `s72-event-lista-konvergens/`):** K1 baslinje → Marcus-divergens A/B → **B vann** (Hem-kortets grammatik) → **Steg 2** slot-modellen (likformiga kort, badge-formen prövad-och-riven, semantisk status-slot, Fullbokat = grön kontur, Inställt = dimmat + genomstruket, "bor över"-raden) → **Steg 3** kalendervyn (RAC Calendar-motorn + FK-skinnet; vy-ikon-toggeln; solida kursfärgs-tiles == legenden; månadssummeringen) → **FACIT** ("vi låser hela event-listans yta"). Variant/steg-identitetsmodellen etablerad (Marcus-modellen, K4). Prototypen DEV-grindad på `/event?variant=…`, demo-data default; lifecycle över sessionsgränsen öppet triageat (klausul v: konvergens-substrat för familjen).
- **Skarpa leveranser:** scrollbar-formen `5f93c9a`→`8cc25ea`→`efeb288` (lg-scopad `stable both-edges` + diskret thin-tumme, ny token `--mm-scrollbar-thumb`; 2 CI-röda = facit-testernas förtjänst, röd→grön + full e2e-svit [156 passed] före läkning) · **T78 född** (PrototypeSwitcher-standardiseringen; hub-delen egen landning per T66-precedentet, buntas med hub-lyftet).
- **Avvikelser (öppet bokförda):** 4 röda main-commits (scrollbar-sagan) · L280-återfall ×2 · kort-SHA-vakten (evig tystnad, Marcus-knuff) · stale dev-server på 5173 (L275/L282-klassen bekräftad i drift). PRD-krav avtäckt: **"bor över"-antalet FINNS EJ i basen** (additivt fält per ADR-063 + EF-/modell-utökning).
- **Numrering:** ingen ny ADR (allt under baren; 73==73, nästa 074) · lessons **L290–L291** [UNIVERSAL] (vaktens fråga bevisas besvarbar före armering [skärper L286/L289] · grind-förkontroll = grindens HELA form [instansierar L289 på svit-nivå]) · fälla 45 · tråd **T79** (T78 född S72) · nästa lesson L292.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-19-session-72.md`](../tasks/sessions/archive/2026-07/2026-07-19-session-72.md) (Del 1–4) + bilagan [`tasks/sessions/bilagor/s72-event-lista-konvergens/`](../tasks/sessions/bilagor/s72-event-lista-konvergens/). **EJ fas-avslut.** Kvar efter S72: **S73 = EVENTSIDAN (detaljvyn `/event/$eventId`)**, Marcus-deklarerad; öppen punkt list-PRD:ts födelsetidpunkt · hub-lyftet L284–L291 vid nästa hub-beröring · T78 · Marcus-moment: Update-klicket i claude.ai.

---

## Session 73 — Eventsidan K1–K72 → FACIT + Skapa-utökningen K73–K85 → FACIT + S56 stängd + fyra skarpa leveranser (2026-07-19 → 2026-07-20)

**Commit-range:** `fc9f2fb` (dok-födelse) → HEAD; 85 K-iterationer över FEM konvergens-pass, TRE pauser/resumes (ADR-051/ADR-069 i drift ×3). **Mål:** eventsidan (detaljvyn) genom konvergens till facit + administrativ S56-stängning; utökat på Marcus-fångst med Skapa nytt event (ingång + sida). Ej byggplan-fas — design-/konvergenssession; skarpt bygge via PRD + skivor (nästa session).

- **EVENTSIDANS FACIT (K1–K72, Del 3–6):** Marcus 2026-07-20 "nöjd … efter 72 iterationer". Formen: topprad → check-in-kort → Åtgärder (hover-plattan K72) → Om eventet + Beläggning (Ändra-morfen Δ=0) → Anmälda deltagare (arbetskö-accordions + hantera-flödet + Bekräfta alla) → Betalningar (inline-arbetsytan) → NÄRVARO-REGISTRET (K60) → GRUPPDYNAMIK (K63–K65) → ANTECKNINGAR (K66–K71: tidsstämplad ström, härledd Under/Efter-fas, auto-grow-composer). Facit-SHA `9826278`; kanon = bilagan `s73-eventsida-konvergens/` (8 skärmar + trail).
- **SKAPA-UTÖKNINGEN (K73–K85, Del 7):** post-facit-fångst → väg A. K74-ingången (kapsel på vy-väljarraden; K73-titelradsformen riven) → K75 sidan i K17-formklassen mot CreateEventForms fältfacit (create-event-EF:en FANNS — Fas 6f) → publicerings-HANDTAGET (slide-to-confirm per Resend-research; toggle + grön fyllnad prövade-och-rivna; pling + bock; drag-vakter + ref-buret drag-tillstånd) → språktrailen Kurs→Utbildning→**Event/Eventtyp** (ORDLISTA öppet dubbelrättad) → mono-domänen · "2 dagar"/"1 dag" · obligatorisk-rivningen. Facit-SHA `a303c65`; +3 skärmar i bilagan; **T79 född** (custom miranon.se — Shopify/Elfsight-ersättningen; publiceringsflaggan FINNS EJ i basen, live-verifierad).
- **Skarpa leveranser (4):** headern riven app-brett (`ac3f198`, K1) · sage-gröna `#606B57` (K49, tokens + spec) · scrollbar-arvet från S72 stod · **K85 fokus-modalitets-fixen** (`5e9809c`: `[data-rac]:focus-visible:not([data-focus-visible])` — falsk ring vid mus-öppnade dropdowns släckt app-brett, tangentbordsindikationen verifierad intakt; fulla grindar 296 API + build).
- **S56 administrativt stängd** (Del 2): lifecycle → closed + skörd L292–L293 + T65 closed (TASK-4 helt Done).
- **Avvikelser/incidenter (öppet bokförda):** K69-grindincidenten (obunden förkontroll-kedja → röd push, läkt `2cbcaed`) · facit-landningens MD004 (radbrytnings-plus, läkt `9bd3b00`) ·  Vite-watchern DÖV ×2 (levande server, stale modul — curl-verifierings-formen etablerad) · GitHub sekundär-throttling på CI-efterkontroller (403 med full kvot) · enda röda runs genom fem pass: K56 + K69 + `c94b90e` — alla öppet bokförda och läkta.
- **Numrering:** ingen ny ADR (allt under baren; 73==73, nästa 074) · lessons **L292–L304** (S56-skörden + 11 ur 18 kandidater; kandidat 3 förkastad som L286/L290-instans, kandidat 4 som L25-förstärkning — motiv i Del 8) · tråd **T79** (nästa T80) · fälla 45 orörd · hub-lyftet L284–L304 + T78-hubhalvan buntat till nästa hub-beröring.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-19-session-73.md`](../tasks/sessions/archive/2026-07/2026-07-19-session-73.md) (Del 1–8 + Paushistorik ×3) + bilagan [`tasks/sessions/bilagor/s73-eventsida-konvergens/`](../tasks/sessions/bilagor/s73-eventsida-konvergens/) + S72-bilagans utöknings-notering. **EJ fas-avslut.** Kvar efter S73: **PRD:erna för HELA event-familjen** (lista + eventsida + skapa; /to-prd → /to-issues → ADR-073-batch) · chevron-konsekvensen (Marcus-kvittens) · hemvist-/Mer-ingångsfrågorna (avgörs i PRD) · T79-spåret · hub-lyftet · Marcus-moment: Update-klicket i claude.ai.

---

## Session 74 — Familje-PRD:erna + 25 skivor: event-familjens exekverings-underlag komplett (2026-07-21)

**Commit-range:** `6c9d409` (dok-födelse) → HEAD. **Mål:** S73-handoffens NÄSTA — familje-PRD:erna (lista + eventsida + skapa) via /to-prd → skivor via /to-issues. Ej byggplan-fas — spec-/skivningssession; skarpt bygge = /work-batch (nästa session).

- **PRD-korten (Del 2):** TASK-17/18/19 publicerade via backlog-CLI:t ur S72/S73-faciten (mallens ###-form; DoD-extra: L220-design-review mot facit + L245/L246-avprickningen + bas-additivitets-grinden ADR-050/ADR-063). Underlag: Explore-svep + egen läsning — EF-gap-kartan (uppdatera-event · slutbetalning/notering · bekräfta-anmälan · bor över · event-anteckningar · närvaro-write SAKNAS; skarpa 6b/6c/6f-ytor finns = ombyggnad, ej nybygge). Skarv-kvittensen + 4 designbeslut Marcus-kvitterade per rekommendation: två befintliga skarvar (api + e2e/axe) · chevron-regeln rivs öppet · hemvisten event-familjens skapa-route + Mer-ingången rivs · Anteckningar = ADDITIV tabell (egen ADR vid skivan) · publiceringsflaggan additiv nu (kontraktet = T79; registerraden synkad).
- **Skivorna (Del 3):** 25 barn i beroendeordning — TASK-17 ×6 (17.3 kursfärgs-tokensen = prefaktorering, delas av kalendern + gruppdynamiken) · TASK-18 ×14 (arbetskön DELAD skelett/personkort på Marcus-delegerat storleksval; 18.13 familje-rivningen med dep på alla 21 bygg-skivor) · TASK-19 ×5. ready-for-agent ×22 + QA ready-for-human ×3 (konkreta manuella testplaner); DoD-arvet per skiva. Klartext-avstämningen (Marcus-fångst "för diffusa" → L305) låste deadline-regeln start − 14 dagar (18.8 → ready-for-agent). Graf-verifierad: tre disjunkta startkedjor (17.1+17.3 ∥ 18.1 ∥ 19.1) = ADR-073-partitions-kandidaterna.
- **Avvikelser:** inga röda runs (alla gröna per jobb, docs-only-formen; TASK-15-symptomet reproducerades inte trots UTF-8-kortfilnamn) · MD018-fångst lokalt vid dok-födelsen (läkt före push) · /to-prd-invokeringen blockerad av disable-model-invocation → cache-läsnings-formen (L306).
- **Numrering:** ingen ny ADR (73==73; Anteckningar-ADR:n mintas vid TASK-18.11) · lessons **L305–L306** (kandidat 3 MD018 förkastad med motiv — Del 4) · inga nya trådar (T79-raden synkad) · fälla 45 orörd.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-21-session-74.md`](../tasks/sessions/archive/2026-07/2026-07-21-session-74.md) (Del 1–4). **EJ fas-avslut.** Kvar efter S74: exekveringen (`/work-batch` på Marcus-order med max-kort; ev. 2-pipeline-partition på startkedjorna) · gransknings-skulden betalas i QA-vågen (TASK-4.6-precedenten) · prod-deploy av fält/EF separat auktoriserad · hub-lyftet L284–L306 + T78-hubhalvan · Marcus-moment: Update-klicket i claude.ai.

---

## Session 76 — T80/T81/T82-mellansessionen: två grillningar → ADR-071-amendering + ADR-074, hub-bunt 1.18.1, reinstall-praxisen, TASK-29 i två vågor (2026-07-22)

**Commit-range:** `11f7047` (dok-födelse) → HEAD. **Mål:** ordningsfrågans verkställande (S75 pausad orörd) — egen mellansession för T81 + T80 (+ T82 på Marcus scope-utökning) FÖRE S75-resumens batch. Ej byggplan-fas — process-/dev-verktygs-session.

- **T81 (Del 2):** grillad samsyn 5 beslut (alla A, research: Google eng-practices · Conventional Comments · Bugzilla · Scrum/DoR · K8s-triage) → **ADR-071-amenderingen**: klassrymden 3+2 (FIX · FACIT-REVIDERING · ITERATION + INGEN DEFEKT · STALE LÄGE) med TVÅDELAT gränstest (komplett direktiv? + inom levererad yta? — ersätter avsikts-formeln öppet) · fix-vågens femdelade kontrakt (EN PR/våg, merge-commit, rött-först, STOPPA-klassning som kvitto, DoD #5 öppen) · iterations-skivans triage-födsel + ready-for-agent-grind · Done-flipp-grinden per klass (`16bb045`).
- **T80 (Del 3):** research FÖRE design (Storybook · Histoire [tunt, öppet deklarerat] · Vercel Toolbar · Chromatic/Applitools · Polypane · preview-env-praxis) → **ADR-074** (adress-strukturen: stabila nycklar `a/b/c`, VINNAREN BEHÅLLER NYCKELN [alias-rotorsaken], steg EJ i URL · växlar-standarden · jämförelsen: snapshot-par + fönster-lagret, compare-route deferred med re-trigger) + URL-STATE-SPEC §Dev-parametrar + TASK-29 född + **T83** reggad (Claude Design/DesignSync — Marcus-frågan; Storybook-MCP ej aktuell, bokförd i ADR-044-vågskålen) (`434f1ad`). Sido-svar: Storybook-MCP verifierad som gränssnitt TILL Storybook-instans.
- **Hub-bunten (Del 4):** plugin 1.17.0→**1.18.0** (hub `1f9ca16`) — prototype-skillens Standard-form (T78 b) · work-batch T81-referensraden · **T82-flippen 6 av 7** (work-batch KVARLÅST per ADR-071 b1 — kollisionen riven öppet i STOPPA-frågan; Marcus A). Trådar STÄNGDA: T78/T80/T81/T82 (`1e873ec`).
- **Reinstall-praxisen (Del 5, Marcus-korrigering skarp ton):** `claude plugin update` är CODE-praxis i SAMMA landning som varje bump — aldrig Marcus-moment; skarpbevisad ×2 (1.16.0→1.18.0 + praxis-bumpen **1.18.1** hub `ce9dec5` som åt sin egen praxis); tre durabla ytor (minnes-post · hub-README § Distributions-praxis · **T18 STÄNGD**) (`8ab7fc0`).
- **TASK-29 (Del 6, do-work-formen ur 1.18.1-cachen — Skill-vägran = registerfrys, väntat):** leverans 1 pill `dadd8a3` → **CI RÖD** (run 29933197540: "Visa prototyp-växlaren" × appens `/^Visa/`-frånvaro-assertion; wrapper-exit-fångsten — vaktens äkta exit i FILEN) + Marcus facit-revidering mid-turn (underkännande #2 → L299 klassbyte) → leverans 2 **IKON-RAIL** `a123254` (dockad dragbar rail med tooltips; ADR-074-amendering river pill-formen öppet; ref-synkron POS_KEY-persistens efter rött-först-fångst) → CI-run 29934613949 grön per jobb → stängnings-commit `3715621`, kortet **Done** (AC 1–3 superseded → AC 7–9; 2 defekter rött-först-fångade).
- **Gransknings-vågorna 2–3 (Del 8, post-end-pass på Marcus-granskning):** polervågen `e32839e` (ADR-074 Am. 2: grip utan tooltip · beaker-ikon vid EN variant [K-frågan] · normalvikts-tooltips · KONSTANT höjd via reserverad soft-disablad data-plats · sidflipp · tangentbords-flytt + fokus-ring) + mikrocopy-vågen `4ba99c3` (Am. 3 river A2:s öga öppet: app-fönster-ikon · nytt-fönster utan tooltip · mikroform-copy). Två praxis-korrigeringar till minnes-poster: reinstall-praxisen (Del 5) + CI-vakt-alltid-bakgrund (Del 8). **L310** skördad (UI som människa konsumerar bär design-review-grind vid födseln — TASK-29:s Done-flipp före Marcus blick var för tidig).
- **Vågorna 4–6 + MEKANISKA CI-vakt-grinden (Del 9–10):** mjukhets-vågen `4560c4d` (Am. 4: intent-fördröjd tooltip-entré + mjuk 8 px-pil) revs av **A5-vågen** `30ccc6b` (Am. 5: tooltips UT helt — aria-labels = golvet · badgen ALLTID synlig · RÖRELSE-FÖRBUDET: transparent kant på inaktiv håller badge-ankaret konstant, Marcus-fångsten "siffran rör sig" mekaniserad som boundingBox-assert). **PreToolUse-hooken** `ab52cd5` nekar foreground-CI-vakt mekaniskt (Marcus: "minnes-poster litar jag inte på") — skarpbevisad ×2 + allow-bevis + en ÄKTA falsk-positiv (v1 bet sin egen commit → position-ankrad regex, 5/5 regressionsfall). **DESIGN-REVIEW GODKÄND:** "Nu är det skitbra" → TASK-29 Done slutgiltigt (SEX vågor, 16 AC, 3 defekter rött-först-fångade).
- **Avvikelser:** run 29933197540 väntat-oväntat RÖD (äkta fångst, ej flake) · MD004 radbrytnings-plussets instans 2+3+4 läkta före push (instans 4 nådde CI — Docs link check röd en gång, `d51b4dd` läkning) · en pipe-maskerad exit + en ogrindad commit-kedja + en cd-läcka self-fångade · session-end kördes före växlar-godkännandet (L310-rotorsaken).
- **Numrering:** ADR **074** mintad (+6 amenderingar: 071 ×1 + 074 ×5) · lessons **L307–L310** ([UNIVERSAL] ×3 + L310 process) · trådar T83 född; T18/T78/T80/T81/T82 stängda · TASK-29 Done GODKÄND (16 AC över sex vågor) · nästa: 075/L311/T84/f45/TASK-30.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-22-session-76.md`](../tasks/sessions/archive/2026-07/2026-07-22-session-76.md) (Del 1–7). **EJ fas-avslut.** Kvar efter S76: S75-resumen (work-batch 12, huvudspåret) · review-loopens Done-flippar (fråga 4) + TASK-25 · hub-lyftet L284–L309 (buntat vid hub-sync-moment) · GRANSKNINGSDATA-städet · T83/T63 vid design-horisonten · Marcus-moment: Update-klicket i claude.ai.

---

## Session 75 — Batch-exekveringen + review-vågorna: event-familjens 25 kort hela vägen till Done, prod-basen speglad (2026-07-21 → 2026-07-23)

**Commit-range:** `d71d7ad` → `c65ce26` (188 commits). **Fem pauser, fem resumer** — sessionen spände tre dygn och bar S76 som mellansession (T80/T81/T82) inuti sitt eget span; numret 75 bevarades genom hela kedjan per ADR-051/ADR-052.

**Mål:** exekvera Marcus batch-order AFK (work-batch, max 22 kort, två pipelines) och driva event-familjen till granskad, godkänd leverans.

- **Batch-exekveringen (Del 1–7):** work-batch v1 → HALT på claims-luckan `src/domain/**` → väg-beslut A → v2 → audit-HALT på två upstream-advisories → läkning → v2.1: **21 av 22 skivor byggda och mergade** i tolv PR:er. Täcknings-passets premiär (15 gap på 21 kort) rättfärdigade mekanismen empiriskt; ADR-073 fick Amendering 3 (täcknings-grind + delade-ytor-register + konflikt-mandat).
- **Review-vågorna 1–5 (Del 8–16):** Marcus granskade i browsern; utfallen klassades per ADR-071-amenderingen (fix-våg vs iterations-skiva). **PR #78–#94** levererade kalenderpaketet, Extra platser-fixen, gutter-gränsen lg→sm, Bekräfta alla-rundningen, tomlägena, Spara/Rensa-composern, datumspann-kollapsen, den DYNAMISKA grön-regeln (Marcus-formen slog Codes statiska K77-A) och publicerings-promptens vikt. **MiranonSe-komponenten riven** (K81-sagan stängd på ett dygn). Fem iterations-skivor föddes: 18.16–18.19 + 17.7/18.15.
- **STALE LÄGE-fyndet (Del 15):** batchen ändrade 10 Edge Functions men bara 3 var staging-deployade — Marcus granskade mot gamla svars-shapes. Alla 10 redeployades; **L318** skördad (deploy-verifiering är egen grind; mockade e2e döljer drift).
- **Omgransknings-protokollet (Del 17–18):** författat som bilaga och kört yta för yta med Marcus vid rodret. **21/21 kort Done.** Sex kort bar öppna bevis-grindar utöver design-reviewen — samtliga stängda med färsk mätning mot skarp staging (computed färgvärden, viktparitet, härledd bor över-räkning, korthöjds-par 147 px == 147 px), aldrig med påståenden.
- **Fix-våg 6 — det GLOBALA hoppet (PR #95):** Marcus fångade att innehållet flyttade sig när en väljare öppnades. Rotorsak källäst i React Arias `usePreventScroll`: inline `scrollbar-gutter: stable` på `<html>` river vår symmetriska `both-edges` vid VARJE overlay-öppning (5,5 px centrerat / 11 px vänsterställt). Fix: author-`!important` + fyra skal-kontrakt i `tests/a11y/scroll-lock.spec.ts`. **L311 + L312** skördade.
- **Fix-våg 7 + governing-konflikten (PR #96–#97):** bekräftelse-copyn kopplad till beläggnings-modellen och märkningen till K84 — vilket krockade med ACCESSIBILITY-CHECKLIST:s "(obligatorisk)"-rad. STOPPA → Marcus-beslut A → raden **riven öppet** och ersatt av den tvådelade regeln (programmatiskt alltid via `isRequired`; visuellt på UNDANTAGEN; naken asterisk förbjuden; GOV.UK-mönstret namngivet), med följdarbete i Input-primitiven och /dev/primitives.
- **TASK-18.13 familje-rivningen (PR #98):** prototyp-substratet rivet; växlaren fick hemvist `/dev/prototyper` (Marcus-beslut B — verktyget var beslutat permanent men hade efter rivningen noll konsumenter OCH noll testtäckning). **Typecheck stoppade rivningen** av tre "döda" ytor som visade sig ha levande konsumenter → Marcus-beslut A: de står kvar, gated på ersättarna. **L313** skördad.
- **QA-korten 17.6/18.14/19.5:** Marcus körde de manuella testplanerna själv och flippade korten.
- **PROD-BASEN SPEGLAD (Del 18):** nio additiva ändringar på Marcus-auktorisering — Anteckningar-tabellen (`tblaUhH1KF9k9imul`) + fem fält på Anmälningar + tre på Eventplanering, varje definition hämtad ur staging FÖRE skrivning och varje skrivning verifierad med återläsning. Gapet var tio poster, inte tre som handoffen antog. `Väntelista (länkat fält)` speglades MEDVETET INTE (prods fält är singleLineText → typkonvertering, ej additivt). Forensik-fyndet som gjorde vågen säker: EF-lagret adresserar fält på NAMN, aldrig ID — verifierat mot att `Idempotensnyckel` bär olika ID i de två baserna.
- **Avvikelser:** Actions-instabilitet i kluster (fördröjd run-skapelse · jobb-API-släp · cancelled körning · jobb-timeout som rapporteras `cancelled`) → **L319** · review-våg 7 fick inget rött CI-varv eftersom PR:en öppnades efter fix-committen → **L317**, öppet bokfört · två flakes i fullsvit gröna ensamma (`send-email.staging` + `patterns/Listbox`, TASK-34:s isolerings-klass) · CI-vaktens falsklarm på förkortad SHA → **L314**.
- **EF-delen SKJUTEN, öppet motiverad:** prod kör 11 av 13 allowlistade funktioner flera versioner efter staging och saknar notes-EF:erna — T39 i full omfattning; T40:s autentiserade prod-smoke är inte uppsatt. Eget pass. **FYND:** `test-auth` ligger deployad i prod trots allowlist-förbudet (från tiden före allowlisten).
- **Numrering:** ingen ny ADR (075 kvar; K84-förenandet bars av befintlig spec, under ADR-baren) · lessons **L311–L320** ([UNIVERSAL] ×8) · tråd **T84** född (guidad omgranskning som praxis) · fynd-kort **TASK-35** (test-auth i prod) · nästa: 077/L321/T85/f45/TASK-36 *(rättat i S77 steg 0: raden skrevs "076" men session 76 var redan förbrukad av mellansessionen — disk-verifieringen vinner)*.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-21-session-75.md`](../tasks/sessions/archive/2026-07/2026-07-21-session-75.md) (Del 1–18). **EJ fas-avslut.** Kvar efter S75: EF-delen av prod-deployen (T39/T40) · test-auth-städet · väljar-grillningen 18.18/18.19 + bygget · 17.7 · 18.15 · 18.16/18.17 i backlog-ordning · hub-lyftet L284–L320 · Marcus-moment: Update-klicket i claude.ai.

## Session 77 — Processgransknings-landningen: merge-grinden mekaniserad, Test+Build splittat, riskanpassad CI designad (2026-07-23)

**Commit-range:** `d913850` (dok-födelse) → `07d6482` (PR #100-mergen) + avsluts-PR. **Mål:** svara upp den externa processgranskningen (Codex 2026-07-23) och Codes verifikation — våg 1 exekverad med bevis, våg 2 designad, upptag i tråd-substratet (T85). Ej byggplan-fas — process-/infrastruktursession. Förarbetet (verifikation, design, Marcus-besluten A+A, artefakter med förkörda grindar) gjordes i ett läs-pass parallellt med S75; sessionen föddes först efter S75:s landning.

- **Steg 0 — sista direktpusharna:** Codes verifikations- och beslutsläges-sektion in i processgranskningen (`f9ef244`) + BUILD-LOG-numrerings-erratumet 076→077 (`ad1fb1f`); runs 30021430017 + 30021555024 gröna per jobb.
- **MERGE-GRINDEN AKTIVERAD ([ADR-076](decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)):** ruleset `main-skydd` (id 19627609) — PR-krav 0 approvals (solo-paradoxen löst) + required check "CI Passed or Skipped" strict up-to-date + force-push-/deletion-block + TOM bypass-lista; `allow_auto_merge` på. Grind-bevis: direktpush AVVISAD med regelutslag i klartext · konfig-återläsning · PR #99 `BLOCKED`→auto-merge. ADR-029 utelämning #5 STÄNGD efter 2 månaders deferral (→ **L321**). All bokföring går hädanefter via auto-merge-PR (Marcus beslut A).
- **ci.yml-vågen (PR #99 `36f06ef`, run 30022170992 grön + AUTO-MERGAD):** actionlint release-pinnad 1.7.12 + downstream-SHA256 (utelämning #3 stängd; shellcheck-mönstret) · Test+Build → `test-fast`/`a11y`/`test-staging` (staging-mutexen bärs ENDAST av test-staging; dependabot-skip på jobb-nivå → ADR-073-am. 2:s villkorliga grupp RETIRERAD) · fetch-depth-bärar-invarianten 4→3 (grind-skript + 7/7-testsvit i samma commit; ADR-039-not). **Split-empiri första skarpa runnet:** Pure+Build-signal 29 s (gamla formen: ~10 min till första signal) · a11y 1:32 parallell · staging 8:35 ensam på mutexen (förr höll jobbet låset 9:57). Main-backstop 30022889189 grön.
- **Steg 4 (PR #100 `e291a82`, auto-mergad; main-run 30023159762 grön):** ADR-076 + katalograd + README-räkningen 75→76 · ADR-029 två Korrigering-noter · ADR-039-not · CONTRIBUTING § PR-flöde = mekanisk sanning + jobb-namn-synk · våg 2-designen landad som [riskanpassad-ci-design-2026-07-23.md](research/riskanpassad-ci-design-2026-07-23.md) (D1-klass + merge-dedup via tree-hash + nightly/larm + mätning; visual från noll med CI-födda baselines; rött-först-bärarbytet [beslut A] till våg 2c; våg 3-riktningen mot ADR-063) · tråd **T85** registrerad (rad + kort).
- **Avvikelser (öppet bokförda):** MD004-instans i NY form — radbruten `+` inuti BLOCKQUOTE (`> + …`) flippade dokumentets consistent-förväntan; förkastad som ny lesson med motiv (L222-instans; spårdata: quote-prefixet gömmer markören för `^+`-grep — sök `^> \+` också) · MD018-instans (radbruten `#3`) · båda läkta lokalt före push · **END-PASS-INCIDENTEN:** L149-recidiv (grind i &&-kedja) släppte en MD038 till PR nr 101, vars RÖDA run ändå auto-mergades — aggregatorn skippades av sitt if-villkor och en skippad required check räknas som uppfylld (fail-open-hålet; runs 30023934304/30024005788) → main rött, backstop-fångat inom minuter, läkt i fix-PR med FAIL-CLOSED-aggregator (kör alltid, failar explicit; **L322** + ADR-076-not; fail-grenens gate-proof = bevis-skuld → T85 våg 2a). Sessionens facit: first-pass-grönt t.o.m. PR #100; incidenten är sessionens enda röda — och dess mest värdefulla bevis: backstopen fungerade, hålet stängdes samma stund.
- **Numrering:** ADR **076** mintad · lessons **L321–L322** ([UNIVERSAL] ×2; kandidat MD004-quote förkastad med motiv) · tråd **T85** född (rad + kort) · fälla 45 orörd · nästa: 078-session/077/L323/T86/f45/TASK-36.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-23-session-77.md`](../tasks/sessions/archive/2026-07/2026-07-23-session-77.md) (Del 1–4). **EJ fas-avslut.** Kvar efter S77: våg 2a (D1 + dedup + nightly + mätning) · 2b (visual) · 2c (ADR-071-amenderingen, beslut A låst) per T85 i Marcus-takt · våg 3 vid bas-maximeringen (ADR-063, post-Fas-6) · T56 djupa moduler-passet vid naturligt fönster (Marcus-prioritet, SKA-kravet 2026-07-23) · hub-lyftet L284–L321 (buntat till hub-sync-moment) · Marcus-moment: Update-klicket i claude.ai.

## Session 78 — T85 våg 2 speccad + 36.1 gate-proof levererad via work-batch (2026-07-23)

**Commit-range:** `db6ef53` (dok-födelse) → `e9712273` (36.1-stängningen) + avsluts-PR. **Mål:** ta upp T85 våg 2a/2c — syntetisera design-doket till PRD + skivor, och exekvera de subagent-lämpliga skivorna via work-batch. Ej byggplan-fas — CI-/infrastruktur- och arbetssätts-session.

- **Spec-landningen (PR #105):** `/to-prd` → **TASK-36** (PRD "Riskanpassad CI — T85 våg 2") + `/to-issues` → **åtta skivor** i beroendeordning; sekvens-invarianten (nightly före D1/dedup) kodad som deps (36.2→36.3→36.4), inte buren av minne.
- **Cache-dedupen FALSIFIERAD öppet (→ L325):** design-dokets `actions/cache`-mekanism (gröna PR-runs skriver nyckel, main-push läser) riven mot GitHub Docs — en pull_request-cache är merge-ref-scopad och "can only be restored by re-runs of the pull request", osynlig för main-push-runnen → permanent cache-miss utan synligt fel. Ersatt med `HEAD^2`+tree-ekvivalens+`gh run list --commit` (Marcus väg A), bevisad mot disk+API på merge-commit `db6ef53` FÖRE förslag. Rättelse-not i design-doket; ADR-077 bär rivningen.
- **work-batch (Marcus-avfyrad, max-kort 3, seriellt) — 36.1 gate-proof DONE (PR #107 `b412bb8` + stängning #108 `e9712273`):** `.github/workflows/gate-proof.yml` bevisar **S77:s bevis-skuld BETALD (L322)** tvåsidigt — positivt bevis run 30032296699 GRÖN (paraply-repliken kör `always()` + verbatim fail-closed jq-gren blir `failure` på framkallat rött jobb), negativ self-test (`simulate_skip=true`) run 30032299223 RÖD (skippad paraply-check fångad av assert-jobbet). Leverans-CI 30031630066 grön per jobb.
- **Avvikelser (öppet bokförda):** (1) **subagent-kontext-friktion (→ L323)** — do-work-subagenten byggde + levererade PR #107 men returnerade före CI-grön (kontexten bär ej den asynkrona tvåstegs-svansen); orkestratorn övertog CI-vänta + gate-proof-avfyrning + stängning (parallell-formens rollfördelning seriellt). Kontraktets oberoende disk-verifiering räddade läget. (2) **kurskorrigering (→ L324)** — 36.2 (nattnätet) felklassad "additiv subagent-batch"; nightly kräver ci.yml:s fulla svit ⇒ ci.yml-klass. Beslut (väg A): 36.2/36.3/36.4 tas som ETT ci.yml-arbete under direkt hand med reusable-workflow (en källa), ADR-077 där. Work-batchen levererade därmed 36.1 (enda subagent-lämpliga plockbara); 36.5 dep-blockerad, 36.6 är ADR-amendering.
- **Genomgående first-pass-grönt:** noll röda CI-runs över PR #104–#108 + två gate-proof-avfyrningar med exakt förväntat utfall.
- **Numrering:** ingen ny ADR (076 kvar; ADR-077 mintas vid ci.yml-arbetet S79) · lessons **L323–L325** ([UNIVERSAL] ×3: subagent-CI-svans · risk-klass≠fil-hemvist · GHA-cache-scoping) + L322-not uppdaterad (skulden betald) · ingen ny tråd (T85 uppdaterad med bevis-skuld-kvittensen + replik-drift-bärare) · fälla 45 orörd · nästa: 079-session/077/L326/T86/f45/task-37.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-23-session-78.md`](../tasks/sessions/archive/2026-07/2026-07-23-session-78.md) (Del 1–4 + HANDOFF). **EJ fas-avslut.** Kvar efter S78 (HANDOFF på toppnivå i sessionsdoket): ci.yml-trion 36.2 (reusable nattnätet) → 36.3 (D1 + `.playwright-mcp/`-gitignore) → 36.4 (dedup HEAD^2-formen) + ADR-077 · 36.5 (mätskript) → 36.6 (rött-först) → 36.7 (visual, egen session) → 36.8 (QA) · hub-lyftet L284–L325 · Marcus-moment: Update-klicket i claude.ai.

---

## Session 79 — T85 våg 2a KOMPLETT: ci.yml-trion (36.2 nattnätet + 36.3 D1-klassen + 36.4 merge-dedup) — reusable fullsvit, larmkedja, riskproportionell CI, innehållsadresserad dedup + ADR-077 (2026-07-23)

**Commit-range:** `9b6daec` (dok-födelse) → stängnings-PR. **Mål:** ta `ci.yml`-trions första skiva (36.2 nattnätet) i land under direkt hand (L324), som reusable-workflow-extraktion. Ej byggplan-fas — CI-/infrastruktur-session.

- **Av-riskande spike FÖRE refaktor (run 30036119790, kastad):** bevisade `workflow_call` + `secrets: inherit` (secret-arv längd 40) + job-nivå `queue: max` i reusable-kontext — de tre okända — innan `ci.yml` rördes. Rev spiken (branch + remote) efter bevis.
- **Reusable-extraktionen (PR #112 `55283ae`, CI 30037766751 grön inkl. staging skarpt):** tunga sviten (purge · pure+build · a11y · staging) → **`ci-suite.yml`** (`workflow_call`), anropad av både `ci.yml` (presubmit, villkorat) och **`nightly.yml`** (schema ~03:00 + dispatch). De TRE fetch-depth-bärarna (changed/lint/docs) ORÖRDA i ci.yml (invariant grön: 3); `ci-passed` needs → `[changed, lint, docs, suite]`, jq byte-identisk ⇒ fail-closad genom refaktorn (L322); bevis-skuld-kommentaren → betald.
- **ADR-077 mintad** (klassning + dedup + nattnät; cache-rivningen L325, nightly-valet L324, visual i konsekvens-del) + README 76→77 + katalograd. CONTRIBUTING § Nattnätet (stängningsregeln, aldrig tyst). `ci-natt`-label skapad.
- **Nattnätet skarpt bevisat (manuella dispatchar, run-ID citerade):** grön natt run **30039548355** — full svit + no-cache-länk + moderate-audit gröna, **larm-jobbet SKIPPAT, noll ärenden** (AC#1/#4/#6). Rött via `simulate_failure=true` run **30039559724** → larm skapade **ärende #114** korrekt (tilldelad marcus803, label `ci-natt`, run-länk + spann-rad) (AC#3). Test-ärendet stängt med öppen motivering (dess egen regel praktiserad).
- **gate-proof re-kört på main (run 30038462683 GRÖN):** L322 fail-closed bekräftad genom reusable-refaktorn (DoD#6).
- **Avvikelser (öppet bokförda) — TRE fångster, alla CI-fångade, → L326:** (1) `startup_failure` #1 (run 30037333924) — ci.yml:s topp-nivå `permissions: {}` gjorde ci-suites `contents: read` till en eskalering; anropat workflow kan bara behålla/minska (GitHub Docs verifierat) → suite-jobbet grantar taket. (2) `startup_failure` #2 (run 30038460735) — SAMMA bugg i `nightly.yml` (andra anroparen, missad i ci.yml-fixen; PR #113). (3) span-faktafel (PR #115) — larmet konflaterade "ingen tidigare grön" med "grön natt på samma SHA"; senare = flake-signal, nu tre distinkta grenar, unit-testad lokalt. Spiken hade `permissions: {}` = förenkling som maskerade #1/#2.
- **36.3 D1-klassen levererad (PR #117 `659bcf9`, CI 30043233137 grön):** ren UI-ändring (CSS/stilmallar/publika statiska filer) klassas **D1** → staging + mutex skippas, lint/pure/build/a11y kör. Deklarativt `changed-ui`-steg i ci.yml (UI-positiva + D0:s exkluderingar, allowlist aldrig blocklist) → output `ui_low_risk`; `suite`-jobbet skickar `with: run_staging = (ui_low_risk != true)`; ci-suite.yml fick `workflow_call`-input `run_staging` (default **true** ⇒ nightly kör alltid full svit), purge + test-staging skippar internt (villkor, ej path-filter — paraply-checken rapporterar alltid, AC#5). `.playwright-mcp/`-gitignore (AC#7, L321-klassen — durabel bärare = AC). **Kontrastbevis-tripel citerad:** case 1 ren `.css` run **30043867877** (D1, staging SKIPPED, a11y/pure/build körda, `ci-passed` grön) · case 2 `.css`+`.tsx` run **30043886869** (D3, staging RAN) · case 3 config run **30043233137** (D3, staging RAN, exkluderingen bet). fetch-depth-invariant (3) + L322 orörda. Noll defekter, first-pass-grönt. Proof-PR:er #118/#119 rivna efter bevis.
- **36.4 merge-dedup levererad (PR #121 `b75df1c`) — trions sista skiva, ci.yml-trion KOMPLETT:** på main-push läser `changed`-jobbet merge-commitens andra förälder (mergade PR-headen); tunga jobb hoppas ENDAST om merge-commitens träd == PR-headens träd OCH den SHA:n har en grön CI-run (full SHA, L314). Innehållsadresserad, ingen ny lagringsyta; **cache-formen falsifierad, ej byggd** (L325). **Fail-closed på VARJE avvikelse** (ingen andra förälder · träd-avvikelse · API-fel · icke-grön ⇒ full svit) — asymmetrin medveten (nyckeln ÄR trädet → bara onödig körning, aldrig otestat förbi); sundhet vilar på merge-grindens strict up-to-date (ADR-076). Dedup-steg i changed-jobbet (fetch-depth: 0 → **invarianten ORÖRD**, testsvit 7/7); `permissions += actions: read` (minsta grant); suite-if `+= dedup_hit != true`; skippad suite → `ci-passed` grön (L322 intakt). **Logiken unit-testad lokalt mot 6 grenar** (1 hit + 5 fail-closed) FÖRE bygget; mekanism verifierad disk+API på `bf592ca`. **Kontrastbevis-par:** MISS PR-event run **30047428027** (full svit, staging RAN) · HIT main-push run **30047936570** (Test suite SKIPPAD på en config-ändring som normalt kör full svit; dedup-steg: "Dedup-TRÄFF: träd == a7f60c52^{tree} → tunga jobb hoppas"). Noll defekter, first-pass-grönt.
- **Numrering:** ADR **077** mintad (36.2; 36.3+36.4 refererade den utan amendering, som avsett) · lesson **L326** ([UNIVERSAL]: reusable-permissions-eskalering + spike-postur + varje-anropare; 36.3+36.4 rena, inga nya lessons) · ingen ny tråd (T85 forts.) · fälla 45 orörd · nästa: 079/077/L327/T86/f45/task-37.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-23-session-79.md`](../tasks/sessions/archive/2026-07/2026-07-23-session-79.md) (Del 1–4). **EJ fas-avslut.** **ci.yml-trion (36.2/36.3/36.4) KLAR.** Kvar av task-36: **36.5** (mätskript, dep 36.2) → **36.6** (rött-först, ADR-071-amendering) → **36.7** (visual, egen session, ready-for-human) → **36.8** (QA) · hub-lyftet L284–L326 · Marcus-moment: Update-klicket i claude.ai.

## Session 80 — T85 våg 2 forts.: 36.5 mätskriptet + 36.6 rött-först-bärarbytet (CI-hastighet är siffror; röd CI återfår sin betydelse) (2026-07-24)

**Commit-range:** `dd38752` (dok-födelse) → stängnings-PR. **Mål:** ta 36.5 mätskriptet i land (scope Marcus-kvitterat "Kör på!" på RAPPORTERA-förslaget); scope-utvidgat med 36.6 på Marcus-order efter 36.5-stängningen. Ej byggplan-fas — CI-/processession.

- **36.5 mätskriptet (PR #125 `3412040`, CI 30072089892 grön per jobb full svit; stängnings-PR #127):** `scripts/ci-metrics.mjs` — PR-ledtid (median+p95), staging-kötid (mutex-väntan), röd-orsak per jobb, flaky-frekvens, dedup-träffkvot; DORA-andan (hastighet + stabilitet tillsammans). **Dedup-utfallet läses ur changed-jobbets logg-markörer** ("Dedup-TRÄFF"/"Dedup-miss") — skip-status kan inte skilja dedup-träff från docs-skip; pre-36.4-runs utan markör klassas öppet `unknown`. Läsreglerna kodade: **L314** (full SHA via `resolveFullSha`, `git rev-parse`-resolver, oresolverbar kastar — live-bevisad åt båda håll) + **L319** (cancelled ≠ användaravbrott; flaggas med körtid, aldrig räknad som bevisad röd-orsak; rerun-grönt = flake-signal). **TDD 7 cykler** (13 fall, varje beteende RÖTT observerat före grönt), fixtur-data aldrig levande API, assertions via publika ytor. `nightly-metrics`-jobb i nightly.yml (testsvit först = återkommande CI-bärare **utan att ci.yml rörs**; rapport → logg + step-summary; `actions: read`; **ingår i larmets needs** — röda mätningar aldrig tysta). npm-alias `metrics:ci`. **ci.yml ORÖRD → fetch-depth-invarianten + L322 opåverkade.** AC#2:s natt-halva bevisad: dispatchad nightly **30072499255** grön per jobb inkl. CI-mätningsjobbet, larm SKIPPAT.
- **Utgångsvärdet (första mätningen, fönster 50 runs):** PR-ledtid **median 1 min · p95 13,3 min** (n=24) · staging-kötid **median 0,2 · p95 7,7 min** (n=37) · röda 2 (Docs link check ×2) · flaky **0,0 %** · dedup-träffkvot **100 %** (4/0). Citerat på kortet; kurvan byggs nu nattligen.
- **36.6 rött-först-bärarbytet (PR #128 `5de8aa4`, CI 30073375124 grön per jobb; stängnings-PR #129 `b88a572`):** scope-utvidgning på Marcus-order ("Vi ska inte ta 36.6 i denna session också då?"); docs-only. **ADR-071 amenderad i etablerad form** (S80-block överst, ursprungstext ORÖRD): rött-först obligatoriskt med **lokalt körutdrag** som bärare · rött+grönt pushas IHOP (CI kör en gång på grön head; forensiken via git) · grind-bevis hör hemma i `gate-proof.yml`:s riktade avfyrningsform · ingen-ny-ADR öppet motiverad. Fix-vågens motsägande rad (iv) öppet amenderad med bevarad ursprungslydelse. **CONTRIBUTING § Rött-först — bevisformen.** Empirisk grund: 7/30 senaste körningarna var avsiktligt röda bevis-runs.
- **Sessionsfacit:** PR #124–#129 samtliga grön/jobb **first-pass**; noll defekter i körning (två självfångade lokalt före commit: utkast-block i main() + MD028). **Första skarpa schemalagda nightly GRÖN** (run 30065650800, larm SKIPPAT — nattnätet bevisat i produktion). Inga nya lessons (två rena leveranser); ingen ny ADR (öppet motiverat); ingen ny tråd (T85 forts., kortet uppdaterat: 2a KOMPLETT + 2c VERKSTÄLLD).
- **Numrering:** oförändrad efter S80 — nästa: 081/077/L327/T86/f45/task-37.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-24-session-80.md`](../tasks/sessions/archive/2026-07/2026-07-24-session-80.md) (Del 1–3). **EJ fas-avslut.** Kvar av task-36 (båda ready-for-human): **36.7** (visual, EGEN session) → **36.8** (QA, dep 36.7) · hub-lyftet L284–L326 vid hub-sync-moment · dependabot-PR #65/#126 Marcus-review · Marcus-moment: Update-klicket i claude.ai.

## Session 81 — task-36.7: visuell regression från noll — vakten byggd och bevisad, grinden medvetet parkerad (T87) (2026-07-24)

**Commit-range:** `2f76905` (dok-födelse) → stängnings-PR. **Mål:** 36.7 visual (ready-for-human, EGEN session per kortet); Marcus i loopen hela vägen. Ej byggplan-fas — CI-/processession (T85 våg 2b).

- **Vakten (PR #133 spike + #136 sex vyer):** hermetisk fixturvärld i `tests/visual/support/` — seedad session (lagringsnyckeln VERIFIERAD mot supabase-js dist), EF-mockar i exakt EF-form parsade av samma zod-scheman som skarp data (param-medvetet register, omockad EF → 501 med namn), pinnad Inter v20 incheckad (CDN-driften stängd), frusen klocka (`page.clock`, explicit offset), hermetik-vakt (icke-localhost abortas), dedikerad fixtur-server 5299 (a11y-idiomet) med FIKTIV Supabase-URL → noll staging, noll mutex, inga secrets. **Sex facit-tunga vyer × två vyportar = 12 bilder på ~15 s.** Snapshot-mallen amenderad efter pre-K-forensik (Fas 0-mallen föregick principen): `{projectName}` (kollisionsfix — latent defekt) + `{platform}` (AC 3; -darwin/-win32 gitignorerade). Devtools-ratten `VITE_DEVTOOLS=0`. Rött-först bevisat (saknad-baseline-rött, körutdrag i sessionsdok Del 2).
- **2x-beslutet (PR #139, Marcus-order efter granskning):** 1x-bilder upplevs oskarpa på Retina — `deviceScaleFactor: 2` + `scale: 'device'` (default `css` nedsamplar annars). 2880×1804, 2,6 MB/12 bilder. Granskningsupplevelsen är del av vaktens design. Stabilitets-transient fångad korrekt av toHaveScreenshots vägran att föda oren baseline; därefter 12/12 ×2 i rad.
- **Baseline-maskineriet (PR #140):** `visual-baselines.yml` bevisad ände-till-ände — dispatch → linux-generering → granskningsbar PR ("12 bilder", räknefixen `-uall` skarpt bevisad) → Marcus-granskning + merge. Två processfynd → **L327** [UNIVERSAL] (repo-inställningen Actions-PR-skapande AV per default; approval-bannern uteblev empiriskt — mekanism som bär grind bevisas skarpt, ej doc-läses) — inställningen påslagen med MINSTA vidgning (`read` behållen).
- **Marcus-beslut A → T87 (stängningen, PR #141):** tidig UI-fas — aktiv grind blockerar auto-merge per avsiktlig design-ändring (mot T85-hastigheten; i work-batch haltar första design-ändringen batchen). AC 7–8 (grind-jobbet + nightly) PARKERADE i **tråd T87** med aktiverings-jobbet KOMPLETT inbäddat (suite-placeringen ger AC 7+8 gratis, L322 orörd by construction) + trigger (UI-takten lugnar) + vardagsformen (browser-QA-kvittot bär välsignelsen — ingen PNG-granskning per ändring). Rådgivande läge förkastat öppet (L321-klassen). Kortet **Done** med AC 1–6+9 avbockade, 7–8 öppet trådburna.
- **BEHIND-svälten → L328** [UNIVERSAL]: PR #133 (10-min-svit) förlorade racet mot tre parallella pocock-docs-landningar (~1 min CI) — tre update-branch-varv innan konvergens; mönstret strukturellt (strict + heterogena CI-tider + parallella sessioner), mitigering = landnings-koordinering, aldrig släppt strict.
- **Sessionsfacit:** PR #131/#133/#136/#139/#140/#141 samtliga gröna per jobb; två självfångade felkörningar öppet bokförda (plain-formen TASK-6 + ankarfel i event-lista-specen — vyn betedde sig rätt). Ingen ny ADR (A-beslutet under baren, öppet motiverat — T87 bär det). Numrerings-drift bokförd: T86+S82 konsumerade av parallell pocock-session.
- **Numrering efter S81:** nästa 83/078/L329/T88/f45/task-37.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-24-session-81.md`](../tasks/sessions/archive/2026-07/2026-07-24-session-81.md) (Del 1–7). **EJ fas-avslut.** Kvar av task-36: **36.8** (QA-vandringen, ready-for-human, dep 36.7 ✓ AVBLOCKAD) · T87 vilande (grind-aktiveringen) · hub-lyftet L284–L328 vid hub-sync-moment · dependabot-PR #65/#137 Marcus-review · Marcus-moment: Update-klicket i claude.ai.

## Session 84 — EF-prod-synken: T39-pre-flight → A-kedjan — prod på HEAD, datavägen bevisad, T39/T40/T33 stängda (2026-07-24)

**Commit-range:** `c976651` (dok-födelse, PR #150) → stängnings-PR. **Mål:** EF-delen av prod-deployen (T39/T40) + TASK-35 — parallell session (S82-formen/T67) i egen worktree bredvid aktiva S83. Ej byggplan-fas — deploy-/förvaltningssession.

- **Pre-flighten (PR #151):** T39-notens föreskrivna form utförd read-only — alla 12 deployade prod-EF:er nedladdade + innehålls-diffade mot HEAD inkl. bundlad `_shared` per funktion. Huvudresultat: **verklig drift smalare än versionsgapet** (4 EF:er egen-kod-drift; delade driften = env-drivet `AIRTABLE_BASE_ID` + `field-allowlists`-tillskotten; 3 innehålls-no-ops) → **L332**. Riskfynd: bas-ID-secreten fanns men var runtime-obevisad → läs-smoke sekvenserades först. Leverabel: `docs/research/t39-ef-sync-preflight-2026-07-24.md` (karta + deploy-/smoke-plan + TASK-35-underlag).
- **Marcus-förkraven (dashboarden, beslut C-kanalen):** smoke-user `marcus+ef-smoke@h5gruppen.se` skapad (lösenord i lokal git-ignorerad `.env.prod-smoke`); Playwright-paret raderat; `marcus@marcusjohansson.me` raderad efter Code-forensik (Vue-era-admin på ej Marcus-kontrollerad domän = övertagsvektor; 5 juli-inloggningen Marcus-kvitterad egen) → **T33 STÄNGD**. Env-svepet verifierat rent (S26/S32 tog lagren).
- **A-kedjan (Marcus-go):** `test-auth` raderad ur prod (TASK-35 AC1, verifierad) → kanoniska full-allowlist-deployen **13/13** (11 bump + `create-event-note`/`get-event-notes` NYA I PROD; L216-override-kravet UPPHÄVT) → deny-triple ×13 grön efter källkods-klassad förväntans-rättning (**L331**; metod-vakts-asymmetrin → TASK-38) → autentiserade smokes gröna: läs-tripeln (secreterna runtime-bevisade) · create-event-idempotensen (201→replay 200 samma rad) · notes-rundturen · save-segment 201 → ZZ-teardown verifierad via Airtable-MCP. **T39 + T40 STÄNGDA**; frontend-kontrollen + allowlist-utvidgningen (9 app-EF:er) ärvs av T46; byggplanens closeout-förkrav fick T40-dimensionen.
- **Diagnos-fynd under smoken:** create-event 500 på 2027-datum → prod-schemat läst via MCP → **fälla 45** (`Månad/år`-selectens options-horisont slutar december 2026; **appen kan inte skapa 2027-event i prod förrän löst**) → **L330**. TASK-35 Done (AC2-beslutet: audit-läge JA → TASK-37).
- **Kvälls-incidenterna (stängnings-PR #161):** GitHub-API-incident bröt PR-skapandet (löst med retry-vakt via REST) och lämnade syskonsessionens gröna js-yaml-fix-PR #160 oarmerad → Code armerade, CLEAN-merge direkt (advisory GHSA-pm4m-ph32-ghv5, high, publicerad 18:47 samma kväll) · Lychee-429 på gitlab.com-länk i orörd ADR-032 (2 CI-instanser, lokalt 200) → `.lycheeignore`-post per digg.se-precedentens 2-instans-beslut; config-ändringen triggade korrekt fulla sviten som gick grön per jobb.
- **Numrering efter S84:** nästa 85/078/L333/T88/f46/task-39.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-24-session-84.md`](../tasks/sessions/archive/2026-07/2026-07-24-session-84.md) (Del 1–4). **EJ fas-avslut.** Kvar: TASK-37 (audit-läget) + TASK-38 (metod-vakterna) plockbara · T46 bär go-live-resterna · hub-lyftet L284–L332 vid hub-sync-moment · Marcus-moment: Update-klicket i claude.ai.

## Session 83 — Prototyp-passen inför nattbygget: konvergens per yta → ready-for-agent ×6 (2026-07-24)

**Commit-range:** `e5830cd` (dok-födelse, PR #149) → stängnings-PR. **Mål:** ge nattbyggets sex kort sina saknade designbeslut via konvergens-prototyp mot Marcus i browsern (T86 § Körplanen punkt 2–3). Ej byggplan-fas — HITL-designsession. Pausad efter pass 3, återupptagen samma dygn (`session-resume`, N bevarat).

- **Fyra konvergens-pass, alla låsta av Marcus i browsern:** 17.7 filtervyn (chips → dropdowns på Marcus-fångst "ort kommer ju bli lång"; tratt + tre Select + print) · 18.15 numrerade boxar (hover-kollisionen fångad av Marcus: siffer-ruta och hover-platta delade `bg-emphasized` → vit ruta) · 18.17 anmälningsvyn (tyngsta passet — 51 fält MCP-lästa + elit-IA-research + tre iterationsvarv; FEM biblioteks-kandidater) · **18.18+18.19 eventväljar-paret** (sju iterationer, Del 6).
- **Pass 4-facit:** 18.19 **variant A** (väljaren ÄR rubriken) låst i första visningen. 18.18: **tomt och valt läge som TVÅ TILLSTÅND, inte två sidor** — progressive disclosure (dölj → avslöja) ersatte disabled-fält efter Marcus dom; sök + månadsgruppering ersatte kalender-idén; rubrikfritt kort, vit väljare, beläggningsstapel, nedtonad navigeringslänk. 14 byggkrav i kortet.
- **Research avgjorde tre val:** route-semantiken → **alternativ b** på tre precedent (Linear `/new` + `/team/LIN/new` · Rails nested-creation · Jiras gating-fält) · sök-tröskeln (USWDS >15; staging 11 och växande) · progressive disclosure (UXPin/PatternFly/ui-patterns).
- **INSTANT-KRAVET föddes** (Marcus: "ALLT i denna app ska vara instant, det ska vara en regel också") och landade i SKARP kod **PR #163**: EF-latensen mätt (~1,1 s get-event · ~1,4 s get-registrations) → `placeholderData` ur listcachen + prefetch på avsikt. Direktklick 1315 ms → hover 1500 ms **278 ms**; CLS 0,000 vid navigering. Beläggningen skyddad mot en sekund falska nollor (`?? 0` mot aggregat som bara get-event bär). Airtable-golvet accepterat tills Supabase → **T90**.
- **SLUTRÄKNING: ready-for-agent ×6 NÅDD** (17.7 · 18.15 · 18.16 · 18.17 · 18.18 · 18.19) — **nattbygget är körbart**.
- **Incidenter öppet bokförda (Del 7):** js-yaml-advisoryn GHSA-pm4m-ph32-ghv5 publicerad 16:47Z mitt i passet blockerade ALL landning → override till 5.2.2, allowlisten orörd (PR #160) · GitHub-outage bröt PR-skapandet i ~50 min och gav **HTTP 500 samtidigt som operationen utfördes** · **dataförlust ×2** av ocommittat arbete (iterationerna + fångst-sekvensen), båda återskapade och verifierade mot facit · prototypcommits på lokal main ×2 (aldrig pushade).
- **Nummerkollision med S84:** syskonsessionen stängde under pass 4 och skördade L330–L332 → S83:s fem numrerades om till **L333–L337** (PR #167). Disk-verifiering vid resume räckte inte — numret måste läsas om omedelbart före skrivning.
- **KONVENTIONS-HEMMET öppen till nästa session** (Marcus-order: "konventioner måste ju ha ett HEM"): belagt problem — Code uppfann egen grammatik två gånger inom en timme för mönster repot redan hade. Research klar (design system-doc · ADR · Storybook · kommentarer), hemvist-valet är ADR-bar/grillnings-klass. → **L337**.
- **ADR-078 mintad vid stängningen** (Marcus-order): INSTANT-regeln — navigering väntar aldrig på data vi redan har; placeholder ur listcache, skydd för partiella fält, prefetch på avsikt, skeleton i slutgeometri, golvet deklareras mätt. Bevisad i PR #163.
- **Numrering efter S83:** nästa 85/079/L338/T91/f46/task-39.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-24-session-83.md`](../tasks/sessions/archive/2026-07/2026-07-24-session-83.md) (Del 1–7). **EJ fas-avslut.** Kvar: nattbygget i FRISK session (work-batch, max-kort 6) → morgongranskning → T85-korrigeringsfönstret · konventions-hemmet (grillning) · hub-lyftet L284–L337 vid hub-sync-moment · Marcus-moment: Update-klicket i claude.ai.

## Session 85 — Dukningen för nattbygget: audit-läkningen + go-redo för S86 (2026-07-25)

**Commit-range:** `3a50e8e` (läknings-PR #169) → stängnings-PR. **Mål:** läka den röda audit-grinden + städa + duka nattbygget så S86 startar på ett Marcus-"go" (T86 § Körplanen punkt 4). Ej byggplan-fas — förvaltnings-/dukningssession; körd på Fable 5 efter Marcus-rapport om S83-resumens Opus-körning (orienterings-passet fann S83 komplett stängd — röran var redan öppet bokförd i S83 Del 7).

- **Audit-läkningen (PR #169):** `GHSA-mh99-v99m-4gvg` (high, DoS/OOM i brace-expansion) publicerades 21:53Z — ~20 min före S83:s sista merge-run, som gick röd på main (enbart audit-jobbet; PR-runnen var grön minuterna före). Båda instanserna (2.1.2 + 5.0.7) i sårbart intervall ≤ 5.0.7, inga 2.x-patchar → global override **5.0.8** (dual ESM+CJS = kompatibel med `minimatch@5`:s require). Bevis: full svit lokalt FÖRE push (audit Passed · typecheck · Biome 0 errors · build med PWA-precachen = workbox-kedjan skarpt exekverad · **376/376 API**) + PR-run grön per jobb + main-merge-run 30132229085 grön per jobb — **36.4-dedupens första skarpa config-klass-träff** (Test suite dedup-SKIPPAD på main-runnen). ADR-028-allowlisten ej tillämplig (patch fanns); allowlisten förblir tom. → **L338** [UNIVERSAL].
- **Städet:** S84-worktreen riven (0 unika commits, verifierat före riv) · **50 lokala brancher** fullt innehållna i main rensade (huvuddelen `worktree-wf_*`-rester; `proto/*` ×5 orörda per återupplivningsvägen) · `odoo-autonomous-test-plan` (2026-05-07, 2 unika) kvar — Marcus-beslut.
- **Kortläget re-verifierat via backlog-CLI:t:** ready-for-agent ×6 `To Do` · externa deps Done ×4 (17.2/18.3/18.5/18.12) · enda interna kedjan 18.18→18.19.
- **Dukningen (PR #170 dok-födelse + PR #171):** batch-ordern `tasks/sessions/bilagor/s85-nattbygget/batch-order.md` — /work-batch max-kort 6 · ADR-071-kontraktet i ADR-076-landningsform (trunk-push-beslutet superseded av merge-grinden) · rött-först per S80-amenderingen · halt-first · pilot-loggrad per skiva (T86) · F6-fönstret föreslaget 18.16 (Marcus-veto vid "go") · INSTANT-regeln (ADR-078) · **konventions-bilagan** (sex JSDoc-belagda mönster med källpekare = L337-skyddet; öppet märkt batch-lokal läskopia — hem-frågan förblir grillnings-klass).
- **Numrering efter S85:** nästa 86/079/L339/T91/f46/task-39.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-25-session-85.md`](../tasks/sessions/archive/2026-07/2026-07-25-session-85.md) (Del 1–3). **EJ fas-avslut.** Kvar: **S86 nattbygget på Marcus "go"** (ordern är batch-kvittot) → morgongranskning → T85-korrigeringsfönstret · konventions-grillningen (/grill-me) · hub-lyftet L284–L338 vid hub-sync-moment · dependabot-PR #162 Marcus-review · Marcus-moment: Update-klicket i claude.ai.

## Session 86 — Nattbygget 6/6 via work-batch + morgongranskningens tre fix-vågor (2026-07-25)

**Commit-range:** `aa89793` (dok-födelse PR #173) → stängnings-PR. **Mål:** exekvera de sex `ready-for-agent`-skivorna ur event-familjen autonomt via `/work-batch` per S85:s dukade batch-order, driva dem till granskningsfärdigt läge, och landa Marcus morgongranskning. Ej byggplan-fas — event-familjens facit-arbete (TASK-17/18/19).

- **Nattbatchen (PR #174–#185):** 6/6 skivor levererade i ADR-076-form (kod-PR + bokförings-PR per skiva, tvåstegs-stängning), **CI grön FÖRSTA PASS i samtliga led**, rött-först-bevis citerat per kort. 17.7 + 18.15 REVIEW_READY (DoD #5 = Marcus) · 18.16/18.17/18.18/18.19 Done. Drift: 17 agenter, ~6,7 h väggklocka, ~2,3 M subagent-tokens, 0 agent-fel, 0 halt, 1055 verktygsanrop.
- **v1-incidenten → L340** [UNIVERSAL]: första agenten (17.7) levererade komplett men parkerade sig på en Monitor-callback för CI-väntan — callbacks når aldrig workflow-subagenter, schema-returen uteblev, orkestreringen felade (**L323-repris**). v2-omstarten införde **bygg/svans/verify-splitten**: bygg slutar vid armerad auto-merge (noll väntan), svansen äger CI-kedjan med bakgrundsvakt, oberoende read-only-verifierare fail-closed mellan korten. Inget kort byggdes om.
- **F6-mätningen (T89):** 18.16 kördes på effort `low` — 28,7 min / 8 fynd / 0 blocker / CI grön första pass, mot jämförbara 18.15:s 28,1 min på default. Utfallet avvek inte från baslinjen; de tre efterföljande fix-vågorna träffade uteslutande default-effort-skivor, aldrig 18.16. Slutsatsen är ett eget litet Marcus-beslut, ej T85-materia.
- **Morgongranskningen — tre fix-vågor (PR #188/#189/#191) + prototyp-svarfångst (PR #190):** våg 1 fem Marcus-beslut inkl. **§19 FACIT-REVIDERAD till intent × emphasis** (research-belagd: Polaris/Carbon/M3/FK) med AA-vakt på success-textbäraren; våg 2 tre omgranskningsbeslut inkl. **facit punkt 8:s "aldrig autoFocus" rivet öppet** (RAC:s egen `autoFocus`-prop läker ett rAF-race som e2e inte kunde se); våg 3 fokusringens tre samverkande CSS-regler. Grundorsaker lästa ur react-arias källa → **L341** (`until-found` + `content-visibility`) och **L342** (`scrollbar-gutter` förskjuter canvas-origo för body-portalerade overlays).
- **Fix-vågens tidsforensik:** 71 min 14 s, varav **23 min 30 s (33 %) död väntan** från idiomet `tail -f | grep -m1` som aldrig terminerar — och som **L340 självt föreskriver**. 16 min 51 s var kontrakts-obligatorisk CI-tid, ~20 min 40 s verkligt arbete (`ee021eb` = 17 filer / +552 rader). Öppna poster triagerade till S87: `scripts/ci-wait.sh` + L340-amendering · preview-mätloopen härdad till `npm run test:e2e:local` · BYGG/SVANS-splitten utvidgad till fix-vågor.
- **Andra orkestrerings-incidenten (bokförd i efterhand, S88 2026-07-25):** under våg 2 checkade orkestratorn ut docs-brancher i huvudrepot medan fix-agenten arbetade i samma träd; agenten fann "arbetsträdet stod plötsligt på main" och felattribuerade det till Marcus. Ofarligt utfall — allt var pushat — men ren tur. → **L344** [UNIVERSAL]. Posten mintades i S86:s stängning som `L343` men landade aldrig: PR #192 fastnade, S87 skrev om stängningen från main-sidan via PR #193, och numret återanvändes för shellcheck-lärdomen. Bärgad i S88 efter innehålls-diff av den övergivna grenen.
- **Skörd:** **task-39–48** (10 kort) · **T91** · **L339–L342** [UNIVERSAL ×4] (+ **L344**, bärgad S88) · pilot-loggrader ×6 i T86 · ny EF `get-registration` (staging; prod-allowlisten orörd). T86:s escapes-kolumn **omtriagerad neutralt i två dimensioner** (diff-synliga vs browser-only) — räkne-regeln avgörs i T85-sessionen per sekvenslåsningen.
- **Numrering efter S86:** nästa 87/079/L343/T93/f46/task-49 (**T92 mintad** i stängnings-landningen — agent-mekanikens två obetalda poster: lokal e2e utan port 5173 [preview-mätloopen härdad till `npm run test:e2e:local`] + BYGG/SVANS-splitten utvidgad till fix-vågor).

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-25-session-86.md`](../tasks/sessions/archive/2026-07/2026-07-25-session-86.md) (Del 1–4). **EJ fas-avslut.** Kvar: **S87 städ-vågen** (S86-stängning → `ci-wait.sh` + L340-amendering → arkitektur-korpusen → task-48) · T85-korrigeringsfönstret (bindande före T86-beslutet + vidare CI-utbyggnad, men **blockerar inte produktarbete**) · Roger & Lotta-spåret (grind 0 = frontend-deploy, som saknas helt) · konventions-grillningen · hub-lyftet L284–L342 · dependabot #162/#65 · Marcus-moment: Update-klicket i claude.ai.

## Session 87 — Städ-vågen: den obetalda räntan betald före nästa stora spår (2026-07-25)

**Commit-range:** `842847f` (PR #193) → `9053381` (PR #197). **Mål:** betala den löpande räntan S86 lämnade — ett vänte-idiom som slösar 6–9 min per CI-cykel i varje framtida körning, ett odokumenterat arkitektur-spår som bara levde i Marcus minne, och ett låst prototyp-facit utan plockbart kort. Medvetet liten och stängbar; öppnar inget nytt spår, tar inget epok-beslut. Ej byggplan-fas.

- **Spaningen som föregick allt:** nio läsande subagenter mot Marcus åtta frågor + bygg-spåret — 0 fel, ~15 min, 483 verktygsanrop, ~1,38 M tokens. Landad som `tasks/sessions/bilagor/s87-spaning/`. **Fyra premiss-ändrande fynd:** (1) **det finns ingen frontend-deploy** (ingen hosting-config, ingen deploy-workflow, BUILD-LOG:1656) — Roger & Lotta-spårets grind 0 är alltså en deploy som inte existerar; (2) **Personer-vyn + persondetalj är redan byggda** (Fas 6a, S23) men förfacit → ombyggnad, inte nybygge; (3) L340 spred aktivt en bugg; (4) backlog-kön var helt tom. **Korsläsningen gav det ingen enskild agent kunde se:** två agenter planerade arbete vars uttalade syfte var "innan jag bjuder in Roger och Lotta" utan att veta att det saknas en adress att bjuda in till.
- **Granskningsrundan rev två egna rekommendationer** (Marcus-beordrad före start): **T85-låsningen blockerar INTE produktarbete** — den säger det ordagrant i meningen efter (`T85:85–91`); rekommendationen hade överapplicerat den och skjutit Roger & Lotta-spåret längre bort än nödvändigt. Och **arkitektur-landningen behövde inte röra `ci.yml`** — spanings-agenten rekommenderade lychee-exkludering och skrev samtidigt att risken var noll; verifierat 0 URL:er + 0 relativa länkar, så den enda krock-heta filen föll ur landningen. Båda ur att läsa källan själv i stället för att relära en agents sammanfattning.
- **`scripts/ci-wait.sh` (PR #195):** bounded poll som ersätter `tail -f | grep -m1`, vilket aldrig kan terminera i tid. Terminal-kontroll **före första sömnen** (cykel-3-buggen: nio minuters väntan på en redan grön körning), **per-jobb-verdikt** som ADR-071 §2(iii) faktiskt kräver, skippade jobb märkta som icke-bevis (L322). 13 testfall med gh-stub, noll nätverk; **T1 rött-först-bevisad** — trasig form 30 s, läkt form 0 s. Skarpt: 3 s på en avslutad main-run. **L340 amenderad**, den trasiga formen riven öppet.
- **INCIDENT — egen falsk-grön verifiering → L343** [UNIVERSAL]: PR #195 gick RÖD på shellcheck sedan jag rapporterat grönt. Jag körde default-flaggor; grinden kör `--severity=style --enable=all`, och alla sex fynden låg i optional-mängden. Skärpningen: jag HADE greppat `ci.yml` efter "shellcheck" men läst installations-steget i stället för kör-steget — **att ha träffat rätt fil är inte att ha läst rätt rad.** Sex fynd åtgärdade i sak, inga suppressions. Andra fångsten i samma svans: `--pr` latchade på föregående körning (PR-API:ts head lagrar efter push) → skriptet visar nu följd commit-SHA; ingen lesson mintad, gotchan bor i skriptets huvud där en agent faktiskt möter den (medvetet val, öppet noterat).
- **Arkitektur-korpusen (PR #196):** rå-doket (621 rader) vendoriserat till `docs/reference/miranon-arkitektur/` + destillat/gap-analys per Pocock-precedenten, men med **snävare exkludering** — bara källfilen, inte hyllan, så destillatet grindas som den egna prosa det är. **Kärnfynd: AI-assistenten är ett TVÄRSNITT över allt byggt, inte en fas** — dess verktyg wrappar vårt befintliga operations-register (`field-allowlists.ts`, 13 operationer, deny-by-default). **Ingen ADR** (baren nås ej — konversationen är input, avvägningen ogjord) och **ingen byggplans-edit** (ADR-068 p.5 gör Fas E till Övning 2:s sista del ⇒ AI-assistent efter Supabase är per definition Övning 3 — ramverks-beslut, inte tabellrad). **Divergens registrerad, ej löst:** källan föreskriver livscykel + synlighet skild från bokningsbarhet; basfältet är en checkbox. **T79** uppdaterad, **T93** född.
- **task-48 kompletterad och plockbar, ej byggd:** Marcus-beslut bokförda (väg A — länkarna vilar ⇒ rå RAC Checkbox, ingen GridList; enskild bekräftelse accepterad som riven eftersom 1-klick-vägen byggs på Hem-vyn i stället). DoD #5 + #6, serialiserings-not mot TASK-47, `ready-for-agent`. **Öppet bokförd scope-reduktion:** bygget flyttat till kommande session på Marcus beslut att stänga här. `proto/s86-deltagarkort-markering` pushad som försäkring (mergas ALDRIG).
- **Marcus åtta ingångs-punkter alla registrerade:** fyra spår saknade durabel bärare och fick den i stängnings-landningen — **T94** (route-grammatiken bor i tre hemvister + URL-STATE-SPEC har driftat) · **T95** (riktig app + inbjudan; grind 0 = den saknade deployen) · **T96** (systemmeddelande-taxonomin; appen saknar toast-lager helt) · **T97** (Personer/persondetalj/check-in). Kartan från anteckning till bärare: `tasks/sessions/bilagor/s87-spaning/README.md` § Marcus åtta punkter.
- **Numrering efter S87:** nästa 88/079/L344/T98/f46/task-49.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-25-session-87.md`](../tasks/sessions/archive/2026-07/2026-07-25-session-87.md) (Del 1–3) + [`bilagor/s87-spaning/`](../tasks/sessions/bilagor/s87-spaning/README.md). **EJ fas-avslut.** Kvar: **T85-korrigeringsfönstret som nästa session** (Marcus-beslut — billigaste stunden att röra CI är när ingenting är i luften, och just nu finns noll öppna PR:er; avblockerar dessutom T86-beslutet och T87, där task-48:s avsiktliga baseline-drift ska landa) → därefter task-48 → Roger & Lotta-spåret (grind 0 = frontend-deploy, saknas helt; grillning + tre ADR:er). Bakgrund: hub-lyftet L284–L343 · konventions-grillningen · arkitektur-placeringens epok-grillning · dependabot #162/#65 · Marcus-moment: Update-klicket i claude.ai.

## Session 88 — T85-korrigeringsfönstret: paketet betalt, tre fynd ur QA-vandringen (2026-07-25)

**Commit-range:** `74a6e8f` (dok-födelse, PR #199) → `65ef0df` (PR #211), plus hub-PR #1. **Mål:** betala T85-eftergranskningens korrigeringspaket medan ingenting är i luften — den billigaste stunden att röra `ci.yml`. Ej byggplan-fas.

- **Paketets fem mekaniska poster alla betalda.** **Codex tre mätpåståenden höll**, och det tredje var skarpare än granskaren visste: `redRuns` läste enbart `conclusion === 'failure'`, så måttet hade räknat repots egen `startup_failure` (run **30038460735**, S79:s permissions-eskalering, L326) som *inte röd*. En vakt som inte ser sin egen värsta incident mäter fel sak. Flake kräver nu **bevisat** röd föregående attempt (hämtad via attempts-API:t); okänd orsak klassas OVERIFIERAD och räknas aldrig som flake. Rött-först: 8 röda → alla gröna (PR #201).
- **Nattvakten (punkt 2) — beslut C, research-grundat.** Hålet empiriskt bevisat: run 30038460735 hade `total_count: 0` jobb, så larm-jobbet instansierades aldrig; repots enda `ci-natt`-ärende någonsin (#114) kom från en simulering. `workflow_run`-vägen förkastad — octokit-schemat saknar `startup_failure` i sitt enum. Marcus delegerade beslutet efter web-research-disciplinen; **Google SRE:s larmregel-checklista** delar problemet längs en gräns som finns i koden (kan körningen observera sig själv?), och **Prometheus Watchdog** är precedenten. Researchen fann **inget** projekt där en extern vakt ersatte det interna larmet. Tre villkor inbyggda: grace mot **uppmätt** drift (26 h), dedup mot öppna ärenden, och **bevis-läge**. Rekursionen (vakten är själv en cron) öppet bokförd i workflowen. Tvåsidigt bevis: dispatch 30169745599 skapade ärende #206 · normalläge 30169781874 tyst.
- **Punkt 4 bar två fällor:** ingen `PATCH` finns för rulesets (`PUT` = full ersättning), och **ADR-076:s kanoniska JSON hade driftat** — tre API-satta fält saknades, så en `PUT` av det blocket hade tyst nollat dem. Payload härledd ur live-GET med diff-grind (exakt +1 fält). Hotet var konkret: repot har en andra app med `checks:write`, och `POST /statuses/{sha}` lät vilken write-token som helst sätta kontexten.
- **Punkt 5 föll Codes egen misstanke.** Jag antog att `schedule` saknar timezone-fält. Falskt sedan 2026-03-19; verifierat mot primärkällan och prövat **tvåsidigt mot den pinnade actionlint 1.7.12** (giltig zon exit 0, typo → `invalid timezone`). Uppmätt schemadrift ~3 h skrevs in som ärlig begränsning — timezone styr schemaläggning, inte start.
- **QA-VANDRINGEN (task-36.8) utförd av Code på Marcus delegation** — 10 av 12 punkter gröna, två öppet oavklarade. **Tre fynd som skivornas egna bevis missat:** **TASK-49** visual-grinden är systematiskt blind på desktop (app-bred textfärgsändring fångad av 4/6 mobila, **0/6 desktop**; `maxDiffPixelRatio` är en andel och desktop har 4,26× större yta — bevis: ratio 0.001 fällde alla 12) · **TASK-50** `Staging sentinel purge` rör staging utan mutex (två PR:er kollisionskörde 18:47:04–18:47:17Z; osynligt förut eftersom vi alltid landar seriellt per L328) · **TASK-51** nattlarmets commit-spann har **aldrig** fungerat (jobbet saknar `actions: read`, anropet failar 403, `|| echo ""` sväljer felet och den mest alarmerande grenen väljs — ärende #114 bär samma text sedan 2026-07-23).
- **Fyra Marcus-beslut:** 36.7-kortformalian → A (låt stå, T87 är bäraren) · 36.8-ordningen → C (utförd av Code) · nightly-visual → A (vänta; **TASK-49 stärkte beslutet i efterhand** — grinden hade varit blind ändå) · **merge-only → A, verkställd** (`allowed_merge_methods: ["merge"]`; dedupen läser `HEAD^2` och tidsvinsten hade försvunnit tyst).
- **T89 F2: dokument ja, verktyg nej.** Det parametriserade skriptet avstyrktes öppet — gemensam kärna ~16 rader, allt annat passunikt, och alla sex konsumenter redan raderade per throwaway-kontraktet. Miljöfakta landade som `docs/reference/prototyp-verifiering-runbook.md`. Överlappet mot T92(a) avfärdat med hårt faktum: `vite preview` är produktionsbygge ⇒ `/dev/prototyper` grindas bort, så preview-loopen kan aldrig bära ett prototyp-pass.
- **SKÖRD: L344–L346** [UNIVERSAL ×3]. **L344** bärgad ur den övergivna PR #192 — orkestrator-lärdomen hade varit osäkrad i tio timmar utan att L-serien visade det. **L345** grind-kvitto gäller en commit, inte en session (PR #202 gick röd på Vale efter att jag lutat mig mot ett kvitto från fel tidpunkt). **L346** testplaner som frågar "hände det?" mäter mekanismen, "räcker resultatet?" mäter värdet — det var punkt 7:s formulering som avslöjade TASK-51. **Ingen ny ADR** (079 ledigt), inga nya fällor, inga nya trådar.
- **Numrering efter S88:** nästa 89/079/L347/T98/f46/task-52.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-25-session-88.md`](../tasks/sessions/archive/2026-07/2026-07-25-session-88.md) (Del 1–3). **EJ fas-avslut.** Kvar: **de tre QA-fynden** i ordning `TASK-51` (larmet ljuger — en vakt som ljuger är värre än ingen) → `TASK-49` (bindande före T87 aktiveras) → `TASK-50` · därefter **task-48** → **Roger & Lotta-spåret (T95)**. **T86-beslutet är avblockerat av att T85 är klart** men fortfarande spärrat av n=6 mot tröskeln 10–15; **escapes-räkne-regeln avgjordes inte** och kvarstår som öppen post. Bakgrund: hub-lyftet L284–L346 · konventions-grillningen · arkitektur-placeringens epok-grillning · dependabot #162/#65 · Marcus-moment: Update-klicket i claude.ai.

## Session 89 — QA-vandringens tre fynd: alla tre hade fel grundorsak (2026-07-25)

**Commit-range:** `264bca9` (dok-födelse, PR #214) → `22cd0dd` (PR #220). **Mål:** betala de tre fynden ur S88:s QA-vandring i ordning TASK-51 → TASK-49 → TASK-50. Ej byggplan-fas.

- **Sessionens bärande fynd: samtliga tre korts angivna grundorsaker höll inte.** Korten skrevs kvällen innan, ur QA-vandringen, och två bar stämpeln `GRUNDORSAK (bevisad)`. Symptomen var korrekt observerade i alla tre fall — steget till orsak var det som brast. Skillnaden mellan räddad och missad fix låg i **AC-formuleringen**, inte i noggrannheten → **L347**.
- **TASK-51 — larmet som ljög.** Kortet sa 403 pga saknad `actions: read`. Rött-först-dispatchen mot ofixad main (run **30173436345**) visade `failed to determine base repo`: `alarm`-jobbet gör ingen checkout och `gh run list` saknade `--repo`, så anropet dog före behörighetsprövningen. `gh issue create` i samma steg hade flaggan från början. **En fix byggd enbart på kortets diagnos hade passerat samtliga lokala grindar** (actionlint 1.7.12, yamllint, biome, eget gren-test) **och ändå inte löst buggen** — den hade bara bytt lögnen mot ett ärligt "kunde inte hämta spannet". Det som räddade den var att AC #1 krävde ett skarpt utfall. Fixen bär tre delar med **tre olika bevisgrader, öppet åtskilda i workflow-kommentaren**: `--repo` skarpt bevisad · `actions: read` dokumentations-belagd men inte observerad · fjärde gren (*kunde inte hämta* ≠ *finns ingen*, L322-klassen) isolerat testad i 4 grenar / 6 assertioner. Tvåsidigt bevis: ärende **#216** (ofixad kod: "ingen tidigare grön nattkörning" trots fem gröna) mot **#217** (fixad: `ec3877f...4a3a58d`, compare-länken **API-verifierad** — `ahead_by: 3`, och de tre commitarna är fixens egen landning). Fältnamnet rättat utöver kortet: anropet returnerar senaste gröna *körning* av `nightly.yml`, dagtids-dispatcher inkluderade, inte senaste gröna *natt*. **#114** — stängd sedan 2026-07-23, vilket jag först felaktigt antog att den inte var — fick efterspår.
- **TASK-49 — desktop-blindheten.** Lösningen blev enklare än kortet antog: **ingen per-projekt-konfiguration**. Playwrights källkod avgjorde vad dokumentationen inte besvarar (`playwright-core` 1.61.1): `maxDiffPixels2 = bredd * höjd * ratio` och `maxDiffPixels = Math.min(...)` — ratio räknas om till ett absolut tak, och sätts båda vinner den striktaste. Global `maxDiffPixels: 2000` biter därför på stora bilder medan ratio-taket biter på små. **Talet är mätt:** brusgolv mot färsk baseline **0 px** över tre körningar, minsta äkta regression **11 357 px**, största 61 335 px. **Kortets premiss rättad:** ytkvoten 4,26× är maxvärdet, inte det generella — bilderna är fullPage, så ytan följer sidans höjd (uppmätta kvoter 2,37–4,26×); eventsidans desktop-bild tillät **201 772** avvikande pixlar. **Sidofynd:** 2 816/2 826 px som liknade brus var exakt reproducerbara i tre körningar och bara i en vy — en stale lokal baseline, inte flake; kalibrering mot den hade satt tröskeln mot fel golv. Utfall: före 4 mobila + 0 desktop, efter **12/12**; 12/12 gröna på orörd kod. **AC #2 lämnad okryssad** — kriteriet krävde två namngivna branschprojekt, inga med publik motivering hittades, och källkodsbelägget är starkare men en annan sak än vad som står.
- **TASK-50 — kortets åtgärd hade rivit ett medvetet designval.** Loggen (job **89710205835**) visar `TypeError: fetch failed` **1,5 s in, vid första listanropet, före någon delete** — Nodes nätverkslager, inte ett Airtable-svar; ett konfliktfel hade burit statuskod. Två samtidiga purges kan inte orsaka DNS-fel hos varandra. **Mutexen byggdes inte:** `ci-suite.yml` bär ordagrant att ålders-guarden (60 min) ersätter den, och åtgärden hade rivit det valet, inte löst det observerade felet, och förlängt kön för alla — precis vad kortets eget AC #3 oroade sig för → **L348**. Verklig brist: `airtableRequest` anropade `fetch()` utan `try/catch` — 429 hade retry, HTTP-fel gav `ApiError`, nätverkslagret hade ingenting. Åtgärd: `fetchWithNetworkRetry`, tre försök, backoff 1 s/2 s; säker även för DELETE (kastar `fetch()` nådde anropet aldrig fram), HTTP-fel retry:as aldrig, okända feltyper är inte transienta. **Rött-först:** 9 nya testfall, röda mot ofixad kod; tre testar mekanismen mot mockad `fetch` och räknar anrop (läkning 2 · ihållande 3 + kast · HTTP 1). **Kollisionen byggdes INTE bort** — strukturellt möjlig men ofarlig givet ålders-guard + idempotent delete, och skulle synas som statuskod om den bet; öppet bokförd per över-engineering-vakten.
- **Etikett-formalian** (S88 beslut A) verkställd: TASK-49/50/51 fick `ready-for-agent` — de var inte plockbara i substratet.
- **SKÖRD: L347–L348** [UNIVERSAL ×2]. **L347** ett fynd-korts symptom är observation, dess grundorsak nästan alltid en härledning — skriv AC mot skarpt utfall, aldrig mot mekanism (ett åtgärds-AC kan bockas av med buggen i behåll). **L348** en kommentar som förklarar varför något *saknas* är ett designval — läs den före du fixar frånvaron. **Ingen ny ADR** (079 ledigt) — samtliga ändringar under baren; inga nya fällor, inga nya trådar.
- **PR #214, #215, #218, #219, #220 gröna per jobb.** En självförvållad omstart: #218 gick BEHIND efter #219:s landning och krävde `update-branch` (L328-klassen). Två CI-vakts-varv på #220 av samma skäl.
- **Numrering efter S89:** nästa 90/079/L349/T98/f46/task-52.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-25-session-89.md`](../tasks/sessions/archive/2026-07/2026-07-25-session-89.md) (Del 1–3). **EJ fas-avslut.** **Alla tre QA-fynden ur S88 är stängda.** Kvar: **`task-48`** (Marcus-bokförd till S90) → **Roger & Lotta-spåret (T95)**, vars grind 0 är en frontend-deploy som saknas helt. **T87 avblockerad men oförändrat parkerad** — TASK-49 betalade förkravet, aktiveringen väntar på Marcus-trigger; linux-brusgolvet är omätt tills grinden körs i CI. Bakgrund: hub-lyftet L284–L348 · escapes-räkne-regeln (blockerar T86-beslutet) · F6-beslutet · konventions-grillningen · arkitektur-placeringens epok-grillning (T93/T79) · dependabot #162/#65 · Marcus-moment: Update-klicket i claude.ai.

## Session 90 — Markera-läget skarpt, och tre ytor som fick sin form (2026-07-26)

**Commit-range:** `91a577d` (dok-födelse, PR #225) → `f2e2d6f` (PR #227, öppen vid dagens slut). **Mål:** bygga `task-48` skarpt — det sista kortet ur S86:s prototyp-facit — och därefter ge T97-spårets tre ytor sin form via prototyp-pass, i den ordningen eftersom markera-lägets grammatik är den check-in ska ärva. Ej byggplan-fas.

- **`task-48` — markera-läget skarpt (PR #226).** Byggt test-först: **11 nya e2e röda före implementation, 17 gröna efter** (axe 0), med rött-först-utfallet observerat lokalt och inte antaget. Den lokala körbarheten kom ur T92 (a):s obetalda recept — `PLAYWRIGHT_TEST_BASE_URL` mot en egen dev-server på 4183 hoppar över `webServer`-blocket och lämnar Marcus 5173 orörd; receptet är därmed **empiriskt bevisat men fortfarande inte härdat** till ett eget npm-skript (T92 äger det, ingen scope-utvidgning gjord här). **Tre former rivna i kod och spec:** K46 personkortets "Skicka bekräftelse", K47/K48 Bekräfta alla-pillen med kontrollfrågan på rubriken, och `useSendConfirmation` som drev K46. Enskild optimistisk bekräftelse finns inte längre på eventsidan — 1-klicks-genvägen byggs på Hem-vyn (Marcus-beslut 2). §19:s prejudikatlista bär nu en rivnings-not: de två prejudikaten ur 18.16 beskriver knappar som inte finns kvar.
- **Renderad verifiering (DoD #6, L245/L246), mätt och inte påstådd:** valt kort `rgb(240, 253, 244)` = `--mm-success-bg` · kant `rgb(96, 107, 87)` = `--mm-success` · radie 12 px · batch-knappens bredd **205,89 px identisk vid 2 och 6 valda** (breddlåset mätt) · kön `clientHeight` 408 px = 25,5 rem mot `scrollHeight` 824 · live-regionen "6 av 6 markerade". Bilagor: [`bilagor/s90-task48-markeringslaget/`](../tasks/sessions/bilagor/s90-task48-markeringslaget/) (mobil 430 px + desktop 1440 px).
- **Review-piloten gav 7 fynd + 3 småfynd — samtliga åtgärdade**, loggrad i T86. Två träffade 11-ribban: fokus föll till `document.body` efter varje batch (FocusScope rev sin egen trigger; nu återlämnas fokus till Markera-knappen), och live-regionens attribut var otestade så en rivning av `aria-live` hade förblivit grön. **Ett träffade Lottas faktiska arbete:** ett `partial`-svar nollade hela markeringen, så tolv omarkerade kort hade krävts för ett nytt försök → **L350**. Övriga: läget överlevde vy-byte · Esc gick förbi pending-spärren · `contrast-more` släckte success-kanten (**L352**) · §19:s Greta-rad stod i presens om en riven knapp. **Self-review såg noll av dessa** — empirin stödjer ADR-041:s fångst-rater.
- **Kortet står `In Progress`, inte `Done`.** DoD #5 (design-review i webbläsaren) är Marcus-moment; kortet lämnades granskningsfärdigt per sessionens uttalade scope.
- **Tre prototyp-pass (PR #227), körda som workflows med subagenter på Marcus order (natt-chefs-formen)** — orkestratorn behöll granskningen och alla designbeslut. **67 skärmdumpar över fyra bilagemappar.** **Personer-listan:** konvergens från EXAKT kopia av faktiska vyn (T66:s form), elva förfiningssteg mot facit-vågen (inset-fixen, kortanatomi, metadata-grammatik, helkortslänk, sökfältets EventValjare-form, Skeleton i stället för "Laddar…"-text), två forkar lämnade till Marcus **på bild** — tonal kortyta mot zebra. **Persondetalj:** divergens A/B/C (historik-först · kontakt-först · tidslinje) fyllda med verkligt fixturdata, båda person-typerna snapshot:ade; **tre defekter dödade i alla tre = byggkrav oavsett vinnare** ("Ej närvaro" på framtida event, strängjämförelsen mot "Ingen aktiv anmälan", dubbelräkningen av tvådagars-event). **Check-in:** divergens A/B/C på befintlig `narvaro`-route, **noll mutationer** per prototyp-skillens read-only-förstärkning. Fixturvärlden utökad: `get-persons` blev en resolver som respekterar `?search` och paginerar, `get-person` tillagd för två personer.
- **Research-passet vände check-in-forken.** [`docs/research/checkin-monsterklassen-2026-07-26.md`](research/checkin-monsterklassen-2026-07-26.md) svarade skarpt på det S87 lämnade öppet: **"markera alla närvarande" är inte ett dörr-mönster.** Noll av fem undersökta produkter (Eventbrite Organizer, Luma, Cvent OnArrival, Splash Host, Sched) bär det vid dörren; varje funnen massmarkering ligger i register-klassen. Premissen "de flesta har samma tillstånd" är sann EFTER eventet och falsk UNDER insläppet. **Konsekvens: write-forken behövde inget val** — A9/A10 hör till registret, per-post-write hör till dörren, en skrivväg per situation. Och `task-48`:s markera-läge generaliserar till *registret*, inte till dörren (NN/g:s mode-varning: ett läge som ska stå på i en timme är en vy, inte ett läge) → **L353**.
- **Check-in-underlaget skarpt, utan att variantvalet är gjort** ([`bilagor/s90-checkin-forarbete/`](../tasks/sessions/bilagor/s90-checkin-forarbete/skarpt-underlag.md)). **A8 live-verifierad** mot prod-basen (`wfl1iYPrEmlKpEsRU`, `deployed`, `watchFields` = enbart `Status`) ⇒ appen skriver **aldrig** `Avstämt`, och allowlist-posten `set-attendance-status` (`Deltaganden`, exakt fältet `Status`) är låst med live-grund i stället för dokumentations-grund. **Generisk `update-record`, ingen ny Edge Function** — ADR-066:s idempotens-driver saknar motsvarighet här, eftersom en dubblerad `PATCH Status` skriver samma värde igen. Attribuerings-fyndet står som öppen grillningsfråga: `Registrerad av` är `lastModifiedBy`, alltså bokförs API-skriven närvaro på token-ägaren och inte på Lotta — samma klass som ADR-075 fällde för record comments; väg (a) rekommenderad, väg (b) rent additiv om behovet uppstår. Kort-kartan 0–9 lagd med **tre variant-oberoende skivor som kan börja omedelbart**.
- **Två nya fynd registrerade.** **TASK-52** — persondetaljen faller för varje person med motivering: `Motivering (text)` är en LOOKUP och returnerar en **array**, medan `PersonDetail.schema.ts` deklarerar `z.string()`. Live-verifierat mot två skarpa poster i staging. Defekten är osynlig för varje grind vi har, eftersom fixturvärlden och e2e använder schema-trogna strängar (L189:s klass, ny instans). **TASK-27 fick sin första skarpa träff bokförd:** CI-run **30178541626** föll 23:07 UTC på ett print-datum i `events-list.staging.test.ts` — alltså i task-17.7:s svit, en HELT ANNAN svit än de två instanser kortet kände till, vilket bekräftar kortets egen suite-bred-klassning empiriskt. Deterministiskt inom fönstret 22:00–00:00 UTC, tre Playwright-retries räddade det inte, och **kostnaden var en blockerad landning plus väntan till efter midnatt UTC**.
- **Hub-guarden korrigerad (marcus-system PR nr 2).** Konstitutionens *"Airtable MCP kan INTE se automationer"* gällde `mcp__airtable__*`-servern, inte claude.ai-connectorn, som bär `list_automations` och `get_automation`. Den kategoriska formuleringen höll A8-frågan öppen i två sessioner trots att verifieringen var minuter bort och read-only → **L351**.
- **SKÖRD: L349–L353** [UNIVERSAL ×5]. **L349** RAC:s roll bor på det dolda `<input>`, inte på träffytan — mät form på ytan, tillstånd på inputen (kostade en hel testomgång). **L350** ett 200-svar som inte är rent är inte ett lyckat svar. **L351** en kategorisk guard som är fel i halva sitt område får agenten att sluta leta. **L352** en Tailwind-variant i bas-strängen vinner över en villkorad grundklass. **L353** research FÖRE prototyp när frågan är vilken mönsterklass problemet tillhör. **Ingen ny ADR** (079 ledigt) — närvaro-write-ADR:n mintas i check-in-PRD:ns grillning, efter variantvalet; inga nya fällor, inga nya trådar.
- **Öppet vid dagens slut:** PR #226 och #227 omergade — #226 blockerad av TASK-27-klassen ovan, #227 röd på `Docs link check` med två 403-bottspärrar i research-dokets källförteckning (`.lycheeignore`-klassen, S84:s gitlab-precedent).
- **Numrering efter S90:** nästa 91/079/L354/T99/f46/task-53.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-26-session-90.md`](../tasks/sessions/archive/2026-07/2026-07-26-session-90.md) (Del 1–2) + fyra bilagemappar ([task-48](../tasks/sessions/bilagor/s90-task48-markeringslaget/), [personlistan](../tasks/sessions/bilagor/s90-personlistan-konvergens/README.md), [persondetalj](../tasks/sessions/bilagor/s90-persondetalj-divergens/README.md), [check-in](../tasks/sessions/bilagor/s90-checkin-divergens/README.md)). **EJ fas-avslut.** Kvar: **Marcus design-review av `task-48`** (DoD #5) och Done-flippen · **variantvalen** — persondetalj A/B/C, check-in A/B/C och listans tonal/zebra-fork, samtliga Marcus beslut per L237 · därefter **PRD + skivor per yta**, där check-in-kartans kort 1–3 är variant-oberoende och kan börja direkt. **`TASK-52`** plockbart. Bakgrund: hub-lyftet L284–L353 · `TASK-27` (tidszons-klassen, nu med skarp träff) · T87-aktiveringen · escapes-räkne-regeln · konventions-grillningen · arkitektur-placeringens epok-grillning (T93/T79) · dependabot #162/#65 · Marcus-moment: Update-klicket i claude.ai.

## Session 91 — Härdningssessionen: 22 pauser, restlistan genomarbetad, beslutsbordet stängt (2026-07-26 → 2026-08-02)

- **Commit-range:** `fc3b3da5` (sessionsdok-födelse 2026-07-26 13:56) →
  session-end-batchen 2026-08-02 (PR-kedjan `#579`–`#585`). **22 pauser /
  23 resumer** — sessionsmodellens längsta; paus/resume-kadensen
  (ADR-051/ADR-069) bar den hela vägen.
- **Mål:** född som design-review av `task-48`; växte på Marcus order till
  spårhärdning (restlistans Spår A–E: CI-/grind-arkitekturen,
  aktörs-koordineringen, lesson-skulden, verktygsskulden) med appen medvetet
  parkerad till S93.
- **Leverans-facit per spår:** [`tasks/s91-restlistan.md`](../tasks/s91-restlistan.md)
  § Avbockningslogg (dag-för-dag med refs) — återberättas inte här. Full
  narrativ: sessionsdok Del 1–42.
- **Mätbara spann under S91:** ADR-079–088 mintade (tio; nästa 089) · trådar
  T99–T113 födda + T85/T86/T87-uppdateringar (nästa T114) · backlog-substratet
  task-53 → task-124 (nästa 125) · **SKÖRD L354–L440** (L360–L432 via Spår
  C-konsolideringen + hub-lyft vol-05; **L433–L440 vid session-end** — hub-lyft
  väntar nästa hub-sync-moment).
- **Sista dagen (Del 41–42):** natt-mätningen `TASK-79` (20/20 lokalt, CI
  n=65) → vägval c · beslutsbordet 8/8 exekverat (Del 42.2) ·
  exekveringsresterna (A2:9/A3b → CONTRIBUTING · PreToolUse-rättelsen hub-PR
  #14) · sex+ stale kropps-rader brutna (L437-klassen) · `task-120`–`124`
  mintade · T108/T113 → `paused` med skäl+trigger.
- **EJ fas-avslut** — ingen fas stängdes; CHANGELOG orörd (fas-bunden per
  phase-end-verify).
- **Numrering efter S91:** nästa session **93** (S92 = färgsystemets pausade
  parallellsession) / ADR 089 / L441 / T114 / f47 (hypotes) / task-125.

**Sessionsdok-trail:** [`tasks/sessions/archive/2026-07/2026-07-26-session-91.md`](../tasks/sessions/archive/2026-07/2026-07-26-session-91.md)
(Del 1–42 + Paushistorik ×22). Transcript-referens för stängningsdagen: Del 42.6.

## Session 94 — Orkestrerings-utredningen: från spridda trådfynd till tier-policy i drift (2026-08-02)

- **Commit-range:** `dc821ec3` (sessionsdok-födelse) → session-end-batchen
  2026-08-02; spoke-PR `#587`–`#596` + hub-PR `#15` (plugin 1.26.0,
  installerad i samma landning). Endagssession, parallell med S93 (appen,
  huvudträdet) — S94 körde hela vägen i egen worktree, ADR-090-formen
  levd innan den var beslutad.
- **Mål:** Marcus öppning — orkestrerar-rollen och modellvalet ska bo i
  arbetssättet, inte i muntliga sessionstart-instruktioner; modell per
  processteg med branschbelägg.
- **Leverans:** utredning (research ×3 mot förstapartskällor + frontier,
  T113:s första Sonnet-datapunkt, docs-verifierad styrmekanik) →
  beslutsunderlag (`docs/research/modell-policy-underlag-2026-08-02.md`) →
  grillning 7/7 (en fällning: tyst auto-isolering revs på research-belägg)
  → **ADR-089** (tier-policyn: Haiku hittar · Sonnet utför · Opus
  avgör/felsöker · Fable orkestrerar; effort explicit; eskalering
  Opus-default) + **ADR-090** (sessions-parallellitet: detektera+fråga) +
  `TASK-125` (effort-mätkort) + hub-mekanisering (output-style,
  session-start/resume, SYSTEMET §4).
- **Trådar:** T67 designsteg verkställt (`paused`) · T113 eskalationsregel
  öppet riven · T111 fråga 3 stängd (läsdisciplinen).
- Full narrativ: sessionsdok S94 Del 1–4 + session-end-blocket.

## Session 95 — T95 Roger & Lotta-spåret: från parkerad tråd till exekverbar spec (2026-08-02)

- **Commit-range:** `92cd3e54` (sessionsdok-födelse, PR `#601`) →
  stängningsbatchen 2026-08-02; spoke-PR `#601`/`#602`/`#604`–`#609`.
  Endagssession, parallell med S93 (appen, huvudträdet) — S95 i egen
  worktree per ADR-090:s detektera+fråga, kvitterat i startutbytet.
- **Mål:** Marcus öppning — utreda T95 ("riktig app" + professionell
  inbjudan för Roger & Lotta), ta reda på allt som behöver göras och i
  vilken ordning, via standardproceduren grillning → kort → skivor.
- **Leverans:** grillning 9/9 Marcus-kvitterad (fas-framdragning av deploy ·
  Vercel · domänschema `admin.`/`send.miranon.dev` · DMARC `p=reject` ·
  invite-EF · lösenord+passkey-erbjudande · TTL 24 h [plattformstaket
  webbverifierat under grillningen — bilagans 7 dagar omöjlig] · login-vyn
  i Spår B · "riktig app" = B2) → research R1 (Vercel STÅR, Pro-krav;
  **SECURITY-SPEC:s CSP-nonce-mönster empiriskt falsifierat** → hash/self)
  och R2 (ingen wrapper — Add to Dock Gatekeeper-fri; brytpunkt → Tauri) →
  **PRD `TASK-126` + `TASK-127` + 15 skivor** i beroendeordning (tre
  parallella startkedjor; prototyp-pass + QA ready-for-human) →
  **ADR-091** (hosting) → bokföringen (byggplan-avvikelsen öppen ·
  T44-avgörandet · T46 Grind 0-paketet 7 punkter · T47-aktivering · T95
  `active` · ordlist-posten *Användarinbjudan*).
- **Trådar:** T95 `paused → active` (kort + spec) · T44:s root-vs-subdomän
  AVGJORD (psionautics-korsläsningen gav motsatt vägledning än T44 antog) ·
  T47 aktiverad via `TASK-126.3` · T46 fick tredje leverans-vägen.
- **Orkestrering:** research delegerad (2× Sonnet@xhigh research-pass,
  modell-identitet rapporterad), spec-syntesen i huvudloopen med Marcus
  kvittenser (skarv-val + skivnings-mandat), agent-worktrees städade (2).
- **End-passets incidenter (rättar postens ursprungliga "inga nya
  lessons"-rad, skriven före stängningen):** #609 fälldes av
  ADR-count-grinden (rot-README-raden 90→91 missad) och den state-pollande
  vakten var blind för rött — Marcus fångade externt. **L443 mintad
  [UNIVERSAL]** (vakta utfallsklasser grönt/rött/timeout, aldrig bara
  tillståndsbyte) + Marcus mekaniserings-order → `TASK-119` priority high,
  först i S96-batchen. Alla tio PR:er (#601–#610) MERGED git-verifierade;
  nästa lesson L444.
- Full narrativ: sessionsdok S95 Del 1–4.

## Session 97 — Mekaniserings-programmet: från beslut till körbar kod (2026-08-04 → 2026-08-05)

- **Commit-range:** `cb32b541` (sessionsdokets födelse) → `12d0b043`. **Fyra pauser**, fjärde resumen är sessionens tyngsta: 44 commits, PR `#738`–`#752`.
- **Mål:** betala av CARRY-blockets fem beslutsposter — och, efter Marcus fråga *"är allt UTFÖRT, inte bara förberett?"*, bygga mekanismerna i kod i stället för att lämna dem specade.
- **SEX MEKANISMER BYGGDA:** claims-täckning + `merge-tree`-grinden (`#745`, `task-139`, mutationstestad svit) · `besläktad`-existensgrinden (`#747`, `TASK-140`, Inv 5, symmetrisk — **inget spegelkrav**) · `barn`-manifestet (`#750`, `TASK-141`, Inv 6, asymmetrisk, **noll datarader**) · nattlarmets timeout-klassning (`#748`) · länkröte-fixen (`#746`) · `verify:ci-parity` (`#752`).
- **ADR-095 mintad** (`#740`) — Marcus öppnade uttryckligen för Supabase-migrering av hela dokumentationssubstratet; nio granskade system sade nej, starkast **Backstage självt** som kallar sin egen databas en *ingest-cache*. Sju beslut, paraply-form. **Öppet eskalerat, ej avgjort:** vad som *räknas* som barn (`T85`/`T86` kräver människo-omdöme).
- **TVÅ ROTORSAKER FIXADE, inte kringgångna.** (1) **`BEHIND`-deadlocken var egen konfiguration:** rulesetet bar `strict_required_status_checks_policy` samtidigt som `merge_queue`, och strict krävde uppdaterad gren som villkor för att posten ens fick köas — `ADR-076` hade bokfört kostnaden som ACCEPTERAD sex dagar innan kön aktiverades, och ingen konsumerade raden när förutsättningen ändrades. Fixat i `#749`, **skarpbevisat** när `#752` landade efter `#751` utan handpåläggning. (2) **Grind-diskrepansen hade FYRA instanser på en session** — `#740`, `#743`, `#747` röda plus en felräkning där `grep -c` på regelkoden räknade in shellchecks footer. Rotorsak: ingen lokal uppsättning motsvarade CI:s. `#752` **härleder** ur `ci.yml`/`ci-suite.yml` med fail-closed paritetsvakt.
- **Marketplace-domen revs av sin egen uppföljning:** hub-agentens **villkorade** mandat tog stopp-vägen — Discover läser `entry.description` utan fallback. Följdfyndet var dyrare: `7d4bf51` (Del 7, föregående dag) var **inte** beteendemässigt neutralt utan rev versionsraden ur Discover. Åtgärd (hub `76d47b7`): en fjärde väg passet aldrig övervägde — version återställd så validatorns cross-check vaktar igen, description ersatt med en kort stabil bläddringstext.
- **Uppströmsrapporten postad** till `anthropics/claude-code#72714` (öppen sedan 2026-07-01, noll kommentarer) med amplifikationsmätningen 22 worktree-skapelser/dag.
- **Dependabot:** `#632`/`#633`/`#634` landade i mätt ordning; `#635` fick `recreate` i stället för armering — den pinnar 6.0.0 medan 6.0.1 rättar just den `PerformanceObserver`-kastväg som gör bumpen riskabel.
- **Skörd:** `L456`–`L460` (`#739`) + `L461`–`L468` (`#754`, stängningsskörden). Tråd `T123` registrerad. `ADR-095` rättad i `#751` (stale ordinaltal + en formulering som motsade beslut 2 två stycken bort — båda fångade av bygg-agenten).
- **Egna fel bokförda:** två delmängds-körningar av grindar · ett "för/efter-experiment" som inte var ett · ett "tyst fel" som inte var tyst · en felräkning · nära att flagga ett korrekt paket som misstänkt på föråldrad minnesbild.
- **Numrering efter S97:** 98/096/L469/T124/task-142/f47. **`vol-06` måste roteras FÖRE nästa hub-lyft.** *(Lesson-axeln rättad 2026-08-05 i S98: posten skrevs `L461` vid stängningen, före `#754` landade `L461`–`L468`.)*
- Full narrativ: sessionsdok S97 Del 1–10.

## Session 93 — Appen återupptagen: eventsidan skarp, promoverings-apparaten byggd, 15-strecks-svepet (2026-08-02 → 2026-08-10)

**Mål:** återuppta app-bygget efter mekaniserings-programmet — eventsidans
form till skarp produktionsyta med Marcus-låst facit.

**Elva pauser, huvudleveranserna i ordning** (full narrativ: sessionsdok S93
Del 1–18):

- **Promoverings-apparaten:** ADR-102 (prototypen är facit) + ADR-103
  (promoveringen — flip, granskning, rivning av flaggor aldrig formen) +
  ADR-104 (godkännande-mekaniken: kanalseparation via `!`-kanalen, hook-spärr,
  `check-facit`-invarianten) — byggd i `task-167` (+ tuning `168`), skarp
  första gången på hållplats-facit, andra gången på åtgärds-/granskningssidan
  (PRD-`171`, mintad→Done på EN dag, riven `54e3ff36` med noll drift).
- **Eventsidan KLAR** (nionde pausen): `162`-kön + QA + `145.6`-rivningen +
  `166`-svepet.
- **15-strecks-svepet (`task-172`):** Marcus-beslutet "ALLA långa bindestreck
  i användarsynlig text MÅSTE bort" — `#1055` (73 ersatta + AST-grinden
  `check-langa-streck`) + `#1064` (17 REST-förekomster, datumspann-direktivet
  rivet öppet, 9 test-konsumenter synkade, policyn tömd till tom-markörens 9
  KEEP). Marcus omgodkännande-stämpel 2026-08-10 (`sha: e25efd05`;
  första stämpelns fel-träd-SHA → `task-175` + fragment).
- **Skörden L480–L511** (`#1065`): 8 fragment + 24 nya poster, två tappade
  carry-listor återfunna och skördade; hub-lyftet **K93.1–K93.39** (hub
  `a205132`) + SYSTEMET.md §0-termerna (hub `1ae7e01`) + /prototype-skillens
  promoveringskontrakt, plugin **1.33.0** (hub `b210ee0`).
- **CLAUDE.md-rättelser:** hook-ALDRIG → "kan inte förlitas på" (`#1062`).

**Verifiering:** samtliga landningar genom merge-kön med gröna jobb per PR;
facit-manifestet stämplat av Marcus via `!`-kanalen; ariaSnapshot-låsen 100 %
orörda genom strecksvepet; acceptance 177/177, api 465/465.

**Teknisk skuld/öppet:** `171.6` väntar `task-147` (osplittad PRD, sändvägen)
· `169`-resten väntar `146.4`/`158.4` · `task-174` (READ-ONLY-docblocken) +
`task-175` (stämpel-SHA-härledningen) plockbara · T135-familjen väntar
utredning · go-live-inventeringen = egen session.

## Session 105 — Fas 6.5 Aktivitetslogg (xAPI): KOMPLETT (2026-08-11 → 2026-08-14)

**Fas 6.5 KOMPLETT 2026-08-14.** Grillning → PRD `task-201` + 18 underkort →
bygge → prod-driftsättning 2026-08-13 ~18:30 (Marcus körde
`prod-driftsattning-runbook.md` guidat; prod-ref-låset aldrig kringgånget) →
exekveringsvåg + fas-avslut 2026-08-14 på Marcus GO + mandat.

- **Levererat:** Supabase `activity_log` (staging + prod, RLS, append-only
  strukturellt bevisad via GRANT-formen) · `log-activity`/`get-activity-log`
  under EF-ribban · xAPI-statements Zod-validerade, `requestId` enda
  korrelations-ID (ADR-111) + personId-extension · hem-spalten "Senaste
  aktivitet" (≥xl, facit-stämplad 2026-08-13, cache-invalidering `TASK-210`)
  · historikvy + filterrad via Mer (disambiguerade event-etiketter
  `TASK-201.17`) · e2e-skarven `aktivitetslogg-skarv.staging.test.ts`.
- **Noll-luckor-invarianten MEKANISERAD:** varje exporterad mutationshook
  loggar — 15/11/4 → 15/15 (`TASK-201.13`/`201.14`) → 18/18 efter
  skrivvägs-extraktionen (`TASK-201.15`: createEvent + segment-mail +
  saveSegment in i katalogen, hemvist-grinden
  `tests/api/mutation-hemvist-vakt.test.ts` + `.mutation-hemvist-policy.conf`
  fäller komponent-lokala mutationer) → **16/16/0** efter död-kod-rivningen
  (`TASK-201.18`: `useConfirmAll`/`useLogPaymentReminder`, tre oberoende
  noll-konsument-verifieringar, Marcus-mandat).
- **QA:** manuella planen descope:ad av Marcus (verbatim i `task-201.10`
  final summary); mekanisk Playwright-vandring mot staging-preview täckte
  punkt 2–8 med kärnbeviset live (post "nyss" utan omladdning · fritext
  aldrig i payload/render · requestId läst i nätverksfliken ·
  tvåkontos-attribution · mobil 390 px). VoiceOver-ljudprov öppet descope:at.
- **Prod-driftskorrigering under vågen:** stale-front-larm rest och
  TILLBAKADRAGET efter förstapartsmätning (vercel inspect-kedjan; Vercel-CLI-
  åtkomsten FANNS — ny registerrad i `atkomst-och-nycklar.md`); metodvarning
  bokförd på `TASK-199` (minifierad bundle-grep är fel instrument).
- **Landningar (samtliga MERGED, gröna per jobb):** `#1285`–`#1287`, `#1289`
  –`#1292`, `#1294`, `#1296`–`#1298` + baslinje-PR `#1249` (godkänd efter
  pixeldiff-granskning). Full narrativ: sessionsdok S105 Del 1–11.

## Session 103 — Person-vy-passet fullbordat: T97:s tre ytor skarpa, promoveringen ände-till-ände (2026-08-10 → 2026-08-15)

- **Mål:** T97-bygg-spårets tre ytor (personlistan, persondetaljen,
  check-in) designade, konvergerade och promoverade till skarpa ytor.
- **Utfall:** MÅLET NÅTT. Personlistan och persondetaljen promoverades
  under sessionens första del (Del 5–9); check-in-D konvergerades
  (Del 11–13), stämplades av Marcus via `!`-kanalen (`#1284`) och
  promoverades ände-till-ände under avslutande natt+morgon (Del 16):
  närvaro-WRITE byggd (allowlist-posten `set-attendance-status` + ny
  idempotent `create-attendance`-EF som mätt motiverad backup — rotorsaken
  ägs av bas-vågen), mutations-koppling med kvittensfönster-semantik
  (skrivning EFTER 1,2 s-fönstret, nätverksbevisad), referenser, flipp,
  härdning (axe 30/30), granskning + QA på Marcus delegerade mandat, och
  rivning med rename till `EventCheckin.tsx`. **Dörrlistan är appens
  skarpa närvaro-yta; Insiktskedjan bevisad levande i basen.**
- **Spec och beslut:** grillning 6/6 kvitterade (S103 Del 15) → PRD
  `task-214` + åtta skivor; prod-mätning avtäckte fyra aktiva anmälningar
  utan Deltaganden-rader (fälla 16/21-klassen) → `task-213.12` (HITL, ny
  session). Kontinuerlig bas-maxning beslutad (`ADR-063` § Updates,
  Del 13); `task-213`-familjen (PRD + 12 skivor) bär vågen.
- **Landningar (S103:s egna, samtliga via kön):** `#1283`/`#1284`
  (resume + stämpel) · `#1288` (grillningen + ORDLISTA ×4) · `#1293`/
  `#1295` (PRD + skivor) · `#1299`–`#1321` udda urval (skivor +
  stängningar; full tabell i sessionsdok Del 16) · fynd-kort `task-215`,
  `task-217`. Del 1–10 (personlistan/persondetaljen): se dokets tidigare
  Delar med PR-trail.
- **Teknisk skuld/flaggor:** `TASK-194` (facit-hookens träffyte-bugg)
  PRIORITERAD · `create-attendance` ej i prod-allowlisten (go-live-punkt)
  · DoD-mall-läckaget (hub-kandidat) · flake `task-215`.
- **Lessons:** nio fragment (sju `[UNIVERSAL]`) i `tasks/lessons.d/`;
  kandidat-pool deferred, bokförd i Del 16.

## Session 106 — Aktivitetshistorik-sidans omdesign: konvergens → promovering på EN dag (2026-08-15)

- **Hela prototyp-till-skarpt-bågen sluten samma dag** (ADR-103/104-apparatens
  snabbaste varv hittills): konvergens-pass direkt på befintlig yta (divergens
  bortvald på Marcus order), fem steg mot RENDERAD yta med Check-in-fallets
  rotdiagnos som grund (S103/task-209: tala husets stämplade språk) →
  facit-låsning → PRD `TASK-225` + 5 skivor → flip + härdning → Marcus
  `godkand`-stämpel via `!`-kanalen → mekanisk rivning (−1 078 rader substrat).
- **Formen:** husets sidkrom (44 px chevron + text-3xl), personlistans
  radgrammatik (initial-cirkel, tiden som rubrik, min-h-16, hover-underline
  utan tint), uppdelad filterrad + NY datumväljare (eventsidans DatumFalt —
  EF:ens from/to-range fanns redan, noll backend för filtret), verb-copy som
  presentationslager i delad modul (`src/data/activityLog/verbCopy.ts`) —
  hem-spalten påkopplad med facit-amendering (Marcus omstämpling).
- **EF-utökning:** `get-activity-log` bär additiv `total` (exakt head-count) —
  statusraden "Visar 20 av 279 poster." live-bevisad i staging; PROD-deployen
  körd av Marcus via allowlist-skriptet (35/35, tog även väntande fixar som
  `TASK-196` till prod).
- **Härdning:** `DatumFalt` lyft till `src/components/primitives/` (bevisat
  delbehov) · `h1[tabindex="-1"]`-fokusring-släckare i `base.css`.
- **Landningar (samtliga MERGED):** `#1316` (dokfödelse), `#1328` (låsning),
  `#1335` (PRD + 4 skivor + rivning, merge `b924fb1b`), `#1345` (Del 2 +
  kort-stängningar), `#1353` (s55-inbakningen). Kort: `225.1`–`225.5` + PRD
  `225` Done. Tråd `T144` född (heartbeat-larmbrus). Full narrativ:
  sessionsdok S106 Del 1–3.

## Session-modellen

Varje framtida session läggs till denna fil **som en ny `## Session NN`-sektion** (inte under en fas-rubrik — faserna kan spänna över flera sessioner eller flera faser kan rymmas i en session).

Per session:

- **Datum, session-nummer, commit-range** (hash → hash)
- **Mål** (1 mening + länk till byggplan.md §4)
- **Fas/fasers subsektioner** med planerat vs faktiskt, dependencies, avvikelser (ADR-referenser), verifiering, teknisk skuld, filstruktur-snapshot

Syftet är att en ny läsare ska kunna läsa sista sessionen och förstå var vi står idag, utan att scrolla uppåt hela filen.

## Referenser

- [`decisions/`](decisions/) — Architecture Decision Records; katalog + index i [`decisions/README.md`](decisions/README.md). Den levande räkningen är kanonisk i rot-[`README.md`](../README.md) § Arkitekturbeslut (CI-grindad, [`scripts/check-adr-count.sh`](../scripts/check-adr-count.sh)) — karta, aldrig kopia ([ADR-100](decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md) § 2). Talet upprepas inte här: denna rad stod som "20 ADR:er totalt" i månader efter att räkningen slutat stämma, exakt den drift pekare-formen finns för att förhindra.
- [`byggplan.md`](byggplan.md) — fas-för-fas-planen (styrande)
- [`archive/conversion-plan-2026-04-14.md`](archive/conversion-plan-2026-04-14.md) — historisk fas-för-fas-plan, ersatt av `byggplan.md` per [ADR-012](decisions/ADR-012-conversion-plan-ersatt-av-byggplan.md)
- [`gap-analysis.md`](archive/gap-analysis.md) — gap-analys som motiverade `[GA]`-tilläggen
- [`../tasks/lessons.md`](../tasks/lessons.md) — universella lärdomar
- [`../tasks/todo.md`](../tasks/todo.md) — aktuell todo-status

## Session 102 (2026-08-10 → 2026-08-17) — Go-live-passet: åtta pauser, rotorsaker och prod skarpt

- **Commit-range:** `3d641184` (dagsorderns bas) → `4d2ca94d` (T144-trådkortets landning)
- **Mål:** ta reda på exakt vad som återstår före go-live (Roger & Lotta släpps in), göra allt funnet plockbart, och lämna rent bord. Dagen blev en vecka och åtta pauser.
- **Faktiskt:** go-live-inventeringen → tre-sidors-spåret (check-in/personer/persondetalj) promoverat → mailvägen skarp → Lotta-vandringen p1–p10 → laddupplevelsen (233/240/266) → Morgonkollen konvergerad och stämplad → svep-kedjan (241.1–241.7) → dokument-familjen komplett → rotorsaks-flottan (238 kvadratroten 1332→14,57 s · 250 CLI-wrappern · 251 worktree-portarna · 255 kontraktsvakts-fixturen · 256 API-flaken · 261 blinket · 266 höjdkedjan) → **fas 4: 39 EF:er deployade till prod med skriptad sekvens** → passkeys aktiverade och probe-verifierade
- **Avvikelser:** ref-incidenten 2026-08-10 (fem EF:er till fel projekt — blev skälet till att `fas4-prod-deploy.sh` verifierar länkläget före varje skarp operation) · nightly röd 19 raka nätter, dominanterna två drift-detektorer (Länkkontroll = ADR-082:s valda kostnad, backlog-grinden = 238-roten) · fas 4-underlaget beskrev en baslinje som var inaktuell redan när det skrevs (git-derivering, inte artefakt-mätning) · min egen `.se`/`.dev`-förväxling ur arkivmaterial · shellcheck körd utan `--enable=all` gav falskt grönt lokalt
- **Verifiering:** deployen mätt mot prod-svaret (39 ACTIVE, alla `updated_at` inom 55 s, noll test-\* i prod) · deny-triple mot `create-attendance` (401/401/405) · CORS tvåsidigt bevisat (rätt origin 200 + speglad, främmande 403) · prod-bundlen bevisad bära dagens kod (`grid min-h-dvh w-full`) · passkey-probe 200 med `rpId: admin.miranon.dev` · prod-basens `Bilagor` mätt tom
- **Teknisk skuld:** `task-268` (icke-strikt `DocumentPreviewSchema` döljer fel-gren-svar) · `task-269` AC3 (dörrens backup-väg oprövad skarpt) · `task-239` (tre gröna nätter, tidigast 2026-08-20) · `task-256` AC4 · stämpel-hookens delta-fix (a/b-beslutet, väg b vald men obyggd) · `T144` (heartbeat-larm utan ägarskaps-filter, andra instansen mätt) · `INVITE_REDIRECT_URL` bör sättas explicit i stället för Site URL-fallback · 40-listans beslutspass · fem Dependabot-PR:er i review
- **Full narrativ:** `tasks/sessions/2026-08-10-session-102.md` Del 1–18
- **Producerade underlag:** `docs/research/fas4-ef-deploy-underlag-2026-08-17.md` · `docs/research/40-listan-proveniens-relevans-2026-08-16.md` · `docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md` · `scripts/fas4-prod-deploy.sh` + `scripts/test-fas4-prod-deploy.sh` (TASK-272) · `tasks/threads/T144-heartbeat-svepet-larmar-utan-agarskaps-filter.md`

## Session 104 (2026-08-10 → 2026-08-17) — Segment-passet: design-om + promoveringen

- **Commit-range:** `44ffbfe9` (facit-lås-förberedelsen) → natt-orkestreringens svans (`#1534` m.fl., 2026-08-17)
- **Mål:** `/mer/segment` designas om mot appens satta formspråk och promoveras till skarp yta med server-ägt regelspråk (PRD `task-249`, ADR-115; byggplan Fas 6-sfären)
- **Faktiskt:** divergens-prototyp (varianter a–d) → Marcus valde d → konvergens till "helt nöjd på alla sidor" → facit stämplat (`a40f3543`) → basstruktur (`Kursfamilj`/`Kursnivå`) i båda baserna → åtta byggskivor via autonom natt-orkestrering (Del 10-tabellen: `#1475 #1477 #1478 #1480 #1492 #1494 #1501 #1510`) → EF:erna prod-deployade 38/38 (Marcus egen körning, prod-ref-låset) → front bundle-bevisad färsk → Marcus QA → fyndspåren 259 (`#1534`, landad) + utredningen 260 (`#1522`) + K1/B1-korten (264/265)
- **Avvikelser:** en CI-cykel på 249.5 (skip-mot-självtest, precedent-fix); re-låsning av två aria-referenser med Marcus-kvittens (ADR-102/103-disciplinen höll); modell-routing skärpt mitt i natten (Opus för svåra, ADR-089)
- **Verifiering:** merge-kö-verifikat per PR; aria-grinden 14/14 genom flipp OCH rivning; hermetik-självtestet 222/222; 874 API-tester
- **Teknisk skuld:** task-257 (PersonsList-höjdlåset) · task-258 (död kod + sparNot/PrototypNot-rester) · task-265 (Leads-vyn i basen) · 213.4-varningen (BLANK()-kanten)
- **Full narrativ:** `tasks/sessions/2026-08-10-session-104.md` Del 1–10

## Session 111 (2026-08-22 → 2026-08-23) — Anmälningssidan: konvergenspass till prod, bevakningsradernas nya anatomi, sidramen som familj

- **Commit-range:** `393e857a` (bas vid start, 2026-08-22) → `e1470eb0` (`#1864`, hela kodpaketet, 2026-08-23) + stängningslandningarna `#1886`/`#1887` och denna; två pauser + två resumes, PR-spannet `#1794`–`#1887` delat med S108 (levande i huvudkatalogen hela passet) och S109/S110
- **Mål:** `TASK-292`:s QA-fynd (Hems åtgärdskö-rad ledde till en Fas 1-sida Marcus kallade *"skitful"*) → grillning → PRD `TASK-299` (tio skivor + `299.11`) → divergens → konvergens → facit → promovering, och `TASK-291` (åtgärdskö-radens särskiljning) som andra spår
- **Faktiskt:** grillningens fynd — appen bar TVÅ facit-stämplade sidram-dialekter — blev [`ADR-126`](decisions/ADR-126-delade-presentationsformer.md) + `DESIGN-SYSTEM-SPEC` § 23 (`#1873`) · `SidRam` + `InitialAvatar` lyfta till bibliotek/primitiv (`299.1`) och promoverade till väntelista, intresserade, maillogg, installera-appen (`299.7`–`299.9`, natten 22→23), aktivitetshistorik + dokument med 16 px-fixen (`299.11`, `#1871`), persondetalj + check-in (`299.6`) · anmälningssidan itererad av Marcus själv i Del 5 (tio lokala commits, två Opus-agenter), variant B stämplad (`299.4`) och promoverad till `/mer/anmalningar` med rename-historik, aria-grind fångad före flippen, prototypen riven (`299.5`) · bevakningsraden + åtgärdskö-raden promoverade till skarpa `Bevakningsrad.tsx` (70 px-lås i 20 mätpunkter, `Link2Off` i fylld cirkel; `291` AC #3, `303`) · ordbytet `Eventinfo → Deltagarinfo` i UI-copy (34 filer, `ORDLISTA.md` § Deltagarinfo) · **prod:** Vercel Production `e1470eb0`, bundle-identitet verifierad chunk för chunk på `admin.miranon.dev`
- **Avvikelser:** facit-bilden avslöjade en mobildefekt agenten kallat "avsiktlig" (identitet → "R", namn klippt mitt i ordet) — rättad med tvåradigt grid före stämpeln · ordbytet sprack på två ställen i den gamla bevakningsrads-anatomin (löst av promoveringen) · Marcus QA: anmälningssidan saknade sidramen trots PRD (prototypen bar textlänken; rättad + omstämplad) och alla `SidRam`-chevroner satt 40 px för högt (komponenten äger nu topp-luften) · flytten avtäckte att eventväljarens popover flippade ÖVER triggern vid 720 px och ett klick valde första alternativet (pre-existerande, fixat i väljaren) · handoffens numrering överspelades tre gånger av parallella sessioner (`ADR-124`→`126`, kort `307`→`311`, `L511`→`L521`) · lessons-agenten falsifierade två av orkestrerarens premisser (worktree-taket, acceptance-serverns död)
- **Verifiering:** CI grön per jobb på varje landning; lokalt 168/168 promoveringsgrindar, acceptance 48/48 hem · 39/39 anmälningssidan · 61/61 väljar-ytor · 43/43 persondetalj/check-in; `check-facit` 0 med 13 manifest; Marcus QA-vandring på staging-preview i fönster 3 (*"Ser bra ut"*, två gånger) + omstämpling via `!`-kanalen
- **Teknisk skuld:** `299.10` AC #1 (förstärkt kontrast saknar testtäckning på nio ytor) · `299.11` AC #6 (omstämpling av `s106`/`s102-dokument`) · `#1883` baslinje-PR (14 bilder, väntar Approve) · `TASK-311` (PWA-skärmbild) · `T172`/`TASK-297` (facit-regimernas täckning) · lessons-markörens åtta former · hubbens `vol-06` vid rotationströskeln · `check-backlog-closure.sh` röd på 38 äldre kort
- **Full narrativ:** `tasks/sessions/2026-08-22-session-111.md` Del 1–7 + två paushistoriker; beslut [`ADR-126`](decisions/ADR-126-delade-presentationsformer.md); facit `tasks/sessions/bilagor/s111-anmalningssidan-konvergens/` (7 bilder + `AMENDERING-2026-08-23-sidram.md`); hem-facitets `AMENDERING-2026-08-23-bevakningsradens-anatomi.md`; lessons `tasks/lessons/vol-07.md` `L522`–`L532` (hub `K111.1`–`K111.11`, `050fa9e1`)

## Session 110 (2026-08-21 → 2026-08-22) — Kalenderlänk-driften: F.2-roten, 64 → 0, och vakten live i prod

- **Commit-range:** `433a53b7` (bas vid start) → `939e0be0` (`#1783`, T161-amenderingen); 40 S110-märkta landningar, PR `#1671`–`#1783`, fyra pauser + fyra resumes
- **Mål:** `TASK-232`:s fynd (EventKey 11 på ID 868, återfall av fälla 10/F.2) → rotorsak, städning, och en strukturell vakt så felklassen inte återkommer tyst
- **Faktiskt:** rot lokaliserad (Elfsight-widgetens handskrivna länkar; Roger duplicerar poster utan att redigera URL-parametrarna) → 64 felmatchade + 1 orphan i prod städade med Marcus GO per steg (Del 2) → vakten grillad och låst (`ADR-122`, Del 3) → `TASK-284` i sex skivor, byggda autonomt (Del 4–7; `T167` löst via UI-väg, `T168` rättad två gånger) → QA-vandring (Del 9) → prod i låst ordning fälten → kontrollsvep → A1 sist (Del 10–11) → familjen + `232` + `T167`/`T168`/`T161` stängda (Del 12–13)
- **Avvikelser:** `REGEX_EXTRACT`-formen gav `#ERROR!` på rader med tomt `Datum` (riven samma dag); prod-svepet gav 5 `Avviker` mot väntat 4 — den femte var Event-18:s olokaliserade falska positiv (URL-kodade mellanslag), datat rättat och `TASK-293` mintat; Airtables cachade trigger-testrad gav ett rött UI-test på en korrekt deploy; `T169` (CLS-flake) fällde två docs-only-landningar
- **Verifiering:** merge-kö-verifikat per PR, post-merge grönt per jobb på varje landning före stängning; sex fall ände-till-ände i staging (A1 isolerat) + skarpt prov i prod i båda riktningar (kedjan A1→A2→A3→A12), nio testposter städade med record-ID; `ADR-122`-formeln strukturellt jämförd staging/prod före skapandet
- **Teknisk skuld:** `TASK-291` (åtgärdskö-radens särskiljning → `284.4` DoD #6) · `TASK-292` (anmälningssidans konvergenspass, S111) · `TASK-293` (`+`-normalisering i formel + vakt + fixtur) · fälla 52 (död `"Ej relevant"`-gren, latent) · `T169` · Lottas besked (ID 21/22/23, Event-55, Event-60, obekräftade)
- **Full narrativ:** `tasks/sessions/2026-08-21-session-110.md` Del 1–13 + fyra paushistoriker; beslut `docs/decisions/ADR-122-eventlankens-vakt-och-atgardskon.md`; vaktskriptet `docs/reference/automation-scripts/a1-eventmatchning-vakt.js`; Lotta-underlaget `~/Downloads/lotta-underlag-anmalningar-2026-08-21.md` (utanför repot)

## Session 109 (2026-08-20 → 2026-08-22) — Notis- och felmeddelande-familjen: från fyra designspråk till ett, plus det förladdade personregistret

- **Commit-range:** `191936ff` (bas vid start, 2026-08-20 11:10:02Z) → `e012971c` (`#1816`, bokföringspasset, 2026-08-22 19:50:31Z); tre pauser + tre resumes, PR-spannet `#1662`–`#1816` delat med tre parallella sessioner (S107 pausad, S108 och S110 aktiva i egna worktrees)
- **Mål:** S107:s överlämning — meddelande-ytorna bar fyra oberoende designspråk (notis, meddelanderuta, sektionsfel, appfel-sida) och skulle bli ETT; därtill personlistans sök som svarar på varje tecken, med bokstavsindex och sortering ur samma array
- **Faktiskt:** formvalet grillat och låst i [`ADR-121`](decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md) → notisfamiljen byggd i nio skivor (`285.1`–`285.9`), stämplad av Marcus via `!`-kanalen, prototyp-substratet rivet (`285.11`) och visuella baslinjer födda (`#1811`, merge `918b6576`, **16 bilder** — mätt: 8 sviter × 2 vyportar) · personregistret låst i [`ADR-123`](decisions/ADR-123-forladdat-personregister-sok-och-bokstavsindex-i-klienten.md) och byggt i `286.1`–`286.4` + `286.7` (diakritik-tolerant sök med pinnad vikningslokal) · bokstavsraden `283.2` (`#1784` `6c3bf097`, +1 046/−31; 29 bokstäver plus hinken `Utan namn` = 30 knappar, ett tabbsteg via `react-aria-components` `Toolbar`, minsta träffyta 28×28 px över fem bredder) och nedtoningen `283.3` (`#1798` `2138faad`, +1 024/−34; kontrast 5,33:1 normalt / 7,91:1 i `prefers-contrast: more`) · personlistans facit omstämplat efter Marcus godkännande i körande app (`#1802` `d4997b5a` = stämpel-SHA, stämpel-commit `91e3db26` via `#1803`) · **21 kort satta `Done`** 2026-08-22, varav sexton var ren registerskuld — kort som stod `To Do` med landad kod därför att `DoD #3 CI grön per jobb` saknar ägare (`TASK-281`)
- **Två nya mekanismer, båda i [`ADR-102`](decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md) § Updates och båda tvåsidigt bevisade:** **amenderings-mekaniken för ett stämplat facit** (`T157`, avblockade `#1715` och fyra beroende kort; klasserna (a)–(c) med krav på utskriven klassning, sidofil i stället för JSON-nyckel eftersom `check-facit` T25 fäller på den formen) och **rivnings-klausulen för invariant (b)** — `285.11` var den första rivningen någonsin som nådde `ADR-102` B2 steg 4, och `check-facit.sh` fällde på att manifestets `kallor` pekade på de nyss rivna filerna; mätt över alla tolv manifest **22 prototyp-filer i fem stämplade manifest**, alltså fyra familjer till på väg in i samma vägg. Klausulen härleder ur git att filen fanns vid stämpelns SHA och är borta nu; sökvägsundantaget avvisades med mätning (`/dev/` ensamt hade täckt 14 av 22)
- **Prod-incidenten — ett ÅTERFALL, inte en förstagångshändelse:** Vercel deployar Production automatiskt ur `main`, så fronten gick live 16:37:26Z medan prod-`get-persons` bar `UPDATED_AT` 2026-08-20 07:35:10Z — 31–52 h äldre än sin egen kod. Klientens `?register=true` föll till sök-grenen och klampades till `DEFAULT_PAGE_SIZE = 50`; **Lotta såg 50 av 559 personer** och nästan hela alfabetet nedtonat, eftersom nedtoningen räknas ur registret. EF-deployen 17:13:34Z (`ezbr_sha256` `31a8b234…` → `85306a63…`, mot `get-events` oförändrade `636539ed…` genom samma deploy — kontrasten är beviset; varken `VERSION` eller `UPDATED_AT` skiljer omdeployad från nydeployad). Prod var fel även efter deployen: query-cachen persisteras i `localStorage` med `buster: __APP_VERSION__`, cachen föddes i glappet under NY app-version, och `286.4`:s `staleTime` på 30 minuter gjorde datan färsk. Samma orsak bokförd fem dagar tidigare i `tasks/sessions/2026-08-17-session-107.md` — därför `TASK-286.8` (**EF före frontend**, per EF-rörande PRD-familj). Prod-tidsstämplarna och hasharna är Marcus mätning mot prod och kan strukturellt inte reproduceras av en agent (`deny-prod-ref.sh`)
- **Avvikelser:** felen låg nästan uteslutande i bokföringen, inte i produktkoden — `PersonsList.tsx` bar en rå NUL-byte som fogtecken, vilket gjorde hela filen osynlig för `grep` utan att något test fällde (`#1799` `ab394872`, en insättning och en borttagning) · `--update-snapshots` utan värde har preset `changed` och skrev bara om 2 av 6 referenser, så fyra lås förblev gröna men ofullständiga (`=all` gav 6 av 6) · samma flaggas valfria värde svalde `TASK-298`:s spec-filter i motsatt riktning två timmar senare · `--notes` **ersätter** hela notes-sektionen och raderade två överlämningar innan det upptäcktes (`54577365`, återställda ur `8ebfab2c`) · första stämpel-försöket gavs mot en checkout tio commits efter `origin/main` och förlorades · sessionsdokets Del 7 skrev `ADR-122` där `ADR-123` gäller, vilket hann vilseleda en agent · baslinje-dispatchen blockerades av hem-vyns grind som vaktade en riven form (`TASK-243.6`, landad `d7498747`)
- **Verifiering:** `bash scripts/check-facit.sh` exit 0 — 12 manifest, 27 ytor, **0 ogodkända**, 11 referenser innehållslåsta mot sha256 · personlistans referens-grind gick **10/6 → 16/0**, och provokationen fäller nu (exit 1) där den före regenereringen inte kunde fälla någonting · rivnings-klausulen bevisad i båda riktningar (blind acceptans → T31 föll; klausulen borttagen → dagens bugg återkom) och alla fem familjers rivningar simulerade i samma träd, exit 0 med 22 poster namngivna · `TASK-298`:s argumentordning grindad som invariant, 26/26 gröna med mutationen skarpt prövad · `283.3` AC #3 bevisad genom att radens och varje knapps rect blev byte för byte identiska med `283.2`:s mätning före nedtoningen · merge-kö-verifikat per PR, post-merge grönt per jobb före varje stängning
- **Teknisk skuld:** `TASK-286.8` (prod-utrullningens ordning, AC #3 och #6 medvetet öppna — de kan inte bockas av att kortet existerar) · `TASK-288` (22 stämplade ytor utan `referenser`-fält; bara 3 av 27 är innehållslåsta, personlistan är inte en av dem) · `TASK-289` (A2-latensen mot personregistrets invalidering) · `TASK-295` (differentialbevisad kontrast-flake i `persons-list.acceptance`) · `TASK-296` (`supabase functions deploy` varnar för en fil som aldrig funnits) · `TASK-300` (baslinje-driften på tre orörda ytor, landad på Marcus order utan utredning) · `TASK-290` (fyra sökytor med tre beteenden) · `T172` (facit-regimernas täckning) · `T173` (baslinje-workflowens `git add` täcker inte katalogen med `aria`-referensfilerna) · QA-vandringarna `283.5`, `285.12`, `286.6` avstådda på Marcus beslut · föräldrakorten `283`/`285`/`286` medvetet `To Do` med skälet bokfört i vart och ett
- **Full narrativ:** `tasks/sessions/2026-08-20-session-109.md` Del 1–15 + tre paushistoriker; beslut [`ADR-121`](decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md) · [`ADR-123`](decisions/ADR-123-forladdat-personregister-sok-och-bokstavsindex-i-klienten.md) · [`ADR-102`](decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md) § Updates (två poster 2026-08-22); tråden `tasks/threads/T173-baslinje-workflowens-git-add-tacker-inte-aria.md`; sju `[UNIVERSAL]`-fragment i `tasks/lessons.d/` (fem ur skörde-committen `2fcc24d7`, ett ur incidenten `c7c0aafa`, ett ur rivnings-klausulen `cd9d171c`)
