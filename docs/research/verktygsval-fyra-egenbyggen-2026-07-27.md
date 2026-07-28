---
owner: marcus803
updated: 2026-07-27
review_by: 2027-01-27
status: stable
---

# Verktygsval för fyra egenbyggen (2026-07-27)

> **Proveniens:** avgränsat research-pass, S91. Ingen kod rörd, inga paket
> installerade, inga tester körda, inga git-operationer. Passet läser repots
> fyra artefakter mot primärkällor: bibliotekens egen dokumentation och
> källkod, Playwrights och GitHub CLI:s egna repon, GitHubs dokumentation, och
> testkoden i de projekt som åberopas som precedent. Faktiska repon väger
> tyngre än blogginlägg — varje bärande påstående bär sin URL.
>
> Frågan passet svarar på: *vilka etablerade verktyg använder branschledare för
> fyra saker vi byggde för hand — och ska vi byta?* Att verktygsvalen gjordes
> utan research är redan konstaterat; passet ska ge det konkreta valet, inte
> upprepa diagnosen.

## Beslutstabell

|# | Egenbygget | Rekommenderat verktyg | Byt? | Kostnad | Motivering (en mening) |
|---|---|---|---|---|---|
|1|Hermetiska mockar + catch-all-vakt i Playwright|`msw` + `@msw/playwright` (`defineNetworkFixture`)|**Ja** — vakten och handler-lagret; typsnitts-routen behålls som egen route|2 devDeps; portning av `EF_FIXTURES` till handlers|Playwrights egen dokumentation avråder från MSW:s service worker, men `@msw/playwright` kör på `context.route`-lagret som Playwright själv rekommenderar — och `onUnhandledRequest` är vår vakt som ett dokumenterat biblioteks-kontrakt.|
|2|`check-docs.sh` — åtta grindar i ett kommando|Inget (Wireit närmast)|**Nej**|—|Inget verktyg kan uttrycka tri-state grön/röd/**SKIPPAD** — alla är binära exit-kod-maskiner, och Wireits enda genuina nyhet (caching) har cache-träff nära noll när indata per definition är det som just ändrats.|
|3|`ci-wait.sh` — vänta på CI, verdikt per jobb|Inget (`gh run watch` närmast)|**Nej**|—|`gh run watch --exit-status` fäller på topp-nivåns conclusion, saknar timeout helt, och `gh pr checks --watch` är fail-open på både `cancelled` och `skipped` — ett byte vore en regression mot ADR-071 §2(iii).|
|4|Två handsynkade sökvägs-allowlists i `ci.yml`|Behåll `tj-actions/changed-files`; lägg en paritets-grind|**Nej — men laga**|~20 rader skript + policy-fil|Problemet är inte att vi saknar en beroendegraf utan att tre listor saknar grind; att byta till `on: paths:` skulle dessutom flytta oss rakt in i required-checks-fällan vi i dag står utanför.|

Tre av fyra behålls. Det är inte artighet mot det befintliga — motiveringen per
post står i [§ Behåll ändå](#behåll-ändå), och i två av fallen är alternativet
mätbart sämre, inte bara likvärdigt.

## 1. Hermetisk mockning i Playwright

### Kort svar

Byt — men till **`@msw/playwright`**, inte till MSW:s service worker.
Skillnaden är inte en detalj: den ena vägen är den Playwright uttryckligen
avråder från, den andra är ett tunt lager ovanpå exakt det API Playwright
rekommenderar.

### Varför service-worker-vägen är fel, från Playwrights egen källa

Playwrights dokumentation nämner MSW vid namn och avråder:

> "It might be that you are using a mock tool such as Mock Service Worker (MSW).
> While this tool works out of the box for mocking responses, it adds its own
> Service Worker that takes over the network requests, hence making them
> invisible to `BrowserContext.route` and `Page.route`. If you are interested in
> both network testing and mocking, consider using built-in
> `BrowserContext.route` and `Page.route` for response mocking."
>
> — [`docs/src/network.md` § Missing Network Events and Service Workers](https://github.com/microsoft/playwright/blob/main/docs/src/network.md)

Varningen är inte teoretisk. Ett rapporterat fall i `@msw/playwright`-repot
beskriver precis symptomet: *"the MSW service worker registered in the browser
intercepts all fetch requests before `page.route()` gets a chance to handle
them"* ([issue #41](https://github.com/mswjs/playwright/issues/41)).

### Vad `@msw/playwright` faktiskt är

Paketet är MSW:s egen Playwright-bindning och kringgår hela problemet genom att
inte använda någon service worker alls. Kärnan är en enda
`context.route`-registrering:

```ts
// @msw/playwright@0.6.7 — src/fixture.ts, rad 83–153 (förkortat)
public async enable(): Promise<void> {
  await context.route(INTERNAL_MATCH_ALL_REG_EXP, async (route, request) => {
    const fetchRequest = new Request(request.url(), { /* … */ });
    if (this.options.skipAssetRequests && isCommonAssetRequest(fetchRequest)) {
      return this.safelyHandleRoute(() => route.fallback());
    }
    const response = await handleRequest(
      fetchRequest, crypto.randomUUID(), handlers,
      { onUnhandledRequest: this.options.onUnhandledRequest || 'bypass' },
      this.emitter, { resolutionContext: { quiet: true, baseUrl } },
    );
    if (response) { /* route.fulfill(...) */ }
    return this.safelyHandleRoute(() => route.fallback());
  });
}
```

Källa: [`mswjs/playwright` src/fixture.ts](https://github.com/mswjs/playwright/blob/main/src/fixture.ts).
Paketets README säger samma sak i klartext: det *"relies on the `page.route()`
API"*, och därför *"you don't have to initialize the worker script"*
([README](https://github.com/mswjs/playwright)).

Valet står alltså inte mellan *MSW* och *Playwrights route-lager*. Det står
mellan **handrullad kod ovanpå route-lagret** och **MSW:s matchningsmotor ovanpå
samma route-lager**.

Playwright har dessutom själv anammat MSW-handlers som vokabulär i sitt
component-testing-läge sedan v1.46:

> "Call `router.use(handlers)` and pass [MSW library](https://mswjs.io) request
> handlers to it. Here is an example of reusing your existing MSW handlers in
> the test."
>
> — [`docs/src/release-notes-js.md` § Version 1.46](https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-js.md)

### Vakten finns färdig — men ta callback-formen, inte strängen

`onUnhandledRequest` går rakt igenom till MSW:s kärna och accepterar
`'bypass' | 'warn' | 'error'` eller en callback
([mswjs.io](https://mswjs.io/docs/api/setup-worker/start)). Två varningar, båda
belagda i källkod:

1. **Fixturens default är `'bypass'`, inte MSW:s vanliga `'warn'`.** Sätts
   optionen inte alls är vakten avstängd (`src/fixture.ts` rad 124).
2. **De inbyggda strängarna hoppar över statiska tillgångar.** MSW:s
   `onUnhandledRequest` anropar `applyStrategy` först efter
   `if (!isCommonAssetRequest(request))`
   ([`onUnhandledRequest.ts`](https://github.com/mswjs/msw/blob/main/src/core/utils/request/onUnhandledRequest.ts)).

Camunda löser båda med en callback, och deras form är i sak vår vakt skriven
deklarativt:

```ts
// camunda/camunda — webapp/client/apps/orchestration-cluster-webapp/
//   test/pw-modules/test-extend.ts
const network = defineNetworkFixture({
  context,
  handlers,
  onUnhandledRequest(request, print) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.origin === appOrigin &&
        request.headers.get('accept')?.includes('text/html')) {
      return;                    // appens egen HTML-dokumentbegäran
    }
    print.error();               // allt annat fäller testet
  },
});
```

Källa: [camunda/camunda test-extend.ts](https://github.com/camunda/camunda/blob/main/webapp/client/apps/orchestration-cluster-webapp/test/pw-modules/test-extend.ts).

### Fällan som träffar oss specifikt

`skipAssetRequests` är `true` som default, och MSW:s tillgångs-heuristik
undantar `fonts.googleapis.com` på värdnamn samt allt som slutar på `.woff2`
([`isCommonAssetRequest.ts`](https://github.com/mswjs/msw/blob/main/src/core/isCommonAssetRequest.ts)).
Vår egen mätning visar att **747 av 865 restanrop (86,4 %) går till just Google
Fonts** ([`hermetik-matning-steg1-2026-07-26.md`](hermetik-matning-steg1-2026-07-26.md)).
Med defaultvärdet skulle MSW alltså släppa igenom exakt den trafikklass som
dominerar vår restrafik — tyst.

`rust-lang/crates.io` gick i fällan och kommenterade fixen i koden:

```ts
let worker = defineNetworkFixture({
  context,
  handlers,
  // Without this, requests for `foo.json` cannot be intercepted, which causes some tests to fail.
  skipAssetRequests: false,
});
```

Källa: [rust-lang/crates.io e2e/helper.ts](https://github.com/rust-lang/crates.io/blob/main/e2e/helper.ts).

Men `skipAssetRequests: false` bär sin egen kostnad, mätt i just vår projekttyp:
ett Vite-projekt rapporterade *"~3x test slowdown from the overhead of looking
for a matching request handler hundreds to thousands of times"*
([issue #13](https://github.com/mswjs/playwright/issues/13)) — orsakat av att
Vites lat-laddade moduler ger hundratals tillgångs-anrop per sida.

**Slutsats för oss:** typsnitten ska ändå inte bara blockeras utan *serveras ur
incheckade filer* — den routen måste finnas oavsett vilket bibliotek som bär
API-lagret. Behåll den som en egen Playwright-route (den vinner ändå, se
samexistens nedan) och låt MSW köra med default `skipAssetRequests: true` för
API-lagret. Då undviks båda fällorna.

### Delade handlers mot routes per fil

Det etablerade mönstret är en `handlers`-modul plus en `auto: true`-fixtur.
Epic Web-workshoppen *React End to End Testing with Playwright* lär ut exakt
det:

```ts
export const test = testBase.extend<Fixtures>({
  network: [
    async ({ context }, use) => {
      const network = defineNetworkFixture({ context, handlers: [] });
      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
});
```

Källa: [`epicweb-dev/react-e2e-testing-with-playwright`](https://github.com/epicweb-dev/react-e2e-testing-with-playwright/blob/main/exercises/03.guides/04.solution.api-mocking/README.mdx).

Playwrights egen dokumentation ger ingen motsvarande vägledning: sidan
[Mock APIs](https://playwright.dev/docs/mock) visar `page.route()` och
`routeFromHAR()` per test och nämner inte fixtur-delning alls. Frånvaron är värd
att notera — den delade sömmen får man bygga själv i ren Playwright, vilket är
precis vad `tests/e2e/support/test-bas.ts` gör i dag.

### Så här ser skillnaden ut i vår kod

Formen nedan var den rådande när passet skrevs (2026-07-27), hämtad ur
`tests/e2e/mer-vantelista.staging.test.ts`. **Rekommendationen är sedan dess
verkställd:** filen flyttades i task-59.5 till
[`tests/acceptance/mer-vantelista.acceptance.test.ts`](../../tests/acceptance/mer-vantelista.acceptance.test.ts)
och bär i dag exakt den `network.use()`-form som visas längre ner. Kod-utdraget
står kvar som historik — det är jämförelsen passet gjordes för, inte en levande
pekare:

```ts
const GET_WAITLIST = /\/functions\/v1\/get-waitlist/;

await page.route(GET_WAITLIST, async (route) => {
  if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: status === 200 ? JSON.stringify({ waitlist: rows }) : JSON.stringify({ error: 'x' }),
  });
});
```

Samma sak med MSW:

```ts
// tests/mocks/handlers.ts — en gång, delat av hela sviten
export const handlers = [
  http.get('*/functions/v1/get-waitlist', () => HttpResponse.json({ waitlist: [] })),
];

