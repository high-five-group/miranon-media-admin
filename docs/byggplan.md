# Byggplan — Miranon Media Admin (React)

> **Status:** AKTIV — ersätter `docs/conversion-plan.md` som styrande fas-för-fas-direktiv för React-bygget.
> **Skapat:** 2026-05-05
> **Version:** 1.0
> **Ägare:** Marcus + Claude Chat (planering) + Claude Code (implementation)
> **Föregångare:** `docs/conversion-plan.md` (arkiveras till `docs/archive/conversion-plan-2026-04-14.md` i P3b)
> **Auktoritativ källa för fas-sekvens:** `tasks/byggplan-direktiv.md` §5 (post-P1)
> **ADR-katalog:** `docs/decisions/` (10 ADR:er listade i §5 — numrering tilldelas av Code mot befintlig katalog vid commit-tillfället; index i `docs/decisions/README.md`)

---

## Innehåll

1. Prolog — Syfte, läsanvisning, dokumentstruktur
2. Fas-tabell (post-P1, 15 rader)
3. Övergripande arkitektur — etablerade mönster post-Fas A
4. Per-fas-prompter
5. ADR-index
6. Versionshistorik

---

## 1. Prolog

### Syfte

`docs/byggplan.md` är den styrande planen för Miranon Media Admin (React). Den ersätter `docs/conversion-plan.md` (arkiverad) och `tasks/byggplan-direktiv.md` (markeras SLUTFÖRT när P3 är klar).

Skillnaden mot conversion-plan: byggplan utgår från **etablerad arkitektur post-Fas A** (operations-baserat API, AuthContext|Response, klient-DSN, structured logging) och **låst datamodell post-Fas E target-research** (06b Supabase-target + 07 migrationsplan + 08 Odoo-validering). Conversion-plan utgick från en pre-research-arkitektur och har därför drift som hade krävt patch-på-patch.

### Läsanvisning

Per fas finns en fas-prompt med åtta sektioner:
- **Mål** — kort syfte (1–2 meningar)
- **Scope** — vad fasen ska bygga
- **Inte scope** — medvetet exkluderat (refererar var det bygges istället)
- **Beroenden** — vilka faser måste vara klara
- **Estimat** — sessioner (1 session ≈ 3–4 timmars Code-tid)
- **Filer som skapas/uppdateras** — diskbild
- **DoD** — Definition of Done (verifieringspunkter)
- **ADR-krav** — om fasen producerar ett arkitekturbeslut

`[GA]`-prefix på en bullet markerar tillägg utöver miniminivå (gold-aktivering — kan defer:as men bör motiveras om så).

### Dokumentstruktur — tre lager

| Lager | Dokument | Roll |
|---|---|---|
| **Strategi** | `tasks/byggplan-direktiv.md` (post-P3 SLUTFÖRT), `IDENTITET.md`, `KVALITETSDEFINITIONER-11.md` | Vad och varför — låsta principer |
| **Plan** | **`docs/byggplan.md`** (detta dokument) | Hur — fas-för-fas, sekvens, beroenden |
| **Implementation** | `docs/decisions/` (ADR), `docs/BUILD-LOG.md`, `tasks/sessions/` | Vad faktiskt skedde — beslut, avvikelser, retrospektiv |

Stödspecs (`SECURITY-SPEC.md`, `STATE-STRATEGY.md`, `ACCESSIBILITY-CHECKLIST.md`, etc.) refereras från detta dokument men ägs separat.

---

## 2. Fas-tabell (post-P1)

15 rader. Sekvens följer §5 i direktivet efter P1-applicering 2026-05-04. Estimat anges per fas; sub-fas-allokering under Fas 6 listas i Fas 6-prompten.

| Fas | Status | Anmärkning | Estimat |
|---|---|---|---|
| **0** | ✅ KLAR | Projektsetup + tokens. Session 1 (React) 2026-04-14, commits `1aa2544` → `e3d8e8a`. | (avslutad) |
| **1** | ✅ KLAR | Domäntransplant (13 filer + Zod + fetchWithRetry). Session 1, commits `e3d8e8a` → `c91bfa0`. Skuld → Fas 2.5. | (avslutad) |
| **A** | ✅ KLAR | Säkerhetshardening M1–M8. Slutförd 2026-05-04, 14 commits, 113 tester. | (avslutad) |
| **2** | NY scope | Routing + Auth (TanStack Router, Supabase, nuqs). | 2 sessioner |
| **2.5** | NY | Schema-kontrakt-sync — `Status.ts` mot `data-model.md`, Zod vid externa datagränser, **adapter-debt klassad (deployar 0 EF — se A5-klassningstabell i P1-sessionsdok Del 3)**, ev. borttagning av död-kod-stubs. | 1 session |
| **3** | NY scope | UI-primitiver (React Aria + CVA + ARIA 1.3). | 2 sessioner |
| **3.5** | NY | **A11y-baseline EGEN FAS** per P2 A1-utfall. Test-infrastruktur (axe + Playwright a11y) + 5 React Aria-mönster. ACCESSIBILITY-CHECKLIST omskriven i P2. | 1 session |
| **5** | NY scope | **Förenklat** — minimal app-shell + tab bar + skip-to-content + route announcer + responsivt 375/768/1024 + `prefers-reduced-motion`/`prefers-contrast:more` + error boundaries app/sektion-nivå + Workbox SW + TanStack offline-config. **View Transitions, Speculation Rules, web-vitals, widget-error-boundary flyttade till Fas 7.** ADR krävs. | 1 session |
| **5.5** | NY | Vertikal write-slice: "markera anmälan som betald" via befintlig `update-record` EF med ny `operationKey`. **Inga nya EF-deploys.** Etablerar TanStack optimistic mutation-mönster + operations-allowlist-utvidgning + 3 Playwright-tester (2 deny, 1 allow). ADR-krav. | 2 sessioner |
| **6** | NY scope | **Strangler-fig-sekvens i fem sub-faser:** 6a Persons (0,75) → 6b Events (0,75) → 6c Registrations + Väntelista (1) → 6d Hem-aggregering (0,5) → 6e Mer villkorlig (0,5). Per-sub-fas: registrera operation i `field-allowlists.ts` + deny/allow-test grönt + vy-Playwright baseline. | 3,5 sessioner |
| **6.5** | EJ ÄNDRAD | Aktivitetslogg (xAPI). `requestId`-mönstret från Fas A M7 ärvs. | 1 session |
| **7** | NY scope | Konsolidering — CSP-plugin (med ADR), web-vitals, Speculation Rules, View Transitions, widget-error-boundary, chaos testing, deploy-pipeline, Background Sync defer-not (se Fas 8 + ADR). | 3 sessioner |
| **8** | NY (framtid) | Background Sync API (offline-mutationskö, defer:ad från Fas 7 — se ADR). Övrigt scope (Passkeys, push) ej låst i denna revision. Estimat fastställs vid aktualisering. Ersätter conversion-plans "Fas 8 — Passkeys, push, offline". | TBD |
| **B** | PARALLELL | Airtable-hardening — parallell-spår med 2 synk-gates mot React-bygget (innan Fas 6c + innan Fas E). Roger/Lotta-arbete. | (parallell, separat estimat) |
| **E** | DEFER | Supabase-migration enligt 07 §A2. Aktualiseras post-Fas 7. Inkluderar Realtime-omläggning per B1. | (defer, separat planering) |

