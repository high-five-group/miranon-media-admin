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
**Trail:** Inventeringen är sin egen output — se [`byggplan-revision-inventory.md`](logs/byggplan-revision-inventory.md).
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

Stänger Fynd-punkter ur `docs/analysis/Fas-2-11-10-verification-2026-05-14.md` före Fas 2.5. Trail i `tasks/sessions/2026-05-26-session-7.md`.

**K0.1 — Fynd 1 (typecheck no-op):** `tsc --noEmit` utan `-b` ignorerade TypeScript project references (`tsconfig.json` = `files: []`), så Fas 2:s namngivna typecheck-signal var no-op för app-koden — `npm run build` (`tsc -b`) fångade typfel, men `typecheck`-scriptet + CI-steget `TypeScript check` gjorde det inte. Åtgärdat (commit `3c8c3f6`): `typecheck` → `tsr generate && tsc -b --noEmit`; CI `TypeScript check` → `npm run typecheck`. Negativ test bevisade kontrasten (TS2322 i app-fil: ny form exit 2, gammal exit 0). Typecheck-signalen är nu ärlig. Ingen ADR — bugg-fix av trasigt script, inget arkitekturbeslut.

**K0.2 — Fynd 2 + 3 + index.tsx-vektorn (auth-resolution no-flash):** `_authenticated.tsx` `beforeLoad` blockerade inte render under `auth.isLoading` (synkron return = no-op) → flash av skyddat innehåll (Fynd 2); `__root.tsx` `<Suspense>` gateade aldrig auth (`AuthProvider` kastar ingen promise — Fynd 3); `index.tsx` saknade isLoading-hantering (egen flash-vektor). Åtgärdat (commit `e5346a5`): render-gate i `InnerApp` (`main.tsx`) — `<RouterProvider>` monteras först när auth löst + `router.invalidate()` guardad `if(!isLoading)` (ogardad → krasch mot router-modul-default `context.auth=undefined`); `beforeLoad` i `_authenticated`/`index`/`login` förenklade. No-flash strukturellt utesluten (RouterProvider monteras aldrig under loading); K4.3-sviten 7/7 grön. Deterministiskt regressionstest deferrat till Fas 3.5 (vitest), spec:at i `tasks/todo.md`. [ADR-037](decisions/ADR-037-auth-resolution-render-gate.md). DoD-rad 7-mekanismen omtolkad (render-gate-splash, ej Suspense).

**K0.3 — Fynd 4 (root error boundary):** empiriskt fel-test (K0.3a) smalnade fyndet — loader-/route-komponent-fel fångades redan av `Sentry.ErrorBoundary` (app-fallback), men **root-route-render-fel** föll till TanStacks obrandade default ("Something went wrong!"); DoD-rad 8:s "ladda om"-fallback levererades inte för dem. Alla router-fel nådde Sentry via `createRoot` `onCaughtError`. Åtgärdat (commit `6bd756d`): `defaultErrorComponent` (`src/components/RouteErrorFallback.tsx`) i `createRouter` — branded fallback för alla router-fel inkl. root-route. K0.3b kontrast-test: (c) root-route-fel ger nu branded fallback (TanStack-varningen borta); `onCaughtError` 1× per fel (Sentry-capture intakt, ingen dubbel-rapport). Ingen `onError` (undviker dubbel-rapport); `Sentry.ErrorBoundary` orörd. [ADR-038](decisions/ADR-038-router-fel-defaultErrorComponent.md). Öppna frågor (Sentry.ErrorBoundary-roll, render-gate-yta, capture-konsolidering) → fel-hanterings-arkitektur-konsolidering i `tasks/todo.md`.

**K0.4 — Fynd 6 (test-nuqs i prod-bundle):** `test-nuqs` var en DEV-fixtur för K4.1:s DoD 4-verifiering (bevisa nuqs); en inert test-route kvar permanent i prod-route-tree + bundle (~12.21 kB chunk) var en grön signal utan rätt mätning. Borttagen (commit `c9c44b1`): `src/routes/_authenticated/test-nuqs.tsx` raderad, `routeTree.gen.ts` (gitignored) regenererad utan `/test-nuqs`. Ren build verifierad — test-nuqs-chunk borta ur `dist/assets`. **nuqs-infra intakt:** paketet + `NuqsAdapter` i `__root.tsx` orörda; första riktiga `useQueryState` + regressionstest sker i Fas 6 (första URL-state-feature). DoD-rad 4 omtextad till varaktigt tillstånd. Ingen ADR — fixtur-städning.

