<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# Codex project analysis — post-Pre-Fas-2

Datum: 2026-05-07  
Repo: `miranon-media-admin`  
HEAD: `e0ec4463383d722993598971397dfefeb8df0091` (`docs(lessons): add 14 UNIVERSAL lessons from Pre-Fas-2-verifiering (K4a)`)  
Scope: nulägesverifiering efter Fas A, byggplan-revision och Pre-Fas-2-polish. Ingen commit gjord av Codex.

## Kort dom

**Ja: repo:t är klart att starta Fas 2 — Routing + Auth.**

Men det är ett snävt ja. Det betyder: börja bygga route tree, login, logout, protected route guards, auth fixture och URL-state-infrastruktur enligt `docs/byggplan.md:165`. Det betyder inte att repo:t är klart för bred UI-implementation, data-vyer, produktionsdeploy eller "nu är säkerheten färdig".

Det som har förändrats sedan 2026-04-28 är stort: säkerhetsexponeringen som Code verifierade 2026-04-29 är i huvudsak stängd på Edge Function-nivå. Auth-gate, CORS-allowlist, operations-baserad write-API, formula escaping, create-admin-user caller-verifiering, structured errors och `verify_jwt`-konfig finns i kod. Det är inte dokumentations-teater.

Det som fortfarande inte är starkt nog är lika tydligt: appen är fortfarande placeholder (`src/main.tsx:17`), runtime datakontrakt och status-sync är inte lösta (`src/domain/types/Status.ts:1`, `src/data/adapters/AirtableAdapter.ts:30`), API-testerna kan gå grönt lokalt trots att 41 deployade deny-path-tester skippas (`tests/api/helpers.ts:37`), och flera styrande dokument har kvar drift mot React-verkligheten.

Min omprövade formulering från förra gången:

> Projektet är inte svagt. Men det är nu två olika saker samtidigt: en ovanligt stark process- och säkerhetsgrund, och fortfarande nästan ingen faktisk app.

Det vore fel att låta den första sanningen maskera den andra.

## Verifieringsbas

Körda kommandon 2026-05-07:

| Kommando | Resultat | Kommentar |
|---|---|---|
| `git status --short` | tom | Worktree ren före analysfilen. |
| `npm run typecheck` | 0 fel | Typecheck täcker `src`, `vite.config.ts`, `playwright.config.ts`; inte `tests/api`. |
| `npm run lint` | exit 0, 4 varningar | Alla fyra är `!important` i reduced-motion-regeln i `src/styles/base.css`. |
| `npm run build` | grön | Bundle: JS 325.37 kB gzip 102.56 kB. |
| `npm run test:api` | 72 passed, 41 skipped | Pure helper-tester kördes; staging-/deploy-tester skippades eftersom TEST_*-env saknas. |
| `npm audit --audit-level=moderate` | `found 0 vulnerabilities` | Den tidigare PostCSS-advisoryn är borta i aktuell dependency graph. |

## Fråga 1 — Klar för Fas 2?

**Ja, med tre startvillkor.**

1. **Fas 2 får inte bredda scope till data-vyer.** Routing/auth kan börja trots att Fas 2.5-skulden kvarstår. Men inget i Fas 2 ska konsumera `AirtableAdapter` som om response-shapes vore runtime-säkra. Adapter-läsningar är fortfarande typ-castade (`src/data/adapters/AirtableAdapter.ts:30`, `:41`, `:53`), och scheman används inte med `.parse()` eller `.safeParse()` någonstans i `src/`/`supabase/`.

2. **AuthProvider måste behandla anon fallback som unauthenticated, inte som "lite auth".** Klientens `getAuthHeader()` faller fortfarande tillbaka till anon key när session saknas (`src/data/config/supabase-client.ts:16`). Det är mycket mindre farligt nu eftersom servern nekar anon key via `requireUser()` (`supabase/functions/_shared/auth.ts:76`), men Fas 2-UI:t ska inte låta anon fallback bli normal kontrollflödeslogik. Skyddad route utan session ska redirecta före datafetch.

