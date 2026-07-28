---
id: TASK-62
title: >-
  Fynd: en överskuggning som aldrig matchar är omekaniserad — testet blir rött
  av fel skäl eller grönt på fel data
status: To Do
assignee: []
created_date: '2026-07-28 12:47'
updated_date: '2026-07-28 14:30'
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
- [ ] #1 En överskuggning vars mönster aldrig matchar fäller testet med ett meddelande som namnger det oanvända mönstret
- [ ] #2 Tvåsidigt bevis: vakten fäller på ett medvetet felstavat mönster OCH är tyst när mönstret matchar
- [ ] #3 Legitim oanvänd överskuggning kan undantas explicit; undantaget syns i koden
- [ ] #4 Samtliga 18 befintliga acceptance-filer passerar med vakten på
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

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