**Numreringsnot:** Det "saknas" en Fas 4 i sekvensen ovan. Conversion-plan hade en Fas 4 (DataTable) som flyttats till Fas 7 efter beslut i Session 0 (förbygges-research). Numreringen behålls för spårbarhet mot conversion-plan och tidiga BUILD-LOG-poster. Se ADR-013 (Fas 4-borttagningen).

**Total estimat (Fas 2 → Fas 7, exkl. klara Fas 0/1/A och defer:ade Fas 8/B/E):** 16,5 sessioner. Beräkning: 2 + 1 + 2 + 1 + 1 + 2 + 3,5 + 1 + 3 = 16,5. En session ≈ 3–4 timmars Code-tid vid normal sessionsfrekvens.

---

## 3. Övergripande arkitektur — etablerade mönster post-Fas A

Dessa mönster är låsta sedan Fas A slutförts 2026-05-04. Alla per-fas-prompter nedan refererar dem och får inte motsäga dem.

### 3.1 Operations-baserat API

Klienten skickar `{operationKey, recordId, fields}` (inte `{tableId, ...}`). Server äger ett operations-register med deny-by-default. Fält-allowlist per operation. Källa: `SECURITY-SPEC.md §6.1`, `STATE-STRATEGY.md §8`.

Konsekvens för per-fas-prompter: varje vy som skriver registrerar sin operation i `field-allowlists.ts` och levererar 1 deny-test + 1 allow-test som DoD-villkor.

### 3.2 Auth-mönster

`AuthContext | Response`-pattern: Edge Functions returnerar antingen verifierad context eller direkt 401-Response. Två-stegs auth-check (token + behörighet). `corsHeadersFor(req)` per request. Källa: Fas A M2 + M3.

### 3.3 Observability

`requestId` på varje request, propagerat genom EF-loggar + klient-toast vid fel. Structured JSON-loggning på server. Klient-DSN för Sentry (beslut taget i Fas A — befintlig ADR i `docs/decisions/`). Källa: Fas A M7.

### 3.4 INVARIANT-mönster

Server-side runtime-assertions för data-shape-kontrakt. `INVARIANT(condition, message)` ger fast-fail vid kontraktsbrott istället för silent corruption. Källa: Fas A M5.

### 3.5 Test-prefix-konvention

Alla test-EF prefix:as med `test-` (hyphen, inte underscore — Supabase CLI-regex `^[A-Za-z][A-Za-z0-9_-]*$`). Test-EFs deployas inte till production. Källa: Fas A M6.

### 3.6 Strangler-fig migrationsväg

Persons → Events → Registrations → Hem-aggregering är primärordning för Fas 6. Samma ordning gäller framtida Fas E (Supabase-migration). Källa: `analys/07-migration-plan.md` §A2.

### 3.7 Operations utan empirisk användning är onödig attack-yta

M4-principen från Fas A: deploya inte EF i förskott. Varje deploy ska följa en namngiven UI-konsument. Konsekvens: Fas 2.5 deployar 0 EF; Fas 6:s sub-faser deployar 9 EF organiskt. Klassning i P1-sessionsdok Del 3 (A5-tabellen).

### 3.8 Källa-vs-implementation-skiktning

`data-model.md` är källa för status-typer. `Status.ts` följer källan, inte tvärtom. Vid stack-byte: target-shape separat från source-shape; adapter-gränsen översätter. Källa: P2 Lessons-post 4.

---

## 4. Per-fas-prompter

### Fas 0 — Projektsetup + tokens (KLAR)

✅ Avslutad i Session 1 (React) 2026-04-14, commits `1aa2544` → `fcc6de3` → `e3d8e8a`.

**Output:** Vite + React 19 + Tailwind v4 (`@theme`-baserad) + Biome 2.4 + 3-lagers tokens (ADR-002, ADR-003) + 20-raders SW-skelett.

**Skuld:** `[GA] vite.config.ts` säkerhetsheaders-plugin med CSP-nonce **uppskjuten till Fas 7** — ADR-011 (CSP-plugin-deferral) skrivs i P3a för spårbarhet.

**Korsreferens:** `docs/BUILD-LOG.md` Fas 0-sektion.

---

### Fas 1 — Domäntransplant (KLAR)

✅ Avslutad i Session 1 (React) 2026-04-14, commits `e3d8e8a` → `c91bfa0`.

**Output:** 13 domänfiler portade från Vue, Zod-scheman, `fetchWithRetry`-utility, AirtableAdapter-skelett.

**Skuld noterad — flyttas till Fas 2.5 (omdefinierar inte "klar" retroaktivt):**
- `src/domain/types/Status.ts` — out-of-sync mot `data-model.md` (Status.ts har 4 värden, data-model 6)
- `AirtableAdapter` — 9 odeployade EF-metoder, varje TODO-markerad
- Zod — finns men används inte som runtime-validering vid alla externa datagränser (per ADR-005, defer till Fas 2/3)

**Korsreferens:** `docs/BUILD-LOG.md` Fas 1-sektion.

---

### Fas A — Säkerhetshardening (KLAR)

✅ Slutförd 2026-05-04, M1–M8 levererade, 14 commits, 113 tester gröna.

**Output:** 8 etablerade arkitekturmönster (se §3 ovan) + uppdaterad `SECURITY-SPEC.md` §6 + `STATE-STRATEGY.md` §8.

**Korsreferens:** `tasks/sessions/2026-05-04-security-hardening.md`, `docs/BUILD-LOG.md` Fas A-sektion (skrivs retrospektivt i P3b).

