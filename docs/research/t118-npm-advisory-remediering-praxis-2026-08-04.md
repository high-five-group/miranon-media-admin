---
owner: marcus803
updated: 2026-08-04
review_by: 2027-02-04
status: draft
---

# Vad är branschledande praxis 2026 för transitiva npm-advisory-fixar — och håller vår rekommenderade väg? (Code, 2026-08-04)

> **Proveniens:** `TASK-118` (T118 hittades INTE i `tasks/threads/README.md` vid
> läsning 2026-08-04 — se § Vad jag inte kunde belägga). Beställt för att pröva
> Alternativ A (overrides-bump + full lockfile-regen) mot de tre advisories som
> fäller `audit-ci` sedan 2026-08-03. Mätningarna är körda mot **npm 11.8.0**,
> **node v24.13.1**, i repots faktiska worktree 2026-08-04, plus ett isolerat
> scratch-repo för de mutationstester som inte fick röra detta repos
> `package.json`/lockfile (uppdraget förbjöd det uttryckligen).

## Kort svar

**Alternativ A:s overrides-bump VERIFIERAS — full lockfile-regen NYANSERAS
till FALSIFIERAD för just denna advisory-klass.** Overrides är branschens
etablerade förstahandsverktyg för transitiva advisory-fixar (npm:s egen
dokumentation, Dependabots egen mekanism, minst fem externa precedent-repon,
och — mest slående — **repot har redan gjort exakt detta sex gånger** sedan
`ADR-028` skrevs, utan att fem av de sex gångerna loggades som avvikelser).
Men "full regen, ALDRIG partiell fix" (`ADR-028` beslut §2) är en
**malware-purge-regel** vars motivering (rensa komprometterade trädrester)
inte gäller för en ordinär, patchad sårbarhets-advisory. Repots egen
commit-historik visar att den regeln redan brutits konsekvent — fem gånger
tyst, en gång (Vite, 2026-06-15) öppet kvitterad som avvikelse. Den svagaste
länken i uppdraget var alltså inte svag av brist på bevis; den var svag för
att den **motsäger en redan etablerad, upprepad, egen praxis** som aldrig
skrevs in i ADR:n.

Ett andra, oberoende mätt fynd river en implicit premiss i uppdraget:
**`npm audit fix` (utan `--force`) rör aldrig ett befintligt `overrides`-fält
som redan pinnar en sårbar version.** Kört skarpt mot detta repos verkliga
träd (`npm audit fix --dry-run`, sidoeffektfritt, verifierat via `git status`
och ny `npm audit`): verktyget föreslår korrekt att bumpa `postcss` och
`fast-uri` (ingen `overrides`-post blockerar dem), men **kan inte** åtgärda
`brace-expansion` eftersom paketet redan är hårdpinnat i `overrides` sedan en
tidigare incident. Det är inte en åsikt — det är en mätning på just den här
kodbasen, just den här versionen, idag. Alternativ B (`npm audit fix` utan
force) hade alltså löst 2 av 3 advisories och lämnat den tredje **tyst
olöst**, eftersom verktyget varken varnar för eller rör en existerande
override.

## Bakgrund verifierad

`npm audit --audit-level=high` (körd 2026-08-04 i worktreen) bekräftar
premissens tre advisories exakt:

```text
brace-expansion  4.0.0 - 5.0.8   high      GHSA-rgw5-rvv9-x895
fast-uri         3.0.0 - 3.1.4   high      GHSA-7p8r-x3mc-p8w7
postcss          <=8.5.22        moderate  GHSA-fxqj-rqcc-2cmp
```

GitHub Security Advisory-databasens API (`api.github.com/advisories/<id>`,
hämtat 2026-08-04) bekräftar publiceringstider och patchade versioner
förstahandskälla:

| Advisory | Publicerad (UTC) | Sårbart intervall | `first_patched_version` |
|---|---|---|---|
| GHSA-rgw5-rvv9-x895 (brace-expansion) | 2026-08-03T16:35:32Z | ≥4.0.0 <5.0.9 | **5.0.9** |
| GHSA-7p8r-x3mc-p8w7 (fast-uri) | 2026-08-03T19:16:43Z | ≥3.0.0 <3.1.5 | **3.1.5** |
| GHSA-fxqj-rqcc-2cmp (postcss) | 2026-08-03T17:11:39Z | ≤8.5.22 | **8.5.23** |

