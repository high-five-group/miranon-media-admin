---
owner: marcus803
updated: 2026-07-29
review_by: 2027-01-29
status: stable
---

# Finns färdigt verktyg för källkodsdrivet testurval på vår stack? (Code, 2026-07-29)

> **Proveniens:** avgränsat research-pass, underlag för ett arkitekturbeslut.
> Ingen kod, ingen config och ingen workflow rörd — enda leveransen är denna fil.
> Experimenten kördes i en egen worktree och revs efter mätningen; arbetsträdet
> verifierades rent efter varje. Varje verktygspåstående bär antingen en mätning
> jag själv körde 2026-07-29 mot repots faktiska versioner, eller en käll-URL
> till primärkällan. Där jag lutar mig på en delegerad webbhämtning står det
> utskrivet. En parallell agent täcker precedent och mekanism-taxonomi; detta
> pass svarar bara på vad vi kan köra i morgon.

## Kort svar

**Både och — och delningen går på ett annat ställe än frågan antog.**

Det finns inget färdigt verktyg som gör hela jobbet, men **två av de tre delarna
finns färdiga och är mätt fungerande på vår stack**: grafproduktionen och
invariant-grinden. Det som saknas är **bron mellan spec och rutt** — den som
översätter `page.goto('/hem')` till `src/routes/_authenticated/hem.tsx`. Den bron
kan inget verktyg producera åt oss, därför att den inte är en import.

Tre fynd flyttar beslutet mer än verktygsvalet gör:

1. **Premissen i frågan är falsifierad.** Antagandet att "de flesta komponenter
   är exklusivt nådda via en rutt" håller inte. Mätt: **37 av 134** nåbara
   icke-rutt-filer nås av exakt en rutt. **97 nås av två eller fler.**
   `registration-display` är inte undantaget — den är regeln.
2. **En rutt-rotad importgraf ser strukturellt inte datalagret.** `AirtableAdapter`,
   `dataSource`, `router.ts` och `main.tsx` sitter OVANFÖR rutterna i grafen,
   injicerade via router-context per [ADR-055](../decisions/ADR-055-datakalla-atkomst-router-context-di.md).
   En ändring där väljer **noll** acceptance-specar i varje grafvariant jag mätte —
   samtidigt som varenda hermetiskt test kör igenom just den koden. Det är
   falsk-grön-klassen i ren form, och den kommer ur vår egen arkitektur, inte ur
   ett verktygsfel.
3. **Playwright har en fungerande, odokumenterad hake för exakt det här.**
   `--only-changed` går att lära appens graf via en plugin (`populateDependencies`
   → `cc.setExternalDependencies`). Jag körde tvåsidigt bevis i denna worktree:
   utan haken 0 tester, med haken exakt rätt spec, och en ändring utanför den
   deklarerade grafen ger 0 tester och **exit 0**. Haken heter `privateConfiguration`
   i Playwrights egen källa.

Vinsten är däremot verklig och stor. Simulerat medelurval på den bästa grafen är
4,5 av 18 spec-filer, och en fyra-filers-körning kostade **25 s mot full klass
114 s** lokalt — 22 % av väggtiden, trots att små urval får sämre parallellitet.
Att andelen överlever CI:s maskin och `retries: 2` är dock inte mätt.

---

## Läget vi mäter mot

| Sak | Version | Hur verifierad |
|---|---|---|
| `@playwright/test` / `playwright-core` | 1.61.1 | `require(...)/package.json` i repots `node_modules` |
| `vite` | 8.1.5 | samma |
| `typescript` | 7.0.2 | samma + `npx tsc --version` |
| `@tanstack/router-plugin` | 1.168.20 | samma |
| Node | 24.13.1 | felutskrift från `node -e` |
| `madge` | 8.0.0 | installerad i scratchpad, `--version` |
| `dependency-cruiser` | 18.1.0 | installerad i scratchpad, `npm ls` |
| Acceptance-klassen | 18 spec-filer, 153 tester | `playwright test --project=acceptance --list` |
| `src/**` | 174 `.ts`/`.tsx` på disk (+ genererad `routeTree.gen.ts`) | `find` |

