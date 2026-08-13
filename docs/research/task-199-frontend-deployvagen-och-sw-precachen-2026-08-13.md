---
owner: marcus803
updated: 2026-08-13
review_by: 2027-02-13
status: draft
---

# Prod-fronten, deploy-vägen och PWA-precachen — vad som faktiskt hände, och vad som kan drabba Lotta

> **Proveniens:** avgränsat utredningspass för `TASK-199` (S105, 2026-08-13),
> kört i egen worktree ovanpå `origin/main` vid `53649f55`. Uppdraget kom med
> två frågor: **A** varför prod-fronten inte rullade ut på ~20 h av mergningar,
> och **B** om Lottas browser kan servera gammal kod efter en lyckad deploy.
> Passet är **läsande** mot prod: `curl` mot den publika domänen och GitHub
> Deployments-API. Ingen deploy, ingen inställning, ingen prod-data rörd.
>
> **Instrumentet som bar A** är GitHub Deployments-API. Vercel skriver varje
> deploy dit via GitHub deployment-API (Vercels egen dokumentation:
> *"Vercel for GitHub uses the deployment API to bring you an extended user
> interface both in GitHub, when showing deployments, and Slack"*,
> [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)).
> Det gav hela deploy-historiken utan Vercel-åtkomst — se § 5 för vad det
> instrumentet ändå INTE kan svara på.

## Sammanfattning

**Fråga A är inte det den såg ut att vara.** Kortets premiss — *"~20 h av
mergningar"* utan Production-deploys — är **falsifierad**. Under de 20 timmarna
mergades **ingenting**: `main` stod stilla från 2026-08-10T21:12:05Z till
2026-08-11T18:11:52Z. Vercel deployade varje `main`-avancering som skedde, och
**samtliga 25 Production-deploys i fönstret lyckades** (`state: success`, noll
misslyckade). Det fanns ingen trasig deploy-väg att hitta.

**Fråga B är den verkliga risken, och den är skarp.** Vår PWA saknar varje väg
från "ny deploy" till "användaren kör ny kod" utom att användaren själv laddar
om sidan **två gånger**. Det finns ingen uppdaterings-prompt, ingen automatisk
omladdning, och för en installerad app som står öppen finns ingen övre gräns
alls för hur länge gammal kod körs. Dessutom kan klienten **krascha** i
mellanläget. Detta är mätt ur vår egen kod och våra egna beroenden på disk,
inte härlett ur allmän PWA-teori.

---

## 1. Metod och belägg-klassning

Genomgående i dokumentet:

- **MÄTT** — ett kommando kördes och utfallet återges.
- **SLUTSATS** — följer med tvingande logik ur mätningar plus en citerad källa.
- **HYPOTES** — förenlig med data men inte avgjord. Märks alltid ut.

Rådata ligger i sessionens scratchpad (500 deployments + 308 status-svar) och är
inte incheckad; varje tal nedan är återskapbart med kommandona som anges.

---

## 2. Fråga A — deploy-historiken

### 2.1 MÄTT: det fanns inget merge-fönster att missa

`main`s första-förälder-linje mellan de två Production-deploys som omger
"gapet":

```bash
git log origin/main --first-parent --format='%H|%cI|%s' \
  --since 2026-08-10T21:00:00Z --until 2026-08-11T18:30:00Z
```

| Tid (UTC) | Commit | Vad |
|---|---|---|
| 2026-08-10T21:12:05Z | `ca9832d7` | Merge `#1157` — **sista** mergen före tystnaden |
| *(20 h 59 min utan en enda merge)* | — | — |
| 2026-08-11T18:11:52Z | `dd8ae755` | Merge `#1162` — första mergen efter |

**Antal `main`-avanceringar i "gapet": 1** (`dd8ae755`, som avslutar det).

Motsvarande Production-deploys: `ca9832d7` deployades 2026-08-10T21:22:28Z,
`dd8ae755` deployades 2026-08-11T18:15:05Z. **Gapet i deploys är gapet i
merges** — det är natten mellan två arbetsdagar, inte ett fel.

