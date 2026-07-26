# Staging-verifiering i lokal browser — runbook

> Syfte: köra browser-verifiering, QA eller mätning mot **staging** via ett
> lokalt bygge utan att gå i någon av de sex kända fällorna. Fällorna
> upptäcktes empiriskt under T76-piloten och S65/S66-batcharna (task-8.1,
> task-9.3, post-batch-incidenten 2026-07-12) och är hårda att
> symptom-diagnostisera — appen ser ofta "oförändrad" eller "trasig på fel
> ställe" ut. Läs det här FÖRE felsökning av konstigt browser-beteende mot
> staging. Kanonisk kravkälla: task-10 (backlog).
>
> Behöver granskningen DATA att titta på — ett kommande event med anmälningar
> — bor receptet i § Granskningsfixtur längre ned. Skapa den aldrig för hand.

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

## De sex fällorna

| # | Symptom | Rotorsak | Skyddsräcke |
|---|---|---|---|
| 1 | Login ger 400 på `/auth/v1/token` trots korrekta `.env.test`-creds | `npm run build` utan mode-flagga bakar in `.env.production` → bundeln pekar på PROD-instansen; testanvändaren bor i staging | `npm run build:staging` + `npm run verify:staging-bundle` (grep-grinden `scripts/check-staging-bundle.sh`) |
| 2 | Hem hänger i pending ~10,5 s och faller till felläge; anropsstorm 4×4 i Resource Timing | Preview-porten 4173 saknades i staging-EF:ernas CORS-allowlist → preflight 403 → fetch-reject i queryFn | 4173 är allowlistad sedan S66-enabling-steget; `npm run test:preview:staging` bevisar vägen i körning |
| 3 | Playwright hard-failar med `TEST_USER_EMAIL/TEST_USER_PASSWORD env vars required` trots att `.env.test` finns | `playwright.config.ts` läste enbart `process.env` — CI får secrets via workflow-env, lokalt fanns ingen laddare | `playwright.config.ts` laddar `.env.test` via dotenv ([officiella Playwright-mönstret](https://playwright.dev/docs/test-parameterize)); source-prefixet behövs inte längre |
| 4 | Dev-servern spyr `Failed to resolve import` efter en merge; browsern visar samtidigt en STALE bundle så appen ser oförändrad ut | Merge som lägger nya paket landar utan `npm install` i arbetsytan, och en redan igångkörd Vite cachar den misslyckade modulupplösningen | Post-merge-manifest-steget nedan (L275) |
| 5 | Browsern visar en GAMMAL version av appen på `localhost:5173` oavsett vad servern servar — utan synligt fel | En BYGGD app servad på dev-originet registrerar sin service worker där; Workbox `NavigationRoute` servar alla navigationer cache-first ur precachen, för evigt | Byggda appar servas ALDRIG på 5173 — preview kör på egen port/origin 4173 (`preview:staging`); sanering: kedjan nedan |
| 6 | Data ändrad i Airtable syns INTE i appen — inte ens efter hårdladdning | Appen persistar sin query-cache i **localStorage** (`src/queries/persist.ts`) med global `staleTime` 5 min (`src/router.ts`). localStorage överlever hårdladdning, så cachen serveras vidare | `localStorage.clear()` i konsolen — eller vänta ut de fem minuterna |

Fälla 6 är den som biter under en pågående granskning: fixturen skapas, basen
är korrekt, och appen står ändå kvar på gårdagens vy. Skilj den från fälla 5 på
symptomet — fälla 5 ger gammal KOD (appen ser oförändrad ut), fälla 6 ger
gammal DATA (appen är rätt, siffrorna är fel). Hårdladdning botar ingen av dem.

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

## Granskningsfixtur — data att granska

En design-review av event-, anmälnings- eller betalningsvyerna behöver ett
KOMMANDE event med anmälningar i basen. Staging har normalt bara
CI-sentineler, så datan måste skapas. **Skapa den aldrig för hand.**

Samma jobb gjordes manuellt 2026-07-22 (Event-796, Ort `Skövde`, noteringen
"GRANSKNINGSDATA (S75 review-våg 1)") och igen 2026-07-26 (Ort
`ZZ-GRANSKNING-S91`). Andra gången kostade lika mycket som första, eftersom
den första inte lämnade någon väg efter sig. `scripts/seed-review-fixture.mjs`
ÄR den vägen.

### Kör det

```bash
npm run seed:review                 # 8 bekräftade + 8 obekräftade, event om 8 dagar
npm run seed:review -- --dry-run    # planera, skriv ingenting
npm run seed:review:clean           # radera fixturen igen
```

Alla parametrar (defaults inom parentes):

| Flagga | Betydelse |
|---|---|
| `--ort <namn>` | Fixturens Ort — också dess markör (`ZZ-GRANSKNING-FIXTUR`) |
| `--bekraftade N` | Antal `Bekräftad (mail skickat)` (8) |
| `--obekraftade N` | Antal `Obekräftad` (8) |
| `--dagar N` | Dagar från idag till eventstart (8) |
| `--dry-run` | Planera och rapportera, skriv/radera inget — finns i BÅDA lägena |

Skriptet slutar med den enda rad som egentligen behövs:

```text
  http://localhost:5173/event/recEFBwyinW8Cz2SJ
```

Token: `STAGING_AIRTABLE_TOKEN` ur gitignorade `.env.seed` (se
`.env.seed.example`) — samma least-privilege-PAT som `npm run purge:staging`.
Guard-testerna bor i `scripts/test-seed-review-fixture.mjs` (`node
scripts/test-seed-review-fixture.mjs`), samma konvention som
`test-purge-staging-sentinels.mjs`.

### Vad som skapas

- **Ett event** i Eventplanering: `Fjärrskådning` / `Utbildning` / `Planerat`,
  Dag 1 + Dag 2 via den obligatoriska `Eventtyp`-länken (ADR-066 b5), och en
  `Notering` som börjar med sentineln `[SEED-REVIEW-FIXTUR]`.
- **En person per anmälan** i Personer — egna, aldrig de permanenta
  fixturerna.
- **En anmälan per person** i Anmälningar, med `Event`-, `EventKey`- och
  `Person`-länk satta av skriptet.

Datan är medvetet ojämn, så vyerna har något att visa: varannan rad bär
`Källa = Manuell` (ger kategori-pillen "Manuellt tillagd"), varannan lämnar
Källa tom (formuläranmälan — frånvaro är sanningen). `Inskickad` sprids
linjärt över ~fem veckor bakåt så kön får en äkta äldst-först-ordning,
betalstatus varieras i båda grupperna, och de bekräftade bär
`Bekräftelse skickad` så meta-raden syns. Bygget är deterministiskt: samma
flaggor ger samma fixtur, så en granskning går att återskapa exakt.

**`Person`-länken sätts av skriptet, inte av automation A2.** Automationerna
är avstängda i staging (empiriskt: 16 skapade anmälningar gav 0 Deltaganden,
och CI-sentinelerna saknar Person-länk). Utan länken blir personens
`Antal genomförda event` okänd — och då uteblir historikraden "Första eventet
hos Miranon Media" på deltagarkortet, ofta just den rad granskningen gäller.

### Hur man städar

```bash
npm run seed:review:clean -- --ort ZZ-GRANSKNING-FIXTUR --dry-run
npm run seed:review:clean -- --ort ZZ-GRANSKNING-FIXTUR
```

Clean raderar anmälningarna först (då släpper personernas länk), sedan
personerna, sist eventet — och efter-verifierar att inget radera-bart står
kvar. Den är lika hårt guardad som create-läget och rapporterar varje rad den
LÄMNAR kvar, med orsak. En rad utan fixtur-markör rörs aldrig; fail-safe-
riktningen är alltid "hellre lämna kvar och rapportera".

### De fyra fällorna i skriptet

Fällorna nedan kostade tid när fixturen byggdes för hand. Skriptet kodar bort
dem — de står här för den som ändrar skriptet eller bygger något liknande.

1. **Purge-kollisionen.** `scripts/purge-staging-sentinels.mjs` körs FÖRE varje
   staging-CI-jobb och raderar sentineler äldre än 60 min. En granskningsfixtur
   som matchar dess mönster (`Ort = 'ZZ-create-event-test'`, e-post
   `create-test+<uuid>@staging.test`) försvinner alltså mitt under
   granskningen. Fixturen använder därför markörer utanför dem: en egen
   e-postdomän `@granskning.test` (purgen tittar bara på `@staging.test`) och
   en `Notering`-sentinel purgen aldrig läser. Skriptet LÄSER
   `.purge-staging-policy.json` och korsläser sina markörer mot den skarpa
   policyn före varje körning — mönstren dupliceras aldrig in i skriptet, så
   vakten kan inte drifta ifrån den purge som faktiskt körs.
2. **De permanenta fixturerna rörs aldrig.** Personerna `rec7F8jYc7rczwwkM`
   (ZZ-Arbetsko Person 01) och `recqxaFNwHAdQlAqb` (ZZ-History Person 01) bär
   exakta rollup-assertions i testsviten (TASK-31) — att länka nya anmälningar
   till dem, eller råka radera dem, fäller tester. Skriptet skapar EGNA
   personer, och båda record-ID:na står i `protectedRecordIds` och kan aldrig
   raderas ens vid markör-träff.
3. **Datumvalet.** Ett kluster på ~15 identiska sentinel-event ligger på
   `2026-09-15`; en fixtur där är omöjlig att hitta i listan. Default är därför
   `--dagar 8` — nära i tiden, alltså överst i "Kommande".
4. **Beläggningen.** `Max antal platser` sätts alltid så att
   `Anmäld beläggning (%)` stannar under 60 % (16 anmälningar ⇒ 30 platser).
   Automation A6 skickar fullbokat-notis vid 100 %, och även om automationerna
   är avstängda i staging idag förlitar sig fixturen inte på det.

### Varför skriptet aldrig läser schemat

Tokenet är least-privilege: `data.records:read` + `data.records:write`, inget
mer. Ett anrop mot `meta/bases/.../tables` svarar **403**. Alla select-värden
är därför PINNADE konstanter i skriptets `CONFIG`-block, verifierade mot
[`data-model.md`](./data-model.md) § Schema cheat sheet. `typecast` används
ALDRIG — ett ogiltigt select-värde ska ge hårt 422, aldrig tyst föda en ny
option i basen. Av samma skäl sätts **`Månad/år` inte**: appens
månadsgruppering härleds klient-sidan ur `Startdatum`, och att sätta fältet
hade krävt en giltig option man inte kan läsa utan schema-scope
(§ Kända fällor 36 + 45).

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
- `scripts/seed-review-fixture.mjs` + `scripts/test-seed-review-fixture.mjs`
  — granskningsfixturen och dess guard-tester (§ Granskningsfixtur ovan);
  `scripts/purge-staging-sentinels.mjs` + `.purge-staging-policy.json` — den
  CI-purge fixturens markörer korsläses mot.
