---
id: TASK-10
title: >-
  Fynd: lokal browser-verifiering mot staging — npm run build defaultar till
  prod-instansen; preview-defaultporten 4173 är CORS-blockerad
status: To Do
assignee: []
created_date: '2026-07-12 11:54'
updated_date: '2026-07-12 13:59'
labels: []
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
<!-- COMMENTS:END -->
