---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J1f — Test-, bygg-, lint- och typkontrollskonfigurationen som inventering

> **Proveniens:** Skrivet av en fristående agent (Sonnet 5, se Rapport-sektionen
> i uppdraget för exakt modell-ID) inom Session 126:s CI-djupgranskning,
> 2026-09-17, i worktreen
> `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s126-ci-djupgranskning`
> på gren `docs/s126-ci-djupgranskning` (HEAD `18c8f22e` vid start). Repots
> ögonblicksbild är `origin/main` på `eeca8c72` (2026-09-08); allt jag mätte
> direkt (npm-kommandon, filinnehåll) mätte jag i denna worktree 2026-09-17,
> vilket är EFTER den ögonblicksbilden — jag har inte verifierat om worktreen
> ligger exakt på `eeca8c72` eller har senare commits ovanpå. Se § Osäkerheter.

**Begrepp för den oteknisk läsaren:** en "grind" är en automatisk kontroll som
måste bli grön (godkänd) innan kod får slås samman (mergas) till huvudgrenen
(`main`). En "config-fil" är en textfil som talar om för ett verktyg VAD det
ska kontrollera och HUR strängt. Jag har läst 20-talet sådana filer och
förklarar var och en.

## Kort svar

Repots test-, bygg-, lint- och typkontrollskonfiguration är **ovanligt
noggrant motiverad** — nästan varje tröskel, undantag och gränsdragning i de
filer jag läst bär en kommentar som pekar på en specifik ADR (ett skriftligt
arkitekturbeslut), ett mätt incident eller ett kort-ID, i stället för att bara
stå där. Det är inte teater: jag har själv kört flera av mätningarna om och
fått samma resultat (se § Fynd).

Men konfigurationen bär också **två levande, obelagda hål just nu**:

1. **Två öppna säkerhetsvarningar (high, 0 critical)** i `npm audit` — en i
   `sharp` (bildbehandling) och en i `smol-toml` (används av
   markdown-lint-verktyget) — som INTE är åtgärdade i det träd jag mätte
   2026-09-17.
2. **Serverkoden som kör på Supabase (kallad "Edge Functions", skriven i
   språket Deno i stället för Node.js) har praktiskt taget ingen
   typkontroll eller lintning alls.** Av 73 delade filer typkontrolleras
   bara 24 (via en Node-baserad genväg, inte Denos eget verktyg), och
   Denos EGNA verktyg (`deno check`/`deno lint`) är inte kopplat in
   NÅGONSTANS — varken i CI eller i deploy-skriptet — trots att ett eget
   beslutsdokument (ADR-010) sedan 2026-05 lovar att det ska hända "i Fas
   7" och en uppföljning 2026-07-31 bekräftar att löftet fortfarande är
   obetalt.

Domen på min delfråga: konfigurationen är **inte** en självrättfärdigande
maskin som byggt komplexitet för sin egen skull — den är i stort **verifierat
motiverad**. Men den har luckor som är lika verkliga som noggrannheten, och de
två ovan är de viktigaste att åtgärda.

## Vad jag läste först

Jag inventerade `docs/research/` (grep på ämnesord) och läste hela dessa
filer/ADR:er innan jag började skriva eget:

- **ADR-028** (supply chain-incidentrespons för npm-sårbarheter) — läst i sin
  helhet inklusive alla `## Updates`-poster till och med 2026-09-04. Direkt
  relevant för `audit-ci.jsonc`.
- **ADR-030** (docs-grindvakter + frontmatter-policy) — läst i sin helhet.
  Detta är grundbeslutet bakom markdownlint, Vale och yamllint, men det är
  skrivet 2026-05-14 och bär flera tal (fetch-depth, filantal, regelantal) som
  senare korrigerats i egna `## Korrigering`-block i toppen av samma fil. Jag
  har verifierat dagens faktiska config mot filerna på disk snarare än mot
  ADR:ns 2026-05-14-ögonblicksbild, och skriver ut var de skiljer sig.
- **ADR-080** (Acceptance-klassens hermetiska utbrytning) och **ADR-094**
  (Webbläsarbeteende-klassen) — läst i sin helhet. Båda är styrande för
  `playwright.config.ts`s projektstruktur och förklarar VARFÖR gränserna
  mellan testklasserna dras där de dras.
- **ADR-082** (Länkgrindens form) — läst i sin helhet. Förklarar varför
  `.lycheeignore` bytte roll 2026-07-28 från "grind-tystare" till
  "brusfilter för nattrapporten", och varför add-only-policyn upphävdes.
- **ADR-027** (Kvalitetsdefinitioner stack-skifte) och **ADR-107**
  (Reproducerbarhets-målet) — lästa, men **lågt relevanta** för min
  delfråga: ADR-027 handlar om en styrdokument-migrering (Vue→React-prosa),
  inte om CI-konfiguration. ADR-107 handlar om Marcus MASKIN
  (utvecklingsmiljö, Nix kontra enklare lösning), inte om repots CI. Jag
  nämner dem för fullständighetens skull men bygger inget på dem.
- **ADR-033** (shellcheck-strict) — skummad, inte central för min
  delfråga (shell-skript ägs av `J1c`).
- Lärdomen `tasks/lessons.d/tsc-b-kan-vara-tyst-nar-en-ren-modul-far-ett-test-kor-tsc-p-tsconfig-tests.md`
  — läst i sin helhet, se § TypeScript.

**Vad som var nytt i mitt pass:** ingen tidigare fil i `docs/research/`
inventerar `playwright.config.ts`, `package.json`s scripts, tsconfig-familjen,
`.vale.ini`, `.markdownlint-cli2.jsonc`, `.lycheeignore` eller `audit-ci.jsonc`
som en samlad konfigurationskarta. De befintliga forskningspassen
(`verify-ci-parity-regel-vantetid-2026-08-05.md`,
`t118-npm-advisory-remediering-praxis-2026-08-04.md`,
`task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md` m.fl.) besvarar var
sin SMALARE fråga och är citerade där de är relevanta, men ingen av dem gör
den bredsöksinventering uppdraget efterfrågar. **Åldern på ADR-030 (fyra
månader)** är den viktigaste att komma ihåg: jag har därför läst
`.markdownlint-cli2.jsonc`, `.vale.ini` och `.yamllint.yml` direkt från disk i
stället för att lita på ADR:ns 2026-05-14-siffror, och skriver ut varje
avvikelse jag hittade.

## Metod

