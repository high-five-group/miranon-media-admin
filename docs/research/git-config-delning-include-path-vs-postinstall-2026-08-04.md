---
owner: marcus803
updated: 2026-08-04
review_by: 2027-02-04
status: stable
---

# Bör vi dela `.git/config`-värden via `include.path` mot en versionshanterad fil? (Code, 2026-08-04)

> **Proveniens:** avgränsat research-pass 2026-08-04, beställt efter `T121`
> (`core.hooksPath` uppmätt absolut-pinnad, rättad samma dag i commit
> `ed99fe0d`). Frågan Marcus ställde: *"Varför är inte vår `.git/config`
> versionshanterad? Det måste vi väl ha. Alla branschledare har väl det?"* —
> premissen prövas kort, men huvudfrågan är vad branschledare gör i stället
> och om `include.path` mot en versionshanterad fil är motiverat för OSS. Ren
> research: ingen kod, ingen config och inget kort ändrat i detta pass.

## Kort svar

**NEJ.** Behåll nuvarande form (`postinstall` + relativt `core.hooksPath` +
`T121`-vakten i `.githooks/pre-commit`). `include.path` mot en
versionshanterad fil löser inte det faktiska felläget vi hade (drift EFTER
korrekt uppsättning), lägger till ett bootstrap-steg vi redan har på ett
annat sätt, och breddar attackytan från "kör vid commit" till "kör vid nästan
varje git-kommando". Branschens dominerande mönster för exakt vårt fall
(dela `core.hooksPath` mellan alla som klonar) är pakethanterar-livscykel-
skriptet som anropar `git config` direkt — inte en versionshanterad
config-fil — och det mönstret är källkods-verifierat i Huskys egen
implementation, inte bara sekundär dokumentation.

**Oväntat fynd som väger tungt i domen:** vid mätning under detta pass
(2026-08-04, ca 20:56 CEST) stod `core.hooksPath` **ÅTER absolut**
(`/Users/marcus/Repon/miranon-media-admin/.githooks`) — cirka tio minuter
efter att fix-commit `ed99fe0d` (20:46:51) påstod att värdet var "rättat...
verifierat i huvudkatalogen och i en verklig worktree". Se § Oväntat fynd.
Det är inte en invändning mot rekommendationen — det är extra stöd för den:
vilken distributionsmekanism vi än väljer (postinstall ELLER `include.path`)
skyddar den **inte** mot att något skriver över värdet igen efteråt, eftersom
`include.path` bara ger ett förval som ett direkt lokalt `git config`-anrop
alltid kan skugga. Den enda mekanism som faktiskt fångar just detta är en
körtids-vakt — och den finns redan.

## Delfråga 1: Håller premissen — är `.git/config` verkligen aldrig versionshanterad?

Ja. Git-scm:s egen referens för repository-layouten säger om filen rakt av:

