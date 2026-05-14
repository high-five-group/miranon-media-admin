# Fas 2 11/10 verification

Datum: 2026-05-14  
Granskad HEAD: `9a4d8d58d2bbc35ce4cca0e0821e11920bc97084`  
Branch: `main` / `origin/main`  
Status: Evidensbaserad revision av Fas 2 — Routing + Auth

## Kort dom

Fas 2 är ett starkt resultat, men inte verifierbart 11/10 ännu.

Det som är starkt är verkligt: TanStack Router-skelettet är på plats, auth-context skickas via router context, pathless `_authenticated`-layout används korrekt, Supabase-auth är integrerad, anon-key-fallbacken är borttagen från klientens Edge Function-anrop, Playwright auth-state-mönstret följer officiell Playwright-rekommendation, staging-sviterna passerar med riktig env, och senaste GitHub Actions-run är grön på exakt granskad HEAD.

Det som hindrar 11/10 är också konkret:

1. `npm run typecheck` och CI-steget `npx tsc --noEmit` är i praktiken no-op för app-koden eftersom repo:t använder project references utan `-b`.
2. Den skyddade route-guarden hanterar `auth.isLoading` genom att bara `return` från `beforeLoad`, vilket inte bevisbart blockerar render av barn-route under auth-resolution.
3. DoD-rad 7 säger Suspense-fallback under auth-resolution, men auth-resolution är inte Suspense-driven i koden.
4. DoD-rad 8 säger router-felboundary, men implementationen är en React/Sentry ErrorBoundary runt `Outlet`, inte TanStack Routers `errorComponent` eller `defaultErrorComponent`.
5. Logout är implementerat som `auth.logout()`, men Fas 2-regressionen testar inte `supabase.auth.signOut()`-vägen; den simulerar logout via storage clear.
6. `test-nuqs` beskrivs som dev-only men finns i production route tree och production bundle.
7. Builden passerar men har en stor main chunk-varning (`640.82 kB` raw / `189.22 kB` gzip).

Min klassning: Fas 2 är ungefär 9/10-10/10 beroende på axel, men inte 11/10 förrän ovanstående gap är stängda eller uttryckligen omklassade med rätt DoD-text.

## Källor

Officiella primärkällor som användes:

- TanStack Router — authenticated routes: https://tanstack.com/router/v1/docs/guide/authenticated-routes
- TanStack Router — setup authentication: https://tanstack.com/router/latest/docs/how-to/setup-authentication
- TanStack Router — router context: https://tanstack.com/router/latest/docs/guide/router-context
- TanStack Router — code splitting: https://tanstack.com/router/latest/docs/guide/code-splitting
- TanStack Router — routing concepts/pathless routes: https://tanstack.com/router/latest/docs/routing/routing-concepts
- TanStack Router — data loading/error handling: https://tanstack.com/router/latest/docs/framework/react/guide/data-loading
- Supabase JS — `getSession`: https://supabase.com/docs/reference/javascript/auth-getsession
- Supabase JS — `getUser`: https://supabase.com/docs/reference/javascript/auth-getuser
- Supabase JS — `onAuthStateChange`: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
- Supabase Auth — sign out scopes: https://supabase.com/docs/guides/auth/signout
- nuqs adapters: https://nuqs.dev/docs/adapters
- nuqs basic usage: https://nuqs.dev/docs/basic-usage
- Playwright auth: https://playwright.dev/docs/auth
- Playwright projects/dependencies: https://playwright.dev/docs/test-projects

## Verifieringsbas

Körda lokala kontroller:

| Kontroll | Resultat |
|---|---|
| `git status --short` | ren worktree före rapportfilen |
| `git rev-parse HEAD` | `9a4d8d58d2bbc35ce4cca0e0821e11920bc97084` |
| `npm run typecheck` | exit 0, men se Fynd 1: ingen app-fil typcheckas |
| `npm run typecheck:tests` | exit 0 |
| `npx tsc -b --noEmit --pretty false` | exit 0 |
| `npm run lint` | exit 0, 4 `!important`-warnings + Biome schema-version info |
| `npm run build` | exit 0, Vite chunk warning på `index-BTn_UI_M.js` `640.82 kB` |
| `npm run test:api:pure` | 72 passed |
| `npm run test:api` utan laddad env | 72 passed, 41 skipped |
| `STAGING_REQUIRED=1 npm run test:api:staging` med `.env.test` laddad | 38 passed, 3 skipped |
| `npm run test:e2e:staging` utan env | hard-fail på saknade `TEST_USER_*` |
| `npm run test:e2e:staging` med `.env.test` laddad och `VITE_*` mappade | 7 passed |
| `npm audit --audit-level=moderate` | 0 vulnerabilities |
| `npx audit-ci --config audit-ci.jsonc` | passed, allowlist tom |