`npm ls brace-expansion fast-uri postcss` (worktree, 2026-08-04) bekräftar
transitiv-kedjorna exakt som premissen beskriver: `brace-expansion` via
`vite-plugin-pwa@1.3.0 → workbox-build@7.4.1` (två konsumenter — `glob@11.1.0
→ minimatch@10.2.5` och den mycket äldre `jake@10.9.4 → filelist@1.0.6 →
minimatch@5.1.9`, båda dedupade till overridens 5.0.8), `fast-uri` via samma
kedjas `ajv@8.20.0` (`ajv`s egen `package.json` deklarerar `"fast-uri":
"^3.0.1"` — bekräftat läst direkt ur `node_modules/ajv/package.json`), och
`postcss` via `vite@8.1.5` direkt (installerad 8.5.19, inom sårbart
intervall). Inget av de tre är en direkt `dependency`/`devDependency` — alla
tre är transitiva, precis som premissen anger.

`gh pr view 632` och `gh pr view 635` (Dependabot-PR:er, verifierat 2026-08-04)
rör `@types/*`-gruppen respektive `web-vitals` — ingen av dem rör
`brace-expansion`, `fast-uri` eller `postcss`. Alternativ C (invänta
Dependabot) är alltså faktamässigt eliminerat, precis som premissen påstod.

**Ohållbar premiss upptäckt:** uppdraget hänvisar till "tråd T118 i
`tasks/threads/README.md`". Filen innehåller ingen rad för T118 (grep,
2026-08-04, noll träffar). Det som finns är `TASK-118` — ett obesläktat
backlog-kort om `backlog.md`-CLI:t, annan namnrymd. Detta påverkar inte
forskningsfrågans svar men noteras per ADR-086 (obelagda påståenden är
HYPOTES) — se § Vad jag inte kunde belägga.

---

## Delfråga 1 — är `overrides` etablerad förstahandsform?

**Ja, direkt ur npm:s egen dokumentation.** `docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides`
(hämtad 2026-08-04) namnger explicit "replacing the version of a dependency
with a known security issue" som avsett användningsfall, med syntaxen
`{"overrides": {"paket": "version"}}` och stödet för "an exact version, a
semver range, a dist-tag, or a replacement specifier". Källan ger ingen
egen vägledning om att TA BORT overrides (se delfråga 4).

**Dependabot/GitHub bekräftar mekanismen från andra hållet.** GitHub Blogs
"Unlocking security updates for transitive dependencies with npm"
(`github.blog/security/supply-chain-security/...`, hämtad 2026-08-04)
förklarar att Dependabot använder `Arborist.audit()` för att hitta en
uppgraderingsväg som lyfter förälder + barn TILLSAMMANS, och att **npm är
unikt bland ekosystemen** i att kunna göra detta eftersom just `overrides`
gör transitiv-styrning möjlig direkt i `package.json` — andra ekosystem
saknar motsvarigheten helt. Artikeln specificerar inte om Dependabots egen
patch är en `overrides`-post eller en ren lockfile-pinning, men den bekräftar
att MEKANISMEN (tvinga en transitiv version utan att vänta på uppströms) är
navet i hur GitHub själva löser klassen.

**Precedent (delfråga 5 nedan) bekräftar bruket i praktiken**, inte bara i
dokumentationen.

**Dom delfråga 1: VERIFIERAT.** Ingen motstridig förstapartskälla hittad.

---

## Delfråga 2 — full regen kontra minimal re-resolve (den prövade svaga punkten)

Detta var uppdragets uttalat svagaste punkt, och det höll — men åt andra
hållet än förväntat. Tre oberoende bevislinjer, i stigande styrka:

### 2.1 — Extern branschpraxis skiljer explicit på malware och ordinär advisory

