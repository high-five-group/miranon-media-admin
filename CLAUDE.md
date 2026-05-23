---
owner: marcus803
updated: 2026-05-23
review_by: 2026-11-15
status: stable
---

# CLAUDE.md — Miranon Media Admin (React)

*v0.5 — Session 6.6 (2026-05-14): docs-grindvakter + frontmatter-policy (mellan Fas 2 och Fas 2.5). Fas 2 — Routing + Auth — ✅ KLAR Sessions 4+5+5b. Nästa session: Fas 2.5 schema-kontrakt-sync mot `docs/byggplan.md`.*

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

> **Sedan Pre-Fas-2 (ADR-021, 2026-05-06):** Spec-filerna finns lokalt i [`docs/specs/`](docs/specs/), research i [`docs/research/`](docs/research/) (inkl. `datamodell-research/`), externa analyser i [`docs/analysis/`](docs/analysis/), referens i [`docs/reference/`](docs/reference/), historiska arbetsmaterial i [`docs/logs/`](docs/logs/), arkiv i [`docs/archive/`](docs/archive/). Vue-repots `docs/react-migration/` är ursprungs-källa men frusen referens.

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
- **Web-research före strategi- och arkitektur-beslut:** före Vale-config-strategi, ADR-design, tool-version-bump, dependency-rekommendation eller branschstandard-claim — gör web-research och citera källan. Speglar hub-CLAUDE.md "Ristat i sten".
- **Kontinuitet-arkitektur:** filartefakter (CLAUDE.md, lessons.md, sessionsdok, ADR:er) är enda sanningskällan — Chat-trail försvinner vid sessions-byte. Allt nytt (lessons, designval, insikter) bakas in i fil INNAN sessions-byte. Speglar hub-CLAUDE.md "Ristat i sten".

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
| Lint/format | Biome 2.4 (ersätter ESLint + Stylelint + Prettier — `npm run format` använder Biome) |
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

> Snapshot post-Session 5 K2-K4 (2026-05-12). Pedagogisk översikt — för exakt nuvarande state, kör `tree -L 3 -I 'node_modules|dist|.git|coverage|test-results|playwright/.auth'`.
>
> **Session 5 nya filer (K2-K4 + K3.5):** Se "src/-struktur post-Fas-2" + "Tests-struktur post-K4"-sektioner nedan.

### Repo-rot

```text
miranon-media-admin/
├── CLAUDE.md                      ← projekt-konstitution (läs först)
├── README.md                      ← entry-point med badges + Documentation map
├── CHANGELOG.md                   ← Keep-a-Changelog 1.1.0 (ADR-024)
├── SECURITY.md                    ← säkerhetspolicy (privat-rapportering)
├── CONTRIBUTING.md                ← aktör-rollfördelning + sessions-disciplin
├── LICENSE                        ← UNLICENSED (proprietary)
├── package.json, package-lock.json
├── biome.json                     ← lint + format (ersätter ESLint/Stylelint/Prettier)
├── vite.config.ts, playwright.config.ts
├── tsconfig*.json
├── index.html
├── .editorconfig, .nvmrc, .gitignore
├── .vscode/extensions.json        ← rekommenderade VS Code-extensions
├── .lycheeignore                  ← Lychee link-checker exclude-patterns (ADR-029, Session 6 K1.D Commit 3)
└── .github/                       ← CI + dependabot + templates (ADR-024)
    ├── workflows/ci.yml           ← biome + tsc + test:api + build på PR/push
    ├── dependabot.yml             ← npm veckovis + github-actions månadsvis
    ├── CODEOWNERS
    ├── PULL_REQUEST_TEMPLATE.md   ← DoD-checklista
    └── ISSUE_TEMPLATE/{bug,feature}.md
```

### docs/

```text
docs/
├── README.md                      ← navigeringspekare för docs/
├── byggplan.md                    ← STYRANDE plan för Fas 2 → Fas 8 (832 rader, 13 fas-prompter)
├── BUILD-LOG.md                   ← kronologisk sessions-journal
├── DOKUMENTATIONSSTANDARD.md
│
├── specs/                         ← 14 styrande specs (ADR-021)
│   ├── DESIGN-MANIFESTO.md, DESIGN-OPERATING-SYSTEM.md, DESIGN-SYSTEM-SPEC.md
│   ├── SECURITY-SPEC.md, STATE-STRATEGY.md, URL-STATE-SPEC.md
│   ├── ARIA-UPGRADE.md, ACCESSIBILITY-CHECKLIST.md, ACCESSIBILITY-AUDIT-MALL.md
│   ├── FUTURE-COMPAT.md, PERFORMANCE-BUDGET.md, KVALITETSDEFINITIONER-11-REACT.md
│   ├── SPA-ARCHITECTURE-DECISION.md
│   └── BYGGPLAN-LÄTTLÄST-v3.md
│
├── analysis/                      ← extern analys (ADR-021)
│   ├── Codex-project-analysis-after-fas-1.md
│   └── Code-verification-of-codex-analysis.md
│
├── reference/                     ← datamodell + system-beskrivning (ADR-021)
│   ├── data-model.md
│   └── hur-systemet-funkar.md
│
├── logs/                          ← historiska arbetsmaterial (ADR-021)
│   ├── gap-analysis.md
│   └── byggplan-revision-inventory.md
│
├── research/                      ← Fas 0-research + datamodell-research (ADR-022)
│   ├── beyond-best-practices-2026.md
│   ├── react-headless-ui-research.md
│   ├── react-stack-research.md
│   ├── vue-project-analysis.md
│   └── datamodell-research/       ← 10 frysta leveransfiler (00-file-manifest..08-odoo-validation)
│
├── decisions/                     ← 29 ADR:er (ADR-001..029)
│   ├── README.md                  ← ADR-katalog/index
│   └── ADR-{001..029}-*.md
│
├── features/
│   └── FEATURE-ACTIVITY-LOG.md
│
└── archive/                       ← superceded artefakter
    ├── conversion-plan-2026-04-14.md       ← arkiverad i P3b (ADR-012)
    ├── BYGGPLAN-LÄTTLÄST-v1-2026-04-13.md  ← arkiverad i Pre-Fas-2 (ADR-021)
    └── BYGGPLAN-LÄTTLÄST-v2-2026-04-13.md  ← arkiverad 2026-05-09 (ADR-025)
```

