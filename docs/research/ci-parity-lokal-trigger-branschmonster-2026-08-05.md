---
owner: marcus803
updated: 2026-08-05
review_by: 2027-02-05
status: draft
---

# CI-paritetsgrindens trigger — när kör branschledare "kör CI lokalt innan push", och vad utlöser det?

> **Proveniens:** avgränsat research-pass 2026-08-05, beställt för att svara på
> Marcus verbatim-frågan efter att `scripts/verify-ci-parity.mjs` (PR `#752`,
> 2026-08-04) landat funktionsdugligt men helt **owired** — 0 träffar i
> `.github/`, `.githooks/`, `.claude/settings.json`. *"Frågan är ju NÄR vi ska
> köra paritetsgrinden då eller? ... jag vill ju SPARA TID med denna, INTE
> vänta ännu mer."* och *"'Ingen mekanism' har ingen bra historik i detta
> projekt."*

## Kort svar

**Ingen branschledare kör en fullständig CI-replik i en obligatorisk
pre-commit-hook.** Mönstret som upprepas hos alla sex undersökta organisationer
är detsamma i grunden: **snabbt och deterministiskt lokalt (sekunder),
tyngre och bredare i pre-push som ett FRIVILLIGT, kringgåbart lager, och det
enda OBLIGATORISKA lagret ligger i CI/merge-kön** — som redan äger sanningen
oavsett vad som körs lokalt. Ingen av de sex kör den fulla sviten i
pre-commit; den enda konkreta pre-push-precedens vi hittade i en
branschledande kodbas (`rust-lang/rust`) kör en **liten, deterministisk
delmängd**, inte hela testsviten, och är själv opt-in.

**Merge-kön är INTE ett giltigt skäl att hoppa över lokal verifiering helt.**
GitHub kräver att en PR:s egna required checks redan är gröna INNAN den ens
får plats i kön (`gh pr merge --help`, verbatim nedan) — kön löser ett annat
problem (integrationsdrift mellan samtidigt köade PR:er), inte "är min diff
trasig". De två frågorna är ortogonala, inte utbytbara.

**Den mest relevanta mätningen i det här passet är vår egen, gjord i dag:**
en riktig CI-körning i det här repot (inklusive det tyngsta jobbet,
Acceptance) tar **401 sekunder väggklocka** eftersom GitHub kör jobben
**parallellt**. Den lokala paritets-skriptet körde **641–824,8 sekunder**
**seriellt** samma dag. Att köra hela skriptet lokalt före VARJE push är
alltså, mätt, LÅNGSAMMARE än att bara pusha och vänta på riktig CI — precis
tvärtemot Marcus mål ("spara tid, inte vänta mer"). Det gör frågan om
scope (bara köra det diffen träffar) till den avgörande delfrågan, inte
frågan om VILKEN git-hook.

## Delfråga 1 — Pre-commit hook: vad kör man, vad kör man INTE, var går smärtgränsen?

Alla källor konvergerar mot samma sak: pre-commit är till för **millisekund-
till enstaka-sekund-checkar** — formatering, statisk lint, hemlighets-scan —
aldrig testsviter.

