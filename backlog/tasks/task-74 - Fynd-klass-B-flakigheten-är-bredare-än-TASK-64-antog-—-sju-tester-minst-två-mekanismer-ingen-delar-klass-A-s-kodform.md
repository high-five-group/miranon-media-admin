---
id: TASK-74
title: >-
  Fynd: klass B-flakigheten är bredare än TASK-64 antog — sju tester, minst två
  mekanismer, ingen delar klass A:s kodform
status: To Do
assignee: []
created_date: '2026-07-28 20:33'
updated_date: '2026-07-29 00:39'
labels:
  - ready-for-agent
dependencies: []
ordinal: 154000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-64 lagade klass A: tre rader med mönstret "icke-auto-väntande query följd av icke-retrying assertion", mätt från 3/8 fällningar till 0/8. Klass B är en ANNAN mekanism och står kvar — den föll inte med klass A:s fix, och den är bredare än TASK-64:s beskrivning påstod.

### VAD SOM ÄR MÄTT, INTE ANTAGET

TASK-64:s efter-serie (n=8, workers=8, retries=0, körd 2026-07-28 av bygg-agenten):

  person-detail:137        2/8 före, 2/8 efter — OFÖRÄNDRAD av klass A:s fix
  hem:423                  föll inte alls i 16 körningar
  mer-intresserade:95      föll inte alls i 16 körningar

Efter-serien exponerade dessutom FYRA tester som inte står i TASK-64 alls:

  mer-segment-send:110
  persons-list:95
  event-narvaro:193       (axe)
  event-anteckningar:333  (axe)

Klass B omfattar därmed minst sju tester, inte de tre TASK-64 listade.

### VARNING FRÅN MÄTNINGEN — LÄS FÖRE DU JÄMFÖR TAL

Bygg-agenten rapporterade att svitens körtid drev 107 -> 173 s genom efter-serien. Klass B-raten i den serien kan alltså vara uppblåst av stigande maskinlast snarare än av ett verkligt mönster. Talen ovan får INTE jämföras rakt av mot en ny mätning som körs på en vilande maskin. Första steget i detta kort är att etablera en mätform där lasten är kontrollerad, annars mäts maskinen och inte testerna.

### VAD SOM SKILJER KLASS B FRÅN KLASS A

Klass A var en identifierbar kodform som gick att grepa fram: allTextContents(), getAttribute() och count() följda av assertions som inte retryar. Klass B-testerna bär INTE det mönstret — sökningen över hela tests/acceptance/ gav bara klass A:s förekomster.

Gemensamt för de ursprungliga tre är att de är fokus-tester (fokus -> <h1>), vilket pekar mot assertion-timeout under last snarare än mot en ögonblicksbild-query. Två av de fyra nya är axe-körningar, vilket är en tredje form igen. Klass B kan därför vara flera mekanismer som delar symptom, och det är kortets första fråga att avgöra.

### AVGRÄNSNING MOT T106 — ÄRVD FRÅN TASK-64, GÄLLER FORTFARANDE

T106 (hermetik-självtestets race) kräver självtestläget: onUnhandledRequest-kastet mot toBeFocused-timeouten. Den mekanismen finns inte i normalläge. Orsaken är alltså inte gemensam — men symptomklassen (fokus-assertion med fast timeout under last) delas, och trådarna bör läsas ihop. Slå INTE ihop dem utan att först pröva om orsaken är gemensam.

### VARFÖR KORTET FINNS I STÄLLET FÖR ATT STÄNGAS IN I TASK-64

TASK-64 stängdes för klass A med mätning som håller. Att låta klass B följa med in i den stängningen hade dolt fyra tester som mätningen just avtäckt, bakom ett kort som säger sig vara klart. Registrera, förkasta aldrig tyst — och stäng aldrig något som inte är löst.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mätform med KONTROLLERAD last etablerad först — körtidsdriften 107 till 173 s i TASK-64:s efter-serie får inte upprepas som mätfel; formen redovisad
- [x] #2 Baslinje mätt per test över minst 8 körningar med retries av: vilka av de sju som faktiskt faller och med vilken rat
- [x] #3 Antalet mekanismer avgjort med belägg — är fokus-testerna, axe-körningarna och de övriga samma orsak eller olika? Slutsatsen får inte vara en gissning
- [x] #4 T106-avgränsningen omprövad mot de nya datapunkterna: gemensam orsak eller inte, med belägg
- [x] #5 Åtgärd bevisad med före/efter-mätning i samma kontrollerade form, inte med en grön CI-körning
- [x] #6 Kvarvarande rat redovisad ärligt — om något inte gick att laga står det, med vad som skulle krävas
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC 1 — MÄTFORMEN, MED KONTROLLERAD LAST

