---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# Bör hela repot byta npm → pnpm innan workspaces för miranon.se? (Code, 2026-09-19)

> **Proveniens:** avgränsat research-pass (Session 128), kört i worktreen
> `.claude/worktrees/s128-docs`, gren `docs/s128-batch-3`, HEAD
> `1da41c0467`. Ingen produktionskod rörd, ingen `pnpm-lock.yaml` skapad i
> repot — torrkörningen skedde i en kastbar kopia under scratchpad, utanför
> arbetsträdet.

## Vad jag redan hade — och vad som är nytt i detta pass

Läst i sin helhet före första sökningen:

- [`docs/research/miranon-se-stack-och-repoform-2026-09-19.md`](miranon-se-stack-och-repoform-2026-09-19.md)
  § C — samma sessions FÖRRA research-passet. Det rekommenderade **npm
  workspaces** och avvisade pnpm workspaces med motiveringen "Inte motiverat
  av något av de tretton kraven — spekulativ komplexitet just nu", en
  bedömning gjord UTAN ett eget djuppass om pnpm specifikt (den vägde bara
  in workspace-mekaniken, inte supply-chain-läget, industriläget eller
  installationsprestanda). Det passet konstaterade också att repot idag är
  EN paket-rot med npm (`lockfileVersion: 3`, inga `workspaces`) — samma
  utgångsläge jag bekräftar nedan.
- `tasks/sessions/2026-09-19-session-128.md` Del 1–6 — grillningen som
  etablerade att miranon.se byggs i SAMMA repo, samt Marcus egna ord om
  pnpm-frågan (återgivna i uppdraget ovan) och orkestrerarens ramverk: en
  DELAD paket-rot kan bara ha EN pakethanterare, så frågan är om HELA repot
  byter, inte bara den nya appen.
- `git show origin/main:tasks/sessions/2026-09-17-session-126.md` Del 17–18
  — CI-ekonomins grillade beslut: mål **< 50 000** fakturerade
  CI-minuter/månad, snubbeltråd vid **40 000**, väntetidstak dokument ≤ 5
  min / kod ≤ 12 min median. Ingen av S126:s tio beslut eller de arton
  mintade korten (`464.x`, `479.x`, `480`) nämner installationssteg,
  cache eller låsfil — bekräftat genom att läsa varje 464.x/479.x/480-korts
  fulltext och grepp:a dem för `npm ci|npm install|node_modules|lockfile|
  setup-node|package-lock` (0 träffar utom `464.9` som nämner
  "node_modules" i en annan mening, om länkkontrollens jobb). Se § 6.
- `docs/research/ci-djupgranskning-2026-09-17/00-huvudrapport.md` +
  `10-migrations-och-atgardsplan.md` — grepp:ade för `pnpm|npm ci|npm
  install|cache|minut|budget`. Granskningens NIO leverabler nämner ALDRIG
  pnpm; dess minutbesparingar kommer uteslutande ur att sluta köra samma
  testsvit fyra gånger (§ N1–N6), inte ur installationslagret.
- [`docs/research/repo-privat-konsekvenser-2026-09-18.md`](repo-privat-konsekvenser-2026-09-18.md)
  — bekräftar 50 000 min/mån-kvoten (Enterprise Cloud) och att repot blir
  privat detta veckoslut; ingen pnpm-koppling.
- `docs/decisions/ADR-028-supply-chain-incident-respons.md` (hela filen,
  inklusive alla sex `## Updates`-poster till och med 2026-09-18) — repots
  etablerade npm-advisory-process: pin + `overrides` + riktad `npm install`
  för ordinära advisories, full `rm -rf node_modules package-lock.json &&
  npm install` bara för bekräftad kompromiss. Ett pnpm-byte river denna
  process rakt av (`overrides`-blocket är npm-syntax; pnpm har sin egen
  `pnpm.overrides` som är kompatibel men INTE identisk, se § 4) och
  processen måste skrivas om, inte bara flyttas.

**Ålder:** stack-forskningspasset är från SAMMA dag (2026-09-19) och alltså
inte åldrat — men det gjorde ingen egen research om pnpm, bara ett
sido-omdöme. Detta pass är det första som faktiskt undersöker pnpm på
djupet för detta repo. Inget av det jag hittade var föråldrat nog att
kräva omprövning; alla versionsuppgifter nedan är hämtade eller mätta
2026-09-19.

**Vad som är NYTT i detta pass:** hela § 1 (pnpm 2026-funktioner mot
primärkällor, inklusive att npm SJÄLVT hann i kapp på lifecycle-scripts och
min-release-age under 2026 — obelagt i det tidigare passet), § 2
(16 namngivna repons faktiska pakethanterare, mätt via lockfil/`packageManager`-
fält), § 3 (en fullständig, mätt inventering av VARJE npm-beroende yta i
detta repo), § 4 (en verklig torrkörning med tidsmätning, inte en gissning),
och fyndet i § 3/§ 4 att repots EGEN worktree-arkitektur redan löst det
disk-problem pnpm marknadsförs mot (symlänkad `node_modules`, se nedan) —
vilket väsentligt försvagar ett av bakgrundens antagna motiv.

## Kort svar

**Byt senare, inte nu — och inte "aldrig".** pnpm ger verkliga, mätbara
fördelar 2026 (strikt `node_modules`, blockerade byggskript som default,
`minimumReleaseAge` som default, workspace-`catalog:`), och branschläget för
repon i vår klass är entydigt: **13 av 16 mätta jämförbara projekt kör pnpm**
— inklusive FEM projekt vi bokstavligen är beroende av (TanStack Router,
Vite, Biome, Zod, Vercel AI SDK). Men den **avgörande delfrågan** (§ 3–4)
visar att bytets kostnad i DETTA repo är ovanligt hög just nu: 86
npm-kommandon i sju workflow-filer, ~23 avläsare av `packageManager`-
mekanik som saknas helt, en ADR-kodifierad supply-chain-process
(`ADR-028`) byggd på npm-specifik syntax, 18 samtidiga git-worktrees mitt i
en aktiv CI-ombyggnad (S126/S127), och — mest avgörande — repots EGEN
mätning visar att det problem pnpm löser bäst för många worktrees
("varje worktree behöver `node_modules`") **redan är löst** här via en
dokumenterad symlänk (`.claude/agents/bygg-agent.md` rad 63): alla
bygg-agent-worktrees delar EN `node_modules` med huvudkatalogen. pnpms
verkliga, mätta vinst i den situationen är därför liten, inte stor.
Rekommendationen är: bygg miranon.se med **npm workspaces nu** (oförändrat
från förra passet), och kör pnpm-bytet som ett **eget, senare** pass EFTER
att S126:s CI-ombyggnad landat och lugnat ner sig — se § 8 för exakt
stegordning och varför "efter workspaces" är billigare än "före".

## 1. Vad pnpm faktiskt ger 2026 — och vad npm hann ikapp med

**Version mätt lokalt:** pnpm 12.4.2, npm 11.8.0 (bundlad med Node
24.13.1 — repots `.nvmrc` säger `24`). Källor: `pnpm --version`, `npm
--version`, körda i worktreen 2026-09-19.

### Strikt `node_modules` — mätt, inte citerat