- **pre-commit.com** (det dominerande ramverket för hook-orkestrering, byggt
  av Anthony Sottile): *"Git hook scripts are useful for identifying simple
  issues before submission to code review."* och att syftet är att en
  granskare *"can focus on the architecture of a change while not wasting
  time with trivial style nitpicks."* Verktyget stödjer flera hook-stadier
  (`pre-commit`, `pre-merge-commit`, `pre-push`, `manual`) explicit, och
  exemplet i deras egen dokumentation för en linter/formatterare är
  `stages: [pre-commit, pre-merge-commit, pre-push, manual]` — samma
  verktygsdefinition återanvänd på flera nivåer, inte en tyngre svit
  tillagd i pre-commit. Källa: [pre-commit.com](https://pre-commit.com/).
- **Sebastian Witowski** (välciterad pre-commit-vs-CI-artikel): *"pre-commit
  will probably run in a split of a second"* för små/medelstora projekt, och
  explicit gräns: *"unsuitable for running slow tasks (slower than a second
  or two), as it blocks you from creating a new commit."* Han förespråkar
  BÅDA lagren samtidigt — snabbt lokalt + allt (inklusive de snabba
  checkarna igen) i CI, just för att undvika drift mellan lokal och CI-miljö.
  Källa: [switowski.com/blog/pre-commit-vs-ci](https://switowski.com/blog/pre-commit-vs-ci/).
- **Camille Hodoul**, med den mest citerbara tumregeln i hela passet: *"The
  slower the task, the later and less often it should run."* Hans
  trestegsmodell: pre-commit **<3s** (linter, statisk analys),
  pre-push **<10s** (bredare checkar), pre-merge/CI = allt tungt, asynkront.
  Han är explicit om att det inte finns en universell "bästa" nivå — det är
  psykologi, inte absolut tid: *"If something feels slow, it will get in the
  way and people (me included) will work around it."* Källa:
  [camillehdl.dev/pre-commit-or-pre-merge](https://camillehdl.dev/pre-commit-or-pre-merge/).

**Vår situation mot detta:** vårt eget `.githooks/pre-commit` följer redan
mönstret perfekt — den gör EN sak (auto-bumpar `updated:`-frontmatter,
millisekunder) och lämnar allt tungt åt CI. `verify-ci-parity.mjs` på
641–824,8s ligger **två till tre GRÖNORDNINGAR** över varenda smärtgräns
någon källa citerade för pre-commit. Att koppla in den där skulle vara en
kvalitativt annan sorts hook än något vi hittat belagt i en branschledande
kodbas.

## Delfråga 2 — Pre-push hook: det vanliga hemmet för tyngre verifiering?

Ja, enligt alla källor är pre-push det stadium där tyngre (men ändå
begränsade) checkar hör hemma — MEN med en viktig nyans: den enda konkreta
pre-push-precedensen vi hittade i en stor, branschledande kodbas kör en
**smal delmängd**, inte hela testsviten.

- **`rust-lang/rust`** — det starkaste primärkälle-fyndet i passet. Hela
  hook-filen ligger publikt: `src/etc/pre-push.sh`
  ([rust-lang/rust](https://github.com/rust-lang/rust/blob/master/src/etc/pre-push.sh)).
  Den kör EN sak: `./x test tidy --set build.locked-deps=true
  --extra-checks auto:py,auto:cpp,auto:js` — en still-/formatkontroll, INTE
  kompilatorns testsvit (som tar timmar). Filen är själv-dokumenterat
  **opt-in**: *"Copy this script to .git/hooks to activate, and remove it
  from .git/hooks to deactivate"*, och den bär sin egen escape-hatch
  (`git push --no-verify`). rustc-dev-guide säger uttryckligen att
  installationen sker via `./x setup` — en medveten handling, inte något
  som är på som standard vid clone. Källa:
  [rustc-dev-guide.rust-lang.org/building/suggested.html](https://rustc-dev-guide.rust-lang.org/building/suggested.html).
- **CoreUI** (populärt UI-bibliotek) beskrivs i tredjehandskällor som ett
  exempel där pre-push kör en fullständig svit inklusive E2E — men vi kunde
  INTE verifiera detta mot en primärkälla (ingen fil hittad i deras publika
  repo som bekräftar det); behandla som obelagt tredjehandspåstående, inte
  fastställt.
- **pre-commit.com** stödjer `pre-push`-stadiet som förstklassigt (se
  Delfråga 1) — samma verktyg, en nivå upp.

**Slutsats för denna delfråga:** branschmönstret för pre-push är "tyngre än
pre-commit, men fortfarande smalt och deterministiskt" — inte "hela CI:s
grinduppsättning". Den enda primärkälle-verifierade instansen
(`rust-lang/rust`) kör en enda, snabb, deterministisk kontroll — inte
motsvarigheten till vårt `verify:ci-parity` i sin nuvarande, oscope:ade form.

## Delfråga 3 — Manuellt kommando med konvention: hur säkerställer projekt att det faktiskt körs?

Det korta svaret ur källorna: **det gör de i praktiken inte, mekaniskt** —
konvention utan mekanism är känd att drifta, vilket är precis vad som redan
hänt i det här repot fyra gånger på en session (skälet skriptet byggdes).

- **Kubernetes** är den tydligaste branschledar-precedensen för det rena
  konventions-mönstret: `hack/verify-all.sh` (alias `make verify`) är den
  dokumenterade, rekommenderade vägen — *"The single command make update
  runs all presubmission verification tests. This is the recommended way to
  verify your changes locally before submitting a pull request."* Men det
  finns **ingen mekaniserad git-hook** som tvingar fram detta i huvudrepot;
  efterlevnaden vilar på CONTRIBUTING-dokumentation plus att CI (Prow-boten,
  server-side) ändå kör om samma verifiering och blockerar mergen om den
  missas. Källor:
  [kubernetes/kubernetes/hack](https://github.com/kubernetes/kubernetes/tree/master/hack),
  [kubernetes/community/contributors/devel/development.md](https://github.com/kubernetes/community/blob/main/contributors/devel/development.md).
- **GitHubs eget "Scripts to Rule Them All"-mönster** löser samma problem
  annorlunda: i stället för att mekanisera EN körning tvingar man fram att
  `script/test` är samma script oavsett vem som anropar det —
  *"script/test can be called on its own in a development environment to
  run tests, but is also called by script/cibuild by our CI server."*
  Konventionen är inte "kom ihåg att köra det" utan "det finns bara ETT
  ställe testlogiken bor, och CI råkar också anropa det". Källa:
  [GitHub Engineering Blog — Scripts to Rule Them All](https://github.blog/engineering/engineering-principles/scripts-to-rule-them-all/).
  Det är värt att notera att detta är en ANNAN arkitektur än vår:
  `verify-ci-parity.mjs` **härleder ur** `ci.yml`/`ci-suite.yml` (skriptet
  läser workflow-YAML:en), medan GitHubs mönster går tvärtom — CI:t anropar
  IN i ett script som är den enda sanningskällan. Se § Oväntat fynd nedan.

**Slutsats:** konvention-utan-mekanism har svag efterlevnads-historik även
hos branschledare (Kubernetes löser det genom att CI ändå kör om allt
server-side, inte genom att lita på lokal disciplin) — vilket bekräftar
Marcus egen observation att "ingen mekanism" har dålig historik hos oss med.

## Delfråga 4 — Affected/impacted-graf: hur bestäms påverkan, hur snabbt blir det?

Fyra oberoende verktyg (Nx, Turborepo, Bazel, Moon) delar samma grundmönster:
**git diff (base…head) mappas mot en beroendegraf, och bara noder som
faktiskt träffas körs.**

- **Nx**: *"Nx uses the Git history and the project graph. Git knows which
  files changed, and the Nx project graph knows which projects those files
  belong to."* `base`/`head` är konfigurerbara (default: `main`-grenen mot
  arbetsträdet lokalt; explicit SHA i CI). Nx dokumenterar INGEN uttrycklig
  pre-push/pre-commit-rekommendation — deras fokus ligger på CI-hastighet,
  inte lokal hook-integration. Källa:
  [nx.dev/docs/features/ci-features/affected](https://nx.dev/docs/features/ci-features/affected).
- **Moon** är det enda av de fyra som EXPLICIT dokumenterar mönstret i en
  VCS-hook: *"a common pattern is `moon run :lint :format --affected
  --status=staged --no-bail`"* i en hook-kontext. Källa:
  [moonrepo.dev/docs/guides/vcs-hooks](https://moonrepo.dev/docs/guides/vcs-hooks).
- **Bazel** löser samma problem via `bazel query 'rdeps(...)'` eller
  tredjepartsverktyg som `bazel-diff`/`target-determinator` — mönstret är
  identiskt (git-diff → beroendegraf → delmängd), men även här är
  användningen dokumenterad primärt som ett **CI**-optimeringsmönster, inte
  en lokal pre-push-standard. Källor:
  [bazel-contrib/target-determinator](https://github.com/bazel-contrib/target-determinator),
  [dropbox.tech — CI/CD with Bazel](https://dropbox.tech/infrastructure/continuous-integration-and-deployment-with-bazel).
- **Google internt** (Software Engineering at Google, kapitel 23) bekräftar
  samma princip fast utan namngivet verktyg: *"We typically limit presubmit
  tests to just those for the project where the change is happening"* —
  scope, inte "kör allt". Se Delfråga 5/Vår situation för den fulla
  Google-datapunkten.

**Slutsats:** affected-grafen är BRANSCHSTANDARDMÖNSTRET för att hålla en
lokal/CI-verifiering snabb nog att vara rimlig att köra ofta — och det är
exakt det som saknas i `verify-ci-parity.mjs` i dag (ändrings-klassningen är,
enligt uppdraget, under byggnad av en separat agent parallellt med detta
pass). Utan den delen är varje lokal körning "hela sviten", vilket enligt
vår egen mätning (se nedan) är dyrare än att invänta riktig CI.

## Delfråga 5 — Merge-kön som ersättning för lokal förverifiering: håller argumentet?

**Nej, inte som ARGUMENT FÖR att hoppa över lokal/PR-nivå-verifiering helt —
merge-kön och `verify-ci-parity` löser olika problem.**

`gh pr merge --help` är entydig, verbatim (redan citerad i vårt eget
`CLAUDE.md` § Landning): *"If required checks have not yet passed, auto-merge
will be enabled. If required checks have passed, the pull request will be
added to the merge queue."* — dvs. PR:ens EGNA required checks (exakt de
`ci.yml`/`ci-suite.yml`-jobb `verify-ci-parity.mjs` replikerar) måste redan
vara gröna INNAN kön ens engagerar sig. Kön lägger till ett SENARE,
YTTERLIGARE lager ovanpå det, inte ett substitut för det.

Vad kön faktiskt löser, enligt GitHub själva:
*"GitHub has reported that they routinely experience post-merge build
failures in their monorepo several times a week, and merge queue has
practically eliminated all build failures in that category"* — mekanismen
är temporära kombinerade testgrenar som provar PR + huvudgren TILLSAMMANS,
för att fånga **integrationsdrift mellan samtidigt köade, individuellt
gröna PR:er** (två PR:er som var för sig är korrekta men krockar
semantiskt när de kombineras). Källa:
[GitHub Engineering Blog — How GitHub uses merge queue](https://github.blog/engineering/engineering-principles/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/).
GitLabs motsvarande mekanism (merge trains / merged-results-pipelines) är
byggd på exakt samma princip — kombinerade pipelines A, A+B, A+B+C körs i
följd. Källa:
[docs.gitlab.com/ci/pipelines/merge_request_pipelines](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/).

**Det är alltså en annan frågeklass än "är min egen diff trasig"** — vilket
är den fråga `verify-ci-parity.mjs` svarar på. Ingen av de två
merge-kö-primärkällorna (GitHub, GitLab) nämner lokal pre-push-testning
alls, i någon riktning — frånvaron av omnämnande är i sig ett resultat (se
§ Vad jag inte kunde belägga), men det talar emot, inte för, tolkningen att
merge-kön gör lokal verifiering överflödig: om det argumentet vore giltigt
och etablerat skulle vi förvänta oss att någon av de två stora
merge-kö-byggarna sagt det rakt ut, och ingen gör det.

## Sök efter det som motsäger — projekt som övergav lokal CI-replikering

Två tydliga motröster hittades, båda värda att ta på allvar:

- **Katya Pavlenko (cakeinpanic)**, *"Stop running tests on precommit
  hook"*: fyra skäl att sluta — väntetid frustrerar, stör atomära
  commit/squash-vanor, slösar resurser (kör allt även vid triviala
  ändringar), och **är trivialt kringgåbart** (`--no-verify`), vilket gör
  skyddet skenbart. Hennes lösning: kör ALLT på en fjärrmaskin via CI i
  stället — *"run them on a remote machine via CI!"* — och lita på att CI
  blockerar merge. Källa:
  [cakeinpanic.medium.com/stop-running-tests-on-precommit-hook](https://cakeinpanic.medium.com/stop-running-tests-on-precommit-hook-665be07b220d).
- **`nektos/act`s dokumenterade gränser** är ett annat slags motröst — inte
  mot lokal verifiering i sig, utan mot EN specifik teknik för det
  (container-emulering av Actions-runnern). Kända, dokumenterade luckor:
  inget macOS/Windows-stöd, tjänster (`services:`) stöds inte fullt ut,
  Docker-kontext respekteras inte, och matrisjobb som delar nätverksnamespace
  kan kollidera lokalt utan att göra det i verkligt GitHub Actions. Källa:
  [nektos/act — Discussion #6091](https://github.com/nektos/act/discussions/6091)
  samt act:s egen README-dokumenterade begränsningslista.
  **Relevant för oss:** `verify-ci-parity.mjs` undviker hela denna
  problemklass strukturellt genom att köra `run:`-blockens kommandon
  direkt på värden i stället för att emulera Actions-runnern — det är alltså
  redan immunt mot `act`s vanligaste dokumenterade svaghetsklass, oavsett
  var det kopplas in.

Pavlenkos argument (kringgåbarhet + falsk trygghet) är starkt men träffar
INTE `verify-ci-parity.mjs` på samma sätt som ett hook-baserat "kör tester
lokalt"-mönster: skriptet ÄR redan bara en spegel av vad CI ändå kör och
kommer köra oavsett — dess frånvaro äventyrar aldrig kodkvalitet (CI är och
förblir den enda enforcement-punkten), bara väggklocka och antalet röda
PR-cykler. Kringgåbarhet är därför ett svagare argument mot OSS specifikt än
mot ett hook-mönster där hooken är den enda vakten.

## Vår situation, mätt — inte antagen

Två mätningar gjorda denna dag (2026-08-05), samma repo, samma commit-linje:

**Lokal paritetskörning (seriell, oscope:ad):** 641,0s och 824,8s, uppgivet
av uppdragsgivaren som mätta värden samma dag (jag har INTE själv kört om
skriptet för att independent reproducera exakt dessa två tal — se § Vad jag
inte kunde belägga).

**Riktig CI, parallell, samma repo:** mätt av mig direkt via `gh run view`
mot en nyligen avslutad, grön `CI`-körning (`databaseId 30983879673`,
skapad `2026-08-05T07:08:31Z`, klar `07:15:12Z`):

| Jobb | Resultat | Varaktighet |
|---|---|---|
| Detect changed files | success | 12s |
| Lint + Audit + TypeCheck | success | 109s |
| Test suite / Acceptance (hermetisk) | success | **378s** |
| Test suite / Pure + Build | success | 36s |
| Test suite / Webblasarbeteende | success | 48s |
| **Total väggklocka (parallellt)** | success | **401s** |

Acceptance-jobbet — CLAUDE.md § Bygg, testa, linta kallar det redan
*"CI:s tyngsta jobb"*, vilket denna mätning bekräftar sifferexakt (378 av
401 totala sekunder, 94%) — körs parallellt med de andra tre. Total
väggklocka för HELA CI-körningen, inklusive det tyngsta jobbet, är alltså
**401 sekunder — snabbare än den lokala paritetskörningens 641–824,8
sekunder.**

**Det här är den enskilt viktigaste datapunkten i passet.** Att köra hela
`verify-ci-parity.mjs` seriellt före VARJE push är, mätt, LÅNGSAMMARE än att
bara pusha och låta riktig CI (som parallelliserar över flera
GitHub-hostade runners) svara. Det gör att frågan "pre-commit eller
pre-push" är sekundär mot frågan "scope:ad eller full" — utan
ändrings-klassningen (som enligt uppdraget är under byggnad separat) sparar
INGEN triggerplacering tid i det vanliga (gröna) fallet; den kostar bara mer
tid, konsekvent, oavsett var den kopplas in.

Matematiken som avgör om det ändå är värt det: en lokal körning "kostar"
sin fulla tid (idag ~730s snitt) i det förhoppningsvis vanliga fallet
(koden är redan korrekt), mot en röd CI-cykel som kostar ungefär
väggklockan (~400s) PLUS omväxlingskostnad PLUS en ny push-och-vänta-cykel
i det mindre vanliga fallet (koden var trasig). Med dagens 100%-scope
lutar det mot att INTE köra lokalt alls för en frisk, liten diff — precis
det scope-fixen är till för att åtgärda: krymper den lokala körningen till
det diffen faktiskt träffar (analogt med Nx/Bazel/Moon-mönstret i
Delfråga 4), sjunker den förhoppningsvis under CI:s 401s för normala
PR:er, och först då blir "kör lokalt före push" en genuin tidsvinst i det
vanliga fallet, inte bara en försäkring mot det ovanliga.

## Dom

**Ingen av de undersökta branschledarna mekaniserar en fullständig
CI-replik i en obligatorisk hook.** Det etablerade mönstret, konsekvent över
sex organisationer, är tre lager med olika strikthet:

1. Millisekund-till-sekund-checkar i pre-commit (formatering, lint) —
   redan vårt läge.
2. En SMAL, deterministisk delmängd i en OPT-IN pre-push-hook
   (`rust-lang/rust`-mönstret) — kringgåbar, en påminnelse snarare än en
   spärr.
3. Allt tungt, obligatoriskt, i CI/merge-kö — den enda platsen som
   faktiskt ENFORCAR något.

`verify-ci-parity.mjs` hör hemma i lager 2 — MEN bara i sin kommande
scope:ade form. I sin nuvarande, oscope:ade form är den, mätt, för dyr för
att vara en rimlig pre-push-standard: den slår varje smärtgräns källorna
citerar för pre-push (Camille Hodouls <10s, `rust-lang/rust`s enda
körning) med två-tre gröordningar, och är dessutom seriellt LÅNGSAMMARE
än att invänta riktig, parallell CI. Merge-kön är inget giltigt skäl att
hoppa över detta lager helt — den engagerar sig först EFTER att PR:ens
egna checks redan är gröna och löser ett annat problem
(cross-PR-integrationsdrift).

## Vad jag inte kunde belägga

- **De exakta 641,0s/824,8s-mätningarna** är uppgivna i uppdraget som
  gjorda samma dag; jag har INTE själv kört om skriptet för att
  independent reproducera just de talen (skriptets egen körtid, ~11-14
  minuter, gör två reproduktionskörningar opraktiskt inom ramen för detta
  research-pass). Behandla dem som mottagna, inte som av mig
  efterverifierade — i linje med ADR-086.
- **Ingen peer-reviewed eller på annat sätt kvantitativ, publicerad studie**
  om hur ofta utvecklare hoppar över FRIVILLIGA lokala hooks hittades.
  Bloggpåståendet *"2.1% of repositories enforce commit message linting or
  hooks"* dök upp i en sökning men källan bakom siffran gick inte att
  spåra till en ursprunglig studie — behandla som obelagt.
- **Påståendet "60–70% av pipeline-fel fångas lokalt"** (från
  cicdbestpractises.com) verifierades AKTIVT som ogrundat: sidan citerar
  ingen studie, undersökning eller datakälla. Exkluderat ur belägget,
  nämns bara som exempel på genren ogrundade marknadsföringssiffror man
  bör vara vaksam mot.
- **CoreUI:s påstådda fulla pre-push-testsvit** (E2E inkluderat) kunde inte
  spåras till en primärkälla i deras publika repo — endast
  tredjehandspåståenden hittades. Behandla som obelagt.
- **Vad den kommande scope:ade/ändrings-klassade `verify-ci-parity.mjs`
  faktiskt kommer kosta i väggklocka** är per definition omätt — den
  bygget pågår parallellt med detta pass. Rekommendationen nedan är därför
  villkorad på att den mätningen görs INNAN triggern kopplas in, inte en
  förutsägelse av resultatet.
- **GitLabs uttryckliga hållning till lokal pre-push-testning** (utöver
  själva merge-train-mekaniken) hittades inte i de sidor jag kunde nå —
  dokumentationen beskriver mekanismen, inte en rekommendation för/emot
  lokal förverifiering.
- Sökningen efter en konkret, namngiven "vi tog bort vår pre-push-hook för
  att den var för långsam"-postmortem från ett stort, namngivet företag gav
  inga träffar utöver Pavlenkos personliga (icke företags-officiella)
  bloggpost. Precedensen för "överge helt" är alltså tunnare än precedensen
  för "tre-lagersmönstret" — deklareras öppet, inte förstärkt med svaga
  exempel.

## Rekommendation

Detta är en rekommendation, inte ett beslut — Marcus väljer.

| Alt. | Trigger | Kostnad i väggklocka | Vad den missar |
|---|---|---|---|
| **A. Nuvarande läge** — manuellt `npm run verify:ci-parity` per konvention i CLAUDE.md, ingen hook | Ingen — kräver att någon minns att köra det | 0s när det inte körs; 641–824,8s när det körs | Exakt det problem skriptet byggdes för att lösa: människor plockar egna delmängder eller glömmer helt. Redan bevisat otillräckligt (fyra mätta instanser samma session). |
| **B. Opt-in pre-push-hook, FULL omfattning, kopplas in NU** | `git push`, kringgåbar med `--no-verify` (rust-lang-mönstret) | 641–824,8s per push tills scope-fixen landar | Enligt vår egen mätning ovan: LÅNGSAMMARE än att bara invänta riktig CI (401s) för en frisk diff — kan alltså netto KOSTA tid i det vanliga fallet, inte spara det. |
| **C. Ingen lokal grind alls, förlita sig på CI + merge-kö** (Pavlenko-mönstret) | Push, väntan på CI | 0s lokalt, ~400–450s CI-väggklocka per körning, PLUS en hel extra cykel vid rött | Exakt den historik Marcus refererar till ("ingen mekanism har ingen bra historik"): tre röda PR:er samma dag var priset för just detta läge innan skriptet fanns. |
| **D. Opt-in pre-push-hook, SCOPE:AD (väntar på ändrings-klassningen), rekommenderad** | `git push`, kringgåbar; kör bara det diffen faktiskt träffar (Nx/Moon/Bazel-mönstret) | Omätt ännu — men Acceptance ensamt stod för 378 av CI:s 401s (94%); en typisk enkomponents-PR som inte rör Acceptance-ytan bör falla långt under CI:s väggklocka | Kräver att scope-logiken är korrekt (fel klassning = falsk trygghet); ärver samma T121-klass av worktree-hooksPath-bräcklighet som redan plågar `.githooks/pre-commit` om den mekaniseras via samma väg |

**Rangordning: D > A (tillfälligt, tills D är mätt klar) > B > C.**

**Skäl:** D är den enda kombinationen som är förenlig med BÅDA de starkaste
fynden i passet samtidigt — branschmönstret (opt-in pre-push, smal
omfattning, `rust-lang/rust`) OCH vår egen mätning (oscope:ad körning är
seriellt dyrare än parallell CI). Koppla INTE in B förrän D:s
scope-logik finns och är mätt: att mekanisera triggern före scope-fixen
riskerar att formalisera en vana som, mätt, kostar mer tid än den sparar
i det vanliga fallet — precis vad Marcus uttryckligen vill undvika. Håll A
(nuvarande, dokumenterade konventionsläge) som bro tills dess: det är känt
otillräckligt men inte känt SKADLIGT, till skillnad från att skarpt koppla
in en 700-sekunders hook redan i dag.

**Vad som talar EMOT D (min förstahandsrekommendation):**

- **Pavlenkos kringgåbarhetsargument** håller i sak: en opt-in-hook med
  `--no-verify`-escape är ingen spärr, bara en påminnelse — den verkliga
  grinden förblir CI/merge-kön oavsett vad vi kopplar in lokalt. Om
  organisationens verkliga problem är att FÖR MÅNGA röda PR:er kostar
  gransknings-cykler, löser en frivillig hook det bara för de som redan är
  disciplinerade nog att inte skippa den — vilket delvis är samma
  population som redan skulle ha kört `npm run verify:ci-parity` manuellt.
- **T121-ärvning**: att koppla in via `.githooks/`/`core.hooksPath` ärver
  samma worktree-bräcklighet som redan krävde en självläkande vakt för
  pre-commit-hooken (`T121`, `#723`). Det är inte gratis att lägga till
  ett andra hook-lager med samma klass av known-fragile mekanism.
  Precommit-hookens skydd tog specifikt tid och en hel egen tråd att bygga.
- **Vår egen mätning är en ENDA datapunkts jämförelse** (en CI-körning, två
  parity-körningar) — inte en serie. Den bekräftar en riktning, inte en
  exakt kvot; att grunda ett triggerbeslut på den utan fler mätpunkter
  (`npm run metrics:flake`-riggens princip: interfolierad, flera körningar,
  inte en enda jämförelse) är svagare belägg än det borde vara för ett
  beslut med denna räckvidd.

## Oväntat fynd (utanför frågan, registreras här också)

GitHubs eget **"Scripts to Rule Them All"**-mönster
([GitHub Engineering Blog](https://github.blog/engineering/engineering-principles/scripts-to-rule-them-all/))
löser "lokalt och CI ska aldrig drifta isär" med en HELT ANNAN arkitektur än
vår: CI:t anropar IN i `script/test`/`script/cibuild`, som är den enda
sanningskällan — inte tvärtom. `verify-ci-parity.mjs` gör motsatt rörelse:
den läser `ci.yml`/`ci-suite.yml` och härleder körningen UR workflow-YAML:en.
Vår riktning är en rimlig retrofit given att `ci.yml` redan finns och redan
äger `run:`-blocken (att vända riktningen nu vore en större omskrivning av
hela CI-konfigurationen) — men om `ci.yml` någonsin skrivs om i grunden är
GitHubs egen, tjugo år beprövade riktning (CI anropar in i script, inte
script härleder ur CI) värd att känna till som den mer etablerade formen.
Detta ligger utanför den avgränsade trigger-frågan och landas här bara som
registrerat fynd, inte som förslag att agera på nu.

## Källförteckning

**Primärkällor (leverantörsdokumentation, källkod, officiella changelogs):**

- [pre-commit.com](https://pre-commit.com/) — hook-stadier, filosofi
- [rust-lang/rust — src/etc/pre-push.sh](https://github.com/rust-lang/rust/blob/master/src/etc/pre-push.sh) — verbatim hook-innehåll
- [rustc-dev-guide.rust-lang.org/building/suggested.html](https://rustc-dev-guide.rust-lang.org/building/suggested.html) — opt-in-installation
- [kubernetes/kubernetes/hack](https://github.com/kubernetes/kubernetes/tree/master/hack) — `verify-all.sh`
- [kubernetes/community/contributors/devel/development.md](https://github.com/kubernetes/community/blob/main/contributors/devel/development.md) — `make update`-konvention
- [GitHub Engineering Blog — Scripts to Rule Them All](https://github.blog/engineering/engineering-principles/scripts-to-rule-them-all/)
- [GitHub Engineering Blog — How GitHub uses merge queue](https://github.blog/engineering/engineering-principles/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/)
- [nx.dev/docs/features/ci-features/affected](https://nx.dev/docs/features/ci-features/affected)
- [moonrepo.dev/docs/guides/vcs-hooks](https://moonrepo.dev/docs/guides/vcs-hooks)
- [bazel-contrib/target-determinator](https://github.com/bazel-contrib/target-determinator)
- [docs.gitlab.com/ci/pipelines/merge_request_pipelines](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/)
- `gh pr merge --help` (lokal CLI-dokumentation, `gh` installerad version i detta repo) — required-checks-before-queue-beteendet
- [nektos/act — Discussion #6091](https://github.com/nektos/act/discussions/6091) — dokumenterade emuleringsluckor
- Egen mätning, `gh run view 30983879673 --json jobs` samt `--json createdAt,updatedAt`, kört 2026-08-05 mot detta repos `CI`-workflow

**Tredjepart (bloggar, community):**

- [switowski.com/blog/pre-commit-vs-ci](https://switowski.com/blog/pre-commit-vs-ci/)
- [camillehdl.dev/pre-commit-or-pre-merge](https://camillehdl.dev/pre-commit-or-pre-merge/)
- [cakeinpanic.medium.com — Stop running tests on precommit hook](https://cakeinpanic.medium.com/stop-running-tests-on-precommit-hook-665be07b220d)
- [dropbox.tech — CI/CD with Bazel](https://dropbox.tech/infrastructure/continuous-integration-and-deployment-with-bazel)
- Software Engineering at Google, kapitel 23 (Continuous Integration) — [abseil.io/resources/swe-book/html/ch23.html](https://abseil.io/resources/swe-book/html/ch23.html) — presubmit-scope, 11-minuters snittväntan, 95%+ korrelation

**Obelagt/exkluderat (se § Vad jag inte kunde belägga för detaljer):**
[cicdbestpractises.com/ci/local-validation](https://cicdbestpractises.com/ci/local-validation/) —
"60–70%"-siffran citeras HÄR bara för att dokumentera att den aktivt
kontrollerades och förkastades, inte som stöd för något påstående.