GitHub Actions:

- Run `25794461677` på HEAD `9a4d8d58d2bbc35ce4cca0e0821e11920bc97084`: success.
- Jobbet hade gröna steg för audit-ci, Biome, TypeScript check, tests, Playwright Chromium install, e2e och build.
- Viktig nyans: CI:s `TypeScript check` är `npx tsc --noEmit`, vilket är no-op för project references. Build-steget fångar app-typecheck via `npm run build` (`tsr generate && tsc -b && vite build`).

## Officiella kravbilden

TanStack Router:

- Rekommenderar `beforeLoad` för auth-gating och `throw redirect()` för login-redirect.
- Säger uttryckligen att om `beforeLoad` kastar fel/redirect försöker child routes inte ladda.
- För React context/hooks ska auth-state skickas in via router context, eftersom hooks inte kan användas direkt i `beforeLoad`.
- Router context kan invalideras med `router.invalidate()` när context-state ändras.
- Pathless layout routes markeras med `_` och påverkar inte URL-path.
- Auto code splitting via Vite-plugin kräver `autoCodeSplitting: true` och plugin före React-plugin.
- Route-loading errors hanteras via `route.errorComponent`, parent `errorComponent`, eller `router.defaultErrorComponent`.
- Route guards skyddar UI, inte serverfunktioner; server-side enforcement krävs separat.

Supabase:

- `getSession()` hämtar session från klientens storage och är inte en auktoritativ authorization-källa i server/cookie-sammanhang.
- `getUser()` gör nätverksrequest till Supabase Auth-servern och är autentiskt nog för authorization-beslut.
- `onAuthStateChange` är rätt frontend-mekanism för session-events; callback ska hållas snabb och inte göra Supabase-awaits inuti.
- `signOut({ scope: 'local' })` är officiellt stöd för att logga ut bara aktuell session.

nuqs:

- `NuqsAdapter` för TanStack Router är officiellt dokumenterad.
- Samma docs säger att TanStack Router har inbyggt type-safe search params-stöd och att detta sannolikt bör användas i appkod för bästa DX.
- TanStack Router-stödet i nuqs är markerat experimental och har caveats runt typad linking och `urlKeys`.

Playwright:

- Rekommenderat mönster för auth utan server-side state är setup project + `storageState`.
- `playwright/.auth` ska gitignore:as eftersom auth-state kan användas för impersonation.
- Project dependencies gör att setup kör före beroende testprojekt.

## Starkt verifierat

### TanStack Router-strukturen matchar officiella mönster

Filer:

- `src/routes/__root.tsx`
- `src/routes/_authenticated.tsx`
- `src/routes/_authenticated/hem.tsx`
- `src/routes/login.tsx`
- `src/routes/index.tsx`
- `src/router.ts`
- `vite.config.ts`

Bevis:

- `createRootRouteWithContext<RouterContext>()` används i root.
- `RouterProvider` får `context={{ auth }}` från en React-komponent (`InnerApp`), vilket följer TanStack Router context/hook-mönstret.
- `router.invalidate()` körs när `auth.isAuthenticated` eller `auth.isLoading` ändras.
- `_authenticated` är pathless: generated route tree visar full paths `/hem` och `/test-nuqs`, inte `/_authenticated/hem`.
- Vite-plugin står före `react()` och har `autoCodeSplitting: true`.
- Build-output visar separata chunks för `login`, `_authenticated`, `hem` och `test-nuqs`.

### Supabase-auth är rimligt och defense-in-depth finns

Filer:

- `src/auth/AuthProvider.tsx`
- `src/data/config/supabase-client.ts`
- `src/auth/AuthError.ts`
- `supabase/functions/_shared/auth.ts`

Bevis:

- `AuthProvider` använder `supabase.auth.getSession()` för initial state och `onAuthStateChange` med cleanup för reactive state.
- `login()` använder `signInWithPassword`.
- `logout()` använder `signOut({ scope: 'local' })`, vilket är officiellt stöd.
- `getAuthHeader()` kastar `AuthError` om session saknas; anon-key-fallbacken är borta.
- Staging API-tester verifierar server-side deny paths: 38 passed + 3 M4-defer skipped med `STAGING_REQUIRED=1`.

### Playwright auth-state-mönstret följer officiell rekommendation

Filer:

- `playwright.config.ts`
- `tests/e2e/auth.setup.ts`
- `tests/e2e/auth-flow.staging.test.ts`
- `.gitignore`

Bevis:

- Setup-projektet loggar in och skriver `playwright/.auth/user.json`.
- `chromium-authenticated` har `dependencies: ['setup']` och `storageState`.
- `.gitignore` ignorerar `playwright/.auth/*` men tillåter `.gitkeep` och README.
- E2E med env laddad passerar 7/7.