**SLUTSATS:** kortets formulering *"varför inga (fungerande) Production-deploys
på ~20 h av mergningar"* bygger på ett antagande om merge-aktivitet som inte
inträffade. Frågan som ställdes har inget svar därför att fenomenet inte finns.

### 2.2 MÄTT: noll misslyckade Production-deploys

Alla deployment-statuses i fönstret 2026-08-10T17:59Z – 2026-08-11T19:30Z:

| Environment | `success` | `failure` |
|---|---|---|
| Production | **87** | **0** |
| Preview | 221 | 1 |

Räknat över 25 Production-deployments (flera statuses per deployment). Det fanns
alltså inga dolda, misslyckade Production-deploys som kortet misstänkte —
hypotesen är **falsifierad**.

### 2.3 MÄTT: routen låg ute långt innan incidenten

Kortet daterar routen till `#1133` (2026-08-10T17:59Z). Det stämmer inte:

```bash
git log origin/main --diff-filter=A --format='%h %cI %s' \
  -- 'src/routes/_authenticated/event/$eventId/atgarder.tsx'
# 0ce766ad 2026-08-07T13:28:37+02:00 [PROTOTYPE] [S100] Åtgärds-sidan — konvergens-varv 1
```

Route-filen landade på `main` **2026-08-07**, tre dygn före `#1133`. Vid
`ca9832d7` var den dessutom ren produktionskod — filens egen kommentar daterar
promoveringen till `TASK-171.5` / `ADR-103` B2 steg 4. `#1133` bidrog med
*ingången* (länken i `src/components/events/detail/Atgarder.tsx`), inte routen.

`#1133`s egen merge-commit `1b5b7592` fick en **lyckad** Production-deploy
2026-08-10T18:08:58Z.

### 2.4 MÄTT: en verklig, men annan, avvikelse — 8 `main`-toppar utan Production-deploy

Av 38 `main`-avanceringar i det undersökta intervallet fick **8** enbart en
Preview-deploy och ingen Production-deploy: `69c17f40`, `5cbd5aed`, `97bf0146`,
`a55ba5d6`, `93348345`, `8e621e2a`, `def9bb76`, `43070f95`.

Vercels egen dokumentation beskriver mekanismen ordagrant:

> *"With each new push, if Vercel is already building a previous commit on the
> same branch, the current build will complete and any commit pushed during this
> time will be queued. Once the first build completes, the most recent commit
> will begin deployment and the other queued builds will be cancelled."*
> — [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)

Beteendet styrs av inställningen `github.autoJobCancellation`, som är på som
default.

**SLUTSATS:** mellanliggande `main`-toppar hoppas över med avsikt när merges
kommer tätare än byggtiden. I det mätta fönstret fick alltid en SENARE commit en
Production-deploy, så sluttillståndet blev korrekt varje gång.

**HYPOTES (ej avgjord):** om den SISTA mergen före en lång tyst period råkar
vara en sådan överhoppad topp, skulle prod bli stående på föregående commit tills
nästa merge. Det inträffade **inte** vid denna incident — `ca9832d7`, den sista
mergen före tystnaden, fick sin Production-deploy. Men konstruktionen tillåter
det, och det är den enda mekanism jag har hittat som *skulle kunna* producera
äkta server-side staleness. Kön bygger dessutom varje post som
`gh-readonly-queue`-gren först, vilket ger samma SHA två deploys (mätt: 24 av 25
Production-SHA:n har också en Preview-deploy) — en andra väg in i samma
dedup-/avbrytnings-logik.

### 2.5 MÄTT: `vercel.json` bär inget `ignoreCommand`

Filen innehåller `framework`, `buildCommand`, `outputDirectory`, `rewrites` och
`headers` — inget `ignoreCommand`, inget `git`-block. Ett *Ignored Build Step*
kan dock även sättas i projektinställningarna på vercel.com, vilket jag inte kan
läsa (§ 5).

---

## 3. Fråga B — kan Lottas browser servera gammal kod?

**Ja. Utan övre tidsgräns, och med en kraschrisk på vägen.** Allt nedan är mätt
ur filer på disk, inte antaget.

