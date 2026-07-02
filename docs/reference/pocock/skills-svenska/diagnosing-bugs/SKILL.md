---
name: diagnosing-bugs
description: Diagnosloop för svåra buggar och prestandaregressioner. Använd när användaren säger ”diagnostisera” eller ”debugga detta”, eller rapporterar något trasigt, kastande, fallerande eller långsamt.
---

# Diagnostisera buggar

En disciplin för svåra buggar. Hoppa bara över faser när det uttryckligen är motiverat.

Läs `CONTEXT.md` om den finns när du utforskar kodbasen, så att du får en tydlig mental modell av relevanta moduler. Kontrollera också ADR:er i området du berör.

## Fas 1 — Bygg en återkopplingsslinga

**Detta är skillsen.** Allt annat är mekaniskt. Har du en **tät** pass/fail-signal för buggen — en som blir röd för *just denna* bugg — hittar du orsaken; bisektering, hypotesprövning och instrumentering förbrukar bara signalen. Har du ingen hjälper inget stirrande på kod.

Lägg oproportionerligt mycket arbete här. **Var aggressiv. Var kreativ. Vägra ge upp.**

### Sätt att bygga en slinga — prova ungefär i denna ordning

1. **Fallande test** vid den skarv som når buggen — enhet, integration eller e2e.
2. **Curl- eller HTTP-skript** mot en körande utvecklingsserver.
3. **CLI-anrop** med fixture-indata där stdout diffas mot en känd korrekt snapshot.
4. **Headless-browser-skript** (Playwright eller Puppeteer) som styr UI:t och assertar DOM, konsol eller nätverk.
5. **Spela upp en fångad trace.** Spara en verklig nätverksbegäran, payload eller händelselogg och spela upp den isolerat genom kodvägen.
6. **Tillfällig harness.** Starta en minimal del av systemet (en tjänst, mockade beroenden) som kör buggens kodväg med ett funktionsanrop.
7. **Property-/fuzz-loop.** Om buggen är ”ibland fel utdata”, kör 1 000 slumpindata och leta efter felläget.
8. **Bisekteringsharness.** Om buggen uppstod mellan två kända tillstånd (commit, datamängd eller version), automatisera ”starta vid tillstånd X, kontrollera, upprepa” så att `git bisect run` kan användas.
9. **Differentiell loop.** Kör samma indata genom gammal och ny version, eller två konfigurationer, och diff:a utdata.
10. **HITL-bash-skript.** Sista utvägen. Om en människa måste klicka, styr *människan* med `scripts/hitl-loop.template.sh` så att loopen fortfarande är strukturerad. Fångad utdata återkopplas till dig.

Bygg rätt återkopplingsslinga så är buggen till 90 procent åtgärdad.

### Gör slingan tätare

Behandla slingan som en produkt. När du har *en* slinga ska du **göra den tätare**:

- Kan den bli snabbare? (cacha uppsättning, hoppa över orelaterad initiering, begränsa testomfattningen.)
- Kan signalen bli skarpare? (asserta det specifika symptomet, inte ”kraschade inte”.)
- Kan den bli mer deterministisk? (lås tid, sätt RNG-seed, isolera filsystem, frys nätverk.)

En flakig slinga på 30 sekunder är knappt bättre än ingen; en deterministisk slinga på två sekunder är tät — en felsökningssuperkraft.

### Icke-deterministiska buggar

Målet är inte en perfekt reproduktion utan en **högre reproduktionsgrad**. Loopa triggaren 100×, parallellisera, tillför stress, begränsa tidsfönster och injicera sleeps. En flake-bugg på 50 procent går att debugga; en på en procent gör det inte — höj graden tills den går att debugga.

### När en slinga verkligen inte går att bygga

Stanna och säg det uttryckligen. Lista vad du försökte. Be användaren om: (a) åtkomst till miljön som reproducerar felet, (b) en fångad artefakt (HAR-fil, loggdump, core dump eller skärminspelning med tidsstämplar), eller (c) tillåtelse att lägga till tillfällig produktionsinstrumentering. Börja **inte** spekulera utan en slinga.

### Slutförandekriterium — en tät slinga som kan bli röd

Fas 1 är klar när slingan är **tät** och **röd-kapabel**: du kan ange **ett kommando** — en skriptsökväg, testkörning eller curl — som du redan har kört minst en gång (klistra in anropet och utdata) och som är:

- [ ] **Röd-kapabel** — kör den verkliga buggkodvägen och assertar **användarens exakta symptom**, så att den kan bli röd av denna bugg och grön efter fixen. Inte ”kör utan fel” — den måste kunna *fånga just denna bugg*.
- [ ] **Deterministisk** — samma resultat vid varje körning (för flakiga buggar: låst, hög reproduktionsgrad enligt ovan).
- [ ] **Snabb** — sekunder, inte minuter.
- [ ] **Agentkörbar** — går att köra utan uppsikt; människa i loopen endast via `scripts/hitl-loop.template.sh`.

