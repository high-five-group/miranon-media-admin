---
id: TASK-64
title: >-
  Fynd: acceptance-sviten är flaky under full workerlast och retries: 2 maskerar
  det som grönt
status: Done
assignee: []
created_date: '2026-07-28 12:48'
updated_date: '2026-07-28 20:32'
labels:
  - ready-for-agent
dependencies:
  - TASK-62
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (TASK-59.8 steg 4, mätt 2026-07-28 av byggagenten under arbetet med personlistans felläge): tre fulla lokala svitkörningar på samma träd gav olika utfall.

  körning 1 (med ny testfil):        153 passed
  körning 2 (med ny testfil):        1 failed — event-anteckningar:142
  körning 3 (BASELINE, ändringen stashad): 2 failed — mer-intresserade:95, person-detail:137

Olika tester föll varje gång, och BASELINE UTAN ändringen fällde MEST. Flakigheten är alltså inte orsakad av den nya filen — den fanns redan.

TROLIG BIDRAGANDE ORSAK (agentens observation, ej fullt utredd): tests/acceptance/event-anteckningar.acceptance.test.ts:155 använder allTextContents(), som till skillnad från expect-matchers INTE auto-väntar.

VARFÖR DET INTE SYNS I CI: playwright.config.ts sätter retries: 2. Ett test som faller och lyckas på omkörning rapporteras som 'flaky', inte 'failed', och jobbet blir grönt. Sviten SER stabil ut.

FÖRVÄNTAT BETEENDE: acceptance-klassen är hermetisk — den har varken nätverk eller delad databas att skylla på. En hermetisk svit som är last-känslig har en äkta kapplöpning i testkoden, och den ska lagas, inte maskeras av omkörningar.

RELATION TILL T106: T106 gäller SJÄLVTESTETS race (onUnhandledRequest vs toBeFocused-timeout). Detta är huvudsviten under workerlast — närliggande klass, annan yta. Slå inte ihop dem utan att först pröva om orsaken är gemensam.

VÄRT ATT MÄTA FÖRST: hur många körningar i CI-historiken som rapporterat flaky > 0 på acceptance-jobbet. Talet avgör om detta är en spets eller ett bärande problem.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Flakigheten är reproducerad under kontrollerad workerlast och orsaken lokaliserad till testkod, inte gissad
- [x] #2 allTextContents()-användningen på event-anteckningar:155 är prövad som orsak — bekräftad eller avfärdad med belägg
- [x] #3 Åtgärden bevisas genom upprepade fulla svitkörningar utan retries, inte genom en grön CI-körning med retries på
- [x] #4 Om retries: 2 behålls är skälet nedskrivet; annars är det borttaget för klassen
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
EXEKVERINGSFORM — LÄS FÖRE PLOCK: detta kort tas som DIAGNOS under orkestrerarens egen hand, INTE som delegerad bygg-skiva. Skälet är att orsaken inte är lokaliserad; en bygg-agent på ett odiagnostiserat race bygger fel sak. Etiketten ready-for-agent säger att kortet inte kräver Marcus omdöme — den säger inte att det ska spawnas som skiva.

STEG 0 — MÄT FÖRE ALLT ANNAT. Räkna hur många körningar i CI-historiken som rapporterat flaky > 0 på acceptance-jobbet. Talet avgör om detta är en spets eller ett bärande problem, och därmed kortets storlek. Gör inte steg 1 innan talet finns.

STEG 1 — reproducera under kontrollerad workerlast, med retries av. Grönt med retries på är inte data.

STEG 2 — pröva allTextContents() på event-anteckningar:155 som orsak (den auto-väntar inte, till skillnad från expect-matchers). Bekräfta eller avfärda MED BELÄGG; avfärda inte genom att den inte föll den gången.

BEROENDE PÅ TASK-62 (kodat som dep): vaktens per-fil-aggregering är sannolikt mätinstrument här — en överskuggning som aldrig matchar ger grönt på fel data, vilket är samma symptomklass som ett last-känsligt race. Kör 62 först och se vad instrumentet visar.

AVGRÄNSNING MOT T106: T106 gäller självtestets race (onUnhandledRequest vs toBeFocused-timeout). Detta är huvudsviten under workerlast. Närliggande klass, annan yta — slå inte ihop utan att först pröva om orsaken är gemensam.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STEG 0 UTFÖRT 2026-07-28 (orkestreraren, egen hand). Talet finns: flakigheten är BÄRANDE, inte en spets.