3. **Fas 2-prompten måste få en liten preflight-korrigering.** `docs/byggplan.md` kräver `nuqs` i Fas 2 (`docs/byggplan.md:168`, `:175`, `:203`), men `package.json` har inte `nuqs` i dependencies (`package.json:16`). Lägg installationen explicit i Fas 2. Samma pass bör lägga `tests/**/*.ts` under en test-tsconfig eller egen `tsc --noEmit -p tsconfig.tests.json`, eftersom `tests/api/helpers.ts:133` använder `APIResponse` utan import och nuvarande `tsconfig.*` inte typcheckar testfiler (`tsconfig.app.json:30`, `tsconfig.node.json:21`).

**Praktisk nästa åtgärd för Marcus:** starta Fas 2, men justera prompten med:

- Installera `nuqs`.
- Inkludera testfiler i typecheck eller skapa `typecheck:tests`.
- Låt `authenticatedPage`-fixture vara explicit beroende av TEST_*-env eller lokal Supabase-fixture; annars blir CI-signal falskt grön.
- Lägg en DoD-punkt: "Protected routes gör inga Edge Function-anrop utan user session."

## Fråga 2 — Har 2026-04-28-blockers åtgärdats?

| Tidigare blocker | Nuvarande status | Bedömning |
|---|---|---|
| 1. Säkerhetsmodellen inte ikapp spec | **I huvudsak åtgärdad för dåvarande attackyta.** `requireUser()` validerar bearer-token mot Supabase Auth och nekar anon role (`supabase/functions/_shared/auth.ts:41`, `:76`, `:82`). Alla datafunktioner importerar helpern. CORS är origin-allowlist, deny-by-default (`supabase/functions/_shared/cors.ts:29`, `:48`, `:60`). `update-record` tar `operationKey`, inte `tableId`, och operation registry är tom tills verklig UI-flow finns (`supabase/functions/update-record/index.ts:7`, `_shared/field-allowlists.ts:26`). Formula-injektion hanteras via `escapeFormulaValue()` och builders (`supabase/functions/_shared/airtable-filter.ts:63`, `:127`, `:136`, `:149`). `create-admin-user` kräver user-JWT + `ADMIN_EMAILS` (`supabase/functions/create-admin-user/index.ts:36`, `:45`, `:58`). | **Stark fix.** Från akut exponering till defensiv grund. Kvar: ingen riktig RBAC/tenant/membership-modell än; GET-funktioner ger alla autentiserade users full läsrätt. Det är acceptabelt före Fas 2, men inte slutlig authz. |
| 2. Appen är placeholder | **Inte åtgärdad, och ska inte vara det än.** `App()` renderar h1 + p (`src/main.tsx:17`). Inga `src/routes`, `src/auth`, `src/components` finns. | **0/10 app fortfarande.** Inte en Fas 2-blocker; det är Fas 2:s uppgift att sluta vara helt route-lös. |
| 3. Accessibility checklist stale Vue/FKUI | **Åtgärdad i huvudfilen.** `ACCESSIBILITY-CHECKLIST.md` är nu React 19 + React Aria + WCAG 2.2 AA, med axe/Playwright och manuell testmatris. | **Bra fix.** Men `KVALITETSDEFINITIONER-11.md` är fortfarande Vue-specifik (`props/emits`, Vue 3, `v-model`, scoped slots; `docs/specs/KVALITETSDEFINITIONER-11.md:21`, `:27`, `:121`, `:134`). Det är ett nytt styrdokumentationsgap. |
| 4. Zod-scheman inte runtime-kontrakt | **Inte åtgärdat.** Schemana finns men används inte med `.parse()`/`.safeParse()` i app/Edge Functions. `AirtableAdapter` castar response till generics (`src/data/adapters/AirtableAdapter.ts:30`, `:41`, `:53`). | **Fortfarande blocker för data-UI, inte för Fas 2 routing/auth.** Fas 2.5 har rätt scope, men dess DoD har ett fel; se nya fynd. |
| 5. Domäntyper inte i sync med Airtable-modell | **Inte åtgärdat.** `Status.ts` har fyra anmälningsstatusar (`src/domain/types/Status.ts:3`), medan `data-model.md` listar sex inklusive `Flytta till väntelista` och `Inställt` (`docs/reference/data-model.md:121`, `:129`, `:130`). | **Medveten Fas 2.5-skuld.** Helt okej före routing/auth, farligt före filter, badges, statusmutationer. |
| 6. Playwright konfigurerat men ingen testsvit | **Delvis åtgärdat.** `tests/api` finns med 113 test cases; 72 pure helper-tester passerar lokalt. Deployade deny-paths är env-beroende och skippas lokalt (`tests/api/helpers.ts:37`). Visual/a11y-tester saknas fortfarande tills UI finns (`playwright.config.ts:39`). | **Stor förbättring, men CI-signalen kan vara falsk.** Om GitHub saknar TEST_*-secrets blir `npm run test:api` grön utan att staging-auth verifieras. |
| 7. Designsystemet är början, inte bevis | **Inte åtgärdat i kod.** Tokens och helpers finns; inga komponenter. | **Fortfarande 0% komponentbibliotek.** Planen är däremot bättre nu: Fas 3 + 3.5 separerar primitives och a11y-baseline. |
| 8. Dependency-hygien | **Delvis åtgärdad.** `npm audit --audit-level=moderate` är clean, Dependabot finns (`.github/dependabot.yml:1`). CI kör lint/typecheck/test/build (`.github/workflows/ci.yml:30`), men inte `npm audit`, `npm audit signatures`, Socket eller overrides trots SECURITY-SPEC §4 (`docs/specs/SECURITY-SPEC.md:296`, `:317`, `:383`). | **Bättre än förr, inte 11/10 supply chain.** Inte en Fas 2-blocker, men ska inte säljas som komplett säkerhetsautomatisering. |