---

### Fas 2 — Routing + Auth

#### Mål
Etablera fil-baserad routing (TanStack Router) + Supabase-autentisering + URL-state-hantering (nuqs) som grund för alla efterföljande vyer.

#### Scope
- TanStack Router file-based med `src/routes/`-struktur
- `__root.tsx` med AuthProvider + ErrorBoundary + Suspense
- Skyddade routes via `beforeLoad`-guard mot Supabase-session
- Login-vy (publik) + Logout-flöde
- nuqs för URL-state (filter, sökterm, aktiv flik) — initial setup, ej per-vy-implementation
- Devtools för Router + Query (dev-only)

#### Inte scope
- Vy-implementation (Hem, Event, etc.) — Fas 6
- Tab bar / app-shell — Fas 5
- Optimistic mutations — Fas 5.5

#### Beroenden
- Fas 1 (domäntransplant) — Supabase-klient redan etablerad
- Fas A (auth-mönster) — `AuthContext | Response` etablerat på server

#### Estimat
2 sessioner.

#### Filer som skapas/uppdateras
- `src/routes/__root.tsx`
- `src/routes/index.tsx` (login-redirect-stub)
- `src/routes/login.tsx`
- `src/auth/AuthProvider.tsx`
- `src/auth/useAuth.ts`
- `vite.config.ts` (TanStack Router-plugin återinförs — togs bort i Fas 0)
- `tsr.config.json`

#### DoD
1. `npm run dev` ger fungerande login → redirect till `/hem` (placeholder-route)
2. Logout klart — session rensas, redirect till `/login`
3. Skyddad route utan session → automatisk redirect till `/login`
4. nuqs `useQueryState` fungerar mot test-route med `?test=value`
5. Router devtools synliga i dev, inte i prod
6. Playwright auth-fixture (`authenticatedPage`) etablerad
7. `[GA]` Suspense-fallback på root visar laddningsindikator under auth-resolution
8. `[GA]` Error boundary på root fångar router-fel och visar fallback med "ladda om"-knapp

#### ADR-krav
Inget nytt ADR krävs. URL-state-strategin följer befintlig `URL-STATE-SPEC.md`.

#### Korsreferens
- `STATE-STRATEGY.md` §1, §3 (server/UI/URL-state-uppdelningen)
- `URL-STATE-SPEC.md`

---

### Fas 2.5 — Schema-kontrakt-sync

#### Mål
Synka kodens domäntyper mot `data-model.md` (källa) + införa Zod-validering vid alla externa datagränser + klassa adapter-debt utan att deploya EF i förskott.

#### Scope
- `Status.ts` skrivs om: 4 → 6 statusvärden för Anmälningar (mot `data-model.md` 2026-04-26)
- Övriga enums i `src/domain/types/` granskade mot `data-model.md`
- Zod-scheman aktiveras som runtime-validering i `AirtableAdapter` läs-metoderna
- Adapter-debt-klassning: 9 metoder enligt P1-sessionsdok Del 3 (A5-tabellen) markeras med klass i koden (`@deferTo: Fas-Xx` JSDoc + ev. `throw new Error('Not deployed yet — see Fas Xx')`)
- Stub-metoder som klassas som död kod tas bort

#### Inte scope
- **Inga nya EF-deploys.** Per A5-beslutet: 0 EF deployas i denna fas.
- Field-allowlists-implementation — sker per-vy i Fas 5.5/6
- Refaktorering av AirtableAdapter:s read-metoder utöver Zod-aktivering

#### Beroenden
- Fas 1 (Status.ts + Zod-scheman finns)
- Fas A (operations-API + INVARIANT-mönster låsta)

#### Estimat
1 session.

#### Filer som skapas/uppdateras
- `src/domain/types/Status.ts` (omskrivs)
- `src/domain/types/*.ts` (granskas, ev. uppdateras)
- `src/data/adapters/AirtableAdapter.ts` (Zod aktiveras, 9 metoder klassade i JSDoc)
- `src/data/schemas/*.ts` (Zod-scheman, ev. justering)

#### DoD
1. `Status.ts` har 6 värden matchande `data-model.md` (`pending`, `confirmed`, `cancelled`, `attended`, `no-show`, `waitlist` — exakt enum-värden bekräftas mot källan vid sessionsstart)
2. `tsc --noEmit` 0 fel — alla konsumenter av Status uppdaterade
3. Zod-scheman validerar runtime vid varje read i AirtableAdapter — fångar shape-drift
4. 9 adapter-metoder har JSDoc-klassning per A5-tabellen (defer-fas + 06b-impact)
5. Eventuella död-kod-stubs borttagna med spårbarhet i commit
6. `npm run test:api` grön — alla 113 tester från Fas A passerar fortfarande
7. Biome `0 fel`

#### ADR-krav
Inget nytt ADR. A5-beslutet är dokumenterat i P1-sessionsdok Del 3 — kan refereras därifrån.

