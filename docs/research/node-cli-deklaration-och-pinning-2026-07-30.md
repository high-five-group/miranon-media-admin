---
owner: marcus803
updated: 2026-08-05
review_by: 2027-02-05
status: draft
---

# Hur deklareras och pinnas ett Node-CLI som en CI-grind beror på? (Code, 2026-07-30)

> **Proveniens:** avgränsat research-pass 2026-07-30, beställt ur tråd `T107`
> ([`tasks/threads/README.md`](../../tasks/threads/README.md)). Frågan är öppen på
> Marcus uttryckliga instruktion — *"Det är inte mitt beslut. Det är ett beslut vi
> ska ta efter research-runda och utforskning"* (2026-07-29). Detta pass levererar
> underlaget, inte beslutet. Ingen kod, inget kort, ingen ADR rörd.
>
> **Mätningarna** kördes mot `npm 11.8.0` / `node v24.13.1` på macOS (darwin x64),
> mot `backlog.md@1.47.1` och mot repots träd vid `8f8d97e`. Väggtidsmätningar bär
> sin loadavg. Där något är bedömning och inte mätning står det utskrivet.
>
> **Uppdatering (2026-08-05, tråd `T123` — omverifiering mot 1.48.0):** repot
> bumpade `backlog.md` 1.47.1 → 1.48.0 i PR `#634` (`5c9b4946`) efter en mätning
> av `task <id> --plain`-formatets bakåtkompatibilitet — inte av de tre
> egenskaper detta pass byggde sin rekommendation på. De omverifierades nu
> skarpt mot **1.48.0**, mot npm-registret direkt (`npm view
> backlog.md@1.48.0 --json`, en riktig `npm install backlog.md@1.48.0
> --save-exact` i ett scratch-projekt, `npm audit signatures` i den
> installationen, samt registrets attesterings-endpoint hämtad och dess
> DSSE-payload avkodad manuellt):
>
> - **SLSA-provenance — identisk form, ny referens, inget försämrat.**
>   Attesteringen (`https://registry.npmjs.org/-/npm/v1/attestations/backlog.md@1.48.0`)
>   avkodas till `{"ref":"refs/tags/v1.48.0","repository":"https://github.com/MrLesk/Backlog.md","path":".github/workflows/release.yml"}`
>   — samma repo, samma release-workflow, taggen har bara följt med versionen.
>   `npm audit signatures` i den riktiga installationen gav exakt samma svar som
>   §1 mätte för 1.47.1: *"2 packages have verified registry signatures / 2
>   packages have verified attestations"*.
> - **Scripts-deklarationen — OFÖRÄNDRAD, ingen röd flagga.** Fortfarande
>   exakt ett script, `postuninstall` (`node postuninstall.cjs`); inget nytt
>   `preinstall`/`postinstall` har tillkommit. Skriptets innehåll inspekterades
>   den här gången även i klartext (§1 nöjde sig med det empiriska "kördes
>   inte"-testet): det spawnar `npm/bun uninstall -g` mot de sex
>   plattformspaketen och sväljer varje fel tyst — en ofarlig städfunktion, inte
>   en exfiltrationsyta.
> - **Beroendeträdet — OFÖRÄNDRAT.** Fortfarande noll `dependencies`; samma sex
>   `optionalDependencies` (`backlog.md-{linux,darwin,windows}-{x64,arm64}`,
>   nu på `1.48.0`), var och en fortsatt utan egna beroenden.
>
> **Bonus, utanför de tre kraven men bekräftande:** repot bär nu FAKTISKT
> `backlog.md@1.48.0` som pinnad `devDependency` (samma landning, `#634`), så
> `npx audit-ci --config audit-ci.jsonc` kunde köras skarpt mot repots egen
> `package-lock.json` i stället för mot den simulerade kopian §3 byggde på.
> Utfall: `Passed npm security audit`, 0 på alla fem nivåer
> (info/low/moderate/high/critical), 759 paket totalt.
>
> **Vad som INTE omprövades, och varför det är rätt avgränsning:** §2:s
> precedent-katalog, §4:s femte-former och §5:s väggtidsmätningar
> (`npx` mot direkt binär) är resonemang och mätningar mot **verktygsklassen**,
> inte mot den enskilda artefakten — en versionsbump av `backlog.md` ändrar
> dem inte, och de omprövades därför inte.
>
> **Nytt observerat, medvetet inte utrett vidare:** registrets
> `dist-tags.latest` är i skrivande stund `1.49.3`, inte `1.48.0` — paketet har
> alltså gått vidare förbi den version repot pinnar. Det ligger utanför detta
> pass, av samma skäl originalpasset gav för att inte utreda vad som ändrats
> *till* 1.47.1: repot pinnar medvetet den version som faktiskt är i bruk, och
> nästa omverifiering hör ihop med nästa medvetna bump — inte med varje ny
> release uppströms.
>
> **Ärlighetskrav:** npm-registret var nåbart hela passet och samtliga tre
> punkter mättes skarpt — ingen punkt i denna uppdatering är obelagd eller
> gissad. Rådata (registrets JSON-svar, den avkodade attesterings-payloaden,
> installationsloggen, `audit-ci`-utskriften) ligger i sessionens scratchpad
> under filnamn prefixade `T123-` och är inte incheckad i repot.

---

## Kort svar

**Branschen checksummar inte npm-tarballer för hand — för npm *är* låsfilens
`integrity`-fält checksumme-mekanismen, och den är hårt grindande.** Mönstret är
entydigt i allt material jag hittade: binärer får `curl` + `sha256sum -c`,
Node-CLI:er får låsfilen. Ingen av de nio oberoende precedenten gör tvärtom.
OpenSSF säger det normativt: *"In CI, only run npm commands that treat the
lockfile as read-only"* — och `npx` samt `npm install -g` står uttryckligen på
listan över kommandon som **inte** gör det.

**Men passet avtäckte något allvarligare än formvalet, och det gäller oavsett
vilken form som väljs.** Grindens default är
`BACKLOG_CMD="${BACKLOG_CMD:-npx backlog}"`
([`scripts/check-backlog-closure.sh`](../../scripts/check-backlog-closure.sh) rad 125).
Paketet heter `backlog.md`. Binären heter `backlog`. Det finns ett **annat,
orelaterat npm-paket som heter just `backlog`** — och npx löser upp det bara
namnet som ett *paketnamn*.

Mätt i isolerad miljö (tom npm-cache, tomt npm-prefix, ingen global installation
i `PATH`):

```text
npm error npx canceled due to missing packages and no YES option: ["backlog@1.4.56"]
```

`backlog@1.4.56` beskriver sig som *"Orchestrator for AI coding agents — claims,
isolated worktrees, parallel runs"*, deklarerar `bin: {"backlog": "dist/bin.js"}`
och saknar provenance-attestering. Det är alltså inte ett *opinnat* `backlog.md`
en färsk CI-runner skulle hämta — det är **ett helt annat paket, av en annan
författare**. Och npx installerar det utan att fråga när stdin inte är en TTY,
vilket den aldrig är i CI (mätt: `npm warn exec The following package was not
found and will be installed`, exitkod 0).

`T107` formulerade risken som *"ett opinnat paket per anrop eller falla"*. Den
formuleringen är för mild. Rätt formulering är **namnkollision med tyst
exekvering av främmande kod**.

**Rangordnad rekommendation** (utvecklad i egen sektion sist): **(a) pinnad
`devDependency`** är förstahandsvalet — den kostar noll i `audit-ci` (mätt),
ger äkta integritetspinning (mätt hard-fail), ger SLSA-provenance som är
*starkare* än husets egen SHA256-form, löser namnkollisionen genom sin
konstruktion, och **gör grinden ~39 % snabbare** (mätt A/B). Form (c) är
attraktiv på kostnad men löser bara grinden, inte det bredare problem `T107`
faktiskt namnger.

---

## 1. Vad ger npm faktiskt för integritetsgarantier?

### `integrity` i låsfilen — och att den verkligen fäller

npms egen dokumentation definierar fältet som *"A `sha512` or `sha1` Standard
Subresource Integrity string for the artifact that was unpacked in this
location"*, och slår fast att låsfilen *"describes the exact tree that was
generated, such that subsequent installs are able to generate identical trees"*
samt *"is intended to be committed into source repositories"*.

Dokumentation är inte bevis. **Jag prövade den.** Med ett manipulerat
`integrity`-fält i låsfilen:

```text
npm error code EINTEGRITY
npm error sha512-AAAA… integrity checksum failed when using sha512:
wanted sha512-AAAA… but got sha512-vBueCu9…
```

Exitkod `1`, och `node_modules` skapades aldrig. Garantin är alltså inte
rådgivande — den är en hård grind, exakt som `sha256sum -c` i husets
shellcheck-steg.

`npm ci` skiljer sig från `npm install` på de punkter som gör den till
CI-kommandot: låsfilen **måste** finnas, avvikelse mot `package.json` ger
*"exit with an error, instead of updating the package lock"*, befintlig
`node_modules` tas bort först, och *"It will never write to `package.json` or any
of the package-locks: installs are essentially frozen"*.

### Provenance — starkare än husets egen form

`backlog.md@1.47.1` publiceras **med SLSA-provenance**. Mätt:

```text
$ npm audit signatures
2 packages have verified registry signatures
2 packages have verified attestations
```

Attesteringen avkodad ur registrets DSSE-envelope pekar på källan:

```json
{"ref":"refs/tags/v1.47.1",
 "repository":"https://github.com/MrLesk/Backlog.md",
 "path":".github/workflows/release.yml"}
```

Detta är värt att stanna vid, eftersom `T107` antar motsatsen (*"npm ger ingen
tarball-SHA256 på samma sätt som en GitHub-release gör"*). Jämför vad de två
formerna faktiskt bevisar:

| | Husets `shellcheck`/`actionlint`-form | npm-låsfil + provenance |
|---|---|---|
| Vad hashen binder | tarballen till **vad vi själva såg** när vi beräknade den | tarballen till **byggkörningen som producerade den** |
| Vem beräknade den | vi, downstream | leverantörens CI, signerad av Sigstore, loggad i publik transparenslogg |
| Bevisar "oförändrad sedan vi tittade" | ja | ja |
| Bevisar "byggd ur den källkod den påstår" | **nej** | ja |

Repots egna kommentarer är ärliga om detta: *"SHA256 nedan är
downstream-beräknad mot fast nedladdad release-asset"*
([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) rad 794–796). Det är
inte en svaghet i husets form — det är det bästa som går att göra när
leverantören inte publicerar attesteringar. Men det betyder att npm-vägen här
ger **mer**, inte mindre. Att beskriva ett byte till `devDependency` som en
sänkning av ribban vore fel.

### Install-scripts: ytan är noll

`backlog.md@1.47.1` deklarerar exakt ett script — `postuninstall`. npms
dokumentation slår fast: *"While npm v6 had `uninstall` lifecycle scripts, npm v7
does not."* Verifierat empiriskt: `npm uninstall backlog.md` under npm 11 körde
det inte (ingen utdata från skriptet).

De sex plattformspaketen deklarerar **inga scripts alls och inga beroenden alls**
— de är rena binärbärare.

Slutsats: paketet har **noll exekverbara install-hooks**. `--ignore-scripts`
(default `false`; *"If true, npm does not run scripts specified in package.json
files"*) är därför gratis att sätta här — den ändrar ingenting men kostar
ingenting, och håller formen konsekvent om beroendeträdet växer.

---

## 2. Precedent — nio oberoende projekt, och en varning om räkningen

Precedent-jakten kördes som eget delpass mot faktiska `.github/workflows`-filer
via `gh api` och råfil-hämtning. **Räknings-varning först, eftersom den är
avgörande för hur siffran ska läsas:** en kodsökning ger ~30 repon med
`npm install -g @anthropic-ai/claude-code@<exakt version>`. Det är **inte 30
precedent** — det är ett designbeslut i `github/gh-aw`:s kompilator, replikerat
30 gånger. Det räknas som **ett**.

Oberoende precedent, faktiskt räknat: **nio**.

### Det entydiga mönstret: asymmetri

I varje blandat repo gäller samma regel — **binärer checksummas, Node-CLI:er
aldrig**:

- **elastic/kibana**, `.github/workflows/flaky-fix-verifier.lock.yml` — samma
  fil, samma jobb. Rad 549/558: `BK_SHA256` + `sha256sum -c -` för Buildkite-CLI:t.
  Rad 606 och 1612: `npm install -g @anthropic-ai/claude-code@2.1.165` — exakt
  version, ingen checksumma. *(Verifierat av mig direkt mot filen.)*
- **grafana/grafana**, `.github/workflows/actionlint.yml` — samma actionlint-form
  som huset, med en detalj värd att kopiera: kommentaren dokumenterar **hur
  checksumman togs fram** (`curl … checksums.txt | grep linux_amd64`). Node-sidan
  har noll globala installationer — allt går via låsfil och
  `yarn install --immutable --check-cache` med `YARN_ENABLE_HARDENED_MODE: 1`.
- **DataDog/datadog-ci**, **pomerium/pomerium**, **mitmproxy/mitmproxy** — alla
  tre: `sha256sum -c` för binärer, `npm ci` / `npx playwright` för Node.
- **`github/gh-aw`** — den enda källan med *utskriven* rationale för asymmetrin.
  Copilot-CLI:t hämtas med checksummeverifiering mot officiell `SHA256SUMS.txt`;
  Claude Code går via npm. Skälet står i koden: Copilot publiceras som
  plattformstarball med publicerade summor, Claude Code publiceras bara som
  npm-paket. **Formen följer vad leverantören faktiskt levererar.** Samma repo
  kodar dessutom `--ignore-scripts` som default med motiveringen *"malicious
  packages can use install hooks to exfiltrate secrets or corrupt the runner
  environment"*.

### Den normativa källan

OpenSSF:s npm-guide klassar kommandona explicit — verifierat av mig direkt mot
källan:

> Read-only: `npm ci`, `npm install-ci-test`
>
> **Inte** read-only: `npm install`, `npm i`, **`npm install -g`**, `npm update`,
> `npm install-test`, `npm pkg set`/`delete`, **`npm exec`, `npx`**, `npm set-script`
>
> *"In CI, only run npm commands that treat the lockfile as read-only."*

Det är den meningen som avgör delfrågan. Form (b) — pinnad global install — och
`npx`-varianterna står båda på fel sida av den.

### Precedent för `npx --package=<pkg>@<exakt version>`

Formen finns skarpt, och exakt i vårt läge (paketnamn ≠ binärnamn):

- **microsoft/vscode**, `.github/workflows/pr.yml` rad 259 *(verifierat direkt)*:
  `npx --package=@vscode/telemetry-extractor@1.20.4 --yes vscode-telemetry-extractor -s .`
  Samma form i `telemetry.yml` med en annan pinnad version.
- **twbs/bootstrap** använder formen men med `@latest` — medvetet opinnat, syftet
  är att testa mot senaste. **Inte** precedent för pinning.
- **npm/cli** kör sina egna CI-verktyg ur låsfilen med `npx --offline` — vilket
  gör npx deterministisk: saknas paketet lokalt **failar steget i stället för att
  hämta något**.

### Ärliga negativ

- **Vendoring: ingen precedent hittad alls.** Inget repo i materialet checkar in
  ett Node-CLI i trädet för CI-bruk.
- **nodejs/node pinnar inte sina Node-CLI:er** — `npm install -g @node-core/utils`
  utan version i fem workflows.
- **sigstore/sigstore-js pinnar inte heller** — `npm install -g @sigstore/cli`,
  `npx @tufjs/cli` utan version. Att projektet är sigstores eget gör det värt att
  notera.
- **sigstore/cosign och ossf/scorecard** fungerar inte som precedent — noll
  `curl`-nedladdningar i workflows och inget Node-CLI.
- **kubernetes/kubernetes** har ingen `.github/workflows`-katalog (kör Prow).
- **tailscale/tailscale checksummar inte** — `tool/node`, `tool/yarn`, `tool/helm`
  laddas via `curl -f -L` mot en version och verifieras bara med
  `--version`-jämförelse. Ett säkerhetsmoget bolag som medvetet nöjer sig med
  version-pin.

**Precedent-rymden är alltså tjock för asymmetrin och tunn för symmetrisk
stringens.** Ingen gör det `T107` implicit oroar sig för att vi måste göra
(checksummeverifiera npm-tarballer för hand). Det behövs inte, eftersom
mekanismen redan finns.

---

## 3. Vad kostar form (a) i `audit-ci`-termer?

**Mätt: noll.**

Beroendeträdet är osedvanligt litet. `backlog.md@1.47.1` har **inga
`dependencies` alls** — bara sex `optionalDependencies`, en per plattform, som
var och en är ett rent binärpaket utan egna beroenden.

Kört mot repots egen `audit-ci.jsonc` (`high: true`, tom allowlist) och mot de
strängare nivåerna:

| Nivå | Utfall |
|---|---|
| repots config (`high`) | `Passed npm security audit` — 0 high, 0 critical |
| `--moderate` (nattens nivå) | `Passed npm security audit` |
| `--low` (hårdast) | `Passed npm security audit` |

Integrationen mot repots **faktiska** manifest prövades också (kopior i
scratchpad, repot orört): `npm install --package-lock-only` gick igenom på 2,5 s
med `found 0 vulnerabilities`, och låsfilsdiffen är kirurgisk:

```text
paket före: 753  efter: 760
TILLAGDA (7): backlog.md + 6 plattformsvarianter
BORTTAGNA (0)
```

Noll transitiva tillskott. Ingen konflikt med de 130 optional-paket repot redan
bär.

### Den verkliga kostnaden är storleken, inte sårbarhetsytan

Plattformsbinären är **105 MB uppackad / 39 MB som tarball** — en Bun-kompilerad
standalone-binär. Det är den enda genuina kostnaden i form (a):

- `node_modules` växer från 507 MB med ~105 MB → **+21 %**
- Repot kör `npm ci` i **11 jobb** över sina workflows
- Mätt marginalkostnad per `npm ci` med varm cache: **~1,6–1,8 s**
- Grovt: ~19 s adderat per full CI-runda, plus ~39 MB i Actions-cachen

**Bedömning, inte mätning:** det är en reell men hanterbar kostnad. Den
kan elimineras helt med ett separat verktygs-manifest (se femte formerna), till
priset av en andra låsfil att underhålla. `--omit=optional` är **inte** en väg —
repot har 130 optional-paket och skulle tappa sina esbuild/rollup-binärer.

---

## 4. Finns en femte form?

Fem kandidater prövades. Två faller på primärkälla, en saknar precedent helt, två
är reella.

**Corepack — faller.** Node/corepacks egen dokumentation: *"Permitted values for
the package manager are `yarn`, `npm`, and `pnpm`."* Den hanterar
paket*hanterare*, inte godtyckliga CLI:er. Dessutom: *"Corepack is distributed
with Node.js from version 14.19.0 up to (but not including) 25.0.0"* — den är
utbrytt ur Node 25+. Dubbelt diskvalificerad.

**Vendoring — faller.** Ingen precedent hittad i något repo. Och för just detta
verktyg vore det absurt: en 105 MB binär per plattform i git.

**Container-steg — obelagt.** Jag undersökte inte formen på djupet och har inget
underlag att rangordna den på. Se § Vad jag inte kunde belägga.

**`npx --package=backlog.md@1.47.1 --yes backlog` — reell.** Har tung precedent
(vscode) och löser namnkollisionen genom att skilja paketnamn från binärnamn.
Men: OpenSSF placerar `npx` bland de icke-read-only-kommandona, den ger ingen
låsfil-integritet, och **kostnaden är mätt avskräckande** — 0,92 s per anrop varm
cache mot 0,24 s för direkt binär. Vid grindens 170 anrop är det ~116 s adderat.

**`npx --offline` — reell, som komplement.** npm/cli:s egen form. Gör npx
deterministisk: den hämtar aldrig, den failar. I kombination med form (a) är den
ett bälte till hängslet — men den ersätter inte deklarationen.

**Bonus utanför frågan: `min-release-age`.** Två oberoende källor (`fleetdm/fleet`
i `.npmrc`, `github/gh-aw` som `NPM_CONFIG_MIN_RELEASE_AGE`) vägrar installera
paketversioner yngre än ett tidsfönster. fleetdms egen motivering: *"Guards
against supply-chain attacks where malicious versions get yanked within hours of
publication."* Detta täcker ett hål som **varken version-pin eller låsfil
täcker**. Registrerat som oväntat fynd, inte som rekommendation här.

---

## 5. Körkostnaden — och ett fynd `T107` inte förutsåg

`T107` bokför 170 CLI-anrop och 154–165 s väggtid vid loadavg 3,8–5,1. Jag mätte
om det interfolierat (`A,B,A,B` — repots egen mätdisciplin, aldrig blockad), med
loadavg per körning:

| Arm | Form | Iter 1 | Iter 2 | Medel | loadavg |
|---|---|---|---|---|---|
| **A** | `npx backlog` (nuvarande) | 196,4 s | 207,2 s | **201,8 s** | 4,06 / 11,30 |
| **B** | direkt binär | 121,0 s | 123,7 s | **122,3 s** | 7,30 / 6,67 |

**B är ~79 s snabbare — en minskning på ~39 %.** Armarna överlappar inte
(långsammaste B = 123,7 s < snabbaste A = 196,4 s), och load-ordningen arbetar
*mot* slutsatsen: A:s snabbaste körning skedde vid den lägsta lasten av alla
fyra. Skattningen är alltså konservativ.

Per-anrops-overhead, fem körningar per form:

| Form | Median | × 170 anrop |
|---|---|---|
| `npx --package=…@1.47.1 --yes` | 0,92 s | ~156 s |
| `npx backlog` (nuvarande) | 0,666 s | ~113 s |
| direkt binär (`node_modules/.bin`) | 0,24 s | ~41 s |
| global binär | 0,235 s | ~40 s |

**Varför "konservativ" och inte bara "snabbare":** om B hade vunnit därför att B
råkade köra vid lägre last vore effekten ett artefakt av mätfönstret. Det motsatta
gäller här. A:s **snabbaste** körning (196,4 s) låg vid den **lägsta** lasten av
alla fyra (4,06), och B:s båda körningar låg vid högre eller jämförbar last
(7,30 och 6,67). Lastordningen gynnar alltså A. Att B ändå vinner med ~79 s
betyder att den sanna skillnaden rimligen är minst så stor — inte mindre.

**Läs ut n:** n=2 per arm på grind-mätningen. Separationen är stor och
lastordningen konservativ, men två körningar per arm är två körningar per arm.

**Talen är lokala, och lasten hör till mätningen.** Maskinen körde upp till sju
parallella agenter under passet, vilket är varför loadavg står i varje rad i
stället för att sammanfattas bort — en väggtid utan sin last är inte
återanvändbar. `T107`:s ursprungliga tal (154–165 s vid loadavg 3,8–5,1) är också
lokala, och mina A-tal ligger högre än dess intervall vid högre last, vilket är
konsistent. Ingen CI-mätning finns i någondera fallet; överföring till
ubuntu-runner är antagande, inte fynd.

### Vad form (c) skulle kosta

Som kostnadssond — **inte** en reimplementation av grinden — extraherade jag
samma fält (`status`, AC-bockar) ur alla 173 kort med ett portabelt awk-enkelpass:

```text
kort: 173  invariant-1-kandidater: 1
väggtid: 0,147 s
```

Kandidat-räkningen stämmer med den tregrenade sonden (också 1). **0,15 s mot
122–202 s** — tre storleksordningar. Om CI-kostnad vore enda kriteriet vore form
(c) inte ens en diskussion.

---

## 6. Bär filerna det grinden behöver? (form (c):s faktiska förutsättning)

Ja — och mer än `T107` antog. Inventerat mot alla 173 kort:

| Fält | Täckning | Bär |
|---|---|---|
| `status`, `labels`, `id` | 173/173 | invariant 1–3, etikett-undantaget |
| `parent_task_id` | 76/173 | **förälder/barn-relationen** |
| `updated_date` | 143/173 | **karens-fönstret** |
| `<!-- AC:BEGIN/END -->` | 135/173 | AC-bockarna |
| `<!-- DOD:BEGIN/END -->` | 163/173 | DoD-bockarna |

Det korrigerar en punkt i grindens egen rationale. Skriptet förkastar
*"härled förälder/barn ur ID-mönstret `TASK-N.M`"* med motiveringen att
numreringen är gles — helt riktigt. Men det var fel alternativ att förkasta: den
verkliga fil-vägen är `parent_task_id` i frontmatter, som är auktoritativ och
kräver ingen gissning. Relationen finns i filen.

**Doktrinärt:** `CLAUDE.md` säger att kort *"läses/ändras ENDAST via
backlog-CLI:t"*. `L226` [UNIVERSAL] namnger samtidigt *"mall-/DoD-nivåns
semantiska grind"* som en av den verktygsägda ytans **riktiga** grindar. En
read-only grind som parsar filer är alltså inte självklart i konflikt med regeln
— men prövningen är Marcus, inte min. Jag noterar bara att `L226` ger form (c)
doktrinärt stöd, vilket `T107` redan förutsåg.

**Motargumentet mot form (c) är inte doktrinärt utan strukturellt:** formatet är
verktygsägt. En parser mot ett format vi inte äger driftar tyst vid en
versionsbump — och tyst drift i en grind är precis den felklass repot lagt mest
arbete på att stänga.

---

## 7. Karens-frågan

Instruktionen var: pekar researchen mot en form som gör CI-körning enkel, väger
karens-frågan tyngre. **Det gör den, och den gör det.**

Form (a) gör CI-wiringen både billig (~19 s installationskostnad) och snabbare
än i dag (~39 % kortare grindkörning). Därmed försvinner det kostnadsargument som
annars hade kunnat motivera att låta grinden förbli lokal — och karens-frågan
blir skarp i samma andetag.

Mekaniskt är fönstret gångbart i **båda** formerna: `updated_date` finns i
frontmatter (143/173) och CLI:t exponerar `Updated:`. Två saker måste dock
avgöras och är inte avgjorda av detta pass:

1. **De 30 korten utan `updated_date`.** De har aldrig redigerats efter skapandet.
   Fallback till `created_date` är det uppenbara valet men är ett designbeslut,
   inte ett fynd.
2. **Fönstrets längd.** Helt obelagt av mig. Det bör härledas ur hur länge en
   agent-våg faktiskt lämnar kort i tillståndet *alla AC bockade + öppet status* —
   en mätning som inte finns.

---

## Dom

1. **Namnkollisionen är passets viktigaste fynd och är severbar från formvalet.**
   `npx backlog` som default är inte "opinnat" — det är en tyst
   fel-paket-exekvering i varje färsk miljö. Den bör åtgärdas oavsett vilken form
   som väljs, och den gör form (d) — *acceptera lokal-bara* — aktivt farlig
   snarare än bara svag: den lämnar landminan kvar i skriptets default.

2. **För npm är låsfilen checksumme-mekanismen.** Frågans premiss — att en
   `devDependency` vore en uppmjukning jämfört med husets SHA-pinning — håller
   inte. Låsfilens `integrity` fäller hårt (mätt), och provenance-attesteringen
   bevisar dessutom något husets downstream-beräknade SHA256 **inte** kan bevisa:
   att artefakten byggdes ur den källa den påstår.

3. **Asymmetrin är branschens svar, inte en inkonsekvens.** Nio oberoende projekt,
   noll motexempel: binärer checksummas för hand, Node-CLI:er går via låsfilen.
   `github/gh-aw` formulerar principen — formen följer vad leverantören levererar.

4. **Form (c) löser grinden men inte problemet.** `T107` slår själv fast att
   *"konsekvensen är bredare än en grind"* — `/to-prd`, `/to-issues`, `/do-work`
   och varje AC-bockning i varje bygg-agents leverans vilar på samma odeklarerade
   verktyg. En filläsande grind lämnar hela den ytan orörd. Det är det avgörande
   argumentet mot (c) som **primär** väg, och det är oberoende av dess
   kostnadsfördel.

---

## Vad jag inte kunde belägga

- **Ingen CI-mätning existerar.** Alla väggtider är lokala, macOS, under
  konkurrerande last — upp till sju parallella agenter på maskinen under passet,
  plus passets egna mätkörningar. Därför bär varje mätrad sin loadavg. Överföring
  till ubuntu-runner är antagande, inte fynd.
- **n=2 per arm** på grind-A/B:t. Separationen är stor och lastordningen
  konservativ (A vann lasten, B vann ändå), men det är två körningar.
- **Container-steg som femte form är outrett.** Jag prövade det inte och har
  ingen precedent att rangordna det på. Att det saknas i mitt material betyder
  inte att det saknas i branschen.
- **Jag kunde inte konstruera en helt färsk miljö på första försöket.** npm/npx
  lägger själv tillbaka den globala prefix-binären i `PATH`, vilket förorenade två
  tidiga test (och ett tredje förorenades av min egen `_npx`-cache). Kollisionen
  är belagd först efter att både cache och prefix isolerats — de tidigare
  körningarna ska inte läsas som bekräftelse.
- **Att `backlog@1.4.56` faktiskt skulle köras** är bevisat på tre led
  (npx namnger paketet i felet; paketet deklarerar `bin: backlog`; npx
  auto-installerar i icke-TTY, mätt med ett ofarligt paket) — men jag
  **exekverade aldrig** den främmande binären. Det sista ledet är alltså
  slutledning, inte observation. Medvetet val.
- **Karens-fönstrets längd** är helt obelagd. Ingen mätning finns av hur länge en
  våg lämnar kort i det fällande tillståndet.
- **Kostnaden för ett separat verktygs-manifest** är oprövad — jag hittade ingen
  precedent för formen och mätte den inte.
- **`backlog.md@1.48.0`** var `latest` i registret vid publiceringen av detta
  pass. Jag undersökte då inte vad som ändrats sedan `1.47.1`, och
  rekommendationen pinnade medvetet den version som faktiskt var i bruk.
  **Löst 2026-08-05** (`T123`) för de tre egenskaper som bär rekommendationen
  — se uppdateringsblockquoten direkt under proveniens-styckets rubrik.
  Registret har sedan dess gått vidare till `1.49.3`; det gapet är INTE
  utrett (se uppdateringsblockquoten § "Nytt observerat").

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut.** Marcus äger valet; passet
levererar underlaget.

### Först, och oberoende av formvalet

**Ta bort `npx backlog` som default i
[`scripts/check-backlog-closure.sh`](../../scripts/check-backlog-closure.sh).**
Oavsett vilken form som väljs bör defaulten aldrig kunna lösa upp till ett
främmande paket. Detta är severbart, litet, och det enda i passet jag skulle
kalla brådskande.

### Rangordning

**1. Form (a) — pinnad `devDependency`, med `BACKLOG_CMD` pekad på
`node_modules/.bin/backlog`.**

Skälen, i fallande styrka:

- **Löser namnkollisionen strukturellt** — en lokal bin kan inte förväxlas med ett
  registerpaket.
- **Ger äkta integritetspinning** (mätt hard-fail) plus provenance (mätt) —
  starkare än husets nuvarande form, inte svagare.
- **Kostar noll i `audit-ci`** på alla tre nivåer, med noll transitiva tillskott
  (mätt mot repots faktiska manifest).
- **Gör grinden ~39 % snabbare** (mätt) — formvalet är en *förbättring* av
  körkostnaden, inte en avvägning mot den.
- **Löser hela `T107`:s yta**, inte bara grinden: `/to-prd`, `/to-issues`,
  `/do-work` och varje agents AC-bockning får ett deklarerat verktyg.
- **Dominerande precedent och normativt stöd** (OpenSSF).

Kostnaden att acceptera: +105 MB i `node_modules`, ~19 s per CI-runda. Om den
bedöms för hög är **separat verktygs-manifest** förfiningen — men den saknar
precedent i mitt material och bör då prövas som eget val, inte antas.

Komplement värda att överväga i samma andetag: `--ignore-scripts` (gratis här,
konsekvent om trädet växer) och `min-release-age` (täcker ett hål ingen av
formerna täcker).

**2. Form (c) — grinden läser filerna.** Genuint attraktiv: tre
storleksordningar billigare, ingen dependency, all data finns (inklusive
`parent_task_id` och `updated_date`), och `L226` ger doktrinärt stöd. Faller till
andraplats på två punkter: den lämnar `T107`:s bredare yta olöst, och den skapar
en parser mot ett verktygsägt format som kan drifta tyst. **Bäst som komplement
till (a)** — inte som ersättning.

**3. `npx --package=backlog.md@1.47.1 --yes`** som fallback om (a) förkastas.
Löser kollisionen, har tung precedent (vscode), men kostar ~156 s per grindkörning
och står på fel sida av OpenSSF:s CI-regel.

**4. Form (b) — pinnad global install.** Fungerar, har precedent (kibana), men
ger ingen integritetspinning och strider mot den normativa CI-regeln. Hjälper
inte heller lokala eller agent-miljöer.

**5. Form (d) — acceptera lokal-bara.** Avrådes. Utöver `T107`:s eget argument
(vilar på omdöme, ~9 %) lämnar den namnkollisionen kvar i skriptets default.

### Karens

Väljs (a), (b), (c) eller `npx`-fallbacken bör karensen avgöras i samma
beslutsomgång — formvalet gör CI-wiringen både billig och snabbare, vilket tar
bort skälet att skjuta upp den. Mekaniken är klar i båda formerna
(`updated_date`); det som saknas är fönstrets längd och hanteringen av de 30
korten utan fältet. **Ingen av dessa två är avgjord av detta pass.**

---

## Källförteckning

### Primärkällor — npm och Node

- package-lock.json — <https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json>
- npm ci — <https://docs.npmjs.com/cli/v11/commands/npm-ci>
- npm audit / `audit signatures` — <https://docs.npmjs.com/cli/v11/commands/npm-audit>
- Generating provenance statements — <https://docs.npmjs.com/generating-provenance-statements>
- npm config (`ignore-scripts`, `omit`) — <https://docs.npmjs.com/cli/v11/using-npm/config>
- npm scripts (lifecycle; npm v7 saknar uninstall-hooks) — <https://docs.npmjs.com/cli/v11/using-npm/scripts>
- npx — <https://docs.npmjs.com/cli/v11/commands/npx>
- Corepack — <https://github.com/nodejs/corepack#readme>

### Normativ källa

- OpenSSF, npm Best Practices — <https://github.com/ossf/package-manager-best-practices/blob/main/published/npm.md>

### Paketet och dess attestering

- `backlog.md` på npm — <https://www.npmjs.com/package/backlog.md>
- Källa bakom attesteringen — <https://github.com/MrLesk/Backlog.md>
- Attestering (SLSA provenance v1, 1.47.1 — passets ursprungsmätning) — <https://registry.npmjs.org/-/npm/v1/attestations/backlog.md@1.47.1>
- Attestering (SLSA provenance v1, 1.48.0 — omverifierad `T123` 2026-08-05) — <https://registry.npmjs.org/-/npm/v1/attestations/backlog.md@1.48.0>
- Det kolliderande paketet — <https://www.npmjs.com/package/backlog>

### Precedent — verifierade workflow-filer

- elastic/kibana — <https://github.com/elastic/kibana/blob/main/.github/workflows/flaky-fix-verifier.lock.yml>
- microsoft/vscode — <https://github.com/microsoft/vscode/blob/main/.github/workflows/pr.yml>
- grafana/grafana — <https://github.com/grafana/grafana/blob/main/.github/workflows/actionlint.yml>
- `github/gh-aw` — <https://github.com/github/gh-aw/blob/main/pkg/workflow/nodejs.go>
- decentraland/marketplace (`npm audit signatures` som CI-steg) — <https://github.com/decentraland/marketplace/blob/master/.github/workflows/audit.yml>
- npm/cli (`npx --offline`) — <https://github.com/npm/cli/blob/latest/.github/workflows/pull-request.yml>
- twbs/bootstrap (formen, opinnad) — <https://github.com/twbs/bootstrap/blob/main/.github/workflows/node-sass.yml>
- fleetdm/fleet (`min-release-age`) — <https://github.com/fleetdm/fleet/blob/main/.npmrc>
- pomerium/pomerium — <https://github.com/pomerium/pomerium/blob/main/.github/workflows/acceptance.yaml>

### Internt

- Tråd `T107` — [`tasks/threads/README.md`](../../tasks/threads/README.md)
- Grinden — [`scripts/check-backlog-closure.sh`](../../scripts/check-backlog-closure.sh)
- Policy — [`.backlog-closure-policy.conf`](../../.backlog-closure-policy.conf)
- Husets pinnings-form — [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- `audit-ci`-config — [`audit-ci.jsonc`](../../audit-ci.jsonc)
- `L226`, `L328` — [`tasks/lessons.md`](../../tasks/lessons.md)
- [ADR-033](../decisions/ADR-033-shellcheck-strict-grindvakt.md), [ADR-029](../decisions/ADR-029-ci-architektur-changed-files-pattern.md)