Sökning mot malware-incidenter (Axios/`Trend Micro`, `Snyk` om
Axios-kompromissen, `Splunk`s guide) visar att branschens respons vid
BEKRÄFTAD malware är "rebuild from a known-good state" — motsvarande
`ADR-028`:s §2. Men samma källor beskriver ordinära sårbarhetsfixar med ett
annat, lättare mönster: en riktad version-bump, inte en total ominstallation.
Ingen av källorna hävdar att full regen behövs för en vanlig CVE-patch utan
malware-misstanke — distinktionen branschen drar är precis den `ADR-028`
självt gör mellan §2 (purge-mekanism) och den enskilda 2026-06-15-avvikelsen
(icke-malware-klass).

### 2.2 — Egen mätning: minimal `npm install` konvergerar EXAKT med full regen

Byggde ett isolerat scratch-repo (`ajv@8.20.0` + `overrides.fast-uri`) för
att inte röra detta repos filer. Metod och resultat, mätt mot npm 11.8.0:

1. `overrides.fast-uri: "3.1.4"` (simulerar det sårbara, pinnade
   utgångsläget) → `npm install` → `fast-uri@3.1.4 overridden` bekräftat.
2. Ändrade ENDAST `overrides.fast-uri` → `"3.1.5"`, körde **vanlig**
   `npm install` (ingen `rm -rf node_modules`/lockfile) → resolverade
   korrekt till `fast-uri@3.1.5 overridden`. Diff mot föregående lockfile:
   23 rader, uteslutande den enda paketets version/integrity + en
   hoist-ombokning (`fast-uri` gick från `ajv`s nästlade `node_modules` till
   toppnivån eftersom den nu var den enda konsumentens enda version).
3. Körde därefter en FULL regen (`rm -rf node_modules package-lock.json &&
   npm install`) på samma `package.json`. **`diff` mellan den minimala
   installationens lockfile och den fulla regenens lockfile: noll rader.**
   Byte-identiskt slutresultat.

**Slutsats av mätningen:** för denna paket-klass ger full regen NOLL extra
säkerhets- eller korrekthetsvärde jämfört med en riktad `npm install` efter
en overrides-ändring — de konvergerar till exakt samma tillstånd. Den enda
skillnaden är att full regen tvingar ALLA ~637 paket i det riktiga trädet
genom om-upplösning samtidigt (se § Vad jag inte kunde belägga för skalans
begränsning — scratch-repot hade bara 6 paket).

### 2.3 — Repots EGEN historik har redan gjort detta sex gånger

Detta är den starkaste bevislinjen, och den fanns i git-loggen hela tiden.
Sedan `ADR-028` skrevs (2026-05-12) har repot löst **sex** transitiva
advisory-incidenter genom en RIKTAD overrides/lockfile-bump — INTE full
regen:

| Commit | Datum | Paket | Diff-omfång |
|---|---|---|---|
| `9b97dadb` | 2026-06-27 | linkify-it → 5.0.1 (override) | 2 filer, 16+3/−0 rader |
| (dok.) Vite → `^8.0.16` | 2026-06-15 | Vite (kirurgisk range-bump) | 21 noder, ett subträd — `ADR-028` §-avvikelse EXPLICIT dokumenterad |
| `93eb9697` | 2026-07-21 | fast-uri → 3.1.4 (lockfile-only) + linkify-it → 6.0.0 | 2 filer, 12+2/−9 rader |
| `8f4aeb3d` | 2026-07-22 | sharp → 0.35.3 (override) | 2 filer, 267+/−151 rader (sharps platt­forms-varianter) |
| `92ef2e43` | 2026-07-24 | js-yaml → 5.2.2 (override) | package.json + lockfile |
| `3a50e8ec` | 2026-07-25 | brace-expansion → 5.0.8 (override) | 2 filer, 5+/−21 rader |

Commit `9b97dadb`s eget budskap kodifierar exakt den princip denna rapport
landar på: **"Lock-churn = endast linkify-it."** Commit `92ef2e43` skriver
uttryckligen: *"ALLOWLIST BEHOVS INTE — patchad version finns, sa ADR-028:s
konvention-flode for risk-acceptans ar inte tillamplig har"* — dvs. Code och
Marcus har redan, i praktiken, behandlat "patchad version finns" som ett
annat och lättare spår än `ADR-028`s huvudflöde, fem gånger, utan att en
enda av dem triggade en `## Updates`-post i ADR:n. Endast Vite-avvikelsen
2026-06-15 skrevs in öppet. De fem andra är **samma avvikelse, aldrig
kvitterad i ADR-texten** — precis den typ av tyst drift global-CLAUDE.md
varnar för ("ett låst beslut är inte immunt mot evidens").