### 3.1 MÄTT: vår konfiguration

`src/sw.ts` (verbatim, de avgörande raderna):

```ts
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
```

`src/main.tsx` rad 117: `registerSW();` — **anropat helt utan optioner**.

`vite.config.ts` sätter **inte** `registerType`. Pluginets default är `'prompt'`
(mätt: `node_modules/vite-plugin-pwa/dist/index.js:800`, `registerType = "prompt"`),
och den flaggan blir `__SW_AUTO_UPDATE__` i klientkoden (samma fil, rad 169).

### 3.2 SLUTSATS: det finns ingen omladdnings-väg alls

I `node_modules/vite-plugin-pwa/dist/client/build/register.js` är `auto` falskt
för oss, så vi hamnar i prompt-grenen. Där gäller:

- `onNeedRefresh` är **odefinierad** (vi skickar inga optioner) → prompten är en
  no-op. **Ingen uppdaterings-dialog visas någonsin.**
- Omladdningen (`window.location.reload()`) ligger inuti `showSkipWaitingPrompt`,
  som bara anropas från `wb.addEventListener("waiting", …)`.

Och `waiting`-eventet kan inte inträffa för oss. Workbox-window avbryter det
explicit när workern går till `activating` — mätt i
`node_modules/workbox-window/build/workbox-window.prod.umd.js`:

```js
"installed"===i ? e.mn=self.setTimeout(…200…)      // waiting-eventet schemaläggs
: "activating"===i && (clearTimeout(e.mn), …)      // …och avbryts av skipWaiting
```

Eftersom vår `install`-handler anropar `skipWaiting()` når workern `activating`
före de 200 ms går ut. **`waiting` fyras aldrig → ingen `controlling`-lyssnare
registreras → ingen omladdning sker.**