Kortet varnade rätt: TASK-64:s efter-serie var en BLOCK-design (alla före-körningar
först, alla efter-körningar sedan) och dess körtidsdrift 107 -> 173 s mappar därför
rakt på arm-skillnaden. Formen här rättar fyra saker, och maskinen var INTE vilande —
det gick inte att ordna, så formen gjordes drift-tålig i stället för att låtsas om
en vilande maskin:

  1. INTERFOLIERADE ARMAR. Före/efter körs A,B,A,B,... i samma serie. En monoton
     lastdrift träffar då båda armarna lika i stället för att bli arm-skillnaden.
  2. LAST-GRIND + LAST-LOGG. Varje körning startar först när 1-min loadavg fallit
     under 5,5 (tak 180 s), och loadavg loggas före OCH efter varje körning.
     Uppmätt spann över baslinjen: start 4,2-5,5, slut 17,4-57,4.
  3. NEDKYLNING 45 s mellan körningar så föregående runs processer hinner dö och
     port 5399 släppas (webServer kör reuseExistingServer: false + --strictPort).
  4. PER-TEST-DATA, INTE BARA PASS/FAIL. Playwrights JSON-rapport sparas per
     körning: status, VARAKTIGHET och felutskrift per test. Det är avgörande —
     pass/fail på n=10 har nästan ingen upplösning för en rat runt 10 %, medan
     varaktigheten mäter marginalen mot budgeten kontinuerligt (1530 datapunkter
     på 10 körningar i stället för 10).

Körform, identisk i alla serier:
  PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 npx playwright test --project=acceptance \
    --workers=N --retries=0 --reporter=json,./tests/support/fixturvarld/overskuggnings-rapport.ts
Exitkoden fångas separat (aldrig efter en pipe). Harnesset låg i sessionens
scratchpad; det är avsiktligt inte landat — protokollet ovan ÄR formen, och en
150-radersriggen hade dominerat en diff vars fix är två filer.

VIKTIG BAKGRUNDSSIFFRA FÖR ALLA TAL NEDAN: CI kör acceptance-sviten med
**2 workers** ("Running 153 tests using 2 workers", läst i acceptance-jobbets logg
för körning 30396110525 och 30403011847). Lokalt väljer Playwright 50 % av 16
logiska kärnor = 8. Den lokala mätningen är alltså 4x CI:s parallellism, och driver
maskinens loadavg till 17-57. Klass B är i den meningen till stor del ett LOKALT
fenomen — se AC 6.
AC 2 — BASLINJEN: KORTETS SJU STÄMMER INTE

10 fulla körningar, --workers=8 --retries=0, 1530 testresultat. Rat per test
(fällda/körningar, plus medianvaraktighet och max):

  person-detail:140        0/10    med  8291 ms · max 10743 ms
  hem:437                  0/10    med  8116 ms · max 10001 ms
  mer-intresserade:98      0/10    med  5183 ms · max  7426 ms
  mer-segment-send:113     1/10    med 11042 ms · max 14601 ms
  persons-list:106         0/10    med  7272 ms · max 12381 ms
  event-narvaro:196 (axe)  0/10    med  7467 ms · max 11848 ms
  event-anteckningar:350   0/10    med  7518 ms · max 12566 ms
  --- inte på kortet ---
  mer-maillogg:77          1/10    med  6980 ms · max 11409 ms
  event-ny-anmalan:734     2/10    med  5520 ms · max  8723 ms

TOTALT: 4 fällda av 1530 testresultat (0,26 %); 4 av 10 körningar hade minst en
fällning. Körtid 113-182 s, loadavg vid slut 17-57.

SEX AV KORTETS SJU FÖLL INTE EN ENDA GÅNG. Och två tester som inte står på kortet
föll. Kortets varning slog alltså in på sitt eget innehåll: TASK-64:s efter-serie
kördes under stigande maskinlast och dess lista är inte en medlemslista utan ett
avtryck av vilka tester som råkade ligga i vägen den gången. "Sju tester" är inte
belagt — klassen är verklig, men den träffar den som råkar vara FÖRST i sin fil
(se AC 3), inte en fast uppsättning.

