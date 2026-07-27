---
owner: marcus803
updated: 2026-07-26
review_by: 2027-01-26
status: stable
---

# Hermetisk kontra skarp e2e — var drar branschledarna gränsen? (S91, 2026-07-26)

> **Proveniens:** avgränsat research-pass, S91 2026-07-26. Ingen kod rörd, inga
> tester körda, inga git-operationer utförda. Fem parallella spår mot
> primärkällor: martinfowler.com, abseil.io (Software Engineering at Google),
> testing.googleblog.com, `playwright.dev`, docs.pact.io, samt faktisk
> CI-konfiguration och testkod i sex publika repon. Tredjeparts-källor är
> markerade som sådana. Där precedent-rymden är tunn står det utskrivet i
> stället för utfyllnad.
>
> Passet informerar ett kommande ADR om att bryta ut merparten av e2e-sviten
> till ett hermetiskt, mutexfritt CI-jobb. Det fattar inte beslutet.

## Kort svar

**Branschen väger determinism högre än realism — men den köper determinismen
genom att göra backend efemär, inte genom att mocka bort den.** Det är passets
viktigaste och mest obekväma fynd.

Google skriver ut avvägningen rakt och landar ändå i determinism: *"As you
approach 1% flakiness, the tests begin to lose value."*
([abseil ch11](https://abseil.io/resources/swe-book/html/ch11.html)) Ett test som
inte kan skilja "min ändring gick sönder" från "miljön rörde sig" bär ingen
signal, hur verklighetstroget det än är. Samtidigt erkänner de konflikten:
*"Often these two factors are in direct conflict ... The key is to identify
trade-offs between fidelity and cost/reliability, and to identify reasonable
boundaries."*
([abseil ch14](https://abseil.io/resources/swe-book/html/ch14.html))

Var gränsen dras: **ingen primärkälla anger en andel eller kvot för hermetisk
kontra skarp e2e.** Normen är kriteriedriven, inte kvotdriven. Det kriterium som
går igen ordagrant hos Google är: *"A real implementation is preferred if it is
fast, deterministic, and has simple dependencies."*
([abseil ch13](https://abseil.io/resources/swe-book/html/ch13.html)) Faller en av
de tre motiveras en dubbel — och bevisbördan ligger på den som mockar.

Tre fynd som träffar vårt fall direkt:

1. **Vår topologi är den lägst rankade som finns.** Googles egen rangordning av
   SUT-topologier sätter *"Shared environments (staging and production)"* längst
   ned, med motiveringen *"the test might conflict with other simultaneous
   uses"* (ch14). Deras ch11 säger uttryckligen att tester *"should not rely on
   a shared database"*. Playwrights enda skrivna villkor för en delad miljö är
   *"Test against a staging environment and make sure it doesn't change"*
   ([best-practices](https://playwright.dev/docs/best-practices)) — vår staging
   är muterbar. Utbrytningen har alltså brett stöd i litteraturen.
2. **Men ingen av de sex verifierade projekten löser det med mock.** Alla
   backend-bärande projekt startar en **färsk backend per CI-jobb**. Ingen kör
   e2e mot delad staging, och ingen har en CI-mutex av vår typ. Branschens väg
   ut ur delad staging är efemär skarp backend.
3. **Ett enda projekt gör exakt vår manöver — Ghost — och de kallar inte
   resultatet e2e.** Deras hermetiska, backend-fria Playwright-klass heter
   *acceptance tests* och ligger i en egen config, ett eget CI-jobb och en egen
   katalog. Namngivningen bär beslutet: att mocka bort backend är ett
   **klassbyte**, inte en optimering av samma klass.

Översatt till etablerad taxonomi: en hermetisk Playwright-körning mot
`localhost:5173` med all extern trafik blockerad är en **Medium test** i Googles
storleksklassning (*"medium tests aren't allowed to make network calls to any
system other than `localhost`"*, ch11). Vår nuvarande staging-svit är en **Large
test**. Utbrytningen flyttar 19 filer en storleksklass nedåt — det är den
skarpaste beskrivningen av vad ADR:n faktiskt beslutar.

## 1. Var ska e2e ligga — den etablerade modellen

### Finns en skriven norm för andelen hermetisk e2e?

**Nej.** Det är ett negativt fynd efter riktad sökning, inte en lucka. Det som
finns skrivet numeriskt gäller något annat: hur stor andel av **hela sviten** som
får vara e2e.

|Källa|Siffra|
|---|---|
|[Google 2015](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)|*"about 70% unit tests, 20% integration tests, and 10% end-to-end tests"* — följt av *"The exact mix will be different for each team"*|
|[abseil ch11](https://abseil.io/resources/swe-book/html/ch11.html)|*"around 80% ... narrow-scoped unit tests ... 15% medium-scoped integration tests ... and 5% end-to-end tests"*|
|[Vocke, practical-test-pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)|*"Maybe you'll find one or two more crucial user journeys ... Everything more than that will likely be more painful than helpful."*|
|[Google 2015](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)|Tankeexperimentet: *"pretend that you could only write 10 E2E tests, and ask yourself where those tests would go."*|

Fowler själv är rent kvalitativ i
[TestPyramid](https://martinfowler.com/bliki/TestPyramid.html) och avfärdar
dessutom proportionsdebatten, via Justin Searls: *"People love debating what
percentage of which type of tests to write, but it's a distraction."*
([2021-test-shapes](https://martinfowler.com/articles/2021-test-shapes.html))

### Googles storleksklassning — vår fråga i deras språk

Klassningen handlar inte om testets omfång utan om vad det får röra, *"because
the most important qualities we want from our test suite are speed and
determinism"* (ch11).

|Får testet …|Small|Medium|Large|
|---|---|---|---|
|Spänna över flera processer|Nej|Ja|Ja|
|Använda trådar|Nej|Ja|Ja|
|Sova / blockerande anrop|Nej|Ja|Ja|
|Disk-I/O|Nej|Ja|Ja|
|Nätverk|Nej|**Endast `localhost`**|Fritt|
|Spänna över flera maskiner|Nej|Nej|Ja|

Ordagrant: *"Medium tests can span multiple processes, use threads, and can make
blocking calls, including network calls, to `localhost`. The only remaining
restriction is that medium tests aren't allowed to make network calls to any
system other than `localhost`."* (ch11)

Och hermeticitet som allmänt krav, inte som specialfall: *"All tests should
strive to be hermetic: a test should contain all of the information necessary to
set up, execute, and tear down its environment."* (ch11)

I ch14 är hermeticitet uttryckligen en **axel**, inte en boolean: *"Hermeticity:
This is the SUT's isolation from usages and interactions from other components
than the test in question. An SUT with high hermeticity will have the least
exposure to sources of concurrency and infrastructure flakiness."*

### Fowlers broad/narrow — samma gräns, annat ord

Skillnaden ligger i **om beroendena är levande eller dubblerade**, inte i hur
mycket kod som körs. Narrow integration test *"uses test doubles of those
services, either in process or remote"*; broad *"require live versions of all
services, requiring substantial test environment and network access"*. Hans råd:
*"If your only integration tests are broad ones, you should consider exploring
the narrow style, as it's likely to significantly improve your testing speed,
ease of use, and resiliency."*
([IntegrationTest](https://martinfowler.com/bliki/IntegrationTest.html))

### De skrivna kriterierna för valet

Detta är det som ADR:n bör vila på, eftersom kvoten inte finns.

- **Standardläget är riktig implementation.** *"our first choice for tests is to
  use the real implementations of the system under test's dependencies"*
  ([ch13](https://abseil.io/resources/swe-book/html/ch13.html))
- **Tre-egenskapstestet.** *"A real implementation is preferred if it is fast,
  deterministic, and has simple dependencies."* (ch13)
- **Tröskeln är empirisk, inte principiell.** *"it is often simpler to use a real
  implementation until it becomes too slow to use, at which point the tests can
  be updated to use a test double instead."* (ch13)
- **Preferensordning:** riktig implementation → fake → stub/interaktionstest.
  (ch13)
- **Fjärranrop är den skarpa gränsen.** *"tests that call remote systems are
  unnecessarily slow and brittle"*
  ([BroadStackTest](https://martinfowler.com/bliki/BroadStackTest.html))
- **Aldrig mot produktion.** *"Avoid integrating with the real production system
  in your automated tests."* (practical-test-pyramid)
- **Trappa för externa beroenden:** kör lokalt först; *"If there's no way to run
  a third-party service locally you should opt for running a dedicated test
  instance."* (practical-test-pyramid)
- **Stabilitetskriteriet mot mock-purism.** *"If talking to the resource is
  stable and fast enough for you then there's no reason not to do it in your
  unit tests."*
  ([UnitTest](https://martinfowler.com/bliki/UnitTest.html))

### Playwrights egen rekommendation

Playwright föreskriver **ingen** andel. Deras enda normativa gräns går vid
ägarskap: *"Only test what you control. Don't try to test links to external sites
or third party servers that you do not control."* med lösningen *"use the
Playwright Network API and guarantee the response needed."*
([best-practices](https://playwright.dev/docs/best-practices))

`routeFromHAR` är deras "spela in verkligheten, spela upp hermetiskt"-mekanism,
och den är **hermetisk som default**: `notFound` *"Defaults to abort"*
([class-browsercontext](https://playwright.dev/docs/api/class-browsercontext)).
En HAR-driven svit läcker alltså inte tyst ut på nätet vid ett oinspelat anrop —
den dödar det. Samma mönster beskriver Google som en generell teknik: *"use a
larger test to generate a smaller one by recording the traffic to those external
services ... and replaying it when running smaller tests."* (ch14)

### Kent C. Dodds som motvikt

Hans position är inte "mocka mindre överallt" utan **flytta gränsen till
nätverkslagret och håll applikationen äkta**. Ledstjärnan: *"The more your tests
resemble the way your software is used, the more confidence they can give you."*
Kostnaden han bokför: *"When you mock something you're removing all confidence in
the integration between what you're testing and what's being mocked."*
([write-tests](https://kentcdodds.com/blog/write-tests)) Hans egen e2e-definition
är renodlat skarp: *"the place where you attempt to validate that things work
without any (or more practically 'as little as possible') mocking in place."*
([testing-classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications))

Motvikten är mindre skarp än den brukar återges: Dodds och Google är oense om
lagrets namn och vikt, men eniga om kriteriet — mocka vid en stabil, ägd gräns,
aldrig inuti det man vill ha förtroende för.

## 2. Contract testing — vem garanterar att mocken stämmer?

### Fowlers svar: ingen, om du inte bygger garantin själv

Han ställer frågan i första stycket av
[ContractTest](https://martinfowler.com/bliki/ContractTest.html): *"testing
against a double always raises the question of whether the double is indeed an
accurate representation of the external service, and what happens if the external
service changes its contract?"*

Receptet, ordagrant: *"continue to run your own tests against the double, but in
addition to periodically run a separate set of contract tests. These check that
all the calls against your test doubles return the same results as a call to the
external service would."*

Tre operativa detaljer han är explicit om, och alla tre är direkt tillämpliga:

- **Kadens:** *"These tests need not be run as part of your regular deployment
  pipeline ... Often running just once a day is plenty."*
- **Fail-semantik:** *"A failure in a contract test shouldn't necessarily break
  the build in the same way that a normal test failure would."*
- **Mot vad:** *"it's usually best to do so against a test instance of the
  external service."*

Besläktat mönster:
[SelfInitializingFake](https://martinfowler.com/bliki/SelfInitializingFake.html)
— fejken anropar den skarpa tjänsten första gången och sparar svaret, parat med
en svit som periodiskt verifierar att det sparade svaret fortfarande stämmer.

### Google: mocken ruttnar tyst, och det är hela problemet

Diagnosen i ch14 är den enskilt skarpaste meningen i hela passet:

> *"mocks become stale. If this mock-based unit test is not visible to the author
> of the real implementation and the real implementation changes, **there is no
> signal** that the test (and the code being tested) should be updated to keep up
> with the changes."*

Och den epistemiska grunden: *"that engineer usually did **not** write the thing
being mocked and can be misinformed about its actual behavior."* (ch14)

Deras mekanism, ordagrant: *"A fake must have its own tests to ensure that it
conforms to the API of its corresponding real implementation"*, via *"writing
tests against the API's public interface and running those tests against both the
real implementation and the fake (these are known as contract tests)."* (ch13)

Ägarskapsregeln: *"the team that owns the real implementation should write and
maintain a fake."* (ch13)

### Pact — vad det löser, vad det kostar, och deras egen avgränsning

Mekanik: konsumenten kör mot en mock-provider som genererar en *pact-fil*;
providern verifierar den — *"Each request is sent to the provider, and the actual
response it generates is compared with the minimal expected response described in
the consumer test."*
([how_pact_works](https://docs.pact.io/getting_started/how_pact_works))

Kostnaden är organisatorisk, inte teknisk: bägge sidor måste vara under aktiv
utveckling och under kontroll, providerns CI måste köra verifieringen, och en
broker krävs för att växla pacts.

**Den avgörande raden står i Pacts egen dokumentation.** Under *What Pact is NOT
good for*, ordagrant:

> *"Use as a general purpose mocking or stubbing tool for browser driven tests."*
> ([what_is_pact_good_for](https://docs.pact.io/getting_started/what_is_pact_good_for))

Pact-underhållarnas egen post-mortem är lika rak: ett företag genererade pacts ur
UI-tester och fick kombinatorisk explosion (81 interaktioner där enhetstester
gett 12). Deras slutsats: *"Do not use Pact for your scenario based, multi
screen, multi-step tests."* och *"Don't use Pact to test the UI itself."*
([pactflow.io, tredjeparts-blogg av Pact-underhållare](https://pactflow.io/blog/a-disastrous-tale-of-ui-testing-with-pact/))

Vad Pact **sanktionerar** för UI: låt fokuserade API-klient-tester generera
kontraktet, och **seeda UI-stubbarna ur pact-filen**. *"While we don't recommend
you generate pacts from your UI tests, you can use Pact to support your UI
testing"*
([using_pact_to_support_ui_testing](https://docs.pact.io/consumer/using_pact_to_support_ui_testing))

Not för oss: Pacts *förutsättning* (kontroll över båda sidor) är uppfylld —
Edge-funktionerna är våra. Exklusionen ovan träffar ändå den form utbrytningen
skulle ha.

### Alternativ-rankning, billigast först

1. **Spec som sanningskälla → generera fixturerna.** MSW:s egen
   förstahandsrekommendation, med motiveringen att *"treating the backend runtime
   as the truth is prone to issues as the backend may introduce faulty runtime
   behavior that violates the intended specification"*, plus rådet att
   automatisera om-genereringen i CI för att *"ensure that the mocks remain
   relevant over time"*
   ([mswjs.io](https://mswjs.io/docs/recipes/keeping-mocks-in-sync/)).
2. **Snapshot av verkliga svar.** Playwrights `routeFromHAR` med `update: true`
   spelar in skarp trafik; HAR-filen *"should be committed to your source
   control"* ([`playwright.dev/docs/mock`](https://playwright.dev/docs/mock)).
   **Ärlig brist:** Playwright ger ingen vägledning alls om hur HAR:en hålls
   färsk. Mönstret löser fixturens *ursprung*, inte dess *fortsatta sanning*.
3. **Verified fakes / kontraktstest mot både äkta och fejk.** Googles mönster.
   Högst trovärdighet, högst kostnad.
4. **Full CDC med Pact.** Högst kostnad, och Pact exkluderar själva den
   användningen.

### Evidensläget om mock-drift: tunt, och det ska sägas rakt ut

- **Spadini m.fl. (MSR 2017 / EMSE, tredjeparts-akademisk):** fyra system, 2 000+
  manuellt analyserade mock-användningar, 100+ enkätsvar. Mäter **vad** som
  mockas och **varför**, och att mockar är långlivade — *"mocks mostly exist
  since the very first version of the test class"*. Drift finns med som
  utvecklares självrapporterade upplevelse. **De kvantifierar inte missade
  buggar.**
  ([publikationssida](https://mauricioaniche.com/publications/to-mock-or-not-to-mock/))
- **Google:** *"though these tests were easy to write, we suffered greatly given
  that they required constant effort to maintain while rarely finding bugs."*
  (ch13) — institutionell erfarenhetsutsaga, noll siffror.
- **Närmast hårda data, och det är en proxy:** mockless test-generering
  rapporterar i snitt +13,67 procentenheters mutationspoäng när riktiga
  beroenden körs i stället för mockade (Java-enhetstester på Defects4J,
  tredjeparts-preprint). Indikation, inte bevis för frontend-fixturer som ruttnar
  över kalendertid.
- **Vad som INTE håller:** påståendet att kontraktsdrift står för runt 70 % av
  API-fel i produktion cirkulerar i leverantörsbloggar utan spårbar metod.
  **Citera det inte.**

**Sammanfattat:** argumentet för kontraktsvakt vilar på **mekanism och
auktoritet**, inte på en publicerad effektstorlek. Googles *"there is no signal"*
är en strukturell observation — den är stark ändå, men den som säljer in den på
siffror säljer in på något som inte finns.

## 3. Flaky tests mot delad miljö — vad gör de stora?

### Publicerade siffror

|Mått|Värde|Källa|
|---|---|---|
|Andel flaky testkörningar i Googles CI|**1,5 %**|[Google 2016](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)|
|Andel av 4,2 M tester med någon flakiness|**~16 %**|samma|
|Andel av pass→fail-övergångar som rör ett flaky test|**~84 %**|samma|
|Andel av testbudgeten som går åt till omkörningar|**~2–16 %**|citerat ordagrant i [ISSTA 2019, Microsoft](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/11/LamETAL19RootFinder.pdf)|
|Microsofts egna: andel flaky testfall|**4,6 %**|samma|
|Andel flaky tester som **bara** är flaky i CI|**86 %**|samma|

Den sista raden är den mest relevanta för oss: flakiness bor i **miljön**, inte i
testkoden, i 86 % av fallen (*"When we re-run flaky tests locally 100 times, we
find that 86% of them are only flaky in the CI pipeline."*).

Dokumenterade grundorsaker (Luo m.fl., FSE 2014, 161 djupinspekterade commits —
råa antal ur författarnas presentation, andelar härledda):

|Orsak|Antal|Andel|
|---|--:|--:|
|Async wait|74|~46 %|
|Concurrency|32|~20 %|
|**Test order dependency**|**19**|**~12 %**|
|Resource leak|11|~7 %|
|Network|10|~6 %|
|Övriga (tid, I/O, slump, flyttal, osorterade samlingar)|16|~10 %|

De tre översta bär runt 78 % av all flakiness.

### Rangordning av åtgärder — källbelagd

**1. Isolera / hermetisera.** Den enda åtgärd som tar bort orsaken.

- Google ch11: *"Tests should assume as little as possible about the outside
  environment, such as the order in which the tests are run. **For example, they
  should not rely on a shared database.**"*
- Google ch14, om delade miljöer: *"This has the lowest cost because these shared
  environments usually already exist, **but the test might conflict with other
  simultaneous uses.**"* Och om reservationslösningen: den *"does not scale with
  a growing number of engineers or a growing number of services."*
- Google ch14, om muterande anrop mot en delad miljö: *"If a prober performs a
  mutable (write) action, it will modify the state of production. This could lead
  to ... nondeterminism and failure of the assertions ..."*
- Google ch14, om storleksklassen: *"Flakiness is bad enough for unit tests, but
  for larger tests, it can make them unusable."*
- Playwright: *"Each test should be completely isolated from another test"* och
  *"If working with a database then make sure you control the data. Test against
  a staging environment and make sure it doesn't change."*
- Thoughtworks Technology Radar, **HOLD** på *Enterprise-wide integration test
  environments*: de blir *"a precious resource that's hard to replicate and a
  bottleneck to development"* och ger *"a false sense of security due to
  inevitable discrepancies in data and configuration"*
  ([radar](https://www.thoughtworks.com/radar/techniques/enterprise-wide-integration-test-environments)).
- Fowler, om städning: *"I prefer the former [rebuilding initial state from
  scratch], as it's often easier — and in particular easier to find the source of
  a problem."*
  ([nonDeterminism](https://martinfowler.com/articles/nonDeterminism.html))

**2. Kvarantän** — tidsbegränsad, med ägare, aldrig som slutstation. Fowler:
*"Place any non-deterministic test in a quarantined area. (But fix quarantined
tests quickly.)"* GitLab: *"Quarantining a test means marking it to be skipped in
CI while preserving it in the codebase for future fixing"*, men med fix-först-
ordningen *"Fix the previous tests and/or places where the test data or
environment is modified, so that it's reset to a pristine test after each test."*
([docs.gitlab.com](https://docs.gitlab.com/development/testing_guide/unhealthy_tests/))

**3. Retry** — används som **detektor**, inte som fix. Playwright definierar
flaky som *"failed on the first run, but passed when retried"*
([test-retries](https://playwright.dev/docs/test-retries)). Dropbox kör om tio
gånger för att *klassificera*. **Ingen primärkälla rankar retry som primär
åtgärd.**

### Determinism eller realism?

**Determinism — men frontlinjen är inte "välj en", utan "köp tillbaka realismen
utan att dela miljön".** Uber byggde SLATE just för att komma bort från delad
staging, och deras skäl mot staging är exakt de som brukar anföras för mockning:
*"dependencies in staging environments may not be as updated as production. As a
result, E2E testing in staging environments is not reliable and can be flaky"*
och *"Staging environment also limits how many developers can test at once."*
Deras lösning är ändå **högre** trohet, inte lägre: produktionsinstanser med
tenancy-routing och TTL
([uber.com](https://www.uber.com/en-DK/blog/simplifying-developer-testing-through-slate/)).

**Den enda tydliga motrösten är Meta:** mät flakiness i stället för att
eliminera den — *"all real-world tests are flaky to some extent"* och *"Our goal ... is to ... assert that a test is sufficiently reliable"*
([engineering.fb.com](https://engineering.fb.com/2020/12/10/developer-tools/probabilistic-flakiness/)).
Men även Meta låser först allt som går att låsa: *"we pin all attempts to the
same version of configuration or external services."*

Spotify bidrar med den enda hårda "minska ytan"-siffran: *"Instead of having 500
end to end tests for your organization, have 5."* — och rapporterar att enbart
göra flakiness **synlig** tog dem från 6 % till 4 % på två månader
([engineering.atspotify.com](https://engineering.atspotify.com/2019/11/test-flakiness-methods-for-identifying-and-dealing-with-flaky-tests)).

## 4. Precedent — sex projekt lästa i källan

Varje rad nedan är verifierad mot faktisk `.github/workflows/*.yml`, faktisk
`playwright.config.*` och faktiska testkataloger. Blogginlägg om vad projekten
påstår väger inte i tabellen.

|Projekt|Hur uppdelat|Motivering (ordagrant där den finns)|Källa|
|---|---|---|---|
|**TryGhost/Ghost**|**Två klasser, två configs, två CI-jobb.** Hermetisk: `job_apps_acceptance-tests` (ci.yml rad 764), matrix på nx-taggen `playwright`, **inget `needs:` på build, ingen backend, ingen docker** — 81 spec-filer. Skarp: `job_e2e_tests` (rad 1519), Main × 10 shards + Analytics × 2, docker-stack per jobb, `TEST_WORKERS_COUNT: 1` — 82 spec-filer. ≈ 50/50.|`e2e/playwright.config.mjs` rad 24: *"retries: 0, // Retries open the door to flaky tests. If the test needs retries, it's not a good test or the app is broken."* Rad 5–12: *"Each worker ... gets its own Ghost instance ... It's possible to use more workers, but then the total test time and flakiness goes up dramatically."*|[`github.com/TryGhost/Ghost`](https://github.com/TryGhost/Ghost)|
|**grafana/grafana**|Samma manöver, motsatt viktning. Hermetisk: `run-storybook-test` (pr-e2e-tests.yml rad 123), `needs: detect-changes` — hoppar över build-backend/build-frontend helt, egen `playwright.storybook.config.ts`, **1 fil**. Skarp: `run-playwright-tests` (rad 156), `needs: [build-backend, build-frontend]`, 8 shards mot riktig server — **208 filer**.|`contribute/style-guides/e2e-playwright.md` rad 8: *"We generally do not use stubs or mocks as to fully simulate a real user."*|[`github.com/grafana/grafana`](https://github.com/grafana/grafana)|
|**`supabase/supabase`** (apps/studio) — **mest jämförbar stack**|**Ingen mock-klass alls.** Lokal efemär stack per CI-jobb: `supabase stop --all` + `supabase start`. Ett jobb, matrix `framework × shardIndex` = 4 legs. 28 spec-filer, varav **5 rör `page.route`** → 82 % ren skarp stack.|`.claude/skills/studio-e2e-tests/SKILL.md` rad 404–412: *"The key difference is cold start vs warm state. ### CI (cold start) Tests run from a blank database slate. Each test run resets the database and starts fresh containers."*|[`github.com/supabase/supabase`](https://github.com/supabase/supabase)|
|**calcom/cal.com**|**Ren skarp, noll `page.route(` i hela repot.** Postgres + mailhog som GitHub-Actions `services:` per jobb. Fem separata workflows anropade från `pr.yml`, speglande Playwright-`projects` (web / app-store / embed-core / embed-react). 66 spec-filer. E2E körs bara på PR med labeln `ready-for-e2e`.|Ingen skriven mock-motivering funnen. Uppdelningen är teknisk: embed-projekten kräver egna webServers.|[`github.com/calcom/cal.com`](https://github.com/calcom/cal.com)|
|**PostHog/posthog** — **bästa skrivna motiveringen i hela passet**|Ett Playwright-project mot full lokal stack (Postgres, Redis, Kafka, ClickHouse, MinIO). Hermetisk yta ligger i **andra verktyg** (Jest, Storybook), inte i en andra Playwright-klass. 42 spec-filer, 6 rör `page.route`. Kvarantän-reporter i configen.|`playwright/README.md` rad 47–62: *"This suite is expensive ... every spec costs PR runtime, runner credits, and a slice of the team's flake budget."* · *"If a regression would surface in a Jest + kea test, a Storybook story, an API integration test ... write it there instead."* · *"If a failure can be diagnosed without reading a backend log, the test probably didn't need the backend."* · *"The suite stays small on purpose; the bigger it gets, the noisier the flake signal becomes."*|[`github.com/PostHog/posthog`](https://github.com/PostHog/posthog)|
|**`microsoft/playwright`** (sig självt)|Helt hermetiskt — egen lokal HTTP-testserver i `tests/config/testserver/`, ingen extern backend. 533 spec-filer. Uppdelningen går per **yta och browser** (`tests_primary`, `tests_secondary`, `tests_components`, `tests_mcp`, `tests_bidi`, `tests_installation`), aldrig per mock kontra skarp.|Ingen skriven motivering funnen — hermeticiteten är arkitektonisk, inte policy-formulerad.|[`github.com/microsoft/playwright`](https://github.com/microsoft/playwright)|
|*Kontrast:* **excalidraw/excalidraw**|**Ingen Playwright alls i CI.** `test.yml` är 19 rader och kör bara vitest/jsdom.|—|[`github.com/excalidraw/excalidraw`](https://github.com/excalidraw/excalidraw)|

### Vad precedenten faktiskt visar

**Efemär backend per körning dominerar.** Alla fem backend-bärande projekt
startar en färsk backend per CI-jobb: docker compose (Ghost), `supabase start`
(Supabase), GitHub `services:` (cal.com), egen server-process (Grafana), full
stack-boot (PostHog). **Ingen kör e2e mot delad staging.**

**Delad muterbar staging med global mutex: hittade INGEN.** Varje
`concurrency:`-block som lästes — Supabase, cal.com, Grafana, Ghost, PostHog
och Playwright själv — är superseding-typen `cancel-in-progress: true` för
kostnadskontroll, inte ömsesidig uteslutning. Vår `group: staging-tests` +
`queue: max` i `ci-suite.yml` rad 165–167 saknar motsvarighet i materialet.
Grafana löser "får inte köra samtidigt" i **configen** med Playwright-
`dependencies:` mellan projects, inte i CI.

**Mock-linjen inom en skarp svit är konsekvent.** Man mockar bara (a) det som
inte finns i den lokala stacken, (b) icke-deterministiskt eller tredjeparts (AI,
funktionsflaggor), (c) tillstånd som är orimligt dyrt att provocera äkta.
Supabase mockar exempelvis AI-titelgenerering med kommentaren *"intercept AI
title generation to prevent flaky tests"*. **Aldrig det systemet under test
äger.** Mock-andelarna: Supabase 5/28 filer, PostHog 6/42, cal.com 0/66, Grafana
runt noll per uttrycklig policy.

**Vår manöver har två raka precedent — Ghost och Grafana.** Båda har brutit ut en
hermetisk klass till ett eget, snabbt, backend-fritt CI-jobb med **egen
**Playwright-config**, och behållit en shardad skarp svit. Viktningen skiljer sig
radikalt (81:82 mot 1:208) — det finns alltså ingen rätt kvot, bara en funktion
av vad produkten är.

**Två återanvändbara detaljer:**

1. **Ghosts hermeticitets-vakt är hårdare än vår.**
   `apps/admin-x-framework/src/test/acceptance.ts` rad 55 routar hela
   `/ghost/api/admin/`, och rad 70–80 svarar **HTTP 418** på varje omockad
   request med texten *"No matching mock found. If this request is needed for the
   test, add it to your mockApi call"*. Vår `hermetic.ts` gör `route.abort(
   'blockedbyclient')` — testet ser ett generiskt nätverksfel, inte en
   instruktion.
2. **Grafanas hermetiska jobb saknar `needs:` på build.** Det är vad som gör den
   klassen strukturellt snabb: den väntar inte på något.

## Vad det betyder för OSS

### Utbrytningen har stöd — men motiveringen måste vara rätt

Vår topologi (en delad muterbar staging, en global mutex, 9,25 min per körning
varav 84 % är e2e-steget) är den lägst rankade i Googles egen ranking och står på
Thoughtworks HOLD-lista. Playwrights enda skrivna villkor för en delad miljö —
*"make sure it doesn't change"* — bryter vi mot per definition, eftersom sviten
skriver. Det är en stark grund.

Vad grunden **inte** är: att mock är förstahandsvalet. Litteraturen och all
verifierad precedent säger motsatsen. Den ärliga motiveringen för mock-vägen är
att den branschnormala vägen ut — efemär skarp backend — är **delvis stängd för
oss**: Airtable-basen är inte självhostbar. Den motiveringen håller, men bara om
den skrivs ut. Skriver ADR:n i stället "hermetisk är bäst praxis" blir den
falsifierbar på fem minuter.

### Klassbytet är beslutet, inte optimeringen

De 19 filerna mockar Edge-funktioner **vi själva äger**. Det är precis vad
Supabase, PostHog och cal.com aldrig gör. Konsekvensen är inte att manövern är
fel — Ghost gör exakt detta — utan att **resultatet inte längre är e2e i
precedentens mening**. Ghost kallar sin motsvarande klass *acceptance tests*, i
egen katalog, egen config, eget jobb.

Rekommendationen som följer: **ge den utbrutna klassen ett eget namn och en egen
katalog.** Kallas den fortfarande e2e kommer nästa läsare — och nästa agent — att
tro att den bevisar saker den inte bevisar. Detta är ett ORDLISTA-ärende lika
mycket som ett ADR-ärende.

### 19/13 mot precedenten

Vår föreslagna uppdelning (19 hermetiska, 13 skarpa) ger 59 % hermetiskt. Det
ligger mellan Ghosts 50 % och Grafanas 0,5 % och är alltså **inom
precedent-rymden**. Men kvoten bär ingenting. Vad precedenten faktiskt ger är
kriteriet, och där ser vår uppdelning annorlunda ut än normen:

|Fråga|Precedentens svar|Vårt läge|
|---|---|---|
|Vad mockas?|Det den lokala stacken inte har, tredjeparts, icke-deterministiskt|Våra egna Edge-funktioner|
|Var går den skarpa gränsen?|Vid systemgränsen mot andras system|Vid vår egen adapter|
|Vad kallas klassen?|Acceptance (Ghost) / storybook (Grafana)|e2e — **bör omprövas**|
|Hur isoleras skarp körning?|Färsk backend per jobb|Delad bas + purge-jobb före|

Två delar av uppdelningen är redan avgjorda och står kvar:

- **Font-pinningen bär 86 % av restrafiken (747 av 865 anrop) och gör 19 av 32
  filer rena på egen hand.** Google Fonts är per Playwrights egen regel ett
  *"third party server that you do not control"* — pinningen är inte en genväg,
  den är den skrivna rekommendationen. Mekanismen finns färdig i
  `tests/visual/support/hermetic.ts`.
- **`skapa-event` ska inte flyttas.** Den skriver skarpt till staging, och det är
  dess syfte (bokfört i
  [hermetik-mätningen](hermetik-matning-steg1-2026-07-26.md) § Falsifierat).

### Zod-schemana är halva kontraktet, inte hela

Vi har redan det som MSW rankar högst i anda: samma zod-schema parsar både fixtur
och skarpt svar. Det fångar **form-drift** (fält försvinner, typ ändras). Det
fångar inte:

1. **Värde-drift.** Fältet finns, semantiken har ändrats. Schemat är blint.
2. **Schemats egen drift.** Schemat är *vår bild* av Edge-funktionen, inte
   funktionens deklaration. Ändras funktionen och schemat samtidigt, i samma
   commit, av samma person — då är fixturen fortfarande grön och ingen signal
   uppstår. Det är exakt Googles *"there is no signal"*.

**Den billigaste vakten som faktiskt stänger detta, och den passar oss ovanligt
väl:** en **nattlig, icke-blockerande kontraktsvakt** som kör fixturerna mot
skarp staging och jämför. Fowlers kadens (*"once a day is plenty"*) och
fail-semantik (*"shouldn't necessarily break the build"*) matchar en nightly
exakt — och vi har redan en. Ytan är dessutom liten: tre endpoints
(`get-event-notes`, `get-registrations`, `get-events`) bär 104 av 118 skarpa
restanrop.

**Detta är passets starkaste konkreta rekommendation: bryt inte ut utan att para
utbrytningen med kontraktsvakten.** Utan den är utbrytningen precis det Google
beskriver som den tysta felklassen.

### Vakten bör skärpas medan vi ändå är i filen

Ghosts 418-svar med instruktionstext är en direkt förbättring av vårt
`route.abort('blockedbyclient')`. Vår visuella ram har redan halva mönstret —
omockade Edge-funktioner svarar 501 med namnet i klartext. **Utvidga samma form
till catch-all-vakten** så ett läckande anrop säger vad som ska göras, inte bara
att något gick fel.

## Argument MOT hermetisering — ärligt återgivna

Materialet ska vara tvåsidigt. Motståndarsidans bästa case, källbelagt:

1. **"Grönt betyder bara att koden funkar OM mocken beter sig exakt som
   verkligheten."** Googles Testing on the Toilet, ordagrant: *"the only
   assurance you get with your tests is that your code will work if your mocks
   behave exactly like your real implementations."*
   ([2013](https://testing.googleblog.com/2013/05/testing-on-toilet-dont-overuse-mocks.html))
   Förstärkt i ch13: *"there is no way to guarantee that the contract is correct
   (i.e., that the stubbed function has fidelity to the real implementation)."*
2. **Mockar ruttnar tyst.** *"mocks become stale ... there is no signal"* (ch14).
   Mock-verktygets egen dokumentation säger samma sak: *"You write mocks to
   describe a server behavior fixed in time. But as time goes on, that behavior
   may change, potentially rendering your mocks obsolete."*
   ([mswjs.io](https://mswjs.io/docs/recipes/keeping-mocks-in-sync/))
3. **Googles institutionella dom över mock-eran.** *"One lesson we learned the
   hard way is the danger of overusing mocking frameworks"* och *"though these
   tests were easy to write, we suffered greatly given that they required
   constant effort to maintain while rarely finding bugs."* (ch13) Plus
   begreppet *change-detector tests* — tester som *"fail in response to any
   change to the production code, even if the behavior of the system under test
   remains unchanged."*
4. **Förstaparts-erkännanden om paritetsgap — det hårdaste som går att citera.**
   `stripe/stripe-mock`: *"does not attempt to reproduce the behavior of the real
   Stripe API at all ... its responses are completely hardcoded"* och *"It cannot
   reject all invalid requests."*
   ([`github.com/stripe/stripe-mock`](https://github.com/stripe/stripe-mock))
   Firebase-emulatorn: *"The emulator does not currently implement all
   transaction behavior seen in production"* och *"does not enforce all limits
   enforced in production."*
   ([firebase.google.com](https://firebase.google.com/docs/emulator-suite/connect_firestore))
   Mock-byggarna säger det själva.
5. **MSW-författarens egen position: mocka inte i e2e.** *"Mocking any part of
   the system itself in an end-to-end test contradicts the purpose of this
   testing level: to ensure the system's functionality as a whole"* och *"If you
   can omit mocking, omit mocking."* (Artem Zakharchenko, skapare av MSW —
   [dev.to, tredjeparts-plattform](https://dev.to/kettanaito/when-should-i-not-use-mocks-in-testing-544e))
6. **Mocken sitter före adaptern.** Dodds, konkret: *"how do you know that
   `client` didn't just recently change its API to accept a `body` instead of
   `data`?"* och *"...is lacking an assertion that the `headers` has a
   `Content-Type` of `application/json`."*
   ([stop-mocking-fetch](https://kentcdodds.com/blog/stop-mocking-fetch))
7. **Den tredje vägen: efemär skarp backend.** Testcontainers position: skriv
   tester som beror på samma tjänster som i produktion *"without mocks or
   in-memory services"*, eftersom *"In-memory services may not have all the
   features of your production service and behave slightly differently"*
   ([testcontainers.com](https://testcontainers.com/getting-started/)).

### Förlustlistan — vad mocken per definition inte kan fånga

|Förlust|Belägg|
|---|---|
|CORS och preflight|`route.fulfill` går fortfarande genom browserns CORS-kontroll; utan korrekta huvuden hänger anropet tyst|
|Auth-huvuden, `Content-Type`, request-kroppens form|Dodds, *stop-mocking-fetch*|
|Service-worker-lagret|Playwright: en service worker *"takes over the network requests, hence making them invisible to `browserContext.route()` and `page.route()`"* (`playwright.dev/docs/network`, länk i källförteckningen)|
|Serialisering, null-hantering, typkonvertering|Google ch14, *Unfaithful Doubles*|
|Gränser: paginering, batch-tak, rate limiting|Firebase-emulatorn: *"may allow transactions that would be rejected as too large by the production service"*|
|Faktisk latens, timeouts, race conditions|Google ch14: *Issues under load* + *Emergent behaviors* (*"they deliberately eliminate the chaos of real dependencies, network, and data"*)|
|Schema-drift i backend|Google ch14, MSW|
|Avvisning av felaktiga anrop|stripe-mock: *"It cannot reject all invalid requests"*|

### Var motståndarsidan är svag mot just vårt fall

Ärligheten ska gå åt båda håll:

- **Rainsberger är fel vittne.** Hans *"Integrated Tests Are A Scam"* argumenterar
  MOT skarp backend i tester, inte för — hans grund är kombinatorisk
  vägexplosion.
  ([blog.thecodewhisperer.com, tredjeparts](https://blog.thecodewhisperer.com/permalink/integrated-tests-are-a-scam))
- **Spotifys honeycomb likaså.** De rekommenderar *"a few Implementation Detail
  Tests and even fewer Integrated Tests (ideally none)"*.
- **Googles ch13-kritik träffar interaktionstester, inte nätverksstubbar.**
  Change-detector-problemet uppstår när man asserterar på *anrop*. En
  `page.route`-stub som asserterar på renderad UI är en fake vid systemgränsen —
  och Googles eget TotT-inlägg pekar ut *"a hermetic local server"* som
  lösningen.
- **Fidelitetsexponenten i ch14 förutsätter många dubblar** (N tjänster). En
  frontend har en gräns. N = 1.
- **Cypress egen rekommendation är hermetisk-majoritet:** riktiga svar *"Use
  sparingly"*, stubbade *"Use for the vast majority of tests"*
  ([docs.cypress.io](https://docs.cypress.io/app/guides/network-requests)) — även
  om de listar *"No guarantee your stubbed responses match the actual data the
  server sends"* som nackdel.
- **Marginalnyttan är liten vid vårt utgångsläge.** 296 av 332 tester mockar
  redan. Trohetsförlusten av utbrytningen är den skillnad 118 restanrop gör — och
  de restanropen är **sido-anrop** (notes, registrations, formats), inte
  huvudflöden. Där motståndarsidan biter hårt är på **skarpa skrivvägar mot en
  bas vars schema kan ändras utanför repot**. Det är precis `skapa-event`, som
  inte flyttas.
- **Efemär-vägen är principiellt stark men praktiskt smal för oss.** Ingen
  primärkälla visar ett efemärt mönster för en **icke-självhostbar
  SaaS-backend**. `supabase start` löser Edge-funktions-lagret; Airtable-basen
  bakom förblir extern. Alternativet kollapsar då till en dedikerad bas per
  körning — samma klass som staging, fast dyrare i API-kvot och långsammare.

## Öppna frågor

1. **Är efemär Edge-funktions-stack en fjärde väg som inte prövats?**
   `supabase start` kör funktionerna lokalt; Airtable-lagret bakom förblir det
   som inte kan bli efemärt. Frågan är om en lokal funktions-stack mot en
   dedikerad Airtable-bas ger något som varken delad staging eller mock ger.
   **Ej prövat i detta pass.** Bör besvaras innan ADR:n låser mock-vägen som enda
   utväg.
2. **Vad ska den utbrutna klassen heta?** Ghost-precedenten säger *acceptance*,
   inte *e2e*. Namnet styr vad framtida läsare tror att sviten bevisar.
3. **Vilken form ska kontraktsvakten ha?** Tre endpoints bär 104 av 118 skarpa
   anrop — räcker de? Ska vakten jämföra hela svar eller enbart schema? Fowlers
   fail-semantik (icke-blockerande) mot vår nuvarande grind-kultur är ett eget
   litet beslut.
4. **Kan Edge-funktionerna deklarera sitt schema i stället för att vi speglar
   det?** MSW rankar spec-först högst just för att runtime-spegling ärver
   backendens fel. Det skulle göra zod-schemat till kontrakt i stark mening.
5. **Hur mycket kortare blir mutexen faktiskt?** Tidsbudget-passet uppskattar
   9,25 → cirka 2,4 min. Den siffran är beräknad, inte uppmätt efter utbrytning.
6. **Ska catch-all-vakten byta från `abort` till 418 med instruktionstext?**
   Ghost-mönstret är bättre; kostnaden är okänd men sannolikt låg.

## Källförteckning

### Förstaparts — Google

- [Software Engineering at Google, ch11 (Testing Overview)](https://abseil.io/resources/swe-book/html/ch11.html)
  — storleksklassning, hermeticitet, 1 %-flakiness-tröskeln, delad databas
- [ch13 (Test Doubles)](https://abseil.io/resources/swe-book/html/ch13.html) —
  preferensordning, tre-egenskapstestet, fakes egna tester, change-detector-tests
- [ch14 (Larger Testing)](https://abseil.io/resources/swe-book/html/ch14.html) —
  SUT-topologi-ranking, *"mocks become stale"*, fidelitet mot hermeticitet
- [Just Say No to More End-to-End Tests (2015)](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
  — 70/20/10, tio-e2e-tankeexperimentet
- [Flaky Tests at Google (2016)](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)
  — 1,5 % / 16 % / 84 %
- [Where Do Our Flaky Tests Come From (2017)](https://testing.googleblog.com/2017/04/where-do-our-flaky-tests-come-from.html)
- [TotT: Don't Overuse Mocks (2013)](https://testing.googleblog.com/2013/05/testing-on-toilet-dont-overuse-mocks.html)

### Förstaparts — Martin Fowler

- [TestPyramid](https://martinfowler.com/bliki/TestPyramid.html) ·
  [IntegrationTest](https://martinfowler.com/bliki/IntegrationTest.html) ·
  [BroadStackTest](https://martinfowler.com/bliki/BroadStackTest.html) ·
  [UnitTest](https://martinfowler.com/bliki/UnitTest.html)
- [ContractTest](https://martinfowler.com/bliki/ContractTest.html) —
  kontraktsvaktens kadens och fail-semantik
- [SelfInitializingFake](https://martinfowler.com/bliki/SelfInitializingFake.html)
- [Practical Test Pyramid (Vocke)](https://martinfowler.com/articles/practical-test-pyramid.html)
- [On the Diverse And Fantastical Shapes of Testing (2021)](https://martinfowler.com/articles/2021-test-shapes.html)
- [Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html)
- [Consumer-Driven Contracts (Ian Robinson)](https://martinfowler.com/articles/consumerDrivenContracts.html)

### Förstaparts — verktyg och leverantörer

- [Best Practices](https://playwright.dev/docs/best-practices) — *only test what
  you control*, staging-villkoret
- [Mock APIs](https://playwright.dev/docs/mock) — `routeFromHAR`, inspelning och
  uppspelning
- [Network](https://playwright.dev/docs/network) — `route.abort/fulfill`,
  service-worker-fällan
- [Test retries](https://playwright.dev/docs/test-retries) — flaky-definitionen
- [class-BrowserContext](https://playwright.dev/docs/api/class-browsercontext) —
  `notFound` *"Defaults to abort"*
- [docs.pact.io — how_pact_works](https://docs.pact.io/getting_started/how_pact_works)
  ·
  [what_is_pact_good_for](https://docs.pact.io/getting_started/what_is_pact_good_for)
  ·
  [using_pact_to_support_ui_testing](https://docs.pact.io/consumer/using_pact_to_support_ui_testing)
- [mswjs.io — keeping mocks in sync](https://mswjs.io/docs/recipes/keeping-mocks-in-sync/)
- [testcontainers.com](https://testcontainers.com/getting-started/) ·
  [docs.cypress.io — network requests](https://docs.cypress.io/app/guides/network-requests)
- [stripe/stripe-mock](https://github.com/stripe/stripe-mock) ·
  [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [docs.gitlab.com — unhealthy tests](https://docs.gitlab.com/development/testing_guide/unhealthy_tests/)

### Förstaparts — Kent C. Dodds

- [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
  ·
  [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
  · [Stop mocking fetch](https://kentcdodds.com/blog/stop-mocking-fetch)

### Förstaparts — repon lästa i källan (CI-konfiguration och testkod)

- [TryGhost/Ghost](https://github.com/TryGhost/Ghost) —
  `.github/workflows/ci.yml` rad 764 + 1519, `e2e/playwright.config.mjs` rad
  5–24, `apps/admin-x-framework/src/test/acceptance.ts` rad 55 + 70–80
- [grafana/grafana](https://github.com/grafana/grafana) —
  `.github/workflows/pr-e2e-tests.yml` rad 123 + 156,
  `contribute/style-guides/e2e-playwright.md` rad 8
- [`supabase/supabase`](https://github.com/supabase/supabase) —
  `.github/workflows/studio-e2e-test.yml`, `e2e/studio/playwright.config.ts`,
  `.claude/skills/studio-e2e-tests/SKILL.md` rad 404–412
- [calcom/cal.com](https://github.com/calcom/cal.com) —
  `.github/workflows/e2e.yml` rad 45–94, `pr.yml` rad 375–408
- [PostHog/posthog](https://github.com/PostHog/posthog) — `playwright/README.md`
  rad 47–62, `playwright/playwright.config.ts`
- [`microsoft/playwright`](https://github.com/microsoft/playwright) —
  `.github/workflows/tests_primary.yml`, `tests/config/testserver/`
- [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) —
  `.github/workflows/test.yml`

### Tredjeparts (markerade som sådana)

- [Uber — SLATE](https://www.uber.com/en-DK/blog/simplifying-developer-testing-through-slate/)
- [Meta — Probabilistic Flakiness](https://engineering.fb.com/2020/12/10/developer-tools/probabilistic-flakiness/)
- [Spotify — Test Flakiness](https://engineering.atspotify.com/2019/11/test-flakiness-methods-for-identifying-and-dealing-with-flaky-tests)
- [Thoughtworks Radar — Enterprise-wide integration test environments (Hold)](https://www.thoughtworks.com/radar/techniques/enterprise-wide-integration-test-environments)
- [Lam m.fl., ISSTA 2019 (Microsoft Research) — RootFinder](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/11/LamETAL19RootFinder.pdf)
- [Spadini m.fl. — To Mock or Not To Mock](https://mauricioaniche.com/publications/to-mock-or-not-to-mock/)
- [PactFlow — A disastrous tale of UI testing with Pact](https://pactflow.io/blog/a-disastrous-tale-of-ui-testing-with-pact/)
- [Rainsberger — Integrated Tests Are A Scam](https://blog.thecodewhisperer.com/permalink/integrated-tests-are-a-scam)
- [Zakharchenko — When should I not use mocks](https://dev.to/kettanaito/when-should-i-not-use-mocks-in-testing-544e)

### Lokala artefakter (lästa på disk, ej ändrade)

- [`hermetik-matning-steg1-2026-07-26.md`](hermetik-matning-steg1-2026-07-26.md)
  — 865 restanrop, 19/13-uppdelningen, `skapa-event`-fyndet
- [`staging-svitens-tidsbudget-2026-07-26.md`](staging-svitens-tidsbudget-2026-07-26.md)
  — 9,25 min, e2e-steget som 84 %
- `tests/visual/support/hermetic.ts` — den bevisade hermetiska ramen
- `playwright.config.ts`, `.github/workflows/ci-suite.yml` rad 149–167 —
  projekt-uppdelning och `queue: max`-mutexen

## Vad detta pass INTE kunde belägga

Räkningen fejkas aldrig. Fem punkter står öppna:

1. **Ingen skriven norm för andelen hermetisk e2e existerar** i någon primärkälla
   som söktes. Frågan besvaras med kriterier, aldrig med en siffra.
2. **Ingen namngiven, daterad förstaparts-post-mortem där mock-drift orsakade en
   produktionsincident.** Sökt via post-mortems, GitHub-issues och
   ingenjörsbloggar. Det som finns är paritetserkännanden från mock-byggare
   (stripe-mock, Firebase), Googles erfarenhetsutsaga, och leverantörsmaterial
   som beskriver mekanismen hypotetiskt. **Använd inte formuleringen "det finns
   dokumenterade incidenter" i ADR:n** — den håller inte.
3. **Ingen kvantifiering av hur mycket realism som förloras vid hermetisering.**
   Avvägningen beskrivs kvalitativt i varje källa, aldrig numeriskt.
4. **Inget precedent för efemär skarp backend mot en icke-självhostbar
   SaaS-backend.** Det är exakt vår Airtable-situation, och rymden är genuint
   tom — inte otillräckligt sökt.
5. **Inget projekt hittat som kör e2e mot delad muterbar staging med
   CI-mutex.** Global kodsökning på mutex-mönstret gav noll relevanta träffar.
   Frånvaro av bevis, inte bevis på frånvaro — men efter sex djupgranskade repon
   och riktad sökning väger frånvaron något.
