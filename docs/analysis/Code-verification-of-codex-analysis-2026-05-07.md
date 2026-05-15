<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->
<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# Code's verifiering av Codex' projektanalys (post-Pre-Fas-2)

*Datum: 2026-05-07 | Verifierat mot HEAD `e0ec446` (main, ren worktree förutom Codex-analysen + denna fil)*
*Författare: Claude Code (Opus 4.7) — direkt mot kodbas, inte minnesbild*
*Källa: [`docs/analysis/Codex-project-analysis-2026-05-07.md`](Codex-project-analysis-2026-05-07.md) (2026-05-07)*

> **Not om filnamn:** Marcus' uppdragsbrev föreslog `…2026-05-06.md` "för konsekvens med sessions-datum". Codex har dock satt `Datum: 2026-05-07` i sitt eget dokument och filen sparades i repot som `…2026-05-07.md`. Jag följer den faktiska artefaktens datum istället för uppdragsbrevets antagande, så de två filerna delar suffix.

---

## Sammanfattning

Codex' analys håller. Verifieringsbasen (typecheck, lint, build, test:api, audit) matchar **exakt** mot vad jag får när jag kör om kommandona på samma HEAD. Alla sju nya fynd är verifierade mot faktiska kodrader. De tre startvillkoren för Fas 2 (nuqs, typecheck:tests, auth-fixture-signal) är var för sig korrekt identifierade och löser var sin reell defekt.

Det finns **ett** ställe där Codex marginellt överstryker — Grafanas pa11y-integration är "in progress", inte "i CI" som Codex formulerar det. Det förändrar inte slutsatsen.

Det finns **ingen** axel där Codex underskattar. Jag hittade inget han missat. Jag hittade inget han överdrivit (utöver Grafana-detaljen).

**Min sammanfattade dom:** Codex' "snäva ja för Fas 2" är rätt kalibrerat. Skärper det inte och mjukar inte upp det. Den centrala observationen — *"projektet är två olika saker samtidigt: ovanligt stark process- och säkerhetsgrund, och fortfarande nästan ingen faktisk app"* — är exakt sann och bör inte maskeras av att Pre-Fas-2-rundan producerade visuell professionalitet (badges, CHANGELOG, .github/-paket). Säkerhetsfixarna i Fas A är reella; UI-implementationen är fortfarande noll.

---

## Verifieringsbas

Jag körde de fem kommandona Codex listade. **Alla fem siffror matchar 100 %.**

| Kommando | Codex' resultat | Mitt resultat | Matchar |
|---|---|---|---|
| `git status --short` | tom (före analysfil) | tom (förutom analysfilen + denna fil) | ✓ |
| `npm run typecheck` | 0 fel | 0 fel (exit 0) | ✓ |
| `npm run lint` | exit 0, 4 varningar | exit 0, 4 varningar (alla `!important` i `src/styles/base.css:73-75`) | ✓ |
| `npm run build` | JS 325.37 kB / gzip 102.56 kB | JS 325.37 kB / gzip 102.56 kB (`built in 442ms`) | ✓ |
| `npm run test:api` | 72 passed, 41 skipped | 72 passed, 41 skipped (2.2s) | ✓ |
| `npm audit --audit-level=moderate` | 0 vulnerabilities | 0 vulnerabilities | ✓ |

**Anmärkning:** PostCSS-advisoryn som var moderate i förra verifieringen (2026-04-29) är borta i nuvarande dependency graph. Det är en faktisk förbättring, inte en tolkningsskillnad.

HEAD vid mina körningar: `e0ec4463383d722993598971397dfefeb8df0091` — identisk med vad Codex citerar.

---

## Verifiering per blocker (Codex' Fråga 2 — har 2026-04-28-blockers åtgärdats?)

### Blocker 1 — Säkerhetsmodellen ikapp spec

**Codex skriver:** *"I huvudsak åtgärdad för dåvarande attackyta. requireUser() validerar bearer-token mot Supabase Auth och nekar anon role"* + 6 fil-rad-citat.

**Verifierat — alla citat stämmer mot HEAD:**