Radnummer-not: kortets tal (person-detail:137 osv) är från trädet före TASK-63:s
filhuvud-tillägg. Talen ovan är nuvarande HEAD. Identiteten är testets titel,
inte dess rad.

AC 3 — MEKANISMERNA: TRE, MED BELÄGG (INTE "fokus-tester")

Kortets hypotes — "gemensamt är att de är fokus-tester (fokus -> <h1>)" — är
FALSIFIERAD på två sätt:
  (a) hem:437 heter "AC 1 — dagar-kvar-pillen" och är inte ett fokus-test alls.
  (b) De faktiska fällningarna säger "element(s) not found", inte "not focused".

MEKANISM B1 — KALL ROUTE-CHUNK MOT expect-BUDGETEN (5000 ms).

  Felutskrifterna, ordagrant ur JSON-rapporterna:
    mer-maillogg:77   expect(locator).toBeVisible() failed
                      Locator: getByRole('heading', { name: 'Maillogg', level: 1 })
                      Timeout: 5000ms · Error: element(s) not found
    mer-segment-send:113  expect(locator).toBeFocused() failed
                      Locator: getByRole('heading', { name: 'Bygg segment', level: 1 })
                      Timeout: 5000ms · Error: element(s) not found

  Ett TREDJE fall kom i A/B-seriens arm A (körning 3) och är det som avgör
  frågan, eftersom det gäller kortets mest citerade klass-B-test:
    person-detail:140  expect(locator).toBeVisible() failed
                       Locator: getByRole('heading', { name: 'Anna Andersson', level: 1 })
                       Timeout: 5000ms · element(s) not found
                       vid rad 149 — FÖRSTA assertionen efter goto
  Testet har sedan T26 en uttrycklig "stabil data-gate FÖRE fokus-assertionen"
  (rad 151-155) mot precis den flakighet TASK-64 tillskrev fokus. Fällningen
  sker SEX RADER FÖRE den grinden. Gaten vaktar alltså rätt sak av fel skäl —
  orsaken sitter i den första assertionen, inte i fokus-väntan.

  Tre olika matchers-anrop över tre olika vyer, samma svans: elementet fanns
  ALDRIG inom 5 s. Fokus är
  inte inblandat — h1 renderas i vyerna först i det LADDADE tillståndet
  (Intresserade.tsx:117-151, MailLog.tsx:118-150, SegmentBuilder.tsx:154-186:
  `if (isPending) return <laddläge>` FÖRE rubriken).

  Varför just första testet i en fil: `page.goto()` returnerar när load-eventet
  gått, men route-chunken hämtas av app-JS EFTER det (autoCodeSplitting,
  vite.config.ts:34). Den första web-first-assertionen efter en goto bär därför
  hela kall-laddningen inom EN expect-budget.

  KALL-KOSTNADEN ÄR MÄTT, INTE ANTAGEN. Över 180 fil-körningar (18 filer x 10
  körningar) var filens FÖRST startade test långsammare än filens egen median i
  144 fall (80 %). Medianskillnad +1643 ms, största +6902 ms.

  Och de fällda testerna ÄR förstatester: mer-maillogg:77 startade 22:05:29.720,
  tog 11 409 ms och föll; filens sju följande tester startade efteråt och tog
  8016-9838 ms, alla gröna.

  POPULATIONEN: 95 av sviten 156 `page.goto()`-anrop följs direkt av en
  web-first-assertion (nästa kod-rad, kommentarer överhoppade). Det är formen —
  inte en enskild rad som i klass A.

  DETTA ÄR INTE KLASS A. Klass A var en ögonblicksbild-query (allTextContents,
  getAttribute, count) följd av en assertion som inte retryar; ingen tid i
  världen hade hjälpt. Här retryar assertionen korrekt och får bara inte tid.
  Sökningen som TASK-64 gjorde över tests/acceptance/ kunde per konstruktion
  inte hitta B1: det finns ingen kodform att greppa efter, bara en budget.

