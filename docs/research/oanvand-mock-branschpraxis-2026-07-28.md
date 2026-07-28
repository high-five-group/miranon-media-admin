---
owner: marcus803
updated: 2026-07-28
review_by: 2026-10-28
status: stable
---

# Felskriven mock kontra legitimt oanvänd — hur etablerade test-ekosystem skiljer dem åt

> Beställd av Marcus 2026-07-28 (S91) med frågan: **hur skiljer etablerade
> test-ekosystem en felaktigt skriven mock (som aldrig matchar något anrop) från
> en legitimt oanvänd mock — och vilka verktyg exponerar de för det?**
> Bakgrunden är överskuggnings-vakten (`task-62`,
> grenen `feat/task-62-overskuggnings-vakt`), som enligt beställningen fällde
> 36 av 153 tester i 8 av 18 filer, mestadels legitimt. Marcus egen hypotes —
> att rätt kriterium är *"oanvänd handler + adressen trafikerades ändå av någon
> annan handler"* — skulle prövas, inte antas.
>
> Sex ekosystem undersökta mot källkod och förstapartsdokumentation. Fyra
> mätningar körda mot `msw@2.15.0`, versionen repot faktiskt har installerad.

## Kort svar

**Branschen löser det inte med ett skarpare "oanvänd"-kriterium. Den delar upp
problemet i två separata mekanismer och lägger till en explicit ventil.**

1. **Ett trögt oanvänd-test vid teardown**, gjort användbart genom två saker som
   inte är heuristik: en **per-mock opt-out-markering** (Nock `.optionally()`,
   testify `.Maybe()`, Mockito `lenient()`) och ett **scope bredare än ett
   enskilt test** (Mockito räknar en stubbning som använd om *någon* testmetod i
   klassen använde den — vilket är exakt vårt `beforeEach`-fall).
2. **Ett ivrigt nära-träff-test** som fäller i det ögonblick ett inkommande
   anrop *nästan* matchar en registrerad mock. Det är den mekanism som fångar
   den farliga klassen — stavfelet — och den är **inte** samma mekanism som
   oanvänd-testet.

**Hypotesen är rätt i sin idé och fel i sin riktning.** "Ytan trafikerades ändå"
*är* det diskriminerande kriteriet, och det finns implementerat i produktion hos
både Mockito och Pact. Men signalen läses inte av på den oanvända handlerns egen
adress. Vid ett stavfel trafikeras den adressen **aldrig** — det var ju hela
felet. Signalen läses av på det **inkommande anropet**: kom det in ett anrop som
ligger nära en oanvänd registrering? Mätning 1 nedan visar detta svart på vitt.

**Oväntat sidofynd, mätt:** `isUsed` nollställs inte av `resetHandlers()` och
läcker därför mellan tester för handler-objekt som delas på modulnivå — vilket
`handlers.ts` gör. Vakten på `task-62`-grenen råkar redan vara på rätt sida av
detta (den läser bara testets egna överskuggningar), men egenskapen är
odokumenterad och värd att bokföra. Se § 8.

## 1. MSW själv

### Vad som finns i ytan

`msw@2.15.0` har allt råmaterial men ingen färdig mekanism.

- **`RequestHandler.isUsed: boolean`** — dokumenterad som *"Indicates whether
  this request handler has been used (its resolver has successfully executed)"*
  (`node_modules/msw/lib/core/HttpResponse-DL-P1EeG.d.ts` rad 213–218).
- **`SetupApi.listHandlers(): ReadonlyArray<AnyHandler>`** —
  `node_modules/msw/lib/core/experimental/setup-api.d.ts` rad 30. Den är publik
  på basklassen, och `NetworkFixture` är
  `Omit<SetupApi<LifeCycleEventsMap>, 'dispose'> & { … }`
  (`node_modules/@msw/playwright/build/index.d.mts` rad 18) — alltså tillgänglig
  på vår Playwright-fixtur, inte bara på `setupServer`.
- **`handler.info.callFrame`** — varje handler spelar in sitt konstruktions-
  ställe via `getCallFrame(new Error())`
  (`node_modules/msw/lib/core/handlers/RequestHandler.js` rad 51). Mätt: fältet
  fylls med `file:rad:kolumn`.
- **Livscykel-händelser** — `request:match`, `request:unhandled`,
  `response:mocked` m.fl. (`node_modules/msw/lib/core/sharedOptions.d.ts`).
  **Nyttiggörande begränsning:** nyttolasten är `{ request, requestId }` —
  händelsen säger att *någon* handler matchade, aldrig **vilken**
  (`node_modules/msw/lib/core/utils/handleRequest.js` rad 70).