#### Korsreferens
- `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 3 (A5-klassningstabell)
- `docs/reference/data-model.md` (källa för status-typer per dm-110)

---

### Fas 3 — UI-primitiver

#### Mål
Bygga den minimala uppsättning UI-primitiver som Fas 5 + 5.5 + 6 behöver: Button, Input, Select, MessageBox, Modal, Dialog. Alla med React Aria-bas + CVA-variantsystem + ARIA 1.3-attribut.

#### Scope
- 6 primitiver enligt ovan, med varianter (size: sm/md/lg, intent: primary/secondary/danger/ghost)
- CVA-konfiguration per primitiv
- React Aria-hooks som bas (`useButton`, `useTextField`, etc.) — ingen native-element-baserad implementation
- Storybook eller minimal demo-route för visuell verifiering (välj Storybook om det inte introducerar för stor build-time-kostnad — annars `/dev/primitives`-route)
- 11/11/11-verifiering per komponent (Tillgänglighet alltid 11)

#### Inte scope
- Komplex komponent-komposition (DataTable, Calendar) — Fas 7 vid behov
- Toast/Notification — Fas 5 (app-shell-leverans)
- Form-validering-orchestrering — Fas 6 per-vy

#### Beroenden
- Fas 0 (3-lagers tokens etablerade)
- Fas 3.5 — **kvalitetsgranskningsbasen** etableras innan Fas 3:s DoD kan stämmas av (men Fas 3 kan börja byggas parallellt med Fas 3.5:s test-infra-setup)

#### Estimat
2 sessioner.

#### Filer som skapas/uppdateras
- `src/components/primitives/Button.tsx`
- `src/components/primitives/Input.tsx`
- `src/components/primitives/Select.tsx`
- `src/components/primitives/MessageBox.tsx`
- `src/components/primitives/Modal.tsx`
- `src/components/primitives/Dialog.tsx`
- `src/components/primitives/index.ts`
- Demo-route eller Storybook-config

#### DoD
1. Varje primitiv passerar 11/11/11 mot `KVALITETSDEFINITIONER-11.md`:
   - Tillgänglighet: axe-core 0 violations + manuell tangentbordstest + skärmläsartest
   - Teknik: TypeScript strikt, Biome 0 fel, < 150 rader, single responsibility
   - Återanvändbarhet: ingen produktspecifik logik, props-driven, kan exporteras till Mm Component Library utan ändring
2. CVA-konfiguration har minst 3 varianter per primitiv (size + intent + state)
3. Demo/Storybook visar alla varianter
4. Playwright a11y-runner (etablerad i Fas 3.5) kör mot alla primitiver — 0 violations
5. JSDoc per primitiv med usage-exempel

#### ADR-krav
Inget nytt ADR.

#### Korsreferens
- `ACCESSIBILITY-CHECKLIST.md` (omskriven 2026-05-04 — React Aria + WCAG 2.2 AA)
- `ARIA-UPGRADE.md` (per-komponent ARIA 1.3-detaljer)
- `DESIGN-SYSTEM-SPEC.md`

---

### Fas 3.5 — A11y-baseline (NY EGEN FAS)

#### Mål
Etablera test-infrastruktur (axe + Playwright a11y) + 5 React Aria-mönster som Fas 6 kommer att konsumera. ACCESSIBILITY-CHECKLIST omskriven i P2 — denna fas levererar test-koden + mönsterbiblioteket som checklisten förutsätter.

#### Scope
- `axe-core` + `@axe-core/playwright` installerade
- Playwright a11y-runner-config (separat eller integrerad i `playwright.config.ts`)
- Fixture-mönster: `renderWithA11y(component)` eller motsvarande
- CI-integration: axe-violations failar bygget
- 5 React Aria-mönster med kodexempel + test-mall:
  1. **Overlay** (`useOverlay` + `useDialog` + `useModal`) — modaler, confirm-dialoger, slide-in
  2. **Listbox** (`useListBox` + `useOption`) — dropdowns, filter, sortering
  3. **Disclosure** (`useDisclosure` + `useDisclosureGroup`) — accordion, expanderbara rader
  4. **MenuTrigger** (`useMenuTrigger` + `useMenu`) — kontextmeny, åtgärdsmeny
  5. **ComboBox** (`useComboBox` + `useFilter`) — sökfält med autocomplete
- Per pattern: kodexempel + test-mall + a11y-acceptance-criteria

#### Inte scope
- Komponentimplementation per primitiv — Fas 3
- A11y-fixar i befintlig kod — Fas 7 vid behov
- WCAG 2.2 AAA-nivå — målet är AA

#### Beroenden
Ingen mot tidigare faser. Blockerar Fas 3:s DoD (Fas 3 kan inte kvalitetsgranskas mot React Aria utan testkoden).

#### Estimat
1 session.

#### Filer som skapas/uppdateras
- `playwright.config.ts` (a11y-runner-config tillagd)
- `tests/a11y/fixtures.ts` (renderWithA11y + fixture-mönster)
- `tests/a11y/patterns/Overlay.spec.ts`
- `tests/a11y/patterns/Listbox.spec.ts`
- `tests/a11y/patterns/Disclosure.spec.ts`
- `tests/a11y/patterns/MenuTrigger.spec.ts`
- `tests/a11y/patterns/ComboBox.spec.ts`
- `docs/aria-patterns/` (5 markdown-filer per pattern med kodexempel)
- `package.json` (`axe-core`, `@axe-core/playwright`)

#### DoD
1. `npm run test:a11y` kör Playwright a11y-runner — 0 violations på alla 5 patterns
2. CI failar vid axe-violation (verifiera med medvetet brytande commit på branch)
3. Fixture-mönstret återanvänds i Fas 3:s primitiv-tester
4. 5 markdown-filer i `docs/aria-patterns/` har kodexempel + test-mall + acceptance-criteria
5. ACCESSIBILITY-CHECKLIST §"Test-infrastruktur" + §"Mönsterbibliotek" markeras "✅ levererad i Fas 3.5"
6. "A11y-baseline godkänd"-gate dokumenterad i `docs/BUILD-LOG.md` innan Fas 6 startar

#### ADR-krav
**ADR-020 — Fas 3.5 = egen fas (P2 A1-utfall)**: dokumenterar trigger-tabellen från P1 + utfallet från P2 (rad 2 + rad 3 båda JA).

#### Korsreferens
- `ACCESSIBILITY-CHECKLIST.md` (omskriven i P2)
- `tasks/sessions/2026-05-04-stodspec-synk-p2.md` Del 5 (A1-trigger-rapport)

---

### Fas 5 — App-shell (förenklad)

#### Mål
Minimal app-shell som tål mobil-först-användning (Lotta på telefon i mötet) + tab bar + offline-foundation. **Förenklad** per B3-beslutet — ej full app-shell-leverans.

#### Scope
- App-shell layout: header (minimal) + content-area (max-width 600px) + bottom tab bar
- Tab bar: 4 flikar, fixed bottom, ARIA-tabs-mönster
- Skip-to-content-länk + route announcer (för skärmläsare)
- Responsivt: 375 / 768 / 1024 px breakpoints
- `prefers-reduced-motion` + `prefers-contrast: more` respekt
- Error boundaries: app-nivå + sektion-nivå (per route)
- Workbox SW: cache-first för statiska assets, network-first för API, offline.html-fallback
- TanStack Query offline-config (`networkMode: 'offlineFirst'` för läs, `'online'` för skriv)

#### Inte scope (flyttat till Fas 7 per B3)
- View Transitions API
- Speculation Rules
- web-vitals-mätning
- Widget-error-boundary (mer granulär än sektion-nivå)

#### Beroenden
- Fas 2 (routing)
- Fas 3 (Button, MessageBox för error-fallbacks)
- Fas 3.5 (a11y-test för tab bar och skip-link)

#### Estimat
1 session (förenklat från 1–2 i conversion-plan).

#### Filer som skapas/uppdateras
- `src/routes/__root.tsx` (utökas med shell)
- `src/components/AppShell/AppShell.tsx`
- `src/components/AppShell/TabBar.tsx`
- `src/components/AppShell/SkipLink.tsx`
- `src/components/AppShell/RouteAnnouncer.tsx`
- `src/components/ErrorBoundary/AppError.tsx`
- `src/components/ErrorBoundary/SectionError.tsx`
- `public/sw.js` (utbyggt från 20-raders skelett till Workbox-baserad)
- `public/offline.html`
- `src/data/queryClient.ts` (offline-config)

#### DoD
1. `/hem` placeholder visar shell + tab bar med 4 flikar (Hem/Event/Personer/Mer)
2. Skip-to-content fungerar (Tab → Enter hoppar till `<main>`)
3. Route-changes annonseras till skärmläsare (verifierat med VoiceOver eller NVDA)
4. Lighthouse PWA-score ≥ 90
5. Offline-läge: ladda om sidan utan nät → offline.html visas eller cachat innehåll renderas
6. Sektions-error: medvetet fel i en route → error boundary visar fallback utan att krascha shell
7. App-error: medvetet fel i shell → app-error visar fallback med "ladda om"-knapp
8. `prefers-reduced-motion` testat — inga animations triggas
9. Responsiv: 375/768/1024 — tab bar förblir användbar på alla
10. axe-core 0 violations på shell

#### ADR-krav
**ADR-018 — Fas 5-förenklingen** (per B3): dokumenterar vilka [GA]-tillägg som flyttas till Fas 7 + motiv.

#### Korsreferens
- `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 5 (B3-beslutet)

