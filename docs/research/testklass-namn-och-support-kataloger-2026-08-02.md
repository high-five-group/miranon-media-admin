# Testklass-namnet "acceptance" och de två support-katalogerna — branschpraxis mot mätt migrationskostnad

**Datum:** 2026-08-02 · **Fråga:** Vad säger branschpraxis om (a) namngivning
av delade test-support-kataloger på flera nivåer och (b) namnet på en hermetisk
UI-testklass som i dag heter "acceptance" — och överväger nyttan av omdöpning
kostnaden i detta repo? · **Ursprung:** TASK-59.8:s QA-vandring
(`tasks/sessions/archive/2026-07/2026-07-26-session-91.md` rad ~3853–3857), där två oberoende
färska läsare snubblade på samma sten.

## Kort svar

**(a) Support-katalogerna: gör EN liten omdöpning — platta ut
`tests/acceptance/support/` till en fil.** Branschmönstret är entydigt: EN delad
hjälparkatalog per testträd, och klass-lokala behov löses som FILER i eller
bredvid klassen, aldrig som en andra katalog med samma namn en nivå ner
(Cypress löser exakt vårt fall med `support/e2e.js` + `support/component.js` i
SAMMA katalog). Vår lokala `support/` innehåller en enda fil. Kostnaden är
mätt till 18 importrader + 11 path-strängs-rader — en förmiddagsbillig ändring
som tar bort stenen båda läsarna snubblade på. `tests/support/` behåller sitt
namn: "support" är förstapartskonvention hos både Cypress och RSpec för just
den delade katalogen.