Jag läste varje konfigurationsfil i sin helhet (inte utdrag), körde ett urval
kommandon direkt mot arbetsträdet för att mäta i stället för att anta, och
läste källkoden för stödfilerna (`tests/global-setup.ts`,
`tests/global-teardown.ts`, `tests/support/*.ts`) som konfigurationsfilerna
refererar till. Jag har INTE läst `.github/workflows/*.yml` på djupet (det
äger `J1a`/`J1b`) och inte räknat eller kategoriserat enskilda tester (det
äger `J7`) — där jag ändå behövde en gränsyta mot de områdena (t.ex. "körs
detta i CI?") har jag gjort en enda riktad grep och skriver ut exakt vad jag
sökte efter och vad jag hittade, markerat som just det och inget mer.

Alla kommandon kördes i förgrunden med explicit exitkod-läsning (aldrig genom
en pipe till `tail`/`head` för beslutsrelevanta grindar).

## Fynd

### 1. Playwright — testarkitekturens konfiguration

**Fil:** `playwright.config.ts`, 789 rader (jag läste hela filen, i tre
segment: rad 1–200, 200–400/400–600, 600–789 — inga luckor). Filen är extremt
kommentartät: uppskattningsvis 60–70 % av raderna är kommentarer som förklarar
VARFÖR ett tal eller villkor ser ut som det gör, med hänvisning till
kort-ID:n (`task-XX`, `TASK-XXX`) och ADR:er.

**Elva ovillkorade projekt** (`playwright.config.ts:479–734`), bekräftat genom
att räkna `name:`-nycklarna i `projects`-arrayen:

| Projekt | `testDir` | Beroenden | Vad det bevisar |
|---|---|---|---|
| `setup` | `tests/e2e` (`*.setup.ts`) | — | Loggar in, sparar session till `playwright/.auth/user.json` |
| `api-pure` | `tests/api` (allt utom `*.staging.test.ts`/`*.setup.ts`) | — | Ren logik, ingen staging-koppling |
| `api-setup` | `tests/api` (`*.setup.ts`) | — | Loggar in user+admin EN gång (T24-b) |
| `api-staging` | `tests/api` (`*.staging.test.ts`) | `api-setup` | Att STAGING/Airtable svarar rätt |
| `kontraktsvakt` | `tests/kontraktsvakt` | `api-setup` | Nattlig jämförelse fixtur mot skarp staging (ADR-080 beslut 3) — körs ENDAST av `nightly.yml`, aldrig i presubmit |
| `chromium-authenticated` | `tests/e2e` (`*.staging.test.ts`) | `setup` | E2E mot skarp staging |
| `acceptance` | `tests/acceptance` | — | Att APPEN renderar rätt GIVET ett svar av rätt form (ADR-080), hermetiskt/mockat, mutex-fritt |
| `webblasarbeteende` | `tests/webblasarbeteende` | — | Webbläsar-API-beteende UTAN nätverk (ADR-094) |
| `a11y` | `tests/a11y` | — | axe-core-scan mot `/dev/primitives` + `/dev/patterns` |
| `visual-desktop` | `tests/visual` | — | Skärmdumpsjämförelse, 1440×900, DPR 2 |
| `visual-mobile` | `tests/visual` | — | Skärmdumpsjämförelse, 375×812, DPR 2 |

Plus **tre villkorade projekt** som bara existerar när en miljövariabel är
satt (så att en vanlig `npx playwright test` eller CI:s normala körning aldrig
råkar starta dem):

- `preview-setup` + `staging-preview` (`PLAYWRIGHT_STAGING_PREVIEW=1`,
  rad 739–765) — verifierar ett BYGGT staging-bygge servat på port 4173.
- `manifest-screenshots` (`PLAYWRIGHT_MANIFEST_SCREENSHOTS=1`, rad 775–787)
  — genererar PWA-manifestets skärmdumpar, skriver PNG-filer som sidoeffekt.

**Global setup/teardown** (rad 202–205, filer lästa i sin helhet):

- `tests/global-setup.ts` (25 rader): nollställer en JSONL-mätfil
  (`HERMETIK_RAPPORT_FIL`) FÖRE körningen, men bara om
  `PLAYWRIGHT_HERMETIK_RAPPORT=1` — annars är den en no-op. Skälet
  (dokumenterat i filen): rapporten skrivs med `appendFileSync` från flera
  parallella testarbetare och rensar sig annars aldrig själv.
- `tests/global-teardown.ts` (150 rader): gör TVÅ saker EFTER hela körningen.
  (1) Går igenom `test-results/` och redigerar bort lösenord i klartext ur
  Playwrights egna felsöknings-filer (`error-context.md`) — ett Playwright-
  beteende (sidsnapshot listar textfält-VÄRDEN, även för lösenordsfält)
  som annars läcker credentials i en debug-artefakt (ADR-061 Pelare 3).
  (2) Skriver en sammanställning av "hermetik-läckor" (nätverksanrop som
  smet förbi testernas egna mockar) till terminalen — men ENDAST om
  samma flagga som ovan är satt, och filen finns kommenterad
  förklaring till varför den kollade flaggan i stället för filens
  EXISTENS (en kvarlämnad fil från en TIDIGARE mätning presenterades en
  gång som "just denna körnings" resultat — tråd `T105`).

**Reporter** (rad 215–218): `[PLAYWRIGHT_DEFAULT_REPORTER,
'./tests/support/fixturvarld/overskuggnings-rapport.ts']`.
`PLAYWRIGHT_DEFAULT_REPORTER` är `'dot'` i CI och `'list'` lokalt
(`tests/support/fixturvarld/overskuggnings-rapport.ts:84`, verifierad direkt
i källkoden). Den ANDRA reportern är egenbyggd och gör något ovanligt: den
upptäcker "döda" mock-deklarationer — ställen i testkoden som registrerar en
mockad nätverkssvar-handler som ALDRIG används av något test i samma fil —
och kan fälla hela körningen. Enligt filens egen dokumentation (rad 25–76,
läst i sin helhet) provades tre andra tekniska lösningar (worker-scopad
fixture, delad `afterAll`, JSONL via global teardown) och förkastades av
namngivna, specifika skäl innan reporter-formen valdes; jag har inte
oberoende verifierat de tre förkastade alternativens tekniska premisser, bara
läst att de anges.

**Retries** (rad 240): `process.env.CI ? 2 : 0`. Kommentaren (rad 226–239)
är ovanligt ärlig: den ursprungliga motiveringen ("absorbera brus utan att
maskera fel") kallas själv **falsifierad** av en senare mätning (`TASK-74`:
retries maskerade en riktig testkodsrace, 6 av 14 acceptance-jobb hade dold
flakighet FÖRE en fix, 1 av 14 EFTER) — och 2 behålls ändå som ett **medvetet
val med känd kostnad**, inte för att den ursprungliga motiveringen höll.

**Timeouts, mätt inte gissat** (rad 572–625): `acceptance`-projektets
`expect.timeout: 15_000` och `timeout: 60_000` härleds explicit ur en
mätserie (10 körningar, 1530 testresultat, `--workers=8 --retries=0`) och
citerar exakta observerade tal (14,6 s värsta gröna, 21,2 s tyngsta axe-test).
Jag har inte kört om den mätserien själv (den är historisk), men den siteras
med tillräcklig detalj för att vara verifierbar av nästa person.

**`toHaveScreenshot`** (rad 241–278): `maxDiffPixelRatio: 0.01`,
`maxDiffPixels: 2000`, `threshold: 0.2`, `animations: 'disabled'`,
`scale: 'device'`. Talet 2000 är enligt kommentaren mätt mot ett observerat
brusgolv (0 px över tre körningar) och en minsta uppmätt äkta regression
(11 357 px) — men filen **säger själv** att brusgolvet bara är mätt på macOS
("darwin"); Linux/CI-brus är explicit flaggat som OMÄTT i samma kommentar
(rad 260–262). Jag bedömer detta som **starkt indikerad**, inte verifierad,
eftersom jag inte har körkört CI:s Linux-runner.

**Snapshot-mallar** (rad 224–225, 293–295):
`{testDir}/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}`
för bildjämförelser och
`{testDir}/__aria__/{testFileName}/{arg}-{projectName}{ext}` för
ARIA-strukturjämförelser (en textbaserad snapshot av tillgänglighetsträdet,
inte en bild). Endast `-linux`-baselines checkas in enligt kommentaren; jag
har inte verifierat detta mot `.gitignore` själv.

**Portschema, en dold mekanism jag följde till källan**
(`tests/support/dev-portar.ts`, 199 rader lästa i sin helhet): de fyra
fixturbundna testklasserna (`a11y` 5199, `visual` 5299, `acceptance` 5399,
`webblasarbeteende` 5499) får INTE en fast port — porten härleds av
`devPort(klass)` som `basport + worktree-index × 1000`, där worktree-index
läses ur `git worktree list --porcelain` (huvudkatalogen får alltid index 0
eftersom git listar den först). Detta är byggt (TASK-251) för att lösa en
mätt kollision: två samtidiga bygg-agenter i olika worktrees på samma maskin
kunde annars starta sin dev-server på samma port och en av dem dog. `e2e`
(5173) och `staging-preview` (4173) är **medvetet INTE** deriverade — de är
portlåsta av en CORS-allowlist på staging-sidan, och en avvikande port hade
blockerat appens egna nätverksanrop. Jag har inte verifierat CORS-allowlistens
faktiska innehåll (kräver åtkomst till Supabase-projektets miljövariabler,
utanför min räckvidd).

**Shardning:** jag hittade INGEN `shard`-nyckel i `playwright.config.ts`.
Ordet nämns bara i en kommentar (`overskuggnings-rapport.ts:71`) som förklarar
att CLI-flaggan `--shard` (liksom `--grep`/`--grep-invert`) stänger av den
egenbyggda reportern helt, eftersom en delkörning ger den ett falskt intryck
av att en levande mock-plats är död. Om CI faktiskt kör med `--shard` är en
fråga för `J1a`/`J1b`.

### 2. `package.json`

**Skript** (`package.json:6–69`, 55 skript räknat direkt i filen). Jag listar
de som är centrala för min delfråga; hela listan finns i filen själv:

| Skript | Kommando (förkortat) | Vad det gör |
|---|---|---|
| `build` | `tsr generate && tsc -b && vite build` | Genererar routingträdet, typkontrollerar ÄKTA (inte bara `--noEmit`, se § TypeScript), bygger sedan. `&&` betyder att ett typfel STOPPAR bygget innan Vite ens körs. |
| `typecheck` | `tsr generate && tsc -b --noEmit` | Samma väg, men utan att skriva någon output-fil |
| `typecheck:tests` | `tsc --noEmit -p tsconfig.tests.json` | Se § TypeScript — täcker ett hål `tsc -b`s cache kan dölja lokalt |
| `lint` | `biome check .` | Kör Biomes formatterare + lintregler + import-sortering i samma kommando |
| `lint:prose` | `vale --glob=… docs tasks .claude README.md …` | Vale-körningen, lokalt anropbar |
| `check:docs` | `bash scripts/check-docs.sh` | Samlingsgrind för dokumentationskontrollerna (skriptets egen logik ägs av `J1c`) |
| `test:api` / `:pure` / `:staging` | `playwright test --project=api-pure --project=api-staging` m.fl. | Se § 1 |
| `test:acceptance` | `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 playwright test --project=acceptance` | Se § 1 |
| `test:acceptance:sjalvtest` | `node scripts/hermetik-sjalvtest.mjs` | Beviset (ADR-080 beslut 3) att acceptance-testerna FAKTISKT hänger på fixturvärlden |
| `test:webblasarbeteende`, `test:a11y`, `test:visual` | motsvarande | Se § 1 |
| `verify:ci-parity`(`:fast`) | `node scripts/verify-ci-parity.mjs` | Diagnosverktyg, egen policy — se CLAUDE.md § `verify:ci-parity`. Skript ägs av `J1c`. |
| `postinstall` | `git config core.hooksPath .githooks 2>/dev/null \|\| true` | Sätter Git-hookarna lokalt vid varje `npm install` — tyst no-op vid fel |
| `atlas` | genererar + formaterar + verifierar färgatlas | Utanför min delfråga |

**`devDependencies` som grindarna direkt behöver**, med pinnad version
(verifierat i `package.json:98–127` och mot faktiskt installerad version via
`npx tsc --version`/`npm ls`):

| Paket | Version i `package.json` | Faktiskt installerad | Bär |
|---|---|---|---|
| `@playwright/test` | `^1.62.1` | — | § 1 |
| `@biomejs/biome` | `^2.5.11` | schema `2.5.5` i `biome.json:2` | § 4 |
| `typescript` | `^7.0.2` | **`7.0.2`** (verifierat `npx tsc --version`) | § 3 — se anmärkning nedan |
| `markdownlint-cli2` | `^0.23.2` | — | § 5 |
| `audit-ci` | `^7.1.0` | — | § 6 |
| `micromatch` | `4.0.8` (exakt pin, ingen `^`) | — | Används av `scripts/verify-ci-parity.mjs`s diff-klassning (CLAUDE.md-citerad) |
| `js-yaml` | `5.4.1` (exakt pin) | — | Satt via `overrides` också (se nedan) — dubbelpinnad |
| `zod` | `^4.4.3` (dependency, inte dev) | — | Används av review-utlåtande-schemat och av flera Edge Function-moduler |
| `backlog.md` | `1.50.1` (exakt pin) | — | Backlog-CLI:t, utanför min delfråga |

**Anmärkning om TypeScript 7.0.2:** detta är **inte** en vanlig
minor-uppgradering av den klassiska TypeScript-kompilatorn. TypeScript 7.x är
en helt omskriven, nativt kompilerad ("Go-porterad") version av kompilatorn
som Microsoft aviserade 2025 — en radikalt annorlunda kodbas än TypeScript
5.x, som fortfarande är den version de allra flesta projekt i branschen kör.
Jag har verifierat att `npx tsc --version` faktiskt svarar `Version 7.0.2` i
detta träd (inte bara att `package.json` SÄGER det) — så detta är
**verifierat**, inte antaget. Att köra en så ny majorversion är ett
högriskval jag inte såg diskuterat eller motiverat i någon ADR jag läste; se
§ Risker.

**`overrides`** (`package.json:128–136`): sju paket tvingas till en exakt
version oavsett vad transitiva beroenden ber om:
`@tanstack/history`, `brace-expansion`, `fast-uri`, `js-yaml`, `linkify-it`,
`postcss`, `sharp`. Samtliga sju är historiska säkerhets-fixar
dokumenterade i ADR-028s `## Updates`-logg (jag har läst hela loggen och
verifierat att den täcker samtliga sju). **`sharp` är i skrivande stund
återigen sårbart** — se § 6.

**`engines.node`: `">=24"`** (`package.json:157–159`). Jag hittade INGEN
`.npmrc`-fil i repo-roten (`ls -la` gav ingen träff), så detta fält är
**endast rådgivande lokalt** — npm varnar men vägrar inte installera på fel
Node-version om inte `engine-strict=true` är satt i en `.npmrc` eller på
kommandoraden. Om CI:s `actions/setup-node`-steg läser `.nvmrc` (som är satt
till `"24"`, verifierat) för att TVINGA rätt version är en fråga för
`J1a`/`J1b` — jag kan bara säga att den lokala/npm-egna mekanismen inte
tvingar det.

**Externa verktyg utanför npm, och var deras version pinnas** — det här var
den mest överraskande skillnaden jag hittade i denna delfråga:

| Verktyg | Var det pinnas | Form |
|---|---|---|
| `gh` (GitHub CLI) | `.gh-version-policy.conf` (repo-rot) | **Minimiversion** (`GH_MIN_VERSION="2.94.0"`), läses av `scripts/lib/gh-guard.sh` |
| `jq` | `.jq-version-policy.conf` | **Minimiversion** (`JQ_MIN_VERSION="1.6"`), läses av `scripts/lib/jq-guard.sh` |
| Supabase-CLI | `.supabase-cli-policy.conf` | **Exakt version** (`SUPABASE_CLI_VERSION="2.115.0"`), körs alltid via `npx supabase@<version>` — MEDVETET inte lagd som npm-dependency (se filens egen motivering: `@supabase/cli-*` väger 114–159 MB per plattform, och CI-workflows anropar aldrig CLI:t — verifierat av filen själv via en grep den citerar, inte av mig oberoende) |
| Vale | **Inline i `.github/workflows/ci.yml:2422`** (`VALE_VERSION="3.14.1"`), laddas ner som binär | Exakt version, men INTE i en `.conf`-fil av samma slag som ovan |
| lychee, shellcheck, actionlint | Antas vara pinnade på samma sätt som Vale (inline i workflow) — jag har INTE verifierat detta själv, det är `J1a`/`J1b`s yta | Ej verifierat av mig |
| yamllint | Ej hittad i något `.conf`-mönster jag sökte efter | Ej verifierat av mig |

**Fyndet värt att notera:** `gh`/`jq`/Supabase-CLI följer alla den
`.conf`-fil-konvention CLAUDE.md själv slår fast som regel ("Custom
CI-grindvakts-logik i spokes är alltid config-driven"), men Vale gör det
INTE — dess version står skriven direkt i workflow-YAML:n. Detta är
**sannolikt inte en inkonsekvens** utan en skillnad i PROBLEM: `.conf`-filerna
löser "vilken version finns redan installerad på Marcus maskin/CI-runnern",
medan Vale laddas ner FRÄSCH som binär i varje CI-körning och aldrig behöver
matchas mot en lokalt förinstallerad version på samma sätt. Jag markerar
detta som **starkt indikerad**, inte verifierad, eftersom jag inte har läst
hela `ci.yml` för att utesluta andra skäl.

### 3. TypeScript-uppsättningen

**Project references** (`tsconfig.json`, 9 rader, läst i sin helhet): roten
har `"files": []` och pekar bara på fyra delprojekt via `references`:
`tsconfig.app.json` (appkoden, `src/`), `tsconfig.node.json`
(`vite.config.ts` + `playwright.config.ts`), `tsconfig.tests.json`
(`tests/**/*.ts`, ärver `tsconfig.node.json`) och `tsconfig.edge-shared.json`
(en UTVALD delmängd av Supabase Edge Function-koden, ärver
`tsconfig.node.json`).

**`npm run typecheck` (`tsr generate && tsc -b --noEmit`) täcker alla fyra
projekten** eftersom `tsc -b` bygger hela referensgrafen från roten. Men
`tsconfig.edge-shared.json` täcker BARA de filer som EXPLICIT står i dess
`include`-array — jag räknade **24 filer** (`grep -c '"supabase/functions'
tsconfig.edge-shared.json` gav 24, och jag räknade samma antal för hand ur
filens innehåll). Jag mätte den TOTALA Deno-kodbasen direkt:

```text
find supabase/functions -name "*.ts" | wc -l         → 135 filer totalt
find supabase/functions/_shared -name "*.ts" | wc -l →  73 filer i _shared
```

**Alltså: 24 av 73 `_shared`-filer (~33 %) typkontrolleras — och INGEN av de
totalt 135 filerna körs genom Denos EGET verktyg** (`deno check`). Filens
egen kommentar (läst i sin helhet, rad 1–100) förklarar VARFÖR listan är
enumererad snarare än ett brett `include` med `exclude`: ett brett mönster
drar in Deno-globalen transitivt via en enda importkedja (mätt: 7 stycken
`TS2304`-fel om man försöker). Detta är noggrant, medvetet arbete på den
SMALA frågan "vilka filer KAN typkontrolleras av Node utan att krascha på
`Deno`-globalen" — men det är en helt annan fråga än "typkontrolleras/lintas
Denos EGEN kod av Denos EGET verktyg", och svaret på den andra frågan är
**nej**, verifierat (se nästa stycke).

**ADR-010** (`docs/decisions/ADR-010-biome-exclude-deno-edge-functions.md`,
läst i sin helhet) lovar explicit under "Fas 7-åtagande" (rad 111–116):
"Lägg till `deno check supabase/functions/**/*.ts` i pre-commit-hooken" och
"Lägg till `deno lint supabase/functions/` i CI". En uppdatering daterad
2026-07-31 (samma fil, rad 127–163) bekräftar SJÄLV att detta löfte
fortfarande är obetalt: *"Denos halva av grinden (deno lint + deno check) är
fortfarande inte kopplad, så de 39 filerna grindas av ingenting"* (39 var
antalet vid den tidpunkten; jag mätte 73 i `_shared` idag, plus de
funktionsspecifika `index.ts`-filerna ovanpå det — kodbasen har vuxit sedan
dess).

Jag verifierade **direkt, 2026-09-17**, att detta fortfarande stämmer:

```text
grep -rn "deno check\|deno lint\|deno fmt" .github/workflows/*.yml  → 0 träffar
grep -in "deno" scripts/fas4-prod-deploy.sh                          → 0 träffar
find . -iname "deno.json*" -o -iname "import_map*"                   → 0 träffar
```

**Detta är ett VERIFIERAT fynd, inte en hypotes:** ADR-010:s egen
"Fas 7-åtagande" är obetalt idag, 2026-09-17, ~1,5 månader efter att samma
ADR bekräftade skulden öppen. Ingen fil i repot, varken workflow eller
deploy-skript, kör Denos eget verktyg mot Edge Function-koden.

**`typecheck:tests`-genvägen** (`package.json:16`, lärdomsfilen
`tasks/lessons.d/tsc-b-kan-vara-tyst-nar-en-ren-modul-far-ett-test-kor-tsc-p-tsconfig-tests.md`
läst i sin helhet): `tsc -b`s inkrementella cache (en "byggcache" som sparar
vad som redan typkontrollerats för att slippa göra om jobbet) kan LOKALT
gömma ett fel som uppstår när en ren `.ts`-modul plötsligt importeras av ett
NYTT test — mätt konkret 2026-09-08 (`TASK-438`, PR #2468): en modul som
`import type`-ade från en `.tsx`-fil var grön i app-projektet men föll under
`tsconfig.tests.json` (som saknar `jsx`-inställningen) så fort ett test
importerade den, och detta syntes bara i CI:s RENA träd, inte i den lokala
inkrementella byggen. Regeln lärdomen ger: kör `tsconfig.tests.json` ENSAMT
en gång innan push när ett nytt test tillkommer. Detta är alltså en känd,
dokumenterad brist i verktygskedjans lokala pålitlighet — inte en
konfigurationsbugg, utan en egenskap hos hur `tsc -b`s cache fungerar.

### 4. Biome

**Fil:** `biome.json`, 77 rader, läst i sin helhet. Schema-version `2.5.5`
(devDependency är `^2.5.11` — en mindre glidning mellan schema-referens och
installerad version, sannolikt ofarlig men värd att notera).

- **`files.includes`** (rad 8–19): allt utom `node_modules`, `dist`,
  det auto-genererade `routeTree.gen.ts`, `supabase/functions`,
  `supabase/templates` och HTML-mallarna under `docs/mallar/bilagor/`.
  `supabase/functions`-uteslutningen är precis den ADR-010-gräns § 3
  beskriver.
- **`linter.rules.preset: "recommended"`** plus EN egen `nursery`-regel:
  `useSortedClasses` satt till `"error"` för `className`-attribut och
  funktionerna `cn`/`clsx`/`twMerge` (Tailwind CSS-klassordning).
- **`assist.actions.source.organizeImports: "on"`** — automatisk
  import-sortering är PÅSLAGEN som en del av `biome check`, inte bara
  `biome format`.
- **Ett enda `overrides`-block** (rad 64–75): SVG-filer under `public/`
  undantas från a11y-regeln `noSvgWithoutTitle`.
- **`biome check .` kontra `biome format --write .`:** `check` (kört av
  `npm run lint`) exekverar formatterare + linter + assist-regler
  TILLSAMMANS och är den kommandoform som CLAUDE.md listar som en av de
  fyra DoD-kommandona. `format --write` (kört av `npm run format`) ändrar
  bara formatering, inga lint-regler. De är alltså inte samma grind — `lint`
  är den strängare, kombinerade formen.

### 5. Dokumentgrindarnas konfiguration

**`.markdownlint-cli2.jsonc`** (90 rader, läst i sin helhet). Tre
regelundantag, samtliga motiverade inline: `MD013` (radlängd) avstängd —
svensk prosa har långa sammansatta ord; `MD060` (tabellkolumn-stil) avstängd
— repot använder kompakt `|kol|`-stil över hundratals tabeller; `MD024`
(dubblerad rubrik) satt till `siblings_only` — tillåter samma
underrubrik under olika `## [X.Y.Z]`-versioner i en changelog. `globs`
täcker `docs/**/*.md`, `tasks/*.md`, `tasks/sessions/*.md`,
`tasks/threads/*.md`, `tasks/lessons.d/*.md`, `tasks/lessons/*.md`,
`.claude/**/*.md` och rot-`.md`-filer. `ignores` innehåller en rad som är
värd att förstå: `.claude/worktrees/**` — utan den skulle grinden av
misstag läsa in ALLA markdown-filer i varje annan aktiv agent-worktree (en
komplett, oberoende kopia av hela repot på en annan gren) eftersom
`markdownlint-cli2` inte respekterar `.gitignore`. **Det betyder att den
worktree jag själv sitter i just nu (`s126-ci-djupgranskning`) skulle ha
kunnat dra in andra parallella agenters halvskrivna filer om den raden
saknades** — jag har verifierat att raden finns.

**`.vale.ini`** (52 rader, läst i sin helhet) + `.vale/styles/`:

- Tre egna stilfiler under `.vale/styles/Miranon/`: `VueToReact.yml`
  (10 substitutionsregler Vue→React-terminologi, läst i sin helhet — ADR-030
  påstod "11 unika substitutions" 2026-05-14, jag räknade **10** i dagens
  fil; en trivial fyra-månaders-drift, inte ett aktivt fel), `Brand.yml`
  (en regex som tvingar bruket av varumärkets fullständiga tvåordsform i
  stället för det fristående enskilda ordet), och `Undvik.yml` (varnar för
  ord som `uppenbarligen`/`enkelt`/`simply` — mild `suggestion`-nivå,
  blockerar inte).
- **Två vokabulärer** jag hittade under `.vale/styles/config/vocabularies/`:
  en döpt efter varumärket (25 rader) och **`AriaAttrs`** (49 rader) — den
  senare nämns INTE i ADR-030 (som bara känner till varumärkes-vokabulärens
  `accept.txt` från 2026-05-14). Den har alltså tillkommit senare utan att
  ADR:n uppdaterats; jag har inte spårat exakt när.
- `MinAlertLevel = suggestion` — Vale rapporterar allt, men bara `error`-
  nivå (substitutions ovan) blockerar CI; `suggestion` gör det inte.
- `Vale.Spelling = NO` på `*.md` — stavningskontroll är avstängd (ADR-030
  dokumenterar varför: engelsk-hunspell-default gav 49 664 falska positiva
  på svensk text).
- Flera scope-undantag för arkiv och råmaterial (`tasks/sessions/**`,
  `docs/archive/**`, `docs/reference/pocock/**`, ett vendoriserat rått
  transkript) — samtliga med en kommentarsrad som förklarar varför.

**`.yamllint.yml`** (21 rader, läst i sin helhet): `extends: default`,
`line-length: disable` (CI-YAML har långa SHA-pinnade Action-referenser),
`truthy.check-keys: false` (GitHub Actions kräver nyckeln `on:`, som YAML
annars tolkar som ett booleskt värde).

**`.lycheeignore`** (843 rader totalt, men bara **70 faktiska
mönster-rader** — resten, 773 rader, är kommentarer/tomrader). Jag räknade
detta mekaniskt (`grep -v '^\s*#' | grep -vc '^\s*$'` → 70). **Detta är
själva förklaringen till filens storlek (53 KB):** sedan ADR-082
(2026-07-28) krävs en motiverings-rad OCH ett datum per post (samma form som
`github/docs` och `nuxt` använder för sina icke-blockerande länkkörningar),
så varje av de 70 mönstren bär flera rader förklarande text. Filens EGEN
filhuvud (rad 1–33, läst i sin helhet) förklarar att den bytte roll
2026-07-28: den var en "grind-tystare" (varje rad tog bort en PR-blockerare)
och är nu ett "brusfilter för nattrapporten" — externa länkar blockerar
inte längre PR:er alls (`ci.yml`s docs-jobb kör med `--offline`, enligt
ADR-082, INTE verifierat av mig i workflow-filen själv). **Tillväxt värd att
notera:** ADR-082 mätte "22 mönster, varav 21 externa" vid sitt eget beslut
2026-07-28; idag, sju veckor senare, är det 70 — mer än en tredubbling. Det
är inte nödvändigtvis ett problem (filens HELA poäng efter ADR-082 är att
poster FÅR läggas till fritt, add-only-policyn är uttryckligen upphävd), men
det är en påtaglig, mätbar tillväxttakt värd att hålla ögonen på om den
fortsätter i samma takt.

### 6. `audit-ci.jsonc`

**Fil:** 24 rader, läst i sin helhet. `"high": true` (fäller vid
high+critical, rapporterar men fäller inte vid moderate/low).
`"allowlist": []` — TOM idag. Filens egna kommentarer är en levande logg
över tre historiska incidenter (GHSA-rmmr-r34h-pfm5, GHSA-gv7w-rqvm-qjhr,
och referens till ADR-028 för resten) och slutar med att allowlisten
rensades helt 2026-07-19.

**Jag körde grinden LIVE, 2026-09-17, i detta träd** (kommandot kört utan
pipe till `tail`/`head`, exitkod läst direkt ur en fil):

```text
npx audit-ci --config audit-ci.jsonc > /tmp/audit-ci-out.txt 2>&1
echo $? → 1  (FÄLLER)
```

Resultat, **verifierat, inte citerat från uppdraget**:

| Advisory | Paket | Severity | Väg in i trädet |
|---|---|---|---|
| `GHSA-rgj7-g3m4-5g8c` | `sharp` (`<0.35.4` sårbart) | high | `@vite-pwa/assets-generator` → `sharp-ico` → `sharp` — **pinnad till exakt `0.35.3` via `package.json`s `overrides`** |
| `GHSA-7w5x-hrqm-74c2` | `smol-toml` (`<=1.7.0` sårbart) | high | `markdownlint-cli2` → `smol-toml` (transitivt, INGEN override finns) |

`metadata.vulnerabilities`: `{ high: 5, critical: 0, ... }` (5 räknar
FÖREKOMSTER i beroendeträdet — samma två advisories dyker upp på flera noder
— inte 5 distinkta sårbarheter). **Detta bekräftar exakt uppdragets
källmärkta påstående** ("två high-advisories, 0 critical").

**Fyndet jag lägger till, som INTE stod i uppdraget:** `sharp` pinnades
till exakt `0.35.3` via en TIDIGARE säkerhetsincident (samma mekanism ADR-028
föreskriver: pinna exakt i stället för att låta semver glida). Den versionen
har nu, genom en NY advisory publicerad efter att pinningen sattes, blivit
den sårbara versionen igen. Detta är en strukturell egenskap hos ADR-028s
"pinna exakt"-strategi som är värd att känna till: en exakt pin skyddar mot
framtida DRIFT men skyddar INTE mot att den PINNADE versionen självt visar
sig ha en sårbarhet någon gång efter pinningen. Mekanismen kräver aktiv
uppföljning (`npm audit` vid sessionsstart, som CLAUDE.md redan föreskriver)
— den är inte självläkande.

`smol-toml` har ingen `override` alls; `npm audit fix --dry-run`s egen
föreslagna fix var att NEDGRADERA `markdownlint-cli2` till `0.21.0`
(`isSemVerMajor: true`) — vilket är märkligt eftersom repot kör `0.23.2`,
en NYARE version än fixen föreslår. Jag har inte utrett varför npms
verktyg föreslår en nedgradering; det är en öppen fråga, se § Osäkerheter.

### 7. `vite.config.ts` + `pwa-assets.config.ts` + `vercel.json`

**`vite.config.ts`** (212 rader, läst i sin helhet). Den viktigaste
KONTROLLEN jag hittade som inte står uttryckligen i uppdragets exempellista:

- **`assertModeCoherent(mode, env.VITE_SUPABASE_URL)`** (rad 22–23) —
  en funktion som FÄLLER `vite`/`vite build` redan vid config-tid (innan
  bygget ens börjar) om vilket Vite-"läge" (`--mode staging` vs.
  produktionsläge) som körs INTE stämmer överens med vilken Supabase-URL
  som faktiskt är bunden. Detta är en build-time-spärr mot att av misstag
  bygga en produktionsapp som pekar mot staging-databasen eller tvärtom
  (ADR-061 Pelare 2.5). Jag har inte läst `src/lib/env-coherence.ts` själv
  för att verifiera detaljerna i logiken — bara att funktionen anropas här
  och att kommentaren beskriver dess syfte.
- **Bygget FÄLLER PÅ TYPFEL:** `package.json`s `"build"`-skript är
  `tsr generate && tsc -b && vite build` — `tsc -b` (utan `--noEmit`) körs
  FÖRE `vite build` i en `&&`-kedja, så ett typfel stoppar hela bygget innan
  Vite ens startar. Detta är **verifierat direkt i skriptets text**, inte
  antaget.
- **Ingen bundle-storleksbudget hittad i `vite.config.ts` själv** — inget
  Rollup `output`-tak, ingen `build.chunkSizeWarningLimit`-övermanning,
  ingen bundle-visualiserare. Det EXISTERAR en bundle-relaterad kontroll,
  men den bor i ett separat skript
  (`scripts/check-staging-bundle.sh`, kört via `npm run
  verify:staging-bundle` — skript-innehåll ägs av `J1c`, jag har bara läst
  filhuvudet). Den kontrollerar dock INTE storlek — den verifierar att ett
  `--mode staging`-bygge faktiskt innehåller referenser till
  staging-miljön och INTE till produktionsmiljön (en miljö-korrekthetsgrind,
  inte en storleksgrind). Den körs bara som en del av
  `npm run test:preview:staging`-kedjan, inte vid varje `npm run build`.
- **Ingen CSP (Content-Security-Policy)-header-plugin i `vite.config.ts`.**
  Filen har en kommentar (rad 14) som säger uttryckligen: *"[GA] Fas 7:
  security headers-plugin med CSP-nonce läggs till här"* — alltså ett
  DOKUMENTERAT, INTE ÄNNU BYGGT åtagande, precis som ADR-010s Deno-löfte i
  § 3.
- **PWA-manifestet** genereras med versionsstämplade ikonfilnamn (ett
  innehålls-hash i filnamnet, `pwa-icon-version.ts`) specifikt för att
  kringgå att Chrome 144+ cachar ikoner permanent baserat på URL — mätt och
  motiverat inline, med en källhänvisning till Chrome-teamets egen blogg.
  Detta räknas som en byggkontroll i vid mening (fel filnamn ⇒ ikonen
  uppdateras aldrig för användare) men fäller ingen grind om det görs fel;
  det finns en separat mekanisk verifiering
  (`scripts/check-manifest-fields.mjs`, körd via `npm run verify:manifest`,
  497 rader — jag har bara sett att den finns och vad den PÅSTÅS göra,
  inte läst hela dess logik, då den hör till `J1c`s skriptdomän).

**`vercel.json`** (39 rader, läst i sin helhet): sätter sju
säkerhetsrelaterade HTTP-headrar globalt
(`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `Strict-Transport-Security` med `preload`,
`Permissions-Policy` som stänger av kamera/mikrofon/geolokalisering/
betalning/USB/annonsspårning, `Cross-Origin-Opener-Policy: same-origin`,
`X-DNS-Prefetch-Control: off`) plus separata cache-regler för `/assets/`
(ett år, immutable), `/sw.js` och `/manifest.webmanifest` (ingen cache,
`must-revalidate`). **Ingen `Content-Security-Policy`-header finns här
heller** — vilket bekräftar `vite.config.ts`s kommentar om att CSP är ett
FRAMTIDA (Fas 7) åtagande, inte ett nuvarande.

**`pwa-assets.config.ts`** (84 rader, läst i sin helhet): genererar
PWA-ikonerna ur en enda SVG-källa. Innehåller en usedan-mätt-inte-räknad
`padding`-konstant (0.55) för den maskerbara ikonens säkerhetszon, med en
inline-dokumenterad historik av att en analytisk beräkning (0.2273) gav FEL
värde med en faktor två, och att rätt värde hittades genom att generera och
mäta den faktiska pixel-bounding-boxen i utdatafilen. Detta är inte en
"grind" i CI-mening, men det är ett exempel på samma mät-inte-anta-disciplin
som präglar hela konfigurationslagret.

### 8. `tests/global-setup.ts` / `global-teardown.ts` / `fixtures/` / `support/`

Redan täckt i detalj under § 1 (globalSetup/globalTeardown). Ytterligare
katalogfynd:

- **`tests/fixtures/review-backstopp/`** — fixturdata för en helt annan
  mekanism (review-grindens backstopp, se `CLAUDE.md` § Review-grinden),
  utanför min delfråga.
- **`tests/support/`** (8 filer, 679 rader sammanlagt utanför
  `fixturvarld/`-underkatalogen): `dev-portar.ts` (se § 1),
  `staging-preflight.ts` (78 rader, läst i sin helhet — se nedan),
  `test-bas.ts` (109 rader, ej djupläst — hör delvis till `J7`s
  testnivå-analys), `hermetik-rapport-fil.ts` (19 rader, bara en
  filsökvägskonstant), `kastbara-poster.ts` (94 rader, ej djupläst),
  `mat-cls.ts` (330 rader, ej djupläst — Core Web Vitals-mätning, utanför
  min delfråga), `senasteInteraktionGrammatik.ts` (49 rader, ej djupläst).
- **`tests/support/fixturvarld/`** (8 filer): `handlers.ts`, `hermetic.ts`,
  `hermetik-vakt.ts`, `websocket-vakt.ts`, `overskuggnings-vakt.ts`,
  `overskuggnings-rapport.ts` (se § 1), `fixture-data.ts`,
  `ef-namnforslag.ts`. Dessa bär den hermetiska (mockade) testvärlden som
  `acceptance`/`visual`/`webblasarbeteende`/`manifest-screenshots` alla
  delar. Jag har läst `overskuggnings-rapport.ts` i sin helhet (se § 1) men
  INTE `hermetic.ts` eller `handlers.ts` i detalj — de är kärnan i HUR
  mockningen fungerar snarare än HUR den är konfigurerad, och gränsar mot
  `J7`s testanalys.

**`staging-preflight.ts`** (78 rader, läst i sin helhet) avslöjade en
**dold beroende-kedja** värd att lyfta separat: lokala körningar av
`api-staging`/`kontraktsvakt`/`chromium-authenticated` anropar
`scripts/staging-semaphore.sh` (ett skalskript, `J1c`s domän) via
`execFileSync('bash', …)` INNAN testerna får röra staging — detta för att
förhindra att en lokal körning och ett CI-jobb skriver till samma delade
Airtable-bas samtidigt (ett verkligt, tidigare INTRÄFFAT problem, citerat
med kort-ID `TASK-70.3` i filens egen kommentar: samma bygg-agent gjorde
det två gånger, andra gången med full kännedom om problemet). Mekanismen är
**medvetet en no-op i CI** (`process.env.GITHUB_ACTIONS === 'true'`
kortsluter direkt) eftersom CI redan har sin egen serialisering. Detta är
alltså en config-driven kontroll som bara existerar för att skydda LOKALA
körningar mot att kollidera med CI — en nyansering värd att ha med.

### 9. Miljöfilerna

Jag läste ENDAST `.example`-filerna (aldrig de riktiga `.env*`-filernas
värden, i linje med uppdragets regel om att inte skriva ut hemligheter).

| Fil | Variabler den deklarerar | Vilken testklass/kontroll den krävs av |
|---|---|---|
| `.env.example` (38 rader) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN`, `VITE_FEATURE_BETALNINGAR` | Klient-runtime, INTE test-specifik — mall för `.env.development`/`.env.staging`/`.env.production` |
| `.env.test.example` (31 rader) | `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`/`PASSWORD`, `TEST_ADMIN_EMAIL`/`PASSWORD`, `TEST_REGISTRATION_RECORD_ID` | `api-staging`, `kontraktsvakt`, `chromium-authenticated` (allt som pratar med skarp staging) |
| `.env.seed.example` (22 rader) | `STAGING_AIRTABLE_TOKEN`, `AIRTABLE_SCHEMA_TOKEN` | Seed-/purge-verktyg (`npm run seed:review` m.fl.) — INTE testerna själva, en medvetet SKILD behörighetsnivå (kommentaren citerar ADR-060 punkt 4: testmiljön får ALDRIG denna Airtable-token) |

`.env.example`s egen kommentar (rad 3–15) förklarar en arkitekturregel jag
inte såg nämnd i uppdraget: miljö-URL:en (Supabase-instansen) bor i
COMMITTADE läges-filer (`.env.development`/`.env.staging`/`.env.production`)
och INTE i `.env.local`, medan `.env.local` reserveras för
maskin-specifika overrides. Det är en medveten separation (ADR-061 Pelare
1), inte en slump.

### 10. Komponenttabell

| Komponent | Funktion i dag | Trigger | Beroenden | Merge-blockerande | Evidens | Rekommendation |
|---|---|---|---|---|---|---|
| `playwright.config.ts` | Definierar 11 (+3 villkorade) testprojekt, portschema, timeouts, reporters | `npx playwright test`, alla `npm run test:*`-skript | `@playwright/test`, `tests/support/**` | Enligt CLAUDE.md ja för flertalet klasser — ej verifierat av mig mot `ci.yml`, se `J1a`/`J1b` | Läst i sin helhet, `playwright.config.ts:1–789` | Ingen — filen är redan tätt motiverad rad för rad |
| `package.json` (scripts) | 55 npm-skript, gränssnitt mot alla grindar | `npm run <skript>` | Se § 2-tabellen | Delvis, se ovan | `package.json:1–160`, kört `npm ls`/`npx tsc --version` live | Lägg `engine-strict=true` i en `.npmrc` om Node-golvet ska vara mekaniskt, inte bara rådgivande |
| `tsconfig.json` + 4 delprojekt | Project references, TS-konfiguration | `tsc -b`, `npm run build`/`typecheck` | `typescript@7.0.2` | Ja (bygget fäller på typfel) | Läst i sin helhet | Se § Risker om TS 7 |
| `tsconfig.edge-shared.json` | Typkontrollerar 24 av 73 Deno-filer via Node-tsc | `tsc -b` | — | Ja, för de 24 filerna | Läst i sin helhet, mätt filantal live | Se § Risker/Rekommendationer — koppla in `deno check`/`deno lint` |
| `biome.json` | Format + lint + import-sortering | `biome check .` | `@biomejs/biome` | Ja | Läst i sin helhet | Ingen |
| `.markdownlint-cli2.jsonc` | Markdown-hygien | `npx markdownlint-cli2`, del av `check:docs` | `markdownlint-cli2` | Ja (för docs) | Läst i sin helhet | Ingen |
| `.vale.ini` + `.vale/styles/` | Prosa-/terminologikontroll | `vale`, `npm run lint:prose` | Vale-binär (pinnad i `ci.yml`, ej i `.conf`) | Ja för `error`-nivå, nej för `suggestion` | Läst i sin helhet | Uppdatera ADR-030s siffror (10→ dagens, `AriaAttrs`-vokabulären saknas i ADR:n) |
| `.yamllint.yml` | YAML-syntax för workflow-filer | `yamllint` | — | Ja | Läst i sin helhet | Ingen |
| `.lycheeignore` | Brusfilter för nattlig länkkontroll | `lychee` i `nightly.yml` (ej verifierat av mig) | — | **Nej** sedan ADR-082 (extern länkkontroll flyttad till natten) | Läst i sin helhet, räknat mönster mekaniskt | Håll koll på tillväxttakten (22→70 på 7 veckor) |
| `audit-ci.jsonc` | npm-sårbarhetsgrind | `npx audit-ci`, CI-jobbet `audit` (ej verifierat av mig) | `audit-ci@7.1.0` | Ja | Läst i sin helhet + KÖRT LIVE 2026-09-17 | **Åtgärda de två öppna high-advisories** (se § Risker) |
| `vite.config.ts` | Bygg-pipeline, PWA, mode-koherens-grind | `vite`/`vite build` | Vite-plugins | Ja (typfel + mode-inkoherens fäller bygget) | Läst i sin helhet | Bygg CSP-header-pluginet som redan är kommenterat som avsett |
| `pwa-assets.config.ts` | Genererar PWA-ikoner | `npx pwa-assets-generator` | `@vite-pwa/assets-generator` (drar in sårbar `sharp`) | Nej (fristående verktyg, inte en byggkedjegrind) | Läst i sin helhet | — |
| `vercel.json` | Deploy-config + säkerhetsheadrar | Vercel-plattformen vid deploy | — | N/A (plattformsnivå, inte CI) | Läst i sin helhet | Lägg till CSP när Fas 7-arbetet görs |
| `tests/global-setup.ts`/`global-teardown.ts` | Nollställer mätfil, purgar lösenord ur artefakter, hermetik-rapport | Varje Playwright-körning | `HERMETIK_RAPPORT_FIL` | Indirekt (körs alltid, fäller inte i sig) | Läst i sin helhet | Ingen |
| `.env.example`/`.env.test.example`/`.env.seed.example` | Deklarerar krävda miljövariabelNAMN | Manuell kopiering till riktiga `.env*`-filer | — | Indirekt (saknad variabel ⇒ tester skippas/kraschar) | Läst i sin helhet (endast `.example`) | Ingen |
| `.gh-version-policy.conf`/`.jq-version-policy.conf`/`.supabase-cli-policy.conf` | Minimi-/exaktversion för externa CLI-verktyg | `scripts/lib/*-guard.sh` (J1c) | — | Ja, för de landningsvägar som anropar dem | Läst i sin helhet | Överväg samma `.conf`-mönster för Vale om fler lokala/CI-paritetsproblem uppstår |

**Tysta beroenden — saker grindarna förutsätter men som ingen enskild
konfigurationsfil deklarerar:**

1. **`bash` måste finnas i PATH.** Flera Node-baserade testflöden
   (`staging-preflight.ts`) anropar `execFileSync('bash', [...])` direkt.
2. **`git` måste finnas och `tests/support/dev-portar.ts` måste köras inifrån
   en riktig git-checkout** — annars faller portschemat tillbaka till index 0
   (samma port som huvudkatalogen), vilket ÄR det avsedda felsäkra
   beteendet men ändå ett implicit antagande.
3. **Node 24 antas, men är inte MEKANISKT tvingat lokalt** (ingen
   `engine-strict` i en `.npmrc`) — se § 2.
4. **Vale-, lychee-, shellcheck- och actionlint-versionerna antas matcha
   mellan CI:s nedladdade binärer och vad lokala `npm run lint:prose`-körningar
   råkar ha installerat** — jag har inte verifierat att Marcus lokala
   Vale-installation matchar `ci.yml:2422`s `3.14.1`.
5. **`.env.test`/`.env.seed` måste existera lokalt och vara korrekt ifyllda**
   för att `api-staging`/`kontraktsvakt`/seed-skripten ska fungera —
   `.example`-filerna är den enda dokumentationen av vilka fält som krävs.
6. **`sharp`s native binär (kompilerad C++-kod, plattformsspecifik) måste
   installeras korrekt för den körande plattformen** — `overrides`-pinningen
   till `0.35.3` är plattformsoberoende i `package.json`, men det faktiska
   binära paketet som laddas ner (`@img/sharp-*`) är plattformsspecifikt;
   jag har inte verifierat att CI:s Linux-runner och Marcus macOS-maskin får
   samma logiska version av underliggande `libvips`.

## Osäkerheter och vad jag inte kunde belägga

- **Om `sharp`/`smol-toml`-advisoryerna redan är kända/under åtgärd av en
  annan pågående session.** Jag mätte dem live 2026-09-17 men vet inte om
  ett kort redan finns för dem. Kräver: sökning i Backlog.md-substratet
  (utanför min räckvidd i detta pass — orkestreraren bör tvärkolla mot
  `backlog/tasks/`).
- **Om `ci.yml`/`nightly.yml` faktiskt kopplar in `.lycheeignore` med
  `--offline` för presubmit, som ADR-082 påstår.** Jag har INTE läst
  workflow-filerna själv (`J1a`/`J1b`s domän) — mitt uttalande om detta är
  en återgivning av ADR-082s text, markerad som sådan, inte en egen mätning.
- **Exakt varför `npm audit fix --dry-run` föreslår en NEDGRADERING av
  `markdownlint-cli2` (0.23.2 → 0.21.0) för att lösa `smol-toml`-advisoryn.**
  Jag körde inte den fixen (den skulle ha ändrat trädet, vilket är utanför
  mitt mandat som skrivskyddad agent) och har inte utrett npms
  rekommendationslogik. **Ej verifierbar av mig; kräver: någon med skrivrätt
  som kör `npm ls markdownlint-cli2` mot varje version i intervallet
  0.21.0–0.23.2 för att se var `smol-toml`-beroendet faktiskt försvinner
  eller uppgraderas bortom sårbarheten.**
- **Om worktreen jag arbetar i exakt motsvarar `origin/main`s `eeca8c72`
  eller bär commits ovanpå den.** Jag verifierade `git rev-parse HEAD` i
  min egen gren (`docs/s126-ci-djupgranskning`, `18c8f22e`) men har inte
  jämfört den mot `eeca8c72` commit-för-commit. Sannolikt ofarligt (grenen
  är en dokumentations-gren för själva granskningen), men jag flaggar det
  som en teknisk osäkerhet i min proveniens-rad.
- **Om Marcus lokala installationer av Vale/lychee/shellcheck/actionlint
  matchar CI:s pinnade versioner.** Kräver: `vale --version` m.fl. körda på
  Marcus egen maskin och jämförda mot `ci.yml`s pinnade tal — jag har bara
  åtkomst till worktreen, inte Marcus lokala verktygsinstallationer.
- **Exakt när `AriaAttrs`-vokabulären och den elfte VueToReact-regelns
  försvinnande (11→10) skedde.** Jag har inte spårat git-historiken för
  `.vale/`-katalogen för att hitta commit/datum — det vore möjligt men jag
  prioriterade bredden i uppdraget över detta enskilda spår.

## Risker

1. **Två öppna, obelagda high-severity-sårbarheter i beroendeträdet just
   nu** (`sharp` GHSA-rgj7-g3m4-5g8c, `smol-toml` GHSA-7w5x-hrqm-74c2).
   `audit-ci` FÄLLER varje PR som rör `package.json`/`package-lock.json`
   tills detta är löst (enligt filens egen logik, ADR-028). Detta är
   sannolikt redan känt av någon session — men jag kunde inte verifiera
   det, se ovan.
2. **Edge Functions (Deno-koden) saknar praktiskt taget helt
   compile-time-verifiering.** 24 av 135 filer typkontrolleras (via en
   Node-genväg, inte Denos eget verktyg), och Denos egna verktyg
   (`deno check`/`deno lint`/`deno fmt`) är inte kopplat in NÅGONSTANS. Ett
   syntaxfel eller en typmiss i en av de otäckta 111 filerna märks först
   när funktionen deployas och kraschar i produktion (exakt den risk
   ADR-010 själv identifierade 2026-05 och som fortfarande inte är
   åtgärdad).
3. **TypeScript 7.0.2 är en radikalt ny, nativt kompilerad kompilator** som
   de flesta branschprojekt ännu inte kör. Jag har inte hittat någon ADR
   som diskuterar valet eller dess risker (kompatibilitetsskillnader mot
   TS 5.x-verktygskedjan, mognadsgrad). Detta är inte nödvändigtvis fel —
   men jag hittade ingen dokumenterad avvägning, vilket avviker från
   repots i övrigt konsekventa mönster att motivera varje icke-trivialt
   val.
4. **`.lycheeignore`s tillväxttakt** (22→70 mönster på sju veckor) är inte
   i sig farlig (filen fäller inga grindar sedan ADR-082), men om takten
   fortsätter blir filen svårare att granska för människor trots att varje
   post är individuellt motiverad.
5. **CSP saknas fortfarande**, dokumenterat som avsett Fas 7-arbete i två
   oberoende filer (`vite.config.ts` och underförstått av `vercel.json`s
   frånvaro av headern) — konsekvent internt, men en verklig
   säkerhetslucka tills den byggs.

## Rekommendationer

**(Markerade som rekommendationer — inte beslut. Beslutsrätten ligger hos
Marcus/orkestreraren.)**

1. Åtgärda de två öppna `audit-ci`-advisoryerna enligt ADR-028s etablerade
   flöde (pin-uppdatering, inte `npm audit fix --force`) innan nästa PR som
   rör beroendeträdet försöker landa.
2. Bestäm om ADR-010s "Fas 7-åtagande" (`deno check`/`deno lint`) ska
   schemaläggas nu eller formellt skjutas upp med ett nytt, uttryckligt
   datum/villkor — dagens läge (löfte givet 2026-05, bekräftat obetalt
   2026-07-31, fortfarande obetalt 2026-09-17) är en tyst skuld som växer
   utan att någon aktivt beslutat att den ska vänta.
3. Lägg till en kort rad i en ADR eller i `CONTRIBUTING.md` som motiverar
   valet av TypeScript 7.0.2 — antingen "medvetet, av skäl X" eller en plan
   för att gå tillbaka till TS 5.x om det visar sig instabilt. Detta är det
   enda icke-trivial verktygsvalet jag hittade i denna delfråga UTAN en
   synlig motivering, vilket sticker ut mot resten av repots mönster.
4. Uppdatera ADR-030s siffror (regelantal, filantal, vokabulärlista) eller
   lägg en tydlig "se filerna på disk för aktuellt läge"-notis i toppen,
   samma mönster som ADR-030 redan använder för sina `## Korrigering`-block
   om fetch-depth.

## Källor

**Filer i repot (läst direkt, citerade med rad där relevant):**

- `playwright.config.ts` (789 rader, hela filen)
- `package.json` (160 rader, hela filen)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`,
  `tsconfig.tests.json`, `tsconfig.edge-shared.json` (samtliga, hela filerna)
- `biome.json` (77 rader, hela filen)
- `.markdownlint-cli2.jsonc` (90 rader, hela filen)
- `.vale.ini` (52 rader, hela filen), `.vale/styles/Miranon/*.yml` (3 filer)
  och `.vale/styles/config/vocabularies/{Miranon,AriaAttrs}/accept.txt`
- `.yamllint.yml` (21 rader, hela filen)
- `.editorconfig` (16 rader, hela filen)
- `.lycheeignore` (843 rader, huvud + struktur läst, mönster räknade
  mekaniskt)
- `audit-ci.jsonc` (24 rader, hela filen) + live-körning 2026-09-17
- `vite.config.ts` (212 rader, hela filen)
- `pwa-assets.config.ts` (84 rader, hela filen)
- `vercel.json` (39 rader, hela filen)
- `tsr.config.json` (8 rader, hela filen)
- `tests/global-setup.ts` (25 rader, hela filen)
- `tests/global-teardown.ts` (150 rader, hela filen)
- `tests/support/dev-portar.ts` (199 rader, hela filen)
- `tests/support/staging-preflight.ts` (78 rader, hela filen)
- `tests/support/fixturvarld/overskuggnings-rapport.ts` (85 rader, hela filen)
- `.env.example`, `.env.test.example`, `.env.seed.example` (samtliga, hela
  filerna — inga andra `.env*`-filer öppnades)
- `.gh-version-policy.conf`, `.jq-version-policy.conf`,
  `.supabase-cli-policy.conf` (samtliga, hela filerna)
- `scripts/check-staging-bundle.sh` (filhuvud, rad 1–30)
- `docs/decisions/ADR-010-biome-exclude-deno-edge-functions.md` (hela filen)
- `docs/decisions/ADR-028-supply-chain-incident-respons.md` (hela filen)
- `docs/decisions/ADR-030-docs-grindvakter-frontmatter-policy.md` (hela filen)
- `docs/decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md` (hela filen)
- `docs/decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md` (hela filen)
- `docs/decisions/ADR-094-webblasarbeteende-testklass.md` (hela filen)
- `docs/decisions/ADR-027-kvalitetsdefinitioner-stack-skifte.md` (hela filen, lågt relevant)
- `docs/decisions/ADR-107-reproducerbarhets-malet-lattviktsvagen-fore-nix.md` (hela filen, lågt relevant)
- `tasks/lessons.d/tsc-b-kan-vara-tyst-nar-en-ren-modul-far-ett-test-kor-tsc-p-tsconfig-tests.md` (hela filen)

**Kommandon körda live, 2026-09-17, i denna worktree** (version av verktyg
i parentes där relevant):

- `pwd`, `git branch --show-current`, `git rev-parse HEAD`
- `node --version` → `v24.13.1`
- `npx tsc --version` → `Version 7.0.2`
- `npm ls sharp smol-toml` (dependency-träd)
- `npx audit-ci --config audit-ci.jsonc` (audit-ci `7.1.0`, exitkod 1,
  utdata sparad och läst från fil)
- `npm ls typescript`
- `find supabase/functions -name "*.ts" | wc -l` → 135
- `find supabase/functions/_shared -name "*.ts" | wc -l` → 73
- `grep -c '"supabase/functions' tsconfig.edge-shared.json` → 24
- `grep -rn "deno check\|deno lint\|deno fmt" .github/workflows/*.yml` → 0 träffar
- `grep -in "deno" scripts/fas4-prod-deploy.sh` → 0 träffar
- `find . -iname "deno.json*" -o -iname "import_map*"` → 0 träffar
- `grep -n "VALE_VERSION" .github/workflows/ci.yml` → rad 2422, `"3.14.1"`
- `wc -l .lycheeignore` → 843; mönsterräkning via
  `grep -v '^\s*#' .lycheeignore | grep -vc '^\s*$'` → 70
- `find . -maxdepth 1 -name ".env*"` (filnamn, inga värden lästa)
- `cat .npmrc` → filen finns inte (exit 1)

**Interna (ej-webb) källor citerade av läst repo-material** (jag har inte
själv besökt dessa externa URL:er — de citeras av ADR-028/ADR-030/ADR-082
och listas här för spårbarhet, inte som egen research):

- GitHub Security Advisory-databasen: <https://github.com/advisories/GHSA-rgj7-g3m4-5g8c>,
  <https://github.com/advisories/GHSA-7w5x-hrqm-74c2> (verifierade via
  `audit-ci`s egen utdata, inte besökta i webbläsare)