---

### Fas 5.5 — Vertikal write-slice

#### Mål
Etablera mutation-mönstret (TanStack `useMutation` + optimistic UI + operations-baserat API) genom en minimal vertikal slice: "markera anmälan som betald" via befintlig `update-record` EF med ny `operationKey`. Sliceen blir mall för Fas 6:s mutationer.

#### Scope
- Minimal Event-detaljvy med Betalning-flik
- Anmälda-lista med betalning-status + "Markera som betald"-knapp
- Mutation: `mark-registration-paid` (eller motsvarande operationKey, finslipas vid sessionsstart) via `update-record` EF
- Optimistic UI: status-flip omedelbart, rollback vid fel
- 3 Playwright-tester:
  - 2 deny-tester (förbjudet fält, förbjuden roll)
  - 1 allow-test (lyckad mutation)
- Operations-allowlist utvidgad med ny `operationKey` i `field-allowlists.ts`
- Status-flip annonseras till skärmläsare via `aria-live` (förutsätter Fas 3.5:s a11y-mönster)
- Fas A:s aktiveringsguides 5 steg följs (operationKey → allowlist → test → UI → integration)

#### Inte scope
- **Inga nya EF-deploys.** Använder befintlig `update-record`.
- Andra mutationer (närvaro, mail) — Fas 6
- Realtime-updates av anmälda-listan — polling (B1) istället, implementeras i Fas 6d

#### Beroenden
- Fas 5 (app-shell + tab bar)
- Fas 3 (Button, MessageBox)
- Fas 2.5 (operations-API och Status.ts uppdaterade)
- Fas 3.5 (a11y-test för knapp + status-flip-announcement)

#### Estimat
2 sessioner.

#### Filer som skapas/uppdateras
- `src/routes/event/$eventId/betalning.tsx` (ny route)
- `src/components/registrations/MarkPaidButton.tsx`
- `src/data/mutations/markRegistrationPaid.ts`
- `supabase/functions/_shared/field-allowlists.ts` (utvidgas — INTE ny EF)
- `tests/e2e/markPaid.spec.ts` (3 Playwright-scenarier)
- `tests/api/markPaid.spec.ts` (deny/allow på server-nivå)

#### DoD
1. Manuellt: ladda Event-detalj/Betalning → klicka "Markera som betald" → status flippar omedelbart (optimistic) → rollback fungerar vid simulerat fel
2. Server: deny-test 1 — försök ändra `Anteckningar`-fält via `mark-registration-paid` → 403
3. Server: deny-test 2 — anonym användare → 401
4. Server: allow-test — auktoriserad admin + endast Status-fält → 200 + Airtable uppdaterad
5. Klient: optimistic UI flippar inom 50 ms (ingen network-wait innan visuell feedback)
6. Klient: vid 5xx-svar → rollback + toast med `requestId`
7. Klient: TanStack Query-cache invaliderad på `['registrations', eventId]`
8. axe-core 0 violations + status-flip annonseras till skärmläsare via `aria-live`
9. Fas A aktiveringsguides 5 steg avbockade i sessionsdok
10. Mönstret dokumenterat som "mall för Fas 6 mutationer" i sessionsdok
11. ADR-016 (TanStack optimistic mutation-mönster) skriven

#### ADR-krav
**ADR-016 — TanStack optimistic mutation-mönster med operations-baserat API** (per A2 + dependency på Fas A M4): dokumenterar `mutationFn` med `executeOperation({operationKey, recordId, fields})` + `onMutate`-rollback-pattern + cache-invalidation-strategy. Skrivs i Fas 5.5 som mall.