**(b) Klassnamnet "acceptance": byt inte.** Namn-invändningen HAR källstöd —
i litteraturen (ISTQB, Agile Alliance, Fowler) är acceptance-test kund-/
affärsvänt, och kollisionen är på disk: 159 backlog-kort bär rubriken
"Acceptance Criteria" i ATDD-betydelsen. Men namnet har live-verifierad
förstapartsprecedent för exakt vår form (Ghost kör "App Playwright Acceptance
Tests" hermetiskt, verifierat mot deras `ci.yml` i dag), Sentry har
`tests/acceptance/` i huvudrepot, och den styrande
[ADR-080](../decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md) bär
namnet med öppen rationale — förväxlingen ADR:n ville döda var "e2e", inte
ATDD. Migrationskostnaden är mätt till ~255 levande förekomster + 22
fil-/katalognamn + ADR-amendering. Vill Marcus ändå byta är kandidaten
**"application"** — Ember döpte själva om exakt denna klass från "acceptance
tests" till "application tests".

## Premiss-pass (ADR-086) — uppdragets premisser prövade före bygget

| Premiss i uppdraget | Prövad mot | Utfall |
|---|---|---|
| QA-fyndet: två läsare, samma sten, plus namn-invändning | `tasks/sessions/archive/2026-07/2026-07-26-session-91.md` rad 3853–3857 läst | **BEKRÄFTAD** — ordagrant: *"två oberoende färska läsare snubblade på samma sten — `tests/support/fixturvarld/` mot `tests/acceptance/support/` … Därtill steg 2:s namn-invändning mot ordet 'acceptance'"* |
| ADR-080 är styrande och bär namnet | ADR:n läst i sin helhet | **BEKRÄFTAD** — Beslut 1: klassen får *"eget namn, egen katalog, egen config och eget jobb: acceptance"*; termens hemvist är ADR:n + `CONTRIBUTING.md`, uttryckligen INTE `ORDLISTA.md` |
| Namnet bärs i CI-klassning/scripts | Mätningen i §1 nedan | **BEKRÄFTAD** — 55 rader i 3 workflows, 88 rader i 7 skript, med mera |

## 1. Mätningen — blast radius i repot (fakta, inte uppskattning)

Alla tal nedan är mätta i worktree på `main`-läget 2026-08-02 (HEAD `fc6793e7`).
Kommandona redovisas per tabell.

### 1.1 De två support-katalogerna

Struktur (via `find tests -type d -name support` + `ls`):

- `tests/support/` — delad: `test-bas.ts`, `staging-preflight.ts`,
  `hermetik-rapport-fil.ts` + `fixturvarld/` (9 filer).
- `tests/acceptance/support/` — klass-lokal: **en enda fil**,
  `acceptance-bas.ts` (157 rader, klassens fixtur-söm).

Importrader (via `grep -rE "from ['\"].*support/" tests scripts playwright src`
följt av `sed`/`sort`/`uniq -c` per importmål):

| Mål | Importrader | Unika filer |
|---|---|---|
| `tests/support/` (delade, alla `../support/…`-former) | **60** | 46 |
| `tests/acceptance/support/` (`./support/acceptance-bas`) | **18** | 18 |
| Totalt | 78 | 48 |

Förväxlingsytan är konkret: acceptance-specarna importerar **båda** i samma
fil — 24 rader `../support/fixturvarld/…` (delade) sida vid sida med 18 rader
`./support/acceptance-bas` (lokala). Det är exakt stenen läsarna snubblade på:
två `support` som skiljs av ett punkttecken.

Path-strängar i tooling (via `grep -rn "tests/support"` respektive
`"tests/acceptance/support"` över `scripts .github package.json
playwright.config.ts tsconfig*.json biome.json CONTRIBUTING.md tests`):

| Sträng | Rader | Filer |
|---|---|---|
| `tests/support` | 9 | `scripts/flake-matserie.mjs`, `scripts/lib/staging-preflight.mjs`, `playwright.config.ts` |
| `tests/acceptance/support` | 11 | `ci.yml`, `acceptance-urval.sh`, `test-acceptance-urval.sh`, `CONTRIBUTING.md`, `tests/support/test-bas.ts` |

**Kostnad att platta ut den lokala katalogen** (flytta `acceptance-bas.ts` →
`tests/acceptance/acceptance-bas.ts`): 18 importrader (`./support/acceptance-bas`
→ `./acceptance-bas`) + 11 path-strängs-rader + 1 `git mv`. Två mekaniska
vakter överlever flytten utan logikändring: `acceptance-urval.sh`:s allowlist
väljer bara spec-filer och fäller allt annat till full klass (formen är
oberoende av VAR icke-spec-filen bor), och Playwrights default-`testMatch`
plockar inte upp `acceptance-bas.ts` (matchar `*.test.ts`/`*.spec.ts`).

**Kostnad att döpa om den delade katalogen** (t.ex. `tests/support/` →
`tests/test-utils/`): 60 importrader i 46 filer + 9 path-strängar.

### 1.2 Strängen "acceptance"

Per yta (kommandon: `grep -cn "acceptance" <fil>` respektive
`grep -rcn`/`grep -rln` per katalog; fil-/katalognamn via
`find tests scripts -name "*acceptance*"`):

| Yta | Förekomster | Kommentar |
|---|---|---|
| `playwright.config.ts` | 10 rader | projektnamnet `'acceptance'` (rad 377) + `testDir` + kommentarer |
| `package.json` | 3 script-rader | `test:acceptance`, `test:acceptance:sjalvtest{,:negativ}`; env-varen `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER` har 4 förekomster repo-brett |
| `tsconfig*.json` | **0** | ingen träff i någon av de fem |
| CI-workflows | 55 rader | `ci-suite.yml` 17 (inkl. jobbet `acceptance:`), `ci.yml` 29, `post-merge.yml` 9 |
| `scripts/` | 88 rader i 7 filer | störst: `test-acceptance-urval.sh` 48, `acceptance-urval.sh` 16; två av filerna bär ordet i FILNAMNET |
| `tests/` (kod) | 79 rader i 30 filer | importrader, kommentarer, körkommandon i docblocks |
| Fil-/katalognamn | **22 stycken** | 18 spec-filer `*.acceptance.test.ts`, katalogen `tests/acceptance`, `acceptance-bas.ts`, 2 skript |
| `CONTRIBUTING.md` | 12 rader | § Acceptance-klassen — termens andra hemvist enligt ADR-080 |
| ADR:er | 18 rader i 9 filer | 7 i ADR-080 självt; resten är i huvudsak LÄNKAR till ADR-080:s filnamn + registret `docs/decisions/README.md` |
| `docs/` övrigt | 19 filer | mest daterade research-pass (frusna); levande: `byggplan.md` 5, `airtable-constraints.md` 2 |
| `backlog/` + `tasks/` | 42 filer | historik (stängda kort, sessionsdok) — ändras inte vid en omdöpning |
| `ORDLISTA.md` | **0** | ADR-080 valde aktivt bort ORDLISTA som hemvist |

**Summerad levande yta för ett klassnamnsbyte:** ~255 förekomster i ~45 filer
(config 13, workflows 55, skript 88, testkod 79, CONTRIBUTING 12, byggplan +
constraints + decisions-registret ~10) **plus** 22 fil-/katalognamn **plus**
ADR-080-amendering och registerraden. Frusna artefakter (daterade research-pass,
sessionsdok, stängda kort) röjs inte — de bär gamla namnet som historik.

**Vad som INTE påverkas (verifierat, sänker riskklassen):** rulesetet
`main-skydd` har som enda required check `CI Passed or Skipped`
(`gh api repos/…/rulesets/19627609`), så en omdöpning av jobbet `acceptance`
kräver INGEN ruleset-ändring — aggregatorjobbet är kontraktet mot kön.

### 1.3 Kollisionsmätningen — ordets ANDRA betydelse finns redan i repot

`grep -rn "Acceptance Criteria" backlog/tasks | wc -l` → **159 rader**.
Backlog-CLI:t genererar rubriken "Acceptance Criteria" i varje kort — det är
ATDD-betydelsen (kriterier för att godta arbetet), och den är verktygsägd,
alltså opåverkbar. Kollisionen mellan de två betydelserna är därmed inte
hypotetisk utan på disk: en sökning på "acceptance" i repot ger i dag två
skilda begrepp om vartannat. Detta är det starkaste sakskälet FÖR ett byte —
och det redovisas öppet trots att rekommendationen landar i "byt inte".

## 2. Research (a) — delade test-hjälpkataloger i branschen

### Var "support"-namnet kommer ifrån

- **Cypress** (förstapartsdokumentation): scaffoldar `cypress/e2e/`,
  `cypress/fixtures/`, `cypress/support/` och kallar support-filen *"your hook
  into every spec … the natural home for setup and behavior you want available
  everywhere"*; strukturen är uttryckligen *"convention over configuration"*.
  Källa: docs.cypress.io, "Writing and Organizing Tests".
- **RSpec/Rails** (förstapartskälla, äldre än Cypress i JS-världen):
  generator-mallen `rails_helper.rb` bär konventionen i klartext — *"Requires
  supporting ruby files with custom matchers and macros, etc, in `spec/support/`
  and its subdirectories"* med den utkommenterade glob-raden
  `Rails.root.glob('spec/support/**/*.rb')`. Källa: `rspec/rspec-rails`,
  `lib/generators/rspec/install/templates/spec/rails_helper.rb` (main-grenen,
  läst 2026-08-02).

"Support" är alltså inte husets påhitt utan en dubbel förstapartskonvention —
Cypress är den sannolika vektorn in i JS-/E2E-kulturen (exakt vandringsväg ej
belagd, se § Vad jag inte kunde belägga).

### Hur branschen undviker dubblering på två nivåer

- **Cypress löser exakt vårt fall med FILER, inte kataloger:** e2e- och
  component-klasserna har varsin support-FIL i SAMMA katalog —
  `supportFile`-default är `cypress/support/e2e.{js,jsx,ts,tsx}` respektive
  `cypress/support/component.js`. En katalog, per-klass-filer. Källa:
  docs.cypress.io, "Configuration".
- **`microsoft/playwright`** (repot självt): EN delad hjälparkatalog,
  `tests/config/` (`baseTest.ts`, `commonFixtures.ts`, `utils.ts`,
  `serverFixtures.ts` …) bredvid svit-katalogerna `tests/library/`,
  `tests/page/`, `tests/playwright-test/`. Läst via GitHub API 2026-08-02.
- **vitest-dev/vitest**: delade hjälpare i `test/test-utils` bredvid
  svit-katalogerna (`test/browser`, `test/e2e`, `test/unit` …). Läst via
  GitHub API 2026-08-02.
- **microsoft/vscode**: delade drivrutinen heter `test/automation` bredvid
  klasserna `test/smoke`, `test/integration`, `test/unit` — delad kod får ett
  EGET beskrivande namn, inte klassens generiska. Läst via GitHub API
  2026-08-02.
- **React Testing Library** (förstapartsdokumentation): delad setup som en
  `test-utils`-FIL som re-exporterar biblioteket — samma fil-inte-katalog-idé.
  Källa: testing-library.com, "Setup".

**Mönstret över samtliga undersökta:** en (1) delad hjälparyta per testträd;
inget av de fem projekten har två kataloger med samma namn på två nivåer.
Klass-lokalt behov = fil i/vid klassen (Cypress, RTL) eller distinkt namn
(VS Code `automation`).

## 3. Research (b) — vad kallar branschen en hermetisk UI-testklass?

### Termen "hermetisk" är en egenskap, inte ett klassnamn

- **Google, Software Engineering at Google kap. 14 (Larger Testing):**
  hermeticitet definieras som SUT:ens *"isolation from usages and interactions
  from other components than the test in question"*. Klassen som närmast
  motsvarar vår kallas där **functional testing** — *"SUT: single-machine
  hermetic or cloud-deployed isolated; Data: handcrafted; Verification:
  assertions"* — medan *User Acceptance Testing* listas som en EGEN, kundvänd
  kategori. Källa: abseil.io/resources/swe-book/html/ch14.html.
- **Googles Testing Blog "Hermetic Servers" (2012)** myntar hermetic-begreppet
  för servrar/testmiljöer men ger inte testklassen något eget namn.
- **Playwrights egen dokumentation** ger nätverksmockade tester INGEN
  klassbenämning alls — "Mock APIs"-sidan talar om att *"mock and modify
  network traffic"*, inte om en testkategori. Playwright föreskriver inte
  heller någon katalogtaxonomi.

### Vad namnet "acceptance" betyder i litteraturen — invändningen prövad

- **ISTQB-glossaret:** *"formal testing with respect to user needs,
  requirements, and business processes conducted to determine whether or not a
  system satisfies the acceptance criteria and to enable the user, customers or
  other authorized entity to determine whether or not to accept the system"*
  (hämtad via ASTQB:s glossar-PDF v3; glossary.istqb.org blockerade hämtning).
- **Agile Alliance-glossaret:** *"a formal description of the behavior of a
  software product, generally expressed as an example or a usage scenario"* —
  skrivna med kunder/domänexperter, som uttryck för affärskrav.
- **Fowler:** business-facing tests *"are often used as acceptance criteria"*
  och beskriver systemet i domäntermer (bliki: StoryTest/BusinessFacingTest).
- **Testing Trophy (Kent C. Dodds):** klassar EXAKT vår form — appen renderad
  med alla providers, nätet mockat med MSW — som **integration**-nivån:
  *"The idea behind integration tests is to mock as little as possible"*
  (nätet är just det som mockas i hans exempel).

**Domslut över invändningen: den har källstöd.** I litteraturen är acceptance
kund-/affärsvänt och knutet till godtagande-beslut; vår klass är
teknologivänd (den finns för CI-latens och bevisar rendering mot svarsform).
Och § 1.3 visar att den kolliderande betydelsen redan bor i repot i 159 kort.

### Men praxis i webb-OSS använder ordet precis som vi — verifierat i källa

- **Ghost (live-verifierat 2026-08-02):** `.github/workflows/ci.yml` på `main`
  bär i dag `job_apps_acceptance-tests` med visningsnamnet *"App Playwright
  Acceptance Tests"* och nx-target `test:acceptance` (rad 771/775/822) — deras
  hermetiska Playwright-klass utan backend, skild från den skarpa
  `job_acceptance-tests`/e2e-stacken. Detta är precedenten ADR-080 byggde på,
  och den står kvar.
- **Sentry:** `tests/acceptance/` finns i `getsentry/sentry` i dag
  (browser-UI-tester; läst via GitHub API 2026-08-02).
- **Ember — precedent åt BÅDA håll:** ramverkets taxonomi hette i åratal
  "acceptance tests" för hermetiska hela-appen-i-browser-tester (RFC 268
  införde `setupApplicationTest`), men dagens Ember Guides heter kategorin
  **"application tests (previously known as acceptance tests)"**: *"verify
  user stories and features from an end-user perspective"*. Den tyngsta
  användaren av termen för exakt vår klass-semantik har alltså själv migrerat
  bort från den.
- **Grafana** kallar sin hermetiska utbrytning "storybook" enligt det frusna
  branschpraxis-passet
  ([hermetisk kontra skarp](hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md));
  ej omverifierat här.

## 4. Vägning — kandidater med trade-offs

### Delfråga (a): support-katalogerna

| Kandidat | Tydlighet för färsk läsare | Branschstöd | Mätt kostnad | ADR-koherens |
|---|---|---|---|---|
| **A1 — platta ut den lokala:** `tests/acceptance/support/acceptance-bas.ts` → `tests/acceptance/acceptance-bas.ts` | Tar bort dubbleringen helt; `../support/` blir entydigt "den delade" | Cypress-mönstret exakt (per-klass-FIL i stället för katalog); RTL:s `test-utils`-fil | **18 importrader + 11 path-strängar + 1 `git mv`** (~24 filer) | ADR-080 föreskriver "egen katalog" för KLASSEN, inte för sömmen — ingen amendering krävs; CONTRIBUTING § Acceptance-klassen uppdateras (2 rader) |
| A2 — döp om den delade: `tests/support/` → `tests/test-utils/` el. likn. | Löser också dubbleringen, men röjer fel sida: "support" för den delade ÄR konventionen | Emot Cypress/RSpec (support är deras namn för just den delade); Vitest/RTL:s `test-utils` är dock reellt | 60 importrader i 46 filer + 9 path-strängar | Ingen ADR bär namnet; billig koherensmässigt men 3× dyrare än A1 |
| A3 — byt inte | Stenen är mätt: två oberoende läsare föll på den i samma pass | Branschen har inte mönstret vi har | 0 | 0 |

### Delfråga (b): klassnamnet

| Kandidat | Tydlighet | Kollision med etablerade begrepp | Mätt kostnad | ADR-080-koherens |
|---|---|---|---|---|
| **B1 — behåll "acceptance"** | Etablerat i repot sedan S91; definierat vid användningsstället (CONTRIBUTING § Acceptance-klassen + 30-raders docblock i sömmen) | ATDD-kollisionen är verklig (ISTQB/Agile Alliance/Fowler + 159 kortrubriker) men har inte mätts kosta något ännu (n=1 invändning); Ghost/Sentry lever med samma dubbelhet | **0** | Full — namnet och dess rationale ÄR ADR-080 Beslut 1 |
| B2 — "application" (Embers val) | Säger "hela appen körs", vilket är sant; säger inte "hermetisk" (det gör inget namn i precedent-rymden) | Ren: ingen ATDD-laddning, ingen krock med repots övriga klasser | ~255 förekomster + 22 fil-/katalognamn + 3 workflows + 7 skript + ADR-amendering + registerrad | Kräver öppen ADR-080-amendering (namnet bärs där); rivning med kvittens, inte tyst |
| B3 — "ui" / "ui-integration" (Testing Trophy-troget) | Terminologiskt mest korrekt per Dodds | Krockar internt: `visual`-klassen är också UI, och "integration" pekar mot api-sidans klasser — byter en tvetydighet mot en annan | Samma som B2 | Samma som B2 |

## Dom

**(a)** Branschmönstret är entydigt (5/5 undersökta projekt: en delad
hjälparyta, aldrig samma katalognamn på två nivåer), stenen är empiriskt mätt
(två läsare), och kostnaden för A1 är liten och exakt mätt. **A1 överväger
kostnaden.** A2 gör det inte: 3× dyrare och röjer den sida som följer
konventionen.

**(b)** Invändningen mot ordet är källbelagd och kollisionen finns på disk —
men den har ännu inte mätts kosta arbetstid, namnet har stående
förstapartsprecedent för exakt vår form (Ghost, live), och bytet kostar ~255
levande förekomster + 22 namn + ADR-amendering utan att någon kandidat är
kollisionsfri (B3 krockar internt; B2 är ren men säger mindre än den kostar).
**Kostnaden överväger nyttan i dag.** Kalkylen kan vändas av empiri: om
förväxlingen börjar kosta mätbart (en agent som behandlar klassen som
ATDD-kriterier, en läsare till som fastnar) är B2 "application" rätt byte, med
Ember-precedentens exakta form.

## Vad jag inte kunde belägga

- **Support-namnets exakta ursprung och vandringsväg.** RSpec:s `spec/support`
  och Cypress `cypress/support` är båda belagda som förstapartskonventioner,
  men VEM som myntade namnet först och om Cypress lånade det från
  Rails-kulturen är inte källdaterat i detta pass — formuleringen
  "Cypress-arvet" i uppdraget är rimlig men obelagd som kausalkedja.
- **Vad steg 2-läsarens namn-invändning konkret lydde.** Sessionsdoket
  refererar invändningen utan att citera den; att den avsåg ATDD-kollisionen
  är min tolkning, prövad mot litteraturen — inte ett belagt citat.
- **ISTQB-definitionens ordalydelse** är hämtad via ASTQB:s spegling av
  glossaret (v3-PDF) eftersom glossary.istqb.org svarade 403 mot verktyget;
  ordalydelsen korsstämmer över flera speglingar men är inte läst på
  istqb.org direkt.
- **När/var Ember formellt bytte kategorinamnet.** RFC 268 inför
  `setupApplicationTest` men texten behåller ordet "acceptance"; dagens guider
  säger "previously known as acceptance tests". Själva namnbytesbeslutet
  (vilket RFC/PR) är inte belagt.
- **Grafanas "storybook"-benämning** är ärvd ur det frusna S91-passet och ej
  omverifierad här.
- **Kostnaden av att INTE byta klassnamn** är obelagd åt båda håll: n=2
  läsarsnubblingar gäller katalogerna; för namnet finns n=1 invändning och
  ingen mätt tidskostnad. Rekommendationen under vilar därför på
  kostnadsasymmetrin, inte på bevisad ofarlighet.
- **Ingen mätning av dolda konsumenter av jobbnamnet `acceptance`** utanför
  repot (t.ex. externa dashboards mot GitHubs check-API). Rulesetet är
  verifierat rent; annat är inte inventerat.

## Rekommendation (rekommendation, inte beslut — Marcus svarar GO/defer per rad)

1. **(a) GO-kandidat: platta ut `tests/acceptance/support/` till
   `tests/acceptance/acceptance-bas.ts`.** 18 importrader + 11 path-strängar +
   1 `git mv` + 2 rader CONTRIBUTING; ingen ADR-amendering. Eliminerar den mätta
   stenen och landar oss exakt på Cypress-mönstret. Lämplig som eget litet kort.
   `tests/support/` behåller sitt namn.
2. **(b) Defer/byt inte: klassnamnet "acceptance" behålls.** Bokför
   ATDD-kollisionen synligt där termen definieras (en rad i CONTRIBUTING §
   Acceptance-klassen: "avser inte ATDD-/kortens acceptance criteria") i stället
   för att röja ~255 förekomster. Ompröva om förväxlingen börjar kosta mätbart —
   då är "application" (Ember-precedentens byte) kandidaten, och bytet görs med
   öppen ADR-080-amendering.

## Källförteckning

Förstapartskällor (dokumentation och källkod):

- Cypress, Writing and Organizing Tests —
  <https://docs.cypress.io/app/core-concepts/writing-and-organizing-tests>
- Cypress, Configuration (supportFile-defaults per testtyp) —
  <https://docs.cypress.io/app/references/configuration>
- rspec-rails, `rails_helper.rb`-generatormallen (spec/support-konventionen) —
  <https://github.com/rspec/rspec-rails/blob/main/lib/generators/rspec/install/templates/spec/rails_helper.rb>
- Software Engineering at Google, kap. 14 Larger Testing (hermeticitet;
  functional testing; UAT som egen kategori) —
  <https://abseil.io/resources/swe-book/html/ch14.html>
- Google Testing Blog, Hermetic Servers (2012) —
  <https://testing.googleblog.com/2012/10/hermetic-servers.html>
- Playwright, Mock APIs (ingen klassbenämning) —
  <https://playwright.dev/docs/mock>
- `microsoft/playwright`, `tests/` + `tests/config/` (GitHub API, läst
  2026-08-02) — <https://github.com/microsoft/playwright/tree/main/tests>
- vitest-dev/vitest, `test/` inkl. `test-utils` (GitHub API, läst 2026-08-02) —
  <https://github.com/vitest-dev/vitest/tree/main/test>
- microsoft/vscode, `test/` (smoke/integration/unit/automation; GitHub API,
  läst 2026-08-02) — <https://github.com/microsoft/vscode/tree/main/test>
- React Testing Library, Setup (test-utils-konventionen) —
  <https://testing-library.com/docs/react-testing-library/setup/>
- TryGhost/Ghost, `.github/workflows/ci.yml` på main (rad 771:
  `job_apps_acceptance-tests`; läst 2026-08-02) —
  <https://github.com/TryGhost/Ghost/blob/main/.github/workflows/ci.yml>
- getsentry/sentry, `tests/acceptance/` (GitHub API, läst 2026-08-02) —
  <https://github.com/getsentry/sentry/tree/master/tests/acceptance>
- emberjs/rfcs, RFC 268 (setupApplicationTest) —
  <https://github.com/emberjs/rfcs/blob/master/text/0268-acceptance-testing-refactor.md>
- Ember Guides, Test Types ("application tests, previously known as acceptance
  tests") — <https://guides.emberjs.com/release/testing/test-types/>

Definitions-/litteraturkällor:

- ISTQB-glossaret via ASTQB:s PDF v3 (acceptance testing-definitionen) —
  <https://www.astqb.org/documents/Glossary-of-Software-Testing-Terms-v3.pdf>
- Agile Alliance, Glossary: Acceptance Testing —
  <https://agilealliance.org/glossary/acceptance/>
- Martin Fowler, bliki StoryTest/BusinessFacingTest —
  <https://martinfowler.com/bliki/StoryTest.html>
- Kent C. Dodds, Static vs Unit vs Integration vs E2E Testing —
  <https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests>

Repo-interna källor:

- [ADR-080](../decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md) —
  styrande för klassen och namnet
- [Hermetisk kontra skarp e2e — branschpraxis
  (S91)](hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md) — Ghost-/
  Grafana-precedenten som bar ADR-080
- `tasks/sessions/archive/2026-07/2026-07-26-session-91.md` rad 3853–3857 — QA-fyndet
- Mätkommandona i § 1 (körda 2026-08-02 mot HEAD `fc6793e7`)