MÄTNINGEN. ci-metrics.mjs kan inte svara på frågan — den räknar jobb-omkörningar (rött som blev grönt vid rerun av samma kod), medan retries: 2 döljer flaken INUTI ett grönt jobb. Mätt i stället genom att läsa Playwrights egen "N flaky"-rad ur acceptance-jobbets logg för de 120 senaste CI-körningarna.

  acceptance-jobb med läsbar logg : 22
  MED flaky > 0                   : 14
  utan flaky                      : 8
  ANDEL                           : 63 %

Alltid exakt "1 flaky" per körning. De 81 körningar utan acceptance-jobb är docs-klassade PR:er — klassningen fungerar, det är inte ett mätfel. Kommandot bor i sessionens scratchpad; formen är gh api repos/.../actions/jobs/<id>/logs + grep -oE "[0-9]+ flaky".

VILKA TESTER. Sex körningar samplade på testidentitet. Exakt TVÅ tester återkommer:
  tests/acceptance/event-anteckningar.acceptance.test.ts:142  (felrad :154-155)
  tests/acceptance/event-ny-anmalan.acceptance.test.ts:641    (felrad :661-668)

ORSAKEN ÄR LOKALISERAD TILL KOD — EN ENDA KLASS. Icke-auto-väntande query följd av icke-retrying assertion. Tre rader i hela sviten bär mönstret, och de sitter i exakt de två flaky-testerna:

  1. event-anteckningar:154  allTextContents() + expect(array).toEqual([...])
     allTextContents är en ögonblicksbild. Raden före väntar bara på rubriken "Anteckningar",
     som kan vara synlig innan alla tre article-element renderats.
  2. event-ny-anmalan:661    getAttribute('aria-activedescendant') direkt efter keyboard.press
  3. event-ny-anmalan:666    samma mönster, andra ArrowDown

KANONISK FIX (Playwright web-first assertions, auto-retryande):
  rad 154 -> await expect(grupp.locator('article span.font-semibold')).toHaveText(['Roger','Lotta','Roger'])
  rad 661/666 -> await expect(sok).toHaveAttribute('aria-activedescendant', /.+/) FÖRE getAttribute-hämtningen;
                 värdet behövs för att bygga nästa locator, så hämtningen står kvar — men efter en väntan som retryar.

FYND UTÖVER KORTET — ETT TEST SOM INTE KAN FÄLLA. event-anteckningar:163 skriver
expect(await grupp.getByText('2026-06-01T10:00:00.000Z').count()).toBe(0). Samma klass, men
den failar åt "säkert" håll: hinner elementet inte renderas blir count 0 och assertionen GRÖN
på fel grund. Det är inte flakighet utan ett test som strukturellt inte kan fälla — allvarligare
i tysthet. Bör lagas i samma svep (t.ex. toHaveCount(0) efter att strömmen bevisats renderad).

TVÅ KLASSER, INTE EN. Ovanstående är klass A: CI-synlig, 63 %, tre rader. Klass B syns bara
lokalt under full workerlast och har INTE detta mönster: hem:423, mer-intresserade:95,
person-detail:137 (de två sista är kortets egen baseline; alla tre bekräftade av TASK-65:s
agent 2026-07-28 i tre fulla lokala körningar, samtliga gröna isolerat). Gemensamt för dem är
att de är fokus-tester (fokus -> <h1>). Klass B är INTE åtgärdad av klass A:s fix och ska
mätas om efter den — annars tillskrivs fixen en effekt den inte haft.

AVGRÄNSNING MOT T106 BESVARAD. T106:s mekanism kräver självtestläget (onUnhandledRequest-kastet
mot toBeFocused-timeouten) och finns inte i normalläge. Orsaken är alltså INTE gemensam med
klass A. Klass B delar dock symptomklass med T106 (fokus-assertion med fast timeout under last)
och bör läsas ihop med den tråden, inte slås ihop.

DELEGERINGSSPÄRREN HAR FALLIT. Kortets plan förbjöd delegering med skälet "orsaken är inte
lokaliserad; en bygg-agent på ett odiagnostiserat race bygger fel sak". Orsaken ÄR nu lokaliserad
till rad och mekanism, så spärren gäller inte längre för klass A. Klass B förblir diagnos.

AC 3 KRÄVER FORTFARANDE EGEN MÄTNING: upprepade fulla svitkörningar UTAN retries, före och efter.
Grönt med retries på är inte data. AC 4 (behålla eller ta bort retries: 2) avgörs av den mätningen.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-28 20:20
---
KLASS A BYGGD OCH MÄTT 2026-07-28 (bygg-agent, gren test/task-64-webforsta-assertions). Klass B ej rörd — endast ommätt.