#### Korsreferens
- `STATE-STRATEGY.md` §4 (Optimistisk UI), §8 (Operations-baserat write-API)
- `SECURITY-SPEC.md` §6.1 (operations-registret)
- `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 4 (A2-beslutet)

---

### Fas 6 — Hem + Event + Personer + Mer (strangler-fig)

#### Mål
Bygga de fyra produkt-flikarna i strangler-fig-ordning per `analys/07-migration-plan.md` §A2: Persons-domän → Events-domän → Registrations + Väntelista → Hem-aggregering → Mer (villkorlig). Hem byggs SIST eftersom den aggregerar de tre andra.

#### Sub-fas-allokering

| Sub-fas | Domän/grupp | Estimat | Innehåll | EF som deployas |
|---|---|---|---|---|
| **6a** | Persons | 0,75 sess | `/personer` lista (befintlig fetchPersons) + `/personer/[id]` detaljvy + minimal write (uppdatera notering) | `fetchPerson` |
| **6b** | Events | 0,75 sess | `/event` lista (befintlig fetchEvents) + `/event/[id]` info-vy + Närvaro-flik | `fetchEvent`, `fetchAttendance` |
| **6c** | Registrations + Väntelista | 1 sess | Anmälda-flik på Event-detalj, väntelista-konvertering på Mer, idempotent registrering | `createRegistration`, `fetchWaitlist` |
| **6d** | Hem-aggregering | 0,5 sess | `/hem` med greeting + nya anmälningar + info-cards + CTA. Polling 60s + pull-to-refresh + visibility-trigger (B1) | (inga nya — använder befintliga read-EF) |
| **6e** | Mer-fliken (villkorlig) | 0,5 sess | Mail-vy om behållen, Leads-vy om behållen | `sendEmail` (med ADR), ev. `fetchLeads`, ev. `fetchMailLog` |

**Total: 3,5 sessioner.**

#### Scope (per sub-fas)
- Domän-vy enligt sub-fas-tabell
- Mutationer registreras i `field-allowlists.ts`
- 1 deny-test + 1 allow-test per ny operationKey
- Vy-Playwright baseline (1 happy path)
- TanStack Query med stale-time + cache-time per vy

#### Inte scope (per sub-fas)
- Polling/Realtime utöver 6d Hem (per B1: hybrid polling 60s + pull-to-refresh; Realtime defer:as till Fas E)
- Närvaro-Background-Sync — defer:ad till Fas 8 per B2
- xAPI-aktivitetslogg — Fas 6.5

#### Beroenden
- Fas 5 + Fas 5.5 (mutation-mönstret etablerat)
- Fas 3 (UI-primitiver)
- Fas 3.5 (a11y-baseline)
- Fas 2.5 (adapter-debt klassad)
- Inom Fas 6: 6a → 6b → 6c är hård kedja; 6d kräver att 6a + 6b + 6c levererat data-EF:er; 6e är fristående och kan defer:as

#### Estimat
3,5 sessioner totalt, sub-fördelat enligt tabell.

#### Filer som skapas/uppdateras

**6a (Persons):**
- `src/routes/personer/index.tsx`, `src/routes/personer/$personId.tsx`
- `supabase/functions/get-person/index.ts` (deploy)
- `field-allowlists.ts` (utvidgas)
- `tests/e2e/personer.spec.ts`

**6b (Events):**
- `src/routes/event/index.tsx`, `src/routes/event/$eventId/info.tsx`, `src/routes/event/$eventId/narvaro.tsx`
- `supabase/functions/get-event/index.ts`, `supabase/functions/get-attendance/index.ts` (deploy)
- `field-allowlists.ts` (utvidgas)
- `tests/e2e/event.spec.ts`

**6c (Registrations + Väntelista):**
- `src/routes/event/$eventId/anmalda.tsx`
- `src/routes/mer/vantelista.tsx`
- `supabase/functions/create-registration/index.ts` (deploy med idempotency)
- `supabase/functions/get-waitlist/index.ts` (deploy)
- `field-allowlists.ts` (utvidgas)
- `tests/e2e/registrations.spec.ts`

**6d (Hem):**
- `src/routes/hem.tsx`
- `src/components/hem/Greeting.tsx`, `NyaAnmalningar.tsx`, `InfoCards.tsx`, `CTA.tsx`
- `src/data/queries/usePollingQuery.ts` (60s + pull-to-refresh + visibility-trigger)
- `tests/e2e/hem.spec.ts`

**6e (Mer):**
- `src/routes/mer/index.tsx`
- Ev. `src/routes/mer/mail.tsx`, `src/routes/mer/leads.tsx`
- Ev. `supabase/functions/send-email/index.ts` (deploy med direct-Resend-ADR)
- `tests/e2e/mer.spec.ts`

#### DoD (per sub-fas)
1. Vyer passerar 11/10/10 mot `KVALITETSDEFINITIONER-11.md` (Tillgänglighet 11, Teknik 10, Återanvändbarhet 10 — vyer är produktspecifika så Återanvändbarhet/Teknik kan acceptera produktbundna val)
2. Vy renderar mot live-data (eller Airtable-mockad fixture i CI)
3. Mutation registrerad i `field-allowlists.ts` med 1 deny + 1 allow-test grön
4. Vy-Playwright baseline grön
5. axe-core 0 violations
6. EF deployad till staging + verifierad mot Airtable-bas
7. TanStack Query cache + invalidation fungerar (verifiera med devtools)

#### ADR-krav (Fas 6)
- **ADR-014 — `createRegistration`-idempotency** (per A5, Fas 6c): dokumenterar idempotency-nyckel-strategin (mot dubbletter vid retry/dubbel-klick) — adresserar `data-model.md §F.4`-buggen.
- **ADR-015 — `sendEmail` direct-Resend-skuld** (per A5, Fas 6e): om sendEmail deployas i 6e, dokumenterar varför direct-Resend-anrop används och planen för migration till mail-event-pattern.
- **ADR-017 — Polling-vs-Realtime + migrations-vägen post-Fas E** (per B1, Fas 6d): dokumenterar 60s + pull-to-refresh + visibility-trigger som interimslösning + Supabase Realtime-omläggning som Fas E-uppgift.

#### Korsreferens
- `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 3 (A5-tabellen) + Del 4 (A3 + A2 + B1)
- `analys/07-migration-plan.md` §A2 (strangler-fig-ordningen)
- `STATE-STRATEGY.md` §2 (per-vy state-plan med strangler-fig-not), §5b (polling-pattern)

---

### Fas 6.5 — Aktivitetslogg (xAPI)

#### Mål
Implementera xAPI-baserad aktivitetslogg för spårning av Lottas operativa åtgärder (markera betalning, bekräfta anmälan, etc.) — för observability + framtida adaptiv lärning i Passionslyftet.

#### Scope
- xAPI-statement-shape definierad och Zod-validerad
- `src/data/activityLog/recordActivity.ts` med `requestId`-propagering från Fas A M7
- 5–10 aktivitetstyper definierade (markera-betald, bekräfta-anmälan, lägga-till-person, etc.)
- Lagring: Airtable `Activity Log`-tabell (per `data-model.md`) eller separat target-tabell post-Fas E
- `[GA]` Open Badges-kompatibel struktur (defer:as till Passionslyftet men shape förbereds)

#### Inte scope
- Adaptiv lärning-engine — Passionslyftet
- LiveKit / Cal.com-integration — Passionslyftet
- Real-time activity-stream-visning — Fas E

#### Beroenden
- Fas A M7 (`requestId`-propagering)
- Fas 6 (5–10 aktivitetstyper kommer från reella vy-events)

