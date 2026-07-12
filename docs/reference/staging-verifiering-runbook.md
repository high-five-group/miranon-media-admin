# Staging-verifiering i lokal browser — runbook

> Syfte: köra browser-verifiering, QA eller mätning mot **staging** via ett
> lokalt bygge utan att gå i någon av de fem kända fällorna. Fällorna
> upptäcktes empiriskt under T76-piloten och S65/S66-batcharna (task-8.1,
> task-9.3, post-batch-incidenten 2026-07-12) och är hårda att
> symptom-diagnostisera — appen ser ofta "oförändrad" eller "trasig på fel
> ställe" ut. Läs det här FÖRE felsökning av konstigt browser-beteende mot
> staging. Kanonisk kravkälla: task-10 (backlog).

## Snabbrecept

Hela den skyddade kedjan i ett kommando — bygg i staging-mode, grinda
bundeln, serva på preview-porten 4173 och kör Playwright-beviset
(login + Hem-datainläsning + nätverksbevis + SW-scope):

```bash
npm run test:preview:staging
```

För manuell browser-QA mot samma bygge:

```bash
npm run build:staging          # vite build i staging-mode (via build-kedjan)
npm run verify:staging-bundle  # grind: staging-host i dist, prod-host INTE
npm run preview:staging        # servar dist/ på http://localhost:4173 (strictPort)
```

Öppna sedan `http://localhost:4173` i en **färsk browserkontext** (se
SW-saneringskedjan nedan om du återanvänder en profil som tidigare besökt
byggda appar).

## De fem fällorna

