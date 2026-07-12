---
id: TASK-10
title: >-
  Fynd: lokal browser-verifiering mot staging — npm run build defaultar till
  prod-instansen; preview-defaultporten 4173 är CORS-blockerad
status: To Do
assignee: []
created_date: '2026-07-12 11:54'
updated_date: '2026-07-12 16:53'
labels:
  - ready-for-agent
dependencies: []
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två fällor för NÄSTA utförare som kör browser-verifiering/mätning mot staging via lokalt bygge (upptäckta + mitigerade av T76-pilotagent A1 i task-8.1, 2026-07-12; instruktionsform per L266).

SYMPTOM 1: login ger 400 på /auth/v1/token trots korrekta .env.test-creds. ROTORSAK: npm run build utan mode-flagga bygger production-mode och bakar in incheckade .env.production → bundeln pekar på PROD-instansen; .env.test-användaren bor i staging. MITIGERING SOM ANVÄNDES: bygg med npm run build -- --mode staging och VERIFIERA bundeln före körning (staging-host ska förekomma i dist/assets/*.js, prod-host ska INTE göra det).

SYMPTOM 2: Hem hänger i pending ~10,5 s och faller till felläge; Playwright ser inga responses medan Resource Timing visar ~16 anrop/query à ~150 ms (4×4-anropsstorm = fetchWithRetry 4 × React Query 4). ROTORSAK: vite preview servar på defaultporten 4173 men EF:ernas env-drivna CORS-origin-allowlist (_shared/cors.ts) tillåter inte 4173 → preflight 403 → fetch-reject i queryFn. Mönstret mäter tid till FELLÄGE, inte data-släpp. MITIGERING SOM ANVÄNDES: kör preview på 5173 (--port 5173 --strictPort, innanför staging-semaforen/med ledig-port-check).

FÖRVÄNTAT BETEENDE (klassningsbeslut för människan): endera dokumenteras båda fällorna i en verifierings-runbook/spec, eller så byggs skyddsräcken (t.ex. CORS-allowlist utökas med 4173 i staging-miljön, eller ett npm-script test:staging-preview som bär rätt mode + port). Relaterat: TASK-5/TASK-6-grannskapet (dev-server-mekanik), fälla-klassen L272 (stale/fel-kod-servering).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-12 13:59
---
Tredje fällan i samma arbetsyta (T76-pilot fas 3, agent B2, task-9.3): SYMPTOM: chromium-authenticated hard-failar i auth.setup med 'TEST_USER_EMAIL/TEST_USER_PASSWORD env vars required' TROTS att .env.test ligger i arbetskatalogen. ROTORSAK: playwright.config.ts har ingen dotenv-mekanism — CI får secrets via workflow-env, lokalt läses enbart process.env. MITIGERING SOM ANVÄNDES: prefixa lokala playwright-anrop med 'set -a; source .env.test; set +a;' i samma shell-anrop (source:a tyst — citera aldrig innehållet). Vite-sidan opåverkad (mode-filer per ADR-061). Klassnings-input: hör till samma runbook/skyddsräckes-beslut som kortets två första fällor.
---

created: 2026-07-12 15:05
---
Fjärde fällan i samma arbetsyta (post-batch, HUVUD-arbetsytan; upptäckt vid Marcus browser-granskning 2026-07-12): SYMPTOM: dev-servern på main spyr Pre-transform error 'Failed to resolve import @tanstack/react-query-persist-client' (main.tsx) + query-sync-storage-persister (persist.ts) — nya appen kan inte rendera; webbläsaren visar stale bundle så appen ser OFÖRÄNDRAD ut (ingen synlig krasch för människan). ROTORSAK: batch-merge som lägger nya deps (8.3/ADR-072: två paket i package.json) landar på main utan att npm install körs i huvud-arbetsytan — agenterna kör npm ci i sina worktrees, main:s node_modules förblir stale. FÖRSTÄRKARE: redan igångkörd Vite cachar den misslyckade upplösningen — npm install i efterhand räcker INTE; touch vite.config.ts räckte INTE empiriskt; hård omstart av dev-servern krävs (node_modules/.vite rensades också). MITIGERING SOM ANVÄNDES: npm install i huvud-arbetsytan (paketen verifierade via npm ls) + rm -rf node_modules/.vite + omstart av dev-servern. Klassnings-input: samma runbook/skyddsräckes-beslut som fälla 1–3 (kandidat: orkestratorns post-batch-steg 'package.json-diff i batchen → npm install på main' eller runbook-rad).
---

created: 2026-07-12 15:13
---
Komplettering till kommentar #2 (samma incident, VERIFIERAD slutdiagnos för människo-symptomet): npm-install-fällan var reell men inte tillräcklig — knappen Marcus såg kom från en REGISTRERAD BYGGD SERVICE WORKER på dev-originet localhost:5173. Verifierad kedja: (1) sw.ts NavigationRoute(createHandlerBoundToURL('index.html')) servar ALLA SPA-navigationer cache-first ur precachen (Workbox by design) → gammal bundle för evigt oavsett vad servern servar; (2) dev-servern svarar 200 text/html på /sw.js (SPA-fallback, devOptions.enabled=false) → SW-uppdatering misslyckas på MIME men avregistreras ALDRIG (kräver 404); (3) skipWaiting + clients.claim tar alla klienter direkt. Infektionsväg: byggda preview-/QA-appar servade på 5173 (fälla 2:s mitigering ÄR infektionsvägen — dev och byggd app delar port/origin, och byggd app registrerar SW:n). Empiriskt verifierat: SW-registrering fanns även i Playwright-MCP-profilen (scope 5173, sw.js activated, controller=true) men med TOM precache → nätverket vann → nya appen; profil med intakt precache → gamla appen. Färsk kontext renderar nya Hem UTAN knappen (server + kod friska hela kedjan). MITIGERING per browser-profil: DevTools → Application → Storage → Clear site data → ladda om (loggar ut; persist-cachen töms). KLASSNINGS-INPUT: femte fällan i klassen — OBS åter-armeras vid varje besök på byggt preview på 5173; kandidat-skyddsräcken: preview/QA på egen port+origin (aldrig 5173 — men se fälla 2: CORS-allowlisten måste då utökas), selfDestroying-SW i staging-byggen, eller QA-runbook-steget 'unregister SW efter QA-pass'.
---
<!-- COMMENTS:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dedikerade npm-scripts bär hela staging-verifieringsformen: build:staging (vite build --mode staging), preview:staging (vite preview --port 4173 --strictPort) samt bundelverifiering (staging-host förekommer i dist/assets, prod-host gör det INTE — script eller dokumenterad rad); exakta scriptnamn följer repots konvention och bokförs i notes. Stänger fälla 1+2 som handkommando-klass
- [ ] #2 Preview-flödet bevisat i körning mot staging: staging-mode-bygge servat på preview-porten 4173 (CORS-tillåten sedan S66-enabling-steget, preflight 200 verifierad) → inloggning + Hem-datainläsning gröna med nätverksbevis (staging-EF-anrop, ingen prod-host-trafik); preview-byggets SW-registrering landar på 4173-originet och dev-originet 5173 verifieras opåverkat (fälla 5-separationen)
- [ ] #3 playwright.config.ts laddar .env.test via dotenv per officiella Playwright-mönstret (playwright.dev/docs/test-parameterize): lokala körningar utan source-prefix; CI-formen (workflow-env) orörd och fortsatt grön; inga hemligheter i git-diffen. Stänger fälla 3
- [ ] #4 Verifierings-runbooken finns som dok-bärare (docs/reference/ el. motsv., länkad från CONTRIBUTING eller test-dok) och bär: de fem fällornas prevention (scripten ovan), SW-saneringskedjan (diagnos: curl modul → färsk browserkontext → Clear site data; INGEN passiv självläkning finns — inte ens 404 avregistrerar en aktiv SW per spec/web.dev, W3C #204 wontfix), post-merge-manifest-steget (npm install per arbetsyta + hård Vite-omstart inkl node_modules/.vite, L275) samt selfDestroying-SW som dokumenterad saneringsberedskap (INTE stående staging-läge — sänker test-fidelitet; tunn precedent öppet deklarerad)
<!-- AC:END -->
