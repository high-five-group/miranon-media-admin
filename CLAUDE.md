# CLAUDE.md — Miranon Media Admin (React)
*Senast uppdaterad: 2026-05-06 | v0.4 — Session 3 (Pre-Fas-2-verifiering): repo-strukturell polish + publika professionalitetssignaler. Fas 2 — Routing + Auth — startar nästa session mot `docs/byggplan.md`.*

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

> Snapshot post-Session 4 K0 (2026-05-11). Pedagogisk översikt — för exakt nuvarande state, kör `tree -L 3 -I 'node_modules|dist|.git|coverage|test-results'`.

### Repo-rot

```
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
└── .github/                       ← CI + dependabot + templates (ADR-024)
    ├── workflows/ci.yml           ← biome + tsc + test:api + build på PR/push
    ├── dependabot.yml             ← npm veckovis + github-actions månadsvis
    ├── CODEOWNERS
    ├── PULL_REQUEST_TEMPLATE.md   ← DoD-checklista
    └── ISSUE_TEMPLATE/{bug,feature}.md
```

### docs/

```
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
├── decisions/                     ← 25 ADR:er (ADR-001..025)
│   ├── README.md                  ← ADR-katalog/index
│   └── ADR-{001..025}-*.md
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

```
tasks/
├── todo.md                        ← aktuell todo-status
├── lessons.md                     ← projekt-lessons (UNIVERSAL-poster lyfts till hub)
├── byggplan-direktiv.md           ← arkivvärt (SLUTFÖRT 2026-05-05)
├── datamodell-research-direktiv.md, datamodell-research-plan.md  ← frysta efter Fas 6
└── sessions/
    ├── <aktiv>.md                 ← en sessionsdok åt gången (just nu: 2026-05-11-fas2-routing-auth.md)
    └── archive/                   ← arkiverade per ADR-023
        ├── 2026-04/   (2 sessionsloggar)
        ├── 2026-05/   (7 sessionsloggar inkl. P3a, P3b, pre-Fas-2)
        └── datamodell-research-2026-04-30/   (7 frysta fas-prompts + README)
```

### src/, supabase/, tests/, övrigt

```
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
   - Trail: [`tasks/sessions/2026-05-11-fas2-routing-auth.md`](tasks/sessions/2026-05-11-fas2-routing-auth.md)

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

---

## Status

**Sessions klara:**

- **Session 1** (React, 2026-04-13/14): Fas 0 + Fas 1 — projektsetup, domäntransplant, ADR-001..010
- **Session 2** (React, 2026-04-30 → 2026-05-05): Fas A (säkerhetshardening M1–M8, 14 commits, 113 tester) + P0–P3b (byggplan-revision, `docs/byggplan.md` 832 rader, ADR-011..020, 7 UNIVERSAL-lessons lyfta till hub)
- **Session 3** (Pre-Fas-2, 2026-05-06): Repo-strukturell polish + publika professionalitetssignaler. K3 åa–åf: LICENSE + package.json metadata + .github/-paketet + CHANGELOG/SECURITY/CONTRIBUTING + README badges/Documentation map + docs/-omstrukturering (specs/analysis/reference/logs) + analys/ → docs/research/datamodell-research/ + tasks/sessions/-arkivering. ADR-021..024. **Total ADR-räkning: 24.**
- **Session 4** (Fas 2 K0 startvillkor, 2026-05-11): K0 startvillkor 1-3 av 3 klara — nuqs install (`13cdf86`), typecheck:tests + APIResponse-fix (`a5a477b` + `1d02b3b`), falsk-grön CI-fix via STAGING_REQUIRED + secrets (`3015d08` + `1138e38`). Plus 4 K1.N early bake-ins av sessionsdoket (`6af3927` + `fc6f43e` + `3b29f41` + `3927a24`). CI grön på första försök efter K0åc.2 (36s, 72 pure passed + 38 staging passed + 3 M4-defer skipped). 12 UNIVERSAL-lessons lyfta till lessons.md + hub (`f1e609e` + `91db29b`). **Total ADR-räkning: 24 (oförändrad — ingen ADR-trigger från K0; Fas 2 K0åe Zod parse kan ge ADR-026 om/när den körs).** Sessionsdok-trail: `tasks/sessions/2026-05-11-fas2-routing-auth.md`. PÅGÅR — Fas 2 K0 FULLSTÄNDIGT KLAR (alla 6 åtgärder). K2-K4 implementation följer i Session 5.

**Aktuellt fokus:** Fas 2 — Routing + Auth (TanStack Router file-based, Supabase auth, nuqs). **K0 FULLSTÄNDIGT KLAR 2026-05-11** (Session 4): 3 startvillkor (`13cdf86`/`a5a477b`+`1d02b3b`/`3015d08`+`1138e38`) + 3 "Direkt efter Fas 2"-fynd (K0åd `f2a2d9a`, K0åe.1+K0åe.2 `8095a62`+`497a89f`, K0åf `a7bdaea`). 2 nya ADR:er introducerade: ADR-026 (Runtime-validering vid datagräns med Zod .parse()) + ADR-027 (KVALITETSDEFINITIONER-11.md stack-skifte Vue→React). **Session 5 startar med Fas 2 K2** — TanStack Router file-based + AuthProvider + ErrorBoundary + Suspense per `docs/byggplan.md` §4 Fas 2-prompt. Sessionsdoket `tasks/sessions/2026-05-11-fas2-routing-auth.md` är aktivt över Session 4 + Session 5 (samma Fas 2) — arkiveras vid Fas 2-avslut.

För full retrospektiv historik: [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md).

> **Sessionsnumrering:** React-projektet startar på Session 1.
> Session 1 (React) motsvarar Session 31 i den samlade projekthistoriken
> (Vue-bygget var session 1–30 i `~/Repon/miranon-media-os/`).
> Session 2 = Session 32–34. Session 3 (Pre-Fas-2) = Session 35. Session 4 (Fas 2 K0 startvillkor) = Session 36.
