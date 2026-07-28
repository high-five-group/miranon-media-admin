---
id: TASK-62
title: >-
  Fynd: en överskuggning som aldrig matchar är omekaniserad — testet blir rött
  av fel skäl eller grönt på fel data
status: Done
assignee: []
created_date: '2026-07-28 12:47'
updated_date: '2026-07-28 16:23'
labels:
  - ready-for-agent
dependencies: []
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (framkallat i TASK-59.8 steg 5, 2026-07-28): i tests/acceptance/persons-list.acceptance.test.ts ändrades överskuggningens mönster EF('get-persons') -> EF('get-persosn') — ett stavfel av exakt den klass hermetic.ts rad 162-168 varnar för. Normalläget lämnades intakt.

UTFALL: 3 av 4 tester föll, 1 PASSERADE. Inget av de tre felmeddelandena nämner överskuggningen. Verbatim: 'expect(locator).toHaveCount(expected) failed — Expected: 2, Received: 10' och 'expect(locator).toBeVisible() failed — element(s) not found: "2 personer laddade (fler finns)."'. De pekar utvecklaren mot testdata, paginering eller respondPage — aldrig mot mönstersträngen. Testet som passerade (tom sökning ger 'Inga träffar') var nöjt med normallägets svar.

FÖRVÄNTAT BETEENDE: en network.use()-överskuggning vars mönster aldrig matchar något anrop ska fälla med eget meddelande som namnger det oanvända mönstret — spegelbilden av hermetik-vakten. Vakten fångar i dag 'request utan handler'; 'handler utan request' är oskyddad.

MEKANISMEN FINNS OCH ÄR KÄLLVERIFIERAD, EJ GISSAD (msw i node_modules): RequestHandler.isUsed: boolean — 'Indicates whether this request handler has been used (its resolver has successfully executed)' (lib/core/HttpResponse-DL-P1EeG.d.ts rad 218). listHandlers(): ReadonlyArray<AnyHandler> (lib/browser/index.d.ts rad 80).

VARFÖR NU: TASK-58 (Done) dokumenterade mönstret och fällan i klartext — hermetic.ts rad 166 säger rakt ut 'Hermetik-vakten kan inte se detta'. Detta kort gör inte om det jobbet; det gör den dokumenterade fällan mekanisk. Jfr lesson-fragmentet lardom-utan-grind-tillampas-inkonsekvent.md.

ATT DESIGNA IN: en överskuggning kan legitimt vara oanvänd (registrerad för en gren testet inte når). Vakten behöver explicit opt-out, och den ska vara svår att sätta av slentrian.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En överskuggning vars mönster aldrig matchar fäller testet med ett meddelande som namnger det oanvända mönstret
- [x] #2 Tvåsidigt bevis: vakten fäller på ett medvetet felstavat mönster OCH är tyst när mönstret matchar
- [x] #3 Legitim oanvänd överskuggning kan undantas explicit; undantaget syns i koden
- [x] #4 Samtliga 18 befintliga acceptance-filer passerar med vakten på
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
OMDESIGNAD 2026-07-28 efter research-pass — docs/research/oanvand-mock-branschpraxis-2026-07-28.md. Sex ekosystem undersökta, fem med relevant mekanism i källkod. Orkestrerarens ursprungliga hypotes ('oanvänd + adressen trafikerades ändå') är FALSIFIERAD och ska INTE byggas: den missar stavfelet (med EF('get-persosn') trafikeras den adressen aldrig — det var hela felet) och den läser en flagga som är förorenad på modulnivå-delade handlers.

BRANSCHENS FORM: problemet delas i TVÅ mekanismer med olika trigger, inte ett skarpare oanvänd-kriterium. Mockito är enda ekosystemet med båda namngivna och åtskilda (PotentialStubbingProblem = ivrig, UnnecessaryStubbingException = trög). Pact har taxonomin tredelad.

STEG 1 — dela vakten i två. Behåll denna vakt som TRÖG oanvänd-kontroll vid teardown. Lägg till en IVRIG nära-träff-kontroll som äger stavfelsklassen. Motorn finns redan på grenen: narmasteHandler()/levenshteinAvstand() i ef-namnforslag.ts, i dag riktad omatchat anrop -> närmaste handler. Rikta den även åt andra hållet: oanvänd överskuggning -> närmaste anrop testet faktiskt gjorde. Underlaget får INTE hämtas ur isUsed på delade handlers — rätt källa är MSW:s request:match-händelse per test.

Klassning blir tredelad: (a) oanvänd + nära-träff finns = sannolikt felskriven, fäll högt med BÅDA ställena namngivna; (b) oanvänd + ingen nära-träff = sannolikt legitim, fäll milt eller inte alls; (c) anrop utan handler = hermetik-vakten, oförändrad.

STEG 2 — vidga oanvänd-kontrollens scope från TEST till FIL. Aggregera på handler.info.callFrame och rapportera bara deklarationsställen som INGEN test i filen använde. Det är Mockitos getUnusedStubbingsByLocation portad rakt av, och det enda steget som adresserar beforeEach-fallet vid roten.