## Fråga 3 — Nya svagheter jag inte fångade förra gången

### 1. "Auth" är nu authentication, inte authorization

Fas A stänger anonym åtkomst. Den inför inte rollmodell för läsning. `requireUser()` returnerar bara `id`, `email`, `role` från Supabase (`supabase/functions/_shared/auth.ts:86`), och GET-funktionerna använder detta för logging men inte för record-scope eller role-scope. Alla giltiga user-JWTs kan läsa events/persons/registrations.

Det är inte en bug före Fas 2 om systemet bara har en liten betrodd admin-krets. Men Fas 2 heter Routing + Auth. Där måste auth-begreppet delas:

- Authentication: är detta en giltig Supabase user?
- Authorization: får denna user se Miranon-data?

Min rekommendation: Fas 2 ska minst ha en `isAllowedAdminUser`-gate i AuthProvider eller server-side helper, antingen via `ADMIN_EMAILS` för pre-S-track eller en tydligt dokumenterad "alla skapade users är admins"-policy. Annars kommer route guards ge en falsk känsla av behörighet.

### 2. API-testsviten kan ge falsk grön CI

`getApiConfig()` skippar alla env-beroende API-tester om någon TEST_*-variabel saknas (`tests/api/helpers.ts:29`, `:37`). Lokalt gav `npm run test:api` 72 passed + 41 skipped. GitHub CI kör bara `npm run test:api` (`.github/workflows/ci.yml:36`); om repository secrets inte är satta kommer CI också kunna bli grön utan att de deployade Edge Functions verifieras.

Det här är inte ett testfel; det är ett signalproblem. Dela upp:

- `test:api:pure` — alltid kör, inga secrets.
- `test:api:staging` — kräver TEST_*-env och failar om env saknas.
- CI ska köra båda, men staging-jobbet ska vara explicit konfigurerat med secrets eller explicit markerat "not required before deploy".

### 3. Testfiler är inte typecheckade

`tsconfig.app.json` inkluderar bara `src` (`tsconfig.app.json:30`) och `tsconfig.node.json` inkluderar bara Vite/Playwright config (`tsconfig.node.json:21`). `tests/api/helpers.ts` använder `APIResponse` i signaturen (`tests/api/helpers.ts:133`) men importerar bara `APIRequestContext` och `test` (`tests/api/helpers.ts:18`).

Playwright transpilerar detta tillräckligt för körning, men TypeScript-grinden bevisar inte att testkoden är typkorrekt. I ett repo där testerna är själva säkerhetsbeviset är det en högre risk än en vanlig test-typecheck-lucka.