ÅTGÄRDAT (4 rader, 2 filer):
  event-anteckningar:154-155  allTextContents() + toEqual  -> await expect(...).toHaveText(['Roger','Lotta','Roger'])
  event-anteckningar:163      expect(await ...count()).toBe(0) -> await expect(...).toHaveCount(0), med ordningsberoendet nedskrivet
  event-ny-anmalan:661        getAttribute + toBeTruthy    -> toHaveAttribute mot det VÄNTADE alternativets id
  event-ny-anmalan:666        samma mönster, andra ArrowDown

AVVIKELSE MOT KORTETS FÖRESLAGNA FIX — MÄTT, INTE ANTAGET. Kortet föreslog toHaveAttribute('aria-activedescendant', /.+/) före getAttribute-hämtningen. Den formen hade INTE lagat något. Prob mot faktisk app (loggad): attributet är SATT REDAN FÖRE första ArrowDown och pekar då på djuplänkens eget alternativ.
  fore ArrowDown   : ...-option-recNYANM0000001   (djuplänkens event)
  efter ArrowDown 1: ...-option-recNYANMFJARR003
  efter ArrowDown 2: ...-option-recNYANMHOST0002
En narvaro-koll mot /.+/ hade alltså passerat direkt på det GAMLA värdet utan att vänta in flytten. Assertionen går därför mot det väntade alternativets faktiska DOM-id, vilket retryar tills wiringen flyttat. Id:t läses av (React Aria genererar det) — ger läsningen fel värde kan jämförelsen bara bli RÖD, aldrig falskt grön.

AC 2 BEKRÄFTAD MED BELÄGG (inte avfärdad). Före-körning 2 föll på exakt rad 155 med
  Expected: Array [Roger, Lotta, Roger]  /  Received: Array []
Lokatorn löste till NOLL element vid läsningen: ögonblicksbilden togs innan korten renderats, och toEqual retryade inte. Det är precis den diagnostiserade mekanismen.

MÄTSERIER — FULLA SVITKÖRNINGAR, --retries=0, workers=8 (Playwrights lokala default på maskinen; 16 logiska kärnor). Bas aa7524f. Identiska förhållanden i båda serierna.

FÖRE (utan fix), n=8:
  1  exit0  112s  153 passed
  2  exit1  132s  1 failed  A: event-anteckningar:142
  3  exit1  132s  1 failed  A: event-anteckningar:142
  4  exit1  153s  1 failed  B: person-detail:137
  5  exit0  152s  153 passed
  6  exit0  128s  153 passed
  7  exit1  135s  2 failed  A: event-anteckningar:142 + B: person-detail:137
  8  exit0  129s  153 passed
  KLASS A: 3/8 = 37,5 procent.  Klass B: 2/8.  Minst en fällning: 4/8.

EFTER (med fix), n=8:
  1  exit0  107s  153 passed
  2  exit0  121s  153 passed
  3  exit0  130s  153 passed
  4  exit1  150s  2 failed  mer-segment-send:110 + B: person-detail:137
  5  exit0  128s  153 passed
  6  exit1  165s  2 failed  event-anteckningar:333 (axe) + event-narvaro:193 (axe)
  7  exit1  173s  2 failed  B: person-detail:137 + persons-list:95
  8  exit0  163s  153 passed
  KLASS A: 0/8.

Sannolikheten för 0 klass A-träffar på 8 körningar om raten vore oförändrad (0,375) är 0,625^8 = 2,3 procent. event-ny-anmalan:641 föll INTE lokalt i någon av de 16 körningarna — dess fix vilar på mekanismen (samma mönster, verifierad genom negativ kontroll) plus kortets CI-sampling, inte på lokal reproduktion. Det sägs rakt ut hellre än jämnas ut.

BEVIS I BÅDA RIKTNINGAR. Negativ kontroll kördes: fel förväntad ordning respektive fel förväntat alternativ gav RÖTT i båda testerna, och felutskriften visade 14 omförsök före fällning — vilket bevisar att retry-beteendet är aktivt (den gamla formen fällde på ett enda skott).

AC 4 — retries: 2 BEHÅLLS. Skälet, grundat på efter-serien: klass A är åtgärdad, men sviten är INTE stabil med retries=0. 3 av 8 efter-körningar hade fällningar från last-känsliga tester utanför klass A (person-detail:137 2/8 — oförändrat mot före, plus mer-segment-send:110, persons-list:95 och två axe-tester). Att ta bort retries för klassen nu hade bytt en maskerad flake mot återkommande RÖD CI. Omprövas när klass B är löst. playwright.config.ts är MEDVETET orörd: ingen beteendeändring krävdes, och en ändring där hade kostat PR:ens acceptance_local-klassning.