### CI har verklig staging-signal

Filer:

- `.github/workflows/ci.yml`
- `tests/api/helpers.ts`

Bevis:

- CI kör `test:api:staging` med `STAGING_REQUIRED=1`.
- Om env saknas kastar `getApiConfig()` istället för tyst skip.
- Senaste CI-run på HEAD är grön.

## Fynd

### Fynd 1 — TypeScript check är delvis falsk signal

Klass: 11/10-blocker  
Fakta:

- `package.json` har `"typecheck": "tsr generate && tsc --noEmit"`.
- `.github/workflows/ci.yml` kör `npx tsc --noEmit`.
- `tsconfig.json` består av `files: []` + `references`.
- `npx tsc --noEmit --listFiles` ger ingen output.
- `npm run typecheck -- --listFiles` ger ingen app-fil-output.
- `npx tsc -b --noEmit` passerar och är den kommandotyp som faktiskt kontrollerar refererade projekt.
- `npm run build` kör `tsc -b`, så build fångar app-typefel, men det separata typecheck-steget är missvisande.

Bedömning:

Detta är inte 11/10. Det är exakt typen av grön signal som ser stark ut men inte mäter det den säger att den mäter.

Åtgärd:

- Ändra `typecheck` till `tsr generate && tsc -b --noEmit`.
- Ändra CI:s TypeScript check till `npm run typecheck`.
- Behåll `typecheck:tests` separat om ni vill ha explicit test-signal.

### Fynd 2 — Protected route-guarden har inte bevisad no-flash-auth

Klass: 11/10-blocker  
Fakta:

- `_authenticated.tsx` gör:

```ts
if (context.auth.isLoading) {
  return;
}
if (!context.auth.isAuthenticated) {
  throw redirect(...)
}
```

- TanStack Router-dokumentationen säger att child routes stoppas när `beforeLoad` kastar error/redirect.
- Koden kastar inte och väntar inte när `isLoading` är true.
- Kommentarerna säger att guarden blockerar render via Promise-await, men implementationen returnerar synkront.
- E2E Test 4 verifierar slutligt redirect-resultat `/hem` -> `/login?redirect=%2Fhem`, men testar inte att `<h1>Hem</h1>` aldrig hinner renderas under loading.

Bedömning:

Slutläget är verifierat. No-flash-semantiken är inte verifierad och är inte bevisbar från nuvarande kod. För en admin-app med skyddade data är detta ett 11/10-gap även om `/hem` just nu bara är placeholder.

Åtgärd:

- Gör auth-resolution till en blockerande router-state, exempelvis med en auth-ready promise som `beforeLoad` kan `await`a.
- Alternativt render-blocka hela routerträdet tills AuthProvider är settled och verifiera med Playwright att skyddat innehåll aldrig syns före redirect.
- Lägg regressionstest som failar om skyddad route-text syns innan redirect.

### Fynd 3 — Suspense-fallback för auth-resolution är inte implementerad

Klass: DoD-gap  
Fakta:

- Byggplanens DoD 7 säger: `[GA] Suspense-fallback på root visar laddningsindikator under auth-resolution`.
- `__root.tsx` har `<Suspense fallback=...>`.
- `AuthProvider` använder vanlig `useState`/`useEffect` och kastar ingen Promise.
- `_authenticated.tsx` returnerar bara under `isLoading`.

Bedömning:

Suspense finns, men den är kopplad till lazy route/code-splitting, inte till auth-resolution. DoD-texten är därför inte verifierbart sann.

Åtgärd:

- Antingen ändra DoD/BUILD-LOG till "Suspense fallback finns för lazy route loading".
- Eller implementera faktisk auth-pending UI/fallback och testa den.

### Fynd 4 — Router-error boundary är inte TanStack Router-error boundary

Klass: DoD-gap  
Fakta:

- Byggplanens DoD 8 säger: root error boundary fångar router-fel.
- `__root.tsx` använder `Sentry.ErrorBoundary` runt `<Outlet />`.
- TanStack Router-dokumentationen pekar på `route.errorComponent`, parent `errorComponent` och `router.defaultErrorComponent` för route-loading/render lifecycle errors.
- Ingen `errorComponent` finns i root route och ingen `defaultErrorComponent` finns i `createRouter`.
- Ingen regressionstest tvingar route-level error och verifierar "Ladda om"-fallbacken.

Bedömning:

React render-fel kan fångas av Sentry boundary, men router-lifecycle-fel är inte bevisat fångade av den avsedda TanStack-mekanismen.

Åtgärd:

- Lägg `errorComponent` på root route eller `defaultErrorComponent` i `createRouter`.
- Lägg ett test som triggar route error och verifierar fallback + reset/invalidate-beteende.

