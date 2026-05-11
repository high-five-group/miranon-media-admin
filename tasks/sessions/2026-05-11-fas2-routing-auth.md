# Fas 2 — Routing + Auth (TanStack Router + Supabase + nuqs)

> **Status:** PÅGÅR — K1 skelett 2026-05-11. K0åa..åf preflight + K2-K4 Fas 2-implementation följer.
> **Skapat:** 2026-05-11 (K1)
> **Slutgiltig version:** TBD (K-sista bakar in Del 3-8)
> **Ägare:** Marcus + Claude Chat (planering) + Claude Code (implementation)
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-11-fas2-routing-auth.md`
> **Styrande:** `docs/byggplan.md` §4 Fas 2-prompt (8 DoD-punkter) + `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md` Del 6.5 (6 K0-åtgärder)
> **Föregångare:**
> - `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md` (Pre-Fas-2, slutförd 2026-05-07) — arkiveras i K1 enligt ADR-023 sessions-arkivering
> **Efterföljare:** Fas 2.5 — Schema-kontrakt-sync, mot `docs/byggplan.md` §4 Fas 2.5-prompt.
> **Stop-test (denna session):** 6 K0-åtgärder committade + Fas 2 DoD 1-8 passerade + Playwright auth-fixture etablerad + ev. ADR:er committade + lessons-skörd lyft + sessionsdok låst + transcript sparat.
> **Sessionsdok-commit-disciplin (P3a-baserad, reviderad för Fas 2):** K1 = skelett. Faktiska arbets-commits (K0åa-åf, K2-K4) rör INTE detta sessionsdok. **K1.N early bake-ins** committas efter substantiella K0-sub-klungor för att fånga commit-hashar + avvikelser + lärdomskandidater innan K-sista. K-sista bakar in Del 3-8 retrospektiv. Mönsterbyte från ursprungliga 'K1 + K-sista' till 'K1 + K1.N bake-ins + K-sista' beslutat 2026-05-11 efter K0åb genererat 8 dolda type-fel-fynd + flera lärdomskandidater — för mycket att hålla i Chat-kontext tills K-sista. Ren str_replace-patch är konfliktfri och billig. Touch-count revideras dynamiskt under sessionen; aktuell post-K1.3 = 4 (K1 + K1.2 + K1.3 + K-sista planerad).
> **Scope-splitt-anmärkning:** Fas 2-estimat enligt byggplan §4 = 2 sessioner. Om K0+K2+K3+K4 inte ryms i en chat-session, splitta i Session A (K1+K0+K2) och Session B (K3+K4+K5) per P1-lärdom ("Var beredd att splitta i 2 sessioner om scope växer"). Splitten är förväntad, inte avvikelse.

---

## Del 1 — Prolog

### Syfte

Detta dokument är arbetstrailen för Fas 2 — Routing + Auth. Det producerar fyra saker:

1. **K0 preflight** — 6 åtgärder från Pre-Fas-2-verifieringen Del 6.5: 3 startvillkor (kategori 1, måste lösas före första route-fil) + 3 "Direkt efter Fas 2"-fynd (Codex' kategori 2, Fas 2.5-arbete eller före, hanteras i Fas 2 K0 per Marcus' beslut 2026-05-07).
2. **Fas 2 implementation** — `docs/byggplan.md` §4 Fas 2-promptens scope: TanStack Router file-based, `__root.tsx` med AuthProvider + ErrorBoundary + Suspense, skyddade routes via `beforeLoad`-guard mot Supabase-session, Login-vy + Logout-flöde, nuqs URL-state-setup (initial, ej per-vy), devtools för Router + Query (dev-only).
3. **DoD-verifiering** — 8 DoD-punkter från byggplan §4 Fas 2 + Playwright auth-fixture etablerad + `[GA]` Suspense-fallback + `[GA]` Error boundary.
4. **Lessons-skörd** — UNIVERSAL-kandidater från denna session lyfts till `tasks/lessons.md` (+ hub om relevant).

Sessionsdokumentet är auktoritativ trail. De faktiska filerna i repot är "current truth" efter att Code committat dem via prompterna i K2-K5.

### Indata-kontext

Lästa i denna ordning vid sessionsstart (Chat-miljö → projektkunskap; Code-miljö → faktiska filer via `view`/`bash` mot `~/Repon/miranon-media-admin/`):

| # | Källa | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution (transcript-disciplin, sessionsdok-rutin, P-fas-mönster) |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projekt-konstitution + kvalitetsribba + sessionsstart-checklista |
| 3 | `tasks/lessons.md` | UNIVERSAL-lärdomar (baseline för K5-skörd) |
| 4 | `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md` Del 6.5 + Del 8.3 | 6 K0-åtgärder + Fas 2-readiness-signal |
| 5 | `docs/byggplan.md` §3 + §4 Fas 2 | 8 etablerade arkitekturmönster post-Fas A + Fas 2-prompten (8 DoD-punkter) |
| 6 | `docs/specs/SECURITY-SPEC.md` §6 (Fas A-mönster) | `requireUser`, `AuthContext \| Response`, operations-baserat API |
| 7 | `docs/specs/STATE-STRATEGY.md` §1, §3 | server/UI/URL-state-uppdelningen |
| 8 | `docs/specs/URL-STATE-SPEC.md` | nuqs-strategin |
| 9 | `docs/decisions/README.md` + relevanta ADR:er | ADR-katalog (24 ADR:er totalt; särskilt relevanta: ADR-012 byggplan ersätter conversion-plan, ADR-018 strangler-fig, ADR-020 Fas 3.5 egen fas, ADR-023 sessions-arkivering, ADR-025 BYGGPLAN-LÄTTLÄST v3) |
| 10 | `docs/BUILD-LOG.md` Session 2 + Session 3 | Retrospektiv av Fas A + P0-P3b + Pre-Fas-2 |

### Källprioritet vid konflikt

1. Code-RAPPORTERA-output (HEAD-state-data) — auktoritativ för aktuell repo-state
2. `docs/byggplan.md` §4 Fas 2-prompt — styrande för scope och DoD
3. `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md` Del 6.5 — auktoritativ för K0-åtgärdslista (6 åtgärder)
4. `docs/specs/SECURITY-SPEC.md` §6 — bindande för server-sidans auth-mönster (klient måste respektera, inte återimplementera)
5. `docs/decisions/`-ADR:erna — bindande för arkitekturbeslut

### Klunge-struktur

Sex klung-grupper. Sessionsdok rörs i K1 + K-sista — mellan-klungor lämnar det orört (P3a-mönster). Inline-källor i Code-prompter (UNIVERSAL: "Inline-källor i Code-prompter när sessionsdok-disciplin förbjuder löpande uppdatering").

| K | Innehåll | Stop-test per klunga |
|---|---|---|
| **K1** | Sessionsdok-skelett (denna fil — Del 1 Prolog + struktur) + arkivering av pre-Fas-2-doket från `tasks/sessions/`-roten till `tasks/sessions/archive/2026-05/` per ADR-023 konvention | Sessionsdok + arkivering committade i samma commit |
| **K0 (åa-åf)** | Preflight — 6 sub-klungor:<br>**åa:** `npm install nuqs` (startvillkor 1)<br>**åb:** `tsconfig.tests.json` + `npm run typecheck:tests` + CI-koppling + `tests/api/helpers.ts:18` `APIResponse`-import (startvillkor 2)<br>**åc:** CI workflow `test:api`-split i `pure`/`staging` (eller `if: ${{ secrets.TEST_SUPABASE_URL }}`-villkor) mot falsk-grön (startvillkor 3)<br>**åd:** `docs/byggplan.md:249` — engelska→svenska statusvärden ("Direkt efter Fas 2"-fynd 1)<br>**åe:** Aktivera Zod `.parse()` i `AirtableAdapter` reads (fynd 2)<br>**åf:** `docs/specs/KVALITETSDEFINITIONER-11.md` Vue→React (fynd 3) | Alla 6 sub-klungor committade. Verifieringssvit grön efter varje commit: typecheck 0 fel, lint baseline-warnings, build grön, test:api passing+skipped enligt baseline, npm audit 0 vulnerabilities. |
| **K2** | Fas 2 implementation Part 1 — TanStack Router file-based setup: `vite.config.ts` plugin återinförs (togs bort i Fas 0), `tsr.config.json`, `src/routes/__root.tsx` med AuthProvider + ErrorBoundary + Suspense, generated route tree, devtools dev-only | byggplan §4 Fas 2 DoD-rad 1 (delvis) + 5 + 7 + 8 passerade |
| **K3** | Fas 2 implementation Part 2 — `src/auth/AuthProvider.tsx` + `src/auth/useAuth.ts`, `src/routes/login.tsx`, `src/routes/index.tsx` (login-redirect-stub), skyddade routes via `beforeLoad`-guard mot Supabase-session, logout-flöde<br><br>**Arkitektur-not (från P0-inventeringen rad 2.3):** `auth-provider.tsx` får INTE falla tillbaka på anon-key. Klienten ska behandla anon-fallback som unauthenticated (Codex' startvillkor 2 i Fråga 1). Skyddad route utan session → redirect FÖRE datafetch (inte efter 401). | byggplan §4 Fas 2 DoD-rad 1 + 2 + 3 passerade |
| **K4** | Fas 2 implementation Part 3 — nuqs `useQueryState` setup på test-route + Playwright `authenticatedPage`-fixture med TEST_*-credentials<br><br>**Korsreferens:** auth-fixture är 3:e komponenten av Codex' tre startvillkor — CI-split (K0åc) säkrar att fixture-frånvaro hard-failer, fixture-implementationen själv är K4. | byggplan §4 Fas 2 DoD-rad 4 + 6 passerade |
| **K5** | Stop-test verifiering mot alla 8 DoD-punkter + lessons-skörd lyft till `tasks/lessons.md` (+ ev. hub-synk) + ev. ADR:er + sessionsdok bake-in (Del 3-8) + `tasks/todo.md` uppdaterad + `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` uppdaterad (per ADR-025) + transcript-save | Alla 8 DoD-punkter passerade. lessons.md uppdaterad. Sessionsdok låst (denna commit är touch nr 2 efter K1). BYGGPLAN-LÄTTLÄST-v3.md "Senast uppdaterad"-stämpel bumpad. |

---

## Del 2 — K1: Sessionsdok-skelett + pre-Fas-2-arkivering

✅ **KLAR** 2026-05-11.

**K1.A — Skelett:** Denna fil. Innehållet i Del 1 utgör K1.A:s leverans.

**K1.B — Arkivering av pre-Fas-2:** Per ADR-023 konvention 1 ("Sessionsstart: ny `tasks/sessions/<datum>-<tema>.md` skapas i roten") + 2 ("Sessionsavslut: föregående aktiv flyttas till lämplig `archive/<år>-<månad>/`"). Flytt: `tasks/sessions/2026-05-06-pre-fas2-verifiering.md` → `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md`. Refs i CLAUDE.md, todo.md och andra dokument som pekar mot pre-Fas-2-doket uppdaterades i samma commit (kategori 2 fix-vs-skip per ADR-022 — mekanisk path-fix, säker).

**K1-leverans-avvikelser (Code 2026-05-11):**
1. **3 filer / 4 string-ändringar** istället för "4 filer" i ursprungsprompten — `git diff --stat` räknar per fil, inte per string-ref (två refs på olika rader i samma fil = 1 fil-ändring).
2. **CLAUDE.md rad 153 fick semantisk uppdatering**, inte mekanisk archive-prefix: raden beskriver "just nu aktiv session" (rollbeskrivning), inte pre-Fas-2-dokets identitet — byttes från pre-Fas-2-doket-ref till `2026-05-11-fas2-routing-auth.md`. Rad 156 bumpad i samma str_replace från "6 sessionsloggar" till "7" för filstruktur-sannhet. Mönster identifierat som UNIVERSAL-lärdomskandidat (se Del 7.2 Kandidat 1).
3. **`tasks/sessions/transcripts/`-mappen saknas i repot** — verifieringspunkten "transcripts/ kvar" från K1-prompten hoppades över eftersom mappen inte finns. Indikerar att transcript-disciplin från CLAUDE.md sessionsstart/sessionsavslut + CONTRIBUTING.md "Transcript-disciplin" inte applicerats genom Session 2/3. Disciplin-drift exponerad av K1, inte skapad av den. Marcus' beslut behövs vid K5 (se Del 7.1).

**K1-commit (`6af3927`):** "docs(fas2): start Fas 2 session document + archive pre-Fas-2 per ADR-023"
**K0åa-commit (`13cdf86`, separat klunga):** "chore(deps): install nuqs for URL-state — Fas 2 K0 startvillkor 1"
**K1.2-commit (denna early bake-in):** "docs(fas2): early bake-in of K1 avvikelser + K0åa commit-hash"
**K-sista-commit (efter session-avslut):** "docs(fas2): bake in Del 3-8 + Fas 2 retrospektiv"

---

## Del 3 — K0 (åa-åf): Preflight — 6 åtgärder

**Status:** TBD — sub-klung-status fylls i löpande, faktiskt innehåll bakas in i K5.

### 3.0 Översikt

Pre-Fas-2-verifieringen Del 6.5 identifierade 6 öppna åtgärder som hanteras som Fas 2 K0:

| Sub-K | Åtgärd | Kategori | Estimat | Commit-hash |
|---|---|---|---|---|
| K0åa | `npm install nuqs` | Startvillkor 1 — måste lösas före första route-fil | ~5 min | `13cdf86` |
| K0åb | `tsconfig.tests.json` + `typecheck:tests`-script + CI-koppling + `helpers.ts:18` `APIResponse`-import + dold-isberg-fix (6× `process` + 1× `URL`) | Startvillkor 2 | ~20 min est, faktisk ~45 min (dold isberg) | `a5a477b` (deps) + `1d02b3b` (fix) |
| K0åc | CI `test:api`-split (`pure`/`staging` eller `if`-villkor) | Startvillkor 3 | ~15 min | TBD |
| K0åd | `docs/byggplan.md:249` — engelska→svenska statusvärden | "Direkt efter Fas 2"-fynd 1 | ~5 min | TBD |
| K0åe | Aktivera Zod `.parse()` i `AirtableAdapter` reads | "Direkt efter Fas 2"-fynd 2 | ~30 min, ev. ADR | TBD |
| K0åf | `docs/specs/KVALITETSDEFINITIONER-11.md` Vue→React | "Direkt efter Fas 2"-fynd 3 | ~30 min, ev. ADR | TBD |

**Sekvenskrav:** åa → åb → åc är strikt (alla tre måste vara klara innan K2 startar). åd → åe → åf kan tas i valfri ordning eller parallellt; ingen blockerar K2 strikt, men Marcus' beslut 2026-05-07 var att alla 6 hanteras i Fas 2 K0 innan första route-fil.

### 3.1 K0åa — nuqs install (startvillkor 1)
✅ KLAR 2026-05-11. Commit `13cdf86` — "chore(deps): install nuqs for URL-state — Fas 2 K0 startvillkor 1". Full slutsignal (faktisk nuqs-version, bundle-storleksdiff, verifierings-output) bakas in i K5.

### 3.2 K0åb — tsconfig.tests + typecheck:tests + helpers.ts:18-fix (startvillkor 2)

✅ KLAR 2026-05-11. **Två commits** (Code applicerade K0åa-mönstret spontant — UNIVERSAL-kandidat 4 i Del 7.2):

- **K0åb.1 — `a5a477b`** "chore(deps): add @types/node as explicit devDep for tests typecheck" (2 filer: package.json + package-lock.json)
- **K0åb.2 — `1d02b3b`** "chore(tests): aktivera typecheck för tests/ — Fas 2 K0 startvillkor 2" (5 filer: tsconfig.tests.json + tsconfig.json + package.json + tests/api/helpers.ts + .github/workflows/ci.yml)

**Avvikelse — dold-isberg:** Förväntade 1 dolt type-fel (`APIResponse` i helpers.ts:133). `npm run typecheck:tests` avslöjade 8 totalt:
- 1× `APIResponse` (helpers.ts:133, känd och adresserad i prompten)
- 6× `process` (helpers.ts:30-35, `process.env`-användning utan Node-typer)
- 1× `URL` (tests/api/airtable-filter.test.ts:270, Node-runtime-global)

**Grundorsak:** `tsconfig.node.json` (som `tsconfig.tests.json` extends) har `"lib": ["ES2023"]` utan DOM och utan explicit `"types": ["node"]`. För `vite.config.ts`/`playwright.config.ts` löste TS:s automatic type acquisition Node-globaler tyst (alla `@types/*` i `node_modules` plockades in när inget `types`-fält var satt). Men kombinationen module-resolution + filtyper i `tests/` triggade att automatic acquisition inte räckte.

**Lösning (Marcus' val Alt 2 av 3-alternativs-popup från Code):** Installera `@types/node` som explicit devDep + lägg `"types": ["node"]` i tsconfig.tests.json som pekar på det. Motivering: explicit > implicit (Fas A-mönster), Dependabot-synlighet, 11/10-disciplin. Alt 1 (transitiv via @playwright/test peer) avvisades pga risken att Playwright slutar peera @types/node tyst. Alt 3 (lämna 7 fel som dokumenterad skuld) avvisades pga signalförlust.

**Versionsnot:** `@types/node` v25.6.2 installerades som ny devDep — npm valde patch utöver v25.6.0 som var transitivt installerad via Playwright peer-dep. Ingen reell version-flytt, bara explicit-deklarering.

**Verifieringssvit grön (K0åb.2 post-commit):**
- `npm run typecheck`: 0 fel
- `npm run typecheck:tests`: 0 fel (huvudverifiering — alla 8 dolda fel åtgärdade)
- `npm run lint`: 4 warnings (P3b-baseline) — nu 60 filer scannade istället för 59 pga ny tsconfig.tests.json
- `npm run build`: 325.37 kB / gzip 102.56 kB (oförändrad — typecheck-tillägget påverkar inte runtime)
- `npm run test:api`: 72 passed + 41 skipped (P3b-baseline)
- `npm audit`: 0 vulnerabilities

### 3.3 K0åc — CI test:api-split (startvillkor 3)
TBD — Code-prompt levereras efter K0åb committad. Två alternativ:
- **Alt A:** Dela `npm run test:api` i `test:api:pure` (vitest, ingen staging) + `test:api:staging` (vitest mot staging, hard-fail om TEST_*-env saknas). CI kör båda separat, staging-steg failar om secrets saknas.
- **Alt B:** Behåll en `test:api`-script, lägg till `if: ${{ secrets.TEST_SUPABASE_URL != '' }}`-villkor på test:api-stepen i CI. Då skipas hela stepen utan staging-secrets — synligare än "skipped 41 tests".

Marcus väljer Alt A eller Alt B i K0åc Code-prompten. Codex' rekommendation (per `docs/analysis/Codex-project-analysis-2026-05-07.md` Fråga 3 fynd 2) lutade mot Alt A för synlighet.

### 3.4 K0åd — byggplan.md:249 svenska statusvärden
TBD — `str_replace` i `docs/byggplan.md:249`. Engelska tokens (`pending, confirmed, cancelled, attended, no-show, waitlist`) ersätts med svenska Airtable-värden från `docs/reference/data-model.md:121-130` (`Bekräftad (mail skickat), Betalningspåminnelse skickad, Avbokad/Ombokad, Obekräftad, Flytta till väntelista, Inställt`). Anmärkning: `attended`/`no-show` finns inte i Airtable-källan över huvud taget — det är `AttendanceStatus`-värden som blandats in. Rätta DoD-formuleringen att hänvisa till data-model.md som källa.

### 3.5 K0åe — Zod parse i AirtableAdapter
TBD — `src/data/adapters/AirtableAdapter.ts:30, :41, :53` (typ-castade reads idag). Aktivera `.parse()` eller `.safeParse()` med befintliga Zod-scheman. Beslut: `.parse()` (throw) eller `.safeParse()` (Result-typ)? Påverkar error-flöde uppströms. **Eventuell ADR-trigger** — om runtime-validering-mönstret kodifieras som arkitekturbeslut, skriv ADR-026 "Runtime-validering vid datagräns". Annars en kommentar i SECURITY-SPEC §6 eller STATE-STRATEGY §3.

### 3.6 K0åf — KVALITETSDEFINITIONER-11.md Vue→React
TBD — 13 Vue/composables-träffar enligt P3b-verifiering. Två alternativ:
- **Alt A:** Skriv om för React (useState/useEffect-mönster, JSX-exempel, React Aria-hooks). Behåll filen som styrande.
- **Alt B:** Markera filen som legacy och flytta styrning till ny spec (t.ex. `docs/specs/KVALITETSDEFINITIONER-11-REACT.md`).

**Eventuell ADR-trigger** om Alt B väljs — ADR-027 "Kvalitetsdefinitioner-spec stack-skifte". Alt A kräver ingen ADR (omskrivning i samma fil).

---

## Del 4 — K2: Fas 2 implementation Part 1 — TanStack Router skelett

TBD — bakas in i K5.

**Förväntad output:**
- `vite.config.ts` — TanStack Router-plugin återinförs (togs bort i Fas 0)
- `tsr.config.json` — TanStack Router-konfiguration
- `src/routes/` — ny mapp för file-based routing
- `src/routes/__root.tsx` — root route med AuthProvider + ErrorBoundary + Suspense (skelett, full provider-logik i K3)
- Generated route tree (`src/routeTree.gen.ts` eller motsvarande)
- `src/main.tsx` — uppdaterad med `RouterProvider` (`initSentry()` från Fas A behålls FÖRE React-mount per P0-inventering rad 2.2)
- Router devtools + Query devtools, dev-only

**DoD-rad från byggplan §4 Fas 2:**
- 1 (delvis): `npm run dev` ger fungerande app utan crash (full login-redirect i K3)
- 5: Router devtools synliga i dev, inte i prod
- 7: `[GA]` Suspense-fallback på root visar laddningsindikator
- 8: `[GA]` Error boundary på root fångar router-fel + visar fallback

---

## Del 5 — K3: Fas 2 implementation Part 2 — AuthProvider + login/logout + skyddade routes

TBD — bakas in i K5.

**Förväntad output:**
- `src/auth/AuthProvider.tsx` — Context-provider mot Supabase session
- `src/auth/useAuth.ts` — hook för auth-state
- `src/routes/login.tsx` — login-vy (publik, ingen guard)
- `src/routes/index.tsx` — login-redirect-stub (`/` → `/login` eller `/hem` beroende på session)
- `beforeLoad`-guard på skyddade routes (placeholder-route `/hem` eller motsvarande)
- Logout-flöde — `supabase.auth.signOut()` + redirect

**Arkitektur-not (kritisk — från P0-inventeringen rad 2.3 + Codex' Fråga 1 startvillkor 2):**
`auth-provider.tsx` får INTE falla tillbaka på anon-key. Klientens `getAuthHeader()` faller idag tillbaka till anon key när session saknas (`src/data/config/supabase-client.ts:16`). I Fas 2 ska detta åtgärdas: skyddad route utan session → redirect till `/login` FÖRE Edge Function-anrop. Servern nekar anon key via `requireUser` (Fas A M2), men UI-flow ska aldrig komma dit.

**DoD-rad från byggplan §4 Fas 2:**
- 1: `npm run dev` ger fungerande login → redirect till `/hem` (placeholder)
- 2: Logout klart — session rensas, redirect till `/login`
- 3: Skyddad route utan session → automatisk redirect till `/login`

---

## Del 6 — K4: Fas 2 implementation Part 3 — nuqs + Playwright auth-fixture

TBD — bakas in i K5.

**Förväntad output:**
- nuqs `useQueryState` setup på test-route (t.ex. `/test?test=value`)
- `tests/playwright/fixtures/authenticatedPage.ts` (eller motsvarande path) — Playwright-fixture som loggar in mot Supabase med TEST_*-credentials
- Test-environment-koppling: fixture beroende av `TEST_SUPABASE_URL` + `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` env-vars. Hard-fail om saknas (kompletterar K0åc CI-split).

**DoD-rad från byggplan §4 Fas 2:**
- 4: nuqs `useQueryState` fungerar mot test-route med `?test=value`
- 6: Playwright auth-fixture (`authenticatedPage`) etablerad

**Korsreferens:** auth-fixture är 3:e komponenten av Codex' tre startvillkor (`docs/analysis/Codex-project-analysis-2026-05-07.md` Fråga 1 startvillkor 3). CI-split (K0åc) säkrar att fixture-frånvaro hard-failer; fixture-implementationen själv är K4.

---

## Del 7 — K5: Stop-test + lessons-skörd + ADR + bake-in

TBD — bakas in i K5.

### 7.1 Stop-test

Pass/fail per krav:

| Krav | Status | Verifiering |
|---|---|---|
| K0 6 åtgärder committade | TBD | `git log K1..K5 --oneline` visar 6 K0-commits |
| Fas 2 DoD 1-8 passerade | TBD | Manuell verifiering mot byggplan §4 Fas 2 + automatiserad test-svit |
| Playwright `authenticatedPage`-fixture grön mot test:e2e | TBD | `npm run test:e2e` (eller motsvarande) passerar |
| ADR:er committade (om relevanta) | TBD | `docs/decisions/` har eventuella ADR-026/-027 |
| Lessons-skörd lyft till lessons.md | TBD | `tasks/lessons.md` har Fas 2-sektion |
| Hub-synk klar (om UNIVERSAL-poster) | TBD | `~/Repon/marcus-system/tasks/lessons.md` synkad |
| `tasks/todo.md` uppdaterad | TBD | Fas 2 markerad ✅, Fas 2.5 listad som nästa |
| `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` uppdaterad (ADR-025) | TBD | "Senast uppdaterad"-stämpel bumpad + Fas 2-status reflekterad |
| Sessionsdok låst | TBD | Denna commit (K-sista) är touch nr 4 efter K1 (skelett) + K1.2 (K1+K0åa bake-in) + K1.3 (K0åb bake-in). Disciplin reviderad i header — K1.N bake-ins är etablerat mönster för Fas 2-sessionen, inte enstaka avsteg. |
| Transcript sparat | TBD — Marcus' beslut vid K5 mellan (a) återupptag transcript-disciplinen (skapa `tasks/sessions/transcripts/`-mappen + första transcript-save) eller (b) defer till separat process-runda. Frågan exponerades i K1-leveransen (mappen saknas i repot). | `tasks/sessions/transcripts/2026-05-11.txt` finns + Marcus' beslut dokumenterat — eller defer-not committad |

### 7.2 Lessons-skörd

TBD — fångas under sessionen. Kandidater fylls i löpande:

**Kandidat 1 — Semantisk path-ref vs mekanisk prefix-fix vid sessionsdok-arkivering [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K1-leveransen 2026-05-11, Code's självständiga byte av CLAUDE.md rad 153 + komplementär bumpa av rad 156

När en ref till en sessionsdok ska flyttas till `archive/` vid sessionsstart/-avslut, klassificera refen först: beskriver den dokets *identitet* ("se 2026-05-06-pre-fas2-verifiering.md") eller dokets *roll* ("just nu aktiv session", "senaste leveransen", "session N av M")? Identitets-refs ska få mekanisk archive-prefix per ADR-022 kategori 2. Roll-refs ska få semantisk uppdatering till nya rollens innehavare (det nya sessionsdoket som nu fyller rollen) — rollen har flyttat, inte dokets identitet. Klassrelaterade följdändringar (t.ex. "N sessionsloggar" → "N+1" för filstruktur-sannhet) görs i samma str_replace för konsistens.

**Mönstret:** vid arkivering, gå igenom alla ref-träffar och klassificera var och en innan str_replace körs. Frågan: "om jag tar bort denna ref och läser meningen runt, beskriver den ett dokument eller en roll?"

**Anti-mönster att undvika:** mekanisk path-prefix på roll-refs producerar nonsens-meningar (t.ex. "just nu aktiv session: archive/2026-05/pre-Fas-2..." — logiskt motsägelsefullt eftersom archive-prefix signalerar "inte aktiv").

**Generaliserbar:** gäller alla "aktiv X"-pekare som någonsin arkiveras (sessionsdok, ADR-status, fas-status, dokumentversioner). Föreslås UNIVERSAL-lyft + cross-repo-synk till `marcus-system/tasks/lessons.md` vid K5.

**Kandidat 2 — STOPPA-OCH-FRÅGA-mönster i Code-prompter fungerar [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åb-prompten 2026-05-11

Code-prompter som inkluderar explicit STOPPA-checkpoints vid förväntat-osäkra utfall (typ "STANNA om typecheck:tests visar fler än X fel") fångar dolda isberg som annars hade fortsatt orörda. K0åb-prompten innehöll: "STOPPA OCH FRÅGA om npm run typecheck:tests visar fler än 0 fel — vi vill verifiera att helpers.ts:18-fixen var den enda dolda type-buggen, inte bara den vi visste om." Code stannade exakt rätt vid 8 fel istället för att försöka maskera dem. **Generaliserbar regel:** när en åtgärd avslöjar tidigare osynliga delar av kodbasen (typecheck över ny path, lint över ny mapp, test över ny domän), bygg in STOPPA-OCH-FRÅGA i prompten innan IMPLEMENTERA-blocket. Förväntat: scope växer med 5-10× när luckor öppnas.

**Kandidat 3 — Implicit transitiv dep → explicit när direkt-användning kommer [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åb @types/node-beslut 2026-05-11

När `tests/` eller `src/` börjar referera typer/paket som funnits transitivt (via peer-deps eller indirect dependencies), lyft till explicit devDep/dep. Logisk ägandelogik: om koden använder det direkt, äger paketet sin position i package.json. Risk för implicit transitiv: (a) Dependabot ser inte uppdateringar, (b) version-fluktuation om peer-providern uppgraderas, (c) tyst-bryt om peer-providern slutar peera. **Generaliserbar regel:** vid varje "varför fungerar det här?" om en typ/funktion som inte är explicit deklarerad — lyft till explicit deklaration. Konsistens med Fas A "operations-baserat API explicit istället för fritt tableId"-mönster: explicit > implicit i alla riktningar.

**Kandidat 4 — Code applicerar tidigare commit-mönster automatiskt utan explicit instruktion när scope matchar [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åb två-commit-separation 2026-05-11

K0åb-prompten skrev inte explicit "dela i två commits". När Marcus svarade Alt 2 (install @types/node) applicerade Code spontant K0åa-mönstret (deps-install separerat från fix-commit) och producerade två commits (`a5a477b` + `1d02b3b`) utan att fråga. Resultatet var korrekt och följde best practice. **Generaliserbar regel:** Code internaliserar kommit-mönster över sessioner — om K_N använder ett mönster, K_(N+1) med liknande scope tenderar att följa det utan explicit prompt. Implikation för prompt-design: när ett tidigare mönster fungerade, behöver det inte upprepas i varje prompt; Code känner igen det. Men: om man vill avvika från etablerat mönster, MÅSTE det vara explicit i prompten. Tystnad = mönster-igenkänning.

**Kandidat 5 — Sessionsdok-disciplin revideras när avvikelse-volym kräver det [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K1.2 + K1.3 early bake-ins 2026-05-11

Ursprunglig sessionsdok-disciplin (P3a-mönster): "K1 + K-sista". I Fas 2 K1 + K0åa + K0åb genererade tillsammans 4 commit-hashar + 8 dolda type-fel + 5 lärdomskandidater + 3 K1-leverans-avvikelser. För mycket information för K-sista att baka in från Chat-kontext utan tappad detalj. Praktiskt mönster blev: **K1 (skelett) + K1.N bake-ins efter substantiella K0-sub-klungor + K-sista (full retrospektiv)**. Disciplin reviderad i sessionsdok-headern 2026-05-11 (K1.3). **Generaliserbar regel:** sessionsdok-disciplin är inte universell — den beror på faktisk avvikelse-volym per K. Lågvolyms-sessioner (få commits, få avvikelser) följer "K1 + K-sista". Högvolyms-sessioner (många commits, många avvikelser) behöver "K1 + K1.N bake-ins + K-sista". Beslutskriterium: när Chat-kontextens minne av exakt detaljer börjar tunnas, är det dags för bake-in. Disciplin tjänar dokumentet, inte tvärtom.

**Kandidat 6 — Verifieringsräkning i str_replace-prompter ska räkna alla refs i ny string [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K1.2-verifiering 2026-05-11

K1.2-prompten specificerade `grep -c "Kandidat 1" → 1 träff` som verifieringscheck. Faktisk träffmängd: 2 (rubriken i Del 7.2 + korslänk från Del 2). Båda specificerade i str_replace själv — räkningsmisstaget var Chat:s, inte Code's. **Generaliserbar regel:** när en str_replace-patch lägger till en identifierare på flera ställen (rubrik + korslänkar + commit-message-mention etc.), räkna alla förekomster i den nya texten innan verifieringsgreparna formuleras. Annars triggar Code "STOPPA OCH FRÅGA" på falsk positiv, vilket bryter flödet. **Mönstret:** efter att ha skrivit `new_str` för en str_replace, kör mental `grep -c "<token>"` på den nya texten + alla andra ändringar i patchen innan exakta siffror sätts i verifieringsblocket. Bättre: använd "minst X träffar" istället för "exakt X" när osäkerhet finns — Code STOPPAR bara på färre träffar, inte fler.

**Kandidat 7-N:** TBD — fångas under K0åc-K4.

### 7.3 ADR-kandidater

**Obligatoriska per byggplan §4 Fas 2 ADR-krav-rad:** Inga ("Inget nytt ADR krävs. URL-state-strategin följer befintlig `URL-STATE-SPEC.md`.").

**Möjliga sidoeffekt-ADR:er:**
- K0åe Zod parse i AirtableAdapter — ADR-026 "Runtime-validering vid datagräns" om mönstret kodifieras
- K0åf KVALITETSDEFINITIONER-11.md — ADR-027 "Kvalitetsdefinitioner stack-skifte" om Alt B (flytta styrning) väljs

Beslut tas i respektive K0-sub-klunga.

---

## Del 8 — Sammanfattning för framtida läsare

TBD — bakas in i K5.

### 8.1 Vad denna session levererade

TBD.

### 8.2 Vad denna session inte gjorde

TBD. Förväntade defer-poster:
- Fas 2.5-arbete (`Status.ts`-omskrivning 4→6 värden, övriga adapter-debt-metoder, full Zod-aktivering om K0åe blev partiell)
- Hem-vy + Event-vy (Fas 6a-e)
- Tab bar / app-shell (Fas 5)
- Optimistic mutations (Fas 5.5)

### 8.3 Vad nästa session ska göra

**Fas 2.5 — Schema-kontrakt-sync.** Mot `docs/byggplan.md` §4 Fas 2.5-prompt. Scope: `Status.ts` 4→6 statusvärden mot `data-model.md`, övriga enums granskade, Zod runtime-validering i AirtableAdapter-läsmetoderna (om K0åe blev partiell), adapter-debt-klassning av 9 metoder per ADR (P1 A5-tabellen). Inget EF deployas i förskott (M4-principen).

### 8.4 Var den auktoritativa Fas 2-trailen finns

- **Denna fil:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-11-fas2-routing-auth.md` (efter K5: arkiveras till `archive/2026-05/` när Fas 2.5 startar per ADR-023)
- **K1-commit (sessionsdok + pre-Fas-2-arkivering):** TBD
- **K0åa-K0åf commits:** TBD (6 commits)
- **K2-K4 commits:** TBD (uppskattningsvis 5-8 commits beroende på splitt)
- **K5 sista commit (bake-in):** TBD
- **Lessons-poster lyfta:** TBD
- **ADR:er (om relevanta):** TBD
- **Total ADR-räkning efter Fas 2:** TBD (idag 24, kan bli 24-26)

### 8.5 Slutprodukten

TBD. Förväntad sluttillstånd:
- `npm run dev` ger fungerande login → /hem (placeholder)
- Logout fungerar
- Skyddade routes redirectar utan session
- nuqs `useQueryState` fungerar
- Router/Query devtools dev-only
- Suspense + Error boundary på root
- Playwright `authenticatedPage`-fixture grön
- 6 K0-åtgärder committade (3 startvillkor + 3 "direkt efter Fas 2"-fynd)
- Verifieringssvit grön: typecheck 0 fel, lint baseline-warnings, build grön (JS-storlek bumpad av nuqs + TanStack Router-runtime), test:api passing+skipped enligt baseline, npm audit 0 vulnerabilities, test:e2e grön mot authenticatedPage

### 8.6 Eventuella nya lärdomskandidater för framtida UNIVERSAL-lyft

TBD.

---

## Appendix A — K1 Code-prompt-mall (refereras från Chat-leverans 2026-05-11)

K1.B Code-prompten levereras inline i Chat efter denna fil placerats i Marcus' Downloads. Strukturen följer P3a/Pre-Fas-2-mönstret:

1. LÄS — `~/Repon/miranon-media-admin/CLAUDE.md`, `tasks/sessions/` (verifiera platthet), `docs/decisions/ADR-023-sessions-arkivering.md` (konvention)
2. RAPPORTERA — working tree status, befintlig `tasks/sessions/`-innehåll, bekräfta att `2026-05-06-pre-fas2-verifiering.md` finns i roten och inte redan i archive
3. PLANERA — `mv pre-Fas-2-doket` till `archive/2026-05/`, `mv` ny sessionsdok från Downloads till `tasks/sessions/`-roten, uppdatera ev. path-refs i andra dokument (CLAUDE.md, todo.md) som pekar mot pre-Fas-2-doket
4. IMPLEMENTERA — 2 `mv` + ev. `str_replace` för path-refs
5. VERIFIERA — `git diff --stat` visar exakt 2-4 filer (2 mv:s + ev. 1-2 ref-updates), inga oönskade ändringar
6. COMMITTA — message: "docs(fas2): start Fas 2 session document + archive pre-Fas-2 per ADR-023" + push
7. DOKUMENTERA — säg till Marcus: "K1 klart. Sessionsdok i tasks/sessions/-roten, pre-Fas-2 arkiverad. Redo för K0åa nuqs-install."