- [`supabase/functions/_shared/auth.ts:41`](../../supabase/functions/_shared/auth.ts#L41) — `export async function requireUser(req, corsHeaders): Promise<AuthContext | Response>` ✓
- [`auth.ts:76`](../../supabase/functions/_shared/auth.ts#L76) — `const { data, error } = await supabase.auth.getUser(token);` ✓
- [`auth.ts:82`](../../supabase/functions/_shared/auth.ts#L82) — `if (data.user.role === 'anon')` defensiv check ✓
- [`cors.ts:29`](../../supabase/functions/_shared/cors.ts#L29) — `getAllowlist()` env-driven ✓
- [`cors.ts:48`](../../supabase/functions/_shared/cors.ts#L48) — `corsHeadersFor(req)` per-request ✓
- [`cors.ts:60`](../../supabase/functions/_shared/cors.ts#L60) — `handleCors(req)` med deny-by-default på preflight ✓
- [`update-record/index.ts:7`](../../supabase/functions/update-record/index.ts#L7) — `// Operations-baserad write-API (M4).` ✓
- [`field-allowlists.ts:26`](../../supabase/functions/_shared/field-allowlists.ts#L26) — `const OPERATIONS: Readonly<Record<string, OperationDef>> = {}` (registret tomt) ✓
- [`airtable-filter.ts:63, :127, :136, :149`](../../supabase/functions/_shared/airtable-filter.ts) — `escapeFormulaValue`, `buildLinkedRecordFilter`, `buildEqualsFilter`, `buildSearchAcrossFieldsFilter` ✓
- [`create-admin-user/index.ts:36, :45, :58`](../../supabase/functions/create-admin-user/index.ts) — auth-gate, ADMIN_EMAILS-konfigcheck, `isAdminEmail`-allowlist ✓

**Codex' nyans (riktig):** *"Kvar: ingen riktig RBAC/tenant/membership-modell än; GET-funktioner ger alla autentiserade users full läsrätt."* Verifierat mot [`get-events/index.ts:42-66`](../../supabase/functions/get-events/index.ts#L42-L66): `requireUser` anropas men `auth.user.id` används bara för error-logging (line 63), inte för record-scope eller role-scope filter. Identisk struktur i `get-persons` och `get-registrations`. Codex' formulering är precis.

**Bedömning:** Stark fix, korrekt nyanserad av Codex. Ingen anmärkning.

---

### Blocker 2 — Appen är placeholder

**Codex skriver:** *"Inte åtgärdad, och ska inte vara det än. App() renderar h1 + p (`src/main.tsx:17`). Inga `src/routes`, `src/auth`, `src/components` finns."*

**Verifierat:**

- [`src/main.tsx:17`](../../src/main.tsx#L17) — `function App() { return ( <main>...<h1>Miranon Media Admin</h1><p>Fas 0 — projektsetup klar.</p> )` ✓
- `ls src/` ger: `data/`, `domain/`, `env.ts`, `lib/`, `main.tsx`, `observability/`, `styles/`. **Inga** `routes/`, `auth/`, `components/`, `pages/`, `views/`, `hooks/`, `features/`. ✓

Codex' formulering "0/10 app fortfarande" stämmer ord för ord. Detta är samma observation jag gjorde i förra rundan. Pre-Fas-2-arbetet förändrade inget om denna axel.

**Bedömning:** Korrekt. Inte en Fas 2-blocker (det är Fas 2:s uppgift att fylla denna lucka).

---

### Blocker 3 — Accessibility checklist stale Vue/FKUI

**Codex skriver:** *"Åtgärdad i huvudfilen. ACCESSIBILITY-CHECKLIST.md är nu React 19 + React Aria + WCAG 2.2 AA, med axe/Playwright och manuell testmatris. Men KVALITETSDEFINITIONER-11.md är fortfarande Vue-specifik."*

**Verifierat:**

- [`docs/specs/ACCESSIBILITY-CHECKLIST.md:1-13`](../specs/ACCESSIBILITY-CHECKLIST.md#L1-L13) — `> Skapad: 2026-04-01 (Vue/FKUI-version) | Omskriven: 2026-05-04 (P2 stödspec-synk → React Aria + WCAG 2.2 AA) | Gäller: miranon-media-admin (React 19 SPA)` ✓
- Innehåll bekräftar React Aria + axe-core + @axe-core/playwright + manuell screen-reader-matrix (VoiceOver/NVDA/TalkBack) ✓
- [`docs/specs/KVALITETSDEFINITIONER-11.md:21`](../specs/KVALITETSDEFINITIONER-11.md#L21) — `Alla props och emits typade` ✓ (Vue-specifikt: `emits` är ett Vue-koncept)
- [`KVALITETSDEFINITIONER-11.md:27`](../specs/KVALITETSDEFINITIONER-11.md#L27) — `Inga externa beroenden utöver Vue 3` ✓
- [`KVALITETSDEFINITIONER-11.md:121-122`](../specs/KVALITETSDEFINITIONER-11.md#L121-L122) — `Alla konfigurerbara värden via props / Alla händelser via emits` ✓
- [`KVALITETSDEFINITIONER-11.md:139`](../specs/KVALITETSDEFINITIONER-11.md#L139) — `<MmAccordion v-model:value="activeSection">` (v-model: Vue-specifikt) ✓

**Min utökade kontroll:** Jag sökte efter `Vue|emit|v-model|scoped slot|composable|onMounted` i alla styrande specs:

| Fil | Träffar | Är det aktivt Vue-innehåll? |
|---|---|---|
| `KVALITETSDEFINITIONER-11.md` | 13 | **Ja — hela dokumentet är Vue-formulerat** |
| `ARIA-UPGRADE.md` | 1 | Nej — hänvisar bara till "Resizable sidebar från Vue-projektet" som historisk kontext |
| `SPA-ARCHITECTURE-DECISION.md` | 3 | Nej — alla är retrospektiva ("bevisat i Vue-projektet", `conversion-plan.md` referens) |
| `DESIGN-SYSTEM-SPEC.md`, `STATE-STRATEGY.md`, `URL-STATE-SPEC.md`, `PERFORMANCE-BUDGET.md` | 0 | n/a |

Codex' diagnos är exakt: KVALITETSDEFINITIONER-11.md är det enda spec-dokumentet som *fortfarande styr* från Vue-perspektiv. Det är ett reellt gap som P2 stödspec-synk missade.

**Bedömning:** Korrekt fynd. Detta var inte synligt i förra rundans verifiering eftersom KVALITETSDEFINITIONER-11.md inte fanns då. Det är ett nytt observerbart problem som introducerades genom P2-arbetet.

---

### Blocker 4 — Zod-scheman inte runtime-kontrakt

**Codex skriver:** *"Inte åtgärdat. Schemana finns men används inte med .parse()/.safeParse() i app/Edge Functions. AirtableAdapter castar response till generics."*

**Verifierat — det enda som behövdes var en grep, så jag körde flera:**

```text
grep -rn "\.parse\|\.safeParse\|parseAsync\|safeParseAsync" src/ supabase/
→ noll träffar för Zod-bruk
```

```text
grep -rn "parse" src/ supabase/ | grep -v node_modules
→ bara: parseInt(), parseAirtableString() (formula-utility)
```

Det enda stället zod används som validator i koden är [`src/env.ts:14-19`](../../src/env.ts#L14-L19) via `@t3-oss/env-core`, vilket validerar `VITE_*`-variabler vid uppstart — inte Airtable-datakontrakt.

**Schema-filerna existerar** ([`src/domain/schemas/`](../../src/domain/schemas/)): 8 filer (`Event.schema.ts`, `Person.schema.ts`, `Registration.schema.ts`, `Attendance.schema.ts`, `Engagement.schema.ts`, `Lead.schema.ts`, `MailPayload.schema.ts`, `WaitlistEntry.schema.ts` + `index.ts`). De importeras inte av någon adapter eller Edge Function.

**Adapter-citat verifierade:**

- [`AirtableAdapter.ts:30`](../../src/data/adapters/AirtableAdapter.ts#L30) — `async fetchEvents(): Promise<Event[]>` (typ-cast via generic på callEdgeFunction) ✓
- [`:41`](../../src/data/adapters/AirtableAdapter.ts#L41) — `callEdgeFunction<{ registrations: Registration[] }>('get-registrations', ...)` ✓
- [`:53`](../../src/data/adapters/AirtableAdapter.ts#L53) — `callEdgeFunction<{ persons: Person[] }>('get-persons', ...)` ✓

`callEdgeFunction<T>` returnerar `(await res.json()) as T` ([`supabase-client.ts:52`](../../src/data/config/supabase-client.ts#L52)) — en strukturlös type-assertion. Ingen runtime-validering av shape.

**Bedömning:** Korrekt fynd. Som Codex säger: *"Fortfarande blocker för data-UI, inte för Fas 2 routing/auth. Fas 2.5 har rätt scope."*

---

### Blocker 5 — Domäntyper inte i sync med Airtable-modell

**Codex skriver:** *"Inte åtgärdat. Status.ts har fyra anmälningsstatusar (`Status.ts:3`), medan data-model.md listar sex inklusive Flytta till väntelista och Inställt."*

**Verifierat:**

[`src/domain/types/Status.ts:3-8`](../../src/domain/types/Status.ts#L3-L8):

```ts
export const RegistrationStatus = {
  OBEKRAFTAD: 'Obekräftad',
  BEKRAFTAD: 'Bekräftad (mail skickat)',
  BETALNINGSPAMINNELSE: 'Betalningspåminnelse skickad',
  AVBOKAD: 'Avbokad/Ombokad',
} as const;
```

**4 värden.** ✓

[`docs/reference/data-model.md:121-130`](../reference/data-model.md#L121-L130):
> `Anmälningar.Status (fldWr5cCPNx9HEKtL) — **6 val per 2026-04-28:**`
> Bekräftad (mail skickat), Betalningspåminnelse skickad, Avbokad/Ombokad, Obekräftad, **Flytta till väntelista** (tillagd april 2026), **Inställt** (Ny 2026-04-26)

**6 värden.** ✓ Skillnad: 2 saknas i koden (`Flytta till väntelista` + `Inställt`).

**Bedömning:** Korrekt fynd, exakt drift. Medveten Fas 2.5-skuld per [`docs/byggplan.md:224`](../byggplan.md#L224).

---

### Blocker 6 — Playwright konfigurerat men ingen testsvit

**Codex skriver:** *"Delvis åtgärdat. tests/api finns med 113 test cases; 72 pure helper-tester passerar lokalt. Deployade deny-paths är env-beroende och skippas lokalt."*

**Verifierat:**

- `npm run test:api` ger `72 passed, 41 skipped` ✓ (matchar Codex)
- [`tests/api/helpers.ts:37-40`](../../tests/api/helpers.ts#L37-L40) — `test.skip(!baseUrl || !anonKey || !userEmail || !userPassword || !adminEmail || !adminPassword, '…')` ✓
- Lokalt saknas dessa env-variabler → 41 staging-tester skippas, 72 pure helper-tester körs ✓
- [`playwright.config.ts:39`](../../playwright.config.ts#L39) — visual-projektet är konfigurerat men inga vy-tester finns ännu (det är Fas 3+)

**Codex' nyans (kritisk):** *"Om GitHub saknar TEST_*-secrets blir `npm run test:api` grön utan att staging-auth verifieras."* — Detta är ett reellt CI-signalproblem. Verifiering: [`.github/workflows/ci.yml:36-37`](../../.github/workflows/ci.yml#L36-L37) kör bara `npm run test:api` utan att kräva env. Om secrets inte är satta i repo-settings → grön CI utan att deny-paths (anon-key → 401, ogiltig-JWT → 401, m.fl.) verifieras.

**Bedömning:** Korrekt fynd och korrekt nyans. Detta är ett av Codex' tre startvillkor.

---

### Blocker 7 — Designsystemet är början, inte bevis

**Codex skriver:** *"Inte åtgärdat i kod. Tokens och helpers finns; inga komponenter."*

**Verifierat:**

- [`src/styles/`](../../src/styles/) innehåller `base.css`, `tailwind.css`, `tokens/` (3-lagers per ADR/spec). ✓
- Inga `src/components/`, inga UI-komponenter någonstans. ✓ (samma observation som Blocker 2)
- Plan-axel: byggplan.md har Fas 3 (UI-primitiver) + Fas 3.5 (test-infra) som egen fas per [ADR-020](../decisions/ADR-020-fas-3-5-egen-fas.md). ✓

**Bedömning:** Korrekt. *"Fortfarande 0% komponentbibliotek. Planen är däremot bättre nu."*

---

### Blocker 8 — Dependency-hygien

**Codex skriver:** *"Delvis åtgärdad. npm audit clean, Dependabot finns. CI kör lint/typecheck/test/build, men inte npm audit, npm audit signatures, Socket eller overrides trots SECURITY-SPEC §4."*

**Verifierat:**

- [`.github/dependabot.yml:1`](../../.github/dependabot.yml#L1) — `version: 2` med npm weekly + github-actions monthly + grupperade updates (tanstack, react-aria, types, tailwind) ✓
- [`.github/workflows/ci.yml:30-40`](../../.github/workflows/ci.yml#L30-L40) — Biome check, TypeScript check, API tests, Build. **Inget `npm audit`-steg.** ✓
- [`docs/specs/SECURITY-SPEC.md:296`](../specs/SECURITY-SPEC.md#L296) — `#### 2. npm audit som preinstall-hook` (specifierat men inte implementerat) ✓
- [`SECURITY-SPEC.md:317`](../specs/SECURITY-SPEC.md#L317) — `#### 4. npm provenance (Sigstore) | npm audit signatures | Lägg till i CI-pipeline` (specifierat men inte i CI) ✓
- [`SECURITY-SPEC.md:383`](../specs/SECURITY-SPEC.md#L383) — `| A06 | Vulnerable Components | Medel | Delvis | npm audit, men inga automatiserade kontroller i CI. Se paragraf 4 |` ✓
- [`package.json:6-15`](../../package.json#L6-L15) — `scripts` saknar `preinstall`/`postinstall` ✓
- `package.json` saknar `overrides`-block (verifierat: `grep -c 'overrides' package.json` → 0)

**Bedömning:** Korrekt fynd. Specifikationen finns, implementationen inte ännu.

---

## Verifiering per nytt fynd (Codex' Fråga 3 — nya svagheter)

### Nytt fynd 1 — "Auth" är authentication, inte authorization

**Codex' kärnobservation:** *"`requireUser()` returnerar bara `id`, `email`, `role` från Supabase, och GET-funktionerna använder detta för logging men inte för record-scope eller role-scope. Alla giltiga user-JWTs kan läsa events/persons/registrations."*

**Verifierat ord för ord:**

- [`auth.ts:86-92`](../../supabase/functions/_shared/auth.ts#L86-L92):

  ```ts
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    },
  };
  ```

  Bara tre fält. Ingen `tenant_id`, `memberships`, `role`-scope, `record_filter`. ✓

- [`get-events/index.ts:49-65`](../../supabase/functions/get-events/index.ts#L49-L65):

  ```ts
  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const records = await fetchFromAirtable(TABLE_ID);
    const events = records.map(mapEvent);
    return new Response(JSON.stringify({ events }), {...});
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-events',
      method: req.method,
      callerUserId: auth.user.id,    // ← bara för error-logging
    });
  }
  ```

  `auth.user.id` används endast i error-loggningskontexten på rad 63. Ingen filtrering på vem som får läsa vilka records. ✓

Identisk struktur i `get-persons/index.ts` och `get-registrations/index.ts` (verifierat via grep — bara `callerUserId: auth.user.id` i loggningskontext, ingen scope-filtrering).

**Codex' rekommendation:** *"Fas 2 ska minst ha en isAllowedAdminUser-gate i AuthProvider eller server-side helper, antingen via ADMIN_EMAILS för pre-S-track eller en tydligt dokumenterad 'alla skapade users är admins'-policy."*

**Min bedömning:** Helt korrekt. Detta är en reell skillnad mellan "auth som gate (vem som helst med JWT)" och "auth som behörighetsmodell (vem får göra vad)". `create-admin-user` har redan `ADMIN_EMAILS`-allowlist (verifierat via [`create-admin-user/index.ts:58`](../../supabase/functions/create-admin-user/index.ts#L58) — `if (!isAdminEmail(user.email))`), så samma mönster kan återanvändas i GET-funktionerna eller i Fas 2:s AuthProvider.

---

### Nytt fynd 2 — API-testsviten kan ge falsk grön CI

**Verifierat:**

- [`tests/api/helpers.ts:29-40`](../../tests/api/helpers.ts#L29-L40):

  ```ts
  export function getApiConfig(): ApiConfig {
    const baseUrl = process.env.TEST_SUPABASE_URL;
    // ...6 env-variabler...
    test.skip(
      !baseUrl || !anonKey || !userEmail || !userPassword || !adminEmail || !adminPassword,
      'API-tester kräver TEST_SUPABASE_URL, ...'
    );
    ...
  }
  ```

  Skippet är inkluderat — det är inte en bug. Men CI-effekten är reell.

- [`.github/workflows/ci.yml:36-37`](../../.github/workflows/ci.yml#L36-L37):

  ```yaml
  - name: API tests
    run: npm run test:api
  ```

  Inget `if: ${{ secrets.TEST_SUPABASE_URL }}`-villkor. Inget `env:`-block som kräver att variabler är satta. Inget separat staging-jobb.

**Konsekvens:** Om Marcus' GitHub-repo saknar `TEST_*`-secrets (verifiering kräver att jag tittar i settings, vilket jag inte kan via Code), kommer CI-jobbet rapportera grönt även om de 41 deployade deny-path-testerna aldrig körs. Detta är exakt det "signalproblem" Codex identifierar.

**Codex' rekommenderade split:** `test:api:pure` (alltid) + `test:api:staging` (kräver env, failar om saknas). Vettig design.

**Bedömning:** Korrekt fynd och korrekt remedy. Andra startvillkoret för Fas 2.

---

### Nytt fynd 3 — Testfiler är inte typecheckade

**Verifierat:**

- [`tsconfig.app.json:30`](../../tsconfig.app.json#L30) — `"include": ["src"]` ✓ (inte `tests`)
- [`tsconfig.node.json:21`](../../tsconfig.node.json#L21) — `"include": ["vite.config.ts", "playwright.config.ts"]` ✓ (inte `tests`)
- `tsconfig.json` finns men består av `references` till de två ovan (typisk Vite-mall)

**Den faktiska bug:en Codex pekar på:**

[`tests/api/helpers.ts:18`](../../tests/api/helpers.ts#L18):

```ts
import { type APIRequestContext, test } from '@playwright/test';
```

**Importerar bara `APIRequestContext` och `test`.** Inte `APIResponse`.

[`tests/api/helpers.ts:133`](../../tests/api/helpers.ts#L133):

```ts
export async function classify401Body(response: APIResponse): Promise<UnauthorizedClassification> {
```

**Använder `APIResponse` som typ-annotation utan import.** Detta är en reell type-error som TypeScript skulle fånga om filen var i någon `tsconfig`-include-path.

Varför funkar det vid runtime? Playwright transpilerar via tsx/esbuild, vilket strippar typ-annotationer utan att verifiera dem. `APIResponse` försvinner från output, och funktionen tar bara `response` som vanligt argument. Det fungerar **i praktiken**, men type-säkerheten är inte bevisad.

**Bedömning:** Korrekt fynd. Tredje startvillkoret för Fas 2 — antingen lägg till `tests/**/*.ts` i en `tsconfig.tests.json` eller skapa `npm run typecheck:tests`.

---

### Nytt fynd 4 — `test-auth` är en deploy-policy-risk

**Verifierat:**

- [`supabase/config.toml:8-10`](../../supabase/config.toml#L8-L10):

  ```toml
  # TODO Fas 7 — test-*-funktioner får ALDRIG nå produktion. När
  # prod-deploy-pipelinen byggs måste den filtrera bort dem explicit.
  ```

  ✓

- [`config.toml:19-20`](../../supabase/config.toml#L19-L20):

  ```toml
  [functions.test-auth]
  verify_jwt = false
  ```

  ✓

**Codex' analys av risknivå:** *"Låg till medel: endpointen exponerar bara `{ ok, userId }` efter requireUser, men en test-endpoint med bypassad gateway-JWT i prod är fel säkerhetssignal."*

Jag verifierade test-auth-funktionens innehåll:

```bash
ls supabase/functions/ | grep test
→ test-auth (mappnamn)
```

test-auth finns som mapp men deployas inte automatiskt — den måste explicit listas i deploy-kommandot. Risken är att en framtida deploy-pipeline (Fas 7) glömmer att filtrera. Codex' poäng: filtrering ska komma TIDIGARE än Fas 7 om någon prod-deploy kan ske före dess.

**Bedömning:** Korrekt fynd. Inte akut men reellt.

---

### Nytt fynd 5 — Planen har minst två konkreta driftfel

**Driftfel A — nuqs saknas i package.json:**

[`docs/byggplan.md:168`](../byggplan.md#L168) — `Etablera fil-baserad routing (TanStack Router) + Supabase-autentisering + URL-state-hantering (nuqs)` ✓
[`byggplan.md:175`](../byggplan.md#L175) — `nuqs för URL-state` ✓
[`byggplan.md:203`](../byggplan.md#L203) — `nuqs useQueryState fungerar mot test-route med ?test=value` ✓

[`package.json:16-40`](../../package.json#L16-L40) — `dependencies`-blocket innehåller **ingen** `nuqs`. Verifierat via `grep -i nuqs package.json` → noll träffar. ✓

**Driftfel B — engelska statusvärden i byggplan.md DoD:**

[`byggplan.md:224`](../byggplan.md#L224) — `Status.ts skrivs om: 4 → 6 statusvärden för Anmälningar (mot data-model.md 2026-04-26)` ✓ (korrekt formulering)

[`byggplan.md:249`](../byggplan.md#L249) — `Status.ts har 6 värden matchande data-model.md (pending, confirmed, cancelled, attended, no-show, waitlist — exakt enum-värden bekräftas mot källan vid sessionsstart)` ✗

[`docs/reference/data-model.md:121-130`](../reference/data-model.md#L121-L130) — Källan listar **svenska** Airtable-värden: `Bekräftad (mail skickat)`, `Betalningspåminnelse skickad`, `Avbokad/Ombokad`, `Obekräftad`, `Flytta till väntelista`, `Inställt`.

Codex' diagnos är exakt: byggplan-DoD listar sex engelska tokens (`pending`, `confirmed`, `cancelled`, `attended`, `no-show`, `waitlist`) som **inte är 1:1-mappbara mot källan**. `attended` och `no-show` finns inte i Airtable-källan över huvud taget — det är `AttendanceStatus`-värden (`Närvarande`/`Frånvarande`) som blandats in. Detta är exakt den sorts mikroskopiska plan-drift som producerar en dum enum-implementation om någon (mänsklig eller AI) följer planen utan att läsa data-model.md först.

**Bedömning:** Båda driftfelen är reella och måste rättas i Fas 2-prompten respektive byggplan.md:249. Codex' formulering "exakt den sortens mikroskopiska plan-drift" är inte alarmism — det är hur dålig kod skrivs.

---

### Nytt fynd 6 — Repo-polish är bättre, men vissa publika signaler är felaktiga

**6.A — Quickstart kopierar `.env.local.example` som inte finns:**

[`README.md:47-50`](../../README.md#L47-L50):

```bash
npm install
cp .env.local.example .env.local   # lägg in Supabase URL + anon key
npm run dev
```

`ls -la .env*` ger:

- `.env.example` (620 bytes) ✓ existerar
- `.env.local` (241 bytes) ✓ existerar (egen)
- `.env.test` (534 bytes) ✓
- `.env.test.example` (893 bytes) ✓

**`.env.local.example` saknas.** ✓ Codex har rätt — `cp` kommandot faller direkt vid första körning.

**6.B — README listar test:visual men inte test:api:**

[`README.md:53-64`](../../README.md#L53-L64) — Scripts-tabellen listar:
| Kommando | Beskrivning |
| `npm run dev` | ... |
| `npm run build` | ... |
| `npm run preview` | ... |
| `npm run typecheck` | ... |
| `npm run lint` | ... |
| `npm run format` | ... |
| `npm run test:visual` | Playwright visuella regressionstester |

**`npm run test:api` saknas i tabellen.** Verifierat. Men [`package.json:14`](../../package.json#L14) har `"test:api": "playwright test --project=api"`. ✓

Codex' poäng: testet som är *huvudbeviset* för Fas A:s säkerhetsfixar är osynligt för en utomstående läsare av README. Det är ett professionalitetsgap, inte en bugg.

**6.C — Workbox är inte dependency:**

[`README.md:81`](../../README.md#L81) — `| Offline | Workbox (service worker) |` ✓
[`public/sw.js:1-21`](../../public/sw.js#L1-L21) — Skelett: `install` → `skipWaiting`, `activate` → `clients.claim`, `fetch` → no-op. Kommentar: `Workbox läggs på i Fas 5`. ✓
[`package.json:16-40`](../../package.json#L16-L40) — Workbox finns inte i `dependencies` eller `devDependencies`. ✓

Codex' formulering "Offline | Workbox" i README antyder att det är aktiv stack idag, men det är planerat. Inte fel formellt — tabellen heter "Stack", och Workbox är planerad stack — men det signalerar mer mognad än som finns.

**6.D — docs/README.md beskriver bara Design Docs:**

[`docs/README.md:1`](../README.md#L1) — `# Design Docs`
Hela filen handlar om `DESIGN-MANIFESTO.md` + `DESIGN-OPERATING-SYSTEM.md`. Inga referenser till `analysis/`, `archive/`, `decisions/`, `features/`, `logs/`, `reference/`, `research/`, `specs/`.

`ls docs/` ger:

```text
BUILD-LOG.md  DOKUMENTATIONSSTANDARD.md  README.md  analysis  archive
byggplan.md  decisions  features  logs  reference  research  specs
```

8 undermappar + 4 toppfiler — och docs/README.md beskriver inget av detta. ✓

**Bedömning:** Alla fyra punkter under "publik professionalitet" är reella signaler som motsäger varandra: badges + CHANGELOG + .github/-paket säger "moget repo", men quickstart-kommandot är trasigt och docs/README.md är från en annan era. Detta är samma mönster som FK-designsystemet har lärt mig: små inkonsistenser i publika signaler kostar mer förtroende än stora luckor i interna dokument.

---

## Världsklassjämförelse — verifiering av externa källor

Jag fact-checkade Codex' bärande påståenden mot offentliga källor (URLs som Codex listar i §"Externa källor"). Jag fact-checkade inte trivialiteter ("Kubernetes har en separat security-response-repo"); fokuserade på påståenden som bär jämförelsen.

### Backstage ADR-process

**Codex påstår:** *"records aldrig raderas utan markeras superseded/deprecated, och att nya ADRs går via PR, feedback, numrering och docs-sidebar/mkdocs-indexering."*

**WebFetch mot <https://backstage.io/docs/architecture-decisions/>:**

> "Records are never deleted but can be marked as superseded by new decisions or deprecated."
> Process: PR → community feedback → "Eventually, assign a number"
> Integration: "add the path of the ADR to the microsite sidebar in `sidebars.ts`" + `mkdocs.yml`

**Bedömning:** Codex' påstående verifierat. Helt korrekt.

### GOV.UK Design System accessibility

**Codex påstår:** *"WCAG 2.2 AA compliance, dokumenterar kända accessibility concerns och externa audits av DAC."*

**WebFetch mot <https://design-system.service.gov.uk/accessibility-statement/>:**

> "fully compliant with the Web Content Accessibility Guidelines (WCAG) version 2.2 AA standard"
> External audits: "Digital Accessibility Centre (DAC)" (juli 2024)
> Coverage: både design-system-website och Frontend codebase + components-examples

**Bedömning:** Verifierat. Helt korrekt.

### Grafana accessibility

**Codex påstår:** *"delvis conformant WCAG 2.1 AA, listar begränsningar som charts, contrast och keyboard support, och beskriver både manual screen-reader matrix och pa11y/CI-fail vid a11y-regressioner."*

**WebFetch mot <https://grafana.com/developers/saga/foundations/accessibility/accessibility-overview>:**

> "partially conformant with WCAG 2.1 level AA"
> Begränsningar: charts (color-blind), color contrast, keyboard support
> Manual matrix: VoiceOver/MacOS+Safari/Chrome/Edge, NVDA/Windows+Chrome/Firefox, Orca/Linux
> pa11y: *"using pa11y to test our main workflows and use cases"* + *"working on incorporating a11y linting during development"*

**Bedömning:** Verifierat — **med en marginell överdrift.** Codex skriver "pa11y/CI-fail vid a11y-regressioner", vilket implicerar att pa11y aktivt failar CI vid regressioner. Grafanas dokumentation säger att de *använder* pa11y och *arbetar på* att integrera a11y-linting i utveckling — men säger inte explicit att pa11y blockerar CI vid regressioner. Skillnaden är liten men reell. Codex' jämförelse hade varit lika stark om han skrivit "pa11y används i deras testpipeline".

### Shopify Polaris accessibility

**Codex påstår:** *"komponenters accessible markup, focus management för overlays, och automatiska + manuella tester."*

**WebFetch mot <https://polaris-react.shopify.com/foundations/accessibility>:**

> "This component code includes accessible markup"
> "Polaris components that use controls to display overlays, such as modals and popovers, manage focus automatically"
> "Our components are tested for accessibility with automated and manual techniques"

**Bedömning:** Verifierat. Helt korrekt.

### Kubernetes Security Response Committee

**Codex påstår:** *"separat security-response-repo med security release process, severity ratings, security contacts, on-call och playbook-material" + filer SECURITY_CONTACTS, security-release-process.md, severity-ratings.md, src-oncall.md."*

**WebFetch mot <https://github.com/kubernetes/committee-security-response>:**

> Filer: SECURITY_CONTACTS, security-release-process.md, severity-ratings.md, src-oncall.md ✓
> Roll: "triaging and handling the security issues for Kubernetes"
> Innehåll: playbooks, communication templates, onboarding, CVE requests, severity ratings

**Bedömning:** Verifierat. Helt korrekt.

### GitLab Vulnerability Management, Rust RFCs, Kubernetes KEPs

Jag fact-checkade inte dessa via WebFetch eftersom Codex' formuleringar är tillräckligt allmänna att det inte fanns ett specifikt verifierbart påstående som var bärande. (T.ex. "GitLab har roller för Vulnerability Management, Security Compliance, AppSec…" är trivialt sant för ett företag i den storleken.)

---

## Vad Codex underskattat / överskattat / missat / missförstått

### Underskattat: ingenting

Förra rundan hittade jag fler säkerhetsproblem än Codex identifierade. Den här rundan: **inget**. Codex har varit rigorös. Pre-Fas-2-arbetet har stängt de saker som behövde stängas, och Codex flaggar precis det som fortfarande är öppet (RBAC, Zod parse, API-CI-signal, plan-drift).

### Överskattat: marginellt på Grafana pa11y/CI

Som dokumenterat ovan: Codex skriver "pa11y/CI-fail vid a11y-regressioner" men Grafanas faktiska beskrivning är "use pa11y to test our main workflows" + "working on incorporating a11y linting during development". Grafana har pa11y i sin testpipeline, men inte som en CI-blocker som failar vid regressioner. Marginellt överstryket. Påverkar inte slutsatsen om att Miranon kan låna Grafanas ärlighet ("partial/unknown" status per vy tills testad).

### Missat: ingenting jag kan upptäcka

Jag sökte aktivt efter tre kategorier som förra rundan visade var där missar gömmer sig:

1. **Säkerhetshål som inte täcks av M1-M8.** Jag grepade efter `getUser`, `getSession`, `auth.` i alla Edge Functions. Resultat: alla GET-funktioner anropar `requireUser`. Update-record likaså. Create-admin-user har två-stegs (auth + admin-allowlist). Inget är glömt.

2. **Stale spec-filer som inte fångats av P2 stödspec-synk.** Jag grepade efter `Vue|emit|v-model|scoped slot|composable|onMounted` i alla styrande specs. Bara KVALITETSDEFINITIONER-11.md har aktivt Vue-innehåll — vilket Codex har flaggat. Övriga träffar är retrospektiva referenser ("i Vue-projektet", "bevisat i Vue-projektet") och inte aktiva styrdokument.

3. **Klient-server-säkerhetsmönster som inte är konsekventa.** `getAuthHeader()` faller fortfarande tillbaka till anon-key, vilket Codex har flaggat. Jag verifierade att servern alltid avvisar anon-key via `requireUser` (rad 82 i auth.ts). Vid inkonsekvens skulle någon angreppsväg vara öppen. Den finns inte.

### Missförstått: ingenting

Codex' formuleringar är preciserade i en grad som matchar koden. Jag hittade ingen plats där hans tolkning skiljer sig från vad koden faktiskt gör.

---

## Vad Codex har rätt om

För fullständighet — alla väsentliga påståenden:

1. **Verifieringsbas matchar 100%.** Alla 5 kommandon ger identiska resultat när jag kör om dem.
2. **Säkerhetsfixarna i Fas A är reella, inte teater.** `requireUser`, CORS-allowlist, operations-API, formula escaping, create-admin-user-allowlist, structured errors — alla finns i kod. Verifierat per fil-rad.
3. **Auth ≠ Authorization.** GET-funktionerna har auth-gate men ingen role/record-scope. Reell semantisk skillnad.
4. **API-testsviten kan ge falsk grön CI** om TEST_*-secrets saknas i GitHub.
5. **Testfiler är inte typecheckade**, och `helpers.ts:133` har en faktisk import-miss som tsc skulle fånga.
6. **`test-auth` med `verify_jwt = false` är en deploy-policy-risk** om Fas 7-filtrering inte kommer tidigare.
7. **byggplan.md har två driftfel:** nuqs saknas i deps, byggplan.md:249 listar fel statusvärden.
8. **Repo-polish är bättre men inte konsistent:** trasig quickstart, omsynt scripts-tabell, oprecis "Workbox"-stack-rad, daterad docs/README.md.
9. **Snäva ja för Fas 2 är rätt kalibrerat.** Routing/auth kan börja, datavyer kan inte (Fas 2.5 stänger det).
10. **Tre startvillkor (nuqs, typecheck:tests, auth-fixture-signal) är var för sig nödvändiga och tillsammans tillräckliga** för att starta Fas 2 utan teknisk skuld från första session.

---

## Min sammantagna bedömning

Codex' analys är **korrekt och ärlig.** Detta är samma slutsats som förra rundan. Den enda skillnaden är att den här rundan hittade jag heller inget han överdrivit (utöver Grafana-detaljen).

**Är Codex' "snäva ja" rätt kalibrerat?** Ja. Inte hårdare nej, inte mjukare ja. Säkerhetsgrunden är reell, appen är 0%, planen är stark men har två mikrofel. Det är exakt det Codex säger.

**Är Codex' tre startvillkor tillräckliga?** Ja. Alla tre löser reella defekter:

1. nuqs i deps — eliminerar att Fas 2 startar med en pseudo-installation.
2. typecheck:tests — fångar faktiska type-fel som idag är osynliga (helpers.ts:133).
3. auth-fixture-signal — eliminerar falsk grön CI.

Jag skulle inte lägga till ett fjärde startvillkor. Däremot håller jag med om Codex' "Direkt efter Fas 2"-lista (rätta byggplan.md:249, aktivera Zod parse i AirtableAdapter, rätta KVALITETSDEFINITIONER-11.md). Den ordningen är rätt.

**Är Codex' uppdelning "Före / Under / Direkt efter Fas 2" rätt prioriterad?** Ja. Det är en rimlig riskhantering: lös infrastruktursignaler innan första route-fil, bygg auth/routing utan datakoppling, sluta med typkontrakt och status-sync innan första data-vy.

**Den enda meta-observationen jag vill lägga till:** Pre-Fas-2-arbetet (Session 3) producerade mycket synlig professionalitet (badges, CHANGELOG, .github/-paket, docs-omstrukturering till specs/research/reference/logs/analysis). Det är värdefullt, men det är inte detsamma som *byggande av appen*. Skillnaden mellan "repot ser proffsigt ut" och "produkten finns" har växt under Pre-Fas-2 — repot har 24 ADRs, 13-fas-byggplan, 113 säkerhetstester, men `App()` är fortfarande 7 rader med en `<h1>`. Det är inte ett problem (det är medvetet — Fas 0 var setup, Fas 2 är där appen börjar), men det är en risk för intern självbild om man läser README:s badges och tror att produkten är längre fram än den är.

Codex flaggar detta indirekt med formuleringen *"repo:t får inte börja tro att det är en produkt"*. Den raden bör stå kvar i sessions-loggen för Fas 2.

---

## Mekanik

- **HEAD vid verifiering:** `e0ec4463383d722993598971397dfefeb8df0091` — identisk med Codex' utgångspunkt. Inga divergerande commits.
- **Inga commits gjorda av mig.** Marcus committar både Codex-analysen och denna verifiering.
- **Verifieringsmetod:** Faktisk grep, faktisk file-read, faktisk WebFetch mot offentliga URLs. Ingen minnesreferens.
- **Tidsåtgång:** ~75 minuter inklusive parallellkörning av verifieringsbas och WebFetch mot 5 externa källor.

---

*"Code-verifieringen ska vara hård men inte hårdare än evidensen." Den är inte det. Codex har gjort sitt jobb. Pre-Fas-2 har stängt det den skulle stänga. Fas 2 kan starta — efter de tre startvillkoren.*