### tasks/

```text
tasks/
├── todo.md                        ← aktuell todo-status
├── lessons.md                     ← projekt-lessons (UNIVERSAL-poster lyfts till hub)
├── byggplan-direktiv.md           ← arkivvärt (SLUTFÖRT 2026-05-05)
├── datamodell-research-direktiv.md, datamodell-research-plan.md  ← frysta efter Fas 6
└── sessions/
    ├── 2026-05-13-ci-optimering.md ← Session 6 AKTIV (arkiveras vid Session 7-start per ADR-023)
    └── archive/                   ← arkiverade per ADR-023
        ├── 2026-04/   (2 sessionsloggar)
        ├── 2026-05/   (7 sessionsloggar inkl. P3a, P3b, pre-Fas-2)
        └── datamodell-research-2026-04-30/   (7 frysta fas-prompts + README)
```

### `src/`, `supabase/`, `tests/`, övrigt

```text
src/
├── data/         ← AirtableAdapter, callEdgeFunction, supabase-client, retry-infra
├── domain/       ← 10 domain-filer (transplanterade från Vue-referens, Fas 1)
├── lib/          ← alert-screen-reader, focus-utils
├── observability/sentry.ts
└── styles/       ← base.css + token-system (3-lager: primitiv → semantisk → komponent)

supabase/
├── config.toml
└── functions/
    ├── _shared/  ← auth, cors, field-allowlists, airtable-filter, errors (Fas A)
    └── {create-admin-user, get-events, get-persons, get-registrations, test-auth, update-record}/

tests/
└── api/          ← 7 testfiler + helpers.ts. Split i pure (airtable-filter.test.ts, 72 tests)
                   och staging (*.staging.test.ts × 6, 41 tests = 38 körbara + 3 M4-defer).
                   Playwright-projekt: api-pure (testIgnore *.staging.test.ts) + api-staging
                   (testMatch *.staging.test.ts, STAGING_REQUIRED=1 i CI för hard-fail).

public/           ← favicon, sw.js, miranon-logo.svg
scripts/          ← verify-phase-1.ts (runtime-verifiering)
```

### Vue-referens (historik)

Det ursprungliga Vue-projektet `~/Repon/miranon-media-os/` är **fryst** och ersätts av detta React-repo. Spec-filerna kopierades därifrån i Fas 0 (2026-04-13) och flyttades till lokala `docs/specs/` i Pre-Fas-2 (ADR-021). Vue-repot är historisk källa, inte aktiv referens.

### src/-struktur post-Fas-2 (Session 5 K2-K4 + K3.5)

```text
src/
├── auth/                             ← NY i K3.2 + K3.5
│   ├── AuthProvider.tsx              ← Full Supabase-integration (K3.2 + K3.5 race-condition-fix)
│   └── useAuth.ts                    ← Defensive null-check (K3.2)
├── data/
│   ├── adapters/                     ← AirtableAdapter, DataSourceAdapter (Fas 1)
│   └── config/supabase-client.ts     ← anon-key-fallback rad 16-22 — K3.4 borttagning i Session 5b
├── domain/                           ← models, types, schemas (Fas 1)
├── lib/                              ← cn, focus-utils, report-web-vitals (Fas 0)
├── observability/sentry.ts           ← initSentry FÖRE createRoot (M7)
├── routes/                           ← NY i K2.2 (TanStack Router file-based)
│   ├── __root.tsx                    ← Sentry.ErrorBoundary + Suspense + NuqsAdapter + Devtools (K2.2 + K4.1)
│   ├── _authenticated.tsx            ← Full beforeLoad-guard tre-tillstånds-hantering (K3.3)
│   ├── _authenticated/
│   │   ├── hem.tsx                   ← Placeholder <h1>Hem</h1> (K2.2)
│   │   └── test-nuqs.tsx             ← Dev-only nuqs-verifiering (K4.1, tas bort Fas 6)
│   ├── index.tsx                     ← Pure redirect-stub utloggad→/login, inloggad→/hem (K3.3)
│   └── login.tsx                     ← Zod validateSearch + a11y full 11 (K3.3)
├── styles/                           ← tokens/, base.css, tailwind.css (Fas 0)
├── env.ts                            ← @t3-oss/env-core (Fas 0)
├── main.tsx                          ← InnerApp-pattern + React 19 createRoot Sentry-hooks (K2.3 + K3.2 + K3.5)
├── router.ts                         ← NY i K3.1 — router + queryClient singletons
└── routeTree.gen.ts                  ← Auto-genererad via `tsr generate`, .gitignored (K2.2)
```

### Tests-struktur post-K4