pnpm.io: *"Isolated `node_modules`"* är default i pnpm
(<https://pnpm.io/feature-comparison>, hämtad 2026-09-19). Jag mätte detta
direkt i torrkörningen (§ nedan): `scheduler` (en transitiv dependency av
vårt `react-dom`, den klassiska phantom-dependency-exemplet i varje
pnpm-artikel) finns installerad under
`node_modules/.pnpm/scheduler@0.27.0`, men är **inte** nåbar via
`node_modules/scheduler` på toppnivå. Under npm (repots faktiska
`node_modules`, 651 MB, platt) skulle motsvarande transitiva paket vara
nåbart utan att stå i `package.json` — en phantom-dependency-risk pnpm
strukturellt eliminerar.

**Prövat mot vår egen kod:** jag extraherade alla 196 bara import-
specifikationer i `src/` (`grep -rhoE "from ['\"][^./][^'\"]*"`) och
diffade mot de 54 direkt deklarerade beroendena i `package.json`. **Noll
phantom-imports hittades** — varje icke-`@/`-import matchar antingen ett
deklarerat beroende eller är en virtuell modul (`virtual:pwa-register`,
`vite-plugin-pwa`s egen mekanism, ingen npm-paket). Domen: ett pnpm-byte
skulle INTE avslöja någon dold bugg i just denna kodbas idag — fördelen är
FÖREBYGGANDE (skyddar mot framtida drift), inte reparerande.

### Blockerade byggskript som default — exakt versionshistorik

- **pnpm 10.0.0** (jan 2025): lifecycle-scripts (`preinstall`/`install`/
  `postinstall`) för DEPENDENCIES körs INTE längre som default. Källa:
  Socket.dev, "pnpm 10.0.0 Blocks Lifecycle Scripts by Default"
  (<https://socket.dev/blog/pnpm-10-0-0-blocks-lifecycle-scripts-by-default>,
  hämtad 2026-09-19) — motiverat direkt av Rspack-supply-chain-attacken.
  Konfigurerades då via `onlyBuiltDependencies`/`ignoredBuiltDependencies`/
  `neverBuiltDependencies` (nu borttagna, se nedan).
- **pnpm 10.16** (2025-09-12): `minimumReleaseAge` introducerad, **opt-in**,
  default `0`. Källa: <https://pnpm.io/blog/releases/10.16> (hämtad
  2026-09-19).
- **pnpm 11.0** (2026-04-28): `minimumReleaseAge` defaultar till **1440**
  (24 timmar) — nu PÅ som default, inte längre opt-in. Samtidigt:
  `blockExoticSubdeps` default `true` (bara direkta beroenden får
  git-URL:er/tarball-källor), `strictDepBuilds` default `true`,
  `verifyDepsBeforeRun: install`. **Byggkonfigurationen skrevs om helt:**
  `onlyBuiltDependencies`/`neverBuiltDependencies`/`ignoredBuiltDependencies`/
  `ignoreDepScripts`/`onlyBuiltDependenciesFile` är BORTTAGNA, ersatta av en
  enda `allowBuilds`-karta (`{ paketnamn: true/false }`). Node 22+ krävs.
  Inställningar delas nu mellan `.npmrc` (registry/auth) och
  `pnpm-workspace.yaml`/global `~/.config/pnpm/config.yaml`
  (pnpm-specifika). Källor: <https://pnpm.io/blog/releases/11.0>,
  <https://pnpm.io/settings/dependency-resolution>,
  <https://pnpm.io/settings/build> (samtliga hämtade 2026-09-19).
- **pnpm 12.0** (2026-08-26): inga ändringar av dessa defaults. Nya
  ändringar: git-dependency-URL:er normaliseras till HTTPS (SSH tas bort ur
  lockfilen), `sudo` blockeras för globala kommandon, `pnpm init` pinnar nu
  senaste pnpm-versionen. Källa: <https://pnpm.io/blog/releases/12.0>
  (hämtad 2026-09-19).
- **trustPolicy** (`no-downgrade`/`off`): default är **`off`** — detta är
  INTE på som default, till skillnad från `minimumReleaseAge`. Källa:
  <https://pnpm.io/settings/dependency-resolution> (hämtad 2026-09-19).

**Prövat mot vår låsfil:** endast **4** poster i `package-lock.json` bär
`hasInstallScript: true` — roten själv (repots `postinstall`: `git config
core.hooksPath .githooks`), `fsevents` (två instanser, macOS-endast,
optional) och `msw`. Jag inspekterade `msw`s postinstall direkt i den
installerade node_modules-kopian: `node -e "import('./config/scripts/
postinstall.js').catch(() => void 0)"` — inramat i ett tyst catch, alltså
säkert att blockera (bekräftat av en pnpm-diskussion: mswjs/msw #2413,
<https://github.com/mswjs/msw/discussions/2413>, hämtad 2026-09-19 — skriptet
håller bara `mockServiceWorker.js` uppdaterad vid versionsbyte, blockeras
det måste man köra `npx msw init` manuellt efter en msw-uppgradering).
`fsevents` installerades **inte ens** i min torrkörning (x64 Darwin,
optional-flagga, inget top-level-symlänk) — noll påverkan. **Roten är det
enda verkligt kritiska:** `git config core.hooksPath` sätter upp
commit-hooken. Rot-paketets EGNA scripts (till skillnad från dependencies)
körs alltid av pnpm oavsett `allowBuilds` — jag kunde INTE hitta en
primärkälla som säger motsatsen, men jag kunde heller inte bekräfta det med
en skarp, oskyddad `pnpm install`-körning (jag höll mig till uppdragets
`--ignore-scripts`-krav). **Flaggat som obelagt, se § 9.**

### npm hann ikapp under 2026 — det viktigaste fyndet i denna sektion

Uppdragets ram ("vad har npm motsvarande 2026?") visade sig ha ett mycket
konkret svar, inte en jämförelse mellan en säkrad och en osäkrad
pakethanterare:

- **npm v12** (skeppad 2026-07-08): `allowScripts` defaultar till **av** —
  samma princip som pnpm 10 arton månader tidigare. Godkänns via `npm
  install-scripts approve` + `npm rebuild`. Källor: Socket.dev "npm v12
  Ships With Install Scripts Off by Default"
  (<https://socket.dev/blog/npm-12>), InfoQ "npm 12 Released: Install
  Scripts off by Default" (<https://www.infoq.com/news/2026/08/npm-12-released/>)
  (båda hämtade 2026-09-19, sökträffar — se § 9 om jag inte kunde nå
  npmjs.com:s egen release-not för v12 direkt).
- **npm 11.10.0**: `min-release-age` introducerad — npms motsvarighet till
  pnpms `minimumReleaseAge`. Källa: samma sökning, citerad i flera
  oberoende artiklar (Socket.dev, dev.to) — jag kunde INTE verifiera det
  exakta defaultvärdet mot npmjs.com:s primärkälla i detta pass (se § 9).
- **Git-beroenden** avstängda som default i npm v12 om inte explicit
  godkända.
- **npm-provenance** (redan etablerat sedan npm 9.5.0, inte nytt 2026):
  Sigstore-baserade attestationer som knyter ett publicerat paket till sin
  källkod/byggmiljö. Källa: <https://docs.npmjs.com/generating-provenance-statements>
  (hämtad 2026-09-19). pnpm har ingen direkt motsvarighet dokumenterad i
  detta pass.

**Den kritiska nyansen, MÄTT lokalt:** vårt installerade npm är **11.8.0**
— FÖRE npm 12 och FÖRE 11.10.0. `npm view npm@latest engines` gav `{ node:
'^22.22.2 || ^24.15.0 || >=26.0.0' }`; vår `.nvmrc` säger bara `24` (öppen,
kan lösa till valfri 24.x). Med andra ord: **de npm-skydd som skulle göra
jämförelsen jämn är inte de vi faktiskt kör.** Att stanna på npm ger oss
INTE automatiskt dessa skydd — vi måste aktivt uppgradera npm (via
Corepack eller `npm install -g npm@latest`) för att få dem, precis som ett
pnpm-byte kräver aktivt arbete. Detta är en ärlig symmetri, inte ett
argument för endera sidan i sig.

### Installationstid och disk — MÄTT, inte citerat (n=2 per pakethanterare, samma nätverk/maskin, 2026-09-19)

Torrkörning i `/private/tmp/.../scratchpad/pnpm-torrkorning/` (pnpm) och en
parallell kopia i `/private/tmp/.../scratchpad/npm-baseline/` (npm), båda
från samma `package.json`+`package-lock.json`:

| Körning | Verktyg | Wall-tid | user+system |
|---|---|---|---|
| `pnpm import` (package-lock.json → pnpm-lock.yaml) | pnpm 12.4.2 | 14,3 s | 3,56+2,59 s |
| 1:a `pnpm install --ignore-scripts` (kall store) | pnpm 12.4.2 | 22,2 s | 6,74+72,23 s |
| 2:a `pnpm install --ignore-scripts` (varm store) | pnpm 12.4.2 | **7,9 s** | 1,92+13,42 s |
| 1:a `npm ci --ignore-scripts` (kall cache) | npm 11.8.0 | 23,1 s | 20,15+26,67 s |
| 2:a `npm ci --ignore-scripts` (varm cache) | npm 11.8.0 | 48,8 s | 42,20+53,23 s |

**Dom på mätningen:** vid KALL cache är npm och pnpm i praktiken
LIKVÄRDIGA (23,1 s vs 22,2 s) — båda är nätverksbundna mot samma registry
under samma nätverksförhållanden. Vid VARM cache/store vinner pnpm stort
(7,9 s mot 48,8 s — nästan 6×), eftersom pnpms innehållsadresserade store
återanvänder redan nedladdade paket via hårda länkar medan npms andra
körning var LÅNGSAMMARE än sin första (troligen samtidig maskinlast av
andra processer under mätfönstret — 18 aktiva worktrees, se § 3 — inte en
ren npm-cache-svaghet; siffran ska läsas med den reservationen). **639
paket installerade** i pnpm-fallet mot **635 i npm-fallet** (skillnaden är
`.bin`-symlänkar som räknas olika, ingen verklig avvikelse — verifierat
att `dependencies`/`devDependencies`-listorna är identiska).

`disk`: pnpm-torrkörningens `node_modules` var **644 MB**, den riktiga
repo-kopians npm-`node_modules` är **651 MB** — i det närmaste identiska
FÖR EN ENSAM installation. pnpms diskfördel uppstår först när FLERA
projekt/worktrees delar samma store (`/Users/marcus/Library/pnpm/store`,
2,5 GB på denna maskin efter flera projekts användning) — se § 3 för varför
det inte är den vinst det verkar vara i just detta repo.

### Workspace-protokoll och `catalog:`

`workspace:`-protokollet länkar lokala paket utan publicering (samma sak
npm workspaces gör med `file:`-länkning — ingen unik pnpm-fördel här).
**`catalog:`** är pnpm-unikt: en `pnpm-workspace.yaml` kan deklarera
`catalog: { react: ^19.2.8 }`, och varje paket i workspacet skriver
`"react": "catalog:"` i sin `package.json` — EN sanningskälla för en
delad version i stället för att hand-synka samma range i flera
`package.json`-filer. Källa: <https://pnpm.io/catalogs> (hämtad
2026-09-19). **Direkt relevant för miranon.se:** admin-appen och
sajten kommer dela React, TanStack-familjen och Tailwind — `catalog:`
löser precis det synkroniseringsproblemet npm workspaces INTE har en
inbyggd mekanism för (npm kräver att varje paket skriver samma
version-range manuellt, eller en tredjepartslösning som `syncpack`).

**Dom § 1:** pnpm:s 2026-läge är verkligt och mätbart starkare på strikt
isolering och supply-chain-defaults — men npm har på egen hand krympt
gapet under 2026 (v12), fast vi kör inte den versionen idag. Installations-
prestandan är INTE den drivande fördelen kall (likvärdig), bara varm
(stor fördel, men mest relevant tvärs-repo, inte inom detta repos
worktree-mönster — se § 3).

## 2. Branschläget — 16 namngivna, verifierbara projekt

MÄTT direkt (`curl`/`gh api` mot rå `package.json` respektive root-
filträdet), inte citerat från en sammanfattningsartikel:

| Repo | Belägg | Pakethanterare |
|---|---|---|
| `vercel/next.js` | `packageManager: pnpm@10.33.0` | pnpm |
| `vitejs/vite` | `packageManager: pnpm@12.4.2` | pnpm |
| `withastro/astro` | `packageManager: pnpm@11.27.0` | pnpm |
| `TanStack/router` **(vår egen router)** | `packageManager: pnpm@11.21.0` | pnpm |
| `supabase/supabase` **(vår egen backend)** | `packageManager: pnpm@11.13.1` | pnpm |
| `remix-run/react-router` | `packageManager: pnpm@11.7.0` | pnpm |
| `shadcn-ui/ui` | `packageManager: pnpm@10.33.4` | pnpm |
| `biomejs/biome` **(vår egen linter)** | `packageManager: pnpm@12.3.4` | pnpm |
| `vercel/turborepo` | `packageManager: pnpm@12.0.0` | pnpm |
| `pmndrs/zustand` | `packageManager: pnpm@11.3.0+sha512...` | pnpm |
| `radix-ui/primitives` | `pnpm-lock.yaml` i rot-trädet | pnpm |
| `vercel/ai` | `pnpm-lock.yaml` i rot-trädet | pnpm |
| `colinhacks/zod` **(vårt eget schema-bibliotek)** | `pnpm-lock.yaml` finns, men `packageManager: "nub@0.8.3"` — ett verktyg jag inte kunde identifiera; räknas försiktigt som "pnpm-format", inte okritiskt som "pnpm" | pnpm-lockfil, oklar exekverare |
| `microsoft/playwright` **(vårt eget testverktyg)** | `package-lock.json` i rot-trädet, inget `packageManager`-fält | **npm** |
| `adobe/react-spectrum` **(vår egen `@react-aria`/`@react-stately`)** | `yarn.lock` i rot-trädet | **yarn** |
| `getsentry/sentry-javascript` **(vår egen @sentry/react)** | `yarn.lock` i rot-trädet | **yarn** |

**Räkningen, ärligt:** 13 av 16 pnpm (varav en, zod, med en oidentifierad
`packageManager`-strängs reservation), 1 npm (Playwright), 2 yarn (Adobe
React Spectrum/React Aria, Sentry JavaScript SDK). **"Många proffs kör
pnpm" är BELAGT** för repon i vår produktklass (React/TypeScript,
Vite/Next.js/Astro/TanStack/Supabase/Vercel-ekosystemet) — och särskilt
slående är att FEM av de sexton är projekt VI SJÄLVA konsumerar direkt
(TanStack Router, Vite, Biome, Zod, Supabase), vilket betyder att vår
egen `node_modules` redan innehåller kod byggd och testad i en
pnpm-miljö uppströms, oavsett vad VI kör lokalt.