// i testet — override som nollställs automatiskt efteråt
network.use(
  http.get('*/functions/v1/get-waitlist', async () => {
    await delay(300);
    return HttpResponse.json({ waitlist: rows });
  }),
);
```

Vinsten är inte radantal utan tre saker som i dag är handrullade per fil:
sökvägs-matchning med parametrar, per-test-override med automatisk
återställning (`network.use()` mot vår nuvarande omregistrering), och en vakt
som är ett dokumenterat kontrakt i stället för vår egen kod. `delay` finns i
MSW:s kärn-export
([`src/core/index.ts`](https://github.com/mswjs/msw/blob/main/src/core/index.ts)),
så laddnings-testerna behåller sin form.

### Migrationskostnad: samexistens är belagd, inte hoppfull

Playwrights API-dokumentation slår fast två regler som tillsammans gör en
inkrementell migrering möjlig:

> "If a request matches multiple registered routes, the most recently registered
> route takes precedence."
>
> "Page routes take precedence over browser context routes (set up with
> `BrowserContext.route`) when request matches both handlers."
>
> — [`docs/src/api/class-page.md`](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-page.md)

`@msw/playwright` registrerar sig på **context**-nivå. De 136
`page.route`-anropen i 31 filer fortsätter alltså vinna över MSW-lagret utan
någon ändring — sviten kan flyttas fil för fil, inte i ett svep. En tidigare
bugg där paketet klippte andra routes (`page.unrouteAll()`) är åtgärdad
([issue #29](https://github.com/mswjs/playwright/issues/29), fixad i #15).

### Precedent — och vad de faktiskt gör

|Projekt|Vad de kör|Bär det vår fråga?|
|---|---|---|
|[rust-lang/crates.io](https://github.com/rust-lang/crates.io/blob/main/e2e/helper.ts)|Playwright + `@msw/playwright`, `skipAssetRequests: false`, frusen klocka|Ja — närmast identisk profil|
|[camunda/camunda](https://github.com/camunda/camunda/blob/main/webapp/client/apps/orchestration-cluster-webapp/test/pw-modules/test-extend.ts)|Playwright + `@msw/playwright` + axe, `onUnhandledRequest`-callback|Ja — vakten i produktion|
|[coveo/ui-kit](https://github.com/coveo/ui-kit)|`defineNetworkFixture` i flera e2e-fixturer|Ja, men mindre yta|
|[TryGhost/Ghost](https://github.com/TryGhost/Ghost/blob/main/apps/admin/test-utils/acceptance/worker.ts)|**Inte Playwright Test** — Vitest Browser Mode + MSW service worker|Nej, annan runner|
|[grafana/grafana](https://github.com/grafana/grafana/blob/main/playwright.config.ts)|Playwright mot **skarp** Grafana-server; MSW `setupServer` bara för enhetstester|Nej, inte hermetisk e2e|

Tre korrigeringar av premissen i beställningen är värda att skriva ut:

- **Ghost är ingen Playwright-precedent.** Deras acceptance-nivå kör
  `@vitest/browser-playwright` mot Chromium, med MSW:s *service worker* servad
  ur `test-utils/acceptance/public/mockServiceWorker.js`
  ([`vitest.acceptance.config.ts`](https://github.com/TryGhost/Ghost/blob/main/apps/admin/vitest.acceptance.config.ts)).
  Playwright används där som browser-provider, inte som testramverk — därför
  gäller inte service-worker-varningen dem.
- **Ghosts 418-vakt är handbyggd ovanpå MSW, inte `onUnhandledRequest`.** De kör
  `onUnhandledRequest: "bypass"` och lägger i stället en explicit
  catch-all-handler som svarar 418, bokför träffen och fäller testet i
  `afterEach` med en lista över vad som *var* mockat
  ([`worker.ts`](https://github.com/TryGhost/Ghost/blob/main/apps/admin/test-utils/acceptance/worker.ts)).
  Det valet är värt att låna: felet pekas på testet och säger vad man glömde, i
  stället för att kastas inne i avlyssningslagret.
- **Grafana är ett kontrastfall.** Deras `playwright.config.ts` startar en
  riktig Grafana via `./e2e-playwright/start-server` med `httpCredentials`, och
  mockar punktvis med `page.route`-hjälpare per svit
  (`e2e-playwright/utils/annotation-api-mock.ts` med flera). MSW lever hos dem i
  `packages/grafana-test-utils/src/server/index.ts` med `setupServer` från
  `msw/node` — alltså enhetstest-sidan, inte e2e.

### Mognad och kostnad, oskönmålat

|Signal|Värde|
|---|---|
|Senaste version|`0.6.7`, publicerad 2026-04-03 — **pre-1.0**|
|Först publicerad|2025-06-05|
|Stjärnor / öppna issues|263 / 3, senaste push 2026-06-21|
|Kodträffar på `defineNetworkFixture` i GitHubs kodsök|59 totalt|
|Beroenden|`msw` (18 direkta beroenden) + `@msw/playwright`|
|Stängda issues senaste halvåret|#28, #29, #31, #35, #37, #45 — typkrockar och route-konflikter|

Källor: [npm-registret för `@msw/playwright`](https://www.npmjs.com/package/@msw/playwright),
[GitHubs repo-metadata](https://github.com/mswjs/playwright).
**Tunn precedent deklareras öppet:** 59 kodträffar är tidig spridning. Baren om
tre branschledande projekt hålls (crates.io, Camunda, Coveo) men marginalen är
liten, och paketet har en huvudsaklig underhållare.

### Motargumenten, prövade

MSW:s upphovsman Artem Zakharchenko säger själv: *"When it comes to mocking, I
tend to think that if you can avoid it, avoid it"*
([Epic React-intervju](https://www.epicreact.dev/modules/epic-react-expert-interviews/mock-service-worker-msw-with-artem-zakharchenko)).
Invändningen är riktig men träffar en fråga vi redan avgjort: beslutet att göra
sviten hermetisk är taget och restrafiken är mätt. Kvar står bara *hur*
mockningen ska skrivas — och där är citatet neutralt.

Playwrights egen 2026-vägledning för komponenttester lutar fortfarande åt
route-API:t: *"Use `page.route()` as usual … Teams with MSW handler libraries
can start the worker inside a story or decorator instead"*
([`playwright-component-testing/SKILL.md`](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/tools/skills/playwright-component-testing/SKILL.md)).
MSW är alltså inget Playwright pekar ut som förstahandsval — det är ett
accepterat andrahandsval för team som redan har handlers.

Det starkaste motargumentet är hemmagjort: `tests/visual/support/hermetic.ts`
fungerar redan, med vakt, frusen klocka, seedad session och typsnitts-pinning.
Noll nya beroenden, bevisad kod. MSW:s reella övertag över den ramen är
`network.use()`-semantiken och matchningsmotorn — inte vakten, som vi redan har.

**Varför rekommendationen ändå blir byt:** arbetet framför oss är inte att skriva
om fungerande kod, utan att skriva *ny* hermetisk täckning för de 13 filer som
har äkta staging-beroende. Att skriva den mot en handler-tabell är billigare än
att skriva ytterligare hundratal `page.route`-anrop, och samexistensen gör att
inget måste rivas för att börja.

## 2. Samlat kommando för flera grindar

### Kort svar

Behåll `check-docs.sh`. **Inget av verktygen kan uttrycka skriptets tri-state**
— grön, röd, **skippad** — och det är hela poängen med ärlighets-kravet i dess
filhuvud.

### Kandidaterna, prövade

|Verktyg|Kör alla åtta, stoppar inte|Saknat verktyg → SKIPPAD|Nytt mot bash|Kostnad|
|---|---|---|---|---|
|`npm-run-all2`|Ja, `--continue-on-error`, men ingen slut-summering|**Nej**|Parallellism|1 devDep|
|`concurrently`|Nej — parallell-bara|**Nej**|Parallellism, prefix-utdata|1 devDep|
|**Wireit**|**Ja** — `WIREIT_FAILURES=continue` + `WIREIT_LOGGER=metrics`|**Nej**|**Caching**, dep-graf, watch|1 pre-1.0 devDep + config-block|
|`just`|Nej — bara `-`-prefix per rad|**Nej**|Argument-parsing|Extra binär utanför npm|
|`Task`|Nej — har bara `--failfast`|**Nej**|Watch|Extra binär utanför npm|
|GNU Make|Ja, `make -k`|**Nej**|Fil-baserad inkrementalitet|macOS levererar 3.81|
|npm självt|Nej|Nej|—|0|

Belägg för de bärande raderna:

- Wireit: *"When a failure occurs in `continue` mode, running scripts continue,
  and new scripts are started as long as the failure did not affect their
  dependencies. This mode is useful if you want a complete picture of which
  scripts are succeeding and which are failing"*, och *"Works with single
  packages, npm workspaces, and other monorepos"* —
  [README](https://github.com/google/wireit).
- `npm-run-all` (originalet) är dött: senast publicerad 4.1.5 i november 2018.
  Den levande forken är
  [`npm-run-all2`](https://github.com/bcomnes/npm-run-all2), v9.0.2 (2026-06-12).
- `Task` har ingen `--keep-going`; enda relaterade flaggan är `-F, --failfast`,
  *"Stop executing dependencies as soon as one of them fails"* —
  [taskfile.dev](https://taskfile.dev/docs/reference/cli).
- npm har ingenting inbyggt: `--if-present` gäller ett **saknat script**, aldrig
  en **saknad binär** —
  [docs.npmjs.com](https://docs.npmjs.com/cli/v12/commands/npm-run).

### Varför tri-state-kravet fäller alla

Samtliga kandidater är exit-kod-maskiner: 0 eller icke-0. `command -v lychee`
måste bo någonstans. Flyttas den till ett wrapper-script per grind har man bara
flyttat bash och dessutom förlorat den samlade skippad-listan i slutet — raderna
137–150 i `check-docs.sh`, som är hela ärlighets-kravets poäng.

### Wireit närmare granskat, eftersom det var den seriösa kandidaten

Wireit har äkta tung precedent: `puppeteer/puppeteer`, `lit/lit` och
`FormidableLabs/victory` kör sina bygg- och testgrafer genom det. Formen skulle
se ut så här:

```jsonc
// package.json — grindarna bor kvar som vanliga npm-scripts
{
  "scripts": {
    "check:docs": "wireit",
    "gate:markdownlint": "markdownlint-cli2",
    "gate:frontmatter": "bash scripts/check-frontmatter.sh"
  },
  "wireit": {
    "check:docs": { "dependencies": ["gate:markdownlint", "gate:frontmatter"] }
  }
}
```

Två skäl att ändå avstå:

1. **Cachen betalar sig inte här.** Wireit hoppar en grind vars `files` är
   oförändrade. Våra grindars indata är `docs/**` och `tasks/**` — exakt det som
   ändrats i den commit som gör att grinden körs. Cache-träffen går mot noll.
2. **Underhållet är svagt.** Fortfarande pre-1.0 efter fyra år, och 0.14.12
   (april 2025) följdes av en fjortonmånaders lucka till 0.14.13 (juni 2026).
   Repot lever, men commit-loggen är i huvudsak beroende-bumpar.

Kvar blir parallellism över åtta snabba grindar, mot priset av ett pre-1.0-beroende
och en förlorad klassning. Det faller på den dubbelriktade över-engineering-vakten.

## 3. Vänta på CI och verifiera per jobb

### Kort svar

Behåll `ci-wait.sh`. `gh run watch --exit-status` täcker två av skriptets fem
uppgifter, och det närmaste första-parts-alternativet är fail-open på precis de
tillstånd vår grind finns för att fånga.

### Vad `--exit-status` faktiskt gör, ur källan

Verdiktet är två identiska rader, före loopen och efter:

```go
if opts.ExitStatus && run.Conclusion != shared.Success {
    return cmdutil.SilentError
}
```

Det är **topp-nivåns run-conclusion, inte per jobb** — inget jobb-anrop görs för
verdiktet ([`pkg/cmd/run/watch/watch.go`](https://github.com/cli/cli/blob/trunk/pkg/cmd/run/watch/watch.go),
rad 140 och 207). `SilentError` mappar till `exitError = 1`, så flaggan ger bara
0 eller 1 ([`internal/ghcmd/cmd.go`](https://github.com/cli/cli/blob/trunk/internal/ghcmd/cmd.go)).

Väntloopen är:

```go
for run.Status != shared.Completed {
    // …
    time.Sleep(duration)
}
```

utan deadline eller iterationstak (samma fil, rad 161 och 185). **Blir körningen
aldrig klar hänger `gh run watch` för evigt.** Vår `--timeout`-budget har ingen
motsvarighet.

### Punkt för punkt

|Skriptets uppgift|Täcks av `gh`?|
|---|---|
|Pollar API:t|**Ja**|
|Terminal-state före första sömnen|**Ja** — `if run.Status == shared.Completed` står före loopen, sedan [issue #3962](https://github.com/cli/cli/issues/3962) fixades 2021|
|Per-jobb-verdikt (ADR-071 §2(iii))|**Nej** — kräver ett separat `gh run view --json jobs`, alltså skriptets steg 3|
|`skipped` blockerar inte men bevisar inget (L322)|**Nej** — ingen `gh`-yta uttrycker det|
|Superseddad ≠ röd (exit 4)|**Nej**, och kan inte byggas i `gh` heller — API:t bär inte informationen|
|Tidsbudget|**Nej** — ingen timeout finns|
|Run-upplösning efter push|**Nej** — `watch` kräver ett run-ID man redan har|

Superseddad-punkten är nu belagd mot schemat, inte bara empiriskt: körning
`30201494270` har 35 topp-nivå-nycklar och den enda som matchar
`cancel|reason|abort|supersed` är `cancel_url` — POST-endpointen. `run_attempt`,
`event` och `triggering_actor` diskriminerar inte. Skriptets kommentar rad 45–50
stämmer.

### Sidofyndet som avgör saken

`gh pr checks --watch` ser ut som svaret — den ger check-nivå-verdikt, har
`--required`, `--fail-fast` och `--interval`. Den är det inte. Bucket-mappningen:

```go
case "SUCCESS":                                       counts.Passed++
case "SKIPPED", "NEUTRAL":                            counts.Skipping++
case "ERROR", "FAILURE", "TIMED_OUT", "ACTION_REQUIRED": counts.Failed++
case "CANCELLED":                                     counts.Canceled++
```

och exit-logiken:

```go
if counts.Failed > 0 {
    return cmdutil.SilentError
} else if counts.Pending > 0 {
    return cmdutil.PendingError
}
return nil
```

Källor: [`pkg/cmd/pr/checks/aggregate.go`](https://github.com/cli/cli/blob/trunk/pkg/cmd/pr/checks/aggregate.go),
[`pkg/cmd/pr/checks/checks.go`](https://github.com/cli/cli/blob/trunk/pkg/cmd/pr/checks/checks.go).

**Varken `Canceled` eller `Skipping` fäller.** En helt avbruten körning ger exit
0. Det är motsatt riktning mot `gh run watch` (som fäller på cancelled) och rakt
emot L322. Som merge-grind vore bytet en regression. Bonus-begränsning:
`--watch` kan inte kombineras med `--json`, så maskinläsbar per-check-utdata i
watch-läge är omöjlig.

### Andra verktyg

Inget etablerat CLI finns. Det som hittades är hobbyprojekt:
`fini-net/gh-observer` (7 stjärnor), `garvincasimir/gh-watch-ci` (0),
`xpepper/gh-log-ci` (0). `wait-on-check-action` är en GitHub Action som körs
inuti CI — fel yta för en lokal grind. `act` kör workflows lokalt, `hub` är
deprekerat, `gh-actions-cache` rör bara cache-poster.

Det branschen gör är `gh run watch --exit-status` för människor vid tangentbordet
och en egen poll-loop mot `gh … --json` när ett skript ska fatta beslut. Vår form
är den senare. Det närmaste erkända problemet i `cli/cli` är startup-racet, i
deras egen [discussion #12698](https://github.com/cli/cli/discussions/12698):
*"`gh pr checks --watch` bombing as soon as you push a new PR, sitting there
useless until the first job actually starts running"* — precis det vår
run-upplösningsloop (rad 153–167) hanterar.

### En ärlig justering

Skriptets filhuvud motiverar terminal-kontrollen-före-första-sömnen som något
`gh` saknar. Det stämmer inte längre: `gh run watch` har haft den sedan 2021.
Den delen av rationale bör skrivas om vid nästa beröring — argumentet bär ändå
på de fem punkter som återstår.

## 4. Härleda vilka tester som påverkas av en ändring

### Kort svar

Byt inte verktyg. Problemet är inte att vi saknar en beroendegraf — det är att
tre listor saknar grind. Lägg grinden.

### Varför monorepo-verktygen är fel svar

För **ett** paket kollapsar `nx affected` och `turbo --affected` till samma
binära beslut som allowlisten redan tar. Nx mappar ändrade filer till *projekt*
och kör tasks på hela det påverkade projektet
([nx.dev](https://nx.dev/docs/features/ci-features/affected)); Turborepos
`--affected` filtrerar till *paket*
([turborepo.dev](https://turborepo.dev/docs/reference/run)). Med ett projekt
finns inget att filtrera. Priset är en projektgraf, en ny task-runner, daemon
och cache-infrastruktur.

Den enda genuint nya kapabiliteten är Nx `namedInputs` — filnivå-cache *inom* ett
projekt, så att en docs-ändring inte invaliderar en test-task
([nx.dev/docs/reference/inputs](https://nx.dev/docs/reference/inputs)). Noterbart
för framtiden, inte värt adoptionen nu, särskilt när datalagret byts inom ett par
veckor.

### Playwright har faktiskt en flagga — och den duger inte här

Premissen i beställningen är fel på en punkt: Playwright *har* test-nivå-härledning.

> "New CLI option `--only-changed` will only run test files that have been
> changed since the last git commit or from a specific git 'ref'. **This will
> also run all test files that import any changed files.**"
>
> — [`docs/src/release-notes-js.md` § Version 1.46](https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-js.md)

Den följer alltså den statiska importgrafen. Ändå är den **osund som grind i
just detta repo**: våra e2e-, a11y- och visual-tester navigerar till en URL och
importerar inte komponenterna de provar. En ändring i en vy skulle därför inte
dra in testet som täcker den — sviten skulle tyst hoppa tester som ändringen
bryter. Det är samma fail-open-klass som L322. En känd svaghet åt andra hållet
finns också: en fixture-ändring drar in hela sviten
([issue #34339](https://github.com/microsoft/playwright/issues/34339)).

Flaggan är ett utvecklar-verktyg för snabb iteration lokalt. Den är inte en
CI-grind, och ska förkastas explicit — inte glömmas.

### Required-checks-fällan: vi står utanför den, och ska fortsätta göra det

GitHubs egen felsökningstabell är entydig:

|Orsak|Utfall|Åtgärd enligt GitHub|
|---|---|---|
|"A workflow is skipped by path filtering, branch filtering, or a commit message"|"Associated checks stay in a 'Pending' state and block merging"|"Avoid requiring workflows that can be skipped."|
|"A job is skipped by a conditional"|"The job reports 'Success'"|"See Using conditions to control job execution"|
|"A job depends on a failed job"|"The dependent job is skipped and may not block merging"|"Use `always()` with `needs` for required checks that depend on other jobs."|

Källa: [`docs.github.com` — Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks).

**Vår `ci.yml` sitter redan på rad två och tre i den tabellen.** Den har inga
sökvägsfilter på triggern — den använder jobbnivå-`if:` (som rapporterar
Success) plus aggregatorn med `if: ${{ always() }}` och fail-closed
`needs`-läsning. Att byta till `on: paths:` skulle flytta oss till rad ett, där
PR:en fastnar i Pending. Rör inte den arkitekturen.

Två utbredda påståenden är folklore, inte belagda: att en "dummy workflow med
samma jobbnamn" är den rekommenderade lösningen (den står inte i GitHubs
dokumentation), och att merge queue löser problemet (sökvägsfilter fungerar inte
för `merge_group`-triggern). Ingen GitHub-changelog 2025–2026 hittades som ändrar
beteendet.

### Minsta ingreppet

Kommentaren på `ci.yml` rad 80–84 säger att paret "hålls för hand". Gör handen
till en grind, i det alltid-på lint-jobbet, i repots egen config-driven-form
(`.{grindvakt}-policy.conf` + `scripts/test-check-*.sh`):

```yaml
      - name: Check changed-files allowlist parity
        # L322-klassen: en docs-verktygs-configfil som står i changed-files-listan
        # men saknas i changed-docs-listan blir tyst ovaliderad (fail-open).
        run: bash scripts/check-filter-parity.sh
```

Skriptet läser båda `files:`-blocken ur `ci.yml` och kräver att varje post i
`PARITY_PATHS` finns i båda. Cirka 20 rader, noll semantikrisk, och den enda
mekanismen som faktiskt tar bort handsynkningen.

### Den strukturella fixen, parkerad

`dorny/paths-filter` parsar `filters:` som riktig YAML och stödjer både ankare
och en separat filterfil ([README](https://github.com/dorny/paths-filter)) —
till skillnad från `tj-actions/changed-files`, vars `files:` är en *literal
block scalar* där ankare är strukturellt omöjliga (repots egen empiri, `ci.yml`
rad 86–89). En delad `.github/filters.yaml` med ankare mot tre konsumenter vore
alltså den riktiga fixen.

Den parkeras ändå. `only_changed` (tj-actions: *alla* filer matchar) är inte
samma sak som dornys default `any`, så konverteringen kräver
negations-inversion plus `predicate-quantifier: 'every'` — och måste bevisas med
samma kontrastbevis-tripel som D1-klassningen redan kräver. Den semantikrisken
är fel att ta veckorna före Postgres-skiftet.

**Om CVE-2025-30066:** `tj-actions/changed-files` om-taggades i mars 2025 till en
skadlig commit som dumpade runner-minnets secrets i byggloggen; patchad i 46.0.1
([GHSA-mrrh-fwg8-r2c3](https://github.com/advisories/GHSA-mrrh-fwg8-r2c3)). Vi
kör v47.0.6, SHA-pinnad — utanför det sårbara intervallet, och SHA-pin är exakt
rätt härdning mot en om-taggnings-attack. **CVE:n ensam motiverar inte ett byte**
(Argo CD bytte ändå till dorny,
[PR #22359](https://github.com/argoproj/argo-cd/pull/22359)). En ärlig nyans:
SHA-pin döljer Dependabot-alerts för actionen.

## Behåll ändå

Vi vill inte byta för bytandets skull. Tre av de fyra ska behållas, och skälen
är inte lika starka:

- **`check-docs.sh` — behåll, starkt skäl.** Kravet skriptet uppfyller
  (tri-state med skippad-klassning) finns inte i något av verktygen. Wireit är
  den enda seriösa kandidaten och den vinner bara parallellism över åtta redan
  snabba grindar. Detta är ett fall där egenbygget är rätt svar, inte ett
  försummat verktygsval.
- **`ci-wait.sh` — behåll, starkt skäl.** Här är alternativet mätbart sämre:
  `gh run watch --exit-status` ger topp-nivå-verdikt utan timeout, och
  `gh pr checks --watch` släpper igenom både avbrutna och skippade körningar.
  Skriptet finns för att ADR-071 §2(iii) kräver per-jobb, och den ytan saknas i
  första-parts-verktyget. En rad i filhuvudet bör dock rättas: terminal-kontroll
  före första sömnen är inte längre något `gh` saknar.
- **Allowlist-paret — behåll verktyget, laga bristen.** `tj-actions/changed-files`
  är inte fel val. Bristen är att paritetsinvarianten är dokumenterad i en
  kommentar i stället för att vara grindad, och att byta action löser inte det
  förrän en delad filterfil faktiskt införs. Grinden först, strukturen sen.

Endast punkt 1 är ett äkta försummat verktygsval: där fanns ett moget mönster,
Playwright pekar själv på MSW-handlers, och tre riktiga projekt kör exakt
uppställningen.

## Öppna frågor

1. **Ska typsnitts-pinningen bo i MSW eller kvar i en egen route?** Passet
   rekommenderar egen route (den vinner ändå på sid-nivå), men om
   `skipAssetRequests: false` behövs av andra skäl blir svaret ett annat — och
   då aktualiseras 3x-prestandarisken från issue #13. Frågan bör avgöras med en
   mätning på vår faktiska svit, inte med resonemang.
2. **Vad händer med handlers vid Postgres-skiftet?** EF-svarens form styr
   handler-tabellen. Om skiftet ändrar svarsformerna brett kan det vara billigare
   att skriva handlers *efter* skiftet än att portera `EF_FIXTURES` två gånger.
3. **Vilka paths hör till `PARITY_PATHS`?** Passet föreslår grinden men har inte
   härlett den auktoritativa listan; den bör läsas ur `ci.yml`-kommentarens egen
   uppräkning och verifieras mot vad docs-jobbets grindar faktiskt läser.
4. **Bazel avfärdades utan egen research.** Slutsatsen vilar på
   kostnadsresonemang. Ska den bära en ADR-rad behöver den egen källa.
5. **`gh run watch` vid nätverksfel.** Om en transient 5xx kan ge exit 1 utan att
   CI är röd är inte utrett — `api`-lagrets retry-policy lästes inte.

## Källförteckning

### MSW och Playwright-integration

- [`mswjs/playwright` — README och src/fixture.ts](https://github.com/mswjs/playwright)
- [`mswjs/playwright` issue #13 — prestanda vid `skipAssetRequests: false`](https://github.com/mswjs/playwright/issues/13)
- [`mswjs/playwright` issue #29 — samexistens med `page.route`](https://github.com/mswjs/playwright/issues/29)
- [`mswjs/playwright` issue #41 — service worker mot fixtur](https://github.com/mswjs/playwright/issues/41)
- [mswjs/msw — `isCommonAssetRequest.ts`](https://github.com/mswjs/msw/blob/main/src/core/isCommonAssetRequest.ts)
- [mswjs/msw — `onUnhandledRequest.ts`](https://github.com/mswjs/msw/blob/main/src/core/utils/request/onUnhandledRequest.ts)
- [mswjs.io — `onUnhandledRequest`-optionen](https://mswjs.io/docs/api/setup-worker/start)
- [npm — `@msw/playwright`](https://www.npmjs.com/package/@msw/playwright)

### Playwright, förstapartskälla

- [`docs/src/network.md` — MSW-varningen](https://github.com/microsoft/playwright/blob/main/docs/src/network.md)
- [`docs/src/api/class-page.md` — route-precedens](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-page.md)
- [`docs/src/release-notes-js.md` — v1.46 `--only-changed` och `router`-fixturen](https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-js.md)
- [`playwright-component-testing/SKILL.md` — 2026-vägledningen](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/tools/skills/playwright-component-testing/SKILL.md)
- [`playwright.dev` — Mock APIs](https://playwright.dev/docs/mock)
- [`playwright.dev` — Test CLI](https://playwright.dev/docs/test-cli)
- [issue #34339 — `--only-changed` och fixtures](https://github.com/microsoft/playwright/issues/34339)

### Precedent-repon

- [rust-lang/crates.io — e2e/helper.ts](https://github.com/rust-lang/crates.io/blob/main/e2e/helper.ts)
- [camunda/camunda — test-extend.ts](https://github.com/camunda/camunda/blob/main/webapp/client/apps/orchestration-cluster-webapp/test/pw-modules/test-extend.ts)
- [coveo/ui-kit](https://github.com/coveo/ui-kit)
- [TryGhost/Ghost — acceptance-worker och vitest-config](https://github.com/TryGhost/Ghost/blob/main/apps/admin/test-utils/acceptance/worker.ts)
- [grafana/grafana — `playwright.config.ts`](https://github.com/grafana/grafana/blob/main/playwright.config.ts)
- [`epicweb-dev/react-e2e-testing-with-playwright`](https://github.com/epicweb-dev/react-e2e-testing-with-playwright)

### Task runners

- [google/wireit — README](https://github.com/google/wireit)
- [bcomnes/npm-run-all2](https://github.com/bcomnes/npm-run-all2)
- [open-cli-tools/concurrently](https://github.com/open-cli-tools/concurrently)
- [taskfile.dev — CLI-referens](https://taskfile.dev/docs/reference/cli)
- [docs.npmjs.com — `npm run`](https://docs.npmjs.com/cli/v12/commands/npm-run)

### GitHub CLI och Actions

- [cli/cli — `pkg/cmd/run/watch/watch.go`](https://github.com/cli/cli/blob/trunk/pkg/cmd/run/watch/watch.go)
- [cli/cli — `pkg/cmd/pr/checks/aggregate.go`](https://github.com/cli/cli/blob/trunk/pkg/cmd/pr/checks/aggregate.go)
- [cli/cli — checks.go](https://github.com/cli/cli/blob/trunk/pkg/cmd/pr/checks/checks.go)
- [cli/cli — `internal/ghcmd/cmd.go`](https://github.com/cli/cli/blob/trunk/internal/ghcmd/cmd.go)
- [cli/cli issue #3962](https://github.com/cli/cli/issues/3962)
- [cli/cli discussion #12698](https://github.com/cli/cli/discussions/12698)
- [`docs.github.com` — Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks)
- [dorny/paths-filter](https://github.com/dorny/paths-filter)
- [GHSA-mrrh-fwg8-r2c3 — CVE-2025-30066](https://github.com/advisories/GHSA-mrrh-fwg8-r2c3)
- [argoproj/argo-cd PR #22359](https://github.com/argoproj/argo-cd/pull/22359)

### Monorepo-verktyg

- [nx.dev — affected](https://nx.dev/docs/features/ci-features/affected)
- [nx.dev — inputs och namedInputs](https://nx.dev/docs/reference/inputs)
- [turborepo.dev — run-referensen](https://turborepo.dev/docs/reference/run)

### Internt

- [`hermetik-matning-steg1-2026-07-26.md`](hermetik-matning-steg1-2026-07-26.md)
- [`staging-svitens-tidsbudget-2026-07-26.md`](staging-svitens-tidsbudget-2026-07-26.md)