```text
tests/
├── api/                              ← Fas 0/K0åc API/HTTP-tester (7 filer)
├── visual/                           ← Fas 3+ screenshot-regression (referenced i playwright.config)
└── e2e/                              ← NY i K4 (e2e auth-flow)
    ├── auth.setup.ts                 ← storageState-fixture för chromium-authenticated (K4.2)
    └── auth-flow.staging.test.ts     ← 6-tests K3-arkitektur-regression-suite (K4.3)
```

### Repo-rot post-Fas-2 (nya filer)

- `audit-ci.jsonc`                    ← allowlist GHSA-rmmr-r34h-pfm5 (K2.1 + K0åg + ADR-028)
- `tsr.config.json`                   ← TanStack Router defaults explicit (K2.2)
- `playwright/.auth/`                 ← storageState-cache, gitignored utom .gitkeep + README.md (K4.2)

**5 paket exakt-pinnade** (post-K0åg supply chain-disciplin per ADR-028):

- `@tanstack/react-router: 1.168.19`
- `@tanstack/router-plugin: 1.167.20`
- `@tanstack/react-router-devtools: 1.166.13`
- `@tanstack/router-cli: 1.166.43`
- `overrides: { "@tanstack/history": "1.161.6" }`

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

Fullständig spec: [`docs/specs/DESIGN-SYSTEM-SPEC.md`](docs/specs/DESIGN-SYSTEM-SPEC.md) (lokalt sedan ADR-021, ursprungligen i Vue-referensens `docs/react-migration/`).

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

*Klara faser:*

1. ✅ Fas 0 — Projektsetup + tokens (Session 1, 2026-04-13/14)
2. ✅ Fas 1 — Domäntransplant — 13 filer + Zod + fetchWithRetry (Session 1)
3. ✅ Fas A — Säkerhetshardening M1–M8 (Session 2, 2026-05-04)
4. ✅ P0–P3b — Byggplan-revision (Session 2, 2026-05-04/05) — `docs/byggplan.md` 832 rader, 13 fas-prompter, ADR-011..020
5. ✅ Pre-Fas-2 — Repo-strukturell polish + publika professionalitetssignaler (Session 3, 2026-05-06) — ADR-021..024

*Aktuellt fokus:*
6. ⏳ **PÅGÅR — Fas 2 — Routing + Auth (TanStack Router, Supabase, nuqs):**