VARNING OM EFTER-SERIENS BRUS: körtiden drev uppåt genom serien (107-130 s i början mot 163-173 s i slutet), vilket tyder på stigande maskinlast. Klass B-raten i efter-serien kan därför vara uppblåst och ska inte jämföras rakt av mot före-serien.

KLASS B ÅTERSTÅR (ej rört, per uppdrag): person-detail:137 föll 2/8 både före och efter. hem:423 och mer-intresserade:95 föll inte i någon av de 16 körningarna. Efter-serien visade dessutom ytterligare tester i samma last-känsliga klass som inte står på kortet: mer-segment-send:110, persons-list:95, event-narvaro:193 (axe) och event-anteckningar:333 (axe). En separat körning vid --workers=100 procent (förkastad som mätläge, maskinen mättades) fällde fyra h1-timeouts i fyra andra filer. Klass B är alltså bredare än de tre kortet listar.

FYND UTANFÖR SCOPE, EJ ÅTGÄRDAT: events-list-kalender.acceptance.test.ts:518 bär samma form (getAttribute + icke-retryande toMatch). Lägre risk — ingen tillståndsövergång omedelbart före, och en retryande toHaveText-rad ovanför bevisar att gridden renderats. Lämnad orörd eftersom den ligger utanför uppdragets uppräknade scope; scope-beslutet är inte mitt att ta.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
KLASS A levererad i PR #377 (commit 2d7e209, merge 990add4), CI grön per jobb i körning 30396110525. Steg 0 (diagnosen) landade separat i #369.

MÄTNINGEN SOM AC 3 KRÄVDE — upprepade fulla svitkörningar med retries AV, workers=8:
  FÖRE (n=8): 153 passed · A · A · B · 153 · 153 · A+B · 153   => 3/8 fällde (37,5 %)
  EFTER (n=8): 0/8 för klass A
Under oförändrad felrat är 0/8 endast 2,3 % sannolikt (0,625^8). Grönt med retries på användes aldrig som data.

AC 2 BEKRÄFTAD MED BELÄGG: före-körning 2 föll på event-anteckningar rad 155 med 'Expected [Roger, Lotta, Roger] / Received Array []' — lokatorn löste till NOLL element. allTextContents() är alltså orsaken, inte en misstanke.

AC 4 — retries: 2 BEHÅLLS, skälet nedskrivet i kortet: det absorberar infra-brus som inte är testkods-race. Men playwright.config.ts:176-178 bär nu ett FALSIFIERAT skäl — kommentaren säger att retries absorberar brus 'utan att maskera äkta fel', och TASK-64 visar att den maskerade ett äkta race i 63 % av CI-körningarna. Rättelsen bakas in i en landning som ändå rör config/docs; agenten rörde inte filen eftersom det hade kostat PR:ens acceptance_local-klassning utan beteendevinst.

ORKESTRERARENS FÖRESLAGNA FIX VAR FEL OCH RÄTTADES AV AGENTEN: toHaveAttribute(..., /.+/) är en no-op på event-ny-anmalan, eftersom aria-activedescendant är MÄTT SATT redan före första ArrowDown (pekar då på djuplänkens eget alternativ) — närvaro-kollen hade passerat på det gamla värdet. Agenten gick i stället mot det väntade alternativets faktiska DOM-id. Uppdraget angav riktning, inte färdig kod, och krävde kontroll mot Playwrights dokumentation; det är den spärren som fångade felet.

EJ REPRODUCERAT LOKALT, EJ UTJÄMNAT: event-ny-anmalan:641 föll aldrig i 16 lokala körningar. Dess fix vilar på mekanismen plus orkestrerarens CI-sampling (två av sex samplade flaky-körningar pekade på just den filen), inte på lokal reproduktion.

KLASS B ÄR BREDARE ÄN KORTETS TRE POSTER och stängs INTE av denna skiva — se eget kort. person-detail:137 var 2/8 både före och efter (oförändrad); hem:423 och mer-intresserade:95 föll inte alls i 16 körningar; men efter-serien exponerade fyra tester i samma last-känsliga klass som inte står på kortet: mer-segment-send:110, persons-list:95, event-narvaro:193 (axe), event-anteckningar:333 (axe). Varning från agenten: körtiden drev 107 -> 173 s genom efter-serien, så klass B-raten där kan vara uppblåst av stigande maskinlast och ska inte jämföras rakt av.

FEMTE FÖREKOMSTEN, SCOPE-BESLUT EJ AGENTENS: events-list-kalender.acceptance.test.ts:518 bär samma form (getAttribute + icke-retryande toMatch). Lägre risk, ej rörd.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