### 4. `test-auth` är en deploy-policy-risk

`test-auth` är konfigurerad med `verify_jwt = false` (`supabase/config.toml:19`) för att isolerat testa `requireUser`. Det är rimligt för staging. Men samma fil säger att testfunktioner "ALDRIG" får nå produktion och att filtrering kommer i Fas 7 (`supabase/config.toml:8`).

Risknivån är låg till medel: endpointen exponerar bara `{ ok, userId }` efter `requireUser`, men en test-endpoint med bypassad gateway-JWT i prod är fel säkerhetssignal. Jag skulle flytta deploy-filter eller fail-fast check tidigare än Fas 7 om någon prod-deploy kan ske före dess.

### 5. Planen har minst två konkreta driftfel

Fas 2 säger att `nuqs` ska användas (`docs/byggplan.md:168`, `:175`, `:203`) men dependency saknas (`package.json:16`). Detta är enkelt.

Fas 2.5 säger först korrekt att `Status.ts` ska syncas 4 -> 6 mot `data-model.md` (`docs/byggplan.md:223`), men DoD-rad 1 listar engelska värden som inte matchar `Anmälningar.Status`: `pending`, `confirmed`, `cancelled`, `attended`, `no-show`, `waitlist` (`docs/byggplan.md:249`). Källan listar svenska Airtable-värden: `Obekräftad`, `Bekräftad (mail skickat)`, `Betalningspåminnelse skickad`, `Avbokad/Ombokad`, `Flytta till väntelista`, `Inställt` (`docs/reference/data-model.md:121`).

Det är exakt den sortens mikroskopiska plan-drift som orsakar en dum enum-implementation i nästa session.

### 6. Repo-polish är bättre, men vissa publika signaler är felaktiga

README är mycket bättre, men:

- Quickstart kopierar `.env.local.example`, som inte finns; korrekt källa är `.env.example` (`README.md:47`, repo-root har `.env.example`).
- README listar `test:visual`, men inte `test:api` (`README.md:53`), trots att `test:api` är säkerhetens huvudbevis just nu.
- README säger "Offline | Workbox" (`README.md:81`), men `public/sw.js` är fortfarande skelett och Workbox är Fas 5/Fas 7-plan, inte dependency.
- `docs/README.md` beskriver bara Design Docs (`docs/README.md:1`) trots att `docs/` nu innehåller analysis/archive/decisions/logs/reference/research/specs.

Det här är inte blocker för Fas 2. Det är blocker för "publik professionalitet 11/10".

## Världsklassjämförelse

Jag jämför mot tre kategorier. Projekten är valda för olika sorters världsklass, inte för att de är storleksmässigt jämförbara med ett privat solo-adminrepo.

### Kategori A — säkerhetsstyrning och sårbarhetshantering

Referenser: Kubernetes Security Response Committee, GitLab Vulnerability Management.

**Mot Kubernetes:** Kubernetes har en separat security-response-repo med security release process, severity ratings, security contacts, on-call och playbook-material. Deras security-response-repo listar bl.a. `SECURITY_CONTACTS`, `security-release-process.md`, `severity-ratings.md` och `src-oncall.md`, och beskriver att Security Response Committee triagerar och hanterar Kubernetes security issues. Miranon har en bra `SECURITY.md`, auth helpers och API deny-paths, men saknar severity matrix, on-call/process, release/embargo-process och explicit vulnerability SLA. För ett privat repo är det inte rimligt att kopiera Kubernetes processvolym, men severity/SLA-tabell vore ett relevant lån.

**Mot GitLab:** GitLab beskriver vulnerability management som en kontrollerad process med ansvar för identifiering, prioritering, mitigering och remediering; de har roller för Vulnerability Management, Security Compliance, AppSec, Development, Reliability och Product Security Engineering, plus automatisering som skapar tracking issues, CVSS/severity/priority och fix-availability labels. Miranon har Dependabot och clean audit, men inte automatiserade security issues, labels, SLAs eller CI-audit. Här är gapet tydligt: Miranon är bra på *preventiv kodhardening*, svagare på *operativ vulnerability lifecycle*.