> "Repository specific configuration file." — och att den ignoreras till
> förmån för `$GIT_COMMON_DIR/config` när den variabeln är satt.
> Källa: [gitrepository-layout(5)](https://git-scm.com/docs/gitrepository-layout)

`.git/`-katalogen i sin helhet är gitits egen metadata-yta, inte
arbetsträdets innehåll — den spåras aldrig av git själv, och innehåller per
definition maskin-/klon-specifika värden (fjärr-URL:er, `user.email`,
worktree-registrets absoluta paths — allt synligt i vårt eget `.git/config`,
se § Vår situation). Premissen "alla branschledare versionshanterar
`.git/config`" är därmed falsk redan i sin grundformulering: ingen gör det,
för det går inte att göra på det sättet filen är designad. Frågan
branschledare faktiskt löser är en annan: **hur säkerställer man att
repo-specifika värden ÄNDÅ blir konsistenta för alla som klonar**, trots att
själva filen inte kan checkas in. Det är den frågan resten av passet svarar
på.

## Delfråga 2: Vad säger `git-config(1)` om `include.path` / `includeIf` — kan en inkluderad fil vara versionshanterad?

Källa: [git-config(1)](https://git-scm.com/docs/git-config), verifierad mot
Documentation/config.adoc på `git/git`s `master`
([Documentation/config/core.adoc](https://raw.githubusercontent.com/git/git/master/Documentation/config/core.adoc),
[githooks.adoc](https://raw.githubusercontent.com/git/git/master/Documentation/githooks.adoc)).

- **Mekaniken:** *"You can include a config file from another by setting the
  special `include.path` (or `includeIf.*.path`) variable... The contents of
  the included file are inserted immediately, as if they had been found at
  the location of the include directive."* Ja — den inkluderade filen kan
  ligga i arbetsträdet och därmed vara versionshanterad. Git bryr sig inte om
  filens ursprung, bara om att den går att läsa på den angivna sökvägen.
- **Relativ path-upplösning:** *"If the value of the variable is a relative
  path, the path is considered to be relative to the configuration file in
  which the include directive was found."* — dvs relativt `.git/config`
  själv, inte arbetsträdets rot. En rad som `path = ../.gitconfig-shared` i
  `.git/config` pekar alltså på arbetsträdets rot (eftersom `.git/config`
  ligger en nivå ned i `.git/`).
- **Precedens vid konflikt:** *"The files are read in the order given above,
  with last value found taking precedence over values read earlier."* Detta
  är den avgörande raden för hela avvägningen (se § Dom): en inkluderad fil
  ger ett **förval**, inte ett låst värde — en explicit rad i `.git/config`
  själv (satt av ett direkt `git config`-anrop, av misstag eller med avsikt)
  vinner alltid över det inkluderade värdet, eftersom `git config <key>
  <value>` skriver till den lokala repo-configen, inte till den inkluderade
  filen.
- **`hasconfig:remote.*.url`-villkoret har en uttrycklig spärr:** *"Files
  included by this option (directly or indirectly) are not allowed to
  contain remote URLs."* — ett konkret exempel på att Git-projektet själv
  medvetet begränsar vad en villkorligt inkluderad fil får sätta, i alla fall
  för just detta villkor. Ingen motsvarande generell spärr finns för
  `include.path` rakt av — den kan sätta VILKEN nyckel som helst, inklusive
  `core.fsmonitor`, `alias.*`, `credential.helper`.

## Delfråga 3: `core.hooksPath` — exakt semantik, och varför `T121` hände

Källa: [Documentation/config/core.adoc](https://raw.githubusercontent.com/git/git/master/Documentation/config/core.adoc)
och [githooks(5)](https://raw.githubusercontent.com/git/git/master/Documentation/githooks.adoc)
(båda `git/git` `master`, hämtade 2026-08-04).

> *"The path can be either absolute or relative. A relative path is taken as
> relative to the directory where the hooks are run (see the DESCRIPTION
> section of githooks[5])."*

Och `githooks(5)` DESCRIPTION:

> *"Before Git invokes a hook, it changes its working directory to either
> `$GIT_DIR` in a bare repository or **the root of the working tree** in a
> non-bare repository."*

Det här är den exakta mekaniken bakom `T121`: en RELATIV `core.hooksPath`
löses upp mot **den aktuella worktreens egen rot** — varje worktree kör
alltså sin egen `.githooks/`-kopia. En ABSOLUT `core.hooksPath` pekar alltid
på samma katalog oavsett vilken worktree kommandot körs ifrån. Kompletterat
av [git-worktree(1)](https://git-scm.com/docs/git-worktree): *"By default,
the repository `config` file is shared across all worktrees"* — så
`core.hooksPath` som VÄRDE är identiskt synligt i alla worktrees (det finns
bara en `.git/config`/`$GIT_COMMON_DIR/config`), men vad den relativa STRÄNGEN
`.githooks` **löses till** skiljer sig per worktree eftersom "roten" den är
relativ mot skiljer sig. Detta är precis vad `tasks/threads/README.md` rad
164 (`T121`) och fix-commit `ed99fe0d` (`git log`, denna worktree) beskriver
och mätte empiriskt, och min läsning av förstapartskällan bekräftar
mekanismen ordagrant.

## Delfråga 4: Branschmönstret — core.hooksPath vs Husky vs pre-commit vs lefthook, 2026

**Husky (v9+), källkods-verifierad direkt ur `typicode/husky`s `main`-gren
(inte bara sekundär dokumentation):**

`index.js` (kärnan bakom `npx husky` / `prepare`-skriptet):

```js
let { status: s, stderr: e } = c.spawnSync('git', ['config', 'core.hooksPath', `${d}/_`])
```

där `d` default är `'.husky'` — alltså **exakt samma mönster som vårt
`postinstall`**: ett paket-livscykel-skript (`prepare`, körs vid `npm
install`) som anropar `git config core.hooksPath <RELATIV path>` direkt.
Ingen versionshanterad `.gitconfig`-fil, inget `include.path`. `bin.js`
bekräftar att `init` skriver `prepare: 'husky'` in i `package.json`.
Källa: [typicode/husky/index.js](https://raw.githubusercontent.com/typicode/husky/main/index.js),
[bin.js](https://raw.githubusercontent.com/typicode/husky/main/bin.js), hämtade
2026-08-04 mot `main`. Husky är enligt sökresultat den mest använda
git-hooks-lösningen i JS-ekosystemet (~5M veckonedladdningar) och bytte i v9
just till `core.hooksPath` som mekanism (bort från sin äldre `.git/hooks`-
symlink-approach) — sekundärkälla:
[itenium.be](https://itenium.be/blog/dev-setup/git-hooks-with-husky-v9/),
[pkgpulse.com](https://www.pkgpulse.com/guides/husky-vs-lefthook-vs-lint-staged-git-hooks-nodejs-2026).

**pre-commit (framework.com), källkods-verifierad:**

`pre_commit/commands/install_uninstall.py` skriver hook-skript **direkt in i
`.git/hooks/<typ>`** (inte via `core.hooksPath`) och **vägrar uttryckligen**
samverka med `core.hooksPath`:

```python
if git_dir is None and git.has_core_hookpaths_set():
    logger.error('Cowardly refusing to install hooks with `core.hooksPath` set.')
    return 1
```

Bootstrap sker via ett separat, dokumenterat steg (`pre-commit install`,
körs en gång per klon) — inte via en versionshanterad `.git/config`-fil.
Källa: [pre-commit/pre-commit, install_uninstall.py](https://raw.githubusercontent.com/pre-commit/pre-commit/main/pre_commit/commands/install_uninstall.py),
hämtad 2026-08-04.

**Lefthook** följer samma tredje mönster som pre-commit: skriver hook-filer
direkt i `.git/hooks/` som anropar `lefthook`-binären; dokumentationen
flaggar uttryckligen konflikt om `core.hooksPath` redan är satt av något
annat verktyg. Källa: [lefthook/docs/install.md](https://github.com/evilmartians/lefthook/blob/master/docs/install.md),
[GitHub-issue #1248](https://github.com/evilmartians/lefthook/issues/1248) (obelagt djup, sekundärkälla).

**Slutsats för delfråga 4:** tre etablerade verktyg, tre mekanismer — men
**ingen av dem** distribuerar delad config via en versionshanterad
`include.path`-fil. Husky sätter `core.hooksPath` direkt via ett
livscykel-skript (vårt nuvarande mönster). pre-commit och lefthook kringgår
`core.hooksPath` helt och skriver istället direkt i `.git/hooks/` via ett
eget bootstrap-kommando. `core.hooksPath` satt via `postinstall`/`prepare`
**är** det etablerade, källkods-belagda branschmönstret för precis vårt
användningsfall — inte ett provisorium vi bör ersätta.

## Delfråga 5: Monorepo-precedent — Next.js, Babel, Rust, Kubernetes, Chromium

| Projekt | Mönster | Källa |
|---|---|---|
| **Next.js** (`vercel/next.js`) | `"prepare": "husky"` + separat `"postinstall": "node scripts/git-configure.mjs && node scripts/install-native.mjs"`. `git-configure.mjs` kör `git config index.skipHash false` — ett EGET litet skript för EN egen config-nyckel, samma form som vårt `postinstall`, inte en delad fil. | [raw package.json](https://raw.githubusercontent.com/vercel/next.js/canary/package.json), [git-configure.mjs](https://raw.githubusercontent.com/vercel/next.js/canary/scripts/git-configure.mjs), hämtade 2026-08-04 |
| **Babel** (`babel/babel`) | `"postinstall": "node scripts/postinstall.ts"` + Husky 9.0.11 + lint-staged. Samma tvåspårsmönster som Next.js. | [raw package.json](https://raw.githubusercontent.com/babel/babel/main/package.json), hämtad 2026-08-04 |
| **Rust** (`rust-lang/rust`) | `./x setup` frågar interaktivt om att installera en pre-push-hook genom att **symlinka** en versionshanterad `src/etc/pre-push.sh` in i `.git/hooks/pre-push`. Explicit opt-in-steg, ingen `core.hooksPath`, ingen `include.path`. | [rustc-dev-guide, Suggested workflows](https://rustc-dev-guide.rust-lang.org/building/suggested.html) (sekundär, ej källkods-verifierad i detta pass) |
| **Chromium / depot_tools** | Presubmit-skript (`git cl`/`gcl`) körs som ett separat lager utanför git hooks helt; ingen delad `.git/config`-fil hittad. | [Presubmit Scripts, chromium.org](https://dev.chromium.org/developers/how-tos/depottools/presubmit-scripts) (sekundär, tunn belysning i detta pass) |
| **Kubernetes** | Ingen dokumenterad `hack/`-mekanism för delad `core.hooksPath`/`include.path` hittades i sökningarna. | **Ej belagt** — se § Vad jag inte kunde belägga |

**Ingen av de undersökta stora projekten checkar in en `.git/config`-analog
fil och kopplar in den via `include.path`.** Mönstret är antingen (a) ett
paket-/build-verktygs livscykel-skript som sätter enstaka config-nycklar
direkt (Next.js, Babel, vårt eget repo), eller (b) ett explicit,
dokumenterat en-gångs-kommando som installerar hook-filer direkt (Rust,
pre-commit, lefthook). Precedent-rymden för "`include.path` mot
versionshanterad fil för att distribuera teamkonfig" är **tunn** — se nästa
delfråga för den enda konkreta instansen som hittades.

## Delfråga 6: Finns dokumenterade fall av `include.path` mot versionshanterad fil i praktiken — och invändningar?

Ett konkret exempel hittades: [`stefanhoelzl/share-git-hooks-and-config`](https://github.com/stefanhoelzl/share-git-hooks-and-config)
— ett litet demo-/mönster-repo (inte en branschledare), som:

1. Sätter `core.hooksPath` mot en versionshanterad `hooks/`-katalog.
2. Låter en `post-checkout`-hook köra `git config --local include.path
   ../<your-gitconfig>` för att automatiskt koppla in en delad,
   versionshanterad config-fil åt teammedlemmar.
3. **Erkänner själv bootstrap-paradoxen rakt ut:** *"Since it would be a
   security vulnerability to just allow random git hooks to be executed on
   your system we need to set one global git configuration value"* — dvs.
   `core.hooksPath` MÅSTE sättas manuellt/globalt EN gång, precis som vårt
   `postinstall` gör, innan något annat kan automatiseras via hooks.
4. **Löser aldrig säkerhetsfrågan tekniskt** — enda mitigeringen som anges är
   *"To be sure there is no malicious software hidden in the hooks coming
   with this repository check them out in the `hooks` directory"*, dvs.
   manuell kodgranskning. Ingen sandboxing, ingen begränsning av vilka
   nycklar den inkluderade filen får sätta.

Detta är precis den enda gången i hela passet ett konkret, verkligt projekt
har byggt precis det mönster Marcus frågar om — och slutsatsen därifrån är
att säkerhetsfrågan förblir olöst annat än genom PR-granskning. Det är
samma skyddsnivå vi redan har för `.githooks/*` idag (branch protection +
PR-review, se `CONTRIBUTING.md` § Landnings-ordningen), inte en förbättring.

## Delfråga 7: Säkerhetsvinkeln — kan en PR köra kod på min maskin via en versionshanterad config-fil?

**Ja, i princip — men bara efter att mekanismen redan är bootstrappad EN
gång lokalt, och det gäller redan idag för `.githooks/`.** Den skarpa
skillnaden `include.path` skulle lägga till är **var** koden triggas, inte
**om** den kan triggas:

- **Dagens yta (`.githooks/` via `core.hooksPath`):** körs bara vid
  definierade git-lifecycle-punkter (`pre-commit` m.fl.) — en handling
  utvecklaren redan förväntar sig ska "göra saker", och en `.githooks/`-diff
  i en PR är självklart "detta är kod som körs" för en granskare.
- **`include.path`-ytan:** en inkluderad fil kan sätta `alias.*`,
  `core.fsmonitor`, `core.pager`, `credential.helper` — nycklar som triggar
  körning på **nästan vilket git-kommando som helst** (`git status`, `git
  log`, `git add`), inte bara commit. En sådan rad ser ut som oskyldig
  config i en diff, inte som kod — betydligt lättare att missa vid review.

Ingen dedikerad CVE för `include.path`-missbruk specifikt hittades i detta
pass (se § Vad jag inte kunde belägga). Den generella klassen "git-config-
värde under någon form av kontroll blir RCE" är däremot väldokumenterad:

- **`core.fsmonitor` som RCE-primitiv:** GitHub Copilot CLI-advisoryn
  [GHSA-9ccr-r5hg-74gf](https://github.com/github/copilot-cli/security/advisories/GHSA-9ccr-r5hg-74gf)
  (2026): *"If this setting contains malicious commands, they will be
  executed in the context of the user's shell when Git operations are
  triggered"* — och att blotta `git status`/`git add` räcker som trigger.
  Detta är ett annat hotmönster (nästlat bare-repo som git auto-upptäcker),
  men bevisar att `core.fsmonitor` som VÄRDE är en etablerad
  kod-exekverings-primitiv, inte teoretisk.
- **`CVE-2025-48384`** (aktivt exploaterad, på CISAs KEV-lista): ett
  manipulerat `.gitmodules` med carriage-return i submodule-path fick git
  att skriva och köra en `post-checkout`-hook från repo-innehåll. Källa:
  [GitHub Blog, Git security vulnerabilities announced](https://github.blog/open-source/git/git-security-vulnerabilities-announced-6/),
  [CISA-rådgivning](https://www.cisecurity.org/advisory/a-vulnerability-in-git-could-allow-for-remote-code-execution_2025-078).
  Visar samma mönster i en annan del av git: repo-styrt innehåll → hook
  körs → RCE.

**Bedömning (ej citat, min syntes):** hotmodellen för OSS-repo:t vårt är
inte "en främmande, ovetande klon öppnar ett elakt repo" (safe.directory-
klassen ovan) utan "en granskad, mergad PR i VÅRT EGET repo sätter en
farlig nyckel". Bäret mot det är detsamma som redan skyddar
`.githooks/pre-commit` idag: branch protection + obligatorisk review +
merge queue (`CONTRIBUTING.md` § Landnings-ordningen). `include.path` höjer
inte det skyddet — det breddar bara VAD som kan smygas in (config-nycklar,
inte bara skript) och VAR det triggas (nästan varje kommando, inte bara
commit).

## Vår konkreta situation (verifierad mot disk, 2026-08-04)

- `package.json` rad 40: `"postinstall": "git config core.hooksPath
  .githooks"` — verifierat i denna worktree.
- **Vi har exakt ETT delat värde:** `core.hooksPath`. Bekräftat genom att
  `.git/config` (huvudkatalogen) i övrigt bara innehåller
  klon-/maskinspecifikt innehåll: `remote.origin.url`,
  `user.name`/`user.email` (`marcus803@users.noreply.github.com`), och
  dryga hundratalet `[branch "..."]`-stanzor med `vscode-merge-base` —
  VS Code Git-tilläggets egna, per-branch, per-maskin bokföring. Ingen av
  dessa är kandidater för delning.
- `.githooks/pre-commit` innehåller sedan commit `ed99fe0d` (2026-08-04,
  denna worktrees historik) en vakt (§ "Vakt: core.hooksPath måste vara
  RELATIV") som skriver en VARNING (inte fällning) till stderr om
  `core.hooksPath` någonsin läses som en absolut path.

### Oväntat fynd (utanför frågan, men mätt och load-bearing för domen)

Vid mätning i denna worktree 2026-08-04 ca 20:56 CEST — **efter** att
fix-commit `ed99fe0d` (20:46:51 samma dag) landat i historiken:

```console
$ git config --get core.hooksPath
/Users/marcus/Repon/miranon-media-admin/.githooks
```

Alltså **absolut**, trots att fix-commitens meddelande explicit påstår
*"Värdet rättat till .githooks, verifierat i huvudkatalogen och i en verklig
worktree."* `.git/config`s mtime (`stat`) var 20:51:25 — fem minuter innan
mätningen och strax efter fix-committen — så filen har skrivits om av något
sedan fixen, men vad exakt som skrev den (VS Code Git-extensionens frekventa
`vscode-merge-base`-skrivningar, ett annat verktyg, eller en manuell
`git config`-körning) är **inte identifierat i detta pass**. Detta ändrar
inte rekommendationen — det förstärker den: se § Dom, punkt 3.

Detta pass ändrar inget (uppdraget är rent research), men fyndet bör
registreras som en ny, öppen instans av `T121`-klassen snarare än tyst
förkastas, i linje med `CLAUDE.md` § "Triage av det oväntade".

## Dom

**NEJ — inför inte `include.path` mot en versionshanterad fil för
`core.hooksPath` eller annan repo-config.** Tre skäl, i fallande vikt:

1. **Det löser inte det problem vi faktiskt hade.** `T121`s rotorsak var
   *drift efter korrekt uppsättning* (§ Vår situation, § Oväntat fynd) — inte
   att det saknades ett sätt att distribuera ett förval. Per
   `git-config(1)`s egen precedensregel (§ Delfråga 2, "last value found
   taking precedence over values read earlier") är en inkluderad fil per
   design **överskrivningsbar** av ett direkt lokalt `git config`-anrop —
   exakt den händelse som orsakade `T121` och som (oväntat, men mätt) hände
   igen inom tio minuter efter fixen. `include.path` skyddar mot "ingen fick
   rätt värde vid klon"; vårt problem var "rätt värde skrevs över senare".
   Bara en körtids-vakt (den vi redan har) fångar det senare.
2. **Branschmönstret pekar entydigt åt paket-livscykel-skript, inte delad
   config-fil.** Husky (källkods-verifierad), Next.js och Babel (båda
   verifierade via `package.json`) gör precis vad vi gör: `postinstall`/
   `prepare` anropar `git config <nyckel> <relativt värde>` direkt. Ingen av
   de fem undersökta stora projekten (Next.js, Babel, Rust, Chromium,
   Kubernetes) versionshanterar en delad `.git/config`-analog fil kopplad
   via `include.path`. Den enda hittade konkreta instansen av mönstret
   Marcus föreslår är ett litet demo-repo som själv medger att
   säkerhetsfrågan förblir olöst utom via manuell granskning (§ Delfråga 6)
   — samma skyddsnivå vi redan har.
3. **Säkerhetsytan blir strikt bredare för samma nytta.** `include.path`
   öppnar för nycklar (`alias.*`, `core.fsmonitor`, `credential.helper`) som
   triggar körning på nästan varje git-kommando, inte bara `commit` — svårare
   att granska i en PR-diff, väldokumenterat som RCE-primitiv i andra
   sammanhang (§ Delfråga 7). Vi har EN nyckel att dela; att bygga
   include-maskineri för en nyckel som redan sätts korrekt av `postinstall`
   är precis den spekulativa komplexiteten repots egen
   dubbelriktade-över-engineering-vakt (`CLAUDE.md`) pekar ut: "ingen
   abstraktion utan faktisk nuvarande användare."

**Bootstrap-kostnaden försvinner inte med `include.path` — den flyttas.**
Oavsett mekanism måste NÅGON köra ett `git config`-anrop lokalt en gång (idag:
`postinstall` gör det automatiskt vid `npm install`, delat mellan alla
worktrees eftersom config är gemensam per `git-worktree(1)`, § Delfråga 3).
`include.path` skulle kräva exakt samma bootstrap-anrop, fast riktat mot en
annan nyckel (`include.path` i stället för `core.hooksPath` direkt) — ett
extra indirektionslager utan extra skydd.

**Vad som FAKTISKT löser felläget vi hade** är redan levererat: den
mekaniserade vakten i `.githooks/pre-commit` (`ed99fe0d`) som varnar vid
absolut path, i linje med repots egen `T119`-doktrin ("regler i prosa bryts,
mekaniserade regler efterlevs"). Given att fyndet ovan visar att värdet drev
igen inom tio minuter är den öppna följdfrågan **inte** "ska vi byta
distributionsmekanism" utan **"vad skriver om värdet, och ska vakten
självläka (auto-korrigera) i stället för att bara varna"** — men det är en
ny, separat fråga (se rekommendation).

## Vad jag inte kunde belägga

- **Kubernetes hack/-katalogens exakta git-hooks-mekanism** (eller frånvaro
  därav) — sökningarna gav ingen träff på en specifik
  `install-hooks.sh`/`core.hooksPath`-rad i `kubernetes/kubernetes`. Jag
  skriver att jag inte hittade det, inte att det inte finns.
- **Chromium/depot_tools** undersöktes ytligt (en sekundärkälla om
  presubmit-skript) — inget direkt källkods-verifierat svar på om
  `core.hooksPath`/delad config används någonstans i depot_tools-verktygs-
  kedjan.
- **Rust-precedensen** (`./x setup`) vilar på `rustc-dev-guide` som
  sekundärkälla — jag verifierade inte `src/etc/pre-push.sh` eller
  `x.py setup`-koden direkt mot `rust-lang/rust`s källträd.
- **Ingen dedikerad CVE för `include.path`-missbruk** hittades — den
  generella RCE-klassen (fsmonitor, submodule-hooks) är väl belagd, men
  ingen post namngav `include.path`/`includeIf` specifikt som exploaterad
  vektor i sig.
- **Vad som skrev om `core.hooksPath` till absolut igen** (§ Oväntat fynd) —
  VS Code Git-extensionen är en rimlig hypotes givet de hundratals
  `vscode-merge-base`-raderna i samma fil, men jag mätte bara att filen
  omskrivits (mtime), inte VILKEN process som gjorde det eller om just
  `hooksPath`-raden var målet för den specifika skrivningen. Detta är en
  hypotes, inte en slutsats.

## Rekommendation (Code, inte beslut)

1. **Gör ingenting med `include.path` / delad config-fil.** Behåll
   `postinstall` + relativ `core.hooksPath`. Grunden håller inte för
   maskineriet — se § Dom.
2. **Öppna en ny, avgränsad utredning av VARFÖR värdet drev igen** (§
   Oväntat fynd) — troligast kandidat att pröva först: om VS Code Git-
   extensionen (eller någon annan bakgrundsprocess i denna miljö) skriver om
   `.git/config` på ett sätt som normaliserar/expanderar relativa
   `core.hooksPath`-värden till absoluta vid något internt tillfälle. Detta
   är en ny tråd, inte en del av detta pass.
3. **Överväg (separat beslut, inte del av detta pass) om `T121`-vakten ska
   gå från VARNA till SJÄLVLÄKA** (dvs. hooken kör `git config
   core.hooksPath .githooks` åt dig när den upptäcker en absolut path, inte
   bara skriver en varning) — givet att den absoluta pathen nu är mätt att
   återkomma på egen hand, är en passiv varning svagare än en aktiv
   rättelse. Avvägningen (miljöfel ska inte tyst "rättas" bakom ryggen på
   utvecklaren, kontra att en varning ingen läser inte skyddar något) är
   Marcus/orkestrerarens att göra, inte min i detta research-pass.

## Källförteckning

**Förstaparts (Git-projektet):**

- [gitrepository-layout(5)](https://git-scm.com/docs/gitrepository-layout) — `.git/config` är aldrig spårad
- [git-config(1)](https://git-scm.com/docs/git-config) — `include.path`/`includeIf`-semantik, precedensregel
- [Documentation/config/core.adoc, git/git@master](https://raw.githubusercontent.com/git/git/master/Documentation/config/core.adoc) — `core.hooksPath` exakt text
- [Documentation/githooks.adoc, git/git@master](https://raw.githubusercontent.com/git/git/master/Documentation/githooks.adoc) — hook-katalogens working-directory-semantik
- [git-worktree(1)](https://git-scm.com/docs/git-worktree) — config delad mellan worktrees per default

**Källkod (branschverktyg, hämtad direkt ur repo, ej sekundärkälla):**

- [typicode/husky, index.js](https://raw.githubusercontent.com/typicode/husky/main/index.js) — `git config core.hooksPath` via `spawnSync`
- [typicode/husky, bin.js](https://raw.githubusercontent.com/typicode/husky/main/bin.js) — `prepare: 'husky'`-injektion
- [pre-commit/pre-commit, install_uninstall.py](https://raw.githubusercontent.com/pre-commit/pre-commit/main/pre_commit/commands/install_uninstall.py) — skriver `.git/hooks/` direkt, vägrar samverka med `core.hooksPath`
- [vercel/next.js, package.json](https://raw.githubusercontent.com/vercel/next.js/canary/package.json) + [scripts/git-configure.mjs](https://raw.githubusercontent.com/vercel/next.js/canary/scripts/git-configure.mjs)
- [babel/babel, package.json](https://raw.githubusercontent.com/babel/babel/main/package.json)

**Säkerhet:**

- [GHSA-9ccr-r5hg-74gf, GitHub Copilot CLI advisory (core.fsmonitor RCE)](https://github.com/github/copilot-cli/security/advisories/GHSA-9ccr-r5hg-74gf)
- [GitHub Blog, Git security vulnerabilities announced (CVE-2025-48384 m.fl.)](https://github.blog/open-source/git/git-security-vulnerabilities-announced-6/)
- [CISA-rådgivning, CVE-2025-48384](https://www.cisecurity.org/advisory/a-vulnerability-in-git-could-allow-for-remote-code-execution_2025-078)

**Tredjepart / precedent (sekundär, tunn):**

- [stefanhoelzl/share-git-hooks-and-config](https://github.com/stefanhoelzl/share-git-hooks-and-config) — enda hittade konkreta instansen av `include.path` mot versionshanterad fil, med egen oadresserad säkerhetsreservation
- [rustc-dev-guide, Suggested workflows](https://rustc-dev-guide.rust-lang.org/building/suggested.html) — `./x setup` pre-push-hook
- [itenium.be, Git Hooks with Husky v9](https://itenium.be/blog/dev-setup/git-hooks-with-husky-v9/)
- [pkgpulse.com, husky vs lefthook vs lint-staged 2026](https://www.pkgpulse.com/guides/husky-vs-lefthook-vs-lint-staged-git-hooks-nodejs-2026)
- [lefthook/docs/install.md](https://github.com/evilmartians/lefthook/blob/master/docs/install.md)

**Internt (repot, denna worktree):**

- `package.json` rad 40 — `postinstall`
- `.githooks/pre-commit` — `T121`-vakten
- `tasks/threads/README.md` rad 164 (`T121`, status `closed`)
- commit `ed99fe0d` — fix + vakt
- `git config --get core.hooksPath` — live-mätning 2026-08-04