MEKANISM B2 — ÖVERSKUGGNINGS-VAKTENS TVÅ OBSERVATÖRER (task-62).

  event-ny-anmalan:734 föll 2/10 med OmatchadOverskuggningError: "överskuggningen
  matchade inte — trots att dess Edge Function anropades", för mönstret
  `GET */functions/v1/get-event` registrerat på rad 196.

  Mönstret är byggt med EF('get-event') — den sanktionerade formen, som per
  konstruktion matchar — och samma helper används av filens övriga tester, som
  passerar. En mönster-bugg är alltså utesluten.

  ORSAKEN, LÄST I KÄLLAN: vakten ställer TVÅ observatörer mot varandra
  (overskuggnings-vakt.ts:589-596): `handler.isUsed` (MSW) mot `anropadeNamn`
  (Playwright). De mäter vid olika tidpunkter — Playwrights `request` fyrar när
  anropet SKICKAS, MSW sätter isUsed när handlern KÖRS. `granskaTest` körs i
  fixturens teardown direkt efter `await use(...)` (hermetic.ts:340). Ett anrop
  som fortfarande är i flykten när testkroppen tar slut är därför räknat av den
  ena men inte av den andra.

  Testet gör exakt det: dess SISTA handling väljer ett event (rad 753-755),
  vilket utlöser `get-event`; formuläret renderas ur routen så assertionerna på
  rad 756-757 passerar medan svaret ännu är i flykten. Fönstret vidgas med
  maskinlast — samma symptomklass som B1, en annan orsak.

  Detta är alltså en LAST-KÄNSLIG FALSK RÖD i en grindvakt, inte ett testfel.

MEKANISM B3 — TEST-BUDGETEN (30 000 ms). KORTETS AXE-HYPOTES BEKRÄFTAD, MEN
FÖRST VID MÄTTNAD.

  I baslinjens 10 körningar inträffade INGEN test-timeout; det som gick att mäta
  där var bara marginalen (tyngsta gröna test 21 195 ms av 30 000 = 29 % kvar).
  A/B-seriens körning 9 (arm A) råkade träffa ett fönster där maskinens loadavg
  nådde 125 — extern last, inte min — och då föll formen fram:
       anmalan-detalj:535 (axe)     Test timeout of 30000ms exceeded  35 185 ms
       events-list-kalender:209     Test timeout of 30000ms exceeded  38 664 ms
       events-list-kalender:284     Test timeout of 30000ms exceeded  26 392 ms
  Samma körning gav dessutom 9 B1-fällningar över SEX olika filer, alla med
  `Timeout: 5000ms · element(s) not found`. Mättnads-körningen är alltså inte en
  fjärde mekanism utan en förstoring av de två första plus den tredje.

  Kortets axe-hypotes är därmed bekräftad som EGEN mekanism — det är
  TEST-budgeten som spricker, inte expect-budgeten — men den kräver betydligt
  hårdare last än B1. Att det krävdes en slumpartad lasttopp för att se den sägs
  rakt ut: den är inte reproducerad på beställning.

SÅ: TRE MEKANISMER, INTE EN. B1 och B3 är båda budget-mot-arbete men mot OLIKA
budgetar och med olika trösklar; B2 är inte en budget alls utan två observatörer
som läser vid olika tidpunkter. Ingen av dem delar klass A:s kodform, och ingen
av dem hade hittats av en sökning efter kodform. Urvalet är dessutom begränsat
till vad 19 fulla körningar visade — fler mekanismer kan finnas.
AC 4 — T106 OMPRÖVAD MOT DE NYA DATAPUNKTERNA: ORSAKEN ÄR INTE GEMENSAM,
MEN PARAMETERN ÄR DET — OCH DET GÅR ATT MÄTA

T106: i självtestläget fälls `mer-segment-send › happy path` ibland UTAN att
OmockadRequestError är orsaken, eftersom vaktens kast når fram asynkront medan
testets `toBeFocused` har 5000 ms timeout; den som landar först bestämmer vad
som rapporteras.

NY DATAPUNKT: exakt samma assertion på exakt samma test fälls i NORMALLÄGE
(baslinjen, körning 4) med `Timeout: 5000ms · element(s) not found`.

ORSAKERNA ÄR OLIKA, OCH NU MED BELÄGG FÖR VARFÖR:
  • I självtestläget är normalläget tömt, så data kan ALDRIG anlända. h1 kan
    aldrig renderas. Timeouten är då GARANTERAD, inte lastberoende — det enda
    lastberoende är vilket av två SÄKRA fel som rapporteras.
  • I normalläge anländer data; den hinner bara inte inom 5 s under last.
    Fällningen är lastberoende hela vägen.
Att slå ihop dem vore fel. Symptomet delas; orsaken inte.