`clients.claim()` ändrar inget: web.dev är uttrycklig om att den *"can override
this default, and take control of non-controlled pages"* — den laddar inte om
någon sida.
([web.dev: The service worker lifecycle](https://web.dev/articles/service-worker-lifecycle))

### 3.3 SLUTSATS: hur många navigationer krävs — och när sker de?

Uppdateringskontrollen triggas enligt förstapartskällan av:

> *"A navigation to an in-scope page. A functional events such as `push` and
> `sync`, unless there's been an update check within the previous 24 hours.
> Calling `.register()` only if the service worker URL has changed."*
> — [web.dev: The service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)

Applicerat på oss:

- Vi använder **varken** `push` eller `sync`.
- Vår SW-URL är konstant `/sw.js` → `.register()` triggar **ingen** kontroll.
- Kvar: **navigation till en in-scope-sida**. En SPA-ruttändring i TanStack
  Router är ingen navigation — det är en `history.pushState`. Bara en kall
  start, F5 eller pull-to-refresh räknas.

Förloppet vid en verklig navigation efter en deploy:

| Laddning | Vad användaren ser | Vad som händer i bakgrunden |
|---|---|---|
| **1** | **GAMMAL kod** — navigationen besvaras av den GAMLA workern ur precachen (`NavigationRoute` → precachat `index.html` → gamla asset-hashar) | Ny `/sw.js` hämtas, skiljer sig, installeras, `skipWaiting()`, aktiveras, `clients.claim()` |
| **2** | **NY kod** | — |

**Minst två fulla sidladdningar.** För en installerad app i `display: standalone`
som Lotta låter stå öppen sker noll navigationer — och därmed **noll**
uppdateringskontroller. Värsta fallet är inte 24 timmar; det är **obegränsat**.

### 3.4 MÄTT: kraschrisken mellan laddning 1 och 2

Efter `clients.claim()` i laddning 1 styrs den redan renderade sidan av den NYA
workern, medan sidans JavaScript fortfarande refererar GAMLA chunk-namn.
`autoCodeSplitting: true` (`vite.config.ts`) gör att routebyten hämtar chunkar
lazy. En sådan hämtning missar den nya precachen och går ut på nätet — där
`vercel.json`s SPA-rewrite (`"source": "/(.*)", "destination": "/index.html"`)
fångar den.

Mätt mot prod 2026-08-13:

```console
$ curl -sS -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' \
    https://admin.miranon.dev/assets/index-CWH3ivIH.js
200 text/html; charset=utf-8 4410

$ curl -sS -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' \
    https://admin.miranon.dev/assets/finns-inte-alls.js
200 text/html; charset=utf-8 4410
```

En **saknad** asset svarar `200 text/html` — byte för byte identiskt med
`index.html`. Browsern vägrar exekvera HTML som ES-modul och kastar ett
MIME-fel (`Failed to fetch dynamically imported module`).

**Två konsekvenser:**

1. Lotta kan få en vit sida eller ett rutt-byte som inte fungerar, mitt i
   arbetet, utan att något är fel med servern.
2. **Statuskod duger inte som instrument** — varken för övervakning eller för
   verifiering. Det är därför AC #3-sekvensen i § 4 grindar på `content-type`.

### 3.5 Repots egen runbook bar redan halva svaret

`docs/reference/staging-verifiering-runbook.md` fälla 5 beskriver samma
mekanism lokalt: *"En BYGGD app servad på dev-originet registrerar sin service
worker där; Workbox `NavigationRoute` servar alla navigationer cache-first ur
precachen, för evigt"*, och § SW-saneringskedjan slår fast att *"Ingen passiv
självläkning finns"*. Prod-fallet är samma klass — skillnaden är att i prod
finns ingen som kan öppna DevTools och köra *Clear site data*.

---

## 4. Verifikations-sekvensen för `TASK-201.9` AC #3

Frågan AC #3 ställer är *"är front-deployen verifierat utrullad?"*. Den har två
oberoende ändar, och båda måste hålla:

**A.** Vercel har byggt din commit som Production.
**B.** Domänen servar faktiskt en bundle som bär din ändring.

```bash
REPO=high-five-group/miranon-media-admin
DOMAN=https://admin.miranon.dev
COMMIT=$(git rev-parse origin/main)     # commiten som MÅSTE vara ute
MARKOR='event/$eventId/atgarder'         # sträng som bevisar just din ändring

# A) Vercel har byggt commiten som Production
DEPLOYED=$(gh api "repos/$REPO/deployments?environment=Production&per_page=1" --jq '.[0].sha')
git merge-base --is-ancestor "$COMMIT" "$DEPLOYED" \
  && echo "A OK: $COMMIT ingår i prod-deployad $DEPLOYED" \
  || { echo "A FEL: inte deployad"; exit 1; }

# B) Domänen servar en bundle som bär ändringen
ENTRY=$(curl -fsS "$DOMAN/" | grep -o '<script type="module"[^>]*src="[^"]*"' | grep -o '/assets/[^"]*')
CT=$(curl -fsS -o /dev/null -w '%{content_type}' "$DOMAN$ENTRY")
case "$CT" in *javascript*) ;; *) echo "B FEL: $ENTRY är $CT, inte JS"; exit 1 ;; esac
curl -fsS "$DOMAN$ENTRY" | grep -qF "$MARKOR" \
  && echo "B OK: markören finns i serverad bundle" \
  || { echo "B FEL: markören saknas"; exit 1; }
```

**Skarpt testad 2026-08-13, båda riktningarna:**

| Fall | Utfall | Exitkod |
|---|---|---|
| Nuvarande prod + verklig markör `event/$eventId/atgarder` | båda ändarna gröna | **0** |
| Nuvarande prod + påhittad markör | `B FEL: markören saknas` | **1** |

Tre egenskaper är avsiktliga och bör inte förenklas bort:

- **`merge-base --is-ancestor`, inte SHA-likhet.** `main` avancerar snabbare än
  bygget hinner deploya (mätt: merges 2–5 min isär, Preview-byggen 7–10 min).
  Ett likhetstest hade falsklarmat konstant. Frågan är *"är MIN ändring med?"*
  — inte *"är prod exakt HEAD?"*.
- **`content-type`-grinden.** Utan den passerar sekvensen på SPA-rewritens
  HTML (§ 3.4).
- **Markören är en parameter.** Vid varje go-live sätts den till en sträng som
  är unik för det som just skeppats.

**Vad sekvensen INTE bevisar:** att kunddomänens alias pekar på just den
deployen. Del B läser domänen och del A läser deploy-registret; om aliaset
hängde efter skulle B fälla, vilket är rätt beteende — men sekvensen kan inte
skilja "alias hänger efter" från "fel bundle byggd". Den skillnaden kräver
Vercel-åtkomst (§ 5).

---

## 5. Vad jag INTE kunde fastställa

**Vercels egen deploy-vy och alias-historik.** Det finns ingen väg dit från den
här maskinen just nu:

- `vercel`-CLI: **inte installerad** (`which vercel` → exit 1).
- `.vercel/`-katalog: finns inte i repot.
- `VERCEL_OIDC_TOKEN` i `.env.local`: **utgången 2026-08-06T00:24:41Z**, sju
  dygn före mätningen — och en OIDC-token är dessutom avsedd för federation mot
  tredjepartsmoln, inte för Vercels eget REST-API.
- `docs/reference/atkomst-och-nycklar.md`: **noll** träffar på "vercel".

Följden är att tre saker förblir obesvarade:

1. **Pekade kunddomänens alias på varje lyckad Production-deploy?** GitHub
   Deployments-API rapporterar bara den immutabla deployment-URL:en
   (`miranon-media-admin-<hash>.vercel.app`) — aldrig `admin.miranon.dev`.
   En deploy kan lyckas utan att aliaset följer med, och det syns inte här.
2. **Finns ett *Ignored Build Step* i projektinställningarna?** `vercel.json`
   bär inget, men inställningen kan sättas i webbgränssnittet.
3. **Är Skew Protection påslaget?** Det skulle mildra § 3.4 genom att hålla
   gamla assets nåbara. Inga `dpl_`-spår i serverad `index.html` (mätt: 0
   träffar), vilket **antyder** att det är av — men det är en **HYPOTES**, inte
   en mätning.

**Kvarstående oförklarat:** kortet uppger att `curl` mot domänen visade en
bundle UTAN routen under morgonen 2026-08-11. Vid den tidpunkten var senaste
Production-deploy `ca9832d7` (2026-08-10T21:22:28Z, `success`), och den commitens
träd innehöll routen (§ 2.3). `curl` går förbi varje service worker, så B-halvan
förklarar **inte** den observationen. Antingen följde aliaset inte med deployen
(punkt 1 ovan), eller så avsåg observationen något annat än vad kortet nedtecknade.
**Data som hade avgjort det:** Vercels deploy-lista med alias-tilldelning per
deployment — `vercel ls --prod` eller `GET /v6/deployments` med en giltig token.

**Rekommendation:** lägg in en Vercel-åtkomst i
`docs/reference/atkomst-och-nycklar.md` innan go-live. Utan den kan ingen
frontend-driftfråga besvaras i efterhand — bara approximeras via GitHub, som
denna utredning fick göra.

---

## 6. Bör CI-grinden byggas? — Nej

Kortet föreslår *"CI-grind som diffar deployad bundle-route-register mot HEAD
(samma klass som EF-driftens `task-37`)"*. **Analogin håller inte, och grinden
bör inte byggas.**

`task-37` gäller Edge Functions, som deployas **manuellt**. Där finns ingen
automatik som håller prod i takt med `main`, så en drift-grind fyller ett verkligt
tomrum. Frontend-deployen är motsatsen: **händelsedriven och automatisk**, och
mätningen visar att den fungerade — 25 av 25 Production-deploys lyckades, och
varje `main`-avancering som skulle deployas deployades.

Tre skäl att inte bygga den:

1. **Den skulle kapplöpa med sig själv.** CI kör vid merge; deployen sker efter.
   Med merges 2–5 min isär och byggen på 7–10 min vore "deployad bundle ≠ HEAD"
   normaltillståndet. Repot har precis den historien: `TASK-128`s deploy-klassare
   falsklarmade **sju gånger på en natt** innan den fixades, av exakt samma skäl
   — den läste ett asynkront tillstånd som om det vore synkront.
2. **Den fångar inte felet som finns.** Den mätta risken är inte att servern är
   gammal, utan att **klienten** är det (§ 3). En bundle-diff mot HEAD ser aldrig
   Lottas precache.
3. **Analogin är den varnade sorten.** `CLAUDE.md` bokför redan ett fall där två
   luckor såg ut som samma klass men hade motsatta rätta svar
   (`ZZ-GRANSKNING-*` mot `app-segment-test`) med uppmaningen *"Gör inte
   analogin."* Detta är samma form.

**Golvet skärs inte bort:** behovet av att veta att en deploy är ute är
verkligt — det är därför § 4 finns. Skillnaden är **on-demand vid go-live**
i stället för **kontinuerlig grind**. En människa frågar i det ögonblick svaret
betyder något, i stället för att en robot frågar var femte minut och lär oss
ignorera den.

---

## 7. Åtgärds-beskedet: SW-precachen kräver en åtgärd före Lotta släpps in

**JA.** Skälet är inte att gammal kod är obekvämt, utan att det nuvarande
tillståndet har tre egenskaper som var för sig vore godtagbara och tillsammans
inte är det:

1. Ingen uppdaterings-prompt existerar (§ 3.2).
2. Ingen automatisk omladdning existerar (§ 3.2).
3. Mellanläget kan **krascha** appen med ett MIME-fel (§ 3.4).

Lotta har ingen väg ut ur (3). Instruktionen som löser det är *"öppna DevTools
→ Application → Clear site data"* — utanför vad som kan begäras.

**Åtgärden är inte byggd i detta pass** (uppdragets avgränsning) och kräver ett
Marcus-beslut, eftersom den rör `ADR-047`s PWA-arkitektur. Optionsrymden, med
avvägningen:

| Väg | Vad den ger | Vad den kostar |
|---|---|---|
| **`registerType: 'autoUpdate'`** | Ny SW aktiveras och sidan laddas om automatiskt vid nästa navigation | Omladdning kan slå mitt i ett formulär — dataförlust |
| **`autoUpdate` + egen `onNeedReload`** | Samma detektion, men en diskret "Ny version finns — ladda om"-knapp i stället för tvångsomladdning | En UI-yta att designa; Lotta måste klicka |
| **`onRegisteredSW` med periodisk `registration.update()`** | Sätter en övre gräns för hur länge en öppen app kan vara omedveten | Löser bara detektionen — måste kombineras med en av raderna ovan |

**Min rekommendation till Marcus:** rad 2 + rad 3 tillsammans. Rad 3 ensam
gör ingen nytta, och rad 1 ensam riskerar att slänga bort Lottas inmatning.
Kombinationen ger en bunden upptäcktstid och ett omladdningsbeslut som ligger
hos användaren. Detta är dock ett **arkitekturval under `ADR-047`** och beslutas
inte här.

---

## 8. Källor

**Förstaparts-dokumentation:**

- [web.dev: The service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)
  — uppdateringstriggrar, waiting-tillståndet, `skipWaiting`, `clients.claim`
- [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
  — `skipWaiting()`/`clients.claim()`-semantiken
- [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)
  — `autoJobCancellation`, deployment-API-integrationen

**Artefakter på disk (mätta, inte citerade ur minnet):**

- `src/sw.ts`, `src/main.tsx` rad 117, `vite.config.ts`, `vercel.json`
- `node_modules/vite-plugin-pwa/dist/index.js` rad 169 + 800
- `node_modules/vite-plugin-pwa/dist/client/build/register.js`
- `node_modules/workbox-window/build/workbox-window.prod.umd.js`
- `docs/reference/staging-verifiering-runbook.md` § fälla 5 + SW-saneringskedjan

**Levande system (läsning):**

- GitHub Deployments-API, 500 deployments + 308 status-svar
- `curl` mot `https://admin.miranon.dev` (`/`, `/sw.js`, `/assets/*`)