Om du börjar läsa kod för att bygga en teori innan detta kommando finns: **stanna — att hoppa direkt till en hypotes är exakt det fel denna skill förhindrar.** Inget röd-kapabelt kommando, ingen fas 2.

## Fas 2 — Reproducera och minimera

Kör slingan. Se den bli röd — buggen visas.

Bekräfta:

- [ ] Slingan skapar det felläge som **användaren** beskrev — inte ett annat fel som råkar ligga nära. Fel bugg ger fel fix.
- [ ] Felet går att reproducera över flera körningar (eller, för icke-deterministiska buggar, med tillräckligt hög grad för att debugga mot).
- [ ] Du har fångat det exakta symptomet (felmeddelande, fel utdata eller långsam tid) så att senare faser kan verifiera att fixen verkligen löser det.

### Minimera

När slingan är röd, krymp reproduktionen till det **minsta scenario som fortfarande blir rött**. Ta bort indata, anropare, konfiguration, data och steg **ett i taget** och kör slingan igen efter varje borttagning — behåll bara det som bär upp felet.

Varför: en minimal reproduktion krymper hypotesrymden i fas 3 och blir det rena regressionstestet i fas 5.

Klart när **varje återstående del bär last** — att ta bort vilken som helst gör slingan grön.

Fortsätt inte förrän du både har reproducerat **och** minimerat.

## Fas 3 — Formulera hypoteser

Skapa **3–5 rangordnade hypoteser** innan någon av dem testas. En enda hypotes förankrar dig i första rimliga idé.

Varje hypotes måste gå att **falsifiera**: ange sin förutsägelse.

> Format: ”Om <X> är orsaken kommer <ändring av Y> att få buggen att försvinna / <ändring av Z> att göra den värre.”

Kan du inte formulera förutsägelsen är hypotesen en magkänsla — kasta bort eller förtydliga den.

**Visa den rangordnade listan för användaren innan du testar.** De har ofta domänkunskap som omedelbart ändrar rangordningen (”vi driftsatte just en ändring för nummer 3”) eller vet vilka hypoteser som redan har avfärdats. Billig kontrollpunkt, stor tidsbesparing. Blockera inte på svar; fortsätt med din rangordning om användaren är AFK.

## Fas 4 — Instrumentera

Varje sond måste motsvara en specifik förutsägelse från fas 3. **Ändra en variabel i taget.**

Verktygspreferens:

1. **Debugger-/REPL-inspektion** om miljön stöder det. En brytpunkt är bättre än tio loggar.
2. **Riktade loggar** vid gränserna som skiljer hypoteserna åt.
3. Aldrig ”logga allt och greppa”.

**Tagga varje debuglogg** med ett unikt prefix, till exempel `[DEBUG-a4f2]`. Städningen blir sedan en enda grep. Otaggade loggar överlever; taggade loggar dör.

**Prestandagren.** Vid prestandaregressioner är loggar vanligen fel verktyg. Etablera i stället en baslinjemätning (tidsharness, `performance.now()`, profiler eller query plan) och bisektera. Mät först, fixa sedan.

## Fas 5 — Fixa och regressionstesta

Skriv regressionstestet **före fixen** — men bara om det finns en **korrekt skarv** för det.

En korrekt skarv är en där testet kör **det verkliga bugmönstret** såsom det inträffar vid anropsstället. Om enda tillgängliga skarven är för grund (test för en anropare när buggen behöver flera, eller enhetstest som inte kan återskapa kedjan som triggade buggen) ger ett regressionstest där falsk trygghet.

**Om ingen korrekt skarv finns är det i sig ett fynd.** Notera det. Kodbasens arkitektur hindrar att buggen låses ned. Flagga detta för nästa fas.

Om en korrekt skarv finns:

1. Omvandla den minimerade reproduktionen till ett fallande test vid skarven.
2. Se det fallera.
3. Tillämpa fixen.
4. Se testet passera.
5. Kör fas 1:s återkopplingsslinga igen mot det ursprungliga, icke-minimerade scenariot.

## Fas 6 — Städa och gör efteranalys

Krävs innan du förklarar arbetet klart:

- [ ] Ursprunglig reproduktion inträffar inte längre (kör fas 1-slingan igen).
- [ ] Regressionstestet passerar, eller avsaknaden av skarv är dokumenterad.
- [ ] All `[DEBUG-...]`-instrumentering är borttagen (greppa prefixet).
- [ ] Tillfälliga prototyper är borttagna eller flyttade till en tydligt märkt debugplats.
- [ ] Hypotesen som var korrekt anges i commit-/PR-meddelandet så att nästa felsökare lär sig.

**Fråga sedan: vad skulle ha förhindrat denna bugg?** Om svaret innebär arkitekturförändring (ingen bra testskarv, trassliga anropare eller dold koppling), lämna över till `/improve-codebase-architecture` med detaljerna. Ge rekommendationen **efter** att fixen är inne, inte före — nu har du mer information än när du startade.