MEN DE DELAR EN PARAMETER: 5000 ms-budgeten på just den assertionen är i BÅDA
fallen det som avgör utfallet. Höjs budgeten till 15 000 ms får vaktens
asynkrona kast 3x så lång tid att landa först — alltså är TASK-74:s åtgärd
predikterad att minska T106:s felrapportering utan att adressera dess orsak.

PREDIKTIONEN PRÖVAD, INTE PÅSTÅDD. Fyra interfolierade självtest-körningar
(A = utan budgetarna, B = med), `npm run test:acceptance:sjalvtest`:
  A  207 s @ loadavg 43   ·  153 tester · 153 fällda · 153 med OmockadRequestError
  B  249 s @ loadavg 64   ·  153 · 153 · 153
  A  264 s @ loadavg 59   ·  153 · 153 · 153
  B  230 s @ loadavg 86   ·  153 · 153 · 153
Verdikten är oförändrad i alla fyra (153/153/153), och kostnaden är
medel A 235,5 s mot medel B 239,5 s — +1,7 %, väl inom brusnivån, och B körde
vid HÖGRE last i båda paren. T106:s feltillstånd inträffade inte i någon av
körningarna, så prediktionen är varken bekräftad eller motbevisad här; det som
ÄR visat är att åtgärden varken försvagar självtestets verdikt eller kostar
mätbar tid i det steg som CI kör efter sviten.

T106 STÅR ALLTSÅ KVAR SOM EGEN TRÅD. Rekommendation till orkestreraren:
uppdatera registerraden i tasks/threads/README.md med att orsaken nu är
avgränsad med belägg (garanterad kontra lastberoende timeout) och att
expect-budgeten höjts till 15 s. Jag rör inte tråd-registret själv — det är en
docs-yta utanför detta korts diff.
AC 5 — ÅTGÄRDEN, BEVISAD I SAMMA KONTROLLERADE FORM

ÅTGÄRDEN ÄR TVÅ ÄNDRINGAR, EN PER MEKANISM:
  B1 → playwright.config.ts, acceptance-projektet: `timeout: 60_000` +
       `expect: { timeout: 15_000 }`. Härledda, inte valda — härledningen står
       i configen bredvid raderna.
  B2 → tests/support/fixturvarld/hermetic.ts: räknaren byter händelse från
       `context.on('request')` till `context.on('requestfinished')`.

ATT ÄNDRINGARNA FAKTISKT BITER ÄR VERIFIERAT UR ARTEFAKTERNA, INTE ANTAGET:
  • Playwrights JSON-rapport bär projektets test-budget. Arm A-körningarna visar
    `timeout=30000`, arm B-körningarna `timeout=60000` — alltså kördes armarna
    verkligen på olika kod. (Harnesset applicerar/återställer patchen per körning
    och kontrollerar `git status --porcelain` efteråt; alla körningar loggade
    "rent".)
  • expect-budgeten syns inte i JSON:en, så den mättes direkt i felutskriften:
       utan fixen (baslinjen)          -> "Timeout: 5000ms"
       med fixen (negativa kontrollen) -> "Timeout: 15000ms"

INTERFOLIERAD FÖRE/EFTER-SERIE — A,B,A,B,... samma maskin, samma kommando,
--workers=8 --retries=0. 5 körningar per arm, 765 testresultat per arm:

  ARM A (utan fix, projekt-timeout 30000 i artefakten)
    B1 expect-budget, alla med "Timeout: 5000ms"   10
    B2 vaktens race (OmatchadOverskuggningError)    1
    B3 test-budget, "Test timeout of 30000ms exceeded"  2
    SUMMA klass B                                  13   i 2 av 5 körningar

  ARM B (med fix, projekt-timeout 60000 i artefakten)
    B1 expect-budget, med "Timeout: 15000ms"        1
    B2                                              0
    B3                                              0
    SUMMA klass B                                   1   i 1 av 5 körningar
    (därutöver 2 INFRASTRUKTUR-fällningar, se nedan — de räknas inte som klass B)

  INGEN arm B-fällning bar "Timeout: 5000ms", ingen bar
  OmatchadOverskuggningError och ingen bar en 30 s test-timeout. De tre formerna
  försvann alltså som FORMER, inte bara som antal.