**Vad Miranon har som dessa inte har i samma form:** extremt tät sessions-trail och lärdomslyft för ett enskilt repo. Kubernetes/GitLab har tyngre governance; Miranon har mer läsbar lokal orsakskedja från observation -> beslut -> commit.

### Kategori B — arkitekturbeslut och planeringsspår

Referenser: Backstage ADRs, Rust RFCs, Kubernetes KEPs.

**Mot Backstage:** Backstage dokumenterar att substantial architecture decisions bor i ADRs, att records aldrig raderas utan markeras superseded/deprecated, och att nya ADRs går via PR, feedback, numrering och docs-sidebar/mkdocs-indexering. Miranon matchar "never delete, supersede" i `docs/decisions/README.md` och har 24 ADRs. Det är starkt. Backstage är bättre på publiceringsintegration: ADRs är en del av docs-site navigation. Miranon har README-karta och ADR-index, men `docs/README.md` är stale, vilket gör docs-topologin svagare än ADR-systemet.

**Mot Rust RFCs:** Rust RFC-processen skiljer mellan vanliga PR-ändringar och "substantial" changes, kräver designprocess, community/subteam consensus, alternatives/drawbacks och final comment period. Miranon har motsvarande intent via fas-prompter, ADR-krav och "rekommendation ≠ beslut när gate är öppen". Miranon är bättre för snabb solo-exekvering; Rust är bättre på explicit consensus och implementation lifecycle efter accepterat beslut. Miranon saknar en lika hård regel för när en planrad är "accepted but not implemented" kontra "implemented".

**Mot Kubernetes KEPs:** Kubernetes enhancements kräver tracking över flera release-stages, testing, documentation och production-readiness review. Miranon har fas-DoD och sessionsdokument, men ingen PRR-liknande gate före deploy. Fas 7 har deploy/chaos/CSP, men det är för sent som generell mekanism. Lån härifrån: lägg "production readiness" som en explicit check när första riktiga data-vy eller write-operation införs, inte först vid konsolidering.

**Vad Miranon har som dessa inte har i samma form:** byggplanen är ovanligt praktisk. Den säger inte bara "beslut"; den skriver nästa prompt. Det är starkare än många open-source ADR/RFC-system på handlingsbarhet, men svagare på formell statusmodell.

### Kategori C — tillgängliga admin-/designsystem och UI-testdisciplin

Referenser: GOV.UK Design System, Grafana, Shopify Polaris.

**Mot GOV.UK Design System:** GOV.UK publicerar accessibility statement som omfattar både design-system-webbplatserna och komponent-/pattern-exempel, anger WCAG 2.2 AA compliance, dokumenterar kända accessibility concerns och externa audits av DAC. Miranon har en mycket ambitiös accessibility checklist, men inga komponenter, inga axe-tester och ingen extern/manuell auditlogg ännu. Alltså: specnivån är lovande, bevisnivån är 0 för UI.

**Mot Grafana:** Grafana är ärligare än de flesta: de säger delvis conformant WCAG 2.1 AA, listar begränsningar som charts, contrast och keyboard support, och beskriver både manual screen-reader matrix och pa11y/CI-fail vid a11y-regressioner. Miranon har en bättre nolltolerans-ambition än Grafana, men Grafana har verkliga komponenter, workflows, pa11y-ci och issue-labels. Miranon bör kopiera Grafanas ärlighet: när första UI:t finns, börja med "partial/unknown" status per vy tills testad.

**Mot Shopify Polaris:** Polaris kopplar komponentåteranvändning direkt till accessibility: komponentkoden innehåller accessible markup, focus management för overlays, och automatiska + manuella tester. Miranon har valt React Aria, vilket är en mycket bra headless-bas, men har ännu inte byggt komponentlagret som gör accessibility "build once, use everywhere". Fas 3/3.5 är därför rätt ordning.

**Vad Miranon har som dessa inte har i samma form:** tydligare svensk domän- och användarspårning. Checklistan nämner Lotta, svenska texter, DOS/EAA och operativa eventflöden. Det är starkt. Men det måste nu bli testade komponenter, inte bara god text.