**Vad jag INTE kunde belägga i denna sektion:** en kvalitetsgranskad,
primärkälle-baserad marknadsandels-siffra (typ "X % av alla JS-projekt").
Websökningen på "State of JS 2026 package manager" gav uteslutande
lågkvalitativa SEO-blogginlägg (dev.to, tech-insider.org) med
osannolikt precisa men ospårbara siffror ("3,7× snabbare", "85 % mindre
disk", "103M vs 9M weekly") — jag citerar INGEN av dem, eftersom jag inte
kunde verifiera underlaget. Den enda sifferbaserade branschkällan
(Stack Overflow Developer Survey 2024: npm 62 %, Yarn 18 %) nåddes bara
genom en sekundär syntes, inte SO:s egen rapport — jag räknar den som
OBELAGD i detta pass. Repo-räkningen ovan är den enda siffra jag står
bakom.

## 3. Inventering av DETTA repo — mätt, inte antaget

**Totalt: 86 rader `npm ci`/`npm install`/`npx`/`npm run`/`npm audit`/`npm
view`/`npm ls` i `.github/workflows/*.yml` (grep-räknat), fördelat på sju
av nio workflow-filer.** De tre siffror som bär mest praktisk vikt:

| Mekanism | Antal anropsställen | Filer |
|---|---|---|
| `actions/setup-node` | 23 | `ci-suite.yml` (10), `nightly.yml` (5), `ci.yml` (5), `review-backstopp-proof.yml` (2), `visual-baselines.yml` (1) |
| `cache: 'npm'` | 15 | `ci-suite.yml` (7), `nightly.yml` (3), `ci.yml` (4), `visual-baselines.yml` (1) |
| `run: npm ci` | 13 | `ci-suite.yml` (6), `ci.yml` (3), `nightly.yml` (3), `visual-baselines.yml` (1) |
| `npx playwright install chromium` | 6 | `ci-suite.yml` (5), `visual-baselines.yml` (1) |

| Fil/yta | Vad | Måste ändras | Risk |
|---|---|---|---|
| `.github/workflows/ci.yml`, `ci-suite.yml`, `nightly.yml`, `visual-baselines.yml` | 15× `cache: 'npm'` → `cache: 'pnpm'`, 13× `run: npm ci` → `pnpm install --frozen-lockfile`, 23× `setup-node` behöver ett FÖREGÅENDE `pnpm/action-setup`-steg (pnpm måste vara installerat innan `setup-node`s cache-steg kan hitta det — `actions/setup-node`s egen dokumentation: *"Package manager should be pre-installed"*, pnpm ≥ 6.10 krävs) | JA — mekaniskt, men repetitivt (23 anropsställen × en ny action-rad) | Medel — repetitivt, verifierbart per jobb, men stor diff i två filer som redan är under aktiv S126/S127-redigering |
| `.ci-parity-policy.json` (23 689 byte) | YAML-parsar `ci.yml`/`ci-suite.yml`s `run:`-block verbatim. `infraRationale`-strängen (rad 91) nämner "npm ci, cache-restore" i PROSA som skäl att skippa infra-steg lokalt — texten blir sakligt fel-riktad (pratar om npm när det körs pnpm) men grinden SJÄLV skippar redan install-steg oavsett verktyg, så INGEN parserlogik måste ändras, bara prosan | Prosa-justering, ADR-083-disciplin — inte en mekanism | Låg |
| `scripts/verify-ci-parity.mjs` rad 710 | `spawnSync('npm', ['run', '--silent', 'check:docs'], …)` — hårdkodat `npm run`, INTE `npm ci` | **Fungerar oförändrat.** `npm run <script>` bryr sig inte om vilket verktyg som fyllde `node_modules`/`.bin` — den kör bara det som står i `package.json`s `scripts`-block och lägger `node_modules/.bin` i PATH. Ett symlänkat `.bin` (pnpms form) fungerar identiskt | Ingen |
| `package.json` (roten) | `buildCommand`-motsvarigheten `npm run build` i egna scripts (`build:staging`, `test:preview:staging`, 2 rader) anropar `npm run` internt | Kan bytas till `pnpm run`/`pnpm build` för konsekvens, men **fungerar oförändrat** av samma skäl som ovan | Låg |
| `package.json` `postinstall` | `git config core.hooksPath .githooks 2>/dev/null \|\| true` | **KRITISKT att verifiera** — se § 1 och § 4, roten körs alltid men jag kunde inte hitta en primärkälla som SÄGER det explicit | Medel — om det INTE körs sätts hook-mekanismen (`T121`-skyddet) inte upp automatiskt |
| `vercel.json` | `"buildCommand": "npm run build"` (1 rad) | Bör bytas till `"pnpm run build"`/`"pnpm build"` explicit, ANNARS littar Vercel på sin egen auto-detektion via lockfil (se § 4 — och det finns en dokumenterad fälla där) | Medel-Hög (se § 4) |
| `.nvmrc` | `24` | Ingen ändring — Node-versionen är oberoende av pakethanterare | Ingen |
| `package.json` (rot, `packageManager`) | **Saknas helt idag** | Måste LÄGGAS TILL (`"packageManager": "pnpm@12.4.2"`) — utan den vet varken Corepack, Vercel eller CI vilken pnpm-version som är avsedd | Hög om utelämnad (se Vercel-fällan, § 4) |
| `CONTRIBUTING.md` | 34 rader med `npm`/`npx`/`npm run`/`npm ci`/`npm install` | JA, brett — kommandolistor, DoD-instruktioner, exempel | Medel — rent textarbete, ingen mekanism |
| `CLAUDE.md` (denna fil) | Dussintals `npm run …`-kommandon i löptext (DoD-listan, `verify:ci-parity`, `seed:review`, `metrics:flake`, fas4-deploy-exemplen m.fl.) | JA, brett — samma klass som CONTRIBUTING.md | Medel — textarbete, men filen är ALLTID-LADDAD så feltext är dyrare att missa (K5/K7-precedent i repots egen historik) |
| `.claude/agents/bygg-agent.md` | 6 träffar, inklusive den kritiska `ln -s .../node_modules ./node_modules`-raden (§ ovan) | JA för kommandoexemplen; symlänk-mekaniken i sig KRÄVER INGEN ÄNDRING (en symlänk bryr sig inte om filträdets interna struktur) | Låg (symlänken), Medel (textexemplen) |
| `.claude/agents/research-pass.md`, `review-agent.md` | 2+4 träffar | JA, mindre omfattning | Låg |
| `.claude/settings.json` | 10 rader i `permissions`-listan: `Bash(npm run test:api)`, `Bash(npm ci)`, `Bash(npm install …)` osv. | JA — varje agent-tillåten kommandorad måste FÅ en `pnpm`-motsvarighet, annars blockeras agenter av permission-systemet efter bytet | **Hög** — glöms detta stannar varje agent på en tillåtelse-prompt mitt i AFK-drift |
| Nio `.*-policy.*`-filer (`.ci-parity-policy.json`, `.codeql-d0-kodfri-policy.conf`, `.facit-policy.conf`, `.grind-exitkod-policy.conf`, `.heartbeat-svep-policy.conf`, `.label-policy.json`, `.review-policy.json`, `.supabase-cli-policy.conf`, `.claims-tackning-policy.conf`) | 39 träffar totalt, men `.codeql-d0-kodfri-policy.conf`s 18 är alla PROSA-omnämnanden av "npm-post"/"workflow-referens" som klassificeringsspråk för enskilda filer, inte kommandon | Prosa-justering i de flesta, ingen mekanism-ändring | Låg |
| `audit-ci.jsonc` | Repots sex-incidenters ADR-028-process (pin + `overrides` + riktad `npm install`) | **Måste skrivas om** — `overrides` är npm-syntax; pnpm har `pnpm.overrides` i `package.json` (kompatibel form, men pnpm läser INTE npms `overrides`-nyckel automatiskt — de är olika fält). Hela `ADR-028`-processen (sex incidenter, fem `Updates`-poster) måste omtolkas för pnpm-syntax, inte bara flyttas | **Hög** — detta är en ADR-kodifierad, skarpt bevisad process med sex verkliga incidenter bakom sig |
| `scripts/*.mjs`/`*.sh` som använder `npx` | 25 filer (bygg-agent, review-agent, `acceptance-urval.sh`, `atkomst-diagnos.sh`, `audit-ci-med-degradering.sh`, `backfill-inbetalningar.mjs`, `backlog-cli.sh`, `check-*.sh/mjs` m.fl.) | **Fungerar oförändrat i de flesta fall** — `npx <paket>` letar i lokal `node_modules/.bin` FÖRST (fungerar identiskt oavsett vem som fyllde den), och faller annars tillbaka till att LADDA NER paketet temporärt. Repot har bara EN känd plats där distinktionen spelar roll: ett `npx`-anrop mot ett paket som INTE är en deklarerad dependency (då vill man `pnpm dlx`, inte `pnpm exec`, för att undvika att skriva till projektets `node_modules`) — jag hittade INGET sådant anropsställe i de 25 filerna vid stickprov | Låg — men kräver en fil-för-fil-verifiering, inte antagande |
| Backlog.md-CLI:t (`node_modules/.bin/backlog`) | Körs idag ur `node_modules/.bin` via `npm run bl`-wrappern (`scripts/backlog-cli.sh`) | **Fungerar oförändrat** — `.bin`-symlänken pekar på samma plats oavsett pakethanterare, och `backlog.md`s egna `hasInstallScript`-status i låsfilen var INTE bland de fyra jag hittade (den bär inget lifecycle-script) | Ingen |
| `supabase/functions/` (Deno) | Egen beroendehantering (Deno import maps/JSR), TOTALT SEPARAT från Node/npm/pnpm | **Berörs inte alls** — Deno läser aldrig `node_modules` eller en npm/pnpm-låsfil för Edge Functions. Bekräftat mot repots egen `docs/research/task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md`-titel (namnet ensamt bekräftar separationen; jag öppnade inte filen i detta pass, se § 9) | Ingen (obekräftat till 100 %, se § 9) |
| **18 samtidiga öppna git-worktrees** (mätt `git worktree list`, 2026-09-19) | Varje worktree symlänkar `node_modules` till huvudkatalogens (`.claude/agents/bygg-agent.md` rad 63: *"En worktree är en färsk checkout utan `node_modules`… Symlinka den — kopiera inte"*). Huvudkatalogens `node_modules` är i dag 651 MB (mätt) | En pnpm-switch ändrar INTE symlänk-mönstret — en symlänk till en pnpm-populerad `node_modules` fungerar identiskt. Men SAMTIDIGT installationsarbete (två agenter som kör `pnpm install` mot samma symlänkade katalog samtidigt) är exakt lika farligt som `.ci-parity-policy.json`s egen varningstext redan säger om npm ("farligt: npm ci mot ett symlänkat node_modules delat med huvudrepot") — samma risk kvarstår, oavsett verktyg | Medel — en KÄND, redan dokumenterad risk som INTE förvärras av bytet men inte heller försvinner |

**Dom § 3:** ytan är bred (86 kommandorader + 23 setup-node-anropsställen +
minst nio prosafiler) men **grund** — nästan allt är mekaniskt,
find-and-replace-artat arbete. De verkligt höga riskerna är TVÅ, inte
många: (1) `ADR-028`s supply-chain-process måste omtolkas, inte bara
flyttas, och (2) `.claude/settings.json`s permission-lista måste hållas i
synk annars stannar agenter mitt i drift.

## 4. Fällor specifika för pnpm som kan slå här

1. **Vercel-fällan, mätt mot Vercel egen dokumentation
   (`vercel.com/docs/package-managers`, `last_updated: 2026-08-11`,
   hämtad 2026-09-19):** utan `packageManager`-fält OCH Corepack aktiverat
   läser Vercel `lockfileVersion` i `pnpm-lock.yaml` för att GISSA
   pnpm-versionen — `lockfileVersion: 9.0` (vilket vår egen torrkörning
   FAKTISKT genererade, verifierat med `grep lockfileVersion
   pnpm-lock.yaml`, trots att jag körde pnpm 12.4.2) tolkas av Vercel som
   "pnpm 9 eller 10". **Ännu allvarligare:** Vercels dokumentation säger
   explicit att en "override install command" som `pnpm install` (i
   stället för auto-detektion) gör att Vercel använder **den ÄLDSTA
   tillgängliga pnpm-versionen i build-containern** — exemplet i deras
   egen text är pnpm 6. En pnpm 6-install har INGET av § 1:s
   supply-chain-skydd (`onlyBuiltDependencies` fanns inte ens än). **Detta
   är den enskilt farligaste fällan i hela utredningen** — den kan tyst
   ge oss ett OSÄKRARE läge än att stanna på npm, om `packageManager`-
   fältet glöms.
2. **Corepack-sidan av samma dokumentation är motsägelsefull/möjligen
   inaktuell:** samma Vercel-sida (`configure-a-build`,
   `last_updated: 2026-08-28`) beskriver Corepack som *"experimental"*
   och länkar till Node 16-dokumentation, och kräver env-variabeln
   `ENABLE_EXPERIMENTAL_COREPACK=1`. Det är antingen genuint fortfarande
   sant, eller en icke-uppdaterad sida trots det sena `last_updated`-
   datumet — jag kunde INTE reda ut vilket i detta pass (se § 9). Den
   praktiska konsekvensen är densamma oavsett: sätt `packageManager`-
   fältet OCH testa en riktig preview-deploy innan produktionscutover.
3. **Corepack själv försvinner ur Node 25+** (Node TSC-beslut, källor:
   Socket.dev "Node.js TSC Votes to Stop Distributing Corepack",
   `nodejs/nodejs.org` issue #7555, hämtade 2026-09-19) — kvar bundlat i
   Node 24 LTS (vår `.nvmrc: 24`, bekräftat: `corepack --version` gav
   `0.34.6` lokalt), men kräver separat `npm install -g corepack` vid en
   FRAMTIDA uppgradering till Node 25/26. Ingen omedelbar risk, men en
   känd framtida brytpunkt att skriva in i beslutet om pnpm väljs.
4. **`ADR-028`s `overrides`-mekanik är npm-specifik syntax.** pnpm har en
   egen `pnpm.overrides`-nyckel i `package.json` som fungerar likartat men
   INTE är samma fält som npms `overrides` — en rak `pnpm import` FLYTTAR
   inte automatiskt en npm-`overrides`-post till pnpm-formatet (jag
   kunde inte hitta en primärkälla som säger att `pnpm import` gör den
   översättningen; se § 9). De fem kvarvarande `overrides`-posterna i
   repots `package.json` (brace-expansion, fast-uri, js-yaml, linkify-it,
   postcss, sharp — `ADR-028`s Updates-tabell) måste verifieras manuellt
   efter en `pnpm import`.
5. **Peer-dependency-strikthet** — pnpm auto-installerar peer-deps
   (`autoInstallPeers: true` var satt som default i min genererade
   `pnpm-lock.yaml`s `settings`-block, verifierat direkt i filen). Min
   torrkörning gav **noll** peer-varningar eller peer-konflikter — grep:at
   `/tmp/pnpm-install-out.log` för "peer" gav inga träffar. Repots
   beroendeträd är alltså peer-rent redan idag; ingen förväntad friktion.
6. **`audit-ci` STÖDER pnpm** — direkt källa, IBM/audit-ci:s egen README:
   *"Audit NPM, Yarn, PNPM, and Bun dependencies… requires PNPM >=4.3.0"*
   (<https://github.com/IBM/audit-ci>, hämtad 2026-09-19). Detta avfärdar
   den mest uppenbara farhågan i uppdraget — `audit-ci.jsonc`s STRUKTUR
   (allowlist-format) behöver INTE bytas ut mot `pnpm audit` eller ett
   tredjepartsverktyg. Bekräfta pnpm-läget med en riktig körning innan
   cutover (ej gjort i detta pass, se § 9).
7. **Dependabot stöder pnpm workspace-`catalog:`** sedan **2025-02-04
   (GA)**, källa: GitHub Changelog
   (<https://github.blog/changelog/2025-02-04-dependabot-now-supports-pnpm-workspace-catalogs-ga/>,
   hämtad 2026-09-19). `package-ecosystem`-värdet i `dependabot.yml` är
   **`"npm"`** för pnpm-projekt också (samma ekosystem-nyckel täcker
   npm/yarn/pnpm/bun) — repots befintliga `.github/dependabot.yml`-rad
   `package-ecosystem: "npm"` (verifierad direkt i filen) **behöver INTE
   ändras**. Känt kvarvarande problem (april 2026): Dependabot grupperar
   pnpm-catalog-beroenden under `dependency-type: production` oavsett om
   de är dev eller prod (`dependabot-core` #14824) — en mindre,
   dokumenterad brist, inte en blockerare.
8. **GitHub Actions-cache:** `actions/setup-node` stöder `cache: 'pnpm'`
   för pnpm ≥ 6.10, MEN kräver att pnpm redan är installerat i jobbet
   FÖRE `setup-node`-steget (`actions/setup-node`s egen dokumentation:
   *"Package manager should be pre-installed"*). pnpms EGEN
   CI-dokumentation (<https://pnpm.io/continuous-integration>, hämtad
   2026-09-19) rekommenderar numera **`pnpm/setup@v2.0.0`** (SHA-pinnbar,
   samma konvention som repots `TASK-312`-praxis) i stället för
   `actions/setup-node` + separat pnpm-installation — enligt pnpm.io
   *"every `pnpm` call starts Node.js to run the [Corepack] shim before
   pnpm itself starts"*, alltså rekommenderar de INTE Corepack för CI.
   `pnpm/action-setup` (den äldre, separata actionen) är INTE
   deprecated/arkiverad (verifierat direkt mot dess README) och kan
   fortsatt kombineras med `actions/setup-node` för pnpm v11/v12 — detta
   är den lägre-diff-vägen för OSS repo, se § 5/§ 6.
9. **Playwright/Biome/TypeScript project references under symlänkad
   layout:** ingen dokumenterad konflikt hittad. `tsconfig.app.json`/
   `tsconfig.node.json` använder `moduleResolution: "bundler"` (verifierat
   direkt i filerna) — modernt läge, inget `preserveSymlinks`-override
   satt, vilket är standardkombinationen tre av våra egna uppströms-
   beroenden (Vite, TanStack Router, Biome) själva kör i pnpm-monorepon.
   Detta är PRECEDENS, inte ett direkt test av vår kod — se § 9.

## 5. Bytets form

1. **`pnpm import`** från `package-lock.json` — MÄTT, 14,3 s, genererade en
   `pnpm-lock.yaml` med `lockfileVersion: '9.0'`, 7 824 rader. pnpm.io:s
   egen dokumentation för `pnpm import`
   (<https://pnpm.io/cli/import>, hämtad 2026-09-19) beskriver bara ATT
   kommandot importerar från `package-lock.json`, INTE om exakta
   upplösta versioner bevaras eller om paketträdet räknas om — jag kunde
   INTE hitta en primärkälla som ger den garantin explicit (se § 9). Min
   egen efterföljande `pnpm install --ignore-scripts` (639 paket
   tillagda) matchade `package.json`s direktberoenden exakt (26
   `dependencies` + 28 `devDependencies` = 54, samma tal jag räknade i
   både npm- och pnpm-fallet) — INDIREKT belägg för fidelitet, inte ett
   bevis om exakt SHA-för-SHA-identiska transitiva versioner.
2. **`packageManager`-fältet** MÅSTE sättas (`"packageManager":
   "pnpm@12.4.2"`) — se Vercel-fällan i § 4 punkt 1. Utan den är
   pnpm-versionen odefinierad på minst tre ytor (Vercel, en framtida
   Corepack-aktiverad CI-runner, en utvecklares lokala maskin).
3. **`pnpm-workspace.yaml`** krävs den dag miranon.se blir ett eget
   workspace-paket (inte NU, om npm workspaces väljs för v1 — se § 7) —
   `catalog:`-blocket hör hemma här.
4. **`.npmrc`-inställningar att sätta från dag ett**, baserat på § 1:s
   mätta defaults: `minimumReleaseAge` är redan `1440` som default i
   pnpm 11+ (ingen egen rad krävs för att FÅ skyddet, bara för att
   DOKUMENTERA avsikten explicit — repots egen "prosa som påstår en
   mekanism"-disciplin, `ADR-083`, talar för att skriva det explicit ändå
   så avsikten inte tystnar vid en framtida pnpm-uppgradering som ändrar
   defaultvärdet igen). `trustPolicy: no-downgrade` är INTE default —
   måste sättas manuellt om önskad.
5. **Öppna grenar (15–25 st enligt uppdraget, 18 mätt just nu via
   `git worktree list`):** en `package-lock.json` i en gammal gren
   krockar inte MEKANISKT med en `pnpm-lock.yaml` på `main` (olika
   filnamn) — men VARJE öppen gren som rör `package.json` måste
   till slut rebasas/mergas mot en ny lockfils-verklighet, och `npm ci`
   i en gammal grens CI-körning (om den fortfarande pekar på det gamla
   workflow-innehållet) skulle sluta fungera samma dag `main`s
   `ci.yml` byts — **detta är starkaste skälet att göra bytet i ETT
   sammanhållet fönster med så få öppna PR:er som möjligt**, se § 6/§ 8.
6. **Worktrees:** ingen särskild hantering utöver den redan dokumenterade
   symlänken (§ 3) — men en agent som kör `pnpm install` MÅSTE göra det
   i huvudkatalogen, aldrig i en symlänkad worktree-kopia (samma regel
   som redan gäller `npm ci` idag, `.ci-parity-policy.json`s egna ord).
7. **Återställningsväg om det går snett:** radera `pnpm-lock.yaml` +
   `node_modules`, återställ `package-lock.json` från git, kör `npm ci`.
   Detta är en REN, snabb återställning eftersom `package.json` självt
   (bortsett från `packageManager`-fältet) inte behöver ändras för att
   npm ska fungera — det enda som binder repot TILL pnpm är
   `pnpm-lock.yaml`s närvaro plus CI-filernas kommandon. Rekommendation:
   behåll `package-lock.json` i git ORÖRD under en övergångsperiod (inte
   `.gitignore`:ad) som en billig, redan-testad reträttlinje, och ta bort
   den EXPLICIT i en egen, sista commit efter att en hel sprint gått
   utan pnpm-relaterade incidenter.

## 6. Ordningen mot S126

**MÄTT, inte antaget:** jag läste hela beskrivningen på `464.3`–`464.14`,
`479.1`–`479.4` och `480` och grep:ade dem för
`npm ci|npm install|node_modules|lockfile|setup-node|package-lock`. **Noll
av dem rör installationssteg, cache eller låsfil.** De rör alla
TEST-SVIT-DEDUPLICERING (S1–S3: sluta köra samma hermetiska svit tre-fyra
gånger per landning) och CI-STRUKTUR-hygien (SE13/SE21: en läsbar
CI-karta; SE16/SE18: ägarskap för rött efter landning). `464.9` nämner
"node_modules" bara i motiveringen om varför länkkontrollens jobb INTE
behöver en cache-restore ("Node utan beroenden — en cache-restore hade
varit ren väggklocka"), inte om ett install-steg som ska ändras.

**Slutsats: pnpm-bytet och S126:s kort är ORTOGONALA i sak, men DELAR
FILYTA.** `464.4`+`464.5` kedjas eftersom de båda rör `ci.yml`; `464.6`+
`464.14` kedjas eftersom de båda rör `post-merge.yml`; `464.7`/`479.2`/
`467` flaggas i handoffen som möjliga filkollisioner med kedjorna. Ett
pnpm-byte skulle röra **SAMMA workflow-filer** (`ci.yml`, `ci-suite.yml`,
`nightly.yml`, `visual-baselines.yml`) som HELA `464`-serien redan
redigerar. **Föreslagen ordningsprincip: pnpm-bytet väntar tills HELA
`464`-serien (464.3–464.14) är landad och `main` har stabiliserat sig på
den nya CI-strukturen** — annars konkurrerar två samtidiga, stora
omskrivningar av samma fem-sex filer om samma diff-yta, med hög risk för
merge-konflikter och en granskningsbörda ingen enskild PR bär ansvar för.
`479`-serien (CI-hygien-kartan) är ett NATURLIGT ANKARE för var
pnpm-beslutet dokumenteras — `479.1`s "aktuell karta över CI-besluten" är
rätt plats att länka in en framtida `ADR-13x` om pnpm, om beslutet blir
byt.

**CI-minutbudgeten (mål < 50 000/mån):** installationssteget är EN liten
del av en jobbs totala tid. Med 23 `setup-node`-anropsställen × en
uppskattad 15–20 sekunders varm-cache-besparing PER JOBB (§ 1:s mätning,
optimistiskt extrapolerad — `actions/cache`-restore är samma mekanism för
npm och pnpm, så vinsten är inte lika stor som en LOKAL varm-store-
jämförelse antyder) ger uppskattningsvis **1–3 fakturerade minuter mindre
per fullständig CI-körning** — en bråkdel av S126:s egna mål (≈192 → ≈94
fakturerade min/landning, huvudsakligen genom att sluta köra samma
testsvit flera gånger). **pnpm är inte en lösning på minutbudgeten** — det
är en marginell bonus ovanpå den, om den görs alls.

## 7. Noll-alternativet — npm workspaces, prövat på allvar

**Vad vi förlorar konkret genom att stanna på npm workspaces:**

- Ingen `catalog:`-mekanism — delade versioner mellan admin-appen och
  miranon.se måste synkas manuellt eller via ett tredjepartsverktyg
  (`syncpack` eller motsvarande, inte utrett i detta pass).
- Inget strikt `node_modules` — phantom-dependency-skyddet uteblir (mätt
  ofarligt IDAG, § 1, men förebyggande värde uteblir framåt).
- Inga default-på supply-chain-skydd MOTSVARANDE pnpm 11+ förrän vi
  uppgraderar till npm 12 SÄRSKILT (vilket är ett eget, mindre beslut,
  oberoende av pnpm-frågan — se nedan).
- Ingen `pnpm/setup`-cachningsfördel (§ 1:s mätta 6× varm-store-vinst) —
  men den vinsten är, som § 6 visar, marginell för vår faktiska
  minutbudget.

**Mellanläge, prövat:** "npm nu, pnpm senare" är EXAKT vad detta pass
rekommenderar (§ 8). Kostnaden att byta EFTER att npm workspaces införts
jämfört med FÖRE är **större, inte mindre** — ett `pnpm import` måste då
också hantera workspace-strukturen (flera `package.json`-filer i stället
för en), och varje `workspaces`-referens i CI-klassningen
(`ci.yml`s D0-glob, `verify-ci-parity.mjs`s path-mönster) måste läsas om
en gång till. **Det billigaste ordningsvalet är alltså:** gör
pnpm-beslutet FÖRE workspaces INFÖRS strukturellt (dvs. innan
`apps/`/`packages/`-katalogerna skapas för miranon.se) — men EFTER att
S126:s CI-arbete lugnat sig (§ 6). De två villkoren är förenliga: S126:s
kort rör inte workspace-strukturen alls, så ett kort fönster mellan
"464-serien landad" och "miranon.se:s första `apps/site/`-commit" är det
naturliga tillfället, om beslutet blir byt.

**Dom § 7:** att stanna på npm workspaces förlorar reella men MÅTTLIGA
saker. Ingen av förlusterna är akut eller blockerar miranon.se-bygget.

## 8. Rekommendation

**REKOMMENDATION (inte beslut): byt senare — sekvensera EFTER `464`-
serien, FÖRE miranon.se:s workspace-struktur skapas.** Inte "byt nu" och
inte "byt aldrig".

**Skäl, i prioritetsordning:**

1. **Nollrisk-fönster finns inte just nu.** 18 samtidiga worktrees, S126/
   S127 aktiva mitt i samma workflow-filer, en ADR-kodifierad
   supply-chain-process (`ADR-028`) som måste omtolkas snarare än flyttas.
2. **Branschläget stödjer pnpm starkt** (13/16, fem av dem våra egna
   uppströms-beroenden) — detta är INTE en fråga om pnpm är ett bra val i
   sig, utan om TIMINGEN är rätt. Den är det inte denna vecka.
3. **Den drivande motiveringen i bakgrunden — "varje worktree behöver
   node_modules, hur påverkar pnpms store det?" — visade sig vila på en
   premiss som redan är löst** (symlänkad `node_modules`,
   `bygg-agent.md` rad 63). Detta sänker bytets brådska väsentligt utan
   att sänka dess VÄRDE.
4. **CI-minutbudgeten (S126:s faktiska, mätta mål) påverkas marginellt**
   av ett pnpm-byte (§ 6) — det är inte ett sätt att nå < 50 000 min/mån
   fortare.

**Kostnadsuppskattning, arbetsenheter (grovt, inte en detaljerad plan):**

| Steg | Filer berörda | Uppskattade PR:er | Risk |
|---|---|---|---|
| Workflow-omskrivning (7 av 9 YAML-filer, 86 kommandorader, 23 setup-node-ställen) | 4 filer huvudsakligen | 1–2 PR:er (kan INTE delas upp säkert — en halvfärdig blandning npm/pnpm i CI är värre än ingendera) | Hög |
| `ADR-028`-omtolkning (supply-chain-process) | 1 ADR + ev. `audit-ci.jsonc` | 1 PR, egen granskning | Hög (skarpt bevisad process, sex incidenter bakom sig) |
| `.claude/settings.json` permission-synk | 1 fil | Kan åka med workflow-PR:en | Hög om missad (blockerar agenter) |
| Prosa (`CLAUDE.md`, `CONTRIBUTING.md`, ni.a policy-filer) | ~12 filer | 1 separat dokument-PR (D0-klassad, billig) | Låg |
| `vercel.json` + `packageManager`-fält + Vercel-projektinställning | 2 filer + Vercel UI | 1 PR + en manuell Vercel-verifiering (Marcus) | Medel-Hög (Vercel-fällan, § 4) |
| Skarp verifiering: en riktig `pnpm install` (inte `--ignore-scripts`) mot en test-branch, en riktig CI-körning, en riktig Vercel preview-deploy | — | Ingen egen PR, men en OBLIGATORISK skarpbevis-runda innan `main`-cutover | — |

**Golv kontra spekulation:** att pnpm ger strikt `node_modules` och
default-på `minimumReleaseAge` är GOLV (mätt, § 1). Att detta löser ett
AKUT problem i vårt repo är SPEKULATION (§ 1 visar noll phantom-deps
idag). Att branschen kör pnpm är GOLV (§ 2, mätt). Att TIMINGEN nu är
rätt är SPEKULATION — och den spekulationen väger emot ett byte just nu.

**Vad Marcus behöver besluta:**

1. Byt-senare (denna rekommendation) kontra byt-nu kontra byt-aldrig.
2. Om byt-senare: exakt vilket "fönster" (efter `464`-serien landad,
   före `apps/site/` skapas) — och om det fönstret ska bevakas som en
   tråd (`T`-nummer) eller ett kort.
3. Beslutet är sannolikt en egen ADR (svårt att återställa i KOHERENS,
   inte bara i kod — en halvgjord blandning av npm-CI och
   pnpm-supply-chain-process hade varit exakt den typen av överraskande,
   svårförklarade tillstånd `ADR-BAR`en är till för att förhindra). De
   delar som är svårast att återställa: `ADR-028`s omtolkade
   incident-process (skarpt bevisad mot sex verkliga fall) och
   `.ci-parity-policy.json`s härledda parserlogik om den byggs om för
   att FÖRSTÅ pnpm-kommandon specifikt i stället för att generiskt
   ignorera infra-steg (idag klarar den sig UTAN att förstå pnpm alls,
   se § 3 — en framtida "förbättring" som gör parsern pnpm-medveten vore
   en ny, svårreversibel koppling).

## 9. Vad jag inte kunde belägga

- **Om pnpms `allowBuilds`-blockering omfattar ROTPAKETETS egna
  lifecycle-scripts** (vårt `postinstall: git config core.hooksPath`)
  eller bara DEPENDENCIES. Jag höll mig till uppdragets
  `--ignore-scripts`-krav i torrkörningen och kunde därför inte
  observera det skarpt. Detta är den viktigaste enskilda luckan att
  stänga före ett beslut, eftersom `T121`s hook-skydd hänger på att
  raden faktiskt körs.
- **Vercels Corepack-sidas exakta 2026-sanning** — motsägelsen mellan
  `last_updated: 2026-08-28` och innehåll som citerar Node 16-dokumentation
  och kallar Corepack "experimental" kunde jag inte reda ut. Kräver en
  egen, riktad verifiering (en testdeploy) innan cutover.
- **Om `pnpm import` bevarar exakt upplösta transitiva versioner
  SHA-för-SHA** — pnpm.io:s egen `import`-sida ger ingen garanti i text,
  och jag hade bara indirekt belägg (samma 54 direktberoenden, samma
  paketantal) från min egen torrkörning.
- **Om `pnpm.overrides` automatiskt härleds ur npms `overrides`-fält vid
  `pnpm import`, eller måste skrivas för hand** — direkt relevant för
  `ADR-028`s fem kvarvarande overrides-poster.
- **En skarp (icke-`--ignore-scripts`) `pnpm install`-körning** — vad
  exakt `pnpm approve-builds` hade listat, och vad en riktig `pnpm audit`
  hade svarat mot vårt träd. Uppdraget begränsade mig medvetet till
  `--ignore-scripts`; detta är avsiktligt lämnat som nästa steg, inte en
  miss.
- **`supabase/functions/`s fullständiga isolering** — jag drog slutsatsen
  av titeln på `docs/research/task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md`
  utan att öppna filen; sakligt sannolikt rätt (Deno har ALDRIG läst
  `node_modules`) men inte verifierat i DETTA pass.
- **En kvalitetsgranskad branschandels-siffra** (§ 2) — websökningen gav
  bara lågkvalitativa sekundärkällor jag valde att inte citera.
- **npm 11.10.0s exakta `min-release-age`-default och npm 12s release-
  datum** direkt mot npmjs.com/Node.js release-noter — jag nådde bara
  sekundära nyhetsartiklar (Socket.dev, InfoQ) för dessa specifika
  detaljer, inte npm-projektets egen changelog.
- **Tidsvariansen i den andra `npm ci`-mätningen** (48,8 s, långsammare
  än den första på 23,1 s) — jag misstänker samtidig maskinlast (18
  worktrees) men mätte inte `loadavg` parallellt för att bekräfta det,
  vilket repots egen `metrics:flake`-disciplin annars kräver.

## Källförteckning

**Primärkällor, pnpm:**

- <https://pnpm.io/feature-comparison> (hämtad 2026-09-19)
- <https://pnpm.io/blog/releases/10.16> (hämtad 2026-09-19)
- <https://pnpm.io/blog/releases/11.0> (hämtad 2026-09-19)
- <https://pnpm.io/blog/releases/12.0> (hämtad 2026-09-19)
- <https://pnpm.io/settings/dependency-resolution> (hämtad 2026-09-19)
- <https://pnpm.io/settings/build> (hämtad 2026-09-19)
- <https://pnpm.io/catalogs> (hämtad 2026-09-19)
- <https://pnpm.io/cli/import> (hämtad 2026-09-19)
- <https://pnpm.io/continuous-integration> (hämtad 2026-09-19)
- <https://github.com/pnpm/action-setup> (README, hämtad 2026-09-19)

**Primärkällor, npm/Node/Vercel/GitHub:**

- <https://docs.npmjs.com/cli/v12/using-npm/config#ignore-scripts> (hämtad 2026-09-19)
- <https://docs.npmjs.com/generating-provenance-statements> (hämtad 2026-09-19)
- <https://vercel.com/docs/package-managers> (`last_updated: 2026-08-11`, hämtad 2026-09-19)
- <https://vercel.com/docs/builds/configure-a-build> (`last_updated: 2026-08-28`, hämtad 2026-09-19)
- <https://vercel.com/changelog/improved-support-for-pnpm-corepack-and-monorepos> (hämtad 2026-09-19)
- <https://github.com/actions/setup-node> (README, hämtad 2026-09-19)
- <https://github.com/IBM/audit-ci> (README, hämtad 2026-09-19)
- <https://github.blog/changelog/2025-02-04-dependabot-now-supports-pnpm-workspace-catalogs-ga/> (hämtad 2026-09-19)
- <https://github.com/dependabot/dependabot-core/issues/14824> (hämtad 2026-09-19)
- <https://github.com/mswjs/msw/discussions/2413> (hämtad 2026-09-19)

**Sekundärkällor (nyhetsbevakning av npm 12 / min-release-age, ej npm-projektets egen changelog):**

- <https://socket.dev/blog/npm-12> (hämtad 2026-09-19)
- <https://socket.dev/blog/pnpm-10-0-0-blocks-lifecycle-scripts-by-default> (hämtad 2026-09-19)
- <https://www.infoq.com/news/2026/08/npm-12-released/> (hämtad 2026-09-19)
- <https://socket.dev/blog/node-js-tsc-votes-to-stop-distributing-corepack> (hämtad 2026-09-19)
- <https://github.com/nodejs/nodejs.org/issues/7555> (hämtad 2026-09-19)

**Branschläge (repo-lockfiler, mätta direkt 2026-09-19 via `curl`/`gh api`):**

- `github.com/vercel/next.js`, `github.com/vitejs/vite`,
  `github.com/withastro/astro`, `github.com/TanStack/router`,
  `github.com/supabase/supabase`, `github.com/remix-run/react-router`,
  `github.com/shadcn-ui/ui`, `github.com/biomejs/biome`,
  `github.com/vercel/turborepo`, `github.com/pmndrs/zustand`,
  `github.com/radix-ui/primitives`, `github.com/vercel/ai`,
  `github.com/colinhacks/zod`, `github.com/microsoft/playwright`,
  `github.com/adobe/react-spectrum`, `github.com/getsentry/sentry-javascript`
  — rot-`package.json`/lockfil, HEAD-branch, hämtade 2026-09-19.

**Interna (detta repo):**

- [`docs/research/miranon-se-stack-och-repoform-2026-09-19.md`](miranon-se-stack-och-repoform-2026-09-19.md) § C
- `tasks/sessions/2026-09-19-session-128.md` Del 1–6
- `tasks/sessions/2026-09-17-session-126.md` Del 17–19 (`origin/main`)
- [`docs/research/ci-djupgranskning-2026-09-17/00-huvudrapport.md`](ci-djupgranskning-2026-09-17/00-huvudrapport.md)
- [`docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md`](ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md)
- [`docs/research/repo-privat-konsekvenser-2026-09-18.md`](repo-privat-konsekvenser-2026-09-18.md)
- `docs/decisions/ADR-028-supply-chain-incident-respons.md` (hela filen)
- `backlog/tasks/task-464*.md`, `task-479*.md`, `task-480*.md`
- `.github/workflows/ci.yml`, `ci-suite.yml`, `nightly.yml`, `visual-baselines.yml`, `review-backstopp-proof.yml`
- `.ci-parity-policy.json`, `scripts/verify-ci-parity.mjs`
- `package.json`, `package-lock.json`, `vercel.json`, `.nvmrc`
- `.claude/agents/bygg-agent.md`, `.claude/settings.json`
- **Egna mätningar:** `pnpm import`/`pnpm install --ignore-scripts` samt
  `npm ci --ignore-scripts` (2× vardera) i
  `/private/tmp/.../scratchpad/pnpm-torrkorning/` respektive
  `/private/tmp/.../scratchpad/npm-baseline/`, 2026-09-19; `git worktree
  list` (18 träffar); `du -sh node_modules` (huvudkatalog, 651 MB).