Den nya `defineNetwork`-arkitekturen (PR [#2650][pr2650]) bär `listHandlers()`
vidare i `NetworkHandlersApi`
(`node_modules/msw/lib/core/experimental/define-network.d.ts`), medan
`SetupApi`-klassen är märkt `@deprecated — Preserved only for backward
compatibility`. Ytan vi bygger på överlever alltså namnbytet.

### Mätning: `isUsed` sätts vid predikat-träff, inte vid resolver-slut

Doc-kommentaren säger "its resolver has successfully executed". Implementationen
säger något annat: `RequestHandler.js` rad 138–149 kör `predicate()`, returnerar
`null` vid utebliven träff, och sätter `this.isUsed = true` på rad 149 —
**före** resolvern körs på rad 150. För vårt ändamål är implementationen den
bättre semantiken: flaggan svarar på "matchade denna handler ett anrop", vilket
är exakt frågan vi ställer.

### Vad projektet inte har, och vad underhållarna säger

Det finns **ingen** inbyggd oanvänd-handler-mekanism, inget strict-läge och
inget assertions-API. Det är ett uttalat designval, inte en lucka. Underhållaren
kettanaito i [discussion #1735][msw1735]:

> Currently, MSW does not provide any native APIs to perform request assertions.
> In general, request assertions are discouraged as they often indicate
> implementation detail testing.

Förstapartsdokumentationen är ännu tydligare ([Request assertions][mswassert]):

> We highly discourage against such assertions as they represent implementation
> detail testing and sway you into testing how your application is written
> instead of what it does. […] Instead of asserting that a particular request
> was made, test how your application reacts to that request.

Undantaget de medger är *"one-way requests against third-party services, like
analytics or monitoring"*.

**Tolkning:** MSW-handlers är i Fowlers/Meszaros terminologi **stubbar**, inte
**mockar** (§ 7). En oanvänd stub är per definition inte ett fel. Därför finns
mekanismen inte — och därför måste den, om vi vill ha den, byggas av oss med
öppna ögon om att vi går emot bibliotekets designavsikt i den delen.

`listHandlers()`-dokumentationen bekräftar samma sak: den beskrivs som
*"primarily designed for debugging and introspection purposes"* och nämner
varken `isUsed` eller oanvända handlers ([list-handlers][mswlist]).

## 2. Nock — strikt som default, ventil per mock

Nock är den raka motsatsen till MSW, och skillnaden är strukturell: **en
interceptor är en förväntan som konsumeras**.

Ur [README][nockreadme]:

> By default every mocked request is expected to be made exactly once, and until
> it is it'll appear in `scope.pendingMocks()`, and `scope.isDone()` will return
> false.

Och om assertionen:

> Calls to nock() return a scope which you can assert by calling `scope.done()`.
> This will assert that all specified calls on that scope were performed.

Ventilen är **per mock, explicit**:

> In many cases this is fine, but in some (especially cross-test setup code) it's
> useful to be able to mock a request that may or may not happen. You can do this
> with `optionally()`. Optional requests are consumed just like normal ones once
> matched, but they do not appear in `pendingMocks()`, and `isDone()` will return
> true for scopes with only optional requests pending.

Parentesen *"especially cross-test setup code"* är ordagrant vårt
`beforeEach`-fall. Nocks svar på det är alltså **inte** en smartare heuristik
utan en markering utvecklaren sätter.

## 3. WireMock — diagnostik före grind, och nära-träffar åt två håll

WireMock fäller **inte** på omatchade anrop som default. JUnit 5-extensionen
sätter `failOnUnmatchedRequests = false` i sin default-konstruktor
(`wiremock-junit5/…/WireMockExtension.java` rad 56). Väljer man in det går det
via `checkForUnmatchedRequests()`, som eskalerar till nära-träffar när sådana
finns (`wiremock-core/…/WireMockServer.java` rad 602–612):

```java
public void checkForUnmatchedRequests() {
  List<LoggedRequest> unmatchedRequests = findAllUnmatchedRequests();
  if (!unmatchedRequests.isEmpty()) {
    List<NearMiss> nearMisses = findNearMissesForAllUnmatchedRequests();
    if (nearMisses.isEmpty()) {
      throw VerificationException.forUnmatchedRequests(unmatchedRequests);
    } else {
      throw VerificationException.forUnmatchedNearMisses(nearMisses);
    }
  }
}
```

**Nära-träffen** är WireMocks svar på precis vår farliga klass. Definitionen ur
[dokumentationen][wmverify]:

> A near miss is essentially a pairing of a request and request pattern that are
> not an exact match for each other, that can be ranked by distance.

Avgörande för vår fråga: API:t går **åt båda hållen**.

- `findNearMissesFor(myLoggedRequest)` — för ett omatchat *anrop*, hitta
  närmaste *mönster*. (Detta är vad vår `hermetik-vakt.ts` redan gör.)
- `findNearMissesFor(getRequestedFor(urlEqualTo("/thing-url")) …)` — för ett
  *mönster*, hitta närmaste *anrop*. **Det är den riktning vi saknar.**

Dokumentationen anger uttryckligen att syftet är att hitta *"minor differences
causing match failures, like capitalization errors"* — alltså stavfelsklassen.

**Oanvända stubbar** hanteras separat och som hygien, inte som grind. Frågan
ställdes i [issue #615][wm615] ("Provide a list with unused mappings"), levde
länge som en tredjeparts-extension, och integrerades först nyligen i kärnan via
[PR #2991][wm2991] som två admin-endpoints:

- `GET /__admin/mappings/unmatched` — stubbar som inte matchat något anrop
- `DELETE /__admin/mappings/unmatched` — ta bort dem

Ramningen i issue-tråden är genomgående **städning av döda mappningar**, inte
detektion av felskrivna. En begäran om Mockito-liknande strikthet finns
([issue #1298][wm1298], *"Strictness in wiremock"*, uttryckligen *"inspired from
mockito's strictness feature"*) men är **fortfarande öppen** — WireMock har
alltså medvetet eller av tröghet inte tagit steget.

## 4. Mockito — den närmaste precedenten, och den enda som löser båda halvorna

Mockito är det enda undersökta ekosystemet som har **båda** mekanismerna
namngivna, dokumenterade och separerade. Funktionen heter **strict stubbing** och
styrs av enum `Strictness` (`org/mockito/quality/Strictness.java`):

- `LENIENT` — *"No extra strictness. Mockito 1.x behavior."*
- `WARN` — *"Reports console warnings about unused stubs and stubbing argument
  mismatch"*, med den torra brasklappen *"cleaner tests but only if you read the
  console output"*.
- `STRICT_STUBS` — *"Highly recommended. Planned as default for Mockito v4."*

`STRICT_STUBS` beskrivs i sin javadoc med exakt två beteenden, och de är olika
saker:

> - Improved productivity: the test fails early when code under test invokes
>   stubbed method with different arguments (see `PotentialStubbingProblem`).
> - Cleaner tests without unnecessary stubbings: the test fails when unused stubs
>   are present (see `UnnecessaryStubbingException`).

### 4a. `PotentialStubbingProblem` — hypotesen, i produktion

Javadocen (`org/mockito/exceptions/misusing/PotentialStubbingProblem.java`):

> `PotentialStubbingProblem` is thrown when mocked method is stubbed with some
> argument in test but then invoked with **different** argument in the code.
> This scenario is called "stubbing argument mismatch".

Och om orsaksfördelningen — värd att läsa noga, eftersom den är den enda
kvantifiering någon av källorna vågar sig på:

> The stubbing argument mismatch typically indicates: 1. Mistake, typo or
> misunderstanding in the test code […] 2. Mistake, typo or misunderstanding in
> the code under test […] 3. Intentional use of stubbed method with different
> argument […] User mistake (use case 1 and 2) make up 95% of the stubbing
> argument mismatch cases. […] In remaining 5% of the cases (use case 3)
> `PotentialStubbingProblem` can give false negative signal indicating
> non-existing problem. […] Mockito optimizes for enhanced productivity of 95%
> of the cases while offering opt-out for remaining 5%.

Implementationen är kort nog att citera i sin helhet — det är detta som är
"oanvänd + ytan trafikerades ändå"
(`org/mockito/internal/junit/DefaultStubbingLookupListener.java`):

```java
private static List<Stubbing> potentialArgMismatches(
        Invocation invocation, Collection<Stubbing> stubbings) {
    List<Stubbing> matchingStubbings = new LinkedList<>();
    for (Stubbing s : stubbings) {
        if (UnusedStubbingReporting.shouldBeReported(s)
                && Objects.equals(
                        s.getInvocation().getMethod().getName(),
                        invocation.getMethod().getName())
                // If stubbing and invocation are in the same source file we assume they are in
                // the test code,
                // and we don't flag it as mismatch:
                && !Objects.equals(
                        s.getInvocation().getLocation().getSourceFile(),
                        invocation.getLocation().getSourceFile())) {
            matchingStubbings.add(s);
        }
    }
    return matchingStubbings;
}
```

Tre saker att ta med sig:

1. **"Ytan" är grövre än mönstret.** Jämförelsen görs på **metodnamnet**, inte på
   argumenten. Argumenten är ju det som skiljer — hade de ingått i jämförelsen
   hade ingenting någonsin matchat.
2. **Kontrollen är ivrig, inte post-hoc.** Den körs vid uppslaget, i det ögonblick
   ett anrop inte hittar sin stubbning — inte vid teardown. Felet kan därför
   peka ut både anropet och stubbningen med rad och fil.
3. **Det finns en falsklarms-ventil inbakad i själva predikatet** —
   käll-fils-heuristiken. Även Mockito behövde en.

Felmeddelandets form, ur [issue #769][mockito769] (funktionens designtråd):

```text
org.mockito.exceptions.misusing.PotentialStubbingProblem:
Strict stubbing argument mismatch. Please check:
- this invocation of 'simpleMethod' method:
    mock.simpleMethod("Foo");
      -> at … StrictStubbingEndToEndTest.java:101
- has following stubbing(s) with different arguments:
    1. mock.simpleMethod("foo");
      -> at … StrictStubbingEndToEndTest.java:100
Typically, stubbing argument mismatch indicates user mistake when writing tests.
Mockito fails early so that you can debug potential problem easily.
```

Exemplet är `"Foo"` mot `"foo"` — ett enda felskrivet tecken, samma klass som vårt
`get-persosn`. Meddelandet namnger **båda ställena**: anropet och stubbningen.

### 4b. `UnnecessaryStubbingException` — och svaret på vårt `beforeEach`-problem

Javadocen (`org/mockito/exceptions/misusing/UnnecessaryStubbingException.java`)
avslutas med precis vårt fall:

> Mockito JUnit Runner triggers `UnnecessaryStubbingException` **only when none
> of the test methods use the stubbings**. This means that it is ok to put
> default stubbing in a 'setup' method or in test class constructor. That default
> stubbing needs to be used at least once by one of the test methods.

Det är alltså inte en heuristik som gissar. Det är en **scope-vidgning**: kontroll
per *klass*, inte per *test*. Kontrollen körs en gång för hela klassen
(`UnnecessaryStubbingsReporter.validateUnusedStubs(testClass, notifier)`) över
alla mockar som skapades under klassens körning.

Mekaniken som får det att fungera trots att setup-metoden skapar nya objekt per
test är **de-duplicering på deklarationsställe**
(`org/mockito/internal/junit/UnusedStubbingsFinder.java`):

> Gets unused stubbings per location. […] It considers that stubbings with the
> same location (e.g. ClassFile + line number) are the same. This is not
> completely accurate because a stubbing declared in a setup or constructor is
> created per each test method. […] **Stubbing declared in constructor but
> realized in % of test methods is considered as 'used' stubbing.**

Algoritmen är två pass: samla först alla *locations* för stubbningar som
användes, rapportera sedan bara de locations som inte finns i den mängden.

**Detta är direkt portabelt till oss.** MSW:s `handler.info.callFrame`
(`RequestHandler.js` rad 51, mätt fungerande) är exakt motsvarigheten till
Mockitos `Location`.

Ventilen är en stege med tre steg, per stubbning, per mock, per testklass
(`Mockito.lenient()`, `MockSettings.lenient()`, `MockitoJUnit`/`MockitoSession`),
och `UnusedStubbingReporting.shouldBeReported()` är en rad:

```java
return !stubbing.wasUsed() && stubbing.getStrictness() != Strictness.LENIENT;
```

## 5. gomock och testify — förväntningar, inte stubbar

Båda är expectation-mockar i klassisk mening: allt som deklareras **ska** hända.

**gomock** (`uber-go/mock`, `gomock/controller.go` rad 242–292):

```go
// Finish checks to see if all the methods that were expected to be called were called.
```

Vid teardown körs `ctrl.expectedCalls.Failures()` och varje kvarvarande
förväntan rapporteras som `missing call(s) to %v`, följt av `aborting test due to
missing call(s)`. Det finns ingen "kanske"-nivå; man uttrycker valfrihet med
`.Times(0)`/`.AnyTimes()` på förväntan själv.

**testify** (`stretchr/testify`, `mock/mock.go` rad 620–652). `AssertExpectations`
itererar över alla `On(...)`-deklarationer och kräver att var och en infriats.
Ventilen ligger i predikatet (rad 652):

```go
if !call.optional && !m.methodWasCalled(call.Method, call.Arguments) && call.totalCalls == 0 {
```

och sätts av `Maybe()` (rad 190–197), vars docstring är hela mönstret i två
meningar:

> Maybe allows the method call to be optional. Not calling an optional method
> will not cause an error while asserting expectations.

**Slutsats för vår del:** dessa två bidrar inte med någon diskrimineringsteknik.
De bidrar med bekräftelsen att **när en oanvänd mock ska vara ett fel, är
lösningen på legitima undantag alltid en explicit markering per mock** — aldrig
en heuristik.

## 6. Pact — den enda som har taxonomin färdig

Pacts konsument-sidiga verifiering delar utfallet i **tre** namngivna klasser,
inte två (`pact-mock_service/lib/pact/mock_service/request_handlers/verification_get.rb`):

```ruby
{
  "Incorrect requests" => verification.interaction_mismatches_summaries,
  "Missing requests"   => verification.missing_interactions_summaries,
  "Unexpected requests"=> verification.unexpected_requests_summaries,
}
```

- **Missing requests** = deklarerad interaktion som aldrig skedde (= oanvänd mock)
- **Unexpected requests** = anrop utan matchande interaktion (= vår hermetik-vakt)
- **Incorrect requests** = anrop som *nästan* matchade en interaktion (= den
  farliga klassen)

Och nyckelraden, som gör klasserna ömsesidigt uteslutande
(`interactions/verification.rb`):

```ruby
def missing_interactions
  expected_interactions - actual_interactions.matched_interactions - @actual_interactions.interaction_mismatches.collect(&:candidate_interactions).flatten
end
```

En oanvänd förväntan som **var kandidat** för ett inkommande anrop *subtraheras
bort* från "missing" och rapporteras i stället som "incorrect", med en diff.
Detta är hypotesens idé, implementerad och namngiven.

Vad "kandidat" betyder är den operativt viktigaste detaljen i hela passet
(`interactions/expected_interactions.rb` → `find_candidate_interactions` anropar
`matches_route?`, definierad i `pact-support/lib/pact/consumer_contract/request.rb`
rad 33–38):

```ruby
def matches_route? actual_request
  route = {:method => method.upcase, :path => path}
  other_route = {:method => actual_request.method.upcase, :path => actual_request.path}
  Pact::Matchers.diff(route, other_route).empty?
end
```

**Ytan är metod + path.** Query, headers och body ingår inte. Precis som Mockito
jämför på metodnamn och inte på argument: den grova nyckeln är hela poängen.

## 7. Strict kontra lenient — namn och litteratur

**Ja, begreppen har etablerade namn.** De som återkommer i primärkällorna:

| Begrepp | Betydelse | Ursprung |
|---|---|---|
| strict / lenient mocks | Om odeklarerat eller oinfriat är ett fel | Mockito `Strictness` |
| strict stubbing | Mockitos samlingsnamn för de två kontrollerna | Mockito 2.3.0 |
| unnecessary stubbing | Deklarerad men aldrig använd | `UnnecessaryStubbingException` |
| stubbing argument mismatch | Rätt yta, fel mönster | `PotentialStubbingProblem` |
| near miss | Distansrankad parning anrop/mönster | WireMock |
| pending mocks | Ännu ej konsumerade förväntningar | Nock |

**Kostnaden för strikthet har ett eget namn hos Meszaros.** Ur `Fragile Test`,
underrubriken *Cause: Overspecified Software* (alias *Overcoupled Test*):

> A test says too much about how the software should be structured or behave.
> This is a form of Behavior Sensitivity associated with a style of testing I
> call Behavior Verification. It is characterized by the extensive use of Mock
> Objects to build layer-crossing tests. The main issue is that the tests
> describe how the software should do something, not what it should achieve.
> That is, the tests will only pass if the software is implemented a particular
> way.

Fowler bygger på samma taxonomi i [Mocks Aren't Stubs][fowler] och drar
gränsen som är avgörande för vår fråga: **stubbar** *"provide canned answers to
calls made during the test"* och verifieras genom **state verification**;
**mockar** är *"objects pre-programmed with expectations which form a
specification of the calls they are expected to receive"* och verifieras genom
**behavior verification**. Fowler noterar också att mockist-tester binds hårdare
till implementationen och går sönder vid refaktorering som inte ändrar beteendet.

Google Testing Blog driver samma linje i *Don't Overuse Mocks* och
*Change-Detector Tests Considered Harmful* — kärnan i den senare är att ett test
som måste ändras varje gång koden ändras inte är ett skyddsnät utan en kostnad.

**Sammanvägt:** litteraturen är entydigt skeptisk till att göra stubbar strikta,
och Mockitos egen javadoc erkänner öppet 5 % falsklarm som priset. Ingen av
källorna hävdar att strikthet är gratis. Den som väljer den väljer den med
kostnaden känd och en ventil på plats.

## 8. Prövning av hypotesen — fyra mätningar mot `msw@2.15.0`

Mätningarna kördes med `setupServer` från `msw/node`, samma `RequestHandler`- och
`HandlersController`-kod som Playwright-bindningen använder.

### Mätning 1 — stavfelsfallet. Hypotesen faller

Uppställning: delade handlers för `get-events` och `get-persons`; en
överskuggning med stavfelet `get-eventz`; appen anropar `get-events`.

```text
Svar appen fick: {"kalla":"normallage"}
  isUsed=false GET */functions/v1/get-eventz
  isUsed=true  GET */functions/v1/get-events
  isUsed=false GET */functions/v1/get-persons
```

**Överskuggningen `get-eventz` är oanvänd — och dess adress trafikerades
aldrig.** Det som trafikerades var `get-events`, en *annan* adress. Kriteriet
*"oanvänd handler + adressen trafikerades ändå av någon annan handler"* är alltså
**falskt i precis det fall det skulle fånga**, om "adressen" läses som
överskuggningens egen deklarerade adress.

Kriteriet håller däremot för en angränsande felklass: **glömd värd-joker**
(`'/functions/v1/get-events'` utan `*`). Då är pathen rätt och bara värden fel,
så det trafikerade anropet har identisk path. Vår faktiska incident
(`get-persons` → `get-persosn`, task-59.8) var stavfelsklassen, inte
värd-jokerklassen.

**Rätt formulering är därför den omvända riktningen:** *oanvänd överskuggning +
något anrop som testet faktiskt gjorde ligger nära överskuggningens mönster.*
Det är WireMocks andra `findNearMissesFor`-riktning, Mockitos metodnamns-
jämförelse och Pacts `matches_route?` — alla tre är grova nycklar över det
inkommande anropet, inte exakta uppslag på mockens adress.

### Mätning 2 — `isUsed` läcker mellan tester

Uppställning: modulnivå-array med två handlers (formen i `handlers.ts`); två
separata `setupServer`-instanser byggda ur **samma array**, som två på varandra
följande tester i samma worker.

```text
TEST 1 (anropar get-events)
    true  GET */functions/v1/get-events
    false GET */functions/v1/get-persons

TEST 2 (anropar ENDAST get-persons — ny fixtur, samma array)
    true  GET */functions/v1/get-events
    true  GET */functions/v1/get-persons
```

`get-events` står som använd i test 2, som aldrig rörde den. Orsaken är i källan:
`RequestHandler.reset()` (rad 64–73) rör **inte** `isUsed`, och `restore()`
(rad 79–84) nollställer den bara för `once`-handlers:

```js
restore() {
  if (this.options?.once) {
    this.reset();
    this.isUsed = false;
  }
}
```

**Konsekvens:** `isUsed` är en enkelriktad spärr för handler-objektets livstid.
Varje kontroll som läser `isUsed` på normallägets delade handlers är
strukturellt osund i vår fixturform. Vakten på `task-62`-grenen väljer redan ut
testets egna överskuggningar på objekt-identitet mot normalläget och är därmed på
rätt sida — men egenskapen står inte i MSW:s dokumentation och kostar oss ett
fel om någon senare vidgar vakten.

### Mätning 3 — färska överskuggningar är per-test-korrekta

Samma uppställning, en överskuggning skapad inuti testet, inget anrop alls:

```text
    false GET */functions/v1/get-events   ← överskuggningen, färskt objekt
    true  GET */functions/v1/get-events   ← delad, förorenad från tidigare
    true  GET */functions/v1/get-persons  ← delad, förorenad från tidigare
```

Överskuggningar konstrueras på nytt i varje testkropp och bär därför ingen
historik. Signalen är ren — men bara för dem.

### Mätning 4 — `callFrame` finns och är användbar

```text
header   : GET */functions/v1/get-events
callFrame:     at file:///…/matning-callframe.mjs:2:16
```

Deklarationsstället finns alltså tillgängligt per handler, vilket är precis den
nyckel Mockitos `getUnusedStubbingsByLocation` bygger sin scope-vidgning på.

### Löser branschen det i stället genom smalare registrering?

Frågan ställdes explicit i beställningen. **Nej — och Mockito avvisar det
uttryckligen.** Javadocen säger rakt ut *"it is ok to put default stubbing in a
'setup' method or in test class constructor"*. Nocks `.optionally()`-dokumentation
pekar ut *"cross-test setup code"* som det typiska legitima fallet. Ingen av de
sex undersökta källorna rekommenderar att bryta upp batch-registrering för att
blidka en vakt. Branschen justerar **vakten**, inte testerna.

## Dom

1. **Två mekanismer, inte en.** Att försöka få ett enda kriterium att skilja
   felskriven från legitimt oanvänd är att lösa fel problem. Mockito — den enda
   källan som har båda — håller dem strikt åtskilda: `PotentialStubbingProblem`
   (ivrig, nära-träff, fångar stavfelet) och `UnnecessaryStubbingException`
   (trög, teardown, fångar skräp). De har olika triggers, olika scope och olika
   felmeddelanden.

2. **Hypotesen är rätt i idé, fel i riktning.** "Ytan trafikerades ändå" är rätt
   diskriminator och finns implementerad hos både Mockito och Pact. Men den läses
   av på det **inkommande anropet** mot en **grov nyckel**, inte på mockens egen
   adress. Mätning 1 visar att den bokstavliga formuleringen missar just
   stavfelet.

3. **Legitim oanvändning löses inte med heuristik.** Fyra av fyra ekosystem som
   fäller på oanvända mockar (Nock, Mockito, testify, gomock) har en **explicit
   markering per mock**. Det är den etablerade lösningen, och den är enhällig.

4. **Vårt `beforeEach`-fall har ett färdigt, dokumenterat svar:** vidga
   oanvänd-kontrollen från per test till per fil, med deklarationsstället som
   nyckel. Det är ordagrant Mockitos JUnit-runner-beteende.

5. **Precedent-rymden är inte tunn.** Sex ekosystem, varav fem med relevant
   mekanism i källkod. Kravet på 3+ projekt är uppfyllt med marginal.

6. **Men riktningen går emot MSW:s uttalade designavsikt.** Underhållaren
   avråder från request-assertions. Det gör inte vakten fel — vår fixturvärld har
   en hermetik-invariant MSW inte designade för — men det gör den till **vår**
   utökning, inte bibliotekets.

## Vad jag inte kunde belägga

- **Ingen MSW-issue eller -discussion som efterfrågar oanvänd-handler-detektion.**
  Sökt via GitHubs sök-API på `unused handlers`, `isUsed`, `assert handler
  called`, `verify handler was used`, `strict handlers`, `strict mode handlers
  assert`, `handler never matched typo` — över både issues och discussions. Noll
  träffar på ämnet. **Frånvaro av träffar är inte bevis på att frågan aldrig
  ställts** — den kan ha ställts i Discord, i en stängd tråd eller med ordval jag
  inte gissade.
- **Beställningens siffra 36/153 i 8/18 filer är inte omverifierad av mig.** Jag
  läste vaktens källkod på `feat/task-62-overskuggnings-vakt` men körde inte
  sviten.
- **Huruvida Mockitos scope-vidgning faktiskt skulle ta bort våra 36 fällningar
  är inte mätt.** Resonemanget är strukturellt riktigt men utfallet är en
  förutsägelse, inte en mätning. Den mätningen är billig och bör göras före
  beslut.
- **WireMocks distansalgoritm för nära-träffar är inte läst.** Jag har
  definitionen och API-ytan, inte rankningens matematik. Vår egen Levenshtein-
  tröskel är lånad från TypeScript, inte från WireMock, och de två är inte
  jämförda.
- **Sinon, Jest/Vitest egna mock-ytor, Playwrights `page.route` och Prism/MockServer
  är inte undersökta.** Urvalet följde beställningen.
- **Mockitos "95 % / 5 %" är en siffra utan redovisad metod.** Den citeras som
  projektets egen bedömning, inte som mätdata.
- **Terminologisk avvikelse, noterad utan tolkning:** Mockitos javadoc skriver
  *"false negative signal indicating non-existing problem"* där gängse
  terminologi säger falskt positivt. Jag återger formuleringen som den står.
- **`@msw/playwright` 0.6.7 saknar `.d.ts`-fil** (endast `.d.mts`); typerna
  lästes ur `build/index.d.mts`. Ingen praktisk skillnad, men värt att veta för
  den som söker.

## Rekommendation

**Detta är en rekommendation, inte ett beslut.** Den är min slutsats av
materialet ovan; belägget för varje delsteg står i sin sektion.

### Steg 1 — dela vakten i två, med olika trigger

Behåll `task-62`-vakten som **oanvänd-kontroll** (trög, teardown), men lägg till
en **nära-träff-kontroll** som är den som faktiskt äger stavfelsklassen.
Nära-träffs-motorn finns redan: `narmasteHandler()` /`levenshteinAvstand()` i
`ef-namnforslag.ts` på samma gren. Den är i dag riktad åt ett håll (omatchat
anrop → närmaste handler). Rikta den även åt det andra: **oanvänd överskuggning →
närmaste anrop testet faktiskt gjorde.**

Underlaget för det andra hållet får inte hämtas ur `isUsed` på delade handlers
(mätning 2). Rätt källa är MSW:s livscykel-händelser — `request:match` per test,
som ger en ren lista över trafikerade URL:er utan läckage.

Klassningen bör då bli tredelad som Pacts:

| Utfall | Klass | Åtgärd |
|---|---|---|
| Oanvänd + nära-träff finns | **Sannolikt felskriven** | Fäll högt, namnge båda sidorna |
| Oanvänd + ingen nära-träff | **Sannolikt legitim** | Fäll milt eller inte alls |
| Anrop utan handler | Omockat | Hermetik-vakten, oförändrad |

### Steg 2 — vidga oanvänd-kontrollens scope från test till fil

Aggregera på `handler.info.callFrame` (mätning 4) och rapportera bara
deklarationsställen som **ingen** test i filen använde. Det är Mockitos
`getUnusedStubbingsByLocation`, portad rakt av, och det är det enda steget som
adresserar `beforeEach`-fallet vid roten i stället för att be utvecklaren märka
bort det.

**Mät före du bygger:** kör vakten med per-fil-aggregering över de 8 fällande
filerna och räkna hur många av de 36 som överlever. Faller siffran mot noll är
steg 2 hela lösningen på falsklarmen och `medvetetOanvand` blir en ren
undantagsventil i stället för ett dagligt verktyg.

### Steg 3 — behåll `medvetetOanvand`, men som ventil

Markeringen är redan rätt formad och konvergerar oberoende med branschen: Nocks
`.optionally()`, testifys `.Maybe()`, Mockitos `lenient()`. Kravet på ett
nedskrivet skäl och att markeringen fäller när den blir inaktuell går **utöver**
alla tre — ingen av dem kräver en motivering. Det är en skärpning, inte en
avvikelse.

**Men ventilen får inte vara den primära dämparen.** Behövs den på 36 ställen är
det vakten som är fel kalibrerad, inte testerna. Steg 2 före steg 3.

### Steg 4 — kopiera felmeddelandets form från Mockito

Vår hermetik-vakt lånade redan formen från Ghost. Mockitos strict-stubbing-
meddelande tillför en sak den inte har: **båda ställena namngivna** — det
faktiska anropet *och* den registrering som var nära. Med `callFrame`
tillgänglig kan vi ge exakt det.

### Vad jag avråder från

**Bygg inte hypotesen som den var formulerad.** Exakt-adress-jämförelse mot
delade handlers ger dubbelt fel: den missar stavfelet (mätning 1) och den läser
en förorenad flagga (mätning 2).

**Gör inte registreringen smalare för att blidka vakten.** Ingen källa
rekommenderar det, och Mockito avråder uttryckligen.

## Källförteckning

### Mätt lokalt (`msw@2.15.0`, `@msw/playwright@0.6.7`)

- `node_modules/msw/lib/core/handlers/RequestHandler.js` rad 51, 64–73, 79–84,
  129–149 — `callFrame`, `reset()`, `restore()`, `isUsed`
- `node_modules/msw/lib/core/HttpResponse-DL-P1EeG.d.ts` rad 164, 213–218
- `node_modules/msw/lib/core/experimental/setup-api.d.ts` rad 21–31
- `node_modules/msw/lib/core/experimental/define-network.d.ts` — `NetworkHandlersApi`
- `node_modules/msw/lib/core/experimental/handlers-controller.js` — `currentHandlers()`, `use()`
- `node_modules/msw/lib/core/sharedOptions.d.ts` — `LifeCycleEventsMap`
- `node_modules/msw/lib/core/utils/handleRequest.js` rad 53, 70
- `node_modules/@msw/playwright/build/index.d.mts` rad 18

### MSW

- [Request assertions — mswjs.io][mswassert]
- [`listHandlers()` — mswjs.io][mswlist]
- [Discussion #1735 — Asserting that a request has not been made][msw1735]
- [PR #2650 — feat: use the network source architecture][pr2650]
- [Issue #1782 — `once` handlers flagged as used][msw1782]

### Nock

- [README — Expectations, `.optionally()`, `isDone()`, `pendingMocks()`][nockreadme]

### WireMock

- [Verifying and near misses — wiremock.org][wmverify]
- [`WireMockServer.java` — `checkForUnmatchedRequests()`][wmserver]
- [`WireMockExtension.java` — `failOnUnmatchedRequests = false`][wmext]
- [Issue #615 — Provide a list with unused mappings][wm615]
- [PR #2991 — admin API endpoints to find/remove unmatched stub mappings][wm2991]
- [Issue #1298 — Strictness in wiremock (öppen)][wm1298]

### Mockito

- [`Strictness.java`][mockstrict]
- [`PotentialStubbingProblem.java`][mockpsp]
- [`UnnecessaryStubbingException.java`][mockuse]
- [`DefaultStubbingLookupListener.java`][mockdsll]
- [`UnusedStubbingsFinder.java`][mockusf]
- [`UnnecessaryStubbingsReporter.java`][mockusr]
- [`UnusedStubbingReporting.java`][mockusrep]
- [Issue #769 — Strictness in Mockito][mockito769]

### gomock, testify, Pact

- [`uber-go/mock` — `gomock/controller.go`][gomockctrl]
- [`stretchr/testify` — `mock/mock.go`][testifymock]
- [`pact-mock_service` — `verification_get.rb`][pactverget]
- [`pact-mock_service` — `verification.rb`][pactver]
- [`pact-mock_service` — `expected_interactions.rb`][pactexp]
- [`pact-support` — `request.rb` (`matches_route?`)][pactreq]

### Litteratur

- [Martin Fowler — Mocks Aren't Stubs][fowler]
- [Gerard Meszaros — Fragile Test / Overspecified Software][meszaros]
- [Google Testing Blog — Don't Overuse Mocks][gtbmocks]
- [Google Testing Blog — Change-Detector Tests Considered Harmful][gtbchange]

[mswassert]: https://mswjs.io/docs/recipes/request-assertions
[mswlist]: https://mswjs.io/docs/api/setup-server/list-handlers
[msw1735]: https://github.com/mswjs/msw/discussions/1735
[pr2650]: https://github.com/mswjs/msw/pull/2650
[msw1782]: https://github.com/mswjs/msw/issues/1782
[nockreadme]: https://github.com/nock/nock/blob/main/README.md
[wmverify]: https://wiremock.org/docs/verifying/
[wmserver]: https://github.com/wiremock/wiremock/blob/master/wiremock-core/src/main/java/com/github/tomakehurst/wiremock/WireMockServer.java
[wmext]: https://github.com/wiremock/wiremock/blob/master/wiremock-junit5/src/main/java/com/github/tomakehurst/wiremock/junit5/WireMockExtension.java
[wm615]: https://github.com/wiremock/wiremock/issues/615
[wm2991]: https://github.com/wiremock/wiremock/pull/2991
[wm1298]: https://github.com/wiremock/wiremock/issues/1298
[mockstrict]: https://github.com/mockito/mockito/blob/main/mockito-core/src/main/java/org/mockito/quality/Strictness.java
[mockpsp]: https://github.com/mockito/mockito/blob/main/mockito-core/src/main/java/org/mockito/exceptions/misusing/PotentialStubbingProblem.java
[mockuse]: https://github.com/mockito/mockito/blob/main/mockito-core/src/main/java/org/mockito/exceptions/misusing/UnnecessaryStubbingException.java
[mockdsll]: https://github.com/mockito/mockito/blob/main/mockito-core/src/main/java/org/mockito/internal/junit/DefaultStubbingLookupListener.java
[mockusf]: https://github.com/mockito/mockito/blob/main/mockito-core/src/main/java/org/mockito/internal/junit/UnusedStubbingsFinder.java
[mockusr]: https://github.com/mockito/mockito/blob/main/mockito-core/src/main/java/org/mockito/internal/junit/UnnecessaryStubbingsReporter.java
[mockusrep]: https://github.com/mockito/mockito/blob/main/mockito-core/src/main/java/org/mockito/internal/stubbing/UnusedStubbingReporting.java
[mockito769]: https://github.com/mockito/mockito/issues/769
[gomockctrl]: https://github.com/uber-go/mock/blob/main/gomock/controller.go
[testifymock]: https://github.com/stretchr/testify/blob/master/mock/mock.go
[pactverget]: https://github.com/pact-foundation/pact-mock_service/blob/master/lib/pact/mock_service/request_handlers/verification_get.rb
[pactver]: https://github.com/pact-foundation/pact-mock_service/blob/master/lib/pact/mock_service/interactions/verification.rb
[pactexp]: https://github.com/pact-foundation/pact-mock_service/blob/master/lib/pact/mock_service/interactions/expected_interactions.rb
[pactreq]: https://github.com/pact-foundation/pact-support/blob/master/lib/pact/consumer_contract/request.rb
[fowler]: https://martinfowler.com/articles/mocksArentStubs.html
[meszaros]: http://xunitpatterns.com/Fragile%20Test.html
[gtbmocks]: https://testing.googleblog.com/2013/05/testing-on-toilet-dont-overuse-mocks.html
[gtbchange]: https://testing.googleblog.com/2015/01/testing-on-toilet-change-detector-tests.html