#### Estimat
1 session.

#### Filer som skapas/uppdateras
- `src/data/activityLog/recordActivity.ts`
- `src/data/activityLog/types.ts` (xAPI-statement-shape + Zod-schema)
- `src/data/activityLog/activityTypes.ts` (5–10 typer, t.ex. `markera-betald`, `bekräfta-anmälan`, `lägga-till-person`)
- `src/data/mutations/*.ts` (befintliga mutationer från Fas 6 utökas med `onSuccess`-callback som loggar aktivitet)
- Ev. `supabase/functions/log-activity/index.ts` om server-side-aggregering krävs
- `tests/e2e/activityLog.spec.ts`

#### DoD
1. Varje mutation från Fas 6 producerar ett xAPI-statement
2. Statement-shape valideras runtime via Zod
3. `requestId` propageras från klient → server → activity-log
4. Activity-log läsbar för debug i devtools
5. Bonus-ADR (utöver de 10 i ADR-index ovan) skriven om `trace_id` vs `requestId`-relationen — distinkta korrelerade IDs eller sammanslagna. Beslut tas vid sessionsstart.

#### ADR-krav
**Bonus-ADR (utöver P3a:s 10) — `trace_id` vs `requestId`-relationen**: distinkta korrelerade IDs eller sammanslagna. Per P0-inventory Fas 6.5 öppen fråga. Skrivs när Fas 6.5 implementeras, inte i P3a.

#### Korsreferens
- `FEATURE-ACTIVITY-LOG.md` (uppdateras i Fas 6.5 efter ADR-beslut)
- `data-model.md` (Activity Log-tabell-shape)

---

### Fas 7 — Konsolidering

#### Mål
Säkra appen för production: CSP-plugin (defer:ad från Fas 0), prestandamätning, deploy-pipeline, chaos testing, samt de [GA]-tillägg som flyttades hit från Fas 5 per B3.

#### Scope
- CSP-nonce-plugin i `vite.config.ts` (defer:ad från Fas 0)
- Trusted Types
- Säkerhetsheaders (HSTS, X-Frame-Options, etc.)
- web-vitals-mätning (CLS, LCP, FID, INP, TTFB)
- View Transitions API (per B3 — flyttad från Fas 5)
- Speculation Rules (per B3 — flyttad från Fas 5)
- Widget-error-boundary (per B3 — mer granulär än sektion-nivå från Fas 5)
- DataTable-komponent (om event-detalj behöver det; annars eliminera)
- `@axe-core/playwright` integrerad i deploy-pipeline
- Manuell VoiceOver-test
- Chaos testing (medveten EF-failures + offline-toggling)
- Deploy-pipeline (staging → production, smoke-tester)
- Golden Master-testdag
- Supply chain audit
- React 19 CVE-granskning
- PostCSS audit-fix
- Design audit (skill) på Hem, Mer, AppShell

#### Inte scope
- Background Sync (defer:ad till Fas 8 per B2)
- Passkeys, push-notifications — Fas 8 eller senare
- Lighthouse-perfekt på alla routes — endast på kritiska (Hem, Event-detalj, Personer-detalj)

#### Beroenden
- Fas 6 (alla flikar byggda — det finns något att deploya)
- Fas 6.5 (aktivitetslogg etablerad — chaos-testing ger användbar data)

#### Estimat
3 sessioner.

#### Filer som skapas/uppdateras
- `vite.config.ts` (CSP-plugin aktiveras)
- `src/main.tsx` (web-vitals + Speculation Rules)
- `src/components/ErrorBoundary/WidgetError.tsx`
- `.github/workflows/deploy.yml` (eller motsvarande)
- `tests/chaos/*.spec.ts`
- `tests/e2e/visual/*` (Golden Master)

#### DoD
1. CSP-plugin aktiv i prod, ingen inline-script-violation i console
2. web-vitals-mätning rapporterar till Sentry/Faro
3. Speculation Rules aktivt på utvalda routes (verifierat via Lighthouse)
4. View Transitions: navigation mellan flikar har transition (med `prefers-reduced-motion`-respekt)
5. Widget-error-boundary fångar fel inom enskild card/widget utan att krascha sektion
6. axe-core-violations failar deploy
7. Chaos-test: medveten EF-500 → app fortsätter fungera, error rapporteras till Sentry med `requestId`
8. Deploy-pipeline: pull-request → staging-deploy → smoke-tests → manual approval → prod-deploy
9. Golden Master-tester gröna mot staging
10. PostCSS audit clean (`npm audit --audit-level=moderate` → 0)
11. React 19 CVE-genomgång committad i `docs/security-audits/2026-XX-react-19.md`
12. Design audit (skill) körd på Hem, Mer, AppShell — rapport committad

#### ADR-krav
- **Refererar ADR-011 — CSP-plugin-deferral** (per P0-inventory): ADR skrevs i P3a vid byggplan-skiftet, dokumenterar varför plugin defer:ats från Fas 0 till Fas 7. Inget *nytt* ADR krävs här — endast verifikation att ADR-011:s villkor uppfylls (CSP-plugin aktiv i prod, inga inline-script-violations).

#### Korsreferens
- `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 5 (B3-beslutet — vilka [GA] som flyttats hit)
- `SECURITY-SPEC.md` §5 (OWASP-tabellen)

---

### Fas 8 — Background Sync (framtid)

#### Mål
Implementera Background Sync API för offline-mutationskö — defer:ad från Fas 7 per B2-beslutet. Aktualiseras när production-instrumentering från Fas 7 har samlat empirisk data om hur ofta Lotta hamnar i offline-läge med köade mutationer.

#### Scope (preliminärt — låses vid aktualisering)
- Background Sync API-integration i `public/sw.js`
- IndexedDB-baserad mutationskö
- Kö-status-UI i app-shell ("3 ändringar väntar på synk")
- Konflikt-hantering (server-state vs lokal kö)

#### Inte scope (denna revision)
- Passkeys (defer:ad)
- Push-notifications (defer:ad)

#### Beroenden
- Fas E klar (target-arkitektur låst)
- Fas 7 deploy klar (production-instrumentering finns för empirisk data)

#### Estimat
TBD — fastställs vid aktualisering.

#### ADR-krav
- **ADR-019 — Background Sync defer från Fas 7 till Fas 8** (per B2): dokumenterar arkitekturskuld + Fas 7-storlek + Lotta-flow-tolerans + plan för aktualisering. Skrivs vid Fas 7-start så det är tydligt att Fas 7 *inte glömde* — det var medvetet.

#### Korsreferens
- `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 5 (B2-beslutet)
- `STATE-STRATEGY.md` (Background Sync-not när aktualiseras)