| # | Symptom | Rotorsak | Skyddsräcke |
|---|---|---|---|
| 1 | Login ger 400 på `/auth/v1/token` trots korrekta `.env.test`-creds | `npm run build` utan mode-flagga bakar in `.env.production` → bundeln pekar på PROD-instansen; testanvändaren bor i staging | `npm run build:staging` + `npm run verify:staging-bundle` (grep-grinden `scripts/check-staging-bundle.sh`) |
| 2 | Hem hänger i pending ~10,5 s och faller till felläge; anropsstorm 4×4 i Resource Timing | Preview-porten 4173 saknades i staging-EF:ernas CORS-allowlist → preflight 403 → fetch-reject i queryFn | 4173 är allowlistad sedan S66-enabling-steget; `npm run test:preview:staging` bevisar vägen i körning |
| 3 | Playwright hard-failar med `TEST_USER_EMAIL/TEST_USER_PASSWORD env vars required` trots att `.env.test` finns | `playwright.config.ts` läste enbart `process.env` — CI får secrets via workflow-env, lokalt fanns ingen laddare | `playwright.config.ts` laddar `.env.test` via dotenv ([officiella Playwright-mönstret](https://playwright.dev/docs/test-parameterize)); source-prefixet behövs inte längre |
| 4 | Dev-servern spyr `Failed to resolve import` efter en merge; browsern visar samtidigt en STALE bundle så appen ser oförändrad ut | Merge som lägger nya paket landar utan `npm install` i arbetsytan, och en redan igångkörd Vite cachar den misslyckade modulupplösningen | Post-merge-manifest-steget nedan (L275) |
| 5 | Browsern visar en GAMMAL version av appen på `localhost:5173` oavsett vad servern servar — utan synligt fel | En BYGGD app servad på dev-originet registrerar sin service worker där; Workbox `NavigationRoute` servar alla navigationer cache-first ur precachen, för evigt | Byggda appar servas ALDRIG på 5173 — preview kör på egen port/origin 4173 (`preview:staging`); sanering: kedjan nedan |

Fälla 5-mekaniken i detalj: en SW-registrering är **origin-bunden**
(protokoll + host + port — [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)).
Dev-origin `localhost:5173` och preview-origin `localhost:4173` är därför två
skilda SW-världar — en SW registrerad på preview-originet kan aldrig fånga
dev-serverns sidor. Det är hela skyddet, och därför är port-separationen
icke förhandlingsbar. Åter-armering: varje besök på en byggd app servad på
5173 registrerar om SW:n där — sanering utan port-separation är alltså
temporär.

## SW-saneringskedjan (fälla 5)

Ingen passiv självläkning finns: en aktiv SW avregistreras INTE av att
`/sw.js` börjar svara fel — inte ens en 404 avregistrerar (den nya workern
kastas men den gamla förblir aktiv, se
[web.dev: The service worker lifecycle](https://web.dev/articles/service-worker-lifecycle);
förslaget att 404/410 skulle avregistrera avslogs wontfix i
[w3c/ServiceWorker#204](https://github.com/w3c/ServiceWorker/issues/204)).
Dev-servern svarar dessutom 200 text/html på `/sw.js` (SPA-fallback,
`devOptions.enabled: false`) → uppdateringsförsöket misslyckas på MIME men
river ingenting. Saneringen är därför alltid AKTIV, per browserprofil:

1. **Diagnos — är det SW:n?** Hämta en modul förbi SW:n: `curl -s
   http://localhost:5173/src/main.tsx | head` — svarar servern med FÄRSK
   kod medan browsern visar gammal app är SW-precachen boven.
2. **Bekräfta i färsk kontext:** öppna samma URL i inkognito/ny profil
   (eller Playwrights efemära kontext) — renderar den nya appen är kedjan
   server → kod frisk och infektionen profil-lokal.
3. **Sanera profilen:** DevTools → Application → Storage → **Clear site
   data** → ladda om. Detta avregistrerar SW:n och tömmer precachen (loggar
   ut och tömmer persist-cachen — väntat).

## Post-merge-manifest-steget (fälla 4, L275)

Efter varje merge/pull som ändrar `package.json`/`package-lock.json` — i
VARJE arbetsyta som ska köra vidare (huvudrepot OCH worktrees):

1. `npm install` i arbetsytan (agent-worktrees kör `npm ci` vid start;
   huvudrepot gör det inte av sig självt).
2. Hård omstart av processer som bär modulupplösnings-cache: stoppa
   dev-servern, vid behov `rm -rf node_modules/.vite`, starta om. En
   transformerad dev-modul är en EGEN cache-nyckel (L272) — `touch
   vite.config.ts` räcker INTE när upplösningen redan cachats som
   misslyckad.

## selfDestroying-SW — beredskap, inte default

`vite-plugin-pwa` bär ett dokumenterat läge (`selfDestroying: true`) som
bygger en SW vars enda uppgift är att avregistrera sig själv och riva sina
cachar — avsett som städ-utväg när en PWA ska dras tillbaka. Det är vår
dokumenterade SANERINGSBEREDSKAP om en SW-infektion någon gång behöver
rivas i skala (t.ex. en QA-profil-park där Clear site data per profil inte
skalar): bygg ett engångs-bygge med flaggan, serva på det infekterade
originet, besök en gång.

Det är INTE ett stående staging-läge: ett staging-bygge utan riktig SW
skulle sänka test-fideliteten mot prod (precache-/offline-/uppdaterings-
beteendet försvinner ur det som verifieras — ADR-047-ytan). Precedensen för
flaggan som beredskap snarare än miljöläge är tunn — det deklareras öppet
här i stället för att fejkas; beslutet omprövas om en verklig
skalerings-situation uppstår.

## Relaterat

- [`CONTRIBUTING.md` § Testkörning](../../CONTRIBUTING.md) — kanoniska
  testkommandon (denna runbook är staging-preview-spåret).
- [`ADR-050`](../decisions/ADR-050-isolerad-staging-miljo.md) — isolerad
  staging-miljö; [`ADR-061`](../decisions/ADR-061-lokal-miljo-isolation.md)
  — mode-koherens-grindarna som gör fälla 1 mekaniskt omöjlig att missa vid
  bygge med FEL mode (staging-mode + prod-URL kastar); [`ADR-047`](../decisions/ADR-047-pwa-arkitektur-fas-5.md)
  — PWA-/SW-arkitekturen.
- `tests/preview/staging-preview.test.ts` — Playwright-beviset som
  `test:preview:staging` kör.