MÄT FÖRE BYGGE: kör vakten med per-fil-aggregering över de 8 fällande filerna och räkna hur många av de 36 som överlever. Faller siffran mot noll är steg 2 hela lösningen och medvetetOanvand blir ren undantagsventil.

STEG 3 — behåll medvetetOanvand som VENTIL, inte primär dämpare. Formen konvergerar oberoende med Nocks .optionally(), testifys .Maybe() och Mockitos lenient(); kravet på nedskrivet skäl går utöver alla tre. Behövs ventilen på 36 ställen är vakten fel kalibrerad — steg 2 före steg 3.

STEG 4 — felmeddelandets form från Mockito: båda ställena namngivna, det faktiska anropet OCH registreringen som var nära. callFrame gör det möjligt.

AVRÅDS EXPLICIT AV RESEARCHEN: att bygga hypotesen som den var formulerad, och att göra registreringen smalare för att blidka vakten (Mockito avråder uttryckligen).

ÖPPET FYND ATT KÄNNA TILL: isUsed nollställs INTE av resetHandlers() och läcker mellan tester för handler-objekt delade på modulnivå (RequestHandler.js rad 64-73 rör inte flaggan). Vakten på feat/task-62 är redan på rätt sida, men egenskapen är odokumenterad hos MSW och kostar ett fel om vakten vidgas till normalläget.

PR #340 bär det befintliga bygget och är oarmerad. Avgör vid ombyggnad om den byggs om på plats eller ersätts.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OMBYGGT 2026-07-28 på plats på feat/task-62-overskuggnings-vakt (PR #340), med main mergad in först.

FORM: vakten delad i TVÅ mekanismer efter Mockito, som researchen föreskrev.

IVRIG (äger stavfelsklassen, fäller det enskilda testet):
  I1 — vid network.use(): mönstrets Edge Function måste finnas i supabase/functions/.
       Fäller på use()-RADEN, så stack-tracen pekar på testfilen. OkantEfNamnError.
  I2 — vid testets slut: oanvänd överskuggning vars EF ANROPADES och där ingen annan
       av testets överskuggningar tog anropet. Metod-/mönsterfel. OmatchadOverskuggningError.
  Plus InaktuellMarkeringError (märkt men använd) — oförändrat kontrakt.

TRÖG (steg 2, per deklarationsställe och FIL — Mockitos getUnusedStubbingsByLocation):
  aggregeraDodaStallen() på handler.info.callFrame; verkan i en Playwright-REPORTER
  (tests/support/fixturvarld/overskuggnings-rapport.ts) som fäller körningen via onEnd.

VALD INTEGRATIONSMEKANISM: REPORTER. Tre former prövades. En WORKER-SCOPAD FIXTUR ser bara
sin egen worker — retries: 2 i CI startar ny worker efter varje rött test, så en fil splittras
och varje worker hade sett en ofullständig fil. TEST.AFTERALL I EN DELAD BAS registreras i den
suite som laddas just då, och hermetic.ts evalueras EN gång per worker-process — hooken hade
hamnat i den första filen som importerade modulen. JSONL VIA globalSetup/globalTeardown
fungerar (repots befintliga mätmönster) men bär T105-fällan: filen överlever körningen och en
kvarlämnad fil har redan en gång presenterats som körningens utfall. Reportern ser alla tester
oavsett worker, ser planeringen via onBegin, har noll persistent state, och kan fälla via
onEnd — verifierat både i typerna (testReporter.d.ts rad 160) och i implementationen
(runner/index.js rad 1592–1596: if (outResult?.status) result.status = outResult.status).

AVVIKELSE 1 — request:match ÄR OANVÄNDBAR, INTE BARA DEPRECERAD. Uppdraget angav den som källa
för "anrop testet gjorde". Typen finns, men vid faktisk användning kraschar hela
request-hanteringen: SetupApi.emitter är en rettime-Emitter (0.11.11) vars emit(event) läser
event.type på ETT argument, medan msw 2.15.0:s handleRequest anropar emit('request:start', {…})
med två. Utan lyssnare kortsluter emit på #listeners.size === 0 och inget märks; med EN
lyssnare — vilken händelse som helst — kastar den TypeError: Cannot create property
'stopPropagation' on string 'request:start'. Mätt med isolerad probe mot handleRequest, den
kodväg @msw/playwright 0.6.7 använder: ingen lyssnare gav 200, en lyssnare gav kast, i tre
fall. ERSATT MED Playwrights egen context.on('request'). Bokfört i hermetic.ts § "ANROPEN
RÄKNAS AV PLAYWRIGHT, INTE AV MSW", tillsammans med deprecation-läget.