---

### Fas B — Airtable-hardening (parallell-spår)

#### Mål
Säkra Airtable-basen som single source of truth för Miranon Media Admin tills Fas E migreras: rensa drift, etablera redesign-konsistens, dokumentera operativa gränser. Roger/Lotta-arbete med Marcus-stöd.

#### Scope (preliminärt — fastställs av Roger/Lotta i samråd med Marcus)
- Drift-rensning per `analys/06a-airtable-redesign.md` Del A–C
- Schema-kontrakt mellan Airtable-fält och `data-model.md`
- 11 automationer granskade (live-state per `analys/02-live-state.md` §A)
- Synk-gates mot React-bygget: Gate B1 (innan Fas 6c — Registrations) + Gate B2 (innan Fas E — migration)

#### Beroenden
**Parallell-spår — inga beroenden mot Fas A.** Synk-gates mot Fas 6c och Fas E.

#### Estimat
Separat estimat — fastställs av Roger/Lotta.

#### ADR-krav
Inget nytt ADR i React-byggets katalog. Airtable-side-beslut dokumenteras i Roger/Lottas eget spår.

#### Korsreferens
- `analys/06a-airtable-redesign.md` Del A–C
- `tasks/sessions/fas-4a-prompt.md` §3.4
- `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 2 (A4-beslutet)

---

### Fas E — Supabase-migration (DEFER)

#### Mål
Migrera Miranon Media Admin från Airtable som primär datakälla till Supabase (Postgres + RLS + Realtime), enligt strangler-fig-ordningen i `analys/07-migration-plan.md` §A2.

#### Scope (preliminärt — låses vid aktualisering)
- Persons → Events → Registrations → Hem-aggregering enligt 07 §A2
- DataSourceAdapter-byte: AirtableAdapter → SupabaseAdapter (target-shape från 06b)
- Supabase Realtime ersätter polling (per B1) — anslutningar per tabell
- RLS-policies enligt 06b-targetmodellen
- Activity Log migrerad till `activity_log`-tabell med trigger-baserad statement-generering
- Datasynk under övergångsperiod (dual-write eller CDC)

#### Inte scope
- Hela appens omskrivning — DataSourceAdapter-pattern (etablerat i Fas 1) tar 90% av sticket
- Airtable-bortrivning omedelbart — kvar som backup tills Fas E är verifierad

#### Beroenden
- Fas 7 deploy klar (target för migration finns)
- Fas B avslutad (Airtable-side städat innan migration)
- Empirisk data från Fas 7-deploy om vilka tabeller som har högst läs/skriv-tryck (informerar migrationsordning inom Fas E)

#### Estimat
Separat planering — fastställs vid aktualisering.

#### ADR-krav
ADR:er per migrationsbeslut — skrivs vid aktualisering.

#### Korsreferens
- `analys/06b-supabase-target.md` (target-modellen)
- `analys/07-migration-plan.md` §A2 (strangler-fig-sekvens)
- `analys/08-odoo-validation.md` (sista valideringen av target)

---

## 5. ADR-index

10 ADR:er skrivna i P3a (2026-05-05) som ADR-011 till ADR-020 — tilldelade efter befintliga ADR-001 till ADR-010 (Fas 0 + Fas 1, Session 1, 2026-04-14). Fullständigt index i `docs/decisions/README.md`.

| ADR | Ämne | Fas där den skrivs/refereras | Källa |
|---|---|---|---|
| ADR-011 | CSP-plugin-deferral i `vite.config.ts` | Fas 0 (skrivs nu, refereras från Fas 7) | P0-inventory Fas 0.1 + 7.3 + direktiv §8.5.6 |
| ADR-012 | Conversion-plan → byggplan-skiftet | Meta (skrivs i P3a) | Direktiv §12 ("ramen 'konvertering' var efterlöpare") |
| ADR-013 | Fas 4-borttagningen (DataTable flyttad till Fas 7) | Meta (skrivs i P3a) | P0-inventory Fas 4.1 + direktiv §12 (Numreringsnot) |
| ADR-014 | `createRegistration`-idempotency | Fas 6c | P1-sessionsdok Del 3 (A5) + `data-model.md §F.4` |
| ADR-015 | `sendEmail` direct-Resend-skuld | Fas 6e | P1-sessionsdok Del 3 (A5) |
| ADR-016 | TanStack optimistic mutation-mönster med operations-baserat API | Fas 5.5 | P1-sessionsdok Del 4 (A2) |
| ADR-017 | Polling-vs-Realtime + migrations-vägen post-Fas E | Fas 6d | P1-sessionsdok Del 4 (B1) |
| ADR-018 | Fas 5-förenklingen (vilka [GA] flyttas till Fas 7) | Fas 5 | P1-sessionsdok Del 5 (B3) |
| ADR-019 | Background Sync defer från Fas 7 till Fas 8 | Fas 7-start | P1-sessionsdok Del 5 (B2) |
| ADR-020 | **Fas 3.5 = egen fas** (P2 A1-utfall) | Fas 3.5 | P2-sessionsdok Del 5 (A1-trigger-rapport) |

Bonus-ADR (utöver de 10 ovan): `trace_id` vs `requestId`-relationen — skrivs när Fas 6.5 implementeras (per P0-inventory Fas 6.5 öppen fråga). Numreras vid Fas 6.5-tidpunkt.

---

## 6. Versionshistorik

| Version | Datum | Förändring |
|---|---|---|
| 1.0 | 2026-05-05 | Initial (P3a K2) — ersätter `docs/conversion-plan.md`. Baserad på P0-inventory + P1 fas-sekvens-revision + P2 stödspec-synk. 13 fas-prompter + 10 ADR:er identifierade som ADR (#1)–ADR (#10). |
| 1.1 | 2026-05-05 | P3a K3 — 10 ADR:er skrivna och numrerade som ADR-011 till ADR-020 i `docs/decisions/`. ADR-referenser i fas-prompter + §5 ADR-index uppdaterade till slutgiltiga ADR-NNN-format. |

---

*Detta är slutprodukten för byggplan-revisionen som startade 2026-05-04. Vidare ändringar dokumenteras i versionshistoriken ovan + ADR per arkitekturbeslut.*