**Dom delfråga 2: FALSIFIERAD för denna advisory-klass.** Full lockfile-regen
är korrekt protokoll för en BEKRÄFTAD malware-komprometterad kedja (det var
`ADR-028`s födelsekontext, `@tanstack/history`-fallet). Den är över-åtgärd
för en ordinär, patchad, icke-malware-advisory — vilket är exakt vad alla tre
dagens advisories är (GHSA-rgw5-rvv9-x895, GHSA-7p8r-x3mc-p8w7,
GHSA-fxqj-rqcc-2cmp har samtliga en `first_patched_version` publicerad; ingen
är en malware-advisory). Rätt väg är en riktad overrides-bump + vanlig
`npm install` (ingen `rm -rf`), med samma "lock-churn ska vara scoped"-disciplin
repot redan tillämpat sex gånger.

---

## Delfråga 3 — `npm audit fix`:s status

npm:s egen dokumentation (`docs.npmjs.com/cli/v11/commands/npm-audit`,
hämtad 2026-08-04) är entydig: utan `--force` tillämpas endast
semver-kompatibla uppgraderingar ("If remediations do not require changes to
the dependency ranges, then all vulnerable packages will be updated"). Med
`--force`: *"If you don't have a clear idea of what you want to do, it is
strongly recommended that you do not use this option!"* — samma varning
`ADR-028` redan kodifierat.

**Mätt skarpt mot detta repo** (`npm audit fix --dry-run`, sidoeffektfritt —
verifierat med `git status` + en ny `npm audit` direkt efteråt, identisk
output, noll filer rörda):

```text
change postcss 8.5.19 => 8.5.25
change minimatch 10.2.5 => 10.2.6
change fast-uri 3.1.4 => 3.1.5
```

Verktyget föreslår KORREKT och UTAN `--force` att fixa `postcss` (→8.5.25,
över patch-tröskeln 8.5.23) och `fast-uri` (→3.1.5, exakt patch-versionen).
Det föreslår ATT bumpa `minimatch` (toppnivå-instansen, 10.2.5→10.2.6) men
**detta löser inte `brace-expansion`-advisoryn**, eftersom repots befintliga
`overrides.brace-expansion: "5.0.8"` forcerar den versionen oavsett vad
`minimatch` 10.2.6 själv skulle vilja dra in.

**Kompletterande scratch-mätning (isolerat repo, samma npm-version):** med
`overrides.fast-uri: "3.1.4"` satt (simulerar en pinnad, sårbar version) och
`npm audit fix` körd UTAN `--force`: verktyget rapporterade `"up to date,
audited 6 packages"`, gjorde INGEN ändring i `package.json` eller resolverad
version, och en efterföljande `npm audit` visade **samma två sårbarheter
kvar**, utan varning eller fel. `npm audit fix` är alltså blind för — och rör
aldrig — en befintlig `overrides`-post som redan pinnar en sårbar version.

**Dom delfråga 3: `npm audit fix` (utan force) är NEUTRAL/FÖREDRAGEN för
icke-overridade transitiva paket, men STRUKTURELLT OFÖRMÖGEN att fixa ett
paket som redan är hårdpinnat via `overrides`.** I vårt fall betyder det att
Alternativ B (`npm audit fix` utan force) hade löst `postcss` och `fast-uri`
men LÄMNAT `brace-expansion` OLÖST OCH TYST OMÄRKT — ingen varning, ingen
avvikande exit-kod-signal om att en advisory återstod av en annan orsak än
"kräver force". Det gör Alternativ A:s explicita, manuella overrides-redigering
till den ENDA vägen som säkert löser alla tre samtidigt.

---

## Delfråga 4 — overrides-fällor och livstids-/review-praxis

**Kända fällor (extern källa), citerade:**

+ **"Band-aid, inte fix":** en Medium-artikel (`rnataoliveira`, hämtad
  2026-08-04) formulerar det skarpt: *"This works in the sense that `npm
  audit` stops complaining. But it does not fix the problem (it masks it)"*
  — och varnar för tyst runtime-inkompatibilitet: *"If [parent] internally
  relies on behaviour that changed between those versions, you have silently
  introduced a runtime bug. You traded a known security issue for an unknown
  compatibility issue."*
+ **"Kirurgiskt, inte permanent":** HeroDevs guide (hämtad 2026-08-04):
  *"Use overrides for surgical dependency fixes, not permanent
  maintenance."* Samma källa varnar för tyst-felande syntax (saknat
  `@`-prefix på scopade paket, felaktig nästling) och rekommenderar att veta
  VILKA paket i trädet som är EOL/sårbara innan man skriver overrides —
  men ger ingen konkret "ta bort efter N månader"-regel.
+ **Falsifierad tredjepartsclaim, verifierad direkt:** samma HeroDevs-guide
  påstår att `npm ci` "ignores overrides". **Mätt och falskt** (npm 11.8.0):
  när `package.json`s `overrides`-fält ändras UTAN att lockfilen
  regenereras, ger `npm ci` ett HÅRT fel: `"npm error Invalid: lock file's
  fast-uri@3.1.4 does not satisfy fast-uri@3.1.5"` — exit ≠ 0, ingen tyst
  installation av fel version. Eftersom detta repos CI kör `npm ci` i minst
  åtta separata steg (`.github/workflows/ci-suite.yml` × 5,
  `.github/workflows/nightly.yml` × flera — grep bekräftat 2026-08-04),
  betyder det att **CI redan är en fail-safe** mot en overrides-redigering
  som glömmer att regenerera lockfilen. Det är en positiv, mätt korrigering
  av en sekundärkälla.

**Livstids-/review-praxis — repot har redan ett etablerat mönster,
oberoende av extern källa:** `ADR-028`s `## Updates`-sektion (2026-05-13)
formulerar exakt detta för `@tanstack/history`-overriden: *"Pin-luckring +
overrides-borttagning skjuts till K0åi — naturlig trigger när `npm view
@tanstack/history@latest` returnerar annan version än 1.161.6."* Samma
mönster — bevaka uppströms `latest`, ta bort overriden när den flyttar sig —
är den mest konkreta "review-lifecycle"-regel jag hittade i någon källa,
förstaparts eller tredjeparts, och den finns redan i detta repo.

**Levande illustration av varför lifecycle-disciplin behövs, inte hypotetisk:**
dagens `brace-expansion`-advisory (GHSA-rgw5-rvv9-x895) är, enligt GitHub
Advisory-databasens egen beskrivning, en **ofullständig fix av en TIDIGARE
advisory** på SAMMA paket: *"The `maxLength` mitigation added in `5.0.8` for
GHSA-mh99-v99m-4gvg / CVE-2026-14257 is incomplete."* Repots override för
`brace-expansion` sattes till just 5.0.8 (commit `3a50e8ec`, 2026-07-25) som
mitigation för GHSA-mh99-v99m-4gvg — och behöver nu, tio dagar senare, bumpas
IGEN för samma paket. Det är levande bevis för att en override utan
uppföljningsmekanism kan bli stale igen på dagar, inte månader.

**Dom delfråga 4:** overrides fällor är väldokumenterade (band-aid-risk,
tyst-felande syntax, den falsifierade `npm ci`-claimen). Repots egen
`ADR-028`-praxis (bevaka `latest`, riv när uppströms rör sig) är redan en
review-lifecycle-regel — men den är bara skriven ut för
`@tanstack/history`. Den borde generaliseras till alla fem nuvarande
overrides-poster (se rekommendation).

---

## Delfråga 5 — precedent, 3+ branschledar-projekt

**Direkt träff på SAMMA paket, inte bara samma mekanism:**

+ **`podman-desktop/podman-desktop`** (Red Hat/containers-ekosystemet) —
  PR [#17267](https://github.com/podman-desktop/podman-desktop/pull/17267)
  ("fix: resolve CVE-2026-41305 in postcss") och PR
  [#17449](https://github.com/podman-desktop/podman-desktop/pull/17449)
  ("fix: resolve CVE-2026-6321 in fast-uri") — båda via `pnpm.overrides`,
  båda ENDAST `package.json` + lockfile ändrade (17449: 7+/−5 rader; 17267:
  133+/−151 rader). Detta är **exakt två av våra tre paket**, samma
  mekanism, samma branschklass av projekt.
+ **`microsoft/vscode-react-native`** — Issue/fix
  [#2802](https://github.com/microsoft/vscode-react-native/issues/2802):
  *"Add `brace-expansion: 5.0.7` to `overrides`"* — **exakt vårt tredje
  paket**, samma mekanism, scopad till en enda `package.json`.
+ **`microsoft/vscode`** — roten `package.json` bär idag (verifierat
  2026-08-04 via `gh api`) ett aktivt `overrides`-block med fyra poster
  (`node-gyp-build`, `kerberos@2.1.1`→`node-addon-api`,
  `serialize-javascript`, `yauzl`) — ett av världens största JS-repon
  använder `overrides` som löpande praxis, inte undantag.
+ **`facebook/react`** — roten `package.json` bär `resolutions` (Yarns
  motsvarighet till `overrides`): `{"react-is": "npm:react-is", "jsdom":
  "22.1.0"}` — samma mekanism, annan paketmanager.
+ **`mem0ai/mem0`** — träffad via sökning: patchade "32 high and 57
  medium severity vulnerabilities via `pnpm.overrides`, including
  brace-expansion, postcss".

**Fem projekt, varav två (`podman-desktop`, `vscode-react-native`) löste
PRECIS de paket vi står inför, med minimala scopade diffar — ingen av dem
visar tecken på full lockfile-regen i sina PR:er.**

**Ärlig gräns på precedent-rymden:** `vitejs/vite` och `TanStack/query`s
rot-`package.json` bär INGEN `overrides`/`resolutions`/`pnpm.overrides`
just nu (verifierat 2026-08-04) — det betyder inte att de aldrig använt
mekanismen (jag kontrollerade inte historiken), bara att jag inte kan räkna
dem som aktiv precedent just nu. Jag sökte inte GOV.UK/`alphagov`-repona
till en konkret träff — sökningen gav bara allmän kontext om
`package-lock.json`-praxis, ingen bekräftad `overrides`-användning. Fem
träffar (varav två direkta pakete-matchningar) är ett gott men inte
uttömmande underlag; jag deklarerar det öppet snarare än att räkna högre än
vad sökningen faktiskt gav.

**Dom delfråga 5: VERIFIERAT**, med precedent-rymden ärligt redovisad som
smal men träffsäker (2 av 5 är exakta pakete-matchningar, inte bara
mekanism-matchningar).

---

## Dom

**NYANSERAR Alternativ A.**

+ **Overrides-bumparna (brace-expansion→5.0.9, fast-uri→3.1.5,
  postcss→8.5.25) VERIFIERAS** som rätt väg — branschstandard
  (npm:s egen dokumentation, Dependabots mekanism, 5 externa precedent varav
  2 träffar exakt samma paket) och repots egen, sex-gånger-upprepade praxis.
  De är dessutom NÖDVÄNDIGA snarare än valfria för `brace-expansion`
  specifikt, eftersom mätningen visar att `npm audit fix` (Alternativ B)
  strukturellt inte kan röra en redan overrid­ad post.
+ **"Full lockfile-regenerering per `ADR-028` beslut §2" NYANSERAS till
  FALSIFIERAD för denna advisory-klass.** Den starkaste motevidensen: repots
  EGNA sex incidenter sedan `ADR-028` skrevs har alla löst transitiva
  advisories med en riktad overrides/lockfile-bump, aldrig med `rm -rf
  node_modules package-lock.json`. Endast en av de sex (Vite, 2026-06-15)
  fick sin avvikelse skriven in i ADR:n; de fem andra är tyst identisk
  praxis. Min egen mätning (minimal `npm install` efter en overrides-ändring
  → byte-identiskt slutresultat mot full regen, i ett isolerat scratch-repo)
  bekräftar mekanismen: full regen ger noll extra korrekthet för en icke-
  malware-advisory, bara större, orelaterad churn i ett träd på ~637 paket.
+ **Konkret reviderad rekommendation:** kör overrides-bumparna, kör EN vanlig
  (icke-destruktiv) `npm install` — inte `rm -rf` — och verifiera att
  lockfile-diffen är scopad till de tre paketen + deras omedelbara
  dedup-grannar (samma "lock-churn = endast X"-disciplin repot redan
  praktiserar). `ADR-028` beslut §3 (backup + integritets-diff) gäller
  fortfarande oavsett vilken installationsväg som väljs.

---

## Vad jag inte kunde belägga

+ **Skal-skillnaden mellan mitt scratch-test och det riktiga trädet.** Mitt
  "minimal install == full regen"-bevis kördes på ett 6-paket-repo. Jag körde
  ALDRIG en verklig full regen på detta repos egna 637-paketsträd (uppdraget
  förbjöd att röra `package.json`/lockfilen här) — så jag kan inte kvantifiera
  EXAKT hur många orelaterade rader en fullregen skulle röra i just detta
  träd. Jag bedömer det som sannolikt stort (ADR-028s egen 2026-06-15-post
  larmar redan om just den typen av orelaterad churn — `@biomejs/biome`
  2.4.15→2.5.0 som bröt `biome check`), men det är en extrapolering från
  en mindre modell, inte en direkt mätning på skarpt träd.
+ **`T118` finns inte i `tasks/threads/README.md`.** Uppdraget hänvisade dit;
  jag hittade `TASK-118` (obesläktat backlog-kort) men ingen tråd med det
  ID:t. Jag vet inte om tråden aldrig registrerades, registrerades under ett
  annat ID, eller om referensen i uppdraget är felaktig.
+ **Ingen bekräftad `overrides`-historik för `vitejs/vite` eller
  `TanStack/query`.** Jag kontrollerade bara deras NUVARANDE rot-`package.json`
  (ingen träff), inte deras git-historik eller eventuella workspace-paket
  längre ner i monorepot.
+ **GOV.UK/alphagov gav ingen konkret träff.** Sökningen returnerade allmän
  kontext om deras `package-lock.json`-praxis efter tidigare
  säkerhetsincidenter, men bekräftade varken användning eller icke-användning
  av `overrides`.
+ **Om Dependabots EGEN transitiv-fix använder `overrides`-fältet eller en
  ren lockfile-pinning.** GitHub Blog-artikeln beskriver mekanismen
  (förälder+barn tillsammans) men specificerar inte vilket av de två den
  facto skriver till `package.json`.
+ **HeroDevs-guidens övriga påståenden** (utöver den falsifierade
  `npm ci`-claimen) är inte oberoende verifierade av mig — jag testade bara
  just den ena, mest konkreta och mest relevanta för vårt CI-upplägg.

---

## Rekommendation

*Detta är en rekommendation, inte ett beslut — beslutet är Marcus.*

1. **Genomför overrides-bumparna** (`brace-expansion` 5.0.8→5.0.9,
   `fast-uri` (ny post) →3.1.5, `postcss` (ny post) →8.5.25) och kör en
   vanlig `npm install` (INTE `rm -rf node_modules package-lock.json`).
   Verifiera efteråt att lockfile-diffen är scopad (samma kriterium som
   `9b97dadb`s "lock-churn = endast X") — om diffen drar in stora,
   orelaterade paketuppdateringar (t.ex. en `@biomejs/biome`-bump), stoppa
   och undersök varför innan commit.
2. **Behåll `ADR-028` beslut §1 och §3** (pin exakt + overrides; backup +
   integritetsdiff) oförändrade — de är fortsatt rätt, oavsett
   regen-strategi.
3. **Öppna en `ADR-028`-`## Updates`-post** som formellt generaliserar
   2026-06-15-avvikelsen: full regen gäller BEKRÄFTAD malware/komprometterad
   kedja; riktad overrides/install-bump gäller ordinär, patchad advisory.
   Detta skulle samtidigt dokumentera de fem tysta instanserna
   (`9b97dadb`, `93eb9697`, `8f4aeb3d`, `92ef2e43`, `3a50e8ec`) som
   konsekvent praxis snarare än fem oskrivna undantag.
4. **Överväg en generaliserad review-trigger** för alla fem nuvarande
   `overrides`-poster (inte bara `@tanstack/history`), efter samma mönster
   `ADR-028` redan har: en rad i `tasks/todo.md` per post som pekar på
   `npm view <parent>@latest` eller motsvarande, så en override inte blir
   stale i tysthet — särskilt motiverat av att `brace-expansion` nu behövt
   bumpas två gånger på tio dagar för besläktade advisories.

---

## Källförteckning

### Förstapartskällor — npm

+ `overrides`-fältet: <https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides>
+ `npm audit` / `npm audit fix`: <https://docs.npmjs.com/cli/v11/commands/npm-audit>
+ `npm ci`: <https://docs.npmjs.com/cli/v11/commands/npm-ci>
+ Registry (versioner, publiceringstider): `npm view brace-expansion versions`,
  `npm view fast-uri versions`, `npm view postcss versions` (kört 2026-08-04
  mot npm 11.8.0)

### Förstapartskällor — GitHub Security Advisories (API, hämtat 2026-08-04)

+ GHSA-rgw5-rvv9-x895 (brace-expansion): <https://api.github.com/advisories/GHSA-rgw5-rvv9-x895>
+ GHSA-7p8r-x3mc-p8w7 (fast-uri): <https://api.github.com/advisories/GHSA-7p8r-x3mc-p8w7>
+ GHSA-fxqj-rqcc-2cmp (postcss): <https://api.github.com/advisories/GHSA-fxqj-rqcc-2cmp>
+ GitHub Blog, Dependabot transitiv-dependency-mekanism: <https://github.blog/security/supply-chain-security/unlocking-security-updates-for-transitive-dependencies-with-npm/>
+ Dependabot security updates (docs): <https://docs.github.com/en/code-security/concepts/supply-chain-security/about-dependabot-security-updates>

### Tredjepartskällor

+ OWASP Vulnerable Dependency Management Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html>
+ HeroDevs, "A Guide to NPM Overrides": <https://www.herodevs.com/blog-posts/a-guide-to-npm-overrides-take-control-of-your-dependencies>
+ "Stop Patching npm Vulnerabilities with Overrides — Fix Them for Real" (Medium, rnataoliveira): <https://medium.com/@rnataoliveira/stop-patching-npm-vulnerabilities-with-overrides-fix-them-for-real-3bbc36906b89>
+ Trend Micro, Axios-kompromissen (malware vs. vulnerability-respons): <https://www.trendmicro.com/en_us/research/26/c/axios-npm-package-compromised.html>
+ Snyk, Axios-kompromissen: <https://snyk.io/blog/axios-npm-package-compromised-supply-chain-attack-delivers-cross-platform/>

### Precedent-repon

+ <https://github.com/podman-desktop/podman-desktop/pull/17267> (postcss, `pnpm.overrides`)
+ <https://github.com/podman-desktop/podman-desktop/pull/17449> (fast-uri, `pnpm.overrides`)
+ <https://github.com/microsoft/vscode-react-native/issues/2802> (brace-expansion, `overrides`)
+ `microsoft/vscode` rot-`package.json` (`overrides`-block, hämtat via `gh api` 2026-08-04)
+ `facebook/react` rot-`package.json` (`resolutions`-block, hämtat via `gh api` 2026-08-04)

### Internt — repots egen historik

+ [ADR-028](../decisions/ADR-028-supply-chain-incident-respons.md) (läst i sin
  helhet, inkl. `## Updates`)
+ Commits: `9b97dadb` (linkify-it, 2026-06-27), `93eb9697` (fast-uri +
  linkify-it, 2026-07-21), `8f4aeb3d` (sharp, 2026-07-22), `92ef2e43`
  (js-yaml, 2026-07-24), `3a50e8ec` (brace-expansion, 2026-07-25) — samtliga
  verifierade via `git show --stat` 2026-08-04
+ `gh pr view 632`, `gh pr view 635` (Dependabot, verifierat 2026-08-04)