- ✅ K0 startvillkor 1-3 (Session 4, 2026-05-11) — nuqs + typecheck:tests + falsk-grön CI-fix
- ← **NÄSTA:** K0åd-K0åf (Codex' "Direkt efter Fas 2"-fynd) eller K2 (TanStack Router skelett)
- Trail: [`tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`](tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md)

*Kommande:*
7. Fas 2.5 — Adapter-debt-städning
8. Fas 3 — UI-primitiver (React Aria + CVA + ARIA 1.3)
9. Fas 3.5 — Test-infra + mönsterbibliotek (egen fas per ADR-020)
10. Fas 5 — App-shell + tab bar + service worker
11. Fas 5.5 — Vertikal slice (write-flow)
12. Fas 6 (a–e) — Hem + Event + Personer + Mer
13. Fas 6.5 — Aktivitetslogg (xAPI)
14. Fas 7 — Konsolidering (CSP, chaos testing, deploy)
15. Fas 8 (defer) — Passkeys, push, offline
16. Fas B (parallell) — Airtable hardening
17. Fas E (defer) — Supabase target-migration

---

## Kvalitetsribba

| Typ | Tillgänglighet | Teknik | Återanvändbarhet |
|---|---|---|---|
| **Bibliotek** (komponenter, hooks) | **11** | **11** | **11** |
| **Vyer** (produktspecifika) | **11** | **10** | **10** |

Tillgänglighet är alltid 11 — inga undantag. Bibliotekskod ska bära flera produkter.

Fullständiga checklistor: [`docs/specs/KVALITETSDEFINITIONER-11-REACT.md`](docs/specs/KVALITETSDEFINITIONER-11-REACT.md) (lokalt sedan ADR-021; React-versionen ersätter Vue-eran per ADR-027 stack-skifte 2026-05-11).

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

### Sessionsstart audit-disciplin (K0åg → [ADR-028](docs/decisions/ADR-028-supply-chain-incident-respons.md) → K0åh resolution 2026-05-13)

Vid varje sessionsstart, kontrollera audit-status mot känd-acceptat tillstånd:

- Kör `npx audit-ci --config audit-ci.jsonc` — ska vara grön. Post-K0åh (2026-05-13): allowlist är tom (`"allowlist": []`).
- Om CI eller lokal `npm audit` rapporterar critical → STOPPA-OCH-FRÅGA per Kandidat 2 ([`tasks/lessons.md`](tasks/lessons.md)). Sannolikt ny supply chain-incident; följ ADR-028 5-stegs Konvention-flöde.
- Om `npm view @tanstack/history@latest version` returnerar **annan version än `1.161.6`** → TanStack har bumpat `latest`-dist-tag bortom pre-malware-versionen. Trigga K0åi (pin-luckring + overrides-borttagning per ADR-028 reverse-flow). Se [`tasks/todo.md`](tasks/todo.md) Återkommande disciplin-sektion.

### Actions supply-chain-disciplin (ADR-029)

Vid sessionsstart, för sessioner som rör `.github/workflows/*.yml`:

```bash
# Verifiera SHA-pin oförändrad på third-party Actions
git log -1 --oneline .github/workflows/ci.yml

# Kolla advisory-status (live security-state per K17)
curl -s 'https://api.github.com/advisories?affects=tj-actions/changed-files' | \
  jq '.[] | select(.severity == "critical" or .severity == "high") | {ghsa_id, first_patched_version, published_at}'

curl -s 'https://api.github.com/advisories?affects=lycheeverse/lychee-action' | \
  jq '.[] | select(.severity == "critical" or .severity == "high") | {ghsa_id, first_patched_version, published_at}'
```

Veckovis granskning per [`tasks/todo.md`](tasks/todo.md). Vid critical/high-träff: applicera **K18-disciplin** — analysera `first_patched_version` mot vald version FÖRE klassning som blockerande. Om vald version är post-patched: historisk advisory, inte aktiv risk. Om aktiv risk: STOPPA och kör Actions-anpassad ADR-028 5-stegs Konvention-flöde (SHA-pin pre-incident + uppgradering vid resolution).

### Pre-commit Biome-disciplin (Kandidat 25 + 31 — K2.2/K2.3 + K3.2 bekräftade)

Innan varje `git add` för commits som introducerar nya filer eller nya imports:

```bash
npx @biomejs/biome check --write .
```

**INTE** bara `npx @biomejs/biome format --write .` — `format` täcker bara formatter-actions. `check --write` täcker även `organizeImports` + safe assist + safe linter-fixes som CI använder.

Lokal `biome format` exit=0 är INTE garanti för CI-grön. Två CI-fails på samma orsak i K2.2 + K2.3 bekräftade mönstret. Kandidat 25 i [`tasks/lessons.md`](tasks/lessons.md).

**Kandidat 31 tillägg (post-K3.2):** Strict-mode-regler (noNonNullAssertion, useExhaustiveDependencies m.fl.) kräver också explicit errors-räkning:

```bash
npx @biomejs/biome check . 2>&1 | grep -E "^Found .* error" || echo "0 errors"
```

Om träff > 0 fixa innan commit. Lokal `biome check` exit=0 är INTE garanti för CI-grön på alla strict-mode-regler — K3.2 trigrade `noNonNullAssertion` + `useExhaustiveDependencies` lokalt exit=0 → CI exit=1. Bekräftat empiriskt: efter aktivering har K3.1, K3.3, K4.1, K4.2, K4.3 alla varit CI-grön första försöket.

Verifiera efter:

```bash
npx @biomejs/biome check .
```

Förvänta: 4 baseline-warnings (reduced-motion `!important` i `src/styles/base.css`) + 1 info (eller motsvarande projekt-baseline). Inga errors.

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
7. Uppdatera `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` om sessionen har implications för icke-tekniska läsare (Roger/Lotta) — t.ex. ny avslutad fas, scope-ändring, eller statusbyte. Bumpa "Senast uppdaterad"-datumet i headern + status-raden. v3 är levande dokument per ADR-025 — det driver ifrån `docs/byggplan.md` annars.
8. Uppdatera `tasks/todo.md`
9. Uppdatera ## Filstruktur i CLAUDE.md
10. Committa och pusha
11. **Vid fas-avslut endast:** Uppdatera `docs/byggplan.md` §2 fas-tabell + Versionshistorik-rad. Markera fasen ✅ KLAR + datum. Uppdatera estimat-summa om fas levererad tidigare/senare än estimerat. Detta är styrande sanningskälla — drift mot byggplan.md är 11/10-disciplin-brott (per Kandidat 12).
12. **Vid fas-avslut endast:** Uppdatera `README.md` Status-rad + Projektstatus-sektion + ev. ADR-räkning + Scripts-tabell om nya scripts tillkommit. Och `CHANGELOG.md` — ny release `[X.Y.0]` med Keep-a-Changelog-kategorier (Added/Changed/Security/Fixed) + compare-länkar. README + CHANGELOG är publika dokument — drift här syns externt.
13. **Vid fas-avslut endast:** Sessionsdok-arkivering via `git mv` till `tasks/sessions/archive/<år>-<månad>/` per ADR-023. Trail-link-uppdateringar atomiskt i samma commit per Kandidat 1 (klassificera refs: identitet → mekanisk prefix-fix; roll → semantisk omformulering; frusen zon → orörd).
14. **Vid UNIVERSAL-lyft i sessionen:** Hub-sync till `~/Repon/marcus-system/tasks/lessons.md` med H2 `## YYYY-MM-DD — <beskrivning> (miranon-media-admin)` + Källa-projekt/Sub-klungor/Commit-trail/Antal poster header-block. Inom 7 dagar är fortfarande OK för icke-akuta, men gör det samma session om K1 förenklar eftersom commit-trail är färsk.
15. **Vid fas-avslut endast:** Kör `## Fas-avsluts-verifierings-rutin` (sektion nedan) — cross-doc grep-check att alla 5 styrande + 3 publika dokument säger samma sak.

**Checklista:**

- [ ] Stämmer alla statusmarkeringar med verkligheten?
- [ ] `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` uppdaterad om sessionen har implications för icke-tekniska läsare (ny fas klar, scope-ändring, statusbyte)?
- [ ] Finns beslut som bara lever i chatten men inte i dokumenten?
- [ ] Har varje arkitekturbeslut en ADR?
- [ ] Är BUILD-LOG uppdaterad med faktisk output (inte bara "passerade")?
- [ ] Är "Definition of Done" explicit markerad i BUILD-LOG?
- [ ] Är "Status och nästa steg" uppdaterad?
- [ ] Uppdatera ## Filstruktur i CLAUDE.md
- [ ] Påminn Marcus: klicka "Update" i Claude Chat-projektet (claude.ai)
- [ ] **Vid fas-avslut:** `docs/byggplan.md` §2 fas-tabell + Versionshistorik uppdaterade?
- [ ] **Vid fas-avslut:** `README.md` Status-rad + Projektstatus + Scripts-tabell + ADR-räkning konsekvent med faktiskt repo-state?
- [ ] **Vid fas-avslut:** `CHANGELOG.md` ny release med Keep-a-Changelog-kategorier + compare-länkar?
- [ ] **Vid UNIVERSAL-lyft:** Hub-sync till `~/Repon/marcus-system/tasks/lessons.md` gjord eller schemalagd (≤7 dagar)?
- [ ] **Vid fas-avslut:** Sessionsdok arkiverad till `tasks/sessions/archive/<år>-<månad>/` via `git mv` + trail-link-uppdateringar atomiskt per Kandidat 1?
- [ ] **Vid fas-avslut:** Fas-avsluts-verifierings-rutin körd? Alla cross-doc-greps gröna?

---

## P3a-pattern — sessionsdok-disciplin

### P3a-utvidgning: Per-K-statusrad i sessionsdoket (Session 6 retrospektiv 2026-05-14)

P3a-mönstret ("Chat producerar dokument, Code committar; mellan-K rör inte
sessionsdoket") gäller fortfarande för full retrospektiv-bake-in. Men för att
ge Marcus visibility under sessionens gång (vs gamla flödet där Chat ägde
sessionsdoket löpande) etableras **per-K-statusrad-disciplin**:

Vid varje K-fas-avslut (efter Marcus' beslut + Code:s RAPPORTERA grön)
rapporterar Code en kort statusrad till sessionsdoket. Inte full bake-in —
bara en rad:

Exempel-format:

```markdown
### K1.A — Inventering ✅ KLAR 2026-05-13 14:32
- Block A.1-A.4 rapporterade ~95s baseline, 12 steg
- K17 baseline: 0 critical/high (post-K0åh)
- Lessons-kandidat: K0åh-mönster (skördas K-sista)
[Full retrospektiv: K-sista bake-in]
```

Statusraden:

- Är max 3-5 bullets (datum + kort outcome + ev. lessons-flag)
- Innehåller ALDRIG full retrospektiv (det är K-sista-territory)
- Innehåller länk-text "[Full retrospektiv: K-sista bake-in]" för signalering
- Committas av Code som del av K-fas-avsluts-flow, INTE som separat commit
  (lägg statusraden i samma commit som K-fas-avsluts-PLANERA/IMPLEMENTERA)

Vid K-sista bake-in: statusraderna utvidgas till full Del 3-8 (K-fas-
kronologisk struktur per K1-skelett). Statusraderna ersätts av full text;
de var navigations-stöd under sessionen.

Detta ger Marcus:

- Realtidsvisibility via `git log --oneline tasks/sessions/<sessionsdok>.md`
- Inga content-duplikationer (statusrad → full bake-in är en utvidgning)
- Bevarad K7-disciplin (mellan-K och K-sista är distinkta semantik-domäner)
- Bevarad P3a-disciplin (Code äger sessionsdoket, ingen Chat-side-state)

Anti-mönster:

- Full retrospektiv-bake-in mellan-K (bryter K7)
- Hoppa över statusrad (förlorar Marcus' visibility)
- Statusrad som separat commit (skapar git-noise; läggs i K-fas-commits)

Etablerad: Session 6 retrospektiv 2026-05-14 efter Marcus' feedback om
visibility-förlust vs gamla Chat-ägd-sessionsdok-flödet.

---

## Fas-avsluts-verifierings-rutin

När en fas (t.ex. Fas 2 → Fas 2.5) avslutats, kör denna cross-doc-grep-check FÖRE Marcus klickar "Update" i Claude.ai-projektet. Stäng all drift mellan styrande och publika dokument innan sessionen anses helt klar.

Per Kandidat 12 (multipla sanningskällor driver) + Kandidat 38 (form-tolerant grep) + Kandidat 39 (case-insensitive default när exakt case inte är meningsfullt) + Kandidat 13 (meta-exklusion av drift-fix-grep).

### Cross-doc-konsekvens (5 styrande + 3 publika dokument)

Byt ut `<N>` mot fas-numret (t.ex. 2 för Fas 2) och `<datum>` mot fas-avslutsdatumet (ISO YYYY-MM-DD).

```bash
# === STYRANDE (5 dokument, generisk grep) ===
# Form-tolerant per K38: KLAR/KOMPLETT/✅ är alla legitima fas-avslut-markörer
# Case-insensitive per K39

rg -ci "fas <N>.*(klar|komplett|✅)|✅.*fas <N>" docs/byggplan.md          # min 1
rg -ci "fas <N>.*(klar|komplett|✅)|✅.*fas <N>" docs/BUILD-LOG.md         # min 1 (BUILD-LOG använder typiskt "KOMPLETT")
rg -ci "fas <N>.*(klar|komplett|✅)|✅.*fas <N>" tasks/todo.md             # min 1
rg -ci "fas <N>.*(klar|komplett|✅)|✅.*fas <N>" docs/specs/BYGGPLAN-LÄTTLÄST-v3.md  # min 1
rg -ci "fas <N>.*(klar|komplett|✅)|✅.*fas <N>" CLAUDE.md                 # min 1 (Status-sektion)

# === PUBLIKA (3 dokument, dokument-specifika checks) ===

# README — generisk grep (har Status-rad + Projektstatus-sektion)
rg -ci "fas <N>.*(klar|komplett|✅)|✅.*fas <N>" README.md                 # min 1

# CHANGELOG — release-rubrik-validering (Keep-a-Changelog-format, INTE generisk "KLAR")
rg -c "^## \[[0-9]+\.[0-9]+\.[0-9]+\] - <datum>" CHANGELOG.md              # exakt 1 (ny release för denna fas)

# decisions/README — ADR-räkning matchar repo + README
ADR_COUNT=$(ls docs/decisions/ADR-*.md | wc -l)
README_COUNT=$(rg -o "[0-9]+ arkitekturbeslut" README.md | head -1 | grep -o "[0-9]\+")
test "$ADR_COUNT" = "$README_COUNT" && echo "✅ ADR-räkning matchar ($ADR_COUNT)" || echo "❌ drift: filer=$ADR_COUNT, README=$README_COUNT"

# === DATUM-KONSEKVENS ===
rg -c "<datum>" docs/byggplan.md docs/BUILD-LOG.md tasks/todo.md docs/specs/BYGGPLAN-LÄTTLÄST-v3.md CLAUDE.md README.md CHANGELOG.md
# totalt min 5 över alla 7 (varje dokument har inte nödvändigtvis exakt datumet, men summan ska vara minst 5)

# === DRIFTSTÄNGNING (inga PÅGÅR/NY scope/Pre-Fas-N-rester i nutid-pekare) ===

# byggplan.md §2 fas-tabell: ingen "NY scope" eller "EJ PÅBÖRJAD" för avslutad fas (utanför versionshistorik-cell)
rg -ci "fas <N>.*(pågår|ej påbörjad|ny scope)" docs/byggplan.md | grep -v "v[0-9]\+\.[0-9]\+"
# förvänta 0 utanför versionshistorik-celler

# README Status-rad: ingen "Pre-Fas-<N>" eller "Fas <N> startar"
rg -ci "pre-fas-<N>|fas <N> startar" README.md
# 0 i Status-raden (kan finnas i klara-faser-listan eller Documentation map — kontextuellt OK)

# === HUB-SYNC (om UNIVERSAL-lyft skördade i sessionen) ===
cd ~/Repon/marcus-system && git log -3 --oneline | grep -i "miranon\|fas <N>\|hub-lyft"
# senaste hub-commit för denna fas (om UNIVERSAL-lyft existerar)

# === SESSIONSDOK ARKIVERAD ===
test -f tasks/sessions/<sessionsdok>.md && echo "❌ ej arkiverad" || echo "✅ arkiverad"
ls tasks/sessions/archive/<år>-<månad>/*.md | grep -c "<sessionsdok>"
# förvänta 1 i archive
```

### Form-tolerans-not (per K38-tillämpning 2026-05-13)

Olika dokument har legitimt olika konventioner för "fas avslutad":

- **byggplan.md, todo.md, v3, CLAUDE.md, README.md** använder typiskt `KLAR` eller `✅`
- **BUILD-LOG.md** använder typiskt `KOMPLETT` (retrospektiv-stil)
- **CHANGELOG.md** använder `## [X.Y.0] - <datum>`-rubrik (Keep-a-Changelog-konvention) — inte explicit "KLAR/KOMPLETT"-fras
- **docs/decisions/README.md** har ingen fas-status-fras alls; verifieras via ADR-räkning matchar README

Att tvinga en gemensam "KLAR"-konvention i alla 7 dokument skulle bryta mot etablerade konventioner (Keep-a-Changelog för CHANGELOG, retrospektiv-stil för BUILD-LOG). Rutinen är därför form-tolerant per dokument-typ.

### Stopp-disciplin

Om någon grep visar ❌-utfall (0 där förväntat min 1, eller min 1 där förväntat 0): STOPPA. Klassificera driften:

- **Verklig drift** → ny commit som stänger driften innan fas-avslut anses klar. K5.9-paketet 2026-05-13 är exempel-mall (3 commits: byggplan + publika + sessionsavsluts-disciplin-fix).
- **Historisk ref i versionshistorik/arkivmaterial** → kontextuellt OK, exkludera via `grep -v` eller acceptera per K13-meta-exklusion.
- **Form-variant** (case, kort/lång) → bredda grep per K38/K39.

### Var rutinen körs

- **Code** kör grep-suiten i RAPPORTERA-block av sista K i fas-avslutande session.
- **Chat** verifierar rapportens utfall mot förväntat och STOPPA-OCH-FRÅGA vid avvikelse.
- **Marcus** klickar "Update" först efter alla ❌ är åtgärdade.

### Historik

Etablerad 2026-05-13 i Session 5b K5.9c efter att K5.9a-driften av byggplan.md upptäcktes och K5.9b-driften av README/CHANGELOG fångades i Marcus-granskning. Tre saknade dokument-uppdateringar i sessionsavsluts-checklistan exponerade systematisk blind fläck. K42-defer-paketet i Session 6+ K0 lessons-sweep dokumenterar den underliggande process-lärdomen. K38b-flaggan (form-tolerans-validering INNAN checklist-commit) skördas i samma sweep.

---

## Status

**Sessions klara:**

- **Session 1** (React, 2026-04-13/14): Fas 0 + Fas 1 — projektsetup, domäntransplant, ADR-001..010
- **Session 2** (React, 2026-04-30 → 2026-05-05): Fas A (säkerhetshardening M1–M8, 14 commits, 113 tester) + P0–P3b (byggplan-revision, `docs/byggplan.md` 832 rader, ADR-011..020, 7 UNIVERSAL-lessons lyfta till hub)
- **Session 3** (Pre-Fas-2, 2026-05-06): Repo-strukturell polish + publika professionalitetssignaler. K3 åa–åf: LICENSE + package.json metadata + `.github/`-paketet + CHANGELOG/SECURITY/CONTRIBUTING + README badges/Documentation map + docs/-omstrukturering (specs/analysis/reference/logs) + analys/ → docs/research/datamodell-research/ + tasks/sessions/-arkivering. ADR-021..024. **Total ADR-räkning: 24.**
- **Session 4** (Fas 2 K0 startvillkor, 2026-05-11): K0 startvillkor 1-3 av 3 klara — nuqs install (`13cdf86`), typecheck:tests + APIResponse-fix (`a5a477b` + `1d02b3b`), falsk-grön CI-fix via STAGING_REQUIRED + secrets (`3015d08` + `1138e38`). Plus 4 K1.N early bake-ins av sessionsdoket (`6af3927` + `fc6f43e` + `3b29f41` + `3927a24`). CI grön på första försök efter K0åc.2 (36s, 72 pure passed + 38 staging passed + 3 M4-defer skipped). 12 UNIVERSAL-lessons lyfta till lessons.md + hub (`f1e609e` + `91db29b`). **Total ADR-räkning: 24 (oförändrad — ingen ADR-trigger från K0; Fas 2 K0åe Zod parse kan ge ADR-026 om/när den körs).** Sessionsdok-trail: `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`. PÅGÅR — Fas 2 K0 FULLSTÄNDIGT KLAR (alla 6 åtgärder). K2-K4 implementation följer i Session 5.
- **Session 5+5b** (Fas 2 KOMPLETT, 2026-05-11 → 2026-05-13): Fas 2 — Routing + Auth komplett. Sessions 5+5b spänner samma sessionsdok (`tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`). **Session 5 (2026-05-11 → 2026-05-12):** K0åg supply chain malware-respons (GHSA-rmmr-r34h-pfm5, ADR-028) + K2 TanStack Router skelett + audit-ci-disciplin + K3 AuthProvider + login/logout + skyddade routes + K3.5 race-condition-fix + K4 nuqs + Playwright auth-fixture + K4.3 6-tests arkitektur-regression-suite. ADR-026, ADR-027, ADR-028 nya. 13 UNIVERSAL-lessons skördade (K24-K36). **Session 5b (2026-05-13):** K3.4 anon-key-fallback-borttagning + AuthError contract (defense-in-depth skikt 2). K5 final: sessionsdok bake-ins (K5.4 + K5.5a), lessons-skörd K0åg-defer + Session 5b-kandidater (K5.5b: K17-K19 + K37 + K38), BUILD-LOG + todo.md Fas 2-stängning (K5.6a/b), hub-lyft 7 UNIVERSAL till marcus-system (K5.7), sessionsdok-arkivering + trail-link-uppdateringar (K5.8). 5 nya UNIVERSAL-lessons skördade. **Totalt över Fas 2:** 3 nya ADR:er (totalt 27), 18 nya UNIVERSAL-lessons lokalt, 7 hub-lyft till marcus-system. Defense-in-depth tre-skikt-arkitektur empiriskt verifierad via 6-tests Playwright-suite. K39 (case-sensitivity grep-form) flaggad för Session 6+ K0 lessons-sweep.
- **Session 6** (CI-optimering mellan Fas 2 och Fas 2.5, 2026-05-13 → 2026-05-14): Strategi E (Vite-mönstret med changed-files + needs-skip + aggregator) etablerad som kanonisk CI-arkitektur per ADR-029. ci.yml restrukturerad från 12-stegs verify-jobb (1 jobb) till 5 jobs (changed → lint → test → docs → ci-passed). **Empirisk verifikation:** doc-only-commits ~34s vs ~95s baseline = **~64 % besparing**. Kod-commits ~96s matchar baseline. lychee broken-link-detection etablerad som NY kvalitetscheck (0 errors empiriskt verifierad post-K1.D Commit 4c run 25848500304). K0åh allowlist-rensning som biprodukt (GHSA-rmmr-r34h-pfm5 advisory snärjt 2026-05-12 → 0 critical). ADR-028 utvidgad med Resolution-section + K0åi-trigger; ADR-029 ny (Third-party Actions-policy paradigm-spanning). K17/K18 paradigm-spanning bekräftat (npm + Actions + cache). **17 UNIVERSAL-lessons lokalt** (största enskilda session-skörd; K1.1-K1.17 + retroaktiva K1.18-K1.19). **10 hub-lyfta** till marcus-system. 5 K11-fångster i samma session (meta-disciplin synliggjord). **Totalt över Session 6:** 2 nya ADR:er (totalt 29 inkl. ADR-029), ADR-028 uppdaterad, 19 nya UNIVERSAL-lessons lokalt (17 K-sista + 2 retroaktiva), 10 hub-lyft. **Defer:** Session 6.5 — Broken-links-batch-städning av ~71 errors (kategori A+B per ADR-029 § Baseline-fynd), trigger: K0-mini-klunga FÖRE Fas 2.5 i Session 7.
- **Session 6.5** (Broken-links-batch + recovery, 2026-05-14): 54 broken refs eliminerade (6 A.1 + 23 A.4 + 1 A.3 + 24 B.1+B.2) + 1 disciplin-utvidgning (ADR-022 kategori 4 "Frusen extern leverans" för A.2-skuld). 8 commits (6 fix + 1 revert + 1 disciplin). K3 v1 broken (path-matematik `../` istället för `../../`) reverted via `8bbb8c1`; re-implementerat i K3 v2 (`e49d7b0`) med empirisk dry-resolv-disciplin INNAN pattern-applicering. **15 UNIVERSAL-lessons skördade** (13 [UNIVERSAL] för hub-lyft + 2 lokala) — majoritet mönsterförstärkningar av K10/K11/K15/K16/K38/K1.16/K1.19. Empirisk fångst: K3 v1-revert var lessons-rikast del av sessionen ("försök som behövde reverteras" producerade K2.4-K2.8). `.lycheeignore` 55 → 35 rader, 6 → 0 DEFERRED-FIX-MARKER. **Totalt över Session 6.5:** 1 disciplin-utvidgning (ADR-022 kategori 4), 15 UNIVERSAL-lessons lokalt, hub-sync schemalagd i K-sista.3. Sessionsdok-trail: `tasks/sessions/archive/2026-05/2026-05-14-broken-links-cleanup.md` (arkiverad). **Defer:** Session 7 K0 — Fas 2 11/10-verification (7 gap-punkter committed i pre-K1 per K7 som received-defer; se `docs/analysis/Fas-2-11-10-verification-2026-05-14.md`).
- **Session 6.6** (Docs-grindvakter + frontmatter-policy + observations-pass, 2026-05-14 → 2026-05-15): 5 CI-grindvakter etablerade (yamllint + markdownlint-cli2 + scripted-checklist-check + Vale + frontmatter-validator). Frontmatter-policy 4 fält på 9 styrande docs + pre-commit auto-bump + 5-check CI-validator. ADR-030 Accepted. K7.5 retroaktiv config-driven-refactor + SC2034 klass-fix polish. **15 UNIVERSAL-lessons** skördade. 2 defer-paket vid avslut (6.6.6 + 6.6.7; 6.6.5 ✅ KLAR 2026-05-16). **Total ADR-räkning: 30.** Sessionsdok-trail: `tasks/sessions/archive/2026-05/2026-05-14-session-6-6.md`.
- **Session 6.6.5** (Dependabot-strategi 2026, 2026-05-16): Pre-existing skuld från Session 6.6 K2.5 (5 öppna Dependabot-PR:er failande på staging-secrets) deferad och stängd i egen mini-session. ADR-031 (4-lager-strategi: grouping + cooldown 7d/3d + minimal CI-yta Alt D Hybrid + manuell review). Web-research mot 2026-supply-chain-läget (Axios mars, CanisterWorm, BoostSecurity Deputy Confusion TTPs). **14 UNIVERSAL-lessons** (L1-L14) skördade. Hub-sync 8 konsoliderade rader till marcus-system. Pre-existing L8 latent shallow-clone-bug fixad via K2.1 fetch-depth: 50-retrofit (commit `a67908d`). **Total ADR-räkning: 31.** Sessionsdok-trail: `tasks/sessions/archive/2026-05/2026-05-14-session-6-6-5.md`.
- **Session 6.6.7** (Shellcheck-strict-grindvakt + shallow-clone-detection, 2026-05-16): shellcheck-strict CI-grindvakt etablerad mot `scripts/*.sh` + `.githooks/*` + 2 sourced configs (`--severity=style --enable=all`, 0/0/0/0 strict). v0.11.0 SHA-pinnad install (downstream-beräknad checksum per koalaman utan officiell .sha256sum-fil). 366 baseline-fynd auto-fix:ade (363) + manuella (4 design-beslut + 1 SC2292 cross-syntax). ADR-033 (shellcheck-strict-grindvakt + shallow-clone-detection defense-in-depth lager 2). K4.1 design-bug (`--is-shallow-repository` false-positive på fetch-depth: 50) hot-fix:ad via K4.1.1 hybrid-check (`is-shallow=true AND count < threshold`). 13/13 test-suite PASS (T1-T9 + T10/T11a/T11b/T12 truth-table-täckning). **12 UNIVERSAL-lessons** (L_A-L_L) skördade. ADR-032 reserverad för Session 6.6.6 Vale-cleanup (L19-mitigation committad). **Total ADR-räkning: 31 (ADR-033 senast etablerad; ADR-032 reserverad för 6.6.6).** Sessionsdok-trail: `tasks/sessions/archive/2026-05/2026-05-16-session-6-6-7.md` (arkiveras K-sista #5).

**Aktuellt fokus:** Session 6.6.6 — Vale-cleanup + L15-L19 bake-in (~7-10h över 52 filer, ADR-032 reserverad) per Strategi β (committed `9e46e48` i [`tasks/todo.md`](tasks/todo.md)). Sedan Session 7 K0 — Fas 2 11/10-verification (7 gap-punkter; se [`docs/analysis/Fas-2-11-10-verification-2026-05-14.md`](docs/analysis/Fas-2-11-10-verification-2026-05-14.md)), sedan Fas 2.5 — Schema-kontrakt-sync. Session 6.6.7 ✅ KLAR 2026-05-16.

För full retrospektiv historik: [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md).

> **Sessionsnumrering:** React-projektet startar på Session 1.
> Session 1 (React) motsvarar Session 31 i den samlade projekthistoriken
> (Vue-bygget var session 1–30 i `~/Repon/miranon-media-os/`).
> Session 2 = Session 32–34. Session 3 (Pre-Fas-2) = Session 35. Session 4 (Fas 2 K0 startvillkor) = Session 36.