TVÅ SAKER SOM MÅSTE SÄGAS OM DE TALEN, ANNARS ÄR DE VILSELEDANDE:

  (1) 12 AV ARM A:S 13 KOM UR EN ENDA KÖRNING. Körning 9 råkade träffa ett
      fönster där maskinens loadavg nådde 125 — främmande last, inte min — och
      fällde då 12 tester över sex filer. Ingen arm B-körning träffade ett lika
      extremt fönster. Armarnas GENOMSNITTLIGA last var däremot jämförbar
      (medel-loadavg vid körningsslut: arm A 53,6 · arm B 53,2 över de fyra
      loggade), så det är fördelningens SVANS som skiljer, inte nivån.
      Interfolieringen ger båda armarna samma chans att träffa en topp; att A
      gjorde det och B inte är slump, och det inflaterar A:s tal.
      Utan körning 9 är ställningen arm A 1 fällning i 1/4 mot arm B 1 i 1/5 —
      alltså ingen skillnad alls i rat, bara i FORM (5000 ms mot 15000 ms).
  (2) STATISTISK STYRKA SAKNAS för rat-jämförelsen (se AC 6 punkt 5). Det som
      bär beviset är formen på felutskrifterna plus mekanismen, inte 13-mot-1.

  ARM B:S TVÅ INFRASTRUKTUR-FÄLLNINGAR (körning 4, hem:1199 och hem:1250) är
  `net::ERR_CONNECTION_REFUSED at http://localhost:5399/hem` — dev-servern dog
  mitt i körningen under hög last. Det är maskinen, inte testerna, och att
  bokföra dem som klass B hade varit precis det mätfel kortet varnar för. De
  räknas separat och redovisas här i stället för att tystas. Orsaken är inte
  utredd; den drabbade bara en körning och bara arm B, vilket jag inte kan
  utesluta är slump.

  EN NIONDE KÖRNING DÖDADES av harness-timeouten mitt i (arm B, körning 10) och
  kördes om för hand med identiskt kommando; den blev grön (exit 0). Serien är
  alltså 5+5, inte 5+4.

BEVIS I BÅDA RIKTNINGAR FÖR B2 (den grind jag rört):
  • positiv kontroll — event-narvaro orörd, med fixen: 8/8 gröna, 13,7 s, exit 0.
  • negativ kontroll — `http.get(EF('get-person'))` bytt till `http.post(...)` i
    person-detail (rätt EF-namn, fel metod = vaktens modellfall): 8/8 FÄLLDA,
    OmatchadOverskuggningError i 7 av dem, exit 1. Vakten fäller alltså
    fortfarande när den ska, trots att räknaren bytt händelse. Ändringen
    återställd med `git checkout` efteråt.
  • ett FÖRSTA försök att fälla via event-narvaro dög inte och förkastades öppet:
    `get-attendance` ligger avsiktligt inte i normalläget, så det omatchade
    anropet når hermetik-vakten (OmockadRequestError) i stället för
    överskuggnings-vakten. Kontrollen måste gå via en EF som NORMALLÄGET bär.

KOSTNAD, MÄTT: höjda budgetar kostar ingenting i en grön körning — en timeout
biter bara vid fällning. Det enda steg där allt fälls är hermetik-självtestet,
och där är kostnaden mätt i fyra interfolierade körningar: medel 235,5 s utan
mot 239,5 s med (+1,7 %, inom bruset, och B körde vid högre last i båda paren).
Verdikten var 153/153/153 i alla fyra. CI-jobbet har alltså inte fått en ny
tidsrisk mot sitt 12-minuterstak.
AC 6 — KVARVARANDE RAT, ÄRLIGT

0. KLASS B ÄR INTE BORTA. Arm B fällde `hem:437` en gång på 5 körningar, och
   felet var `Timeout: 15000ms · element(s) not found` — alltså SAMMA mekanism
   (B1), bara mot den nya budgeten. Vid tillräcklig mättnad räcker inte 15 s
   heller. Kvarvarande uppmätt rat för klass B med fixen: 1 fällning på 765
   testresultat i 1 av 5 körningar. VAD SOM SKULLE KRÄVAS för att stänga den
   helt: ta bort kall-chunk-kostnaden i stället för att rymma den (värm
   route-grafen före sviten) eller sluta oversubscriba maskinen (färre workers
   lokalt). Båda är beslut jag inte tar ensam — de står som förkastade
   alternativ längst ned med sina skäl.