**K0.5 — Fynd 5 + 7 (ärlig omklassning av deferrade fynd):** båda har etablerade defer-beslut → ingen kod-åtgärd; K0.5 registrerar dem sant så Fas 2:s 11/10-status inte hålls gisslan. **Fynd 5 (logout):** K4.3 Test 6 verifierar router-reaktion på förlorad session (storage-clear), men `auth.logout()`→`signOut()`-vägen är typbevisad, ej regressionstestad — DoD-rad 2 omtextad, logout-test deferrat (Fas 3.5/5, `tasks/todo.md`). **Fynd 7 (bundle):** main-chunk 640.49 kB raw / 188.97 kB gzip (~oförändrat vs baslinje 640.82/189.22; test-nuqs −12.21 kB ur total, main oförändrat → ingen regression) — medveten Fas 7 perf-budget-defer, ej 11/10-blocker (bundle-evolution-tabell + `tasks/todo.md` Fas 7-punkt). Ingen ADR. **Alla sju Fas 2-fynd därmed hanterade** (Fynd 1–4 + 6 åtgärdade K0.1–K0.4; Fynd 5 + 7 ärligt omklassade K0.5).

---

## Session 8 — Process-retrospektiv (K0a + K0b + K0c, 2026-05-27 → 2026-05-28)

Process-retrospektiv mellan Fas 2 och Fas 2.5 — diagnos av en tyst doc-drift-klass (kadens-missmatch), åtgärd med 2 deterministiska per-push-grindar, och cross-repo-stängning av två hub-trådar. Full trail i `tasks/sessions/2026-05-27-session-8.md`. Session 8 spände två kalenderdagar utan att split:as — empirisk bekräftelse av [ADR-040](decisions/ADR-040-sessions-numreringskonvention.md) Beslut 2 (en session = en logisk arbetsenhet; en paus renumreras inte).

**K0a — kartläggning (förrättad i en tidigare Code-session, retroaktivt registrerad i sessionsdoket):** inventerade skydds-mekanismerna (4 skills + ~11 CI-grindar + den enda fas-bundna doc-drift-vakten `phase-end-verify.sh`), klassade Session 7:s 8 fix-steg (Klass A CC-tooling: 2; Klass B ogrindad artefakt-drift: 4; Klass C self-review-fångad: 2), och hittade 2 aktiva driftar: README ADR-räkning `28` vs faktiskt `38` filer + ADR-029 § Utelämning #6 `fetch-depth: 50` vs ci.yml `100`. Roten diagnoserad som **kadens-missmatch**: enda mekaniska doc-drift-vakten körs vid fas-avslut medan artefakter ändras varje session — drift osynlig (inga failande tester) tills någon läser fel värde. K0b avtäckte dessutom att `phase-end-verify`:s ADR-check redan var trasig (greppade stale `28` på en andra README-rad — `head -1`-icke-determinism). Ingen kod-åtgärd här; K0a är diagnos.

**K0b — åtgärd (commits `e572a17` + `0227a1c`, 2026-05-27):** atomisk K0b-commit (12 filer) levererade: (a) README ADR-räkning lyft ur fryst "Statistik"-ram till en kanonisk levande rad (token `<N> arkitekturbeslut`, exakt 1 träff i README — skyddar phase-end-verifys `head -1`); (b) ADR-029 fetch-depth-erratum (scope:ad till `changed`-jobbet inom ADR-029:s jurisdiktion, cross-job-invariant deferad till ADR-039); (c) 2 deterministiska CI-grindar — `scripts/check-adr-count.sh` (ADR-fil-antal == README-token) + `scripts/check-fetch-depth-invariant.sh` (6 levande bärare ömsesidigt lika; ADR-029/030 verifieras bära erratum, ej värde-likhet — `^[[:space:]]*`-ankare exkluderar ci-yaml-kommentarer); (d) 2 truth-table-suiter (4+7 fall, kontrast-bevisade grön→röd→grön; T5 bevisar frusen-text-exklusion); (e) wirade i alltid-körande `lint`-jobbet (kör-varje-push, shellcheck-strict 0/0/0/0); (f) [ADR-039](decisions/ADR-039-konsistens-grindar-kadens.md) (kadens-principen + lesson→grind-principen, utvidgar [ADR-036](decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md)); (g) L51–L54 [UNIVERSAL] + lesson→grind-todo (CI-wira `test-check-{frontmatter,public-checklists}.sh` — kvar öppen). Self-catch: ADR-039-filen bumpade ADR-antalet 38→39 → grinden fångade behovet på sin egen commit. Separat commit `0227a1c` för [ADR-040](decisions/ADR-040-sessions-numreringskonvention.md) (sessions-numreringskonvention — sekventiella heltal, decimaler avvisade) + README 39→40 + index-rad i samma atomic commit (krav från check-adr-count). CI grön på enforcement-ytan (runs 26511094980 + 26511266901).