### Fynd 5 — Logout är implementerat men inte verifierat som logout-flöde

Klass: 10/10-gap  
Fakta:

- `AuthProvider.logout()` använder `supabase.auth.signOut({ scope: 'local' })`.
- Supabase-dokumentationen stöder `scope: 'local'`.
- E2E Test 6 simulerar logout genom att rensa cookies/localStorage/sessionStorage och reloada.
- Det finns ingen UI-knapp i Fas 2 och inget test som anropar `auth.logout()` eller verifierar `signOut()`-vägen.

Bedömning:

Kodvalet är korrekt. Verifieringen bevisar routerreaktion på förlorad session, inte logout-metoden.

Åtgärd:

- När app-shell/logout-knapp kommer i Fas 5: lägg e2e-test som klickar logout och verifierar `/login`.
- Om 11/10 ska hävdas redan nu: lägg unit-/component-test för `logout()` och `onAuthStateChange`-effekt.

### Fynd 6 — `test-nuqs` är inte faktiskt dev-only i production bundle

Klass: 10/10-gap  
Fakta:

- `src/routes/_authenticated/test-nuqs.tsx` säger "DEV-ONLY route".
- Generated route tree innehåller full path `/test-nuqs`.
- Production build innehåller `dist/assets/test-nuqs-9z8RkZPE.js`.
- Production main bundle map refererar test-nuqs-chunken.
- Render-time-check visar "Test route ej tillgänglig i produktion", men routen finns fortfarande.
- nuqs docs säger att TanStack Router-stödet är experimental och att TanStack Routers egna type-safe search params sannolikt bör användas i appkod för bästa DX.

Bedömning:

Detta är inte en säkerhetskatastrof eftersom routen är skyddad av `_authenticated`, men "dev-only" är inte bokstavligt sant. I 11/10-disciplin ska test-/DoD-routes inte ligga kvar i prod-route-tree om de beskrivs som dev-only.

Åtgärd:

- Ta bort `test-nuqs` före produktionsdeploy eller flytta till en separat dev-only route build-strategi.
- Alternativt döp dokumentationen ärligt till "protected diagnostic route that renders inert in prod".
- När riktig URL-state byggs: använd TanStack `validateSearch` + nuqs `createStandardSchemaV1` där typad linking behövs.

### Fynd 7 — Main bundle är över Vite-varningsgränsen

Klass: 10/10-gap / Fas 7-defer  
Fakta:

- Build passerar.
- Vite varnar: `index-BTn_UI_M.js` är `640.82 kB` raw / `189.22 kB` gzip.
- BUILD-LOG dokumenterar detta som Fas 7 performance-budget-defer.
- Auto route chunks finns, men Supabase/auth/runtime ligger fortfarande i main.

Bedömning:

Acceptabelt som dokumenterad defer i Fas 2. Inte acceptabelt som slutlig 11/10 performance posture.

Åtgärd:

- Fas 7: mät, sätt budget, lazy-loada tyngre auth/admin runtime där möjligt, verifiera med bundle analyzer.

## DoD-bedömning

| DoD | Bedömning |
|---|---|
| 1. `npm run dev` login -> `/hem` | Verifierad med e2e 7/7 när env laddas |
| 2. Logout klart -> `/login` | Delvis. `logout()` finns, men test simulerar storage clear och ingen UI logout finns |
| 3. Skyddad route utan session -> `/login` | Slutligt redirect verifierat. No-flash inte verifierat |
| 4. nuqs `useQueryState` fungerar mot test-route | Koden finns. Routen ligger också i prod-tree |
| 5. Devtools i dev, inte prod | `import.meta.env.DEV` gör att prod-build har `!1`; godkänt |
| 6. Playwright auth-fixture | Setup project + storageState följer Playwright-rek; godkänt |
| 7. Suspense fallback under auth-resolution | Inte uppfyllt enligt faktisk implementation |
| 8. Root error boundary fångar router-fel | Inte bevisat med TanStack route errorComponent/defaultErrorComponent |

## Slutsats

Fas 2 är inte "bara kosmetiskt grön"; den är substantiellt stark. Men 11/10 kräver att signalerna mäter rätt saker och att DoD-texten motsvarar faktisk semantik.

Min rekommenderade stängningsordning:

1. Fixa typecheck-skript + CI TypeScript-steg.
2. Gör auth-loading blockerande eller ändra DoD och lägg no-flash-test.
3. Implementera TanStack route error boundary och test.
4. Antingen ta bort `test-nuqs` från prod eller dokumentera den ärligt.
5. Lägg logout-test när UI-knapp finns, eller unit-test tidigare.
6. Låt bundle-gapet ligga kvar som Fas 7-defer, men kalla det inte 11/10 performance förrän budgeten är bevisad.