AVVIKELSE 2 — NÄRHET DUGER INTE SOM FÄLLNINGSGRUND. Planens ivriga kriterium (oanvänd +
nära-träff bland testets anrop) mättes före bygget och föll: närhetströskeln floor(0,4 × längd)
parar ihop Edge Functions som båda är äkta — create-registration ~ get-registrations (avstånd
5, tak 7), create-event-note ~ get-event-notes (5, tak 6), get-segments ~ get-events (3, tak
4). Just de paren ÄR fixturvärldens vanligaste batch-registreringar, alltså exakt den
population steg 2 finns för att tysta. Kriteriet byttes till EF-KATALOGEN (supabase/functions/,
24 st) — skarpt, avståndsfritt, och avgörbart redan vid registreringen. Levenshtein-motorn
behålls där den hör hemma: som "Menade du"-förslag i meddelandet, aldrig som fällningsgrund.

AVVIKELSE 3 — EN TREDJE LEGITIM KLASS, MÄTT FRAM I FÖRSTA SVITKÖRNINGEN. I2 fällde två tester
på ett idiom testfilerna själva beskriver i klartext: en beforeEach sätter ett grundsvar
(POST compute-segment, GET get-segments) och ETT test registrerar sin egen variant i
testkroppen. use() prepend:ar, så den senare vinner och beforeEach-handlern blir oanvänd trots
att Edge Function:en anropades. Den är SKUGGAD, inte felskriven. Kriteriet skärptes med ett
tredje led — ingen annan av testets överskuggningar för samma EF fick vara använd — och regeln
är pinnad i självtestet.

DE FYRA ÖVERLEVARNA:
  hem.acceptance.test.ts:216 + :234 — döda get-event-registreringar BORTTAGNA, tillsammans med
    kommentaren som beskrev en avsikt testet inte fullföljer.
  mer-segment-send.acceptance.test.ts:207 (send-email) och
    person-note-edit.acceptance.test.ts:175 (update-record) — negativa sensorer, märkta med
    medvetetOanvand() och ett skäl som säger att frånvaron av anropet ÄR testets resultat.

MÄTT UTFALL, EGNA KÖRNINGAR (darwin, --retries=0):
  npm run test:acceptance                    153 passed / 0 failed              exit 0
  självtestet (visual-desktop)                29 passed                         exit 0
  npm run test:acceptance:sjalvtest          153 fällda, 153 OmockadRequestError exit 0
  npm run test:acceptance:sjalvtest:negativ  0 fällda (bedömningen föll rätt)    exit 0
  npm run typecheck                                                             exit 0
  npx @biomejs/biome check .                                                    exit 0
  npm run build                                                                 exit 0
  npm run test:api                           405 passed                         exit 0
  npm run check:docs                         9 gröna                            exit 0

BEVIS I BÅDA RIKTNINGAR — att grinden fäller när den ska:
  TRÖG: en död get-attendance-registrering lades tillbaka i hem.acceptance.test.ts och hela
    filen kördes. Utfall: 28 passed MEN exit 1, med rapporten "tests/acceptance/
    hem.acceptance.test.ts:235:22 / GET */functions/v1/get-attendance / registrerad av 1 av
    28 körda tester i filen — använd av 0". Återställd.
  IVRIG: test.fail() togs tillfälligt bort ur självtestets två skarpa fall. Utfall: exakt 2
    failed — OkantEfNamnError (get-persosn, med "Menade du: get-person" och radnummer)
    respektive OmatchadOverskuggningError (POST get-persons mot det faktiska GET-anropet).
    Återställt.

KÄND LUCKA, ÖPPET BOKFÖRD: den tröga kontrollen står över vid --grep, --grep-invert och
--shard (de syns i FullConfig) och när inte alla planerade tester i filen rapporterade in.
Positions-urvalet fil.ts:rad, --last-failed och UI-läget filtrerar suiten UTAN att synas i
konfigurationen — där kan ett levande deklarationsställe se dött ut. Rapportens sista stycke
säger det rakt ut till läsaren.

STÄNGD 2026-07-28 av orkestreraren efter CI-verifiering. PR #340 mergad som 1bd4762f → ce5c070; samtliga tolv jobb gröna per jobb: Acceptance 7m16s · Staging (API+E2E) 5m13s · A11y 2m00s · Pure+Build 37s · Lint 38s · Docs 34s · purge 9s · CodeQL-paret · aggregatorn 4s.

OBSERVATION SOM HÖR TILL A7, EJ TILL DETTA KORT: i denna körning var Acceptance (7m16s = 436 s) LÄNGRE än Staging (5m13s = 313 s). Kritiska vägen har därmed bytt bärare sedan granskningen mättes samma dag, där Staging bar 375 s mot Acceptance 346 s. Talet 436 s ligger i övre delen av tidigare observerat spann (346-421 s) men utanför det — orsaken är INTE mätt och ska inte gissas: den nya reportern kan bära en del, workerlast en annan (jfr TASK-64). Registrerat i restlistans A7 som mätpost före A7:5, eftersom staging-flytten ensam inte längre räcker för att komma under målet om acceptance bär mer än den.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