1. KLASS B ÄR TILL ÖVERVÄGANDE DEL ETT LOKALT FENOMEN, OCH DET ÄNDRAR
   VÄRDET AV FIXEN. CI kör acceptance-sviten med 2 workers; lokalt kör den med
   8 (Playwrights 50 %-default på 16 logiska kärnor), vilket driver maskinens
   loadavg till 17-57. Jag sökte igenom acceptance-jobbets loggar för de 70
   senaste CI-körningarna (28 jobb med läsbar logg) och delade dem vid klass
   A:s fix (990add4, 2026-07-28 20:31Z):
       FÖRE  klass A-fix : 6/14 jobb med flaky > 0
       EFTER klass A-fix : 1/14
   Alla sex FÖRE-fallen är klass A:s två tester. Det enda EFTER-fallet är
   `hem.acceptance.test.ts:1097` — INGET av klass B:s tester har någonsin
   observerats flaky i CI i det urvalet. Fixen gör alltså i första hand den
   LOKALA körningen trovärdig, vilket är den som är DoD-grind före push. Det är
   ett verkligt värde, men det är inte "CI blir grönare".

2. EN ÅTTONDE FLAKE SOM CI FAKTISKT SER, OCH SOM DETTA KORT INTE LAGAR.
   `hem.acceptance.test.ts:1097` ("AC 1 — identitetsbeviset: FÖRE == UNDER ==
   EFTER byte-identiska under bevisat aktiv omhämtning"), flaky i CI-körning
   30400586455 (commit c832e60) på rad 1179:
       expect(efter.equals(fore), 'EFTER == FÖRE (byte-identisk skärmdump)').toBe(true)
   Det är en TREDJE form — byte-identisk skärmdumps-jämförelse efter en
   dubbel-rAF-väntan — och varken en expect-budget eller vaktens händelseval
   rör den. Rekommenderas som egen tråd; jag tar inte scope-beslutet.

3. AXE-MARGINALEN ÄR SMAL MEN OBEVISAD SOM FELORSAK. Tyngsta gröna testet i
   baslinjen är en axe-körning på 21 195 ms mot stock-budgeten 30 000 ms.
   Höjningen till 60 s är därför FÖREBYGGANDE för den delen — ingen
   test-timeout observerades i de 10 baslinjekörningarna, och TASK-64:s två
   axe-fällningar bokförde aldrig sin felutskrift.

4. MÄTNINGENS EGEN SVAGHET, ÖPPET. Maskinen var aldrig vilande: främmande last
   (Backblaze-backup, VS Code, andra agenters gh-anrop) drev loadavg till 43-99
   under delar av serierna. Last-grinden (start under 5,5) och den
   interfolierade arm-ordningen gör jämförelsen drift-tålig, men de gör inte
   maskinen tyst. Alla tal här är från EN maskin under varierande främmande
   last, och de är LOKALA — ingen av dem är mätt i CI.

5. STATISTISK UPPLÖSNING. Basraterna är 1/10, 1/10 och 2/10. En A/B med 5
   körningar per arm kan inte särskilja en rat på 0,1 från 0,0 med någon
   styrka. Bevisningen vilar därför på mekanismen (felutskriftens
   `Timeout: 5000ms` mot en budget som nu är 15 000 ms, och vaktens
   händelseval som är bevisat ordningsstabilt) plus raterna som stöd — inte
   tvärtom. Det sägs rakt ut.

FÖRKASTADE ALTERNATIV, MED SKÄL
  • Sänk workers lokalt. Skulle ta bort orsaken snarare än att vidga budgeten,
    men `workers` i config gäller ÄVEN CI (som redan kör 2) och en sänkning
    lokalt är en ergonomi-avvägning som inte är min att ta.
  • Värm route-grafen i globalSetup. Skulle ta bort kall-chunk-kostnaden i
    stället för att rymma den, men kräver ny maskineri som räknar upp routerna
    — spekulativ komplexitet över golvet för en kostnad som en budgetrad täcker.
  • Lägg till data-grindar före fokus-assertionerna (som person-detail redan
    har). Delar en 5 s-budget i två à 5 s. Fungerar, men lagar symptomet per
    testfil i stället för budgeten en gång, och hade grumlat attributionen i
    före/efter-mätningen. Ej gjort.
MÄTNINGENS AVGRÄNSNING MOT ANDRA SESSIONERS ARBETE

Ingen siffra i detta kort är mätt mot staging, och ingen är en väggklocka på ett
jobb som delar staging-mutexen. Allt är antingen (a) lokala körningar av
`--project=acceptance` mot fixturvärlden, eller (b) rader ur `Acceptance
(hermetisk)`-jobbets EGEN logg (flaky-raden och "Running 153 tests using 2
workers"). Ett enda staging-relaterat FAKTUM förekommer — att jobbet "Test suite
/ Staging (API + E2E)" KÖRDE på PR #377 — och det är en jobb-existens i en
avslutad historisk körning, inte en tidmätning. Inget resultat behövde kasseras.

Inget utfall från `Staging sentinel purge` ingår i någon klassning här; jämför
TASK-76 (purge-jobbet är inte idempotent mot samtidiga körningar).

AVVIKELSER OCH FYND UTANFÖR KORTET

A. TASK-64:S SKÄL ATT INTE RÖRA playwright.config.ts ÄR FALSIFIERAT. Kortet och
   uppdraget bar båda vidare påståendet att en ändring i filen "hade kostat
   PR:ens acceptance_local-klassning". Klassningen kräver att VARENDA ändrad fil
   ligger under `tests/acceptance/**` (ci.yml, steget changed-acceptance,
   allowlist rad 295). Kort-filen ligger under `backlog/`, och DoD kräver att
   kort-ändringen ligger i samma commit — klassningen är alltså redan omöjlig
   för den PR-formen. Kvitto: PR #377 (TASK-64) ändrade kortfilen + två
   acceptance-filer, och i dess CI-körning 30396110525 KÖRDE jobbet
   "Test suite / Staging (API + E2E)". Kostnaden fanns inte att spara.
   Konsekvens: playwright.config.ts är rörd här, och rättelsen av det
   falsifierade retries-skälet är inbakad som uppdraget medgav.

B. NIONDE/ÅTTONDE TESTET, SE AC 6 PUNKT 2: hem:1097 (byte-identisk skärmdump)
   är den enda klass-B-liknande flaken CI faktiskt sett efter klass A:s fix.
   Tredje formen, ej lagad, rekommenderad som egen tråd.

C. VIDEOINSPELNING ÄR EN MÄTBAR EGENLAST. `video: 'retain-on-failure'` startar
   en ffmpeg-process per test; under körningarna låg 8 sådana på 39-47 % CPU
   vardera, alltså i storleksordningen 3 kärnor av 16 för artefakter som kastas
   för 153 av 153 gröna tester. Jag har INTE mätt vad avstängning ger, och jag
   har inte ändrat det — det är en diagnostik-policy-avvägning (förlorade
   fel-videor mot snabbare/lugnare körning) och därmed Marcus beslut, inte mitt.
   Registrerat, inte tyst förkastat.

D. EN LATENT FÄLLA INFÖRD MED ÖPPNA ÖGON. Projekt-`expect` ERSÄTTER top-nivåns
   (`playwright/lib/common/index.js:663`, `takeFirst`), så acceptance-projektet
   ser inte längre TASK-49:s `toHaveScreenshot`-trösklar. Ofarligt i dag (ingen
   acceptance-fil använder toHaveScreenshot/toMatchSnapshot — grep), och
   fällan står nedskriven i configen på raden ovanför.

E. NEGATIV KÄNSLIGHET SOM PRIS FÖR B2-FIXEN. Med `requestfinished` räknas inte
   längre AVBRUTNA anrop. Vore just det anropets överskuggning felskriven fälls
   den inte av det anropet. Rätt avvägning (ett avbrutet anrop bevisar inte att
   överskuggningen borde ha matchat), men en verklig känslighetsförlust —
   nedskriven i hermetic.ts.

BEVIS I BÅDA RIKTNINGAR FÖR DEN RÖRDA GRINDEN (B2)
  positiv kontroll: tests/acceptance/event-narvaro.acceptance.test.ts orörd,
      8/8 gröna på 13,7 s med fixen applicerad (exit 0).
  negativ kontroll: `http.get(EF('get-person'))` -> `http.post(...)` i
      person-detail (rätt EF-namn, fel metod → anropet faller igenom till
      normalläget, precis vaktens modellfall) gav 8/8 FÄLLDA med
      OmatchadOverskuggningError i 7 av dem, exit 1. Vakten fäller alltså
      fortfarande när den ska. Kontroll-ändringen återställd (git checkout).
  Ett första försök att fälla via event-narvaro dög INTE och förkastades:
      `get-attendance` ligger avsiktligt inte i normalläget, så ett omatchat
      anrop når hermetik-vakten (OmockadRequestError) i stället för
      överskuggnings-vakten. Noteras hellre än döljs.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