Nuvarande urval i `scripts/acceptance-urval.sh` är rent **spec-lokalt**: det ger
urval bara när varenda ändrad fil utanför D0-klassen redan ÄR en acceptance-spec.
Källkodsurvalet är slotten [ADR-077 § Beslut 1](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
lämnade öppen med avsikt.

---

## A · Kandidat-verktygen, prövade mot vår faktiska stack

### A.1 Nx `affected` — fel granularitet, inte fel verktyg

Nx `affected` opererar på **projekt**, inte filer. Nx egen dokumentation säger det
rakt ut i sin motivering för att bryta upp projekt:

> "if projectA contains 10 tests, but only 5 of them were affected by a particular
> code change, all 10 tests will be run by `nx affected -t test`"
> — [nx.dev · Project Size](https://nx.dev/docs/concepts/decisions/project-size)

Vi är **ett** projekt. `nx affected` skulle därför alltid ge antingen allt eller
inget — exakt den binära klassning `changed`-jobbet redan gör, till priset av att
adoptera Nx workspace-konfiguration, projektgraf-plugins och task-runner.

Att använda `affected` "utan att adoptera hela Nx" är inte meningsfullt: `affected`
ÄR projektgrafen. För att få nytta av den skulle vi behöva stycka `src/` i flera
Nx-projekt — en strukturomläggning av repot för att blidka ett verktyg. Det är
den dyraste vägen på listan och den enda som tvingar fram strukturändringar.

**Avfärdad.** Inte för att den är dålig, utan för att dess enhet är projekt och
vår fråga ställs på fil-nivå.

*Obelagt:* Nx Cloud "Atomizer" splittrar e2e-specar till separata tasks. Jag
kunde inte belägga att den ger fil-nivå-*affected* (delegerad hämtning av
Nx parallelliserings-dokumentationen returnerade inget om e2e-splittring alls).
Den är hur som helst en Nx-Cloud-produkt och adopteras inte styckevis.

### A.2 Turborepo — samma vägg, en våning ned

Turborepos filtrering och cache arbetar på **paket**. `turbo build --filter=[HEAD^1]`
jämför commits för att hitta *påverkade paket*, inte filer eller tester
([turborepo.dev · Running tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks),
delegerad hämtning). Ett paket — samma binära utfall som Nx, utan Nx grafmodell.

**Avfärdad**, samma skäl.

### A.3 Playwrights egen `--only-changed` — rätt maskineri, fel graf

Dokumentationen är ärlig om vad den gör:

> "To detect test files affected by your changeset, `--only-changed` analyses your
> suites' dependency graph." … "This is a heuristic and might miss tests, so it's
> important that you always run the full test suite after the preliminary test run."
> — [Playwright · Continuous Integration](https://playwright.dev/docs/ci)
> (delegerad hämtning)

Nyckelordet är **suites'**. Jag läste implementationen i den pinnade versionen
(`node_modules/playwright/lib/common/index.js`, 1.61.1): `fileDependencies` fylls
av `startCollectingFileDeps`/`stopCollectingFileDeps` när Playwrights egen
transform laddar *testfilerna*. Appens moduler passerar aldrig den transformen, så
de finns inte i kartan.

**Mätt i denna worktree 2026-07-29** (reproducerar `TASK-75`:s fynd oberoende):
en tillagd rad i `src/components/registrations/registration-display.ts` —
importerad av tio moduler — ger

```text
Listing tests:
Total: 0 tests in 0 files
```

### A.4 Playwrights plugin-hake — det närmaste ett färdigt svar som finns

I samma källa, `lib/runner/index.js` rad 6018–6024, står laddnings-ordningen:

```js
if (testRun.options.onlyChanged || options.populateDependencies) {
  for (const plugin of testRun.config.plugins)
    await plugin.instance?.populateDependencies?.();
}
if (testRun.options.onlyChanged) {
  const changedFiles = await detectChangedTestFiles(...);
  testRun.preOnlyTestFilters.push((test) => changedFiles.has(test.location.file));
}
```

Playwright anropar alltså `populateDependencies()` på varje konfigurerad plugin
**precis innan** den räknar ut vilka filer som ändrats. Plugins registreras via
`userConfig['@playwright/test'].plugins` (rad 555–556) — variabeln heter
`privateConfiguration` i Playwrights egen kod, vilket är hela statusbeskedet.
Kartan fylls med `cc.setExternalDependencies(testfil, [appfiler])`, exponerad via
paketets `exports`-map på `playwright/lib/common`.

**Tvåsidigt bevis, kört 2026-07-29 mot 1.61.1:**

| Läge | Deklarerad kant | Utfall |
|---|---|---|
| Utan plugin | – | `Total: 0 tests in 0 files` |
| Med plugin, ändrad fil I grafen | `hem.acceptance` → `registration-display.ts` | `Running 28 tests`, exakt hem-specen |
| Med plugin, ändrad fil UTANFÖR grafen | samma karta, ändrade `domain/models/Person.ts` | 0 tester, **exit 0** |

Två fällor som mätningen avtäckte och som inte står någonstans:

- **`--list` fungerar inte.** I list-läge är task-kedjan bara
  `[createLoadTask, createReportBeginTask]` (rad 6503–6506) — `createPluginSetupTasks`
  saknas, så plugin-instansen skapas aldrig och `populateDependencies` anropas
  aldrig. Haken fungerar bara i skarpt körläge. En CI-design som "torrkör med
  `--list` först" hade tyst fått fel svar.
- **Negativa fallet är exit 0 med noll tester.** En ofullständig graf ger alltså
  en grön körning som ser normal ut. Det är falsk-grön-mekanismen, inbyggd.

**Bedömning:** detta är den enda kandidaten som återanvänder ett moget
urvals-maskineri (git-diffen, fil-matchningen, filtret) i stället för att bygga om
det. Priset är ett beroende på en privat API-yta som kan försvinna i vilken
minor som helst utan changelog-rad — och som inte fälls av något typkontrakt när
den gör det.

### A.5 TypeScript som grafkälla — funkar, med en varning som gäller hela ekosystemet

`typescript@7.0.2` är den nativa kompilatorn. **Kompilator-API:t är borta ur
paketets huvudexport** — mätt:

```js
require('typescript')  // → { version, versionMajorMinor }   (två nycklar, inget mer)
```

Varje verktyg som gör `require('typescript')` för att parsa TS får alltså
ingenting hos oss. Att madge och dependency-cruiser ändå fungerar beror på att de
drar in **sin egen `typescript@5.9.3`** som beroende (verifierat med `npm ls typescript`
i deras träd). Det är en tyst divergens värd att skriva ned: grafen räknas av en
annan kompilator än den som typkontrollerar koden.

CLI:t är däremot intakt. `npx tsc --all` listar både `--listFiles` och
`--explainFiles` (och `--traceResolution`, `--generateTrace`). `--listFilesOnly`
ger en platt fillista utan kanter — värdelös som graf. `--explainFiles` ger
**omvända kanter, fullständigt**:

```text
src/components/registrations/registration-display.ts
   Imported via '@/components/registrations/registration-display' from file 'src/components/hem/NyaAnmalningarCard.tsx'
   … (tio rader totalt, både @/-alias och relativa former)
   Matched by include pattern 'src' in 'tsconfig.app.json'
```

Tio importörer — samma tio som madge, dependency-cruiser och Rollup-grafen ger
oberoende. Formatet är dock fri prosa avsedd för människor; att grinda på det
betyder att parsa engelska meningar. Det är ett verkligt underlag men det sämsta
av de fyra.

### A.6 `vite-plugin-*`-ekosystemet — ett träffande paket, i skick att inte adoptera

`vite-plugin-import-graph` beskriver sig som gjord bland annat för
"test impact analysis". Fakta ur npm-registret 2026-07-29:

```text
version      = '0.0.1'
time.modified = '2024-10-16T09:31:15.902Z'
peerDependencies = { vite: '^5.0.0' }
```

Version 0.0.1, orörd i drygt 21 månader, pinnad mot en Vite-major tre steg bakom
vår 8.1.5. **Men jag mätte det i stället för att avfärda på pappret**: installerad
med `--legacy-peer-deps` och inkopplad i ett kastbart bygge körde den igenom och
skrev en korrekt graf mot Vite 8.1.5. Den fungerar alltså — den underhålls bara
inte.

Källan är 50 rader och all substans ligger i en rollup-hook:

```js
moduleParsed({ id, importedIds, dynamicallyImportedIds }) { … }
```

Det är inte ett verktyg att adoptera. Det är en dokumenterad Rollup-hook med ett
paketomslag runt sig, och omslaget är den enda delen som kan ruttna.

### A.7 Sammanfattning av kandidaterna

| Kandidat | Granularitet | Vad krävs för att införa | Vad vi låser in oss i |
|---|---|---|---|
| Nx `affected` | projekt | Nx workspace + styckning av `src/` i flera projekt | Nx projektgraf, task-runner, hela verktygskedjan |
| Turborepo `--filter` | paket | monorepo-struktur | Turbo som körlager |
| Playwright `--only-changed`, rått | test-filers egen graf | ingenting (finns) | inget — men den ger 0 träffar på källändringar |
| Playwright plugin-hake | fil | ~30 rader plugin + en grafkälla | **privat, otypad API-yta** i Playwright |
| `tsc --explainFiles` | fil | ingenting (körs redan) | prosa-parsning av utdata |
| madge 8.0.0 | fil | devDependency | egen `typescript@5.x` i trädet; typ-only kan släckas men ej märkas; ingen grind |
| dependency-cruiser 18.1.0 | fil | devDependency + configfil | egen `typescript@5.x`; regel-DSL |
| Rollup `moduleParsed` | fil | ~20 rader Vite-plugin | inget nytt — Rollup-hooken är redan vår |
| `vite-plugin-import-graph` | fil | devDependency | ett 0.0.1-paket från 2024 |

---

## B · Grafen: vem kan producera den korrekt för OSS?

### B.1 Fyra oberoende producenter, ett svar

Testfallet var `src/components/registrations/registration-display.ts` — den fil
frågan pekade ut som korsimporterad.

| Producent | Importörer funna | Kommentar |
|---|---|---|
| `tsc --explainFiles` (7.0.2) | 10 | både `@/`-alias och relativa specifierare |
| madge 8.0.0 | 10 | 180 noder, 554 kanter i `src/` |
| dependency-cruiser 18.1.0 | 10 | `dependents` är förstklassigt fält |
| Rollup `moduleParsed` (Vite 8.1.5) | 10 | typ-only-kanter redan raderade |

Fyra oberoende implementationer, identiskt svar. **Alias-upplösning och
korsimport är lösta problem** — det är inte där risken sitter.

### B.2 Barrel-filer: de bär, men mindre än fruktat

15 barrel-`index.ts` i `src/`. Den enda som verkligen amplifierar är
`domain/schemas/index.ts`: 15 återexporter, **18 importörer**. Via den blir varje
enskilt schema nåbart från 17 rutter, oavsett vem som faktiskt använder det.

Men den mätning som betyder något är en annan: **107 av 552 `src`→`src`-kanter
(19 %) är `import type`** — kanter som raderas vid transpilering och alltså inte
finns i den körda appen. Nästan varje import av schema-barrelen är av den formen.

Alla tre producenterna klarar det, men olika:

| Producent | Kan släcka typ-only-kanter | Kan **märka** dem |
|---|---|---|
| dependency-cruiser | ja | **ja** — `dependencyTypes` innehåller `type-only` med `--ts-pre-compilation-deps` |
| madge 8.0.0 | ja — `detectiveOptions.ts.skipTypeImports` | nej |
| Rollup `moduleParsed` | de finns aldrig i grafen | ej tillämpligt |

Madge-raden är mätt, inte läst: via Node-API:t gav samma träd **554 kanter**
utan flaggan och **448 med** — 106 kanter, alltså i praktiken samma mängd som
dependency-cruisers 107. Flaggan går däremot inte att nå från CLI:t i 8.0.0
(`--config` finns inte; `.madgerc` eller Node-API:t krävs).

Vad det kostar, mätt över hela simuleringen (nedan): **att räkna med typ-only-kanter
nästan fördubblar urvalet.**

### B.3 Dynamiska importer: en icke-fråga hos oss

`grep` över `src/**` (exklusive genererad kod): **noll** handskrivna dynamiska
importer. dependency-cruiser bekräftar: `dynamic: true` på **0 av 552** kanter.

`autoCodeSplitting: true` i `vite.config.ts` injicerar dynamiska importer, men vid
byggtid, mot virtuella moduler `routes/…tsx?tsr-split=component`. Källan på disk
förblir statisk — och Rollup-grafen slår ihop den virtuella modulens kanter med
rutt-filens nod (mätt: `hem.tsx` → `components/hem/index.ts`, korrekt). Den
klassiska fällan för statiska grafer finns alltså inte i det här repot i dag.

### B.4 TanStack Routers genererade rutt-träd: en hub som måste klippas

`src/routeTree.gen.ts` importerar **varje** rutt-fil statiskt (26 importer,
noll dynamiska). Den importeras i sin tur av `router.ts` → `main.tsx`. En
stängning som följer den noden når därför hela appen från vilken rutt som helst.
Kanten måste klippas explicit i varje grafvariant. Det är en rad kod, men det är ett
tyst antagande, och ett urval byggt utan det ger tyst full svit för alltid.

### B.5 Den mätning som falsifierar frågans premiss

Rutt-rotade stängningar över madge-grafen, `routeTree.gen` klippt:

| Kategori | Antal |
|---|---|
| Noder totalt i `src/` | 180 |
| Rutt-filer | 26 |
| Nås av **exakt en** rutt | **37** |
| Nås av **fler än en** rutt | **97** |
| Nås av noll rutter | 20 |

**Majoriteten av komponentytan är delad, inte exklusiv.** De mest delade filerna
nås av 20 av 26 rutter (`lib/cn.ts`, `primitives/Button.tsx`,
`primitives/MessageBox.tsx`). `components/events/detail/**` ligger på 4–8 rutter
och `registration-display` på 7 — de är alltså mitt i fördelningen, inte i svansen.

### B.6 Blindfläcken: injektionen syns inte i en rutt-rotad graf

`src/data/dataSource.ts` instansierar `AirtableAdapter` och injiceras i
router-context av `src/router.ts`; komponenter läser den via `useDataSource()`
([ADR-055](../decisions/ADR-055-datakalla-atkomst-router-context-di.md)). Det gör
adaptern till en **förfader** till rutterna i grafen, aldrig en ättling.

Elva filer ligger i `main.tsx`-stängningen men utanför varje rutt-stängning:

```text
src/main.tsx            src/router.ts              src/data/dataSource.ts
src/data/adapters/AirtableAdapter.ts               src/observability/sentry.ts
src/lib/report-web-vitals.ts                       src/styles/base.css
src/styles/tailwind.css src/components/ErrorBoundary/{AppError,SectionError,index}
```

Varje acceptance-körning **laddar och kör** samtliga elva — de sitter i
`main.tsx`-kedjan och kan inte hoppas över. För datalagret är det dessutom full
exekvering, inte bara laddning: fixturvärlden mockar på *nätverkslagret* (MSW),
så den riktiga `AirtableAdapter`-koden går hela vägen fram till `fetch`.

Ett urval byggt på en rutt-rotad importgraf hade alltså gett **noll**
acceptance-täckning för en ändring i `AirtableAdapter.ts`. Det är inget verktyg
som kan laga; det måste kompenseras med en explicit "alltid full klass"-lista,
och den listan måste vaktas.

Precision på listan: `observability/sentry.ts` avbryter sig själv i dev-läge
(`if (!isProd && !isStaging) return;`), så acceptance-klassen täcker dess
vaktsats men inte dess konfiguration. Den hör ändå hemma på listan — men av
laddnings-skäl, inte täcknings-skäl.

### B.7 Vad bygg-grafen ger — och varför chunkarna inte duger

Jag körde `vite build` med en kastbar plugin som dumpar Rollups `generateBundle`.
`autoCodeSplitting` ger en dynamisk entry-chunk per rutt med exakt
`facadeModuleId` — men **entry-chunken bär 273 moduler**, inklusive samtliga 26
rutt-*definitioner*, hela datalagret, alla scheman, auth och stilar. Bara rutternas
*komponenter* splittas ut.

Chunk-nivån är alltså för grov: exakt 68 `src`-filer skulle hamna i "alltid allt".
**Modul-nivån** (`moduleParsed`) är däremot exakt rätt kornighet, och det är den
Rollup-hooken ger gratis under ett bygge CI redan kör.

### B.8 Urvalskvalitet, simulerad mot den faktiska sviten

Modell: spec → rutt (härledd ur `page.goto`-anropen, 19 unika URL:er, handmappade)
→ transitiv stängning. Utfall per ändrad `src`-fil:

| Grafvariant | Medelurval, spec-filer | Medelurval, tester | Filer som väljer 0 specar |
|---|---|---|---|
| dependency-cruiser, **med** typ-only | 7,2 av 18 (40 %) | 60,2 av 153 (39 %) | 28 |
| dependency-cruiser, **utan** typ-only | 4,1 av 18 (23 %) | 33,9 av 153 (22 %) | 40 |
| Rollup `moduleParsed` | 4,5 av 18 (25 %) | 37,5 av 153 (24 %) | 23 |

Två avläsningar. Den ena: att filtrera bort typ-only-kanter är den enskilt
största kvalitetsvinsten som står att få, och Rollup-grafen får den gratis. Den
andra: **noll-kolumnen är riskkolumnen, inte vinstkolumnen.** 23 filer som väljer
noll specar är 23 vägar till en grön PR utan täckning.

### B.9 Bron spec → rutt kan inget verktyg bygga

`tests/acceptance/*.acceptance.test.ts` importerar `../../src/domain/schemas` — men
bara som `import type`. Appen nås via `page.goto('/hem')`. Kanten mellan specen och
rutt-filen är alltså **en strängliteral i en webbläsarnavigering**, inte en import.
Ingen importgraf i världen kan se den.

Alternativen: (a) en handhållen karta, (b) parsning av `goto()`-anropen, (c) en
körtidsgraf ur V8-coverage. Alla tre är egenbygge. (b) är billigast och mest
självuppdaterande — de 19 URL:erna är alla literaler eller enkla mallsträngar och
gick att extrahera mekaniskt i detta pass.

---

## C · Invariant-grinden

Repots krav är tvåsidigt bevis. Jag byggde grinden och fällde den.

**Verktyg:** `dependency-cruiser@18.1.0`. Regel-DSL:t bär `reachable` som
förstklassigt villkor (`types/restrictions.d.mts` rad 163–177) — alltså "modul X
måste (inte) vara nåbar från Y". Invarianten "varje `src`-modul nås av minst en
rutt-fil" är direkt uttryckbar, med en deklarerad undantagslista för
app-infrastrukturen från B.6.

**Grönt läge** (dagens träd):

```text
✔ no dependency violations found (180 modules, 562 dependencies cruised)
EXIT=0
```

**Rött läge** (en ny `src/lib/urvalsprov-onadd.ts` som ingen importerar):

```text
  error ingen-onadd-modul: src/lib/urvalsprov-onadd.ts
x 1 dependency violations (1 errors, 0 warnings). 181 modules, 562 dependencies cruised.
EXIT=1
```

Grinden fäller alltså på exakt det fel som gör urvalet osant, och den namnger
filen. Kostnad: **1,3 s kall, 0,75 s med varm cache** (`--cache`), med
`node_modules` uteslutet.

Verktyget bär också `--affected [revision]` — "only include modules changed since
the revision + all modules that can reach them". Mätt mot en ändrad
`registration-display.ts`: 26 moduler i utfallet, varav **7 rutt-filer** — samma
sju min egen stängningsberäkning gav. Den omvända stängningen behöver alltså inte
skrivas alls.

**Vad grinden INTE kan vakta.** Kartan spec → rutt är inte en importrelation och
ligger utanför dependency-cruisers värld helt. Att varje `goto()`-URL i en spec
motsvarar en rutt som finns i `routeTree.gen.ts` måste kontrolleras av ett eget
litet skript. Det är den grind som skyddar mot den farligaste rötan — en ny vy
vars spec ingen karta känner till — och den finns inte färdig någonstans.

---

## D · Ärlig kostnadsjämförelse

### D.1 Vad "bygga själv" faktiskt betyder

Delarna, och vem som redan äger dem:

| Del | Färdigt? | Vem |
|---|---|---|
| Importgraf, fil-nivå, alias + barrels | **ja** | dependency-cruiser / Rollup `moduleParsed` |
| Omvänd stängning (vem når X) | **ja** | `depcruise --affected` |
| Typ-only-filtrering | **ja** | dependency-cruiser, eller gratis i Rollup-grafen |
| Invariant-grind på grafens fullständighet | **ja** | dependency-cruiser `reachable` |
| Klippning av `routeTree.gen`-hubben | nej | ~1 rad |
| Karta spec → rutt | **nej** | ~40 rader (parsa `goto`) |
| Grind på att kartan är komplett | **nej** | ~30 rader |
| Lista "alltid full klass" (B.6-blindfläcken) | **nej** | deklaration + grind |
| Koppling in i Playwright | delvis | privat plugin-hake, eller filargument på kommandoraden |

Egenbygget är alltså cirka **70–100 rader plus två deklarationer** — inte en
grafmotor. Det är en betydligt mindre sak än frågan förutsatte, och betydligt mer
än "adoptera ett verktyg".

### D.2 Hur alternativen beter sig när de har fel

Detta är den axel som avgör, inte underhållsbördan.

| Väg | Felläge | Ser det trasigt ut? |
|---|---|---|
| Playwright plugin-hake | ofullständig graf → 0 tester, **exit 0** | **Nej.** Grön PR, ingen signal |
| Filargument på kommandoraden | tom lista → Playwright felar "No tests found" | **Ja**, om `--pass-with-no-tests` INTE sätts |
| Nx / Turbo | allt eller inget | ja, tiden avslöjar det |
| Grafen blir stale | fel urval, tyst | **Nej** — därav grinden i § C |
| Privat Playwright-API försvinner | plugin-nyckeln ignoreras tyst → 0 tester, exit 0 | **Nej.** Otypad nyckel, ingen varning |

Rad två är mätt, inte antagen. Ett filargument som inte matchar någon fil ger i
1.61.1:

```text
Error: No tests found.
EXIT=1
```

Två rader sticker ut. Playwright-hakens felläge är tyst grönt **och** dess
API-yta är privat — två oberoende vägar till samma osynliga hål. Formen med
explicita filargument (som `scripts/acceptance-urval.sh` redan använder) felar
högt i stället, och den är dessutom verktygsoberoende.

Det gör den nuvarande formen starkare än den ser ut: att skriva en fil-lista till
`GITHUB_OUTPUT` och låta jobbet skicka den som argument har **noll**
privat-API-yta och ett högljutt felläge. Grafen behöver bara byta ut vad som
fyller listan.

### D.3 Krock med ADR-077?

Nej — men gränsen är värd att dra skarpt.

[ADR-077 § Beslut 1](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
avvisar ett eget klassnings-skript därför att det hade "tvingat fram en
omimplementation av glob-semantik som actionen redan äger, med divergens-risk mot
D0". Ingen kandidat i detta pass rör den glob-semantiken. Ett grafdrivet urval
konsumerar `changed-files`-stegets utdata precis som dagens skript gör, och
klassar inte om något.

**Men:** kartan spec → rutt är en NY handhållen yta, och ADR:ns egentliga oro —
en andra sanning som kan drifta från den första — gäller den fullt ut. Skillnaden
är att den ytan går att grinda mekaniskt (§ C, sista stycket), vilket
docs-globlistan inte gör. Det är därför den är försvarbar där ett andra
glob-lager inte var det. Den ärligaste formuleringen: **ADR-077 förbjuder inte
detta, men dess resonemang kräver att kartan har en grind från dag ett.**

### D.4 Vad vinsten faktiskt är värd

Uppmätt lokalt 2026-07-29, `npm run test:acceptance`, samma maskin och träd,
sekventiella körningar (darwin):

| Urval | Filer | Tester | Workers | Väggtid | Andel av full klass |
|---|---|---|---|---|---|
| `mer-segment-send` | 1 | 3 | 1 | **11 s** | 10 % |
| fyra minsta specarna | 4 | 17 | 4 | **25 s** | 22 % |
| full klass | 18 | 153 | 8 | **114 s** | 100 % |

Fyra-filersfallet är nästan exakt det simulerade medelurvalet (4,5 av 18 på
Rollup-grafen, § B.8), och det kostade **22 % av väggtiden**. Vinsten är alltså
verklig och stor — cirka fyra femtedelar.

Men läs tabellen noga, för två saker drar åt fel håll och båda är inbyggda:

- **Parallelliteten straffar små urval.** Playwright skalar workers med
  filantalet: 1 fil ⇒ 1 worker, 4 filer ⇒ 4, 18 filer ⇒ 8. Ett litet urval får
  alltså sämre parallellitet, och 22 %-siffran bär redan den kostnaden. Den är
  därmed realistisk, inte optimistisk.
- **Den fasta kostnaden är liten men inte noll.** En enda fil på en enda worker
  tar 11 s för 3 tester. Dev-serverstart och första kall-laddning ligger där, och
  de betalas oavsett hur litet urvalet är.

CI:s uppmätta tal för full klass är **422/433/422 s** över tre körningar
2026-07-28 (citerat i `scripts/acceptance-urval.sh`) — 3,7 gånger den lokala
tiden. Att andelen 22 % överlever den skalningen är **inte** mätt; CI kör annan
maskin, annat worker-tak och `retries: 2`.

Och räkningen gäller bara PR:er där urvalet faller ut. 23 av 160 källfiler
hamnar i noll-rutan (§ B.8) och måste bli "full klass" för att inte vara ett hål.

---

## Dom

**Adoptera för grafen och grinden. Bygg bron.**

- **Grafproduktion: adoptera.** Rollups `moduleParsed` är förstahandsvalet — den
  är appens verkliga graf, den saknar typ-only-brus, den hanterar
  `autoCodeSplitting` korrekt, och den kräver ingen ny beroendeyta eftersom
  hooken redan är vår. Kostnadsfrågan var det enda som talade emot den, och den
  faller: `npx vite build` transformerar 3841 moduler på **3 s** (Vite 8.1.5,
  mätt lokalt). Men den måste köras i `changed`-jobbet, alltså på ett nytt
  ställe — bygget i dag bor i systerjobbet `test-fast`.
  `dependency-cruiser` är andrahandsvalet: **1,3 s kall / 0,75 s varm**, inget
  bygge alls, och det bättre valet om typ-only-*distinktionen* i sig ska kunna
  inspekteras.
- **Invariant-grind: adoptera.** `dependency-cruiser --config` med `reachable`
  är prövad tvåsidigt här, kostar under en sekund och namnger den felande filen.
- **Bron spec → rutt: bygg.** Cirka 70 rader. Den finns inte, och frånvaron är
  inte ett hål i marknaden — den är en följd av att relationen är en URL, inte en
  import.
- **Playwrights plugin-hake: känn till den, luta dig inte mot den.** Den fungerar
  bevisligen, men dess felläge är tyst grönt och dess API är privat. Formen med
  explicita filargument som repot redan kör är strikt säkrare.
- **Nx och Turborepo: avfärdade** på granularitet, inte på kvalitet.

Och det som väger tyngst av allt: **oavsett verktyg måste app-infrastrukturen
(B.6) deklareras som "alltid full klass"**, annars är mekaniken falsk-grön för
varje ändring i datalagret. Det är inte en implementationsdetalj — det är
förutsättningen för att urvalet ska vara sant.

---

## Vad jag inte kunde belägga

- **Tidsvinstens överlevnad i CI.** De tre tiderna i § D.4 är mätta lokalt på
  darwin, en körning per rad, `retries: 0`, med worker-taket satt av filantalet.
  CI kör annan maskin, `retries: 2` och ett annat worker-tak. Att andelen 22 %
  håller där är **obelagt** — jag har inte kört om CI:s 422/433/422 s, de är
  citerade ur `scripts/acceptance-urval.sh`. En körning per mätpunkt säger
  dessutom ingenting om spridningen.
- **Nx Cloud Atomizer.** Kunde inte belägga om den ger fil-nivå-affected för
  e2e-specar; den delegerade hämtningen av Nx parallelliseringsdokumentation
  innehöll ingenting om e2e-splittring. Jag hittade ingen dokumentation som säger
  att den gör det — det är inte samma sak som att den inte gör det.
- **Playwright-hakens hållbarhet.** Att `userConfig['@playwright/test'].plugins`
  fungerar i 1.61.1 är mätt. Att den fortsätter fungera är obelagt: den är otypad,
  odokumenterad och heter `privateConfiguration` i källan. Jag hittade ingen
  deprecation-policy för den ytan.
- **`--only-changed`-dokumentationens caveat** är hämtad via delegerad webbläsning
  av `playwright.dev/docs/ci`; sidans `test-cli`-motsvarighet nämnde ingen caveat
  alls i samma hämtning. Motsägelsen är oförklarad och citatet därför svagare än
  källkodsläsningen bredvid det.
- **Turborepo-granularitetens källa** är delegerad hämtning, inte källkodsläsning.
- **`vite-plugin-import-graph` på Vite 8** kördes en gång, på ett bygge, i ett
  läge. Att den skrev en korrekt graf är mätt; att den är stabil över våra
  byggvarianter (staging-mode, PWA-injectManifest) är det inte.
- **Simuleringens spec→rutt-karta är min egen**, skriven för detta pass ur
  `goto()`-anropen. Den är inte granskad av någon annan, och varje siffra i § B.8
  vilar på att den är rätt.
- **Coverage-baserad urvalsmekanism** (V8-coverage ur Playwright, det spår
  Microsoft och Google använder för test impact analysis) prövades inte alls.
  Den är den enda vägen som hade sett B.6-blindfläcken utan deklaration, och den
  förblir outredd här.

---

## Rekommendation

*Detta är en rekommendation, inte ett beslut.*

1. **Vinsten räcker — bekräfta den bara i CI innan något byggs.** Lokalt kostar
   ett medelurval 22 % av väggtiden (§ D.4), och det är gott om marginal.
   Nästa mätning är billig och avgör spåret: kör en gång i CI med fyra
   spec-filer mot full klass, på riktig CI-maskin med `retries: 2`. Håller
   andelen ungefär, bygg. Kollapsar den mot 100 %, bygg inget.
2. **Börja med grinden, inte med urvalet.** Lägg
   `dependency-cruiser` med `reachable`-regeln och den deklarerade
   infrastrukturlistan i CI *först*, som ren observation. Då finns vakten innan
   det finns något att vakta, och listan i B.6 hinner bli granskad medan den
   fortfarande är gratis att ändra.
3. **Håll urvalets utfall i samma form som i dag** — en explicit fil-lista till
   `GITHUB_OUTPUT`, konsumerad som argument. Byt bara ut vad som fyller listan.
   Det bevarar det högljudda fellägget och undviker Playwrights privata API helt.
4. **Låt `scripts/acceptance-urval.sh` behålla sin allowlist-form.** Den
   grafdrivna vägen läggs som en andra, oberoende väg som kan ge urval där dagens
   ger tomt — aldrig som en breddning av den befintliga.
5. **Skriv B.6-listan i en ADR, inte i ett skript.** Att `AirtableAdapter` och
   `router.ts` alltid tvingar full klass är ett arkitekturfaktum som följer ur
   ADR-055, inte en urvalsdetalj. Bor det bara i ett skript försvinner skälet
   nästa gång någon "städar" listan.
6. **Om Playwrights plugin-hake ändå väljs:** grinda den. Ett kontrastbevis i CI
   som fäller om `populateDependencies` inte anropades är det enda som skiljer
   "haken finns" från "haken fanns".

---

## Källförteckning

Primärkällor, källkod i den pinnade versionen (läst i repots `node_modules`
2026-07-29):

- `node_modules/playwright/lib/common/index.js` — `affectedTestFiles`,
  `collectAffectedTestFiles`, `setExternalDependencies`, `fileDependencies`;
  rad 555–556 (`privateConfiguration` → `plugins`). Playwright 1.61.1.
- `node_modules/playwright/lib/runner/index.js` — rad 5754–5786
  (`detectChangedTestFiles`), 5888–5901 (`createPluginSetupTasks`), 6018–6024
  (`populateDependencies`-anropet), 6503–6506 (list-lägets task-kedja).
- `node_modules/dependency-cruiser/types/restrictions.d.mts` — `reachable`,
  rad 163–177. dependency-cruiser 18.1.0.
- `node_modules/vite-plugin-import-graph/dist/index.mjs` — `moduleParsed`-hooken,
  50 rader. v0.0.1.
- `npx tsc --all` — flagg-inventariet i TypeScript 7.0.2.

Förstapartsdokumentation:

- [nx.dev · Project Size](https://nx.dev/docs/concepts/decisions/project-size) —
  affected-granularitet på projektnivå.
- [turborepo.dev · Running tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks) —
  paketnivå-filtrering (delegerad hämtning).
- [Playwright · Continuous Integration](https://playwright.dev/docs/ci) —
  `--only-changed` som heuristik (delegerad hämtning).
- [Playwright · Command line](https://playwright.dev/docs/test-cli) —
  `--only-changed`-flaggans beskrivning (delegerad hämtning).
- [Justineos import-graph-plugin](https://github.com/Justineo/vite-plugin-import-graph)
  — pluginets README. Versionsdata hämtad ur registret med `npm view`.

Repo-interna källor:

- [`scripts/acceptance-urval.sh`](../../scripts/acceptance-urval.sh) — dagens
  spec-lokala urval, dess `--only-changed`-mätning och dess motivering.
- [ADR-077](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
  § Beslut 1 — deklarativ klassning, avvisat klassnings-skript, öppen
  testgrafs-slot.
- [ADR-080](../decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md) —
  acceptance-klassens hermetiska form.
- [ADR-055](../decisions/ADR-055-datakalla-atkomst-router-context-di.md) —
  datakälle-injektionen som skapar blindfläcken i § B.6.
