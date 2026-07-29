---
owner: marcus803
updated: 2026-07-29
review_by: 2027-01-29
status: stable
---

# Källkodsdrivet testurval — branschledarnas mekanismer och skydden mot falsk grön

> Beställt research-pass 2026-07-29 (S91) inför ett arkitekturbeslut med
> ADR-permanens. Frågan: **hur löser branschledarna källkodsdrivet testurval
> (test impact analysis), och vilka säkerhetsmekanismer hindrar falsk grön?**
> Underlag för den "framtida testgrafs-design" som
> [ADR-077](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
> § Beslut 1 medvetet lämnar öppen.
>
> Passet mäter där mätning är möjlig. Fyra mätningar gjordes i denna worktree
> mot `@playwright/test` 1.61.1 och mot arbetsträdet @ `5923dbe` (identiskt med
> `main` i `src/` och `tests/`, verifierat med `git diff main HEAD -- src tests`); de är
> märkta **MÄTT** och skiljs från citerade påståenden.

## Kort svar

**Ingen branschledare härleder testurval ur källkod utan en graf som
byggsystemet själv äger — och exakt den grafen har vi inte.** De två
mekanismer som är bevisligen *säkra* (Bazel/Google TAP, Metas
byggberoende-baslinje) vilar båda på att byggsystemet garanterar att alla
beroenden är deklarerade. Vår acceptance-svit bryter den kedjan strukturellt:
specfilen importerar aldrig appen, den navigerar till en URL i en webbläsare.

**Det korsimport-problem uppdraget beskriver är mätt och värre än beskrivningen
antyder — men det ligger på fel sida.** MÄTT: 96 av 133 icke-route-filer i
`src/` (72 %) nås från fler än en route; medianfilen når 4 av 26 routes men
**p75 är 16 av 26**. En källfilsändring i övre kvartilen berör alltså i praktiken
hela svitens yta. Åt andra hållet är mappningen däremot nästan trivial: MÄTT,
15 av 18 acceptance-specar navigerar till exakt **en** URL-väg, och de 5 vägar
som delas har exakt 2 specar var. **Det svåra ledet är `src/**` → route, inte
route → spec.**

**Säkerhetsmekanismerna är entydiga och samstämmiga över alla undersökta
aktörer.** Tre återkommer hos var och en: (1) *fail-open till full svit* vid
allt urvalet inte kan resonera om, (2) ett *periodiskt fullt nät* på det landade
trädet — Google var 45:e minut, Meta "var få timmar", Develocity/Launchable
post-merge eller nattligt, (3) *post-hoc-mätning av miss-raten* genom att köra
hela sviten parallellt med urvalet och jämföra. Punkt 3 är den vi saknar helt,
och den är billigast att bygga.

**Dom:** bygg inte en egen källkodsgraf nu. Adoptera inget verktyg heller —
inget av de undersökta passar vår form. Bygg i stället **mät-instrumentet först**
(skuggkörning), och besluta grafen på siffror i stället för på arkitekt-omdöme.
Full motivering under [Rekommendation](#rekommendation).

---

## A. Mekanism-taxonomi

Fyra distinkta sätt att härleda "vilka tester berörs av denna diff". De skiljer
sig i *var informationen kommer ifrån*, och därmed i vad som krävs för att de ska
vara korrekta.

Facit-definitionen kommer ur den akademiska litteraturen och är värd att ha i
huvudet: en urvalsteknik är **safe** om och endast om den utesluter **inga**
tester som, om de kördes, skulle avslöja fel i den ändrade mjukvaran
([Rothermel & Harrold, *A Safe, Efficient Regression Test Selection Technique*,
TOSEM 1997](https://www.cs.purdue.edu/homes/xyzhang/fall07/Papers/p173-rothermel.pdf)).
Alla fyra mekanismerna nedan mäts mot den ribban.

### A1. Build-graf-härledd (Bazel-klassen)

**Mekanism.** Byggsystemet äger en explicit beroendedeklaration per mål. Urvalet
är den *omvända* transitiva höljet: alla testmål som direkt eller indirekt beror
på de ändrade filerna.

Google TAP, ordagrant: *"TAP uses build dependencies in BUILD files (and other
programming language-specific implicit dependencies) rules to create a reverse
dependency structure that eventually outputs all test targets that directly or
indirectly depend on the modified files; these are called AFFECTED test targets"*
([Memon et al., *Taming Google-Scale Continuous Testing*, ICSE-SEIP 2017,
s. 2](https://research.google.com/pubs/archive/45861.pdf)).

**Vad som krävs för korrekthet.** Att grafen är *fullständig* — inget beroende
får finnas som inte är deklarerat. Meta säger rakt ut varför den är säker:
*"strict build isolation enforced by the build system guarantees this technique
identifies all tests that could possibly be impacted by the change"*
([Machalica et al., *Predictive Test Selection*, ICSE-SEIP 2019,
§ I](https://arxiv.org/pdf/1810.05286)). Garantin kommer alltså **inte** från
grafen utan från *isoleringen*: byggsystemet vägrar bygga ett mål som läser något
odeklarerat.

**Var den brister.** Precisionen, inte säkerheten. Meta mäter att den väljer
*"in the order of 10⁴"* testmål per ändring *"despite a vast majority of code
changes touching only a few files"*, och att genomsnittet är
`|DependentTests(d)| ≈ 1000` mål per ändring. Google mäter samma sak från andra
hållet: milestone-storlekar *"as large as 4.2 million tests as selected using
reverse dependencies on changed source files"*, och per ändring i genomsnitt
**43,06 %** AFFECTED-men-ej-körda mål, mot **under 0,5 %** som faktiskt FAILED
(TAP-papperet, Tabell I). Mekanismen är säker och grov.

### A2. Coverage-härledd (vilka tester rörde vilka rader)

**Mekanism.** Kör sviten en gång med instrumentering, spara per test vilka
filer/rader den rörde, välj vid nästa diff de tester vars sparade mängd skär
de ändrade filerna. Detta är Azure DevOps TIA. Microsoft dokumenterar
kartformen ordagrant:

```text
TestMethod1
  dependency1
  dependency2
TestMethod2
  dependency1
  dependency3
```

*"TIA can generate a dependency map for managed code execution. Where such
dependencies reside in `.cs` and `.vb` files, TIA can automatically watch for
commits into such files and then run tests that had these source files in their
list of dependencies."*
([Microsoft Learn, *Use Test Impact Analysis*](https://learn.microsoft.com/en-us/azure/devops/pipelines/test/test-impact-analysis?view=azure-devops))

**Vad som krävs för korrekthet.** Att kartan speglar den *nuvarande* koden. Den
gör den per definition aldrig: kartan är inspelad på en tidigare version.
Meta formulerar den principiella gränsen skarpast: *"all dynamic methods must be
treated as approximate, in a sense that they may ignore tests that would detect
regression in a particular change. This is due to the fact it is fundamentally
impossible to know control flow of a test execution before the test is
exercised."* (Predictive Test Selection, § I.)

**Var den brister.**

- **Ny kod har ingen historik.** En helt ny fil finns i ingen karta.
  Microsoft kompenserar genom att urvalet uttryckligen även innehåller
  *"newly added tests"* och *"previously failing tests"*.
- **Underhållskostnaden.** Meta avfärdar mekanismen för sin skala:
  *"maintaining per-test code coverage information accurate enough to drive the
  test selection process is impractical in large monolithic repositories, while
  recording it requires language-specific infrastructure and is challenging
  across language boundaries."*
- **För webb-E2E finns den knappt.** Cypress egen coverage-dokumentation
  beskriver aggregering, inte per-test-attribution: *"It merges coverage from
  each test and saves the combined result"*
  ([Cypress, *Code coverage*](https://docs.cypress.io/app/tooling/code-coverage)).
  Per-test-granularitet — själva förutsättningen för A2 — är inte det de
  levererar.

### A3. Statisk import-graf-härledd

**Mekanism.** Läs `import`/`require` ur källfilerna, bygg grafen utan att köra
något. Detta är Jest `--onlyChanged`, Nx `affected`, Turborepo `--affected` och
Playwright `--only-changed`.

**Vad som krävs för korrekthet.** Att alla beroenden är *statiskt synliga*. Jest
säger det rakt ut i sin CLI-dokumentation: `--onlyChanged` *"requires a static
dependency graph (ie. no dynamic requires)"*
([Jest CLI Options](https://jestjs.io/docs/cli)).

**Var den brister.** Den akademiska mätningen är entydig: statisk RTS kan vara
osäker, och *reflection var den enda observerade orsaken till osäkerhet* i en
bred empirisk studie av Java-projekt
([Legunsen et al., *An Extensive Study of Static Regression Test Selection in
Modern Software Evolution*, FSE 2016](https://www.cs.cornell.edu/~legunsen/pubs/LegunsenETAL16StaticRTSStudy.pdf)).
I JS/TS-världen är motsvarigheten dynamisk `import()`, lazy routes, plugin-
registrering via strängnamn och allt som går via en bundler-transform. Nx
dokumenterar behovet av handpåläggning för just detta genom `implicitDependencies`
i projektkonfigurationen
([Nx, *Project Configuration*](https://nx.dev/docs/reference/project-configuration)).

### A4. Heuristisk / ML-baserad

**Mekanism.** Lär en klassificerare på historiska utfall: givet en ändring och
ett test, hur sannolikt är det att testet fäller? Meta, Develocity och Launchable
hör alla hit.

Metas features är publicerade och intressanta för oss: filändelser,
ändringshistorik för filerna, historiska felfrekvenser, projektnamn, antal tester
och **minimal distance** — grafavståndet mellan ändrad fil och testmål. Notera
att grafen inte försvinner; den blir en *feature*, inte facit.

Launchable går längre bort från källkoden: modellen tränas på
*"test execution history"*, *"the historical correlation between changed files
and failed tests"* och *"test name/path and file name/path similarity"*
([Launchable, *How Launchable selects tests*](https://help.launchableinc.com/features/predictive-test-selection/how-launchable-selects-tests/)).
Ingen beroendegraf alls.

**Vad som krävs för korrekthet.** Ingenting — mekanismen *gör inga anspråk* på
säkerhet. Meta är explicit: *"our approximation needs not be conservative, in a
sense that it may miss some of the impacted tests, yet it can still be applied in
diff- and land-time testing"* — och motiverar det uteslutande med att
stabiliseringssteget finns under.

**Var den brister.** Den kräver *volym*. Meta tränar på ett företagsomspännande
monorepo; Develocity *"combines this per-project learning with training across
many Develocity installations"*
([Develocity, *Predictive Test Selection User Manual*](https://docs.develocity.ai/2026.1/using-develocity/predictive-test-selection/)).
Vår svit har 18 filer och ett tvåsiffrigt antal CI-körningar per vecka. Det är
inte ett träningsunderlag.

---

## B. Precedent — vilka som är genuint jämförbara

### Jämförbara (3 st, alla primärkällor)

| Aktör | Mekanism | Vad vi tar med oss |
|---|---|---|
| **Google TAP** | A1 build-graf | Presubmit/postsubmit-arbetsdelningen; siffrorna på hur grov en säker graf är |
| **Meta** | A1 som baslinje + A4 ovanpå | Att A4 endast är försvarbart med ett nät under; recall som *mätt* storhet |
| **Microsoft Azure DevOps TIA** | A2 coverage | Den enda som dokumenterar fail-open-listan och periodiciteten som produktfunktioner |

Dessa tre är jämförbara för att de alla (a) publicerar mekanismen, (b) publicerar
eller dokumenterar sina säkerhetsmekanismer, och (c) opererar på **fil- eller
testnivå** — samma granularitet som vår fråga.

Två kommersiella aktörer är jämförbara på *säkerhetsmekanismerna* men inte på
mekanismen: **Gradle Develocity PTS** och **Launchable**. De citeras nedan i § C
eftersom deras dokumentation är den tydligaste förstapartskällan på fail-open,
skuggkörning och "resten av testerna post-merge".

### Ej jämförbara — och varför

- **Bazel `--compile_one_dependency`.** Uttryckligen inte testurval. Bazels
  användarmanual: *"Compile a single dependency of the argument files. This is
  useful for syntax checking source files in IDEs"*
  ([Bazel, *User Manual*](https://bazel.build/docs/user-manual)). Den
  Bazel-mekanism som *är* jämförbar är `rdeps()`-frågan — alltså A1, alltså
  samma sak som TAP. Kandidaten som ställdes i uppdraget pekar på fel flagga.
- **Nx `affected`.** Opererar på **projekt**, inte filer: *"Use the project graph
  to determine which projects the files belong to"* → *"Determine which projects
  depend on the projects you modified"*
  ([Nx, *Run Only Tasks Affected by a PR*](https://nx.dev/ci/features/affected)).
  Vi är **ett** projekt. Mekanismen ger antingen "allt" eller "inget" hos oss.
- **Turborepo `--affected`.** Samma diskvalificering — paketgranularitet i en
  monorepo. Dessutom: låsfilen ligger i den globala hashen och kan inte
  exkluderas, vilket gör *alla* paket affected vid varje beroendebump
  ([Turborepo, *Configuring turbo.json*](https://turborepo.dev/docs/reference/configuration)).
- **Jest `--findRelatedTests`.** Rätt granularitet men fel världsbild: den kräver
  att testet *importerar* källfilen i samma Node-process. Våra acceptance-tester
  gör inte det. Se § D för mätningen som visar exakt detta för Playwright.

### Deklaration om precedent-rymdens tjocklek

Precedent-rymden är **tjock för A1/A2/A4 i allmänhet** och **tunn till obefintlig
för vår specifika form**: hermetiska browser-E2E-tester i ett enrepo utan
byggsystem-graf. Jag hittade **ingen** publicerad förstapartskälla där någon
härleder E2E-testurval ur en källkodsgraf i en Vite/React-app. Frånvaro av
bevis är inte bevis om frånvaro — men den ska deklareras, och den styr
rekommendationen. Vad jag hittade är *kommersiella* aktörer som pekar ut E2E som
målgrupp (Launchable: *"End-to-end, UI tests, and nightly tests are run
infrequently because of long run times, making them ideal candidates for subset
optimization"*), och de gör det uteslutande med A4 — historik, inte källkod.

---

## C. Säkerhetsmekanismerna mot falsk grön

Detta är passets kärna. Fyra distinkta mekanismer återkommer, och de är i praktiken
alltid kombinerade.

### C1. Fail-open till full svit vid allt urvalet inte kan resonera om

Microsoft dokumenterar detta som en namngiven produktegenskap: *"**Safe fallback**.
For commits and scenarios that TIA can't understand, it falls back to running all
tests. […] So, for example, if the code commit contains changes to HTML or CSS
files, it can't reason about them and falls back to running all tests."* Och
igen, i avsnittet om att trimma beteendet: *"When TIA opens a commit and sees an
unknown file type, it falls back to running all tests. While this action is good
from a safety perspective, tuning this behavior might be useful in some cases."*

Develocity uttrycker samma sak från urvalssidan: *"Tests that are recently new,
recently changed, recently failed, or recently flaky are always selected."*

Nx har den enda fail-open jag hittade som är *dokumenterad som ett medvetet
säkerhetsval*: *"Nx will mark **all** projects as affected whenever your package
manager's lock file changes"* — och `"all"` beskrivs som *"the safest option"*
just eftersom alternativet innebär att *"Nx misses a project that should be
affected by a dependency update"*.

**Vår mekanism är redan i denna klass.** `scripts/acceptance-urval.sh` faller till
full klass vid *varje* post som inte är en spec-fil som finns på disk. Det är
Microsofts princip, striktare tillämpad. Ingen ändring behövs här — det som saknas
ligger i C3 och C4.

### C2. Periodiskt fullt nät — och kadensen

Detta är den enda mekanism där jag har **publicerade kadenser** från flera
oberoende aktörer:

| Aktör | Kadens på full körning | Källa |
|---|---|---|
| **Google TAP** | Milestone *"typically cut every 45 minutes during peak development time"*; körningen omfattar alla AFFECTED-mål sedan förra milstolpen | TAP-papperet, s. 1 |
| **Meta** | *"Once every few hours, all tests are exercised on the most recent version of master branch"* — stabiliseringssteget | Predictive Test Selection, § II-B4 |
| **Develocity** | Dokumenterar ett `Remaining tests`-läge, rekommenderat för *"post-merge or nightly builds to ensure complete coverage"* | Develocity PTS-manualen |
| **Azure DevOps TIA** | *"TIA can be conditioned to run all tests at a configured periodicity. **Setting this option is recommended**, and is the means to regulate test selection."* | Microsoft Learn |

Metas stabiliseringssteg är dessutom formulerat som en *release-grind*, inte som
en tröst: *"Release candidates of mobile applications can only be based of such
versions of the repository, which implies no bug detectable via automated testing
can affect the quality of released product, even if it slips through prior
stages."*

**Vår ställning:** `post-merge.yml` anropar `ci-suite.yml` utan
`acceptance_selection` och kör därmed full klass på varje mergat träd — alltså
**tätare än alla fyra ovan**, per commit i stället för per tidsfönster. Det är
den starkaste positionen i tabellen och den bär hela urvalets försvarbarhet.
`nightly.yml` (ADR-077 § 3) ligger under som andra lager.

### C3. Hur de hanterar att grafen/kartan blir inaktuell

Här är svaret genomgående *att inte lita på grafen ensam*:

- **Meta** lägger inte grafen som facit utan som **feature** i modellen
  (`minimal distance`), och kalibrerar mot uppmätt recall i stället för mot
  grafens korrekthet.
- **Microsoft** kompenserar kartans föråldring genom att urvalet alltid
  inkluderar *"newly added tests"* och *"previously failing tests"* utöver de
  kart-träffade, och genom `TIA_IncludePathFilters` för att uttryckligen begränsa
  vilket område kartan över huvud taget får gälla i.
- **Develocity** hanterar det genom att alltid välja tester som är *nya,
  nyligen ändrade, nyligen fallerade eller nyligen flakiga* — alltså precis den
  klass där historiken är minst tillförlitlig.
- **Nx** hanterar det genom `implicitDependencies`, dvs. en handhållen
  kompletteringslista för kanter statisk analys inte ser.

Gemensam nämnare: **ingen litar på att grafen är komplett; alla lägger en
allowlist av alltid-körda tester ovanpå.**

### C4. Hur de upptäcker att urvalet MISSAT något — post-hoc-mätning

Fyra olika former, alla samma idé: kör hela sviten *ändå*, i en billigare kontext,
och jämför.

1. **Meta — sampling-baserad recall-mätning.** *"the only way to calculate test
   and change recall of `s` is to exercise all test targets in `DependentTests(d)`
   for each change `d ∈ D`. […] In practice, we have found it is sufficient to
   estimate the performance of a test selection strategy based on a sample of
   test results. We sample independently a subset `D′ ⊂ D` such that
   `|D′| ≪ |D|`."* Alltså: på ett litet slumpurval av ändringar körs *allt*, och
   recall mäts mot det.
2. **Microsoft — två test-tasks i sekvens.** Ordagrant råd i dokumentationen:
   *"Run TIA selected tests and then all tests in sequence. In a build pipeline,
   use two test tasks - one that runs only impacted Tests (T1) and one that runs
   all tests (T2). If T1 passes, check that T2 passes as well. If there was a
   failing test in T1, check that T2 reports the same set of failures."*
3. **Launchable — observation mode.** Sviten körs full, medan urvalet beräknas
   i skuggan: *"the output of each `launchable subset` command […] will always
   include all tests, but the recorded results will be presented separately so
   you can compare running the subset against running the full suite"*, och
   rapporterar om *"the subset would have caught a failing session"*
   ([Launchable changelog, *Observe Predictive Test Selection behavior before you
   roll out*](https://changelog.launchableinc.com/announcements/observe-predictive-test-selection-behavior-before-you-roll-out-launchable)).
4. **Develocity — simulator mot historiska Build Scans.** Simulatorn
   *"visualizes predicted failure detection rates, savings potential, and
   avoidable compared to unavoidable test counts"* och låter en jämföra utfall
   över urvalsprofiler *innan* PTS slås på.

**Vår ställning:** vi har **ingen** av dessa fyra. `TASK-75` AC #4 kräver en
enstaka plantad regression — det är ett *punktbevis*, inte en mätserie. Detta är
den största luckan passet hittade, och den billigaste att stänga.

### C5. Publicerade miss-rate-siffror

Detta är den enda platsen där hårda tal finns publicerade:

- **Meta**, kalibrerat i produktion vid land-time:
  `TestRecall(s*) > 0.95`, `ChangeRecall(s*) > 0.999`, `SelectionRate(s*) < 0.33`.
  Uttryckt som miss-rate: *"we fail to report only < 5% of individual test
  failures and < 0.1% of faulty changes."* Och den avgörande efterföljande
  meningen — den som gör talet försvarbart: *"Note that any faulty change that
  makes it into the master branch will be detected in the stabilization stage.
  Besides, **significantly more faults are detected in stabilization stage** […]
  than due to the test selection missing failing tests."*
- **Meta, kringsiffra värd att bära:** *"almost 99.9% of test targets selected by
  build-dependency-based selection strategy pass"* — dvs. även den *säkra* A1
  slösar ~999 av 1000 körningar.
- **Google TAP:** av 5,5 miljoner analyserade AFFECTED-testmål under en månad
  *"only 63K ever failed"*; per CL var **< 0,5 %** FAILED.
- **Develocity och Launchable:** inga publicerade recall-siffror hittade i
  förstapartsdokumentationen. Deras svar är simulatorn/observationsläget — mät
  själv på din egen svit.

---

## D. Vad som INTE fungerar — dokumenterade fallgropar

### D1. Playwright `--only-changed` mot appkällkod — MÄTT, reproducerat

**Reproducerat i denna worktree 2026-07-29, `@playwright/test` 1.61.1:**

| Ändrad fil | Utfall av `playwright test --project=acceptance --only-changed --list` |
|---|---|
| `src/routes/_authenticated/hem.tsx` | `Total: 0 tests in 0 files` |
| `tests/acceptance/hem.acceptance.test.ts` | `28 tests in 1 file` |

**Och mekanismen är nu belagd i källkoden, inte bara i utfallet.** I
`node_modules/playwright/lib/common/index.js` byggs grafen av
`stopCollectingFileDeps(filename)`, som fyller `fileDependencies` med de moduler
som *transformerats i Node-processen när testfilen laddades*.
`collectAffectedTestFiles` slår sedan enbart mot `fileDependencies` och
`externalDependencies`. MÄTT: `setExternalDependencies` — den enda vägen in i
`externalDependencies` — anropas **från ingen fil i vår `node_modules`**
(`grep -rl` över hela trädet ger endast definitionen). Den grenen är alltså tom
i vår installation; den fylls av komponenttest-bundlern, som vi inte kör.

Nettoresultatet: `--only-changed` kan strukturellt aldrig se `src/**` för en
E2E-svit som når appen via en dev-server. Playwrights egen release-note
(*"This will also run all test files that import any changed files"*,
[v1.46](https://playwright.dev/docs/release-notes)) är korrekt — det är
förutsättningen "import" som inte gäller hos oss.

**Detta är inte en bugg utan en form-oförenlighet, och den är precis
falsk-grön-klassen:** ett urval som svarar "noll tester" på en ren
källkodsändring ser inte avvikande ut i loggen.

### D2. Statisk import-analys och dynamiska kanter

Jest dokumenterar begränsningen själv (*"requires a static dependency graph (ie.
no dynamic requires)"*). Den empiriska studien av statisk RTS i Java fann
reflection som **den enda observerade orsaken** till osäkerhet — vilket är
uppmuntrande och oroande samtidigt: mekanismen är nästan säker, ända tills en
enda dynamisk kant gör den osäker utan varning. JS/TS-motsvarigheterna
(`import()`, lazy routes, strängbaserad registrering) är fler och vanligare än
Javas reflection.

### D3. Coverage-baserad TIA på browser-E2E

Två oberoende väggar: **per-test-attribution finns inte i standardverktygen**
(Cypress-dokumentationen beskriver sammanslagning över hela körningen), och
**E2E-testers coverage är för bred för att vara ett urvalskriterium** — ett
enskilt flöde rör en stor del av applikationen, vilket gör snittet mellan diff och
coverage nästan alltid icke-tomt. Meta avfärdar mekanismen redan på
underhållskostnaden i ett rent enhetstestsammanhang; för E2E är läget sämre.

### D4. Paket-granulär affected-analys i ett enrepo

Nx och Turborepo ger antingen "allt" eller "inget" när repot är ett projekt.
Turborepos låsfil-i-global-hash är dessutom en dokumenterad källa till att
*allting* blir affected vid varje beroendebump. För oss vore mekanismen inte
osäker — den vore verkningslös.

### D5. Batchning döljer vem som gick sönder

Både Google och Meta dokumenterar samma bieffekt av att köra mindre ofta:
Meta — *"Successful completion of a test suite does not imply each diff in the
sequence is free of detectable faults, as it is possible for the sequence to
contain a diff introducing a breakage and a following diff fixing the bug.
Additionally, it the test suite detects a fault it is usually not immediately
clear which of the diffs was a culprit."* Relevant för oss främst som varning
mot att *glesa ut* post-merge-lagret för att kompensera urvalets kostnad.

---

## Vår egen form — mätt, inte antaget

Alla siffror MÄTTA 2026-07-29 i denna worktree mot arbetsträdet @ `5923dbe`,
via transitiv statisk importanalys (`import`/`export ... from` + `import()`, med
`@/`-alias upplöst mot `src/`).

**Ledet `src/**` → route (det svåra):**

| Mått | Värde |
|---|---|
| git-spårade `src`-filer | 169 |
| route-filer (`src/routes/**`) | 26 |
| icke-route-filer nådda från minst en route | 133 |
| …varav nådda från **fler än en** route | **96 (72 %)** |
| …varav nådda från exakt en route | 37 |
| routes träffade per ändrad icke-route-fil — **median** | **4 av 26** |
| samma — **p75** | **16 av 26** |
| samma — max | 20 av 26 |
| filer som träffar minst halva route-rymden | 36 av 133 (27 %) |

De filer uppdraget pekade ut, exakt:
`src/components/registrations/registration-display.ts` nås från **7** routes;
`src/components/events/detail/DetaljGrupp.tsx` från **8**; resten av
`components/events/detail/**` från 4–7 vardera.

**Ledet route → spec (det lätta):**

| Mått | Värde |
|---|---|
| acceptance-specar | 18 |
| specar som navigerar till exakt **en** URL-väg | **15 av 18** |
| specar med fler än en väg | 3 (max 4 vägar: `anmalan-detalj`) |
| URL-vägar som besöks av mer än en spec | 5 av 18, **alltid exakt 2 specar** |

**Vad talen betyder för beslutet.** Den svåra kanten är den *statiska
importgrafen inom `src/`*, inte kopplingen route↔spec. En route→spec-tabell är i
praktiken en handskriven fil på ~20 rader vars korrekthet är trivialt
granskningsbar. Fördelningen 4 (median) / 16 (p75) betyder också att vinsten är
**starkt asymmetrisk**: hälften av alla källfilsändringar skulle kunna reduceras
kraftigt, men den övre kvartilen faller ändå till nästan full svit. Ett urval på
källkod är alltså inte värdelöst hos oss — men dess förväntade vinst är mycket
lägre än den intuitiva "kör bara den vy jag rörde".

---

## Dom

1. **Ingen branschledare härleder testurval ur källkod utan byggsystemets egen
   graf.** De två säkra mekanismerna (Google TAP, Metas baslinje) vilar båda på
   deklarerade beroenden med *påtvingad* isolering. Vi har inget byggsystem som
   påtvingar den isoleringen, och vår testform bryter dessutom import-kedjan
   mellan test och app helt.
2. **Den mekanism som ligger närmast vår form (A4, historik-baserad) kräver
   volym vi inte har.** Meta och Develocity tränar på storleksordningar fler
   körningar än vi producerar.
3. **Säkerhetsmekanismerna är enhälliga och vi har tre av fyra.** Fail-open (C1)
   har vi, striktare än Microsoft. Periodiskt nät (C2) har vi, tätare än alla
   fyra jämförelseobjekten. Alltid-kör-listan (C3) har vi i praktiken via
   fail-open. **Post-hoc-mätningen (C4) saknas helt.**
4. **Vår regel "allowlist, aldrig blocklist; vid minsta osäkerhet full svit" är
   bekräftad som branschpraxis** — den är ordagrant Microsofts *safe fallback*
   och Nx `"all"`-default. Ingen anledning att rubba den.
5. **Playwrights `--only-changed` är strukturellt oanvändbar för vår
   acceptance-klass**, och orsaken är nu belagd i källkoden på den version vi kör
   — inte bara i ett observerat utfall.

---

## Vad jag inte kunde belägga

- **Google TAP:s nuvarande mekanism.** TAP-papperet är från 2017 och beskriver
  det tillstånd som projektet ville förbättra. Jag hittade **ingen**
  förstapartskälla på hur TAP fungerar 2026, och kan inte belägga att
  milestone-modellen eller 45-minuterskadensen fortfarande gäller.
- **Metas nuvarande siffror.** `>95 % / >99,9 %` är från 2019 och kalibrerade
  mot deras dåvarande stabiliseringssteg. Jag hittade ingen nyare
  förstapartsuppdatering.
- **Microsofts TIA-blogginlägg del 2–4** (som Learn-sidan länkar för
  kartbyggnads-detaljerna) svarade 404 respektive innehöll inte de utlovade
  detaljerna. **Hur TIA:s beroendekarta byggs, lagras och åldras är därmed
  obelagt** — jag har bara kartans *form* och dess fail-open-lista.
- **Develocity och Launchable publicerar inga recall-siffror.** Att deras
  urval är "säkert nog" är obelagt i förstapartskällor; deras svar är att man ska
  mäta själv.
- **Ingen publicerad precedent för källkodsdrivet urval av browser-E2E-tester i
  en Vite/React-app.** Jag sökte specifikt och hittade ingen. Det betyder inte
  att den inte finns.
- **Vår egen importmätning är statisk och därför en undre gräns.** Skriptet läser
  `import ... from`, `export ... from` och `import('...')` men följer inte
  strängbaserade eller runtime-registrerade kanter, och känner inte till
  TanStack Routers genererade routeträd. Verkliga kopplingen `src`→route är
  alltså **minst** så tät som talen visar, aldrig glesare. Skriptet är kastbart
  och landas inte.
- **Jag har inte mätt vad ett källkodsurval faktiskt skulle spara i sekunder.**
  Talen ovan är grafbredd, inte tid. Kopplingen mellan "16 av 26 routes" och
  "hur många av de 18 spec-filerna" kräver den route→spec-tabell som ännu inte
  finns.

---

## Rekommendation

*Detta är en rekommendation, inte ett beslut.*

### Bygg själv eller adoptera verktyg?

**Adoptera:** avfärdas. Nx och Turborepo är fel granularitet (D4). Jest är fel
körmodell. Playwrights inbyggda är mätt oanvändbar (D1). Develocity är
JVM-centrerat och kräver träningsvolym. Launchable är den enda som ens siktar på
E2E — men den är en betaltjänst med extern datadelning, tränad på historik vi
inte har tillräckligt av, och den skulle placera falsk-grön-risken i en modell vi
inte kan granska. Ingen av dem passar.

**Bygga själv, nu:** avrådes. Ett källkodsurval hos oss kräver tre lager som var
och en kan drifta — en importgraf över `src/`, en route→spec-tabell, och en
regel för allt utanför grafen. ADR-077 § Beslut 1 avvisade redan ett
klassnings-skript med rationalen att det tvingar fram omimplementation av
semantik någon annan äger, med divergens-risk. Samma rationale gäller här,
starkare: en egen importgraf skulle duplicera det Vite och TypeScript redan
räknar ut, och vara fel på precis de dynamiska kanter där felet blir en falsk
grön i stället för ett byggfel.

### Vad jag rekommenderar i stället — i ordning

**Steg 1 (rekommenderas starkt, litet): bygg mätinstrumentet innan grafen.**
Detta är det enda passet fann som *alla fyra* jämförelseobjekten har och vi
saknar. Konkret, i vår form: låt `post-merge.yml` — som redan kör full klass —
även beräkna vad PR-grindens urval *skulle* ha valt, och logga differensen.
Kostnad: noll extra testtid, eftersom full svit redan körs där. Utfall: en
mätserie på verklig miss-rate, byggd på samma logik som Launchables observation
mode och Microsofts T1/T2-råd. **Utan detta instrument är varje utvidgning av
urvalet ett omdömesbeslut; med det blir den ett mätbeslut.**

**Steg 2 (rekommenderas, om steg 1 visar att det är värt det): route→spec-tabellen
först, källkodsgrafen sist.** Mätningen visar att route→spec är det lätta ledet
(15/18 är 1:1). En deklarativ, handhållen tabell `route → spec[]` är
granskningsbar, driftar synligt och kan grindas mekaniskt mot att varje route har
minst en spec. Den ger dessutom omedelbart värde för `src/routes/**`-ändringar,
som är den enda filklass där kopplingen redan är entydig — utan att någon graf
behöver byggas.

**Steg 3 (avrådes tills vidare): den transitiva `src/**`-grafen.** Det är här
falsk-grön-risken bor, och det är här p75-siffran (16 av 26 routes) säger att
vinsten ändå är liten. Om den någon gång byggs bör den enligt precedent
(C3, enhälligt) kompletteras med en **alltid-kör-lista**: nya specar, nyligen
ändrade specar, och specar som fällt i de senaste N körningarna — exakt
Develocity- och Microsoft-mönstret.

### Det jag inte vet, och som borde avgöra

- **Hur ofta rör en verklig PR bara `src/routes/**`?** Om andelen är hög är
  steg 2 mycket mer värt än talen ovan antyder; om den är låg är hela spåret
  marginellt. Detta går att mäta ur git-historiken och är inte gjort.
- **Vad är den faktiska tidsvinsten per vald spec?** Sviten är 422–433 s för 18
  filer, men fördelningen mellan filerna är okänd. Om tiden är koncentrerad till
  ett fåtal retry-tunga filer kan urvalet spara mycket mindre än 1/18 per
  bortvald fil.
- **Om vår p75-siffra är stabil över tid.** En enda ny delad komponent kan flytta
  den. En graf vars nytta beror på en fördelning som ingen övervakar är en graf
  som tyst blir värdelös.

---

## Källförteckning

### Primärkällor — publicerad forskning från branschledarna

- Memon, Gao, Nguyen, Dhanda, Nickell, Siemborski, Micco: *Taming Google-Scale
  Continuous Testing*, ICSE-SEIP 2017 —
  <https://research.google.com/pubs/archive/45861.pdf>
  (DOI-post: <https://dl.acm.org/doi/10.1109/ICSE-SEIP.2017.16>)
- Machalica, Samylkin, Porth, Chandra (Facebook/Meta): *Predictive Test
  Selection*, ICSE-SEIP 2019 — <https://arxiv.org/pdf/1810.05286>
  (abstract: <https://arxiv.org/abs/1810.05286>)
- Rothermel & Harrold: *A Safe, Efficient Regression Test Selection Technique*,
  ACM TOSEM 1997 —
  <https://www.cs.purdue.edu/homes/xyzhang/fall07/Papers/p173-rothermel.pdf>
- Legunsen, Hariri, Shi, Lu, Zhang, Marinov: *An Extensive Study of Static
  Regression Test Selection in Modern Software Evolution*, FSE 2016 —
  <https://www.cs.cornell.edu/~legunsen/pubs/LegunsenETAL16StaticRTSStudy.pdf>

### Primärkällor — leverantörsdokumentation

- Microsoft Learn: *Use Test Impact Analysis (Azure Pipelines)* —
  <https://learn.microsoft.com/en-us/azure/devops/pipelines/test/test-impact-analysis?view=azure-devops>
- Gradle/Develocity: *Predictive Test Selection User Manual* (2026.1) —
  <https://docs.develocity.ai/2026.1/using-develocity/predictive-test-selection/>
- Launchable: *How Launchable selects tests* —
  <https://help.launchableinc.com/features/predictive-test-selection/how-launchable-selects-tests/>
- Launchable changelog: *Observe Predictive Test Selection behavior before you
  roll out* —
  <https://changelog.launchableinc.com/announcements/observe-predictive-test-selection-behavior-before-you-roll-out-launchable>
- Nx: *Run Only Tasks Affected by a PR* — <https://nx.dev/ci/features/affected>
- Nx: *Project Configuration* (`implicitDependencies`) —
  <https://nx.dev/docs/reference/project-configuration>
- Turborepo: *Configuring turbo.json* (`globalDependencies`, låsfilen) —
  <https://turborepo.dev/docs/reference/configuration>
- Jest: *CLI Options* (`--findRelatedTests`, `--onlyChanged`, `--changedSince`) —
  <https://jestjs.io/docs/cli>
- Playwright: *Command line* (`--only-changed`) —
  <https://playwright.dev/docs/test-cli>
- Playwright: *Release notes* (v1.46, `--only-changed`) —
  <https://playwright.dev/docs/release-notes>
- Bazel: *User Manual* (`--compile_one_dependency`) —
  <https://bazel.build/docs/user-manual>
- Bazel: *Query quickstart* (`rdeps`) — <https://bazel.build/query/quickstart>
- Cypress: *Code coverage* — <https://docs.cypress.io/app/tooling/code-coverage>

### Mätningar gjorda i detta pass

Worktree @ `5923dbe`, `@playwright/test` 1.61.1, 2026-07-29.

- `--only-changed` mot ändrad `src/routes/_authenticated/hem.tsx` → 0 tester;
  mot ändrad `tests/acceptance/hem.acceptance.test.ts` → 28 tester i 1 fil.
- `setExternalDependencies` har noll anropare i installerad `node_modules`.
- Transitiv importgraf `src/routes/**` → `src/**`: 96 av 133 filer nås från
  fler än en route; median 4, p75 16, max 20 av 26 routes.
- URL-navigation per acceptance-spec: 15 av 18 specar besöker exakt en väg;
  5 vägar delas, alltid av exakt 2 specar.

### Vår egen kontext som passet läste

- [ADR-077](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
  — riskanpassad CI, klassning som allowlist, den öppna testgrafs-slotten
- `scripts/acceptance-urval.sh` — PR-grindens urval (TASK-75)
- `.github/workflows/ci.yml` steget `acceptance-urval`;
  `.github/workflows/post-merge.yml` (full klass utan `acceptance_selection`)
- backlog `TASK-75` — skivan som valde urval på ändrade spec-filer