**K0c — cross-repo-stängning (hub `96e6727` + `a2bd96b` + `3c611bd`, spoke `bdb5f6c` + `1a20415`, 2026-05-28):** två hub-trådar K0b lämnade öppna. (1) Hub-skill `session-start/SKILL.md` fick en universellt formulerad sub-disciplin för ADR-040 (sekventiella heltal, mini-handoffs ≠ ny session, faser separat axel, historik grandfathrad) — **description orörd** (diff-verifierat: K8-discovery-skyddet intakt; session-start var 1 av 4 rena per Session 6.7 K8); pekare i kropp, inte i description. Plugin bumpad 1.1.0 → 1.1.1 (PATCH för body-enrichment — etablerar precedens vs enda tidigare bump `e8aadf0` MINOR för skill-set-ändring). Empiriskt aktiveringsbevis: cache är path-keyed by version — pre-bump `grep -c "sessionsnummer (numreringskonvention)"` på `1.1.0/` = 0; post-`claude plugin marketplace update marcus-hub` + `claude plugin update marcus-system@marcus-hub` materialiserades `1.1.1/` med grep = 1 (gamla `1.1.0/` bevarad frusen). Session 7 STOPPA #1-klassen (settings.json-klobber per L38) vaktad med per-kommando-sha256-snapshot: spoke `.claude/settings.json` byte-identisk PRE / POST båda CC-kommandona — risken inträffade inte. (2) Hub-lessons-lift K8.1–K8.5 i `marcus-system/tasks/lessons.md` (1:1 från spoke L51–L55), Source-header med spoke-H2-datum 2026-05-27 + hub-H2 datum 2026-05-28 (avsiktlig asymmetri per Session 7-precedensen). Spoke L55 + "Senaste lyft"-markör uppdaterad → hub-sha `3c611bd`. Spoke `.githooks/pre-commit` auto-bumpade `tasks/lessons.md` `updated: 2026-05-27 → 2026-05-28` — första icke-idempotenta hook-körningen i hela trailen (dag-rollover-triggad), empirisk bekräftelse att ADR-030-hooken faktiskt fyrar korrekt, inte bara står grön. CI grön på enforcement-ytan (runs 26559550509 + 26567611880); K0b:s grindar oregredderade. Sessionsdok finaliserad ✅ KLAR; non-governing per `.frontmatter-policy.conf` → manuell `updated:`-bump (verifierat empiriskt, hooken orörd). **Transparent stale-fält:** `installed_plugins.json.gitCommitSha` stannade på `e8aadf06` trots att `1.1.1/` materialiserades från `a2bd96b` — andra empiriska datapunkten på K7.4/L41–L42-fenomenet att CC:s plugin-state-fält är opålitliga; funktionellt irrelevant (CC läser från `installPath`); loggad i K8.5/L55.

**Uppskjutet (egen framtida commit, ej Session 8-scope):** CI-wiring av `test-check-frontmatter.sh` + `test-check-public-checklists.sh` — lesson→grind-todo per L52/K8.2 (öppen i `tasks/todo.md` § "Session 8 K0b — lesson→grind-uppföljning"); pre-existing inkonsistens K0a avtäckte. Plus Session 9-backlog-punkt: omdefiniera session-end-skillens roll (autonom motor vs verifierings-checklista) — kandidat-ADR, fångad efter K0c efterhands-verifiering.

---

## Session 9 — Roll-arkitektur + ADR-041 do-confirm-reframe + fetch-depth-invariant 100→250 (DEL 1 + DEL 2 + DEL 2.5 + DEL 3 + DEL 4 + DEL 3.5a + DEL 5, 2026-05-29)

Process-tung session med fyra parallella tematiska tyngdpunkter — startade som prepfas inför Fas 2.5 men kristalliserades till fundament-arbete för roll-arkitektur Chat/Code/Marcus. Full trail i `tasks/sessions/2026-05-29-session-9.md`.

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
- [`gap-analysis.md`](logs/gap-analysis.md) — gap-analys som motiverade `[GA]`-tilläggen
- [`../tasks/lessons.md`](../tasks/lessons.md) — universella lärdomar
- [`../tasks/todo.md`](../tasks/todo.md) — aktuell todo-status