## Samlad bedömning per axel

| Axel | Nivå idag | Hård kommentar |
|---|---|---|
| Security hardening för befintliga Edge Functions | **Stark** | Dåvarande akuta exponering är stängd. Kvar är authz/RBAC och deploy-policy. |
| App-implementation | **Nästan noll** | Placeholder. Fas 2 startar verklig appstruktur. |
| Plan/process/ADR | **Mycket stark, med driftfickor** | ADR-system och byggplan är toppklass för solo-projekt. Några styrdokument är stale eller självmotsägande. |
| Runtime datakontrakt | **Svag** | Zod finns men används inte vid gränser. |
| Testbevis | **Medel** | Pure security helper-tests är starka. Staging-tests kan skippas. Ingen UI/a11y/visual ännu. |
| Docs professionalitet | **Stark men inte ren** | README/metadata/.github förbättrade. `docs/README.md`, README quickstart och kvalitetsdefinitioner behöver städas. |
| Jämförbarhet med världsklass | **Exceptionell ambition, ännu begränsat empiriskt bevis** | På docs/process över genomsnitt. På app/UI/test maturity långt bakom named projects eftersom produkten inte finns ännu. |

## Rekommenderad nästa runda

### Före Fas 2-implementationen

1. Patcha Fas 2-prompten: `nuqs` installation, `typecheck:tests`, och auth fixture-signal.
2. Bestäm minsta authz-policy: "alla Supabase users är admins" eller `ADMIN_EMAILS` även för app-access. Skriv det i Fas 2.
3. Dela API-testkommandon i pure vs staging, eller gör CI env-missing till hard fail i staging-jobbet.

### Under Fas 2

1. Bygg `src/auth/` och `src/routes/` utan att koppla in datavyer.
2. Lägg route-level tests för:
   - no session -> `/login`
   - login -> `/hem`
   - logout -> session clear + `/login`
   - protected route gör ingen datafetch före session
3. Lägg `nuqs` smoke-testet som planen kräver.

### Direkt efter Fas 2

1. Kör Fas 2.5 innan någon data-heavy UI.
2. Rätta `docs/byggplan.md:249` så statusvärdena är svenska Airtable-värden.
3. Aktivera Zod parse i `AirtableAdapter` reads.
4. Rätta `docs/specs/KVALITETSDEFINITIONER-11.md` till React/React Aria, eller markera den som legacy och flytta styrning till omskriven spec.

## Slutsats

Fas A gjorde det viktigaste rätt: den gick inte bara från "ingen auth" till "lite auth"; den etablerade mönster som faktiskt minskar attackyta. Det är den stora skillnaden mot 2026-04-28.

Men repo:t får inte börja tro att det är en produkt. Det är en mycket väldokumenterad, säkerhetshärdad, körbar startpunkt för att bygga produkten. Starta Fas 2. Var hård mot test-signalen och authz-definitionen. Skjut inte in data-vyer förrän Fas 2.5 har stängt kontrakts- och statusgapet.

## Externa källor

- Backstage ADR process: <https://backstage.io/docs/architecture-decisions/>
- Rust RFC process: <https://github.com/rust-lang/rfcs>
- Kubernetes enhancements / KEP tracking: <https://github.com/kubernetes/enhancements> och <https://www.kubernetes.dev/community/community-groups/sigs/architecture/>
- Kubernetes security response repo: <https://github.com/kubernetes/committee-security-response>
- GitLab vulnerability management: <https://handbook.gitlab.com/handbook/security/product-security/vulnerability-management/>
- GOV.UK Design System accessibility statement: <https://design-system.service.gov.uk/accessibility-statement/>
- Grafana accessibility overview/styleguide: <https://grafana.com/developers/saga/foundations/accessibility/accessibility-overview> och <https://grafana.com/developers/saga/foundations/accessibility/accessibility-styleguide/>
- Grafana Playwright style guide: <https://raw.githubusercontent.com/grafana/grafana/main/contribute/style-guides/e2e-playwright.md>
- Shopify Polaris accessibility: <https://polaris-react.shopify.com/foundations/accessibility>
